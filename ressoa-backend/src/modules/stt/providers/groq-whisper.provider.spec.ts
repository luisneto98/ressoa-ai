import { GroqWhisperProvider } from './groq-whisper.provider';
import { ProviderSTT } from '@prisma/client';
import * as fs from 'fs';

// Mock groq-sdk
const mockCreate = jest.fn();
const mockModelsRetrieve = jest.fn();
const mockGroqInstance = {
  audio: {
    transcriptions: { create: mockCreate },
  },
  models: { retrieve: mockModelsRetrieve },
};
jest.mock('groq-sdk', () => ({
  __esModule: true,
  default: jest.fn(() => mockGroqInstance),
}));

// Mock fs
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  createReadStream: jest.fn().mockReturnValue('mock-stream'),
  promises: {
    writeFile: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock crypto.randomUUID
jest.mock('crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('test-uuid-1234'),
}));

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      GROQ_API_KEY: 'gsk_test_key',
      GROQ_WHISPER_MODEL: 'whisper-large-v3-turbo',
    };
    return config[key];
  }),
};

const mockVerboseResponse = {
  text: 'Hoje vamos falar sobre frações equivalentes.',
  language: 'pt',
  duration: 120,
  segments: [
    { avg_logprob: -0.15, text: 'Hoje vamos falar' },
    { avg_logprob: -0.2, text: 'sobre frações equivalentes.' },
  ],
};

describe('GroqWhisperProvider', () => {
  let provider: GroqWhisperProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockResolvedValue(mockVerboseResponse);
    mockModelsRetrieve.mockResolvedValue({ id: 'whisper-large-v3-turbo' });
    mockConfigService.get.mockImplementation((key: string) => {
      const config: Record<string, string> = {
        GROQ_API_KEY: 'gsk_test_key',
        GROQ_WHISPER_MODEL: 'whisper-large-v3-turbo',
      };
      return config[key];
    });
    provider = new GroqWhisperProvider(mockConfigService as any);
  });

  describe('getName', () => {
    it('should return ProviderSTT.GROQ_WHISPER from getName()', () => {
      expect(provider.getName()).toBe(ProviderSTT.GROQ_WHISPER);
    });
  });

  describe('transcribe', () => {
    const audioBuffer = Buffer.from('fake-audio-data');

    it('should transcribe audio and return normalized TranscriptionResult', async () => {
      const result = await provider.transcribe(audioBuffer);

      expect(result.texto).toBe('Hoje vamos falar sobre frações equivalentes.');
      expect(result.provider).toBe(ProviderSTT.GROQ_WHISPER);
      expect(result.idioma).toBe('pt');
      expect(result.duracao_segundos).toBe(120);
      expect(result.custo_usd).toBeGreaterThan(0);
      expect(result.tempo_processamento_ms).toBeGreaterThanOrEqual(0);
      expect(result.metadata).toEqual(
        expect.objectContaining({
          model: 'whisper-large-v3-turbo',
          segments_count: 2,
        }),
      );
    });

    it('should calculate cost correctly for whisper-large-v3-turbo', async () => {
      const result = await provider.transcribe(audioBuffer);

      // 120s / 3600 * $0.04 = $0.001333...
      const expectedCost = (120 / 3600) * 0.04;
      expect(result.custo_usd).toBeCloseTo(expectedCost, 6);
    });

    it('should calculate cost correctly for whisper-large-v3', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GROQ_WHISPER_MODEL') return 'whisper-large-v3';
        if (key === 'GROQ_API_KEY') return 'gsk_test_key';
        return undefined;
      });

      const result = await provider.transcribe(audioBuffer);

      // 120s / 3600 * $0.111 = $0.003700
      const expectedCost = (120 / 3600) * 0.111;
      expect(result.custo_usd).toBeCloseTo(expectedCost, 6);
    });

    it('should calculate cost correctly for distil-whisper-large-v3-en', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GROQ_WHISPER_MODEL') return 'distil-whisper-large-v3-en';
        if (key === 'GROQ_API_KEY') return 'gsk_test_key';
        return undefined;
      });

      const result = await provider.transcribe(audioBuffer);

      // 120s / 3600 * $0.02 = $0.000666...
      const expectedCost = (120 / 3600) * 0.02;
      expect(result.custo_usd).toBeCloseTo(expectedCost, 6);
    });

    it('should enforce minimum 10s billing', async () => {
      mockCreate.mockResolvedValueOnce({
        ...mockVerboseResponse,
        duration: 3, // Only 3 seconds
      });

      const result = await provider.transcribe(audioBuffer);

      // min(10, 3) = 10 → 10/3600 * $0.04
      const expectedCost = (10 / 3600) * 0.04;
      expect(result.custo_usd).toBeCloseTo(expectedCost, 6);
      expect(result.metadata?.billed_seconds).toBe(10);
    });

    it('should handle rate limit error (429)', async () => {
      mockCreate.mockRejectedValueOnce({
        status: 429,
        message: 'Rate limit exceeded',
      });

      await expect(provider.transcribe(audioBuffer)).rejects.toThrow(
        'Groq Whisper rate limit exceeded',
      );
    });

    it('should handle quota error (402)', async () => {
      mockCreate.mockRejectedValueOnce({
        status: 402,
        message: 'Insufficient quota',
      });

      await expect(provider.transcribe(audioBuffer)).rejects.toThrow(
        'Groq Whisper quota exceeded',
      );
    });

    it('should handle insufficient_quota error code', async () => {
      mockCreate.mockRejectedValueOnce({
        status: 400,
        error: { code: 'insufficient_quota' },
        message: 'Insufficient quota',
      });

      await expect(provider.transcribe(audioBuffer)).rejects.toThrow(
        'Groq Whisper quota exceeded',
      );
    });

    it('should handle generic API error', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Connection refused'));

      await expect(provider.transcribe(audioBuffer)).rejects.toThrow(
        'Groq Whisper error: Connection refused',
      );
    });

    it('should cleanup temp file after transcription', async () => {
      await provider.transcribe(audioBuffer);

      expect(fs.promises.unlink).toHaveBeenCalledWith('/tmp/test-uuid-1234.mp3');
    });

    it('should cleanup temp file on error', async () => {
      mockCreate.mockRejectedValueOnce(new Error('API error'));

      await expect(provider.transcribe(audioBuffer)).rejects.toThrow();
      expect(fs.promises.unlink).toHaveBeenCalledWith('/tmp/test-uuid-1234.mp3');
    });

    it('should normalize language codes (pt-BR → pt)', async () => {
      await provider.transcribe(audioBuffer, { idioma: 'pt-BR' });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'pt' }),
      );
    });

    it('should use default model when GROQ_WHISPER_MODEL not set', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GROQ_API_KEY') return 'gsk_test_key';
        return undefined; // GROQ_WHISPER_MODEL not set
      });

      await provider.transcribe(audioBuffer);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'whisper-large-v3-turbo' }),
      );
    });

    it('should calculate confidence from avg_logprob', async () => {
      // avg of -0.15 and -0.2 = -0.175 → 1 + (-0.175) = 0.825
      const result = await provider.transcribe(audioBuffer);

      expect(result.confianca).toBeCloseTo(0.825, 3);
    });

    it('should return default confidence 0.9 when no segments', async () => {
      mockCreate.mockResolvedValueOnce({
        ...mockVerboseResponse,
        segments: [],
      });

      const result = await provider.transcribe(audioBuffer);

      expect(result.confianca).toBe(0.9);
    });

    it('should clamp confidence between 0 and 1', async () => {
      mockCreate.mockResolvedValueOnce({
        ...mockVerboseResponse,
        segments: [{ avg_logprob: -2.0 }], // Very low → 1 + (-2.0) = -1.0 → clamped to 0
      });

      const result = await provider.transcribe(audioBuffer);

      expect(result.confianca).toBe(0);
    });

    it('should handle timeout error', async () => {
      // Simulate a timeout error thrown by the timeout mechanism
      mockCreate.mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Groq Whisper timeout after 300000ms')), 10);
        });
      });

      await expect(provider.transcribe(audioBuffer)).rejects.toThrow(
        'Groq Whisper error: Groq Whisper timeout after 300000ms',
      );
    });

    it('should fallback to default model cost for unknown model', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GROQ_WHISPER_MODEL') return 'whisper-v4-future';
        if (key === 'GROQ_API_KEY') return 'gsk_test_key';
        return undefined;
      });
      mockCreate.mockResolvedValueOnce(mockVerboseResponse);

      const result = await provider.transcribe(audioBuffer);

      // Unknown model falls back to default cost ($0.04/hr)
      const expectedCost = (120 / 3600) * 0.04;
      expect(result.custo_usd).toBeCloseTo(expectedCost, 6);
    });

    it('should call Groq API with correct parameters', async () => {
      await provider.transcribe(audioBuffer, { idioma: 'en-US' });

      expect(mockCreate).toHaveBeenCalledWith({
        file: 'mock-stream',
        model: 'whisper-large-v3-turbo',
        response_format: 'verbose_json',
        language: 'en',
        temperature: 0.0,
      });
    });
  });

  describe('isAvailable', () => {
    it('should check availability via isAvailable()', async () => {
      mockModelsRetrieve.mockResolvedValueOnce({ id: 'whisper-large-v3-turbo' });

      const result = await provider.isAvailable();

      expect(result).toBe(true);
      expect(mockModelsRetrieve).toHaveBeenCalledWith('whisper-large-v3-turbo');
    });

    it('should return false when API is unreachable', async () => {
      mockModelsRetrieve.mockRejectedValueOnce(new Error('Network error'));

      const result = await provider.isAvailable();

      expect(result).toBe(false);
    });
  });
});
