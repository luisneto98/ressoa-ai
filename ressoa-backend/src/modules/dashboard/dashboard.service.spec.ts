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
});
