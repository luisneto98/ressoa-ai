import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { AnaliseService } from './services/analise.service';
import { AulasService } from '../aulas/aulas.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Controller responsável pela visualização e iniciação de análises pedagógicas.
 *
 * **Story 6.1:** GET /api/v1/aulas/:aulaId/analise
 * - Permite professor visualizar análise completa de sua aula
 * - Retorna cobertura BNCC, análise qualitativa, relatório, exercícios e alertas
 * - Valida permissões: apenas professor dono da aula pode acessar
 *
 * **Added:** POST /api/v1/analise/:aulaId
 * - Dispara análise pedagógica de uma aula transcrita
 * - Valida permissões: apenas professor dono da aula pode disparar
 */
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnaliseController {
  constructor(
    private readonly analiseService: AnaliseService,
    private readonly aulasService: AulasService,
    private readonly prisma: PrismaService,
    @InjectQueue('analysis-pipeline') private readonly analysisQueue: Queue,
  ) {}

  /**
   * Dispara análise pedagógica de uma aula (ASYNC via Bull Queue).
   *
   * **Security:**
   * - Valida que aula existe e pertence à escola do usuário (multi-tenancy)
   * - Valida que professor autenticado é dono da aula
   * - Valida que aula está com status TRANSCRITA
   * - Retorna 403 se professor tentar analisar aula de outro professor
   *
   * **Flow:**
   * 1. Valida permissões e pré-condições
   * 2. Atualiza status da aula para EM_ANALISE
   * 3. Enfileira job no Bull (analysis-pipeline queue)
   * 4. Retorna 202 Accepted imediatamente
   * 5. Worker processa análise em background (45-60s)
   * 6. Frontend faz polling para verificar conclusão
   *
   * @param aulaId ID da aula
   * @param user Usuário autenticado (do JWT)
   * @returns Job enfileirado
   * @throws NotFoundException se aula não existir
   * @throws ForbiddenException se professor não for dono da aula
   * @throws BadRequestException se aula não estiver transcrita
   */
  @Post('analise/:aulaId')
  @Roles('PROFESSOR')
  @HttpCode(HttpStatus.ACCEPTED)
  async iniciarAnalise(
    @Param('aulaId') aulaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // 1. Buscar aula e verificar permissões (multi-tenancy + ownership)
    const aula = await this.aulasService.findOne(aulaId, user);
    if (!aula) {
      throw new NotFoundException('Aula não encontrada');
    }

    // 2. Verificar: aula pertence ao professor autenticado
    if (aula.professor_id !== user.userId) {
      throw new ForbiddenException('Você não tem acesso a esta aula');
    }

    // 3. Verificar: aula está transcrita
    if (aula.status_processamento !== 'TRANSCRITA') {
      throw new BadRequestException(
        `Aula deve estar transcrita para ser analisada. Status atual: ${aula.status_processamento}`,
      );
    }

    // 4. Verificar: não existe análise já criada
    const analiseExistente = await this.analiseService.findByAulaId(aulaId);
    if (analiseExistente) {
      throw new BadRequestException('Análise já existe para esta aula');
    }

    // 5. Atualizar status para ANALISANDO
    await this.prisma.aula.update({
      where: { id: aulaId },
      data: { status_processamento: 'ANALISANDO' },
    });

    // 6. Enfileirar job de análise (async)
    const job = await this.analysisQueue.add(
      'analyze-aula',
      {
        aulaId,
        escolaId: user.escolaId,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        timeout: 120000, // 2 minutes
      },
    );

    // 7. Retornar 202 Accepted imediatamente
    return {
      message: 'Análise pedagógica iniciada. Aguarde 45-60 segundos.',
      aula_id: aulaId,
      job_id: job.id,
      status: 'ANALISANDO',
      estimated_time_seconds: 60,
    };
  }

  /**
   * Busca análise pedagógica completa de uma aula.
   *
   * **Security:**
   * - Valida que aula existe e pertence à escola do usuário (multi-tenancy)
   * - Valida que professor autenticado é dono da aula
   * - Retorna 403 se professor tentar acessar aula de outro professor
   *
   * **Response Structure:**
   * - aula: { id, titulo, data_aula, turma, status }
   * - cobertura_bncc: { habilidades: [{ codigo, nivel_cobertura, evidencias }] }
   * - analise_qualitativa: { bloom_levels, metodologias, adequacao_cognitiva, sinais_engajamento }
   * - relatorio: string (markdown)
   * - exercicios: [{ enunciado, gabarito, nivel_bloom }]
   * - alertas: { alertas: [], sugestoes_proxima_aula: [] }
   * - metadata: { tempo_processamento_ms, custo_total_usd, prompt_versoes, created_at }
   *
   * @param aulaId ID da aula
   * @param user Usuário autenticado (do JWT)
   * @returns Análise estruturada para visualização
   * @throws NotFoundException se aula ou análise não existir
   * @throws ForbiddenException se professor não for dono da aula
   */
  @Get('aulas/:aulaId/analise')
  @Roles('PROFESSOR')
  async getAnaliseByAula(
    @Param('aulaId') aulaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // 1. Buscar aula e verificar permissões (multi-tenancy + ownership)
    const aula = await this.aulasService.findOne(aulaId, user);
    if (!aula) {
      throw new NotFoundException('Aula não encontrada');
    }

    // 2. Verificar: aula pertence ao professor autenticado
    if (aula.professor_id !== user.userId) {
      throw new ForbiddenException('Você não tem acesso a esta aula');
    }

    // 3. Buscar análise
    const analise = await this.analiseService.findByAulaId(aulaId);
    if (!analise) {
      throw new NotFoundException('Análise não encontrada para esta aula');
    }

    // 4. Transform and structure analysis data for frontend
    const coberturaData = analise.cobertura_json as any;
    const exerciciosData = (analise.exercicios_editado || analise.exercicios_json) as any;
    const alertasData = analise.alertas_json as any;

    return {
      id: analise.id,
      aula: {
        id: aula.id,
        titulo: `Aula - ${aula.turma.nome}`,
        data_aula: aula.data,
        turma: {
          nome: aula.turma.nome,
          serie: aula.turma.serie,
          disciplina: aula.turma.disciplina,
        },
        status: aula.status_processamento,
        planejamento: aula.planejamento,
      },
      // Transform cobertura: extract habilidades from analise_cobertura + habilidades_extras
      cobertura_bncc: {
        habilidades: [
          ...(coberturaData?.analise_cobertura || []),
          ...(coberturaData?.habilidades_extras || []).map((extra: any) => ({
            codigo: extra.habilidade_codigo,
            descricao: extra.observacao,
            nivel_cobertura: 'MENTIONED',
            evidencias: [],
          })),
        ],
      },
      // Keep qualitativa as-is (already correct structure)
      analise_qualitativa: analise.analise_qualitativa_json,
      // ✅ Story 6.2: Priorizar versão editada sobre original
      relatorio: analise.relatorio_editado || analise.relatorio_texto,
      relatorio_original: analise.relatorio_texto,
      tem_edicao_relatorio: !!analise.relatorio_editado,
      // ✅ Story 6.3: Transform exercises structure (extract questoes array)
      exercicios: {
        questoes: exerciciosData?.exercicios || exerciciosData?.questoes || [],
      },
      exercicios_original: analise.exercicios_json,
      tem_edicao_exercicios: !!analise.exercicios_editado,
      // Transform alertas: extract nested structure
      alertas: alertasData || {},
      // ✅ Story 6.2: Adicionar status para controle de edição
      status: analise.status,
      // Add planejamento_id for navigation
      planejamento_id: analise.planejamento_id,
      metadata: {
        tempo_processamento_ms: analise.tempo_processamento_ms,
        custo_total_usd: analise.custo_total_usd,
        prompt_versoes: analise.prompt_versoes_json,
        created_at: analise.created_at,
      },
    };
  }
}
