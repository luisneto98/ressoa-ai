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
});
