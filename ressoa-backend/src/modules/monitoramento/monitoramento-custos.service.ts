import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface CustoEscolaRow {
  escola_id: string;
  escola_nome: string;
  custo_stt: number;
  custo_llm: number;
  custo_total: number;
  total_aulas: number;
  professores_ativos: number;
}

export interface MonitoramentoCustosResponse {
  escolas: Array<CustoEscolaRow & { custo_por_aula: number }>;
  totais: {
    custo_total: number;
    total_aulas: number;
    total_escolas: number;
    projecao_mensal: number;
  };
  mes: string;
}

const CUSTO_ALTO_THRESHOLD_USD = 50;

@Injectable()
export class MonitoramentoCustosService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetricas(mes?: string): Promise<MonitoramentoCustosResponse> {
    const mesStr =
      mes ||
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const [ano, mesNum] = mesStr.split('-').map(Number);

    const custos = await this.prisma.$queryRaw<CustoEscolaRow[]>`
      SELECT
        e.id as escola_id,
        e.nome as escola_nome,
        COALESCE(SUM(t.custo_usd), 0)::float as custo_stt,
        COALESCE(SUM(an.custo_total_usd), 0)::float as custo_llm,
        (COALESCE(SUM(t.custo_usd), 0) + COALESCE(SUM(an.custo_total_usd), 0))::float as custo_total,
        COUNT(DISTINCT a.id)::int as total_aulas,
        COUNT(DISTINCT a.professor_id)::int as professores_ativos
      FROM escola e
      LEFT JOIN aula a ON a.escola_id = e.id
        AND a.deleted_at IS NULL
        AND EXTRACT(YEAR FROM a.created_at) = ${ano}
        AND EXTRACT(MONTH FROM a.created_at) = ${mesNum}
      LEFT JOIN transcricao t ON t.aula_id = a.id
      LEFT JOIN analise an ON an.aula_id = a.id
      GROUP BY e.id, e.nome
      ORDER BY custo_total DESC
    `;

    const escolas = custos.map((row) => ({
      ...row,
      custo_por_aula:
        row.total_aulas > 0
          ? Number((row.custo_total / row.total_aulas).toFixed(4))
          : 0,
    }));

    const custoTotal = escolas.reduce((sum, e) => sum + e.custo_total, 0);
    const totalAulas = escolas.reduce((sum, e) => sum + e.total_aulas, 0);

    const agora = new Date();
    const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;

    // Projeção: extrapola custo acumulado para o mês inteiro.
    // Nos primeiros dias do mês a projeção pode ser imprecisa (poucos dados).
    let projecaoMensal: number;
    if (mesStr === mesAtual) {
      const diasDecorridos = agora.getDate();
      const diasNoMes = new Date(ano, mesNum, 0).getDate();
      projecaoMensal =
        diasDecorridos > 0
          ? Number(((custoTotal / diasDecorridos) * diasNoMes).toFixed(2))
          : 0;
    } else {
      projecaoMensal = Number(custoTotal.toFixed(2));
    }

    return {
      escolas,
      totais: {
        custo_total: Number(custoTotal.toFixed(2)),
        total_aulas: totalAulas,
        total_escolas: escolas.length,
        projecao_mensal: projecaoMensal,
      },
      mes: mesStr,
    };
  }
}

export { CUSTO_ALTO_THRESHOLD_USD };
