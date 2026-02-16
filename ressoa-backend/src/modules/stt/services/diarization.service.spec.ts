import { Test, TestingModule } from '@nestjs/testing';
import { DiarizationService } from './diarization.service';
import { LLMRouterService } from '../../llm/services/llm-router.service';
import type { TranscriptionWord } from '../interfaces/stt-provider.interface';
import type { LLMResult } from '../../llm/interfaces/llm-provider.interface';

describe('DiarizationService', () => {
  let service: DiarizationService;
  let mockRouter: jest.Mocked<Pick<LLMRouterService, 'generateWithFallback'>>;

  const sampleWords: TranscriptionWord[] = [
    { word: 'Bom', start: 0.0, end: 0.2 },
    { word: 'dia', start: 0.2, end: 0.4 },
    { word: 'turma', start: 0.5, end: 0.8 },
    { word: 'Hoje', start: 1.2, end: 1.4 },
    { word: 'vamos', start: 1.5, end: 1.8 },
    { word: 'trabalhar', start: 1.9, end: 2.4 },
    { word: 'com', start: 2.5, end: 2.6 },
    { word: 'frações', start: 2.7, end: 3.2 },
  ];

  const sampleSrtOutput = `1
00:00:00,000 --> 00:00:03,200
[PROFESSOR] Bom dia turma Hoje vamos trabalhar com frações

2
00:00:03,500 --> 00:00:05,800
[ALUNO] Professor, frações é aquilo de pizza?

3
00:00:06,100 --> 00:00:08,400
[PROFESSOR] Exatamente! Vamos começar com exemplos visuais.`;

  const mockLLMResult: LLMResult = {
    texto: sampleSrtOutput,
    provider: 'GEMINI_FLASH' as any,
    modelo: 'gemini-2.0-flash',
    tokens_input: 500,
    tokens_output: 200,
    custo_usd: 0.005,
    tempo_processamento_ms: 3000,
  };

  beforeEach(async () => {
    mockRouter = {
      generateWithFallback: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiarizationService,
        { provide: LLMRouterService, useValue: mockRouter },
      ],
    }).compile();

    service = module.get<DiarizationService>(DiarizationService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('diarize', () => {
    it('should diarize successfully with valid words and return SRT with speaker labels', async () => {
      mockRouter.generateWithFallback.mockResolvedValue(mockLLMResult);

      const result = await service.diarize(sampleWords);

      expect(result.srt).toBe(sampleSrtOutput);
      expect(result.provider).toBe('GEMINI_FLASH');
      expect(result.custo_usd).toBe(0.005);
      expect(result.tempo_processamento_ms).toBeGreaterThanOrEqual(0);
      expect(result.segments_count).toBe(3);
      expect(result.speaker_stats.professor_segments).toBe(2);
      expect(result.speaker_stats.aluno_segments).toBe(1);
      expect(result.speaker_stats.professor_time_pct).toBeGreaterThan(0);

      expect(mockRouter.generateWithFallback).toHaveBeenCalledWith(
        'diarizacao',
        expect.stringContaining('[00:00.000] Bom'),
        {
          temperature: 0.1,
          maxTokens: 8192,
          systemPrompt: expect.stringContaining('PROFESSOR'),
        },
      );
    });

    it('should return fallback SRT without labels when words is undefined', async () => {
      const result = await service.diarize(undefined);

      expect(result.srt).toBe('');
      expect(result.provider).toBe('FALLBACK');
      expect(result.custo_usd).toBe(0);
      expect(result.segments_count).toBe(0);
      expect(result.speaker_stats.professor_segments).toBe(0);
      expect(result.speaker_stats.aluno_segments).toBe(0);
      expect(result.speaker_stats.professor_time_pct).toBe(100);

      expect(mockRouter.generateWithFallback).not.toHaveBeenCalled();
    });

    it('should return fallback SRT without labels when words is empty array', async () => {
      const result = await service.diarize([]);

      expect(result.srt).toBe('');
      expect(result.provider).toBe('FALLBACK');
      expect(result.custo_usd).toBe(0);
      expect(result.segments_count).toBe(0);

      expect(mockRouter.generateWithFallback).not.toHaveBeenCalled();
    });

    it('should return fallback SRT without labels when LLM throws error', async () => {
      mockRouter.generateWithFallback.mockRejectedValue(
        new Error('LLM generation failed: primary=GEMINI_FLASH, fallback=GPT4_MINI'),
      );

      const result = await service.diarize(sampleWords);

      expect(result.provider).toBe('FALLBACK');
      expect(result.custo_usd).toBe(0);
      expect(result.srt).not.toContain('[PROFESSOR]');
      expect(result.srt).not.toContain('[ALUNO]');
      // Fallback SRT should contain the words
      expect(result.srt).toContain('Bom');
      expect(result.srt).toContain('frações');
      expect(result.segments_count).toBeGreaterThan(0);
    });

    it('should include provider, custo_usd, tempo_processamento_ms from LLMResult', async () => {
      mockRouter.generateWithFallback.mockResolvedValue(mockLLMResult);

      const result = await service.diarize(sampleWords);

      expect(result.provider).toBe(mockLLMResult.provider);
      expect(result.custo_usd).toBe(mockLLMResult.custo_usd);
      expect(result.tempo_processamento_ms).toBeGreaterThanOrEqual(0);
    });
  });

  describe('speaker stats parsing (via diarize)', () => {
    it('should correctly count professor and aluno segments', async () => {
      mockRouter.generateWithFallback.mockResolvedValue(mockLLMResult);

      const result = await service.diarize(sampleWords);

      expect(result.speaker_stats.professor_segments).toBe(2);
      expect(result.speaker_stats.aluno_segments).toBe(1);
    });

    it('should calculate professor_time_pct correctly', async () => {
      const equalSplitSrt = `1
00:00:00,000 --> 00:00:10,000
[PROFESSOR] Explicando conceitos

2
00:00:10,000 --> 00:00:20,000
[ALUNO] Fazendo perguntas`;

      mockRouter.generateWithFallback.mockResolvedValue({
        ...mockLLMResult,
        texto: equalSplitSrt,
      });

      const result = await service.diarize(sampleWords);

      expect(result.speaker_stats.professor_segments).toBe(1);
      expect(result.speaker_stats.aluno_segments).toBe(1);
      expect(result.speaker_stats.professor_time_pct).toBe(50.0);
    });

    it('should return 100% professor_time_pct when no speakers found in fallback', async () => {
      const result = await service.diarize(undefined);

      expect(result.speaker_stats.professor_segments).toBe(0);
      expect(result.speaker_stats.aluno_segments).toBe(0);
      expect(result.speaker_stats.professor_time_pct).toBe(100);
    });

    it('should handle SRT with only professor segments', async () => {
      const profOnlySrt = `1
00:00:00,000 --> 00:00:05,000
[PROFESSOR] Só o professor falando`;

      mockRouter.generateWithFallback.mockResolvedValue({
        ...mockLLMResult,
        texto: profOnlySrt,
      });

      const result = await service.diarize(sampleWords);

      expect(result.speaker_stats.professor_segments).toBe(1);
      expect(result.speaker_stats.aluno_segments).toBe(0);
      expect(result.speaker_stats.professor_time_pct).toBe(100);
    });
  });

  describe('word formatting (via diarize LLM call)', () => {
    it('should format words with timestamps correctly in LLM call', async () => {
      mockRouter.generateWithFallback.mockResolvedValue(mockLLMResult);

      await service.diarize([
        { word: 'Bom', start: 0.0, end: 0.2 },
        { word: 'dia', start: 0.32, end: 0.56 },
      ]);

      expect(mockRouter.generateWithFallback).toHaveBeenCalledWith(
        'diarizacao',
        expect.stringContaining('[00:00.000] Bom\n[00:00.320] dia'),
        expect.any(Object),
      );
    });

    it('should handle minutes correctly in LLM call', async () => {
      mockRouter.generateWithFallback.mockResolvedValue(mockLLMResult);

      await service.diarize([{ word: 'Agora', start: 65.5, end: 66.0 }]);

      expect(mockRouter.generateWithFallback).toHaveBeenCalledWith(
        'diarizacao',
        expect.stringContaining('[01:05.500] Agora'),
        expect.any(Object),
      );
    });

    it('should handle large timestamps (hour+) in LLM call', async () => {
      mockRouter.generateWithFallback.mockResolvedValue(mockLLMResult);

      await service.diarize([{ word: 'Final', start: 3661.25, end: 3662.0 }]);

      // 3661.25 seconds = 61 minutes 1.25 seconds
      expect(mockRouter.generateWithFallback).toHaveBeenCalledWith(
        'diarizacao',
        expect.stringContaining('[61:01.250] Final'),
        expect.any(Object),
      );
    });
  });

  describe('fallback SRT generation', () => {
    it('should generate SRT with valid timestamps from words on LLM failure', async () => {
      mockRouter.generateWithFallback.mockRejectedValue(new Error('Timeout'));

      const result = await service.diarize(sampleWords);

      // Should have valid SRT format
      expect(result.srt).toMatch(/\d+\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/);
      expect(result.provider).toBe('FALLBACK');
    });

    it('should group words into segments in fallback', async () => {
      mockRouter.generateWithFallback.mockRejectedValue(new Error('Timeout'));

      // Create 25 words to test grouping (should create 3 segments: 10, 10, 5)
      const manyWords: TranscriptionWord[] = Array.from({ length: 25 }, (_, i) => ({
        word: `word${i}`,
        start: i * 0.5,
        end: i * 0.5 + 0.4,
      }));

      const result = await service.diarize(manyWords);

      expect(result.segments_count).toBe(3);
    });
  });
});
