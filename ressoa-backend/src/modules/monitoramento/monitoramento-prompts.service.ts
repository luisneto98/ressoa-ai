import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

const PROMPT_NOMES = [
  'prompt-cobertura',
  'prompt-qualitativa',
  'prompt-relatorio',
  'prompt-exercicios',
  'prompt-alertas',
] as const;

const LOW_PERFORMER_THRESHOLD = 80;
const MIN_ANALISES_ALERTA = 10;

interface PromptMetricaRow {
  nome: string;
  versao: string;
  ab_testing: boolean;
  total_analises: bigint;
  aprovadas: bigint;
  rejeitadas: bigint;
  tempo_medio_revisao: number | null;
}

export interface PromptMetrica {
  nome: string;
  versao: string;
  ab_testing: boolean;
  total_analises: number;
  aprovadas: number;
  rejeitadas: number;
  taxa_aprovacao: number;
  tempo_medio_revisao: number;
  status: 'Excelente' | 'Bom' | 'Low Performer';
}

export interface QualidadePromptsResponse {
  metricas: PromptMetrica[];
  resumo: {
    total_versoes: number;
    low_performers: number;
    taxa_aprovacao_geral: number;
  };
  periodo: string;
}

interface DiffItemRow {
  analise_id: string;
  turma_nome: string;
  data: Date;
  change_count: bigint;
  original_length: bigint;
  edited_length: bigint;
  original: string;
  editado: string;
}

export interface DiffItem {
  analise_id: string;
  aula_titulo: string;
  data_aula: string;
  change_count: number;
  original_length: number;
  edited_length: number;
  original: string;
  editado: string;
}

export interface DiffsResponse {
  nome: string;
  versao: string;
  diffs: DiffItem[];
  total: number;
}

@Injectable()
export class MonitoramentoPromptsService {
  private readonly logger = new Logger('MonitoramentoPrompts');

  constructor(private readonly prisma: PrismaService) {}

  async getQualidadePrompts(
    periodo: string,
  ): Promise<QualidadePromptsResponse> {
    const dataInicio = this.calcularDataInicio(periodo);
    const metricas: PromptMetrica[] = [];

    for (const promptNome of PROMPT_NOMES) {
      const rows = await this.prisma.$queryRaw<PromptMetricaRow[]>`
        SELECT
          p.nome,
          p.versao,
          p.ab_testing,
          COUNT(a.id) as total_analises,
          COUNT(CASE WHEN a.status = 'APROVADO' THEN 1 END) as aprovadas,
          COUNT(CASE WHEN a.status = 'REJEITADO' THEN 1 END) as rejeitadas,
          AVG(a.tempo_revisao)::float as tempo_medio_revisao
        FROM prompt p
        LEFT JOIN analise a ON a.prompt_versoes_json->>${promptNome} = p.versao
          AND p.nome = ${promptNome}
          AND a.created_at >= ${dataInicio}
          AND a.status IN ('APROVADO', 'REJEITADO')
        WHERE p.nome = ${promptNome}
          AND (p.ativo = true OR EXISTS (
            SELECT 1 FROM analise a2
            WHERE a2.prompt_versoes_json->>${promptNome} = p.versao
            AND a2.created_at >= ${dataInicio}
          ))
        GROUP BY p.id, p.nome, p.versao, p.ab_testing
        ORDER BY p.versao DESC
      `;

      for (const row of rows) {
        const totalAnalises = Number(row.total_analises);
        const aprovadas = Number(row.aprovadas);
        const taxaAprovacao =
          totalAnalises > 0
            ? Number(((aprovadas / totalAnalises) * 100).toFixed(1))
            : 0;

        metricas.push({
          nome: row.nome,
          versao: row.versao,
          ab_testing: row.ab_testing,
          total_analises: totalAnalises,
          aprovadas,
          rejeitadas: Number(row.rejeitadas),
          taxa_aprovacao: taxaAprovacao,
          tempo_medio_revisao: row.tempo_medio_revisao
            ? Number(row.tempo_medio_revisao.toFixed(0))
            : 0,
          status: this.getStatus(taxaAprovacao),
        });
      }
    }

    const totalAnalises = metricas.reduce(
      (sum, m) => sum + m.total_analises,
      0,
    );
    const totalAprovadas = metricas.reduce((sum, m) => sum + m.aprovadas, 0);

    return {
      metricas,
      resumo: {
        total_versoes: metricas.length,
        low_performers: metricas.filter((m) => m.status === 'Low Performer')
          .length,
        taxa_aprovacao_geral:
          totalAnalises > 0
            ? Number(((totalAprovadas / totalAnalises) * 100).toFixed(1))
            : 0,
      },
      periodo,
    };
  }

  async getDiffsPorVersao(
    nome: string,
    versao: string,
  ): Promise<DiffsResponse> {
    if (!PROMPT_NOMES.includes(nome as (typeof PROMPT_NOMES)[number])) {
      throw new BadRequestException(
        `Prompt inválido: ${nome}. Válidos: ${PROMPT_NOMES.join(', ')}`,
      );
    }

    const rows = await this.prisma.$queryRaw<DiffItemRow[]>`
      SELECT
        a.id as analise_id,
        t.nome as turma_nome,
        au.data,
        ABS(LENGTH(a.relatorio_editado) - LENGTH(a.relatorio_texto))::bigint as change_count,
        LENGTH(a.relatorio_texto)::bigint as original_length,
        LENGTH(a.relatorio_editado)::bigint as edited_length,
        a.relatorio_texto as original,
        a.relatorio_editado as editado
      FROM analise a
      JOIN aula au ON au.id = a.aula_id
      JOIN turma t ON t.id = au.turma_id
      WHERE a.relatorio_editado IS NOT NULL
        AND a.prompt_versoes_json->>${nome} = ${versao}
      ORDER BY ABS(LENGTH(a.relatorio_editado) - LENGTH(a.relatorio_texto)) DESC
      LIMIT 20
    `;

    const diffs: DiffItem[] = rows.map((r) => ({
      analise_id: r.analise_id,
      aula_titulo: r.turma_nome,
      data_aula:
        r.data instanceof Date
          ? r.data.toISOString()
          : String(r.data),
      change_count: Number(r.change_count),
      original_length: Number(r.original_length),
      edited_length: Number(r.edited_length),
      original: r.original,
      editado: r.editado,
    }));

    return {
      nome,
      versao,
      diffs,
      total: diffs.length,
    };
  }

  @Cron('0 10 * * *') // Diariamente às 10h UTC
  async verificarPromptsBaixaPerformance(): Promise<void> {
    try {
      const dataInicio = this.calcularDataInicio('30d');

      for (const promptNome of PROMPT_NOMES) {
        const rows = await this.prisma.$queryRaw<
          Array<{
            nome: string;
            versao: string;
            total: bigint;
            aprovadas: bigint;
          }>
        >`
          SELECT
            p.nome,
            p.versao,
            COUNT(a.id) as total,
            COUNT(CASE WHEN a.status = 'APROVADO' THEN 1 END) as aprovadas
          FROM prompt p
          LEFT JOIN analise a ON a.prompt_versoes_json->>${promptNome} = p.versao
            AND p.nome = ${promptNome}
            AND a.created_at >= ${dataInicio}
            AND a.status IN ('APROVADO', 'REJEITADO')
          WHERE p.nome = ${promptNome} AND p.ativo = true
          GROUP BY p.id, p.nome, p.versao
          HAVING COUNT(a.id) >= ${MIN_ANALISES_ALERTA}
        `;

        for (const row of rows) {
          const total = Number(row.total);
          const aprovadas = Number(row.aprovadas);
          const taxa = total > 0 ? (aprovadas / total) * 100 : 0;

          if (taxa < LOW_PERFORMER_THRESHOLD) {
            this.logger.warn(
              `ALERTA PROMPT: ${row.nome} ${row.versao} com taxa de aprovação ${taxa.toFixed(1)}% (${aprovadas}/${total}) nos últimos 30 dias`,
              {
                nome: row.nome,
                versao: row.versao,
                taxa_aprovacao: Number(taxa.toFixed(1)),
                total_analises: total,
                threshold: LOW_PERFORMER_THRESHOLD,
              },
            );
          }
        }
      }
    } catch (error) {
      this.logger.error(
        'Falha ao verificar prompts com baixa performance',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private getStatus(
    taxaAprovacao: number,
  ): 'Excelente' | 'Bom' | 'Low Performer' {
    if (taxaAprovacao >= 90) return 'Excelente';
    if (taxaAprovacao >= 80) return 'Bom';
    return 'Low Performer';
  }

  private calcularDataInicio(periodo: string): Date {
    const now = new Date();
    switch (periodo) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '30d':
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}
