import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ObjetivosService } from './objetivos.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateObjetivoCustomDto } from './dto/create-objetivo-custom.dto';
import { UpdateObjetivoCustomDto } from './dto/update-objetivo-custom.dto';
import { NivelBloom, TipoFonte, CurriculoTipo } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

/**
 * Test Suite: ObjetivosService - Custom CRUD
 * Story 11.4: Backend — CRUD de Objetivos Customizados
 *
 * Coverage:
 * - AC1: Criar objetivo customizado
 * - AC2: Validações de negócio
 * - AC3: RBAC (professor, coordenador, diretor)
 * - AC4: Validação curriculo_tipo = CUSTOM
 * - AC5: Listar objetivos
 * - AC6: Buscar objetivo específico
 * - AC7: Atualizar objetivo
 * - AC8: Deletar objetivo (verificar uso em planejamentos)
 */
describe('ObjetivosService - Custom CRUD (Story 11.4)', () => {
  let service: ObjetivosService;
  let prisma: PrismaService;

  const escolaId = 'escola-uuid-123';
  const turmaIdCustom = 'turma-custom-uuid';
  const turmaIdBncc = 'turma-bncc-uuid';
  const professorId = 'prof-uuid-123';
  const coordenadorId = 'coord-uuid-123';

  const mockProfessor: AuthenticatedUser = {
    userId: professorId,
    email: 'prof@escola.com',
    escolaId: escolaId,
    role: 'PROFESSOR',
  };

  const mockCoordenador: AuthenticatedUser = {
    userId: coordenadorId,
    email: 'coord@escola.com',
    escolaId: escolaId,
    role: 'COORDENADOR',
  };

  const mockOutroProfessor: AuthenticatedUser = {
    userId: 'prof-outro-uuid',
    email: 'outro@escola.com',
    escolaId: escolaId,
    role: 'PROFESSOR',
  };

  const mockTurmaCustom = {
    id: turmaIdCustom,
    nome: 'Turma PM Preparatório',
    disciplina: 'MATEMATICA',
    serie: 'NONO_ANO',
    tipo_ensino: 'FUNDAMENTAL',
    curriculo_tipo: CurriculoTipo.CUSTOM,
    contexto_pedagogico: 'Preparatório PM-SP',
    ano_letivo: 2026,
    turno: 'MATUTINO',
    escola_id: escolaId,
    professor_id: professorId,
    professor: { id: professorId, nome: 'Prof', email: 'prof@escola.com' },
    deleted_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockTurmaBncc = {
    ...mockTurmaCustom,
    id: turmaIdBncc,
    nome: '9A',
    curriculo_tipo: CurriculoTipo.BNCC,
    contexto_pedagogico: null,
  };

  const mockObjetivo = {
    id: 'objetivo-uuid-1',
    codigo: 'PM-MAT-01',
    descricao:
      'Resolver problemas de regra de três simples e composta aplicados a PM',
    nivel_cognitivo: NivelBloom.APLICAR,
    tipo_fonte: TipoFonte.CUSTOM,
    turma_id: turmaIdCustom,
    area_conhecimento: 'Matemática - Raciocínio Lógico',
    criterios_evidencia: [
      'Identifica grandezas proporcionais',
      'Monta proporção corretamente',
    ],
    habilidade_bncc_id: null,
    contexto_json: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockCreateDto: CreateObjetivoCustomDto = {
    codigo: 'PM-MAT-01',
    descricao:
      'Resolver problemas de regra de três simples e composta aplicados a PM',
    nivel_cognitivo: NivelBloom.APLICAR,
    area_conhecimento: 'Matemática - Raciocínio Lógico',
    criterios_evidencia: [
      'Identifica grandezas proporcionais',
      'Monta proporção corretamente',
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ObjetivosService,
        {
          provide: PrismaService,
          useValue: {
            getEscolaIdOrThrow: jest.fn().mockReturnValue(escolaId),
            turma: {
              findUnique: jest.fn(),
            },
            objetivoAprendizagem: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            planejamentoObjetivo: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ObjetivosService>(ObjetivosService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCustom()', () => {
    it('AC1: Deve criar objetivo customizado com dados válidos', async () => {
      jest.spyOn(prisma.turma, 'findUnique').mockResolvedValue(mockTurmaCustom as any);
      jest.spyOn(prisma.objetivoAprendizagem, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.objetivoAprendizagem, 'create').mockResolvedValue(mockObjetivo);

      const result = await service.createCustom(turmaIdCustom, mockCreateDto, mockProfessor);

      expect(result).toEqual(mockObjetivo);
      expect(prisma.objetivoAprendizagem.create).toHaveBeenCalledWith({
        data: {
          codigo: mockCreateDto.codigo,
          descricao: mockCreateDto.descricao,
          nivel_cognitivo: mockCreateDto.nivel_cognitivo,
          tipo_fonte: TipoFonte.CUSTOM, // ✅ AC1: setado automaticamente
          turma_id: turmaIdCustom,
          area_conhecimento: mockCreateDto.area_conhecimento,
          criterios_evidencia: mockCreateDto.criterios_evidencia,
          habilidade_bncc_id: null,
        },
      });
    });

    it('AC4: Deve rejeitar se turma não for CUSTOM (400)', async () => {
      jest.spyOn(prisma.turma, 'findUnique').mockResolvedValue(mockTurmaBncc as any);

      await expect(
        service.createCustom(turmaIdBncc, mockCreateDto, mockProfessor),
      ).rejects.toThrow(
        new BadRequestException(
          'Objetivos customizados só podem ser criados em turmas com curriculo_tipo = CUSTOM. Esta turma usa BNCC.',
        ),
      );
    });

    it('AC2: Deve rejeitar se código duplicado na turma (409)', async () => {
      jest.spyOn(prisma.turma, 'findUnique').mockResolvedValue(mockTurmaCustom as any);
      jest
        .spyOn(prisma.objetivoAprendizagem, 'findFirst')
        .mockResolvedValue(mockObjetivo);

      await expect(
        service.createCustom(turmaIdCustom, mockCreateDto, mockProfessor),
      ).rejects.toThrow(
        new ConflictException(`Código ${mockCreateDto.codigo} já existe nesta turma`),
      );
    });

    it('AC3: Deve aplicar RBAC - professor só cria em turma própria', async () => {
      jest.spyOn(prisma.turma, 'findUnique').mockResolvedValue(mockTurmaCustom as any);

      await expect(
        service.createCustom(turmaIdCustom, mockCreateDto, mockOutroProfessor),
      ).rejects.toThrow(
        new ForbiddenException('Você não tem permissão para criar objetivos nesta turma'),
      );
    });

    it('AC3: Coordenador pode criar em qualquer turma da escola (201)', async () => {
      jest.spyOn(prisma.turma, 'findUnique').mockResolvedValue(mockTurmaCustom as any);
      jest.spyOn(prisma.objetivoAprendizagem, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.objetivoAprendizagem, 'create').mockResolvedValue(mockObjetivo);

      const result = await service.createCustom(
        turmaIdCustom,
        mockCreateDto,
        mockCoordenador,
      );

      expect(result).toEqual(mockObjetivo);
    });

    it('Multi-tenancy: Deve validar escola_id na busca da turma', async () => {
      jest.spyOn(prisma.turma, 'findUnique').mockResolvedValue(null);

      await expect(
        service.createCustom(turmaIdCustom, mockCreateDto, mockProfessor),
      ).rejects.toThrow(new NotFoundException('Turma não encontrada'));

      expect(prisma.turma.findUnique).toHaveBeenCalledWith({
        where: {
          id: turmaIdCustom,
          escola_id: escolaId, // ✅ Multi-tenancy
          deleted_at: null,
        },
        include: { professor: true },
      });
    });
  });

  describe('findAllByTurma()', () => {
    it('AC5: Deve retornar objetivos da turma ordenados por created_at', async () => {
      const objetivos = [
        { ...mockObjetivo, id: '1', created_at: new Date('2026-01-01') },
        { ...mockObjetivo, id: '2', created_at: new Date('2026-01-02') },
      ];

      jest.spyOn(prisma.turma, 'findUnique').mockResolvedValue(mockTurmaCustom as any);
      jest.spyOn(prisma.objetivoAprendizagem, 'findMany').mockResolvedValue(objetivos);

      const result = await service.findAllByTurma(turmaIdCustom, mockProfessor);

      expect(result).toEqual(objetivos);
      expect(prisma.objetivoAprendizagem.findMany).toHaveBeenCalledWith({
        where: {
          turma_id: turmaIdCustom,
          tipo_fonte: TipoFonte.CUSTOM,
        },
        orderBy: { created_at: 'asc' },
      });
    });

    it('AC5: Deve retornar array vazio para turma BNCC (200, sem erro)', async () => {
      jest.spyOn(prisma.turma, 'findUnique').mockResolvedValue(mockTurmaBncc as any);
      jest.spyOn(prisma.objetivoAprendizagem, 'findMany').mockResolvedValue([]);

      const result = await service.findAllByTurma(turmaIdBncc, mockProfessor);

      expect(result).toEqual([]);
    });

    it('AC5: Deve aplicar RBAC - professor só lista turmas próprias (403)', async () => {
      jest.spyOn(prisma.turma, 'findUnique').mockResolvedValue(mockTurmaCustom as any);

      await expect(
        service.findAllByTurma(turmaIdCustom, mockOutroProfessor),
      ).rejects.toThrow(
        new ForbiddenException(
          'Você não tem permissão para listar objetivos desta turma',
        ),
      );
    });
  });

  describe('findOneByTurma()', () => {
    it('AC6: Deve retornar objetivo específico por ID', async () => {
      jest.spyOn(prisma.turma, 'findUnique').mockResolvedValue(mockTurmaCustom as any);
      jest
        .spyOn(prisma.objetivoAprendizagem, 'findFirst')
        .mockResolvedValue(mockObjetivo);

      const result = await service.findOneByTurma(
        turmaIdCustom,
        mockObjetivo.id,
        mockProfessor,
      );

      expect(result).toEqual(mockObjetivo);
      expect(prisma.objetivoAprendizagem.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockObjetivo.id,
          turma_id: turmaIdCustom, // ✅ Isolamento por turma
        },
      });
    });

    it('AC6: Deve retornar 404 se objetivo não existe', async () => {
      jest.spyOn(prisma.turma, 'findUnique').mockResolvedValue(mockTurmaCustom as any);
      jest.spyOn(prisma.objetivoAprendizagem, 'findFirst').mockResolvedValue(null);

      await expect(
        service.findOneByTurma(turmaIdCustom, 'objetivo-inexistente', mockProfessor),
      ).rejects.toThrow(new NotFoundException('Objetivo objetivo-inexistente não encontrado'));
    });

    it('AC6: Deve retornar 404 se objetivo de outra turma (isolamento)', async () => {
      jest.spyOn(prisma.turma, 'findUnique').mockResolvedValue(mockTurmaCustom as any);
      jest.spyOn(prisma.objetivoAprendizagem, 'findFirst').mockResolvedValue(null);

      await expect(
        service.findOneByTurma(turmaIdCustom, mockObjetivo.id, mockProfessor),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCustom()', () => {
    const updateDto: UpdateObjetivoCustomDto = {
      descricao: 'Nova descrição atualizada com mais contexto pedagógico...',
    };

    it('AC7: Deve atualizar campos parcialmente (PATCH)', async () => {
      const updated = { ...mockObjetivo, descricao: updateDto.descricao };

      jest.spyOn(prisma.turma, 'findUnique').mockResolvedValue(mockTurmaCustom as any);
      jest
        .spyOn(prisma.objetivoAprendizagem, 'findFirst')
        .mockResolvedValue(mockObjetivo);
      jest.spyOn(prisma.objetivoAprendizagem, 'update').mockResolvedValue(updated);

      const result = await service.updateCustom(
        turmaIdCustom,
        mockObjetivo.id,
        updateDto,
        mockProfessor,
      );

      expect(result.descricao).toBe(updateDto.descricao);
      expect(prisma.objetivoAprendizagem.update).toHaveBeenCalledWith({
        where: { id: mockObjetivo.id },
        data: expect.objectContaining({
          descricao: updateDto.descricao,
          updated_at: expect.any(Date), // ✅ AC7: updated_at atualizado
        }),
      });
    });

    it('AC7: Deve rejeitar código duplicado (409)', async () => {
      const updateDtoComCodigoDuplicado: UpdateObjetivoCustomDto = {
        codigo: 'PM-MAT-02',
      };
      const outroObjetivo = { ...mockObjetivo, id: 'outro-id', codigo: 'PM-MAT-02' };

      jest.spyOn(prisma.turma, 'findUnique').mockResolvedValue(mockTurmaCustom as any);
      jest
        .spyOn(prisma.objetivoAprendizagem, 'findFirst')
        .mockResolvedValueOnce(mockObjetivo) // Primeiro: buscar objetivo existente
        .mockResolvedValueOnce(outroObjetivo); // Segundo: verificar código duplicado

      await expect(
        service.updateCustom(
          turmaIdCustom,
          mockObjetivo.id,
          updateDtoComCodigoDuplicado,
          mockProfessor,
        ),
      ).rejects.toThrow(
        new ConflictException(
          `Código ${updateDtoComCodigoDuplicado.codigo} já existe nesta turma`,
        ),
      );
    });

    it('AC7: Deve aplicar RBAC (403)', async () => {
      jest.spyOn(prisma.turma, 'findUnique').mockResolvedValue(mockTurmaCustom as any);

      await expect(
        service.updateCustom(turmaIdCustom, mockObjetivo.id, updateDto, mockOutroProfessor),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeCustom()', () => {
    it('AC8: Deve deletar objetivo não vinculado (200)', async () => {
      jest.spyOn(prisma.turma, 'findUnique').mockResolvedValue(mockTurmaCustom as any);
      jest
        .spyOn(prisma.objetivoAprendizagem, 'findFirst')
        .mockResolvedValue(mockObjetivo);
      jest.spyOn(prisma.planejamentoObjetivo, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.objetivoAprendizagem, 'delete').mockResolvedValue(mockObjetivo);

      const result = await service.removeCustom(
        turmaIdCustom,
        mockObjetivo.id,
        mockProfessor,
      );

      expect(result).toEqual({ message: 'Objetivo deletado com sucesso' });
      expect(prisma.objetivoAprendizagem.delete).toHaveBeenCalledWith({
        where: { id: mockObjetivo.id },
      });
    });

    it('AC8: Deve impedir delete se objetivo em uso em planejamentos (409)', async () => {
      const planejamentosAfetados = [
        {
          objetivo_id: mockObjetivo.id,
          planejamento_id: 'plan-1',
          planejamento: { id: 'plan-1', bimestre: 1 },
        },
        {
          objetivo_id: mockObjetivo.id,
          planejamento_id: 'plan-2',
          planejamento: { id: 'plan-2', bimestre: 2 },
        },
      ];

      jest.spyOn(prisma.turma, 'findUnique').mockResolvedValue(mockTurmaCustom as any);
      jest
        .spyOn(prisma.objetivoAprendizagem, 'findFirst')
        .mockResolvedValue(mockObjetivo);
      jest
        .spyOn(prisma.planejamentoObjetivo, 'findMany')
        .mockResolvedValue(planejamentosAfetados as any);

      await expect(
        service.removeCustom(turmaIdCustom, mockObjetivo.id, mockProfessor),
      ).rejects.toThrow(
        new ConflictException({
          message:
            'Objetivo não pode ser deletado pois está em uso em 2 planejamento(s)',
          error: 'Conflict',
          planejamentos_afetados: [
            { id: 'plan-1', bimestre: 1 },
            { id: 'plan-2', bimestre: 2 },
          ],
          sugestao:
            'Remova o objetivo dos planejamentos antes de deletar, ou edite o objetivo para corrigir erros',
        }),
      );

      expect(prisma.objetivoAprendizagem.delete).not.toHaveBeenCalled();
    });

    it('AC8: Deve aplicar RBAC (403)', async () => {
      jest.spyOn(prisma.turma, 'findUnique').mockResolvedValue(mockTurmaCustom as any);

      await expect(
        service.removeCustom(turmaIdCustom, mockObjetivo.id, mockOutroProfessor),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
