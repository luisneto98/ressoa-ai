import { Test, TestingModule } from '@nestjs/testing';
import { HabilidadesService } from './habilidades.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { TipoEnsino } from '@prisma/client';

describe('HabilidadesService', () => {
  let service: HabilidadesService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  let redis: jest.Mocked<RedisService>;

  const mockHabilidadesFundamental = [
    {
      id: 'hab-1',
      codigo: 'EF06MA01',
      descricao: 'Comparar, ordenar, ler e escrever números naturais...',
      disciplina: 'MATEMATICA',
      tipo_ensino: TipoEnsino.FUNDAMENTAL,
      ano_inicio: 6,
      ano_fim: null,
      unidade_tematica: 'Números',
      competencia_especifica: null,
      objeto_conhecimento: 'Sistema de numeração decimal',
      metadata: null,
      created_at: new Date(),
      updated_at: new Date(),
      versao_bncc: '2018',
      ativa: true,
    },
    {
      id: 'hab-2',
      codigo: 'EF06MA02',
      descricao: 'Reconhecer o sistema de numeração decimal...',
      disciplina: 'MATEMATICA',
      tipo_ensino: TipoEnsino.FUNDAMENTAL,
      ano_inicio: 6,
      ano_fim: null,
      unidade_tematica: 'Números',
      competencia_especifica: null,
      objeto_conhecimento: 'Sistema de numeração decimal',
      metadata: null,
      created_at: new Date(),
      updated_at: new Date(),
      versao_bncc: '2018',
      ativa: true,
    },
  ];

  const mockHabilidadesMedio = [
    {
      id: 'hab-em-1',
      codigo: 'EM13MAT101',
      descricao:
        'Interpretar criticamente situações econômicas, sociais e fatos...',
      disciplina: 'MATEMATICA',
      tipo_ensino: TipoEnsino.MEDIO,
      ano_inicio: 1,
      ano_fim: 3,
      unidade_tematica: null,
      competencia_especifica: 'Competência Específica 1',
      objeto_conhecimento: null,
      metadata: {
        area_conhecimento: 'Matemática e suas Tecnologias',
      },
      created_at: new Date(),
      updated_at: new Date(),
      versao_bncc: '2018',
      ativa: true,
    },
    {
      id: 'hab-em-2',
      codigo: 'EM13MAT102',
      descricao: 'Analisar tabelas, gráficos e amostras de pesquisas...',
      disciplina: 'MATEMATICA',
      tipo_ensino: TipoEnsino.MEDIO,
      ano_inicio: 1,
      ano_fim: 3,
      unidade_tematica: null,
      competencia_especifica: 'Competência Específica 1',
      objeto_conhecimento: null,
      metadata: {
        area_conhecimento: 'Matemática e suas Tecnologias',
      },
      created_at: new Date(),
      updated_at: new Date(),
      versao_bncc: '2018',
      ativa: true,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HabilidadesService,
        {
          provide: PrismaService,
          useValue: {
            habilidade: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
            $queryRawUnsafe: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            setex: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HabilidadesService>(HabilidadesService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    redis = module.get(RedisService) as jest.Mocked<RedisService>;

    // Default: Redis cache miss (sempre query database)
    redis.get.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll - Story 10.5: tipo_ensino filter', () => {
    it('should filter habilidades by tipo_ensino=MEDIO', async () => {
      // Arrange
      prisma.habilidade.findMany.mockResolvedValue(mockHabilidadesMedio);
      prisma.habilidade.count.mockResolvedValue(2);

      // Act
      const result = await service.findAll({
        tipo_ensino: TipoEnsino.MEDIO,
        disciplina: 'MATEMATICA' as any,
      });

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.data[0].codigo).toBe('EM13MAT101');
      expect(result.data[1].codigo).toBe('EM13MAT102');
      expect(result.total).toBe(2);

      // Verify query includes tipo_ensino filter
      expect(prisma.habilidade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tipo_ensino: TipoEnsino.MEDIO,
            disciplina: 'MATEMATICA',
          }),
        }),
      );
    });

    it('should filter habilidades by tipo_ensino=FUNDAMENTAL', async () => {
      // Arrange
      prisma.habilidade.findMany.mockResolvedValue(mockHabilidadesFundamental);
      prisma.habilidade.count.mockResolvedValue(2);

      // Act
      const result = await service.findAll({
        tipo_ensino: TipoEnsino.FUNDAMENTAL,
        disciplina: 'MATEMATICA' as any,
        serie: 6,
      });

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.data[0].codigo).toBe('EF06MA01');
      expect(result.data[1].codigo).toBe('EF06MA02');
      expect(result.total).toBe(2);

      // Verify query includes tipo_ensino filter
      expect(prisma.habilidade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tipo_ensino: TipoEnsino.FUNDAMENTAL,
            disciplina: 'MATEMATICA',
          }),
        }),
      );
    });

    it('should NOT apply serie filter when tipo_ensino=MEDIO', async () => {
      // Arrange
      prisma.habilidade.findMany.mockResolvedValue(mockHabilidadesMedio);
      prisma.habilidade.count.mockResolvedValue(2);

      // Act
      await service.findAll({
        tipo_ensino: TipoEnsino.MEDIO,
        disciplina: 'MATEMATICA' as any,
        serie: 1, // Serie should be ignored for EM
      });

      // Assert
      const callArgs = prisma.habilidade.findMany.mock.calls[0][0];
      expect(callArgs.where).not.toHaveProperty('AND'); // Serie filter uses AND clause
      expect(callArgs.where.tipo_ensino).toBe(TipoEnsino.MEDIO);
    });

    it('should apply serie filter when tipo_ensino=FUNDAMENTAL', async () => {
      // Arrange
      prisma.habilidade.findMany.mockResolvedValue(mockHabilidadesFundamental);
      prisma.habilidade.count.mockResolvedValue(2);

      // Act
      await service.findAll({
        tipo_ensino: TipoEnsino.FUNDAMENTAL,
        disciplina: 'MATEMATICA' as any,
        serie: 6,
      });

      // Assert
      const callArgs = prisma.habilidade.findMany.mock.calls[0][0];
      expect(callArgs.where).toHaveProperty('AND'); // Serie filter uses AND clause
      expect(callArgs.where.tipo_ensino).toBe(TipoEnsino.FUNDAMENTAL);
    });

    it('should work without tipo_ensino (backward compatibility)', async () => {
      // Arrange
      prisma.habilidade.findMany.mockResolvedValue(mockHabilidadesFundamental);
      prisma.habilidade.count.mockResolvedValue(2);

      // Act
      const result = await service.findAll({
        disciplina: 'MATEMATICA' as any,
        serie: 6,
      });

      // Assert
      expect(result.data).toHaveLength(2);
      expect(prisma.habilidade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            tipo_ensino: expect.anything(),
          }),
        }),
      );
    });

    it('should combine tipo_ensino with other filters (disciplina, unidade_tematica)', async () => {
      // Arrange
      prisma.habilidade.findMany.mockResolvedValue([mockHabilidadesMedio[0]]);
      prisma.habilidade.count.mockResolvedValue(1);

      // Act
      await service.findAll({
        tipo_ensino: TipoEnsino.MEDIO,
        disciplina: 'MATEMATICA' as any,
        unidade_tematica: 'Números',
      });

      // Assert
      expect(prisma.habilidade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tipo_ensino: TipoEnsino.MEDIO,
            disciplina: 'MATEMATICA',
            unidade_tematica: { contains: 'Números' },
          }),
        }),
      );
    });
  });

  describe('findAll - Cache behavior', () => {
    it('should use cache key with tipo_ensino param', async () => {
      // Arrange
      const cacheKey = JSON.stringify({
        disciplina: 'MATEMATICA',
        tipo_ensino: 'MEDIO',
      });

      // Act
      await service.findAll({
        tipo_ensino: TipoEnsino.MEDIO,
        disciplina: 'MATEMATICA' as any,
      });

      // Assert
      expect(redis.get).toHaveBeenCalledWith(
        expect.stringContaining('habilidades:'),
      );
    });

    it('should cache results with tipo_ensino filter', async () => {
      // Arrange
      prisma.habilidade.findMany.mockResolvedValue(mockHabilidadesMedio);
      prisma.habilidade.count.mockResolvedValue(2);

      // Act
      await service.findAll({
        tipo_ensino: TipoEnsino.MEDIO,
        disciplina: 'MATEMATICA' as any,
      });

      // Assert
      expect(redis.setex).toHaveBeenCalledWith(
        expect.stringContaining('habilidades:'),
        604800, // 7 days TTL
        expect.any(String),
      );
    });
  });

  describe('findAll - Pagination', () => {
    it('should apply limit and offset correctly with tipo_ensino', async () => {
      // Arrange
      prisma.habilidade.findMany.mockResolvedValue([mockHabilidadesMedio[0]]);
      prisma.habilidade.count.mockResolvedValue(10);

      // Act
      const result = await service.findAll({
        tipo_ensino: TipoEnsino.MEDIO,
        disciplina: 'MATEMATICA' as any,
        limit: 5,
        offset: 5,
      });

      // Assert
      expect(result.limit).toBe(5);
      expect(result.offset).toBe(5);
      expect(result.total).toBe(10);
      expect(prisma.habilidade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );
    });
  });
});
