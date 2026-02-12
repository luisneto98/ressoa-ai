import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisProcessorWorker } from './analysis-processor.worker';
import { PrismaService } from '../prisma/prisma.service';
import { AnaliseService } from '../modules/analise/services/analise.service';
import { NotificacoesService } from '../modules/notificacoes/notificacoes.service';
import type { Job } from 'bull';

/**
 * Unit tests for AnalysisProcessorWorker
 * Story 5.5 - AC2: Test worker lifecycle and error handling
 *
 * Tests:
 * - Happy path: TRANSCRITA → ANALISANDO → ANALISADA
 * - Aula not found
 * - Aula not TRANSCRITA
 * - AnaliseService failure handling
 * - Job progress updates
 * - Notification sent on success
 */
describe('AnalysisProcessorWorker', () => {
  let worker: AnalysisProcessorWorker;
  let prismaService: PrismaService;
  let analiseService: AnaliseService;
  let notificacoesService: NotificacoesService;

  const mockJob = {
    id: 'job-123',
    data: {
      aulaId: 'aula-123',
      escolaId: 'escola-123',
    },
    progress: jest.fn(),
    attemptsMade: 1,
  } as unknown as Job<any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisProcessorWorker,
        {
          provide: PrismaService,
          useValue: {
            aula: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: AnaliseService,
          useValue: {
            analisarAula: jest.fn(),
          },
        },
        {
          provide: NotificacoesService,
          useValue: {
            notifyAnalisePronta: jest.fn(),
          },
        },
      ],
    }).compile();

    worker = module.get<AnalysisProcessorWorker>(AnalysisProcessorWorker);
    prismaService = module.get<PrismaService>(PrismaService);
    analiseService = module.get<AnaliseService>(AnaliseService);
    notificacoesService = module.get<NotificacoesService>(NotificacoesService);
  });

  it('should process aula: TRANSCRITA → ANALISANDO → ANALISADA', async () => {
    // Arrange
    const mockAula = {
      id: 'aula-123',
      status_processamento: 'TRANSCRITA',
      transcricao: { id: 'transcricao-123', texto: 'Mock transcription' },
      turma: { id: 'turma-123', nome: '6A' },
    };

    const mockAnalise = {
      id: 'analise-123',
      custo_total_usd: 0.198,
    };

    jest.spyOn(prismaService.aula, 'findUnique').mockResolvedValue(mockAula as any);
    jest.spyOn(prismaService.aula, 'update').mockResolvedValue(mockAula as any);
    jest.spyOn(analiseService, 'analisarAula').mockResolvedValue(mockAnalise as any);
    jest.spyOn(notificacoesService, 'notifyAnalisePronta').mockResolvedValue();

    // Act
    const result = await worker.handleAnalysis(mockJob);

    // Assert
    expect(prismaService.aula.findUnique).toHaveBeenCalledWith({
      where: { id: 'aula-123' },
      include: { transcricao: true, turma: true },
    });

    // Status: TRANSCRITA → ANALISANDO
    expect(prismaService.aula.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'aula-123' },
      data: { status_processamento: 'ANALISANDO' },
    });

    // Execute analysis
    expect(analiseService.analisarAula).toHaveBeenCalledWith('aula-123');

    // Status: ANALISANDO → ANALISADA
    expect(prismaService.aula.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'aula-123' },
      data: { status_processamento: 'ANALISADA' },
    });

    // Notify professor
    expect(notificacoesService.notifyAnalisePronta).toHaveBeenCalledWith('aula-123');

    // Return analise ID
    expect(result).toEqual({ analiseId: 'analise-123' });
  });

  it('should throw error if aula not found', async () => {
    // Arrange
    jest.spyOn(prismaService.aula, 'findUnique').mockResolvedValue(null);

    // Act & Assert
    await expect(worker.handleAnalysis(mockJob)).rejects.toThrow(
      'Aula aula-123 não encontrada',
    );
  });

  it('should skip processing if aula not TRANSCRITA', async () => {
    // Arrange
    const mockAula = {
      id: 'aula-123',
      status_processamento: 'AGUARDANDO_TRANSCRICAO', // Not TRANSCRITA
      transcricao: null,
      turma: { id: 'turma-123', nome: '6A' },
    };

    jest.spyOn(prismaService.aula, 'findUnique').mockResolvedValue(mockAula as any);

    // Act
    const result = await worker.handleAnalysis(mockJob);

    // Assert: Should return early without processing
    expect(result).toBeUndefined();
    expect(analiseService.analisarAula).not.toHaveBeenCalled();
    expect(notificacoesService.notifyAnalisePronta).not.toHaveBeenCalled();
  });

  it('should throw error if transcricao not found', async () => {
    // Arrange
    const mockAula = {
      id: 'aula-123',
      status_processamento: 'TRANSCRITA',
      transcricao: null, // Missing transcricao
      turma: { id: 'turma-123', nome: '6A' },
    };

    jest.spyOn(prismaService.aula, 'findUnique').mockResolvedValue(mockAula as any);

    // Act & Assert
    await expect(worker.handleAnalysis(mockJob)).rejects.toThrow(
      'Transcrição não encontrada para aula aula-123',
    );
  });

  it('should set status to ERRO if AnaliseService fails', async () => {
    // Arrange
    const mockAula = {
      id: 'aula-123',
      status_processamento: 'TRANSCRITA',
      transcricao: { id: 'transcricao-123', texto: 'Mock transcription' },
      turma: { id: 'turma-123', nome: '6A' },
    };

    jest.spyOn(prismaService.aula, 'findUnique').mockResolvedValue(mockAula as any);
    jest.spyOn(prismaService.aula, 'update').mockResolvedValue(mockAula as any);
    jest
      .spyOn(analiseService, 'analisarAula')
      .mockRejectedValue(new Error('LLM API timeout'));

    // Act & Assert
    await expect(worker.handleAnalysis(mockJob)).rejects.toThrow('LLM API timeout');

    // Status should be set to ERRO
    expect(prismaService.aula.update).toHaveBeenCalledWith({
      where: { id: 'aula-123' },
      data: { status_processamento: 'ERRO' },
    });
  });

  it('should update job progress correctly', async () => {
    // Arrange
    const mockAula = {
      id: 'aula-123',
      status_processamento: 'TRANSCRITA',
      transcricao: { id: 'transcricao-123', texto: 'Mock transcription' },
      turma: { id: 'turma-123', nome: '6A' },
    };

    const mockAnalise = {
      id: 'analise-123',
      custo_total_usd: 0.198,
    };

    jest.spyOn(prismaService.aula, 'findUnique').mockResolvedValue(mockAula as any);
    jest.spyOn(prismaService.aula, 'update').mockResolvedValue(mockAula as any);
    jest.spyOn(analiseService, 'analisarAula').mockResolvedValue(mockAnalise as any);
    jest.spyOn(notificacoesService, 'notifyAnalisePronta').mockResolvedValue();

    // Act
    await worker.handleAnalysis(mockJob);

    // Assert: Job progress should be updated
    expect(mockJob.progress).toHaveBeenCalledWith(0); // Start
    expect(mockJob.progress).toHaveBeenCalledWith(10); // Context loaded
    expect(mockJob.progress).toHaveBeenCalledWith(90); // Analysis complete
    expect(mockJob.progress).toHaveBeenCalledWith(100); // Done
  });

  it('should send notification on success', async () => {
    // Arrange
    const mockAula = {
      id: 'aula-123',
      status_processamento: 'TRANSCRITA',
      transcricao: { id: 'transcricao-123', texto: 'Mock transcription' },
      turma: { id: 'turma-123', nome: '6A' },
    };

    const mockAnalise = {
      id: 'analise-123',
      custo_total_usd: 0.198,
    };

    jest.spyOn(prismaService.aula, 'findUnique').mockResolvedValue(mockAula as any);
    jest.spyOn(prismaService.aula, 'update').mockResolvedValue(mockAula as any);
    jest.spyOn(analiseService, 'analisarAula').mockResolvedValue(mockAnalise as any);
    jest.spyOn(notificacoesService, 'notifyAnalisePronta').mockResolvedValue();

    // Act
    await worker.handleAnalysis(mockJob);

    // Assert: Notification should be sent
    expect(notificacoesService.notifyAnalisePronta).toHaveBeenCalledWith('aula-123');
  });

  it('should log error on job failure (handleFailure)', async () => {
    // Arrange
    const mockError = new Error('Test failure');
    const loggerSpy = jest.spyOn((worker as any).logger, 'error').mockImplementation();

    // Act
    await worker.handleFailure(mockJob, mockError);

    // Assert: Should log failure details
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Job falhou após todas as tentativas',
        jobId: 'job-123',
        aulaId: 'aula-123',
        attempts: 1,
        error: 'Test failure',
      }),
    );
  });
});
