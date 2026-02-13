import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FiltrosDashboardDto } from './dto/filtros-dashboard.dto';
import { Prisma } from '@prisma/client';
import {
  COBERTURA_META_THRESHOLD,
  COBERTURA_TURMA_THRESHOLDS,
} from '../../config/constants';

export interface MetricasProfessor {
  professor_id: string;
  professor_nome: string;
  disciplina: string;
  total_turmas: number;
  media_cobertura: number;
  total_habilidades_planejadas: number;
  total_habilidades_trabalhadas: number;
  total_aulas: number;
  tempo_medio_revisao: number;
}

export interface MetricasTurma {
  turma_id: string;
  turma_nome: string;
  turma_serie: string;
  disciplina: string;
  bimestre: number;
  percentual_cobertura: number;
  habilidades_planejadas: number;
  habilidades_trabalhadas: number;
  total_aulas_aprovadas: number;
}

export interface MetricasTurmaAgregada {
  turma_id: string;
  turma_nome: string;
  turma_serie: string;
  disciplina: string;
  bimestre: number;
  percentual_cobertura: number;
  habilidades_planejadas: number;
  habilidades_trabalhadas: number;
  total_aulas: number;
  professores: string;
}

export interface HabilidadeStatus {
  habilidade_codigo: string;
  habilidade_descricao: string;
  status_cobertura: 'COMPLETE' | 'PARTIAL' | 'MENTIONED' | 'NOT_COVERED';
  aulas_relacionadas: number;
}

export interface KPIsEscola {
  cobertura_geral: number;
  total_professores_ativos: number;
  total_turmas: number;
  total_aulas: number;
  tempo_medio_revisao_geral: number;
}

export interface DistribuicaoDisciplina {
  disciplina: string;
  cobertura_media: number;
  total_turmas: number;
  total_aulas: number;
}

export interface EvolucaoTemporal {
  bimestre: number;
  cobertura_media: number;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetricasPorProfessor(escolaId: string, filtros: FiltrosDashboardDto) {
    // Query raw SQL para agregar dados da materialized view
    // Query optimized: uses turma_tipo_ensino from materialized view (no JOIN needed)
    const metricas = await this.prisma.$queryRaw<MetricasProfessor[]>`
      SELECT
        cb.professor_id,
        cb.professor_nome,
        cb.disciplina,
        COUNT(DISTINCT cb.turma_id) as total_turmas,
        AVG(cb.percentual_cobertura) as media_cobertura,
        SUM(cb.habilidades_planejadas) as total_habilidades_planejadas,
        SUM(cb.habilidades_trabalhadas) as total_habilidades_trabalhadas,
        SUM(cb.total_aulas_aprovadas) as total_aulas,
        AVG(cb.tempo_medio_revisao) as tempo_medio_revisao
      FROM cobertura_bimestral cb
      WHERE cb.escola_id = ${escolaId}
        ${filtros.bimestre ? Prisma.sql`AND cb.bimestre = ${filtros.bimestre}` : Prisma.empty}
        ${filtros.disciplina ? Prisma.sql`AND cb.disciplina = ${filtros.disciplina}` : Prisma.empty}
        ${filtros.tipo_ensino ? Prisma.sql`AND cb.turma_tipo_ensino = ${filtros.tipo_ensino}` : Prisma.empty}
      GROUP BY cb.professor_id, cb.professor_nome, cb.disciplina
      ORDER BY media_cobertura DESC;
    `;

    // Calcular resumo agregado
    const resumo = {
      total_professores: metricas.length,
      media_geral:
        metricas.reduce((acc, m) => acc + Number(m.media_cobertura), 0) /
          metricas.length || 0,
      professores_abaixo_meta: metricas.filter(
        (m) => Number(m.media_cobertura) < COBERTURA_META_THRESHOLD,
      ).length,
    };

    return {
      metricas,
      resumo,
    };
  }

  async getTurmasPorProfessor(
    escolaId: string,
    professorId: string,
    filtros: FiltrosDashboardDto,
  ) {
    const turmas = await this.prisma.$queryRaw<MetricasTurma[]>`
      SELECT
        cb.turma_id,
        cb.turma_nome,
        cb.turma_serie,
        cb.disciplina,
        cb.bimestre,
        cb.percentual_cobertura,
        cb.habilidades_planejadas,
        cb.habilidades_trabalhadas,
        cb.total_aulas_aprovadas
      FROM cobertura_bimestral cb
      WHERE cb.escola_id = ${escolaId}
        AND cb.professor_id = ${professorId}
        ${filtros.bimestre ? Prisma.sql`AND cb.bimestre = ${filtros.bimestre}` : Prisma.empty}
        ${filtros.tipo_ensino ? Prisma.sql`AND cb.turma_tipo_ensino = ${filtros.tipo_ensino}` : Prisma.empty}
      ORDER BY cb.percentual_cobertura ASC;
    `;

    return { turmas };
  }

  async getMetricasPorTurma(escolaId: string, filtros: FiltrosDashboardDto) {
    // Query optimized: uses turma_tipo_ensino from materialized view (no JOIN needed)
    const metricas = await this.prisma.$queryRaw<MetricasTurmaAgregada[]>`
      SELECT
        cb.turma_id,
        cb.turma_nome,
        cb.turma_serie,
        cb.disciplina,
        cb.bimestre,
        AVG(cb.percentual_cobertura) as percentual_cobertura,
        SUM(cb.habilidades_planejadas) as habilidades_planejadas,
        SUM(cb.habilidades_trabalhadas) as habilidades_trabalhadas,
        SUM(cb.total_aulas_aprovadas) as total_aulas,
        STRING_AGG(DISTINCT cb.professor_nome, ', ') as professores
      FROM cobertura_bimestral cb
      WHERE cb.escola_id = ${escolaId}
        ${filtros.bimestre ? Prisma.sql`AND cb.bimestre = ${filtros.bimestre}` : Prisma.empty}
        ${filtros.disciplina ? Prisma.sql`AND cb.disciplina = ${filtros.disciplina}` : Prisma.empty}
        ${filtros.tipo_ensino ? Prisma.sql`AND cb.turma_tipo_ensino = ${filtros.tipo_ensino}` : Prisma.empty}
      GROUP BY cb.turma_id, cb.turma_nome, cb.turma_serie, cb.disciplina, cb.bimestre
      ORDER BY percentual_cobertura ASC;
    `;

    // Classificar turmas por urgência
    const turmas_criticas = metricas.filter(
      (t) => Number(t.percentual_cobertura) < COBERTURA_TURMA_THRESHOLDS.CRITICA,
    );
    const turmas_atencao = metricas.filter(
      (t) =>
        Number(t.percentual_cobertura) >= COBERTURA_TURMA_THRESHOLDS.CRITICA &&
        Number(t.percentual_cobertura) < COBERTURA_TURMA_THRESHOLDS.ATENCAO,
    );
    const turmas_ritmo = metricas.filter(
      (t) => Number(t.percentual_cobertura) >= COBERTURA_TURMA_THRESHOLDS.ATENCAO,
    );

    return {
      metricas,
      classificacao: {
        criticas: turmas_criticas.length,
        atencao: turmas_atencao.length,
        no_ritmo: turmas_ritmo.length,
      },
      turmas_priorizadas: turmas_criticas.slice(0, 5), // Top 5 mais urgentes
    };
  }

  async getDetalhesTurma(
    escolaId: string,
    turmaId: string,
    bimestre?: number,
  ) {
    // Buscar habilidades planejadas vs trabalhadas
    const detalhes = await this.prisma.$queryRaw<HabilidadeStatus[]>`
      SELECT
        h.codigo as habilidade_codigo,
        h.descricao as habilidade_descricao,
        CASE
          WHEN COUNT(a.id) FILTER (
            WHERE a.cobertura_bncc::jsonb @> jsonb_build_array(
              jsonb_build_object('codigo', h.codigo, 'nivel_cobertura', 'COMPLETE')
            )
          ) > 0 THEN 'COMPLETE'
          WHEN COUNT(a.id) FILTER (
            WHERE a.cobertura_bncc::jsonb @> jsonb_build_array(
              jsonb_build_object('codigo', h.codigo, 'nivel_cobertura', 'PARTIAL')
            )
          ) > 0 THEN 'PARTIAL'
          WHEN COUNT(a.id) FILTER (
            WHERE a.cobertura_bncc::jsonb @> jsonb_build_array(
              jsonb_build_object('codigo', h.codigo, 'nivel_cobertura', 'MENTIONED')
            )
          ) > 0 THEN 'MENTIONED'
          ELSE 'NOT_COVERED'
        END as status_cobertura,
        COUNT(DISTINCT au.id) FILTER (WHERE au.status_processamento = 'APROVADA') as aulas_relacionadas
      FROM "PlanejamentoHabilidade" ph
      INNER JOIN "Planejamento" p ON ph.planejamento_id = p.id
      INNER JOIN "Habilidade" h ON ph.habilidade_id = h.id
      LEFT JOIN "Aula" au ON au.turma_id = p.turma_id AND au.professor_id = p.professor_id
      LEFT JOIN "Analise" a ON a.aula_id = au.id
      WHERE p.turma_id = ${turmaId}
        AND p.escola_id = ${escolaId}
        ${bimestre ? Prisma.sql`AND p.bimestre = ${bimestre}` : Prisma.empty}
      GROUP BY h.codigo, h.descricao
      ORDER BY
        CASE status_cobertura
          WHEN 'NOT_COVERED' THEN 0
          WHEN 'MENTIONED' THEN 1
          WHEN 'PARTIAL' THEN 2
          WHEN 'COMPLETE' THEN 3
        END ASC,
        h.codigo ASC;
    `;

    return { detalhes };
  }

  async getMetricasEscola(escolaId: string, bimestre?: number) {
    // === QUERY 1: KPIs Consolidados (Overall + Breakdown by tipo_ensino) ===
    const kpisRaw = await this.prisma.$queryRaw<
      Array<{
        cobertura_geral: number;
        total_professores_ativos: bigint;
        total_turmas: bigint;
        total_aulas: bigint;
        tempo_medio_revisao_geral: number;
      }>
    >`
      SELECT
        AVG(cb.percentual_cobertura) as cobertura_geral,
        COUNT(DISTINCT cb.professor_id) as total_professores_ativos,
        COUNT(DISTINCT cb.turma_id) as total_turmas,
        SUM(cb.total_aulas_aprovadas) as total_aulas,
        AVG(cb.tempo_medio_revisao) as tempo_medio_revisao_geral
      FROM cobertura_bimestral cb
      WHERE cb.escola_id = ${escolaId}
        ${bimestre ? Prisma.sql`AND cb.bimestre = ${bimestre}` : Prisma.empty}
    `;

    // Breakdown by tipo_ensino - optimized: uses turma_tipo_ensino from view (no JOIN)
    const breakdownRaw = await this.prisma.$queryRaw<
      Array<{
        tipo_ensino: string;
        cobertura_media: number;
        total_turmas: bigint;
      }>
    >`
      SELECT
        cb.turma_tipo_ensino as tipo_ensino,
        AVG(cb.percentual_cobertura) as cobertura_media,
        COUNT(DISTINCT cb.turma_id) as total_turmas
      FROM cobertura_bimestral cb
      WHERE cb.escola_id = ${escolaId}
        ${bimestre ? Prisma.sql`AND cb.bimestre = ${bimestre}` : Prisma.empty}
      GROUP BY cb.turma_tipo_ensino
    `;

    // Transform breakdown to object with FUNDAMENTAL and MEDIO keys
    const breakdown = {
      fundamental: breakdownRaw.find((b) => b.tipo_ensino === 'FUNDAMENTAL')
        ? {
            cobertura: Number(breakdownRaw.find((b) => b.tipo_ensino === 'FUNDAMENTAL')!.cobertura_media) || 0,
            total_turmas: Number(breakdownRaw.find((b) => b.tipo_ensino === 'FUNDAMENTAL')!.total_turmas),
          }
        : { cobertura: 0, total_turmas: 0 },
      medio: breakdownRaw.find((b) => b.tipo_ensino === 'MEDIO')
        ? {
            cobertura: Number(breakdownRaw.find((b) => b.tipo_ensino === 'MEDIO')!.cobertura_media) || 0,
            total_turmas: Number(breakdownRaw.find((b) => b.tipo_ensino === 'MEDIO')!.total_turmas),
          }
        : { cobertura: 0, total_turmas: 0 },
    };

    // Transformar bigint → number
    const kpis = kpisRaw[0]
      ? {
          cobertura_geral: Number(kpisRaw[0].cobertura_geral) || 0,
          total_professores_ativos: Number(kpisRaw[0].total_professores_ativos),
          total_turmas: Number(kpisRaw[0].total_turmas),
          total_aulas: Number(kpisRaw[0].total_aulas),
          tempo_medio_revisao_geral: Number(kpisRaw[0].tempo_medio_revisao_geral) || 0,
          // Add breakdown to KPIs (AC #7)
          cobertura_fundamental: breakdown.fundamental.cobertura,
          cobertura_medio: breakdown.medio.cobertura,
          total_turmas_fundamental: breakdown.fundamental.total_turmas,
          total_turmas_medio: breakdown.medio.total_turmas,
        }
      : {
          cobertura_geral: 0,
          total_professores_ativos: 0,
          total_turmas: 0,
          total_aulas: 0,
          tempo_medio_revisao_geral: 0,
          cobertura_fundamental: 0,
          cobertura_medio: 0,
          total_turmas_fundamental: 0,
          total_turmas_medio: 0,
        };

    // === QUERY 2: Distribuição por Disciplina ===
    const porDisciplina = await this.prisma.$queryRaw<
      Array<{
        disciplina: string;
        cobertura_media: number;
        total_turmas: bigint;
        total_aulas: bigint;
      }>
    >`
      SELECT
        disciplina,
        AVG(percentual_cobertura) as cobertura_media,
        COUNT(DISTINCT turma_id) as total_turmas,
        SUM(total_aulas_aprovadas) as total_aulas
      FROM cobertura_bimestral
      WHERE escola_id = ${escolaId}
        ${bimestre ? Prisma.sql`AND bimestre = ${bimestre}` : Prisma.empty}
      GROUP BY disciplina
      ORDER BY cobertura_media DESC
    `;

    // Transformar bigint → number
    const porDisciplinaFormatted = porDisciplina.map((d) => ({
      disciplina: d.disciplina,
      cobertura_media: Number(d.cobertura_media) || 0,
      total_turmas: Number(d.total_turmas),
      total_aulas: Number(d.total_aulas),
    }));

    // === QUERY 3: Evolução Temporal (últimos 4 bimestres) ===
    const evolucao = await this.prisma.$queryRaw<
      Array<{
        bimestre: number;
        cobertura_media: number;
      }>
    >`
      SELECT
        bimestre,
        AVG(percentual_cobertura) as cobertura_media
      FROM cobertura_bimestral
      WHERE escola_id = ${escolaId}
        AND ano_letivo = EXTRACT(YEAR FROM CURRENT_DATE)::integer
      GROUP BY bimestre
      ORDER BY bimestre ASC
    `;

    // Garantir que todos os 4 bimestres aparecem (mesmo com 0)
    const evolucaoCompleta = [1, 2, 3, 4].map((bim) => {
      const existente = evolucao.find((e) => e.bimestre === bim);
      return {
        bimestre: bim,
        cobertura_media: existente ? Number(existente.cobertura_media) || 0 : 0,
      };
    });

    return {
      kpis,
      por_disciplina: porDisciplinaFormatted,
      evolucao_temporal: evolucaoCompleta,
    };
  }
}
