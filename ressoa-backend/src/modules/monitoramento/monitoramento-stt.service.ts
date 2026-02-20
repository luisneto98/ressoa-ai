import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

interface ProviderMetrics {
  provider: string;
  count: number;
  avg_tempo_ms: number;
  avg_confianca: number;
  avg_custo_usd: number;
}

interface ErroTimeline {
  hora: string;
  erros_stt: number;
  transcricoes_ok: number;
}

interface ErroRecente {
  aula_id: string;
  escola_id: string;
  data: string;
  updated_at: string;
  arquivo_tamanho: number | null;
  tipo_entrada: 'AUDIO' | 'TRANSCRICAO' | 'MANUAL';
}

export interface MonitoramentoSTTResponse {
  kpis: {
    total_transcricoes: number;
    erros_stt: number;
    taxa_sucesso: number;
    taxa_erro: number;
    fallback_count: number;
    tempo_medio_ms: number;
    confianca_media: number;
    custo_total_usd: number;
  };
  por_provider: ProviderMetrics[];
  erros_timeline: ErroTimeline[];
  erros_recentes: ErroRecente[];
}

@Injectable()
export class MonitoramentoSTTService {
  private readonly primaryProvider: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.primaryProvider =
      this.configService.get<string>('STT_PRIMARY_PROVIDER') || 'WHISPER';
  }

  async getMetricas(periodo: string): Promise<MonitoramentoSTTResponse> {
    const dataInicio = this.calcularDataInicio(periodo);

    const [
      total,
      errosSTT,
      fallbackCount,
      agregados,
      porProvider,
      errosTimeline,
      errosRecentes,
    ] = await Promise.all([
      // Total de transcrições no período
      this.prisma.transcricao.count({
        where: { created_at: { gte: dataInicio } },
      }),

      // Erros STT: Aulas com ERRO que não geraram transcrição
      this.prisma.aula.count({
        where: {
          status_processamento: 'ERRO',
          transcricao: null,
          updated_at: { gte: dataInicio },
        },
      }),

      // Transcrições que usaram fallback provider
      this.prisma.transcricao.count({
        where: {
          created_at: { gte: dataInicio },
          provider: { not: this.primaryProvider as any },
        },
      }),

      // Agregados: tempo médio, confiança média, custo total
      this.prisma.transcricao.aggregate({
        where: { created_at: { gte: dataInicio } },
        _avg: {
          tempo_processamento_ms: true,
          confianca: true,
        },
        _sum: {
          custo_usd: true,
        },
      }),

      // Distribuição por provider
      this.prisma.transcricao.groupBy({
        by: ['provider'],
        where: { created_at: { gte: dataInicio } },
        _count: { _all: true },
        _avg: {
          tempo_processamento_ms: true,
          confianca: true,
          custo_usd: true,
        },
      }),

      // Timeline de erros (raw query para DATE_TRUNC)
      // Note: Assumes aulas with ERRO status and no transcricao are STT failures.
      // Aulas in pre-STT states (CRIADA, UPLOAD_PROGRESSO, AGUARDANDO_TRANSCRICAO) are excluded.
      this.prisma.$queryRaw<
        Array<{ hora: Date; erros_stt: bigint; transcricoes_ok: bigint }>
      >`
          SELECT
            DATE_TRUNC('hour', COALESCE(t.created_at, a.updated_at)) as hora,
            COUNT(*) FILTER (WHERE a.status_processamento = 'ERRO' AND t.id IS NULL)::bigint as erros_stt,
            COUNT(DISTINCT t.id)::bigint as transcricoes_ok
          FROM aula a
          LEFT JOIN transcricao t ON t.aula_id = a.id
          WHERE COALESCE(t.created_at, a.updated_at) >= ${dataInicio}
            AND a.status_processamento IN ('ERRO', 'TRANSCRITA', 'ANALISANDO', 'ANALISADA', 'APROVADA', 'REJEITADA')
          GROUP BY hora
          ORDER BY hora ASC
        `,

      // Últimos erros recentes (para debugging)
      this.prisma.aula.findMany({
        where: {
          status_processamento: 'ERRO',
          transcricao: null,
          updated_at: { gte: dataInicio },
        },
        select: {
          id: true,
          escola_id: true,
          data: true,
          updated_at: true,
          arquivo_tamanho: true,
          tipo_entrada: true,
        },
        orderBy: { updated_at: 'desc' },
        take: 10,
      }),
    ]);

    // Calculate rates (avoid division by zero)
    const totalBase = total + errosSTT;
    const taxaSucesso = totalBase > 0 ? (total / totalBase) * 100 : 0;
    const taxaErro = totalBase > 0 ? (errosSTT / totalBase) * 100 : 0;

    return {
      kpis: {
        total_transcricoes: total,
        erros_stt: errosSTT,
        taxa_sucesso: Number(taxaSucesso.toFixed(2)),
        taxa_erro: Number(taxaErro.toFixed(2)),
        fallback_count: fallbackCount,
        tempo_medio_ms: Math.round(agregados._avg.tempo_processamento_ms ?? 0),
        confianca_media: Number((agregados._avg.confianca ?? 0).toFixed(4)),
        custo_total_usd: Number((agregados._sum.custo_usd ?? 0).toFixed(4)),
      },
      por_provider: porProvider.map((p) => ({
        provider: p.provider,
        count: p._count._all,
        avg_tempo_ms: Math.round(p._avg.tempo_processamento_ms ?? 0),
        avg_confianca: Number((p._avg.confianca ?? 0).toFixed(4)),
        avg_custo_usd: Number((p._avg.custo_usd ?? 0).toFixed(4)),
      })),
      erros_timeline: errosTimeline.map((e) => ({
        hora: e.hora.toISOString(),
        erros_stt: Number(e.erros_stt),
        transcricoes_ok: Number(e.transcricoes_ok),
      })),
      erros_recentes: errosRecentes.map((e) => ({
        aula_id: e.id,
        escola_id: e.escola_id,
        data: e.data.toISOString(),
        updated_at: e.updated_at.toISOString(),
        arquivo_tamanho: e.arquivo_tamanho,
        tipo_entrada: e.tipo_entrada,
      })),
    };
  }

  /**
   * Calcula taxa de erro na última hora (usado pelo cron de alertas)
   */
  async getTaxaErroUltimaHora(): Promise<{
    taxaErro: number;
    erros: number;
    total: number;
  }> {
    const ultimaHora = new Date(Date.now() - 60 * 60 * 1000);

    const [transcricoes, erros] = await Promise.all([
      this.prisma.transcricao.count({
        where: { created_at: { gte: ultimaHora } },
      }),
      this.prisma.aula.count({
        where: {
          status_processamento: 'ERRO',
          transcricao: null,
          updated_at: { gte: ultimaHora },
        },
      }),
    ]);

    const total = transcricoes + erros;
    const taxaErro = total > 0 ? (erros / total) * 100 : 0;

    return { taxaErro, erros, total };
  }

  private calcularDataInicio(periodo: string): Date {
    const agora = new Date();
    switch (periodo) {
      case '1h':
        return new Date(agora.getTime() - 60 * 60 * 1000);
      case '24h':
        return new Date(agora.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(agora.getTime() - 24 * 60 * 60 * 1000);
    }
  }
}
