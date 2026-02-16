import { WhisperProvider } from './whisper.provider';
import { ProviderSTT } from '@prisma/client';
import * as fs from 'fs';

// Mock openai
const mockCreate = jest.fn();
const mockModelsRetrieve = jest.fn();
const mockOpenAIInstance = {
  audio: {
    transcriptions: { create: mockCreate },
  },
  models: { retrieve: mockModelsRetrieve },
};
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn(() => mockOpenAIInstance),
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
      OPENAI_API_KEY: 'sk-test-key',
    };
    return config[key];
  }),
};

const mockVerboseResponse = {
  text: 'Hoje vamos falar sobre frações equivalentes.',
  language: 'pt',
  duration: 120,
  segments: [
    { confidence: 0.92, text: 'Hoje vamos falar' },
    { confidence: 0.88, text: 'sobre frações equivalentes.' },
  ],
};

describe('WhisperProvider', () => {
  let provider: WhisperProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockResolvedValue(mockVerboseResponse);
    mockModelsRetrieve.mockResolvedValue({ id: 'whisper-1' });
    provider = new WhisperProvider(mockConfigService as any);
  });

  describe('getName', () => {
    it('should return ProviderSTT.WHISPER', () => {
      expect(provider.getName()).toBe(ProviderSTT.WHISPER);
    });
  });

  describe('transcribe', () => {
    const audioBuffer = Buffer.from('fake-audio-data');

    it('should transcribe audio without prompt (backward compat)', async () => {
      const result = await provider.transcribe(audioBuffer);

      expect(result.texto).toBe('Hoje vamos falar sobre frações equivalentes.');
      expect(result.provider).toBe(ProviderSTT.WHISPER);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.not.objectContaining({ prompt: expect.anything() }),
      );
      expect(result.metadata?.stt_prompt_used).toBeUndefined();
    });

    it('should pass prompt to OpenAI API when provided', async () => {
      const prompt = 'Frações, equações, álgebra';
      await provider.transcribe(audioBuffer, { prompt });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ prompt }),
      );
    });

    it('should not pass prompt when undefined', async () => {
      await provider.transcribe(audioBuffer, { prompt: undefined });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.not.objectContaining({ prompt: expect.anything() }),
      );
    });

    it('should set stt_prompt_used in metadata when prompt provided', async () => {
      const result = await provider.transcribe(audioBuffer, {
        prompt: 'BNCC terms',
      });

      expect(result.metadata?.stt_prompt_used).toBe(true);
    });

    it('should not set stt_prompt_used when no prompt', async () => {
      const result = await provider.transcribe(audioBuffer);

      expect(result.metadata?.stt_prompt_used).toBeUndefined();
    });

    it('should calculate cost correctly ($0.006/min)', async () => {
      const result = await provider.transcribe(audioBuffer);

      // 120s / 60 * $0.006 = $0.012
      expect(result.custo_usd).toBeCloseTo(0.012, 4);
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
  });

  describe('isAvailable', () => {
    it('should return true when API is reachable', async () => {
      expect(await provider.isAvailable()).toBe(true);
    });

    it('should return false when API is unreachable', async () => {
      mockModelsRetrieve.mockRejectedValueOnce(new Error('Network error'));
      expect(await provider.isAvailable()).toBe(false);
    });
  });
});
