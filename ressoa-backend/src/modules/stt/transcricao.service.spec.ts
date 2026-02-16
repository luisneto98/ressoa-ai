import { TranscricaoService } from './transcricao.service';
import { NotFoundException } from '@nestjs/common';
import { STT_PROMPTS } from './constants/stt-prompts';

// Mock @aws-sdk/client-s3
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  GetObjectCommand: jest.fn(),
}));

const mockTranscribeResult = {
  texto: 'Transcrição de teste',
  provider: 'WHISPER',
  idioma: 'pt-BR',
  duracao_segundos: 60,
  confianca: 0.95,
  custo_usd: 0.006,
  tempo_processamento_ms: 500,
  metadata: { model: 'whisper-1', stt_prompt_used: true },
};

const mockSTTService = {
  transcribe: jest.fn().mockResolvedValue(mockTranscribeResult),
};

const mockPrisma = {
  getEscolaIdOrThrow: jest.fn().mockReturnValue('escola-uuid'),
  aula: {
    findUnique: jest.fn(),
    update: jest.fn().mockResolvedValue({}),
  },
  transcricao: {
    create: jest.fn().mockImplementation((args: any) => ({
      id: 'transcricao-uuid',
      ...args.data,
    })),
  },
};

const mockConfigService = {
  get: jest.fn().mockReturnValue(undefined),
};

describe('TranscricaoService - Prompt Resolution', () => {
  let service: TranscricaoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TranscricaoService(
      mockPrisma as any,
      mockSTTService as any,
      mockConfigService as any,
    );
  });

  const createMockAula = (disciplinaNome?: string) => ({
    id: 'aula-uuid',
    escola_id: 'escola-uuid',
    arquivo_url: 's3://bucket/audio.mp3',
    planejamento: disciplinaNome
      ? { disciplina: { nome: disciplinaNome } }
      : null,
  });

  // We need to mock downloadFromS3 since it requires S3 client
  beforeEach(() => {
    // Access private method via prototype to mock it
    jest
      .spyOn(service as any, 'downloadFromS3')
      .mockResolvedValue(Buffer.from('fake-audio'));
  });

  it('should pass matematica prompt when discipline is Matemática', async () => {
    mockPrisma.aula.findUnique.mockResolvedValue(
      createMockAula('Matemática'),
    );

    await service.transcribeAula('aula-uuid');

    expect(mockSTTService.transcribe).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.objectContaining({
        idioma: 'pt-BR',
        prompt: STT_PROMPTS.matematica,
      }),
    );
  });

  it('should pass lingua_portuguesa prompt when discipline is Língua Portuguesa', async () => {
    mockPrisma.aula.findUnique.mockResolvedValue(
      createMockAula('Língua Portuguesa'),
    );

    await service.transcribeAula('aula-uuid');

    expect(mockSTTService.transcribe).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.objectContaining({
        prompt: STT_PROMPTS.lingua_portuguesa,
      }),
    );
  });

  it('should pass ciencias prompt when discipline is Ciências', async () => {
    mockPrisma.aula.findUnique.mockResolvedValue(
      createMockAula('Ciências'),
    );

    await service.transcribeAula('aula-uuid');

    expect(mockSTTService.transcribe).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.objectContaining({
        prompt: STT_PROMPTS.ciencias,
      }),
    );
  });

  it('should pass default prompt when discipline is unknown', async () => {
    mockPrisma.aula.findUnique.mockResolvedValue(
      createMockAula('História'),
    );

    await service.transcribeAula('aula-uuid');

    expect(mockSTTService.transcribe).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.objectContaining({
        prompt: STT_PROMPTS.default,
      }),
    );
  });

  it('should pass default prompt when planejamento is null', async () => {
    mockPrisma.aula.findUnique.mockResolvedValue(
      createMockAula(), // no planejamento
    );

    await service.transcribeAula('aula-uuid');

    expect(mockSTTService.transcribe).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.objectContaining({
        prompt: STT_PROMPTS.default,
      }),
    );
  });

  it('should throw NotFoundException when aula not found', async () => {
    mockPrisma.aula.findUnique.mockResolvedValue(null);

    await expect(service.transcribeAula('aula-uuid')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should include planejamento.disciplina in aula query', async () => {
    mockPrisma.aula.findUnique.mockResolvedValue(
      createMockAula('Matemática'),
    );

    await service.transcribeAula('aula-uuid');

    expect(mockPrisma.aula.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          planejamento: {
            include: { disciplina: true },
          },
        },
      }),
    );
  });

  it('should save stt_prompt_key in transcricao metadata_json', async () => {
    mockPrisma.aula.findUnique.mockResolvedValue(
      createMockAula('Ciências'),
    );

    await service.transcribeAula('aula-uuid');

    expect(mockPrisma.transcricao.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata_json: expect.objectContaining({
            stt_prompt_key: 'ciencias',
          }),
        }),
      }),
    );
  });

  it('should save words and word_count in metadata_json when available', async () => {
    const wordsArray = [
      { word: 'Hoje', start: 0.0, end: 0.32 },
      { word: 'vamos', start: 0.32, end: 0.56 },
    ];
    mockSTTService.transcribe.mockResolvedValueOnce({
      ...mockTranscribeResult,
      words: wordsArray,
    });
    mockPrisma.aula.findUnique.mockResolvedValue(
      createMockAula('Matemática'),
    );

    await service.transcribeAula('aula-uuid');

    expect(mockPrisma.transcricao.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata_json: expect.objectContaining({
            words: wordsArray,
            word_count: 2,
          }),
        }),
      }),
    );
  });

  it('should not include words in metadata_json when not available', async () => {
    mockPrisma.aula.findUnique.mockResolvedValue(
      createMockAula('Matemática'),
    );

    await service.transcribeAula('aula-uuid');

    const createCall = mockPrisma.transcricao.create.mock.calls[0][0];
    expect(createCall.data.metadata_json.words).toBeUndefined();
    expect(createCall.data.metadata_json.word_count).toBeUndefined();
  });
});
