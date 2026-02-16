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

const mockDiarizationResult = {
  srt: '1\n00:00:00,000 --> 00:00:05,000\n[PROFESSOR] Hoje vamos estudar frações\n\n2\n00:00:05,500 --> 00:00:08,000\n[ALUNO] Professor, o que é fração?',
  provider: 'GEMINI_FLASH',
  custo_usd: 0.008,
  tempo_processamento_ms: 1200,
  segments_count: 2,
  speaker_stats: {
    professor_segments: 1,
    aluno_segments: 1,
    professor_time_pct: 62.5,
  },
};

const mockSTTService = {
  transcribe: jest.fn().mockResolvedValue(mockTranscribeResult),
};

const mockDiarizationService = {
  diarize: jest.fn().mockResolvedValue(mockDiarizationResult),
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

const createMockAula = (disciplinaNome?: string) => ({
  id: 'aula-uuid',
  escola_id: 'escola-uuid',
  arquivo_url: 's3://bucket/audio.mp3',
  planejamento: disciplinaNome
    ? { disciplina: { nome: disciplinaNome } }
    : null,
});

describe('TranscricaoService - Prompt Resolution', () => {
  let service: TranscricaoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TranscricaoService(
      mockPrisma as any,
      mockSTTService as any,
      mockConfigService as any,
      mockDiarizationService as any,
    );
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

describe('TranscricaoService - Diarization Integration', () => {
  let service: TranscricaoService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSTTService.transcribe.mockResolvedValue(mockTranscribeResult);
    mockDiarizationService.diarize.mockResolvedValue(mockDiarizationResult);
    service = new TranscricaoService(
      mockPrisma as any,
      mockSTTService as any,
      mockConfigService as any,
      mockDiarizationService as any,
    );
    jest
      .spyOn(service as any, 'downloadFromS3')
      .mockResolvedValue(Buffer.from('fake-audio'));
    mockPrisma.aula.findUnique.mockResolvedValue(
      createMockAula('Matemática'),
    );
  });

  // 7.1: diarization called after STT when words available
  it('should call diarization after STT when words are available', async () => {
    const wordsArray = [
      { word: 'Hoje', start: 0.0, end: 0.32 },
      { word: 'vamos', start: 0.32, end: 0.56 },
    ];
    mockSTTService.transcribe.mockResolvedValueOnce({
      ...mockTranscribeResult,
      words: wordsArray,
    });

    await service.transcribeAula('aula-uuid');

    expect(mockDiarizationService.diarize).toHaveBeenCalledWith(wordsArray);
    expect(mockDiarizationService.diarize).toHaveBeenCalledTimes(1);
  });

  // 7.2: texto replaced with SRT when diarization succeeds
  it('should replace texto with SRT when diarization succeeds', async () => {
    const wordsArray = [
      { word: 'Hoje', start: 0.0, end: 0.32 },
    ];
    mockSTTService.transcribe.mockResolvedValueOnce({
      ...mockTranscribeResult,
      words: wordsArray,
    });

    await service.transcribeAula('aula-uuid');

    expect(mockPrisma.transcricao.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          texto: mockDiarizationResult.srt,
        }),
      }),
    );
  });

  // 7.3: metadata_json includes diarization metrics
  it('should include diarization metrics in metadata_json', async () => {
    const wordsArray = [
      { word: 'Hoje', start: 0.0, end: 0.32 },
    ];
    mockSTTService.transcribe.mockResolvedValueOnce({
      ...mockTranscribeResult,
      words: wordsArray,
    });

    await service.transcribeAula('aula-uuid');

    expect(mockPrisma.transcricao.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata_json: expect.objectContaining({
            has_diarization: true,
            diarization_provider: 'GEMINI_FLASH',
            diarization_cost_usd: 0.008,
            diarization_processing_ms: expect.any(Number),
            speaker_stats: expect.objectContaining({
              professor_segments: 1,
              aluno_segments: 1,
              professor_time_pct: 62.5,
            }),
          }),
        }),
      }),
    );
  });

  // 7.4: custo_usd sums STT + diarization costs
  it('should sum STT and diarization costs in custo_usd', async () => {
    mockSTTService.transcribe.mockResolvedValueOnce({
      ...mockTranscribeResult,
      custo_usd: 0.033,
      words: [{ word: 'Hoje', start: 0.0, end: 0.32 }],
    });
    mockDiarizationService.diarize.mockResolvedValueOnce({
      ...mockDiarizationResult,
      custo_usd: 0.008,
    });

    await service.transcribeAula('aula-uuid');

    expect(mockPrisma.transcricao.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          custo_usd: 0.041, // 0.033 + 0.008
        }),
      }),
    );
  });

  // 7.5: diarization fallback — LLM fails, SRT without speakers saved
  it('should save fallback SRT when diarization LLM fails', async () => {
    const fallbackSrt = '1\n00:00:00,000 --> 00:00:03,200\nHoje vamos estudar';
    mockSTTService.transcribe.mockResolvedValueOnce({
      ...mockTranscribeResult,
      words: [
        { word: 'Hoje', start: 0.0, end: 0.32 },
        { word: 'vamos', start: 0.32, end: 0.56 },
        { word: 'estudar', start: 0.56, end: 3.2 },
      ],
    });
    // DiarizationService handles LLM failure internally and returns fallback
    mockDiarizationService.diarize.mockResolvedValueOnce({
      srt: fallbackSrt,
      provider: 'FALLBACK',
      custo_usd: 0,
      tempo_processamento_ms: 5,
      segments_count: 1,
      speaker_stats: { professor_segments: 0, aluno_segments: 0, professor_time_pct: 100 },
    });

    await service.transcribeAula('aula-uuid');

    expect(mockPrisma.transcricao.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          texto: fallbackSrt,
        }),
      }),
    );
  });

  // 7.6: diarization disabled — feature flag off, SRT without speakers
  it('should save fallback SRT when diarization is disabled via feature flag', async () => {
    const fallbackSrt = '1\n00:00:00,000 --> 00:00:03,200\nHoje vamos estudar';
    mockDiarizationService.diarize.mockResolvedValueOnce({
      srt: fallbackSrt,
      provider: 'FALLBACK',
      custo_usd: 0,
      tempo_processamento_ms: 1,
      segments_count: 1,
      speaker_stats: { professor_segments: 0, aluno_segments: 0, professor_time_pct: 100 },
    });

    await service.transcribeAula('aula-uuid');

    expect(mockDiarizationService.diarize).toHaveBeenCalled();
    expect(mockPrisma.transcricao.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          texto: fallbackSrt,
          custo_usd: mockTranscribeResult.custo_usd, // 0 diarization cost
        }),
      }),
    );
  });

  // 7.7: no words from STT (Google provider) — original texto preserved
  it('should preserve original texto when no words available and diarization returns empty SRT', async () => {
    // STT result without words (e.g., Google provider)
    mockSTTService.transcribe.mockResolvedValueOnce({
      ...mockTranscribeResult,
      words: undefined,
    });
    // DiarizationService returns empty SRT for undefined words
    mockDiarizationService.diarize.mockResolvedValueOnce({
      srt: '',
      provider: 'FALLBACK',
      custo_usd: 0,
      tempo_processamento_ms: 1,
      segments_count: 0,
      speaker_stats: { professor_segments: 0, aluno_segments: 0, professor_time_pct: 100 },
    });

    await service.transcribeAula('aula-uuid');

    expect(mockPrisma.transcricao.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          texto: mockTranscribeResult.texto, // original texto preserved
        }),
      }),
    );
  });

  // 7.8: unexpected diarization error — original texto used, pipeline continues
  it('should use original texto when unexpected diarization error occurs', async () => {
    mockSTTService.transcribe.mockResolvedValueOnce({
      ...mockTranscribeResult,
      words: [{ word: 'Hoje', start: 0.0, end: 0.32 }],
    });
    mockDiarizationService.diarize.mockRejectedValueOnce(
      new Error('Unexpected null pointer'),
    );

    const result = await service.transcribeAula('aula-uuid');

    // Pipeline should continue, not throw
    expect(result).toBeDefined();
    expect(mockPrisma.transcricao.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          texto: mockTranscribeResult.texto, // fallback to original
          custo_usd: mockTranscribeResult.custo_usd, // only STT cost
        }),
      }),
    );
  });

  // 7.8 continued: has_diarization should be false when error occurs
  it('should set has_diarization to false when diarization throws unexpected error', async () => {
    mockDiarizationService.diarize.mockRejectedValueOnce(
      new Error('Service not available'),
    );

    await service.transcribeAula('aula-uuid');

    expect(mockPrisma.transcricao.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata_json: expect.objectContaining({
            has_diarization: false,
          }),
        }),
      }),
    );
  });

  // 7.9: status TRANSCRITA still set correctly after diarization
  it('should set aula status to TRANSCRITA after diarization', async () => {
    await service.transcribeAula('aula-uuid');

    expect(mockPrisma.aula.update).toHaveBeenCalledWith({
      where: { id: 'aula-uuid' },
      data: { status_processamento: 'TRANSCRITA' },
    });
  });

  // 7.10: existing prompt resolution tests still pass (no regression)
  it('should still call diarization even when no words in STT result', async () => {
    // Default mockTranscribeResult has no words field
    await service.transcribeAula('aula-uuid');

    // Diarization should be called with undefined (it handles this case)
    expect(mockDiarizationService.diarize).toHaveBeenCalledWith(undefined);
  });

  it('should pass diarization cost as 0 when diarization returns fallback', async () => {
    mockDiarizationService.diarize.mockResolvedValueOnce({
      srt: '',
      provider: 'FALLBACK',
      custo_usd: 0,
      tempo_processamento_ms: 1,
      segments_count: 0,
      speaker_stats: { professor_segments: 0, aluno_segments: 0, professor_time_pct: 100 },
    });

    await service.transcribeAula('aula-uuid');

    expect(mockPrisma.transcricao.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          custo_usd: mockTranscribeResult.custo_usd, // only STT cost, 0 diarization
        }),
      }),
    );
  });
});
