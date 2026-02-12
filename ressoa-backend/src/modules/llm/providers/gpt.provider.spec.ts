import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ProviderLLM } from '@prisma/client';
import { GPTProvider } from './gpt.provider';

// Mock OpenAI SDK
const mockOpenAICreate = jest.fn();
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockOpenAICreate,
      },
    },
  }));
});

describe('GPTProvider', () => {
  let provider: GPTProvider;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'OPENAI_API_KEY') return 'sk-test-key';
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GPTProvider,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    provider = module.get<GPTProvider>(GPTProvider);
    mockOpenAICreate.mockClear();
  });

  describe('getName', () => {
    it('should return GPT4_MINI', () => {
      expect(provider.getName()).toBe(ProviderLLM.GPT4_MINI);
    });
  });

  describe('generate', () => {
    it('should generate text and return valid LLMResult', async () => {
      // Mock OpenAI API response
      const mockResponse = {
        choices: [
          {
            message: { content: 'Exercício contextual gerado' },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 800,
          completion_tokens: 600,
        },
      };
      mockOpenAICreate.mockResolvedValue(mockResponse);

      const result = await provider.generate('Crie um exercício', {
        temperature: 0.7,
        maxTokens: 4000,
        systemPrompt: 'Você é um gerador de exercícios',
      });

      // Validate result structure
      expect(result.texto).toBe('Exercício contextual gerado');
      expect(result.provider).toBe(ProviderLLM.GPT4_MINI);
      expect(result.modelo).toBe('gpt-4o-mini');
      expect(result.tokens_input).toBe(800);
      expect(result.tokens_output).toBe(600);

      // Validate cost calculation: $0.15/1M input, $0.60/1M output
      const expectedCost = (800 / 1_000_000) * 0.15 + (600 / 1_000_000) * 0.6;
      expect(result.custo_usd).toBeCloseTo(expectedCost, 6);

      expect(result.tempo_processamento_ms).toBeGreaterThanOrEqual(0);
      expect(result.metadata).toEqual({ finish_reason: 'stop' });

      // Validate API call parameters with system prompt
      expect(mockOpenAICreate).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        max_tokens: 4000,
        temperature: 0.7,
        messages: [
          { role: 'system', content: 'Você é um gerador de exercícios' },
          { role: 'user', content: 'Crie um exercício' },
        ],
      });
    });

    it('should handle system prompt correctly', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Resposta' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 100, completion_tokens: 50 },
      };
      mockOpenAICreate.mockResolvedValue(mockResponse);

      await provider.generate('Test', {
        systemPrompt: 'Você é um assistente',
      });

      const callArgs = mockOpenAICreate.mock.calls[0][0];
      expect(callArgs.messages).toHaveLength(2);
      expect(callArgs.messages[0]).toEqual({
        role: 'system',
        content: 'Você é um assistente',
      });
      expect(callArgs.messages[1]).toEqual({
        role: 'user',
        content: 'Test',
      });
    });

    it('should work without system prompt', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Resposta' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 50, completion_tokens: 25 },
      };
      mockOpenAICreate.mockResolvedValue(mockResponse);

      await provider.generate('Prompt simples');

      const callArgs = mockOpenAICreate.mock.calls[0][0];
      expect(callArgs.messages).toHaveLength(1);
      expect(callArgs.messages[0]).toEqual({
        role: 'user',
        content: 'Prompt simples',
      });
    });

    it('should use default options when not provided', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Resposta' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 100, completion_tokens: 50 },
      };
      mockOpenAICreate.mockResolvedValue(mockResponse);

      await provider.generate('Prompt simples');

      expect(mockOpenAICreate).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        max_tokens: 4000,
        temperature: 0.7,
        messages: [{ role: 'user', content: 'Prompt simples' }],
      });
    });

    it('should calculate cost correctly for different token counts', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Texto' }, finish_reason: 'stop' }],
        usage: {
          prompt_tokens: 1500,
          completion_tokens: 2000,
        },
      };
      mockOpenAICreate.mockResolvedValue(mockResponse);

      const result = await provider.generate('Test');

      // Cost: (1500/1M)*0.15 + (2000/1M)*0.60 = 0.000225 + 0.0012 = 0.001425
      expect(result.custo_usd).toBeCloseTo(0.001425, 6);
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('API timeout');
      mockOpenAICreate.mockRejectedValue(mockError);

      await expect(provider.generate('Test')).rejects.toThrow(
        'GPTProvider: Falha ao gerar texto - API timeout',
      );
    });

    it('should handle null content', async () => {
      const mockResponse = {
        choices: [{ message: { content: null }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 100, completion_tokens: 0 },
      };
      mockOpenAICreate.mockResolvedValue(mockResponse);

      const result = await provider.generate('Test');

      expect(result.texto).toBe('');
    });
  });

  describe('isAvailable', () => {
    it('should return true when API responds successfully', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 5, completion_tokens: 1 },
      };
      mockOpenAICreate.mockResolvedValue(mockResponse);

      const result = await provider.isAvailable();

      expect(result).toBe(true);
      expect(mockOpenAICreate).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
    });

    it('should return false when API fails', async () => {
      mockOpenAICreate.mockRejectedValue(new Error('Network error'));

      const result = await provider.isAvailable();

      expect(result).toBe(false);
    });
  });
});
