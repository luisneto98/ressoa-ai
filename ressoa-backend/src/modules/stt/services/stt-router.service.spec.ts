import { STTRouterService } from './stt-router.service';
import { ProvidersConfigService } from '../../providers-config/providers-config.service';
import type { STTProvider } from '../interfaces';
import { TranscriptionResult } from '../interfaces';
import { ProviderSTT } from '@prisma/client';

const mockTranscriptionResult: TranscriptionResult = {
  texto: 'Olá alunos, hoje vamos falar sobre frações.',
  provider: ProviderSTT.WHISPER,
  idioma: 'pt-BR',
  duracao_segundos: 120,
  confianca: 0.95,
  custo_usd: 0.006,
  tempo_processamento_ms: 3500,
};

function createMockProvider(name: ProviderSTT): jest.Mocked<STTProvider> {
  return {
    getName: jest.fn().mockReturnValue(name),
    transcribe: jest
      .fn()
      .mockResolvedValue({ ...mockTranscriptionResult, provider: name }),
    isAvailable: jest.fn().mockResolvedValue(true),
  };
}

describe('STTRouterService', () => {
  let service: STTRouterService;
  let whisperProvider: jest.Mocked<STTProvider>;
  let googleProvider: jest.Mocked<STTProvider>;
  let groqWhisperProvider: jest.Mocked<STTProvider>;
  let configService: jest.Mocked<ProvidersConfigService>;

  beforeEach(() => {
    whisperProvider = createMockProvider(ProviderSTT.WHISPER);
    googleProvider = createMockProvider(ProviderSTT.GOOGLE);
    groqWhisperProvider = createMockProvider(ProviderSTT.GROQ_WHISPER);
    configService = {
      getSTTConfig: jest
        .fn()
        .mockReturnValue({ primary: 'WHISPER', fallback: 'GOOGLE' }),
      getLLMConfig: jest.fn(),
      getConfig: jest.fn(),
    } as any;

    service = new STTRouterService(
      whisperProvider,
      googleProvider,
      groqWhisperProvider,
      configService,
    );
  });

  describe('getSTTProvider', () => {
    it('should return primary provider based on config', () => {
      const provider = service.getSTTProvider();

      expect(provider.getName()).toBe(ProviderSTT.WHISPER);
    });

    it('should return Google when config sets Google as primary', () => {
      configService.getSTTConfig.mockReturnValue({
        primary: 'GOOGLE',
        fallback: 'WHISPER',
      });

      const provider = service.getSTTProvider();

      expect(provider.getName()).toBe(ProviderSTT.GOOGLE);
    });

    it('should return Groq Whisper when config sets GROQ_WHISPER as primary', () => {
      configService.getSTTConfig.mockReturnValue({
        primary: 'GROQ_WHISPER',
        fallback: 'WHISPER',
      });

      const provider = service.getSTTProvider();

      expect(provider.getName()).toBe(ProviderSTT.GROQ_WHISPER);
    });

    it('should throw for unknown provider key', () => {
      configService.getSTTConfig.mockReturnValue({
        primary: 'AZURE',
        fallback: 'GOOGLE',
      });

      expect(() => service.getSTTProvider()).toThrow(
        'Unknown STT provider: AZURE',
      );
    });
  });

  describe('getSTTFallback', () => {
    it('should return fallback provider based on config', () => {
      const provider = service.getSTTFallback();

      expect(provider.getName()).toBe(ProviderSTT.GOOGLE);
    });

    it('should return Whisper when config sets Whisper as fallback', () => {
      configService.getSTTConfig.mockReturnValue({
        primary: 'GOOGLE',
        fallback: 'WHISPER',
      });

      const provider = service.getSTTFallback();

      expect(provider.getName()).toBe(ProviderSTT.WHISPER);
    });
  });

  describe('transcribeWithFallback', () => {
    const audioBuffer = Buffer.from('fake-audio');

    it('should use primary provider on success', async () => {
      const result = await service.transcribeWithFallback(audioBuffer);

      expect(result.provider).toBe(ProviderSTT.WHISPER);
      expect(whisperProvider.transcribe).toHaveBeenCalledWith(audioBuffer, {});
      expect(googleProvider.transcribe).not.toHaveBeenCalled();
    });

    it('should fallback to secondary on primary failure', async () => {
      whisperProvider.transcribe.mockRejectedValueOnce(
        new Error('Whisper API error'),
      );

      const result = await service.transcribeWithFallback(audioBuffer);

      expect(result.provider).toBe(ProviderSTT.GOOGLE);
      expect(whisperProvider.transcribe).toHaveBeenCalled();
      expect(googleProvider.transcribe).toHaveBeenCalled();
    });

    it('should throw when both providers fail', async () => {
      whisperProvider.transcribe.mockRejectedValueOnce(
        new Error('Whisper down'),
      );
      googleProvider.transcribe.mockRejectedValueOnce(new Error('Google down'));

      await expect(service.transcribeWithFallback(audioBuffer)).rejects.toThrow(
        'STT transcription failed on all providers',
      );
    });

    it('should pass options to provider', async () => {
      const options = { idioma: 'pt-BR', model: 'whisper-1' };

      await service.transcribeWithFallback(audioBuffer, options);

      expect(whisperProvider.transcribe).toHaveBeenCalledWith(
        audioBuffer,
        options,
      );
    });

    it('should use config-driven provider selection', async () => {
      configService.getSTTConfig.mockReturnValue({
        primary: 'GOOGLE',
        fallback: 'WHISPER',
      });

      const result = await service.transcribeWithFallback(audioBuffer);

      expect(result.provider).toBe(ProviderSTT.GOOGLE);
      expect(googleProvider.transcribe).toHaveBeenCalled();
      expect(whisperProvider.transcribe).not.toHaveBeenCalled();
    });

    it('should propagate prompt option to fallback provider', async () => {
      whisperProvider.transcribe.mockRejectedValueOnce(
        new Error('Whisper down'),
      );
      const options = { idioma: 'pt-BR', prompt: 'Frações, equações, álgebra' };

      await service.transcribeWithFallback(audioBuffer, options);

      expect(googleProvider.transcribe).toHaveBeenCalledWith(
        audioBuffer,
        options,
      );
    });

    it('should pass prompt option to primary provider', async () => {
      const options = { idioma: 'pt-BR', prompt: 'BNCC vocabulary terms' };

      await service.transcribeWithFallback(audioBuffer, options);

      expect(whisperProvider.transcribe).toHaveBeenCalledWith(
        audioBuffer,
        options,
      );
    });

    it('should propagate words field intact from provider result', async () => {
      const wordsArray = [
        { word: 'Hoje', start: 0.0, end: 0.32 },
        { word: 'vamos', start: 0.32, end: 0.56 },
      ];
      whisperProvider.transcribe.mockResolvedValueOnce({
        ...mockTranscriptionResult,
        words: wordsArray,
      });

      const result = await service.transcribeWithFallback(audioBuffer);

      expect(result.words).toEqual(wordsArray);
    });

    it('should propagate undefined words when provider does not return words', async () => {
      const result = await service.transcribeWithFallback(audioBuffer);

      expect(result.words).toBeUndefined();
    });

    it('should handle timeout on primary and succeed with fallback', async () => {
      // Simulate a provider that hangs indefinitely (never resolves)
      whisperProvider.transcribe.mockRejectedValueOnce(
        new Error('Timeout after 300000ms'),
      );

      const result = await service.transcribeWithFallback(audioBuffer);

      expect(result.provider).toBe(ProviderSTT.GOOGLE);
    });
  });
});
