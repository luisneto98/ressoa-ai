import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ObjetivosService } from './objetivos.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateObjetivoDto } from './dto/create-objetivo.dto';
import { NivelBloom, TipoFonte } from '@prisma/client';

/**
 * Test Suite: ObjetivoAprendizagemService
 * Story 11.1: Backend — Modelo de Dados - Objetivos de Aprendizagem
 *
 * Coverage:
 * - AC4: Validação - tipo_fonte = custom requer criterios_evidencia
 * - AC5: Validação - codigo é único por turma_id para custom
 * - AC6: Todos testes passam (10/10)
 */
describe('ObjetivosService', () => {
  let service: ObjetivosService;
  let prisma: PrismaService;

  // Mock data
  const mockHabilidade = {
    id: 'hab-uuid-123',
    codigo: 'EF06MA01',
    descricao: 'Habilidade BNCC de teste',
    disciplina: 'MATEMATICA',
    tipo_ensino: 'FUNDAMENTAL' as const,
    ano_inicio: 6,
    ano_fim: null,
    unidade_tematica: 'Números',
    competencia_especifica: null,
    objeto_conhecimento: 'Sistema de numeração',
    metadata: null,
    versao_bncc: '2018',
    ativa: true,
    searchable: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockTurma = {
    id: 'turma-uuid-A',
    nome: '6A',
    disciplina: 'MATEMATICA',
    serie: 'SEXTO_ANO' as const,
    tipo_ensino: 'FUNDAMENTAL' as const,
    ano_letivo: 2026,
    turno: 'MATUTINO',
    escola_id: 'escola-uuid-123',
    professor_id: 'prof-uuid-123',
    deleted_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPrismaService = {
    habilidade: {
      findUnique: jest.fn(),
    },
    turma: {
      findUnique: jest.fn(),
    },
    objetivoAprendizagem: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ObjetivosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ObjetivosService>(ObjetivosService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('✅ should create BNCC objetivo with habilidade reference', async () => {
      // Arrange
      const createDto: CreateObjetivoDto = {
        codigo: 'EF06MA01',
        descricao: 'Habilidade BNCC de Matemática',
        nivel_cognitivo: NivelBloom.APLICAR,
        tipo_fonte: TipoFonte.BNCC,
        habilidade_bncc_id: 'hab-uuid-123',
      };

      mockPrismaService.habilidade.findUnique.mockResolvedValue(mockHabilidade);
      mockPrismaService.objetivoAprendizagem.create.mockResolvedValue({
        id: 'obj-uuid-1',
        ...createDto,
        turma_id: null,
        area_conhecimento: null,
        criterios_evidencia: [],
        contexto_json: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.codigo).toBe('EF06MA01');
      expect(prisma.habilidade.findUnique).toHaveBeenCalledWith({
        where: { id: 'hab-uuid-123' },
      });
      expect(prisma.objetivoAprendizagem.create).toHaveBeenCalled();
    });

    it('✅ should create custom objetivo with turma_id + criterios_evidencia', async () => {
      // Arrange
      const createDto: CreateObjetivoDto = {
        codigo: 'PM-MAT-01',
        descricao: 'Resolver regra de três simples',
        nivel_cognitivo: NivelBloom.APLICAR,
        tipo_fonte: TipoFonte.CUSTOM,
        turma_id: 'turma-uuid-A',
        area_conhecimento: 'Matemática Financeira',
        criterios_evidencia: [
          'Identifica grandezas proporcionais',
          'Aplica regra corretamente',
        ],
      };

      mockPrismaService.turma.findUnique.mockResolvedValue(mockTurma);
      mockPrismaService.objetivoAprendizagem.findFirst.mockResolvedValue(null);
      mockPrismaService.objetivoAprendizagem.create.mockResolvedValue({
        id: 'obj-uuid-2',
        ...createDto,
        habilidade_bncc_id: null,
        contexto_json: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.codigo).toBe('PM-MAT-01');
      expect(prisma.turma.findUnique).toHaveBeenCalledWith({
        where: { id: 'turma-uuid-A' },
      });
      expect(prisma.objetivoAprendizagem.create).toHaveBeenCalled();
    });

    it('✅ should throw error if BNCC without habilidade_bncc_id', async () => {
      // Arrange
      const createDto: CreateObjetivoDto = {
        codigo: 'EF06MA01',
        descricao: 'Habilidade sem ID',
        nivel_cognitivo: NivelBloom.APLICAR,
        tipo_fonte: TipoFonte.BNCC,
        // habilidade_bncc_id missing
      };

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'habilidade_bncc_id é obrigatório para objetivos BNCC',
      );
    });

    it('✅ should throw error if BNCC habilidade not found', async () => {
      // Arrange
      const createDto: CreateObjetivoDto = {
        codigo: 'EF06MA01',
        descricao: 'Habilidade inexistente',
        nivel_cognitivo: NivelBloom.APLICAR,
        tipo_fonte: TipoFonte.BNCC,
        habilidade_bncc_id: 'invalid-uuid',
      };

      mockPrismaService.habilidade.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Habilidade BNCC não encontrada',
      );
    });

    it('✅ should throw error if custom without criterios_evidencia', async () => {
      // Arrange
      const createDto: CreateObjetivoDto = {
        codigo: 'PM-MAT-01',
        descricao: 'Objetivo sem critérios',
        nivel_cognitivo: NivelBloom.APLICAR,
        tipo_fonte: TipoFonte.CUSTOM,
        turma_id: 'turma-uuid-A',
        area_conhecimento: 'Matemática',
        criterios_evidencia: [], // INVALID
      };

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Objetivos customizados requerem ao menos 1 critério de evidência',
      );
    });

    it('✅ should throw error if custom without area_conhecimento', async () => {
      // Arrange
      const createDto: CreateObjetivoDto = {
        codigo: 'PM-MAT-01',
        descricao: 'Objetivo sem área',
        nivel_cognitivo: NivelBloom.APLICAR,
        tipo_fonte: TipoFonte.CUSTOM,
        turma_id: 'turma-uuid-A',
        // area_conhecimento missing
        criterios_evidencia: ['Critério 1'],
      };

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'area_conhecimento é obrigatória',
      );
    });

    it('✅ should throw error if custom without turma_id', async () => {
      // Arrange
      const createDto: CreateObjetivoDto = {
        codigo: 'PM-MAT-01',
        descricao: 'Objetivo sem turma',
        nivel_cognitivo: NivelBloom.APLICAR,
        tipo_fonte: TipoFonte.CUSTOM,
        // turma_id missing
        area_conhecimento: 'Matemática',
        criterios_evidencia: ['Critério 1'],
      };

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'turma_id é obrigatório',
      );
    });

    it('✅ should throw error if codigo duplicated in same turma', async () => {
      // Arrange
      const createDto: CreateObjetivoDto = {
        codigo: 'PM-MAT-01', // DUPLICADO
        descricao: 'Segundo objetivo',
        nivel_cognitivo: NivelBloom.APLICAR,
        tipo_fonte: TipoFonte.CUSTOM,
        turma_id: 'turma-uuid-A',
        area_conhecimento: 'Matemática',
        criterios_evidencia: ['Critério 1'],
      };

      mockPrismaService.turma.findUnique.mockResolvedValue(mockTurma);
      mockPrismaService.objetivoAprendizagem.findFirst.mockResolvedValue({
        id: 'obj-existing',
        codigo: 'PM-MAT-01',
        turma_id: 'turma-uuid-A',
      });

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'já existe na turma',
      );
    });

    it('✅ should succeed if codigo duplicated in different turma', async () => {
      // Arrange
      const createDto: CreateObjetivoDto = {
        codigo: 'PM-MAT-01', // MESMO CÓDIGO
        descricao: 'Objetivo em turma diferente',
        nivel_cognitivo: NivelBloom.APLICAR,
        tipo_fonte: TipoFonte.CUSTOM,
        turma_id: 'turma-uuid-B', // TURMA DIFERENTE
        area_conhecimento: 'Matemática',
        criterios_evidencia: ['Critério 1'],
      };

      mockPrismaService.turma.findUnique.mockResolvedValue({
        ...mockTurma,
        id: 'turma-uuid-B',
      });
      mockPrismaService.objetivoAprendizagem.findFirst.mockResolvedValue(null); // Não existe na turma B
      mockPrismaService.objetivoAprendizagem.create.mockResolvedValue({
        id: 'obj-uuid-3',
        ...createDto,
        habilidade_bncc_id: null,
        contexto_json: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.codigo).toBe('PM-MAT-01');
      expect(result.turma_id).toBe('turma-uuid-B');
    });
  });

  describe('query methods', () => {
    it('✅ should query by tipo_fonte', async () => {
      // Arrange
      mockPrismaService.objetivoAprendizagem.findMany.mockResolvedValue([
        { id: '1', codigo: 'EF06MA01', tipo_fonte: TipoFonte.BNCC },
        { id: '2', codigo: 'EF06MA02', tipo_fonte: TipoFonte.BNCC },
      ]);

      // Act
      const result = await service.findByTipoFonte(TipoFonte.BNCC);

      // Assert
      expect(result).toHaveLength(2);
      expect(prisma.objetivoAprendizagem.findMany).toHaveBeenCalledWith({
        where: { tipo_fonte: TipoFonte.BNCC },
        orderBy: { codigo: 'asc' },
      });
    });

    it('✅ should query by turma_id', async () => {
      // Arrange
      mockPrismaService.turma.findUnique.mockResolvedValue(mockTurma);
      mockPrismaService.objetivoAprendizagem.findMany.mockResolvedValue([
        { id: '1', codigo: 'PM-MAT-01', turma_id: 'turma-uuid-A' },
        { id: '2', codigo: 'PM-MAT-02', turma_id: 'turma-uuid-A' },
      ]);

      // Act
      const result = await service.findByTurma('turma-uuid-A');

      // Assert
      expect(result).toHaveLength(2);
      expect(prisma.turma.findUnique).toHaveBeenCalledWith({
        where: { id: 'turma-uuid-A' },
      });
      expect(prisma.objetivoAprendizagem.findMany).toHaveBeenCalledWith({
        where: {
          tipo_fonte: TipoFonte.CUSTOM,
          turma_id: 'turma-uuid-A',
        },
        orderBy: { codigo: 'asc' },
      });
    });

    it('✅ should throw error if turma deleted (soft-delete check)', async () => {
      // Arrange
      mockPrismaService.turma.findUnique.mockResolvedValue({
        ...mockTurma,
        deleted_at: new Date(), // TURMA DELETADA
      });

      // Act & Assert
      await expect(service.findByTurma('turma-uuid-A')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByTurma('turma-uuid-A')).rejects.toThrow(
        'Turma não encontrada ou foi deletada',
      );
    });
  });
});
