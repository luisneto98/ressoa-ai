import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('getMetricasPorProfessor', () => {
    it('should return metricas and resumo for all professors', async () => {
      // Note: PostgreSQL COUNT/SUM returns number, not BigInt, when used in $queryRaw
      const mockMetricas = [
        {
          professor_id: 'prof-1',
          professor_nome: 'Maria Silva',
          disciplina: 'MATEMATICA',
          total_turmas: 3,
          media_cobertura: 85.5,
          total_habilidades_planejadas: 45,
          total_habilidades_trabalhadas: 38,
          total_aulas: 24,
          tempo_medio_revisao: 180,
        },
        {
          professor_id: 'prof-2',
          professor_nome: 'João Santos',
          disciplina: 'MATEMATICA',
          total_turmas: 2,
          media_cobertura: 62.0,
          total_habilidades_planejadas: 30,
          total_habilidades_trabalhadas: 19,
          total_aulas: 16,
          tempo_medio_revisao: 420,
        },
      ];

      mockPrismaService.$queryRaw.mockResolvedValue(mockMetricas);

      const result = await service.getMetricasPorProfessor('escola-123', {});

      expect(result.metricas).toHaveLength(2);
      expect(result.resumo.total_professores).toBe(2);
      expect(result.resumo.media_geral).toBeCloseTo(73.75, 2);
      expect(result.resumo.professores_abaixo_meta).toBe(1);
      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should filter by bimestre when provided', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      await service.getMetricasPorProfessor('escola-123', { bimestre: 1 });

      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);
      // Verify escola_id is always enforced (multi-tenancy!)
      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should filter by disciplina when provided', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      await service.getMetricasPorProfessor('escola-123', {
        disciplina: 'MATEMATICA',
      });

      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);
      // Verify escola_id is always enforced (multi-tenancy!)
      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should calculate resumo correctly with no professors', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      const result = await service.getMetricasPorProfessor('escola-123', {});

      expect(result.metricas).toHaveLength(0);
      expect(result.resumo.total_professores).toBe(0);
      expect(result.resumo.media_geral).toBe(0);
      expect(result.resumo.professores_abaixo_meta).toBe(0);
    });

    it('should count professors below 70% threshold', async () => {
      const mockMetricas = [
        {
          professor_id: 'prof-1',
          professor_nome: 'Prof A',
          disciplina: 'MATEMATICA',
          total_turmas: 1,
          media_cobertura: 65.0,
          total_habilidades_planejadas: 10,
          total_habilidades_trabalhadas: 6,
          total_aulas: 5,
          tempo_medio_revisao: 200,
        },
        {
          professor_id: 'prof-2',
          professor_nome: 'Prof B',
          disciplina: 'MATEMATICA',
          total_turmas: 1,
          media_cobertura: 45.0,
          total_habilidades_planejadas: 10,
          total_habilidades_trabalhadas: 4,
          total_aulas: 4,
          tempo_medio_revisao: 300,
        },
      ];

      mockPrismaService.$queryRaw.mockResolvedValue(mockMetricas);

      const result = await service.getMetricasPorProfessor('escola-123', {});

      expect(result.resumo.professores_abaixo_meta).toBe(2);
    });
  });

  describe('getTurmasPorProfessor', () => {
    it('should return turmas for specific professor', async () => {
      const mockTurmas = [
        {
          turma_id: 'turma-1',
          turma_nome: '6º Ano B',
          turma_serie: '6_ANO',
          disciplina: 'MATEMATICA',
          bimestre: 1,
          percentual_cobertura: 58.0,
          habilidades_planejadas: 15,
          habilidades_trabalhadas: 9,
          total_aulas_aprovadas: 8,
        },
        {
          turma_id: 'turma-2',
          turma_nome: '6º Ano A',
          turma_serie: '6_ANO',
          disciplina: 'MATEMATICA',
          bimestre: 1,
          percentual_cobertura: 65.0,
          habilidades_planejadas: 15,
          habilidades_trabalhadas: 10,
          total_aulas_aprovadas: 8,
        },
      ];

      mockPrismaService.$queryRaw.mockResolvedValue(mockTurmas);

      const result = await service.getTurmasPorProfessor(
        'escola-123',
        'prof-1',
        {},
      );

      expect(result.turmas).toHaveLength(2);
      expect(result.turmas[0].turma_nome).toBe('6º Ano B');
      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should filter by bimestre for turmas', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      await service.getTurmasPorProfessor('escola-123', 'prof-1', {
        bimestre: 2,
      });

      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);
      // Verify multi-tenancy enforcement
      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should enforce multi-tenancy with escola_id in query', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      await service.getTurmasPorProfessor('escola-123', 'prof-1', {});

      // Verify that escola_id is enforced (critical for multi-tenancy!)
      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);
      const callArgs = mockPrismaService.$queryRaw.mock.calls[0];
      expect(callArgs[1]).toBe('escola-123');
      expect(callArgs[2]).toBe('prof-1');
    });

  });

  describe('getMetricasPorTurma', () => {
    it('should return metricas grouped by turma with classification', async () => {
      const mockMetricas = [
        {
          turma_id: 'turma-1',
          turma_nome: '6º Ano A',
          turma_serie: '6_ANO',
          disciplina: 'MATEMATICA',
          bimestre: 1,
          percentual_cobertura: 85.5,
          habilidades_planejadas: 15,
          habilidades_trabalhadas: 13,
          total_aulas: 10,
          professores: 'Maria Silva',
        },
        {
          turma_id: 'turma-2',
          turma_nome: '6º Ano B',
          turma_serie: '6_ANO',
          disciplina: 'MATEMATICA',
          bimestre: 1,
          percentual_cobertura: 45.0,
          habilidades_planejadas: 15,
          habilidades_trabalhadas: 7,
          total_aulas: 5,
          professores: 'João Santos',
        },
        {
          turma_id: 'turma-3',
          turma_nome: '7º Ano A',
          turma_serie: '7_ANO',
          disciplina: 'MATEMATICA',
          bimestre: 1,
          percentual_cobertura: 65.0,
          habilidades_planejadas: 18,
          habilidades_trabalhadas: 12,
          total_aulas: 8,
          professores: 'Maria Silva, Carlos Souza',
        },
      ];

      mockPrismaService.$queryRaw.mockResolvedValue(mockMetricas);

      const result = await service.getMetricasPorTurma('escola-1', { bimestre: 1 });

      expect(result.metricas).toHaveLength(3);
      expect(result.classificacao).toEqual({
        criticas: 1, // turma-2 (45%)
        atencao: 1, // turma-3 (65%)
        no_ritmo: 1, // turma-1 (85.5%)
      });
      expect(result.turmas_priorizadas).toHaveLength(1);
      expect(result.turmas_priorizadas[0].turma_id).toBe('turma-2');
    });

    it('should apply bimestre filter', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      await service.getMetricasPorTurma('escola-1', { bimestre: 2 });

      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should apply disciplina filter', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      await service.getMetricasPorTurma('escola-1', {
        disciplina: 'MATEMATICA',
      });

      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should enforce multi-tenancy (escola_id)', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      await service.getMetricasPorTurma('escola-1', {});

      // Verify that escola_id is enforced in query
      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);
      const callArgs = mockPrismaService.$queryRaw.mock.calls[0];
      expect(callArgs[1]).toBe('escola-1');
    });

    it('should classify turmas correctly by thresholds', async () => {
      const mockMetricas = [
        {
          turma_id: 'turma-1',
          turma_nome: 'Turma Crítica 1',
          turma_serie: '6_ANO',
          disciplina: 'MATEMATICA',
          bimestre: 1,
          percentual_cobertura: 30.0, // < 50% crítico
          habilidades_planejadas: 10,
          habilidades_trabalhadas: 3,
          total_aulas: 2,
          professores: 'Prof A',
        },
        {
          turma_id: 'turma-2',
          turma_nome: 'Turma Crítica 2',
          turma_serie: '6_ANO',
          disciplina: 'MATEMATICA',
          bimestre: 1,
          percentual_cobertura: 49.0, // < 50% crítico
          habilidades_planejadas: 10,
          habilidades_trabalhadas: 5,
          total_aulas: 3,
          professores: 'Prof B',
        },
        {
          turma_id: 'turma-3',
          turma_nome: 'Turma Atenção',
          turma_serie: '6_ANO',
          disciplina: 'MATEMATICA',
          bimestre: 1,
          percentual_cobertura: 60.0, // 50-70% atenção
          habilidades_planejadas: 10,
          habilidades_trabalhadas: 6,
          total_aulas: 5,
          professores: 'Prof C',
        },
        {
          turma_id: 'turma-4',
          turma_nome: 'Turma No Ritmo',
          turma_serie: '6_ANO',
          disciplina: 'MATEMATICA',
          bimestre: 1,
          percentual_cobertura: 80.0, // >= 70% no ritmo
          habilidades_planejadas: 10,
          habilidades_trabalhadas: 8,
          total_aulas: 8,
          professores: 'Prof D',
        },
      ];

      mockPrismaService.$queryRaw.mockResolvedValue(mockMetricas);

      const result = await service.getMetricasPorTurma('escola-1', {});

      expect(result.classificacao.criticas).toBe(2);
      expect(result.classificacao.atencao).toBe(1);
      expect(result.classificacao.no_ritmo).toBe(1);
    });

    it('should return top 5 prioritized classes', async () => {
      const mockMetricas = Array.from({ length: 10 }, (_, i) => ({
        turma_id: `turma-${i}`,
        turma_nome: `Turma ${i}`,
        turma_serie: '6_ANO',
        disciplina: 'MATEMATICA',
        bimestre: 1,
        percentual_cobertura: 40.0, // All critical
        habilidades_planejadas: 10,
        habilidades_trabalhadas: 4,
        total_aulas: 3,
        professores: 'Prof',
      }));

      mockPrismaService.$queryRaw.mockResolvedValue(mockMetricas);

      const result = await service.getMetricasPorTurma('escola-1', {});

      expect(result.turmas_priorizadas).toHaveLength(5); // Top 5 only
    });
  });

  describe('getDetalhesTurma', () => {
    it('should return habilidades with status', async () => {
      const mockDetalhes = [
        {
          habilidade_codigo: 'EF06MA01',
          habilidade_descricao: 'Sistema de numeração decimal',
          status_cobertura: 'COMPLETE',
          aulas_relacionadas: 3,
        },
        {
          habilidade_codigo: 'EF06MA02',
          habilidade_descricao: 'Números naturais',
          status_cobertura: 'NOT_COVERED',
          aulas_relacionadas: 0,
        },
        {
          habilidade_codigo: 'EF06MA03',
          habilidade_descricao: 'Operações básicas',
          status_cobertura: 'PARTIAL',
          aulas_relacionadas: 1,
        },
        {
          habilidade_codigo: 'EF06MA04',
          habilidade_descricao: 'Frações',
          status_cobertura: 'MENTIONED',
          aulas_relacionadas: 1,
        },
      ];

      mockPrismaService.$queryRaw.mockResolvedValue(mockDetalhes);

      const result = await service.getDetalhesTurma('escola-1', 'turma-1', 1);

      expect(result.detalhes).toHaveLength(4);
      expect(result.detalhes[0].status_cobertura).toBe('COMPLETE');
      expect(result.detalhes[1].status_cobertura).toBe('NOT_COVERED');
      expect(result.detalhes[2].status_cobertura).toBe('PARTIAL');
      expect(result.detalhes[3].status_cobertura).toBe('MENTIONED');
    });

    it('should enforce multi-tenancy (escola_id + turma_id)', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      await service.getDetalhesTurma('escola-1', 'turma-1', 1);

      // Verify that both escola_id and turma_id are enforced
      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);
      const callArgs = mockPrismaService.$queryRaw.mock.calls[0];
      expect(callArgs[1]).toBe('turma-1');
      expect(callArgs[2]).toBe('escola-1');
    });

    it('should work without bimestre filter', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      await service.getDetalhesTurma('escola-1', 'turma-1');

      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no habilidades planejadas', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      const result = await service.getDetalhesTurma('escola-1', 'turma-1', 1);

      expect(result.detalhes).toHaveLength(0);
    });
  });

  describe('getMetricasEscola', () => {
    it('should return KPIs, por_disciplina, and evolucao_temporal', async () => {
      // Mock Query 1: KPIs
      const mockKPIs = [
        {
          cobertura_geral: 72.5,
          total_professores_ativos: BigInt(15),
          total_turmas: BigInt(40),
          total_aulas: BigInt(320),
          tempo_medio_revisao_geral: 210.0,
        },
      ];

      // Mock Query 2: Por Disciplina
      const mockPorDisciplina = [
        {
          disciplina: 'MATEMATICA',
          cobertura_media: 75.8,
          total_turmas: BigInt(15),
          total_aulas: BigInt(120),
        },
        {
          disciplina: 'CIENCIAS',
          cobertura_media: 71.2,
          total_turmas: BigInt(15),
          total_aulas: BigInt(105),
        },
        {
          disciplina: 'LINGUA_PORTUGUESA',
          cobertura_media: 70.5,
          total_turmas: BigInt(10),
          total_aulas: BigInt(95),
        },
      ];

      // Mock Query 2: Breakdown by tipo_ensino (Story 10.8)
      const mockBreakdown = [
        {
          tipo_ensino: 'FUNDAMENTAL',
          cobertura_media: 73.0,
          total_turmas: BigInt(25),
        },
        {
          tipo_ensino: 'MEDIO',
          cobertura_media: 72.0,
          total_turmas: BigInt(15),
        },
      ];

      // Mock Query 3: Por Disciplina
      // Mock Query 4: Evolução Temporal
      const mockEvolucao = [
        { bimestre: 1, cobertura_media: 72.5 },
        { bimestre: 3, cobertura_media: 68.0 },
      ];

      mockPrismaService.$queryRaw
        .mockResolvedValueOnce(mockKPIs) // Query 1: KPIs
        .mockResolvedValueOnce(mockBreakdown) // Query 2: Breakdown (Story 10.8)
        .mockResolvedValueOnce(mockPorDisciplina) // Query 3: Por Disciplina
        .mockResolvedValueOnce(mockEvolucao); // Query 4: Evolução

      const result = await service.getMetricasEscola('escola-123');

      // Validate KPIs
      expect(result.kpis.cobertura_geral).toBe(72.5);
      expect(result.kpis.total_professores_ativos).toBe(15);
      expect(result.kpis.total_turmas).toBe(40);
      expect(result.kpis.total_aulas).toBe(320);
      expect(result.kpis.tempo_medio_revisao_geral).toBe(210);

      // Validate breakdown (Story 10.8)
      expect(result.kpis.cobertura_fundamental).toBe(73.0);
      expect(result.kpis.cobertura_medio).toBe(72.0);

      // Validate por_disciplina (BigInt converted to Number)
      expect(result.por_disciplina).toHaveLength(3);
      expect(result.por_disciplina[0].disciplina).toBe('MATEMATICA');
      expect(result.por_disciplina[0].cobertura_media).toBe(75.8);
      expect(result.por_disciplina[0].total_turmas).toBe(15);
      expect(result.por_disciplina[0].total_aulas).toBe(120);

      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(4); // Changed from 3 to 4 (Story 10.8)
    });

    it('should filter KPIs and por_disciplina by bimestre', async () => {
      const mockKPIs = [
        {
          cobertura_geral: 75.0,
          total_professores_ativos: BigInt(12),
          total_turmas: BigInt(35),
          total_aulas: BigInt(280),
          tempo_medio_revisao_geral: 200.0,
        },
      ];

      const mockBreakdown = [];
      const mockPorDisciplina = [
        {
          disciplina: 'MATEMATICA',
          cobertura_media: 78.0,
          total_turmas: BigInt(12),
          total_aulas: BigInt(100),
        },
      ];
      const mockEvolucao = [
        { bimestre: 1, cobertura_media: 75.0 },
      ];

      mockPrismaService.$queryRaw
        .mockResolvedValueOnce(mockKPIs)
        .mockResolvedValueOnce(mockBreakdown)
        .mockResolvedValueOnce(mockPorDisciplina)
        .mockResolvedValueOnce(mockEvolucao);

      const result = await service.getMetricasEscola('escola-123', 1);

      expect(result.kpis.cobertura_geral).toBe(75.0);
      expect(result.por_disciplina).toHaveLength(1);
      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(4);
    });

    it('should handle empty results with default values', async () => {
      mockPrismaService.$queryRaw
        .mockResolvedValueOnce([]) // Empty KPIs
        .mockResolvedValueOnce([]) // Empty breakdown
        .mockResolvedValueOnce([]) // Empty por_disciplina
        .mockResolvedValueOnce([]); // Empty evolucao

      const result = await service.getMetricasEscola('escola-123');

      // Default KPIs when no data
      expect(result.kpis.cobertura_geral).toBe(0);
      expect(result.kpis.total_professores_ativos).toBe(0);
      expect(result.kpis.total_turmas).toBe(0);
      expect(result.kpis.total_aulas).toBe(0);
      expect(result.kpis.tempo_medio_revisao_geral).toBe(0);

      // Empty por_disciplina
      expect(result.por_disciplina).toHaveLength(0);
    });

    it('should enforce multi-tenancy (escola_id in all queries)', async () => {
      const mockKPIs = [{
        cobertura_geral: 70.0,
        total_professores_ativos: BigInt(10),
        total_turmas: BigInt(30),
        total_aulas: BigInt(250),
        tempo_medio_revisao_geral: 180.0,
      }];

      mockPrismaService.$queryRaw
        .mockResolvedValueOnce(mockKPIs)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await service.getMetricasEscola('escola-456');

      // Verify escola_id is passed to all 4 queries
      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(4);
      const callArgs1 = mockPrismaService.$queryRaw.mock.calls[0];
      const callArgs2 = mockPrismaService.$queryRaw.mock.calls[1];

      expect(callArgs1[1]).toBe('escola-456'); // Query 1: KPIs
      expect(callArgs2[1]).toBe('escola-456'); // Query 2: breakdown
    });

    it('should convert BigInt to Number for all count fields', async () => {
      const mockKPIs = [
        {
          cobertura_geral: 72.5,
          total_professores_ativos: BigInt(999),
          total_turmas: BigInt(888),
          total_aulas: BigInt(777),
          tempo_medio_revisao_geral: 210.0,
        },
      ];

      const mockBreakdown = [];
      const mockPorDisciplina = [
        {
          disciplina: 'MATEMATICA',
          cobertura_media: 75.0,
          total_turmas: BigInt(555),
          total_aulas: BigInt(444),
        },
      ];
      const mockEvolucao = [];

      mockPrismaService.$queryRaw
        .mockResolvedValueOnce(mockKPIs)
        .mockResolvedValueOnce(mockBreakdown)
        .mockResolvedValueOnce(mockPorDisciplina)
        .mockResolvedValueOnce(mockEvolucao);

      const result = await service.getMetricasEscola('escola-123');

      // Verify BigInt → Number conversion
      expect(typeof result.kpis.total_professores_ativos).toBe('number');
      expect(typeof result.kpis.total_turmas).toBe('number');
      expect(typeof result.kpis.total_aulas).toBe('number');
      expect(result.kpis.total_professores_ativos).toBe(999);
      expect(result.kpis.total_turmas).toBe(888);
      expect(result.kpis.total_aulas).toBe(777);

      expect(typeof result.por_disciplina[0].total_turmas).toBe('number');
      expect(typeof result.por_disciplina[0].total_aulas).toBe('number');
      expect(result.por_disciplina[0].total_turmas).toBe(555);
      expect(result.por_disciplina[0].total_aulas).toBe(444);
    });

    it('should order por_disciplina by cobertura DESC', async () => {
      const mockKPIs = [{
        cobertura_geral: 70.0,
        total_professores_ativos: BigInt(10),
        total_turmas: BigInt(30),
        total_aulas: BigInt(250),
        tempo_medio_revisao_geral: 180.0,
      }];

      const mockBreakdown = [];
      const mockPorDisciplina = [
        { disciplina: 'MATEMATICA', cobertura_media: 80.0, total_turmas: BigInt(10), total_aulas: BigInt(100) },
        { disciplina: 'LINGUA_PORTUGUESA', cobertura_media: 65.0, total_turmas: BigInt(10), total_aulas: BigInt(90) },
        { disciplina: 'CIENCIAS', cobertura_media: 70.0, total_turmas: BigInt(10), total_aulas: BigInt(95) },
      ];
      const mockEvolucao = [];

      mockPrismaService.$queryRaw
        .mockResolvedValueOnce(mockKPIs)
        .mockResolvedValueOnce(mockBreakdown)
        .mockResolvedValueOnce(mockPorDisciplina)
        .mockResolvedValueOnce(mockEvolucao)
        .mockResolvedValueOnce([]);

      const result = await service.getMetricasEscola('escola-123');

      // Mock data is already ordered DESC, verify order is preserved
      expect(result.por_disciplina[0].disciplina).toBe('MATEMATICA');
      expect(result.por_disciplina[0].cobertura_media).toBe(80.0);
      expect(result.por_disciplina[1].disciplina).toBe('LINGUA_PORTUGUESA');
      expect(result.por_disciplina[1].cobertura_media).toBe(65.0);
      expect(result.por_disciplina[2].disciplina).toBe('CIENCIAS');
      expect(result.por_disciplina[2].cobertura_media).toBe(70.0);
    });
  });

  // === Story 10.8: Tests for tipo_ensino filtering (optimized queries without JOIN) ===
  describe('Story 10.8: tipo_ensino filtering (AC3, AC6)', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('getMetricasPorProfessor with tipo_ensino filter', () => {
      it('should filter professors by tipo_ensino MEDIO', async () => {
        const mockMetricas = [
          {
            professor_id: 'prof-1',
            professor_nome: 'Prof EM',
            disciplina: 'MATEMATICA',
            total_turmas: 2,
            media_cobertura: 78.5,
            total_habilidades_planejadas: 30,
            total_habilidades_trabalhadas: 24,
            total_aulas: 12,
            tempo_medio_revisao: 200,
          },
        ];

        mockPrismaService.$queryRaw.mockResolvedValueOnce(mockMetricas);

        const result = await service.getMetricasPorProfessor('escola-123', {
          tipo_ensino: 'MEDIO',
        });

        expect(result.metricas).toHaveLength(1);
        expect(result.metricas[0].professor_nome).toBe('Prof EM');
        expect(prismaService.$queryRaw).toHaveBeenCalled();
      });

      it('should filter professors by tipo_ensino FUNDAMENTAL', async () => {
        const mockMetricas = [
          {
            professor_id: 'prof-2',
            professor_nome: 'Prof EF',
            disciplina: 'CIENCIAS',
            total_turmas: 3,
            media_cobertura: 82.0,
            total_habilidades_planejadas: 45,
            total_habilidades_trabalhadas: 37,
            total_aulas: 18,
            tempo_medio_revisao: 150,
          },
        ];

        mockPrismaService.$queryRaw.mockResolvedValueOnce(mockMetricas);

        const result = await service.getMetricasPorProfessor('escola-123', {
          tipo_ensino: 'FUNDAMENTAL',
        });

        expect(result.metricas).toHaveLength(1);
        expect(result.metricas[0].professor_nome).toBe('Prof EF');
      });
    });

    describe('getMetricasPorTurma with tipo_ensino filter', () => {
      it('should filter turmas by tipo_ensino MEDIO', async () => {
        const mockMetricas = [
          {
            turma_id: 'turma-1',
            turma_nome: '1A EM',
            turma_serie: 'PRIMEIRO_ANO_EM',
            disciplina: 'MATEMATICA',
            bimestre: 1,
            percentual_cobertura: 85.0,
            habilidades_planejadas: 25,
            habilidades_trabalhadas: 21,
            total_aulas: 10,
            professores: 'Prof EM',
          },
        ];

        mockPrismaService.$queryRaw.mockResolvedValueOnce(mockMetricas);

        const result = await service.getMetricasPorTurma('escola-123', {
          tipo_ensino: 'MEDIO',
        });

        expect(result.metricas).toHaveLength(1);
        expect(result.metricas[0].turma_nome).toBe('1A EM');
      });
    });

    describe('getMetricasEscola with breakdown by tipo_ensino', () => {
      it('should return breakdown metrics for FUNDAMENTAL and MEDIO (AC6)', async () => {
        const mockKpis = [
          {
            cobertura_geral: 75.5,
            total_professores_ativos: BigInt(10),
            total_turmas: BigInt(50),
            total_aulas: BigInt(200),
            tempo_medio_revisao_geral: 180,
          },
        ];

        const mockBreakdown = [
          {
            tipo_ensino: 'FUNDAMENTAL',
            cobertura_media: 78.0,
            total_turmas: BigInt(30),
          },
          {
            tipo_ensino: 'MEDIO',
            cobertura_media: 72.0,
            total_turmas: BigInt(20),
          },
        ];

        const mockMetricasSeries = [];
        const mockMetricasDisciplinas = [];

        mockPrismaService.$queryRaw
          .mockResolvedValueOnce(mockKpis)
          .mockResolvedValueOnce(mockBreakdown) // Breakdown query
          .mockResolvedValueOnce(mockMetricasSeries)
          .mockResolvedValueOnce(mockMetricasDisciplinas);

        const result = await service.getMetricasEscola('escola-123');

        // Breakdown is returned as part of KPIs
        expect(result.kpis.cobertura_fundamental).toBe(78.0);
        expect(result.kpis.cobertura_medio).toBe(72.0);
        expect(result.kpis.total_turmas_fundamental).toBe(30);
        expect(result.kpis.total_turmas_medio).toBe(20);
        expect(prismaService.$queryRaw).toHaveBeenCalledTimes(4); // KPIs + breakdown + series + disciplinas
      });
    });
  });
});
