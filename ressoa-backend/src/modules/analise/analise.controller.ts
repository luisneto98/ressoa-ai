import {
  Controller,
  Get,
  Param,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { AnaliseService } from './services/analise.service';
import { AulasService } from '../aulas/aulas.service';

/**
 * Controller responsável pela visualização de análises pedagógicas.
 *
 * **Story 6.1:** GET /api/v1/aulas/:aulaId/analise
 * - Permite professor visualizar análise completa de sua aula
 * - Retorna cobertura BNCC, análise qualitativa, relatório, exercícios e alertas
 * - Valida permissões: apenas professor dono da aula pode acessar
 */
@Controller('aulas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnaliseController {
  constructor(
    private readonly analiseService: AnaliseService,
    private readonly aulasService: AulasService,
  ) {}

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
  @Get(':aulaId/analise')
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

    // 4. Retornar análise estruturada
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
      },
      cobertura_bncc: analise.cobertura_json,
      analise_qualitativa: analise.analise_qualitativa_json,
      relatorio: analise.relatorio_texto,
      exercicios: analise.exercicios_json,
      alertas: analise.alertas_json,
      metadata: {
        tempo_processamento_ms: analise.tempo_processamento_ms,
        custo_total_usd: analise.custo_total_usd,
        prompt_versoes: analise.prompt_versoes_json,
        created_at: analise.created_at,
      },
    };
  }
}
