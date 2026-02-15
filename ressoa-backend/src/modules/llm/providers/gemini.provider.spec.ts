import { ConfigService } from '@nestjs/config';
import { ProviderLLM } from '@prisma/client';
import { GeminiProvider } from './gemini.provider';

const mockGenerateContent = jest.fn();
const mockGetModel = jest.fn();
const mockAi = {
  models: {
    generateContent: mockGenerateContent,
    get: mockGetModel,
  },
};

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn(() => mockAi),
}));

const mockResponse = {
  text: 'Análise pedagógica completa.',
  usageMetadata: {
    promptTokenCount: 1500,
    candidatesTokenCount: 800,
  },
  candidates: [
    {
      finishReason: 'STOP',
      safetyRatings: [],
    },
  ],
};

describe('GeminiProvider', () => {
  let provider: GeminiProvider;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          GEMINI_API_KEY: 'test-api-key',
          GEMINI_MODEL: 'gemini-2.0-flash',
        };
        return config[key];
      }),
    } as any;

    provider = new GeminiProvider(configService);
    mockGenerateContent.mockResolvedValue({ ...mockResponse });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getName', () => {
    it('should return ProviderLLM.GEMINI_FLASH', () => {
      expect(provider.getName()).toBe(ProviderLLM.GEMINI_FLASH);
    });
  });

  describe('generate', () => {
    it('should generate text and return normalized LLMResult', async () => {
      const resultPromise = provider.generate('Test prompt');
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result.texto).toBe('Análise pedagógica completa.');
      expect(result.provider).toBe(ProviderLLM.GEMINI_FLASH);
      expect(result.modelo).toBe('gemini-2.0-flash');
      expect(result.tokens_input).toBe(1500);
      expect(result.tokens_output).toBe(800);
      expect(result.tempo_processamento_ms).toBeGreaterThanOrEqual(0);
    });

    it('should calculate cost correctly ($0.10/1M input, $0.40/1M output)', async () => {
      const resultPromise = provider.generate('Test prompt');
      jest.runAllTimers();
      const result = await resultPromise;

      // Input: 1500 / 1_000_000 * 0.10 = 0.00015
      // Output: 800 / 1_000_000 * 0.40 = 0.00032
      // Total: 0.00047
      const expectedCost = (1500 / 1_000_000) * 0.1 + (800 / 1_000_000) * 0.4;
      expect(result.custo_usd).toBeCloseTo(expectedCost, 8);
    });

    it('should pass systemPrompt as config.systemInstruction', async () => {
      const resultPromise = provider.generate('Test', {
        systemPrompt: 'You are a teacher',
      });
      jest.runAllTimers();
      await resultPromise;

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            systemInstruction: 'You are a teacher',
          }),
        }),
      );
    });

    it('should pass temperature and maxOutputTokens from options', async () => {
      const resultPromise = provider.generate('Test', {
        temperature: 0.3,
        maxTokens: 2000,
      });
      jest.runAllTimers();
      await resultPromise;

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            temperature: 0.3,
            maxOutputTokens: 2000,
          }),
        }),
      );
    });

    it('should use default temperature 0.7 and maxTokens 4000 when not provided', async () => {
      const resultPromise = provider.generate('Test');
      jest.runAllTimers();
      await resultPromise;

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            temperature: 0.7,
            maxOutputTokens: 4000,
          }),
        }),
      );
    });

    it('should use default model when GEMINI_MODEL not set', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'GEMINI_API_KEY') return 'test-key';
        return undefined;
      });

      const providerNoModel = new GeminiProvider(configService);
      expect(providerNoModel.getName()).toBe(ProviderLLM.GEMINI_FLASH);

      const resultPromise = providerNoModel.generate('Test');
      jest.runAllTimers();
      await resultPromise;

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gemini-2.0-flash' }),
      );
    });

    it('should include finish_reason in metadata', async () => {
      const resultPromise = provider.generate('Test');
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result.metadata).toEqual({ finish_reason: 'STOP' });
    });

    it('should handle missing candidates with UNKNOWN finish_reason', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: 'Some text',
        usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 50 },
      });

      const resultPromise = provider.generate('Test');
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result.metadata).toEqual({ finish_reason: 'UNKNOWN' });
    });

    it('should handle undefined response.text gracefully', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 50 },
        candidates: [{ finishReason: 'STOP', safetyRatings: [] }],
      });

      const resultPromise = provider.generate('Test');
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result.texto).toBe('');
    });

    it('should handle missing usageMetadata gracefully', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: 'Response without metadata',
        candidates: [{ finishReason: 'STOP', safetyRatings: [] }],
      });

      const resultPromise = provider.generate('Test');
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result.tokens_input).toBe(0);
      expect(result.tokens_output).toBe(0);
      expect(result.custo_usd).toBe(0);
    });

    it('should configure safety settings with BLOCK_ONLY_HIGH', async () => {
      const resultPromise = provider.generate('Test');
      jest.runAllTimers();
      await resultPromise;

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            safetySettings: expect.arrayContaining([
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_ONLY_HIGH',
              },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_ONLY_HIGH',
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_ONLY_HIGH',
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_ONLY_HIGH',
              },
            ]),
          }),
        }),
      );
    });
  });

  describe('error handling', () => {
    it('should handle safety filter block (finishReason=SAFETY)', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: '',
        usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 0 },
        candidates: [
          {
            finishReason: 'SAFETY',
            safetyRatings: [
              { category: 'HARM_CATEGORY_HARASSMENT', probability: 'HIGH' },
            ],
          },
        ],
      });

      const resultPromise = provider.generate('Test');
      jest.runAllTimers();

      await expect(resultPromise).rejects.toThrow(
        'GeminiProvider: Output bloqueado por safety filters',
      );
    });

    it('should handle rate limit error (429)', async () => {
      const rateLimitError = new Error('Too many requests') as any;
      rateLimitError.status = 429;
      mockGenerateContent.mockRejectedValueOnce(rateLimitError);

      const resultPromise = provider.generate('Test');
      jest.runAllTimers();

      await expect(resultPromise).rejects.toThrow(
        'GeminiProvider: Rate limit excedido (429)',
      );
    });

    it('should handle rate limit error via code property (429)', async () => {
      const rateLimitError = new Error('Rate limited') as any;
      rateLimitError.code = 429;
      mockGenerateContent.mockRejectedValueOnce(rateLimitError);

      const resultPromise = provider.generate('Test');
      jest.runAllTimers();

      await expect(resultPromise).rejects.toThrow(
        'GeminiProvider: Rate limit excedido (429)',
      );
    });

    it('should handle non-Error thrown in generate', async () => {
      mockGenerateContent.mockRejectedValueOnce('raw string error');

      const resultPromise = provider.generate('Test');
      jest.runAllTimers();

      await expect(resultPromise).rejects.toThrow(
        'GeminiProvider: Falha ao gerar texto - raw string error',
      );
    });

    it('should handle quota exceeded error', async () => {
      mockGenerateContent.mockRejectedValueOnce(
        new Error('RESOURCE_EXHAUSTED: Quota exceeded'),
      );

      const resultPromise = provider.generate('Test');
      jest.runAllTimers();

      await expect(resultPromise).rejects.toThrow(
        'GeminiProvider: Quota excedida',
      );
    });

    it('should handle generic API error', async () => {
      mockGenerateContent.mockRejectedValueOnce(
        new Error('Internal server error'),
      );

      const resultPromise = provider.generate('Test');
      jest.runAllTimers();

      await expect(resultPromise).rejects.toThrow(
        'GeminiProvider: Falha ao gerar texto - Internal server error',
      );
    });

    it('should handle timeout (120s)', async () => {
      mockGenerateContent.mockImplementation(
        () => new Promise(() => {}), // never resolves
      );

      const resultPromise = provider.generate('Test');
      jest.advanceTimersByTime(120000);

      await expect(resultPromise).rejects.toThrow(
        'GeminiProvider: Timeout após 120s',
      );
    });

    it('should cleanup timeout timer on success', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const resultPromise = provider.generate('Test');
      jest.runAllTimers();
      await resultPromise;

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('isAvailable', () => {
    it('should return true when API is available', async () => {
      mockGetModel.mockResolvedValueOnce({ name: 'gemini-2.0-flash' });

      const result = await provider.isAvailable();
      expect(result).toBe(true);

      expect(mockGetModel).toHaveBeenCalledWith({ model: 'gemini-2.0-flash' });
    });

    it('should return false when API is not available', async () => {
      mockGetModel.mockRejectedValueOnce(new Error('API down'));

      const result = await provider.isAvailable();
      expect(result).toBe(false);
    });

    it('should handle non-Error thrown in isAvailable', async () => {
      mockGetModel.mockRejectedValueOnce('string error');

      const result = await provider.isAvailable();
      expect(result).toBe(false);
    });
  });

  describe('constructor warnings', () => {
    it('should not throw when GEMINI_API_KEY not configured', () => {
      configService.get.mockReturnValue(undefined);
      // Should create provider without throwing, even without API key
      expect(() => new GeminiProvider(configService)).not.toThrow();
    });
  });
});
