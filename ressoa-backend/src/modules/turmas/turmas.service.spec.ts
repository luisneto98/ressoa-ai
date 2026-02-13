import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
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
      findFirst: jest.fn(),
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
        turno: 'MATUTINO',
        professor_id: 'uuid-professor',
      };

      mockPrismaService.turma.findFirst.mockResolvedValue(null); // No duplicates
      mockPrismaService.turma.create.mockResolvedValue({
        id: 'uuid-turma',
        ...dto,
        escola_id: 'escola-test-123',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.create(dto);

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
        turno: 'MATUTINO',
        professor_id: 'uuid-professor',
      };

      mockPrismaService.turma.create.mockResolvedValue({
        id: 'uuid-turma',
        ...dto,
        escola_id: 'escola-test-123',
        created_at: new Date(),
        updated_at: new Date(),
      });

      await expect(service.create(dto)).resolves.toBeDefined();
    });

    it('should accept FUNDAMENTAL with OITAVO_ANO', async () => {
      const dto = {
        nome: '8A',
        disciplina: 'MATEMATICA',
        serie: Serie.OITAVO_ANO,
        tipo_ensino: TipoEnsino.FUNDAMENTAL,
        ano_letivo: 2026,
        turno: 'MATUTINO',
        professor_id: 'uuid-professor',
      };

      mockPrismaService.turma.create.mockResolvedValue({
        id: 'uuid-turma',
        ...dto,
        escola_id: 'escola-test-123',
        created_at: new Date(),
        updated_at: new Date(),
      });

      await expect(service.create(dto)).resolves.toBeDefined();
    });

    it('should accept FUNDAMENTAL with NONO_ANO', async () => {
      const dto = {
        nome: '9A',
        disciplina: 'MATEMATICA',
        serie: Serie.NONO_ANO,
        tipo_ensino: TipoEnsino.FUNDAMENTAL,
        ano_letivo: 2026,
        turno: 'MATUTINO',
        professor_id: 'uuid-professor',
      };

      mockPrismaService.turma.create.mockResolvedValue({
        id: 'uuid-turma',
        ...dto,
        escola_id: 'escola-test-123',
        created_at: new Date(),
        updated_at: new Date(),
      });

      await expect(service.create(dto)).resolves.toBeDefined();
    });

    it('should accept MEDIO with PRIMEIRO_ANO_EM', async () => {
      const dto = {
        nome: '1A EM',
        disciplina: 'MATEMATICA',
        serie: Serie.PRIMEIRO_ANO_EM,
        tipo_ensino: TipoEnsino.MEDIO,
        ano_letivo: 2026,
        turno: 'MATUTINO',
        professor_id: 'uuid-professor',
      };

      mockPrismaService.turma.create.mockResolvedValue({
        id: 'uuid-turma',
        ...dto,
        escola_id: 'escola-test-123',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.create(dto);

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
        turno: 'MATUTINO',
        professor_id: 'uuid-professor',
      };

      mockPrismaService.turma.create.mockResolvedValue({
        id: 'uuid-turma',
        ...dto,
        escola_id: 'escola-test-123',
        created_at: new Date(),
        updated_at: new Date(),
      });

      await expect(service.create(dto)).resolves.toBeDefined();
    });

    it('should accept MEDIO with TERCEIRO_ANO_EM', async () => {
      const dto = {
        nome: '3A EM',
        disciplina: 'MATEMATICA',
        serie: Serie.TERCEIRO_ANO_EM,
        tipo_ensino: TipoEnsino.MEDIO,
        ano_letivo: 2026,
        turno: 'MATUTINO',
        professor_id: 'uuid-professor',
      };

      mockPrismaService.turma.create.mockResolvedValue({
        id: 'uuid-turma',
        ...dto,
        escola_id: 'escola-test-123',
        created_at: new Date(),
        updated_at: new Date(),
      });

      await expect(service.create(dto)).resolves.toBeDefined();
    });

    it('should reject FUNDAMENTAL with PRIMEIRO_ANO_EM', async () => {
      const dto = {
        nome: 'Invalid',
        disciplina: 'MATEMATICA',
        serie: Serie.PRIMEIRO_ANO_EM,
        tipo_ensino: TipoEnsino.FUNDAMENTAL,
        ano_letivo: 2026,
        turno: 'MATUTINO',
        professor_id: 'uuid-professor',
      };

      await expect(service.create(dto))
        .rejects
        .toThrow(BadRequestException);

      await expect(service.create(dto))
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
        turno: 'MATUTINO',
        professor_id: 'uuid-professor',
      };

      await expect(service.create(dto))
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
        turno: 'MATUTINO',
        professor_id: 'uuid-professor',
      };

      await expect(service.create(dto))
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
        turno: 'MATUTINO',
        professor_id: 'uuid-professor',
      };

      await expect(service.create(dto))
        .rejects
        .toThrow(BadRequestException);

      await expect(service.create(dto))
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
        turno: 'MATUTINO',
        professor_id: 'uuid-professor',
      };

      await expect(service.create(dto))
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
        turno: 'MATUTINO',
        professor_id: 'uuid-professor',
      };

      await expect(service.create(dto))
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
        turno: 'MATUTINO',
        professor_id: 'uuid-professor',
      };

      await expect(service.create(dto))
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
        turno: 'MATUTINO',
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
        turno: 'MATUTINO',
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
        turno: 'MATUTINO',
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

  describe('Uniqueness Validation (Story 10.2)', () => {
    it('should throw ConflictException for duplicate nome+ano+turno', async () => {
      // Mock existing turma
      mockPrismaService.turma.findFirst.mockResolvedValue({
        id: 'existing-turma',
        nome: '6A',
        ano_letivo: 2026,
        turno: 'MATUTINO',
        escola_id: 'escola-test-123',
      });

      const dto = {
        nome: '6A',
        disciplina: 'MATEMATICA',
        serie: Serie.SEXTO_ANO,
        tipo_ensino: TipoEnsino.FUNDAMENTAL,
        ano_letivo: 2026,
        turno: 'MATUTINO',
        professor_id: 'uuid-professor',
      };

      await expect(service.create(dto))
        .rejects
        .toThrow(ConflictException);

      await expect(service.create(dto))
        .rejects
        .toThrow("Turma com nome '6A' já existe para 2026 no turno MATUTINO");
    });

    it('should allow same nome+ano but different turno', async () => {
      mockPrismaService.turma.findFirst.mockResolvedValue(null); // No duplicates
      mockPrismaService.turma.create.mockResolvedValue({
        id: 'uuid-turma',
        nome: '6A',
        disciplina: 'MATEMATICA',
        serie: Serie.SEXTO_ANO,
        tipo_ensino: TipoEnsino.FUNDAMENTAL,
        ano_letivo: 2026,
        turno: 'VESPERTINO',
        escola_id: 'escola-test-123',
        professor_id: 'uuid-professor',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const dto = {
        nome: '6A',
        disciplina: 'MATEMATICA',
        serie: Serie.SEXTO_ANO,
        tipo_ensino: TipoEnsino.FUNDAMENTAL,
        ano_letivo: 2026,
        turno: 'VESPERTINO', // Different turno
        professor_id: 'uuid-professor',
      };

      const result = await service.create(dto);

      expect(result).toBeDefined();
      expect(mockPrismaService.turma.findFirst).toHaveBeenCalledWith({
        where: {
          escola_id: 'escola-test-123',
          nome: '6A',
          ano_letivo: 2026,
        turno: 'VESPERTINO',
          deleted_at: null,
        },
      });
    });
  });

  describe('Soft Delete (Story 10.2)', () => {
    it('should soft delete turma by setting deleted_at', async () => {
      mockPrismaService.turma.findUnique.mockResolvedValue({
        id: 'turma-123',
        escola_id: 'escola-test-123',
        nome: '6A',
      });

      await service.remove('turma-123');

      expect(mockPrismaService.turma.update).toHaveBeenCalledWith({
        where: { id: 'turma-123', escola_id: 'escola-test-123' },
        data: { deleted_at: expect.any(Date) },
      });
    });

    it('should throw NotFoundException when turma does not exist', async () => {
      mockPrismaService.turma.findUnique.mockResolvedValue(null);

      await expect(service.remove('uuid-inexistente'))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('findAllByEscola (Story 10.2)', () => {
    it('should return all turmas for escola with deleted_at: null filter', async () => {
      const mockTurmas = [
        {
          id: 'turma-1',
          nome: '6A',
          disciplina: 'MATEMATICA',
          serie: Serie.SEXTO_ANO,
          tipo_ensino: TipoEnsino.FUNDAMENTAL,
          ano_letivo: 2026,
        turno: 'MATUTINO',
          professor: {
            id: 'prof-1',
            nome: 'Professor A',
            email: 'prof.a@escola.com',
          },
        },
        {
          id: 'turma-2',
          nome: '7A',
          disciplina: 'MATEMATICA',
          serie: Serie.SETIMO_ANO,
          tipo_ensino: TipoEnsino.FUNDAMENTAL,
          ano_letivo: 2026,
        turno: 'VESPERTINO',
          professor: {
            id: 'prof-2',
            nome: 'Professor B',
            email: 'prof.b@escola.com',
          },
        },
      ];

      mockPrismaService.turma.findMany.mockResolvedValue(mockTurmas);

      const result = await service.findAllByEscola();

      expect(result).toHaveLength(2);
      expect(mockPrismaService.turma.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            escola_id: 'escola-test-123',
            deleted_at: null,
          },
        })
      );
    });
  });

  describe('findOne with deleted_at filter (Story 10.2)', () => {
    it('should return 404 for soft-deleted turma', async () => {
      mockPrismaService.turma.findFirst.mockResolvedValue(null); // Soft-deleted turmas excluded

      await expect(service.findOne('turma-deletada'))
        .rejects
        .toThrow(NotFoundException);

      expect(mockPrismaService.turma.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deleted_at: null,
          }),
        })
      );
    });
  });

  describe('findAllByProfessor with deleted_at filter (Story 10.2)', () => {
    it('should exclude soft-deleted turmas for professor', async () => {
      const mockTurmas = [
        {
          id: 'turma-1',
          nome: '6A',
          disciplina: 'MATEMATICA',
          serie: Serie.SEXTO_ANO,
          tipo_ensino: TipoEnsino.FUNDAMENTAL,
          ano_letivo: 2026,
          turno: 'MATUTINO',
        },
      ];

      mockPrismaService.turma.findMany.mockResolvedValue(mockTurmas);

      const result = await service.findAllByProfessor('prof-123');

      expect(result).toHaveLength(1);
      expect(mockPrismaService.turma.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            escola_id: 'escola-test-123',
            professor_id: 'prof-123',
            deleted_at: null,
          }),
        })
      );
    });
  });
});
