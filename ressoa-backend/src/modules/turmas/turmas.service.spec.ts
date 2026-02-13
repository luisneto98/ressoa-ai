import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TurmasService } from './turmas.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Serie, TipoEnsino } from '@prisma/client';

describe('TurmasService', () => {
  let service: TurmasService;
  let prisma: PrismaService;

  const mockPrismaService = {
    getEscolaIdOrThrow: jest.fn().mockReturnValue('escola-test-123'),
    turma: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurmasService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TurmasService>(TurmasService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Serie/TipoEnsino Validation', () => {
    it('should accept FUNDAMENTAL with SEXTO_ANO', async () => {
      const dto = {
        nome: '6A',
        disciplina: 'MATEMATICA',
        serie: Serie.SEXTO_ANO,
        tipo_ensino: TipoEnsino.FUNDAMENTAL,
        ano_letivo: 2026,
        professor_id: 'uuid-professor',
      };

      mockPrismaService.turma.create.mockResolvedValue({
        id: 'uuid-turma',
        ...dto,
        escola_id: 'escola-test-123',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.create(dto, 'escola-test-123');

      expect(result).toBeDefined();
      expect(result.serie).toBe(Serie.SEXTO_ANO);
      expect(result.tipo_ensino).toBe(TipoEnsino.FUNDAMENTAL);
      expect(mockPrismaService.turma.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          escola_id: 'escola-test-123',
        },
      });
    });

    it('should accept FUNDAMENTAL with SETIMO_ANO', async () => {
      const dto = {
        nome: '7A',
        disciplina: 'MATEMATICA',
        serie: Serie.SETIMO_ANO,
        tipo_ensino: TipoEnsino.FUNDAMENTAL,
        ano_letivo: 2026,
        professor_id: 'uuid-professor',
      };

      mockPrismaService.turma.create.mockResolvedValue({
        id: 'uuid-turma',
        ...dto,
        escola_id: 'escola-test-123',
        created_at: new Date(),
        updated_at: new Date(),
      });

      await expect(service.create(dto, 'escola-test-123')).resolves.toBeDefined();
    });

    it('should accept FUNDAMENTAL with OITAVO_ANO', async () => {
      const dto = {
        nome: '8A',
        disciplina: 'MATEMATICA',
        serie: Serie.OITAVO_ANO,
        tipo_ensino: TipoEnsino.FUNDAMENTAL,
        ano_letivo: 2026,
        professor_id: 'uuid-professor',
      };

      mockPrismaService.turma.create.mockResolvedValue({
        id: 'uuid-turma',
        ...dto,
        escola_id: 'escola-test-123',
        created_at: new Date(),
        updated_at: new Date(),
      });

      await expect(service.create(dto, 'escola-test-123')).resolves.toBeDefined();
    });

    it('should accept FUNDAMENTAL with NONO_ANO', async () => {
      const dto = {
        nome: '9A',
        disciplina: 'MATEMATICA',
        serie: Serie.NONO_ANO,
        tipo_ensino: TipoEnsino.FUNDAMENTAL,
        ano_letivo: 2026,
        professor_id: 'uuid-professor',
      };

      mockPrismaService.turma.create.mockResolvedValue({
        id: 'uuid-turma',
        ...dto,
        escola_id: 'escola-test-123',
        created_at: new Date(),
        updated_at: new Date(),
      });

      await expect(service.create(dto, 'escola-test-123')).resolves.toBeDefined();
    });

    it('should accept MEDIO with PRIMEIRO_ANO_EM', async () => {
      const dto = {
        nome: '1A EM',
        disciplina: 'MATEMATICA',
        serie: Serie.PRIMEIRO_ANO_EM,
        tipo_ensino: TipoEnsino.MEDIO,
        ano_letivo: 2026,
        professor_id: 'uuid-professor',
      };

      mockPrismaService.turma.create.mockResolvedValue({
        id: 'uuid-turma',
        ...dto,
        escola_id: 'escola-test-123',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.create(dto, 'escola-test-123');

      expect(result).toBeDefined();
      expect(result.serie).toBe(Serie.PRIMEIRO_ANO_EM);
      expect(result.tipo_ensino).toBe(TipoEnsino.MEDIO);
    });

    it('should accept MEDIO with SEGUNDO_ANO_EM', async () => {
      const dto = {
        nome: '2A EM',
        disciplina: 'MATEMATICA',
        serie: Serie.SEGUNDO_ANO_EM,
        tipo_ensino: TipoEnsino.MEDIO,
        ano_letivo: 2026,
        professor_id: 'uuid-professor',
      };

      mockPrismaService.turma.create.mockResolvedValue({
        id: 'uuid-turma',
        ...dto,
        escola_id: 'escola-test-123',
        created_at: new Date(),
        updated_at: new Date(),
      });

      await expect(service.create(dto, 'escola-test-123')).resolves.toBeDefined();
    });

    it('should accept MEDIO with TERCEIRO_ANO_EM', async () => {
      const dto = {
        nome: '3A EM',
        disciplina: 'MATEMATICA',
        serie: Serie.TERCEIRO_ANO_EM,
        tipo_ensino: TipoEnsino.MEDIO,
        ano_letivo: 2026,
        professor_id: 'uuid-professor',
      };

      mockPrismaService.turma.create.mockResolvedValue({
        id: 'uuid-turma',
        ...dto,
        escola_id: 'escola-test-123',
        created_at: new Date(),
        updated_at: new Date(),
      });

      await expect(service.create(dto, 'escola-test-123')).resolves.toBeDefined();
    });

    it('should reject FUNDAMENTAL with PRIMEIRO_ANO_EM', async () => {
      const dto = {
        nome: 'Invalid',
        disciplina: 'MATEMATICA',
        serie: Serie.PRIMEIRO_ANO_EM,
        tipo_ensino: TipoEnsino.FUNDAMENTAL,
        ano_letivo: 2026,
        professor_id: 'uuid-professor',
      };

      await expect(service.create(dto, 'escola-test-123'))
        .rejects
        .toThrow(BadRequestException);

      await expect(service.create(dto, 'escola-test-123'))
        .rejects
        .toThrow('incompatível com Ensino Fundamental');
    });

    it('should reject FUNDAMENTAL with SEGUNDO_ANO_EM', async () => {
      const dto = {
        nome: 'Invalid',
        disciplina: 'MATEMATICA',
        serie: Serie.SEGUNDO_ANO_EM,
        tipo_ensino: TipoEnsino.FUNDAMENTAL,
        ano_letivo: 2026,
        professor_id: 'uuid-professor',
      };

      await expect(service.create(dto, 'escola-test-123'))
        .rejects
        .toThrow('incompatível com Ensino Fundamental');
    });

    it('should reject FUNDAMENTAL with TERCEIRO_ANO_EM', async () => {
      const dto = {
        nome: 'Invalid',
        disciplina: 'MATEMATICA',
        serie: Serie.TERCEIRO_ANO_EM,
        tipo_ensino: TipoEnsino.FUNDAMENTAL,
        ano_letivo: 2026,
        professor_id: 'uuid-professor',
      };

      await expect(service.create(dto, 'escola-test-123'))
        .rejects
        .toThrow('incompatível com Ensino Fundamental');
    });

    it('should reject MEDIO with SEXTO_ANO', async () => {
      const dto = {
        nome: 'Invalid',
        disciplina: 'MATEMATICA',
        serie: Serie.SEXTO_ANO,
        tipo_ensino: TipoEnsino.MEDIO,
        ano_letivo: 2026,
        professor_id: 'uuid-professor',
      };

      await expect(service.create(dto, 'escola-test-123'))
        .rejects
        .toThrow(BadRequestException);

      await expect(service.create(dto, 'escola-test-123'))
        .rejects
        .toThrow('incompatível com Ensino Médio');
    });

    it('should reject MEDIO with SETIMO_ANO', async () => {
      const dto = {
        nome: 'Invalid',
        disciplina: 'MATEMATICA',
        serie: Serie.SETIMO_ANO,
        tipo_ensino: TipoEnsino.MEDIO,
        ano_letivo: 2026,
        professor_id: 'uuid-professor',
      };

      await expect(service.create(dto, 'escola-test-123'))
        .rejects
        .toThrow('incompatível com Ensino Médio');
    });

    it('should reject MEDIO with OITAVO_ANO', async () => {
      const dto = {
        nome: 'Invalid',
        disciplina: 'MATEMATICA',
        serie: Serie.OITAVO_ANO,
        tipo_ensino: TipoEnsino.MEDIO,
        ano_letivo: 2026,
        professor_id: 'uuid-professor',
      };

      await expect(service.create(dto, 'escola-test-123'))
        .rejects
        .toThrow('incompatível com Ensino Médio');
    });

    it('should reject MEDIO with NONO_ANO', async () => {
      const dto = {
        nome: 'Invalid',
        disciplina: 'MATEMATICA',
        serie: Serie.NONO_ANO,
        tipo_ensino: TipoEnsino.MEDIO,
        ano_letivo: 2026,
        professor_id: 'uuid-professor',
      };

      await expect(service.create(dto, 'escola-test-123'))
        .rejects
        .toThrow('incompatível com Ensino Médio');
    });
  });

  describe('Update with validation', () => {
    it('should validate compatibility when updating serie', async () => {
      const turmaExistente = {
        id: 'uuid-turma',
        nome: '6A',
        disciplina: 'MATEMATICA',
        serie: Serie.SEXTO_ANO,
        tipo_ensino: TipoEnsino.FUNDAMENTAL,
        ano_letivo: 2026,
        escola_id: 'escola-test-123',
        professor_id: 'uuid-professor',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrismaService.turma.findUnique.mockResolvedValue(turmaExistente);

      // Tentar alterar para série incompatível
      const dto = {
        serie: Serie.PRIMEIRO_ANO_EM, // Incompatível com FUNDAMENTAL
      };

      await expect(service.update('uuid-turma', dto))
        .rejects
        .toThrow('incompatível com Ensino Fundamental');
    });

    it('should validate compatibility when updating tipo_ensino', async () => {
      const turmaExistente = {
        id: 'uuid-turma',
        nome: '6A',
        disciplina: 'MATEMATICA',
        serie: Serie.SEXTO_ANO,
        tipo_ensino: TipoEnsino.FUNDAMENTAL,
        ano_letivo: 2026,
        escola_id: 'escola-test-123',
        professor_id: 'uuid-professor',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrismaService.turma.findUnique.mockResolvedValue(turmaExistente);

      // Tentar alterar tipo_ensino para incompatível
      const dto = {
        tipo_ensino: TipoEnsino.MEDIO, // Incompatível com SEXTO_ANO
      };

      await expect(service.update('uuid-turma', dto))
        .rejects
        .toThrow('incompatível com Ensino Médio');
    });

    it('should allow update when changing both to compatible values', async () => {
      const turmaExistente = {
        id: 'uuid-turma',
        nome: '6A',
        disciplina: 'MATEMATICA',
        serie: Serie.SEXTO_ANO,
        tipo_ensino: TipoEnsino.FUNDAMENTAL,
        ano_letivo: 2026,
        escola_id: 'escola-test-123',
        professor_id: 'uuid-professor',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrismaService.turma.findUnique.mockResolvedValue(turmaExistente);
      mockPrismaService.turma.update.mockResolvedValue({
        ...turmaExistente,
        serie: Serie.PRIMEIRO_ANO_EM,
        tipo_ensino: TipoEnsino.MEDIO,
      });

      const dto = {
        serie: Serie.PRIMEIRO_ANO_EM,
        tipo_ensino: TipoEnsino.MEDIO,
      };

      const result = await service.update('uuid-turma', dto);

      expect(result).toBeDefined();
      expect(mockPrismaService.turma.update).toHaveBeenCalledWith({
        where: { id: 'uuid-turma', escola_id: 'escola-test-123' },
        data: dto,
      });
    });

    it('should throw NotFoundException when turma does not exist', async () => {
      mockPrismaService.turma.findUnique.mockResolvedValue(null);

      const dto = {
        serie: Serie.SETIMO_ANO,
      };

      await expect(service.update('uuid-inexistente', dto))
        .rejects
        .toThrow(NotFoundException);
    });
  });
});
