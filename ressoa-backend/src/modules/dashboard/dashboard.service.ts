import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FiltrosDashboardDto } from './dto/filtros-dashboard.dto';
import { Prisma } from '@prisma/client';

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
        (m) => Number(m.media_cobertura) < 70,
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
}
