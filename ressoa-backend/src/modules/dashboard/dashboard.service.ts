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

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetricasPorProfessor(escolaId: string, filtros: FiltrosDashboardDto) {
    // Query raw SQL para agregar dados da materialized view
    const metricas = await this.prisma.$queryRaw<MetricasProfessor[]>`
      SELECT
        professor_id,
        professor_nome,
        disciplina,
        COUNT(DISTINCT turma_id) as total_turmas,
        AVG(percentual_cobertura) as media_cobertura,
        SUM(habilidades_planejadas) as total_habilidades_planejadas,
        SUM(habilidades_trabalhadas) as total_habilidades_trabalhadas,
        SUM(total_aulas_aprovadas) as total_aulas,
        AVG(tempo_medio_revisao) as tempo_medio_revisao
      FROM cobertura_bimestral
      WHERE escola_id = ${escolaId}::uuid
        ${filtros.bimestre ? Prisma.sql`AND bimestre = ${filtros.bimestre}` : Prisma.empty}
        ${filtros.disciplina ? Prisma.sql`AND disciplina = ${filtros.disciplina}::disciplina` : Prisma.empty}
      GROUP BY professor_id, professor_nome, disciplina
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
        turma_id,
        turma_nome,
        turma_serie,
        disciplina,
        bimestre,
        percentual_cobertura,
        habilidades_planejadas,
        habilidades_trabalhadas,
        total_aulas_aprovadas
      FROM cobertura_bimestral
      WHERE escola_id = ${escolaId}::uuid
        AND professor_id = ${professorId}::uuid
        ${filtros.bimestre ? Prisma.sql`AND bimestre = ${filtros.bimestre}` : Prisma.empty}
      ORDER BY percentual_cobertura ASC;
    `;

    return { turmas };
  }

  async getMetricasPorTurma(escolaId: string, filtros: FiltrosDashboardDto) {
    // Query raw SQL para agregar dados da materialized view por turma
    const metricas = await this.prisma.$queryRaw<MetricasTurmaAgregada[]>`
      SELECT
        turma_id,
        turma_nome,
        turma_serie,
        disciplina,
        bimestre,
        AVG(percentual_cobertura) as percentual_cobertura,
        SUM(habilidades_planejadas) as habilidades_planejadas,
        SUM(habilidades_trabalhadas) as habilidades_trabalhadas,
        SUM(total_aulas_aprovadas) as total_aulas,
        STRING_AGG(DISTINCT professor_nome, ', ') as professores
      FROM cobertura_bimestral
      WHERE escola_id = ${escolaId}::uuid
        ${filtros.bimestre ? Prisma.sql`AND bimestre = ${filtros.bimestre}` : Prisma.empty}
        ${filtros.disciplina ? Prisma.sql`AND disciplina = ${filtros.disciplina}::disciplina` : Prisma.empty}
      GROUP BY turma_id, turma_nome, turma_serie, disciplina, bimestre
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
      WHERE p.turma_id = ${turmaId}::uuid
        AND p.escola_id = ${escolaId}::uuid
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
}
