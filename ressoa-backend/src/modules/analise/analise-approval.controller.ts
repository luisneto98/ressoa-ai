import {
  Controller,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { AnaliseService } from './services/analise.service';
import { AulasService } from '../aulas/aulas.service';
import { EditarRelatorioDto } from './dto/editar-relatorio.dto';
import { RejeitarRelatorioDto } from './dto/rejeitar-relatorio.dto';
import { EditarExerciciosDto } from './dto/editar-exercicios.dto';
import { StatusAnalise, StatusProcessamento } from '@prisma/client';

/**
 * Controller responsável pela edição e aprovação de análises pedagógicas.
 *
 * **Story 6.2:** Workflow de edição, aprovação e rejeição de relatórios
 * - PATCH /analises/:id/relatorio: Salvar edições do relatório (auto-save)
 * - POST /analises/:id/aprovar: Aprovar relatório (gera feedback implícito via diff)
 * - POST /analises/:id/rejeitar: Rejeitar relatório (gera feedback explícito via motivo)
 *
 * **Security:**
 * - Multi-tenancy enforcement (escola_id validation)
 * - Professor ownership validation (apenas dono da aula pode editar/aprovar)
 * - Status validation (apenas AGUARDANDO_REVISAO pode ser editado/aprovado)
 *
 * **Feedback Loop (MOAT Técnico):**
 * - Edições → Diff → A/B testing de prompts
 * - Rejeições → Análise de motivos → Identificação de padrões de falha
 * - Target: >80% approval rate, <5min review time
 */
@Controller('analises')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnaliseApprovalController {
  constructor(
    private readonly analiseService: AnaliseService,
    private readonly aulasService: AulasService,
  ) {}

  /**
   * Edita relatório pedagógico (auto-save).
   *
   * **Story 6.2:** Endpoint para salvar edições do professor no relatório.
   *
   * **Flow:**
   * 1. Valida que análise existe e pertence à escola (multi-tenancy)
   * 2. Valida que professor autenticado é dono da aula
   * 3. Valida que status = AGUARDANDO_REVISAO (não pode editar aprovado/rejeitado)
   * 4. Salva edição em `relatorio_editado` (mantém `relatorio_texto` intacto)
   *
   * **Security:**
   * - Multi-tenancy: Via AnaliseService.findOne() que valida escola_id
   * - Ownership: Compara professor_id da aula com userId do token JWT
   * - Status guard: Apenas AGUARDANDO_REVISAO pode ser editado
   *
   * **UX:**
   * - Auto-save debounced (1s delay, 3s max wait) no frontend
   * - Indicador visual: "Salvando..." → "Salvo às 14:35:22"
   *
   * @param analiseId ID da análise
   * @param dto { relatorio_editado: string }
   * @param user Professor autenticado
   * @returns { message: string, analiseId: string }
   * @throws NotFoundException se análise não existir
   * @throws ForbiddenException se professor não for dono da aula
   * @throws BadRequestException se análise já foi aprovada/rejeitada
   */
  @Patch(':analiseId/relatorio')
  @Roles('PROFESSOR')
  async editarRelatorio(
    @Param('analiseId') analiseId: string,
    @Body() dto: EditarRelatorioDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // 1. Buscar análise e verificar permissões (multi-tenancy via AnaliseService)
    const analise = await this.analiseService.findOne(analiseId);
    if (!analise) {
      throw new NotFoundException('Análise não encontrada');
    }

    // 2. Verificar: aula pertence ao professor autenticado (ownership)
    if (analise.aula.professor_id !== user.userId) {
      throw new ForbiddenException('Você não tem acesso a esta análise');
    }

    // 3. Verificar: análise está em status AGUARDANDO_REVISAO
    if (analise.status !== StatusAnalise.AGUARDANDO_REVISAO) {
      throw new BadRequestException('Relatório já foi aprovado ou rejeitado');
    }

    // 4. Atualizar relatorio_editado (mantém original intacto)
    await this.analiseService.update(analiseId, {
      relatorio_editado: dto.relatorio_editado,
    });

    return {
      message: 'Relatório atualizado com sucesso',
      analiseId,
    };
  }

  /**
   * Edita exercícios contextuais (auto-save).
   *
   * **Story 6.3:** Endpoint para salvar edições do professor nos exercícios.
   *
   * **Flow:**
   * 1. Valida que análise existe e pertence à escola (multi-tenancy)
   * 2. Valida que professor autenticado é dono da aula
   * 3. Valida que status = AGUARDANDO_REVISAO (não pode editar aprovado/rejeitado)
   * 4. Valida estrutura dos exercícios (5 validações)
   * 5. Salva edição em `exercicios_editado` (mantém `exercicios_json` intacto)
   *
   * **Validações:**
   * - Estrutura básica: questoes array
   * - Campos obrigatórios: enunciado, alternativas, habilidade_bncc
   * - Exatamente 4 alternativas por questão
   * - Exatamente 1 alternativa correta por questão
   * - Letras A, B, C, D nas alternativas
   *
   * **Security:**
   * - Multi-tenancy: Via AnaliseService.findOne() que valida escola_id
   * - Ownership: Compara professor_id da aula com userId do token JWT
   * - Status guard: Apenas AGUARDANDO_REVISAO pode ser editado
   *
   * **UX:**
   * - Auto-save no frontend ao clicar "Salvar Exercícios"
   * - Indicador visual: "✓ Exercícios editados pelo professor"
   *
   * @param analiseId ID da análise
   * @param dto { exercicios: { questoes: [...] } }
   * @param user Professor autenticado
   * @returns { message: string, analiseId: string }
   * @throws NotFoundException se análise não existir
   * @throws ForbiddenException se professor não for dono da aula
   * @throws BadRequestException se análise já foi aprovada/rejeitada ou estrutura inválida
   */
  @Patch(':analiseId/exercicios')
  @Roles('PROFESSOR')
  async editarExercicios(
    @Param('analiseId') analiseId: string,
    @Body() dto: EditarExerciciosDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // 1. Buscar análise e verificar permissões (multi-tenancy via AnaliseService)
    const analise = await this.analiseService.findOne(analiseId);
    if (!analise) {
      throw new NotFoundException('Análise não encontrada');
    }

    // 2. Verificar: aula pertence ao professor autenticado (ownership)
    if (analise.aula.professor_id !== user.userId) {
      throw new ForbiddenException('Você não tem acesso a esta análise');
    }

    // 3. Verificar: análise está em status AGUARDANDO_REVISAO
    if (analise.status !== StatusAnalise.AGUARDANDO_REVISAO) {
      throw new BadRequestException('Exercícios já foram aprovados ou rejeitados');
    }

    // 4. Validar estrutura dos exercícios
    this.validateExercicios(dto.exercicios);

    // 5. Atualizar exercicios_editado (mantém original intacto)
    await this.analiseService.update(analiseId, {
      exercicios_editado: dto.exercicios as unknown as Prisma.InputJsonValue,
    });

    return {
      message: 'Exercícios atualizados com sucesso',
      analiseId,
    };
  }

  /**
   * Valida estrutura dos exercícios editados.
   *
   * **Regras de Validação:**
   * 1. Estrutura básica: { questoes: [...] }
   * 2. Campos obrigatórios: enunciado, alternativas, habilidade_bncc, nivel_bloom, explicacao
   * 3. Exatamente 4 alternativas por questão
   * 4. Exatamente 1 alternativa correta por questão
   * 5. Letras A, B, C, D (sem duplicatas, sem faltas)
   *
   * @param exercicios Exercícios editados
   * @throws BadRequestException se estrutura inválida
   */
  private validateExercicios(exercicios: any) {
    // Validação 1: Estrutura básica
    if (!exercicios || !exercicios.questoes || !Array.isArray(exercicios.questoes)) {
      throw new BadRequestException('Estrutura de exercícios inválida');
    }

    // Validação por questão
    for (const questao of exercicios.questoes) {
      // Validação 2: Campos obrigatórios (enunciado, alternativas, habilidade_bncc, nivel_bloom, explicacao)
      if (
        !questao.enunciado ||
        !questao.alternativas ||
        !questao.habilidade_bncc ||
        !questao.nivel_bloom ||
        !questao.explicacao
      ) {
        throw new BadRequestException('Questão com campos obrigatórios faltando');
      }

      // Validação de tamanho máximo dos campos
      if (questao.enunciado.length > 500) {
        throw new BadRequestException('Enunciado não pode exceder 500 caracteres');
      }
      if (questao.explicacao.length > 1000) {
        throw new BadRequestException('Explicação não pode exceder 1000 caracteres');
      }

      // Validação 3: Exatamente 4 alternativas
      if (!Array.isArray(questao.alternativas) || questao.alternativas.length !== 4) {
        throw new BadRequestException('Cada questão deve ter exatamente 4 alternativas');
      }

      // Validação de tamanho máximo das alternativas
      for (const alt of questao.alternativas) {
        if (!alt.texto || alt.texto.length > 200) {
          throw new BadRequestException('Texto da alternativa não pode exceder 200 caracteres');
        }
      }

      // Validação 4: Exatamente 1 alternativa correta
      const corretas = questao.alternativas.filter((alt: any) => alt.correta === true);
      if (corretas.length !== 1) {
        throw new BadRequestException('Cada questão deve ter exatamente 1 alternativa correta');
      }

      // Validação 5: Letras A, B, C, D (sem duplicatas)
      const letras = questao.alternativas.map((alt: any) => alt.letra).sort();
      const letrasUnicas = new Set(letras);
      if (letras.join('') !== 'ABCD' || letrasUnicas.size !== 4) {
        throw new BadRequestException('Alternativas devem ter letras A, B, C, D sem duplicatas');
      }
    }
  }

  /**
   * Aprova relatório pedagógico.
   *
   * **Story 6.2:** Endpoint para aprovar relatório após revisão.
   *
   * **Flow:**
   * 1. Valida permissões (multi-tenancy + ownership)
   * 2. Valida status = AGUARDANDO_REVISAO
   * 3. Calcula tempo_revisao (Date.now() - created_at) em segundos
   * 4. Atualiza Analise: status = APROVADO, aprovado_em = now
   * 5. Atualiza Aula: status_processamento = APROVADA
   * 6. Se houver edição (relatorio_editado), enfileira job de diff (feedback implícito)
   *
   * **Feedback Implícito (MOAT Técnico):**
   * - Diff entre relatorio_texto e relatorio_editado
   * - Usado para A/B testing de prompts
   * - Métrica: Edições pequenas (<10% do texto) = prompt de qualidade
   *
   * **Métricas:**
   * - tempo_revisao < 300s (5min) = indicador de qualidade do prompt
   * - taxa_aprovacao > 80% = prompt gera relatórios úteis
   *
   * @param analiseId ID da análise
   * @param user Professor autenticado
   * @returns { message: string, tempo_revisao: number, tem_edicao: boolean }
   * @throws NotFoundException se análise não existir
   * @throws ForbiddenException se professor não for dono da aula
   * @throws BadRequestException se análise já foi processada
   */
  @Post(':analiseId/aprovar')
  @Roles('PROFESSOR')
  async aprovarRelatorio(
    @Param('analiseId') analiseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // 1. Buscar análise e verificar permissões
    const analise = await this.analiseService.findOne(analiseId);
    if (!analise) {
      throw new NotFoundException('Análise não encontrada');
    }

    if (analise.aula.professor_id !== user.userId) {
      throw new ForbiddenException('Você não tem acesso a esta análise');
    }

    // 2. Verificar status
    if (analise.status !== StatusAnalise.AGUARDANDO_REVISAO) {
      throw new BadRequestException('Análise já foi processada');
    }

    // 3. Calcular tempo de revisão (segundos)
    const tempo_revisao = Math.floor(
      (Date.now() - analise.created_at.getTime()) / 1000,
    );

    // 4. Aprovar análise
    await this.analiseService.update(analiseId, {
      status: StatusAnalise.APROVADO,
      aprovado_em: new Date(),
      tempo_revisao,
    });

    // 5. Atualizar status da Aula para APROVADA
    await this.aulasService.updateStatus(
      analise.aula_id,
      StatusProcessamento.APROVADA,
    );

    // 6. Enfileirar job para calcular diff (feedback implícito) - APENAS se houver edição
    if (analise.relatorio_editado) {
      await this.analiseService.enqueueReportDiff({
        analise_id: analiseId,
        original: analise.relatorio_texto,
        editado: analise.relatorio_editado,
      });
    }

    return {
      message: 'Relatório aprovado com sucesso',
      tempo_revisao,
      tem_edicao: !!analise.relatorio_editado,
    };
  }

  /**
   * Rejeita relatório pedagógico com motivo.
   *
   * **Story 6.2:** Endpoint para rejeitar relatório quando há problemas graves.
   *
   * **Flow:**
   * 1. Valida permissões (multi-tenancy + ownership)
   * 2. Valida status = AGUARDANDO_REVISAO
   * 3. Atualiza Analise: status = REJEITADO, rejeitado_em = now, motivo_rejeicao
   * 4. Atualiza Aula: status_processamento = REJEITADA
   * 5. Enfileira job de análise de motivo (feedback explícito)
   *
   * **Feedback Explícito (MOAT Técnico):**
   * - Motivo de rejeição é analisado por LLM (Story 6.2+)
   * - Agrupa motivos similares para identificar padrões de falha
   * - Prioriza melhorias nos prompts com base em frequência de rejeição
   *
   * **Métricas:**
   * - taxa_rejeicao < 20% (inverso de aprovação >80%)
   * - Motivos agrupados: "Muito genérico" (40%), "Erros BNCC" (30%), etc.
   *
   * @param analiseId ID da análise
   * @param dto { motivo: string } (min 10 chars, max 500 chars)
   * @param user Professor autenticado
   * @returns { message: string, motivo: string }
   * @throws NotFoundException se análise não existir
   * @throws ForbiddenException se professor não for dono da aula
   * @throws BadRequestException se análise já foi processada
   */
  @Post(':analiseId/rejeitar')
  @Roles('PROFESSOR')
  async rejeitarRelatorio(
    @Param('analiseId') analiseId: string,
    @Body() dto: RejeitarRelatorioDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // 1. Buscar análise e verificar permissões
    const analise = await this.analiseService.findOne(analiseId);
    if (!analise) {
      throw new NotFoundException('Análise não encontrada');
    }

    if (analise.aula.professor_id !== user.userId) {
      throw new ForbiddenException('Você não tem acesso a esta análise');
    }

    // 2. Verificar status
    if (analise.status !== StatusAnalise.AGUARDANDO_REVISAO) {
      throw new BadRequestException('Análise já foi processada');
    }

    // 3. Rejeitar com motivo (feedback explícito)
    await this.analiseService.update(analiseId, {
      status: StatusAnalise.REJEITADO,
      rejeitado_em: new Date(),
      motivo_rejeicao: dto.motivo,
    });

    // 4. Atualizar aula para REJEITADA
    await this.aulasService.updateStatus(
      analise.aula_id,
      StatusProcessamento.REJEITADA,
    );

    // 5. Enfileirar análise de rejeição (feedback explícito)
    await this.analiseService.enqueueRejectionAnalysis({
      analise_id: analiseId,
      motivo: dto.motivo,
      aula_id: analise.aula_id,
    });

    return {
      message: 'Relatório rejeitado',
      motivo: dto.motivo,
    };
  }
}
