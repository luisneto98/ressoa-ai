import { Test, TestingModule } from '@nestjs/testing';
import { STTService } from './stt.service';
import { STTRouterService } from './services/stt-router.service';

describe('STTService', () => {
  let service: STTService;
  let sttRouterService: jest.Mocked<STTRouterService>;

  const mockTranscriptionResult = {
    texto: 'Hoje vamos estudar frações...',
    provider: 'Groq' as any,
    idioma: 'pt-BR',
    duracao_segundos: 3000,
    confianca: 0.95,
    custo_usd: 0.033,
    tempo_processamento_ms: 8500,
  };

  const mockSTTRouterService = {
    transcribeWithFallback: jest.fn().mockResolvedValue(mockTranscriptionResult),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        STTService,
        {
          provide: STTRouterService,
          useValue: mockSTTRouterService,
        },
      ],
    }).compile();

    service = module.get<STTService>(STTService);
    sttRouterService = module.get(STTRouterService) as jest.Mocked<STTRouterService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('transcribe', () => {
    it('should delegate to STTRouterService.transcribeWithFallback', async () => {
      const audioBuffer = Buffer.from('fake-audio-data');
      const options = { idioma: 'pt-BR' };

      const result = await service.transcribe(audioBuffer, options);

      expect(sttRouterService.transcribeWithFallback).toHaveBeenCalledTimes(1);
      expect(sttRouterService.transcribeWithFallback).toHaveBeenCalledWith(audioBuffer, options);
      expect(result).toEqual(mockTranscriptionResult);
    });

    it('should pass through without options', async () => {
      const audioBuffer = Buffer.from('fake-audio-data');

      const result = await service.transcribe(audioBuffer);

      expect(sttRouterService.transcribeWithFallback).toHaveBeenCalledWith(audioBuffer, undefined);
      expect(result).toEqual(mockTranscriptionResult);
    });

    it('should propagate errors from STTRouterService', async () => {
      const audioBuffer = Buffer.from('fake-audio-data');

      sttRouterService.transcribeWithFallback.mockRejectedValue(
        new Error('STT transcription failed on all providers: primary=GROQ_WHISPER, fallback=WHISPER'),
      );

      await expect(service.transcribe(audioBuffer)).rejects.toThrow(
        'STT transcription failed on all providers',
      );
    });

    it('should return provider metadata from router result', async () => {
      const audioBuffer = Buffer.from('fake-audio-data');

      // Simulate fallback scenario where Whisper was used instead of Groq
      sttRouterService.transcribeWithFallback.mockResolvedValue({
        ...mockTranscriptionResult,
        provider: 'Whisper' as any,
        custo_usd: 0.10,
      });

      const result = await service.transcribe(audioBuffer);

      expect(result.provider).toBe('Whisper');
      expect(result.custo_usd).toBe(0.10);
    });
  });
});
