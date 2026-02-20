import { Test, TestingModule } from '@nestjs/testing';
import { AulasService } from './aulas.service';
import { PrismaService } from '../../prisma/prisma.service';
import { getQueueToken } from '@nestjs/bull';
import {
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { StatusProcessamento, TipoEntrada } from '@prisma/client';

// ============================================================
// Story 16.2: Aula como Rascunho com Descrição e Datas Futuras
// ============================================================

const mockUser = { userId: 'user-123', escolaId: 'escola-456' };
const mockEscolaId = 'escola-456';
const mockTurmaId = 'turma-789';
const mockAulaId = 'aula-abc';
const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 days ahead

const mockTurma = {
  id: mockTurmaId,
  nome: '6A',
  escola_id: mockEscolaId,
  professor_id: mockUser.userId,
};

const mockRascunhoAula = {
  id: mockAulaId,
  escola_id: mockEscolaId,
  professor_id: mockUser.userId,
  turma_id: mockTurmaId,
  planejamento_id: null,
  data: new Date(futureDate),
  tipo_entrada: null,
  descricao: 'Objetivo: revisar frações',
  status_processamento: StatusProcessamento.RASCUNHO,
  arquivo_url: null,
  arquivo_tamanho: null,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  turma: mockTurma,
  planejamento: null,
};

const mockPrismaService = {
  getEscolaIdOrThrow: jest.fn().mockReturnValue(mockEscolaId),
  turma: {
    findUnique: jest.fn(),
  },
  planejamento: {
    findUnique: jest.fn(),
  },
  aula: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockQueue = {
  add: jest.fn(),
};

describe('AulasService — Story 16.2', () => {
  let service: AulasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AulasService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: getQueueToken('transcription'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<AulasService>(AulasService);

    // Reset all mocks before each test
    jest.clearAllMocks();
    mockPrismaService.getEscolaIdOrThrow.mockReturnValue(mockEscolaId);
  });

  // ─────────────────────────────────────────────────────────────
  // createRascunho()
  // ─────────────────────────────────────────────────────────────

  describe('createRascunho()', () => {
    it('deve criar aula com status RASCUNHO', async () => {
      mockPrismaService.turma.findUnique.mockResolvedValue(mockTurma);
      mockPrismaService.aula.create.mockResolvedValue(mockRascunhoAula);

      const dto = {
        turma_id: mockTurmaId,
        data: futureDate,
        descricao: 'Objetivo: revisar frações',
      };

      const result = await service.createRascunho(dto, mockUser);

      expect(result.status_processamento).toBe(StatusProcessamento.RASCUNHO);
      expect(mockPrismaService.aula.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status_processamento: StatusProcessamento.RASCUNHO,
            descricao: 'Objetivo: revisar frações',
          }),
        }),
      );
    });

    it('deve rejeitar turma de outro professor (ForbiddenException)', async () => {
      mockPrismaService.turma.findUnique.mockResolvedValue(null);

      const dto = { turma_id: 'outra-turma', data: futureDate };

      await expect(service.createRascunho(dto, mockUser)).rejects.toThrow(ForbiddenException);
    });

    it('deve aceitar data futura sem erro', async () => {
      mockPrismaService.turma.findUnique.mockResolvedValue(mockTurma);
      mockPrismaService.aula.create.mockResolvedValue({
        ...mockRascunhoAula,
        data: new Date(futureDate),
      });

      const dto = { turma_id: mockTurmaId, data: futureDate };

      // Should NOT throw
      await expect(service.createRascunho(dto, mockUser)).resolves.toBeDefined();
    });

    it('deve lançar BadRequestException com planejamento inválido', async () => {
      mockPrismaService.turma.findUnique.mockResolvedValue(mockTurma);
      mockPrismaService.planejamento.findUnique.mockResolvedValue(null);

      const dto = {
        turma_id: mockTurmaId,
        data: futureDate,
        planejamento_id: 'planejamento-invalido',
      };

      await expect(service.createRascunho(dto, mockUser)).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // updateDescricao()
  // ─────────────────────────────────────────────────────────────

  describe('updateDescricao()', () => {
    it('deve atualizar descricao quando status === RASCUNHO', async () => {
      mockPrismaService.aula.findUnique.mockResolvedValue(mockRascunhoAula);
      const updatedAula = { ...mockRascunhoAula, descricao: 'Nova descrição' };
      mockPrismaService.aula.update.mockResolvedValue(updatedAula);

      const dto = { descricao: 'Nova descrição' };
      const result = await service.updateDescricao(mockAulaId, dto, mockUser);

      expect(result.descricao).toBe('Nova descrição');
      expect(mockPrismaService.aula.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { descricao: 'Nova descrição' },
        }),
      );
    });

    it('deve lançar BadRequestException quando status !== RASCUNHO (ex: CRIADA)', async () => {
      mockPrismaService.aula.findUnique.mockResolvedValue({
        ...mockRascunhoAula,
        status_processamento: StatusProcessamento.CRIADA,
      });

      const dto = { descricao: 'Nova descrição' };

      await expect(service.updateDescricao(mockAulaId, dto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar NotFoundException se aula não encontrada', async () => {
      mockPrismaService.aula.findUnique.mockResolvedValue(null);

      const dto = { descricao: 'Nova descrição' };

      await expect(service.updateDescricao('nonexistent', dto, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────
  // iniciarProcessamento()
  // ─────────────────────────────────────────────────────────────

  describe('iniciarProcessamento()', () => {
    it('deve transicionar RASCUNHO → CRIADA para AUDIO', async () => {
      mockPrismaService.aula.findUnique.mockResolvedValue(mockRascunhoAula);
      const updatedAula = {
        ...mockRascunhoAula,
        tipo_entrada: TipoEntrada.AUDIO,
        status_processamento: StatusProcessamento.CRIADA,
      };
      mockPrismaService.aula.update.mockResolvedValue(updatedAula);

      const dto = { tipo_entrada: TipoEntrada.AUDIO };
      const result = await service.iniciarProcessamento(mockAulaId, dto, mockUser);

      expect(result.status_processamento).toBe(StatusProcessamento.CRIADA);
      expect(result.tipo_entrada).toBe(TipoEntrada.AUDIO);
      expect(mockPrismaService.aula.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tipo_entrada: TipoEntrada.AUDIO,
            status_processamento: StatusProcessamento.CRIADA,
          }),
        }),
      );
    });

    it('deve transicionar RASCUNHO → TRANSCRITA para TRANSCRICAO e criar Transcricao', async () => {
      mockPrismaService.aula.findUnique.mockResolvedValue(mockRascunhoAula);
      const updatedAula = {
        ...mockRascunhoAula,
        tipo_entrada: TipoEntrada.TRANSCRICAO,
        status_processamento: StatusProcessamento.TRANSCRITA,
        transcricao: { id: 'transcricao-1', texto: 'Texto da transcrição completa...', confianca: 1.0 },
      };

      let txTranscricaoCreateTranscricao: jest.Mock;
      mockPrismaService.$transaction.mockImplementation(async (fn: (tx: typeof mockPrismaService) => Promise<unknown>) => {
        txTranscricaoCreateTranscricao = jest.fn().mockResolvedValue({ id: 'transcricao-1', confianca: 1.0 });
        const txMock = {
          aula: {
            update: jest.fn().mockResolvedValue(updatedAula),
            findUniqueOrThrow: jest.fn().mockResolvedValue(updatedAula),
          },
          transcricao: { create: txTranscricaoCreateTranscricao },
        };
        return fn(txMock as unknown as typeof mockPrismaService);
      });

      const dto = {
        tipo_entrada: TipoEntrada.TRANSCRICAO,
        transcricao_texto: 'Texto da transcrição completa...',
      };
      const result = await service.iniciarProcessamento(mockAulaId, dto, mockUser);

      expect(result.status_processamento).toBe(StatusProcessamento.TRANSCRITA);
      // Verifica que transcricao.create foi chamado com confianca 1.0 para TRANSCRICAO
      expect(txTranscricaoCreateTranscricao!).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            confianca: 1.0,
            texto: 'Texto da transcrição completa...',
          }),
        }),
      );
    });

    it('deve transicionar RASCUNHO → TRANSCRITA para MANUAL e criar Transcricao com confianca 0.5', async () => {
      mockPrismaService.aula.findUnique.mockResolvedValue(mockRascunhoAula);
      const updatedAula = {
        ...mockRascunhoAula,
        tipo_entrada: TipoEntrada.MANUAL,
        status_processamento: StatusProcessamento.TRANSCRITA,
        transcricao: null,
      };

      let txTranscricaoCreate: jest.Mock;
      mockPrismaService.$transaction.mockImplementation(async (fn: (tx: typeof mockPrismaService) => Promise<unknown>) => {
        txTranscricaoCreate = jest.fn().mockResolvedValue({ id: 'transcricao-2', confianca: 0.5 });
        const txMock = {
          aula: {
            update: jest.fn().mockResolvedValue(updatedAula),
            findUniqueOrThrow: jest.fn().mockResolvedValue({ ...updatedAula, transcricao: { id: 'transcricao-2', confianca: 0.5 } }),
          },
          transcricao: { create: txTranscricaoCreate },
        };
        return fn(txMock as unknown as typeof mockPrismaService);
      });

      const dto = {
        tipo_entrada: TipoEntrada.MANUAL,
        resumo: 'Resumo manual da aula sobre frações...',
      };
      const result = await service.iniciarProcessamento(mockAulaId, dto, mockUser);

      expect(result.status_processamento).toBe(StatusProcessamento.TRANSCRITA);
      // Verify that confianca 0.5 was passed for MANUAL
      expect(txTranscricaoCreate!).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            confianca: 0.5,
          }),
        }),
      );
    });

    it('deve lançar BadRequestException quando status !== RASCUNHO', async () => {
      mockPrismaService.aula.findUnique.mockResolvedValue({
        ...mockRascunhoAula,
        status_processamento: StatusProcessamento.CRIADA,
      });

      const dto = { tipo_entrada: TipoEntrada.AUDIO };

      await expect(service.iniciarProcessamento(mockAulaId, dto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────
  // PROFESSOR_ALLOWED_TRANSITIONS
  // ─────────────────────────────────────────────────────────────

  describe('PROFESSOR_ALLOWED_TRANSITIONS', () => {
    it('deve incluir RASCUNHO → CRIADA', () => {
      // Test via validateStatusTransition through update method
      // Create a mock aula with RASCUNHO status
      const rascunhoAula = { ...mockRascunhoAula, status_processamento: StatusProcessamento.RASCUNHO };
      mockPrismaService.aula.findUnique.mockResolvedValue(rascunhoAula);
      mockPrismaService.aula.update.mockResolvedValue({
        ...rascunhoAula,
        status_processamento: StatusProcessamento.CRIADA,
      });

      // This should NOT throw (RASCUNHO → CRIADA is allowed)
      return expect(
        service.update(mockAulaId, { status_processamento: StatusProcessamento.CRIADA }, mockUser),
      ).resolves.toBeDefined();
    });
  });
});
