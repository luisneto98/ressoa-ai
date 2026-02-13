import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface FiltrosCobertura {
  turma_id?: string;
  disciplina?: string;
  bimestre?: number; // 1-4
  curriculo_tipo?: 'BNCC' | 'CUSTOM'; // Story 11.8: Filter by curriculum type
}

export interface CoberturaResult {
  turma_id: string;
  turma_nome: string;
  curriculo_tipo: 'BNCC' | 'CUSTOM'; // Story 11.8: Curriculum type for adaptive rendering
  disciplina: string;
  bimestre: number;
  habilidades_planejadas: number;
  habilidades_trabalhadas: number;
  percentual_cobertura: number; // 0-100
}

export interface TimelineResult {
  semana: Date;
  habilidades_acumuladas: number;
  aulas_realizadas: number;
}

@Injectable()
export class ProfessoresService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calcula % de cobertura curricular do professor por turma/disciplina/bimestre
   *
   * @param professorId ID do professor
   * @param escolaId ID da escola (multi-tenancy)
   * @param filtros Filtros opcionais (turma_id, disciplina, bimestre)
   * @returns Array de cobertura por turma
   *
   * SQL Query Logic:
   * - JOIN Planejamento + PlanejamentoHabilidade + Turma + Aula + Analise
   * - COUNT DISTINCT habilidades planejadas (from PlanejamentoHabilidade)
   * - COUNT DISTINCT habilidades trabalhadas (from Analise.cobertura_json where nivel_cobertura IN ('COMPLETE', 'PARTIAL'))
   * - Calcula % cobertura = trabalhadas / planejadas * 100
   * - CRITICAL: Filtra por escola_id para multi-tenancy
   * - CRITICAL: Filtra apenas análises aprovadas (status = 'APROVADO')
   */
  async getCoberturaPropria(
    professorId: string,
    escolaId: string,
    filtros?: FiltrosCobertura,
  ): Promise<CoberturaResult[]> {
    // Query: JOIN Planejamento, PlanejamentoHabilidade, Turma, Aula, Analise
    // Calcula: % cobertura = habilidades trabalhadas (COMPLETE/PARTIAL) / habilidades planejadas
    //
    // CRITICAL (Story 11.8): This query assumes Turma.curriculo_tipo column exists
    // Migration added in Story 11.2 - if migration failed, query will error
    // TODO Story 11.10: Add startup schema validation or migration smoke test

    const result = await this.prisma.$queryRaw<CoberturaResult[]>`
      SELECT
        t.id as turma_id,
        t.nome as turma_nome,
        t.curriculo_tipo::text as curriculo_tipo,
        p.disciplina::text as disciplina,
        p.bimestre,
        COUNT(DISTINCT ph.habilidade_id)::int as habilidades_planejadas,
        COUNT(DISTINCT CASE
          WHEN (
            SELECT COUNT(*)
            FROM jsonb_array_elements(a.cobertura_json->'habilidades') AS hab
            WHERE hab->>'codigo' = h.codigo
            AND hab->>'nivel_cobertura' IN ('COMPLETE', 'PARTIAL')
          ) > 0
          THEN ph.habilidade_id
        END)::int as habilidades_trabalhadas,
        COALESCE(
          ROUND(
            (COUNT(DISTINCT CASE
              WHEN (
                SELECT COUNT(*)
                FROM jsonb_array_elements(a.cobertura_json->'habilidades') AS hab
                WHERE hab->>'codigo' = h.codigo
                AND hab->>'nivel_cobertura' IN ('COMPLETE', 'PARTIAL')
              ) > 0
              THEN ph.habilidade_id
            END)::numeric / NULLIF(COUNT(DISTINCT ph.habilidade_id), 0)) * 100,
            2
          ),
          0
        )::numeric as percentual_cobertura
      FROM "Planejamento" p
      INNER JOIN "Turma" t ON p.turma_id = t.id AND t.escola_id = ${escolaId}
      LEFT JOIN "PlanejamentoHabilidade" ph ON ph.planejamento_id = p.id
      LEFT JOIN "Habilidade" h ON h.id = ph.habilidade_id
      LEFT JOIN "Aula" au ON au.turma_id = t.id
        AND au.professor_id = ${professorId}
        AND au.escola_id = ${escolaId}
      LEFT JOIN "Analise" a ON a.aula_id = au.id
        AND a.status = 'APROVADO'
      WHERE p.professor_id = ${professorId}
        AND p.escola_id = ${escolaId}
        ${filtros?.turma_id ? Prisma.sql`AND t.id = ${filtros.turma_id}` : Prisma.empty}
        ${filtros?.disciplina ? Prisma.sql`AND p.disciplina = ${filtros.disciplina}` : Prisma.empty}
        ${filtros?.bimestre ? Prisma.sql`AND p.bimestre = ${filtros.bimestre}` : Prisma.empty}
        ${filtros?.curriculo_tipo ? Prisma.sql`AND t.curriculo_tipo = ${filtros.curriculo_tipo}` : Prisma.empty}
      GROUP BY t.id, t.nome, t.curriculo_tipo, p.disciplina, p.bimestre
      ORDER BY p.bimestre ASC, t.nome ASC;
    `;

    return result;
  }

  /**
   * Retorna evolução temporal de cobertura (semana a semana)
   *
   * @param professorId ID do professor
   * @param escolaId ID da escola (multi-tenancy)
   * @param turmaId ID da turma específica
   * @param bimestre Bimestre (1-4)
   * @returns Timeline de habilidades acumuladas + aulas realizadas por semana
   *
   * Query Logic:
   * - GROUP BY week (DATE_TRUNC('week'))
   * - COUNT DISTINCT habilidades trabalhadas (acumulativo)
   * - COUNT aulas realizadas
   * - Filtra por bimestre usando EXTRACT(QUARTER) - bimestre 1 = Q1, etc.
   */
  async getCoberturaTimeline(
    professorId: string,
    escolaId: string,
    turmaId: string,
    bimestre: number,
  ): Promise<TimelineResult[]> {
    // Bimestre → Quarter mapping: B1=Q1, B2=Q2, B3=Q3, B4=Q4
    const quarter = bimestre;

    // Fixed query: Use lateral join to properly aggregate habilidades per week
    const timeline = await this.prisma.$queryRaw<TimelineResult[]>`
      WITH weekly_data AS (
        SELECT
          DATE_TRUNC('week', au.data_aula)::date as semana,
          au.id as aula_id,
          a.cobertura_json->'habilidades' as habilidades_json
        FROM "Aula" au
        INNER JOIN "Analise" a ON a.aula_id = au.id
          AND a.status = 'APROVADO'
        WHERE au.turma_id = ${turmaId}
          AND au.professor_id = ${professorId}
          AND au.escola_id = ${escolaId}
          AND EXTRACT(QUARTER FROM au.data_aula) = ${quarter}
      )
      SELECT
        semana,
        COUNT(DISTINCT (
          SELECT hab->>'codigo'
          FROM weekly_data wd
          CROSS JOIN LATERAL jsonb_array_elements(wd.habilidades_json) AS hab
          WHERE wd.semana = weekly_data.semana
            AND hab->>'nivel_cobertura' IN ('COMPLETE', 'PARTIAL')
        ))::int as habilidades_acumuladas,
        COUNT(DISTINCT aula_id)::int as aulas_realizadas
      FROM weekly_data
      GROUP BY semana
      ORDER BY semana ASC;
    `;

    return timeline;
  }
}
