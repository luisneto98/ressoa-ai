import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ProviderLLM } from '@prisma/client';
import { ClaudeProvider } from './claude.provider';

// Mock Anthropic SDK
const mockAnthropicCreate = jest.fn();
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: mockAnthropicCreate,
    },
  }));
});

describe('ClaudeProvider', () => {
  let provider: ClaudeProvider;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'ANTHROPIC_API_KEY') return 'sk-ant-test-key';
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaudeProvider,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    provider = module.get<ClaudeProvider>(ClaudeProvider);
    mockAnthropicCreate.mockClear();
  });

  describe('getName', () => {
    it('should return CLAUDE_SONNET', () => {
      expect(provider.getName()).toBe(ProviderLLM.CLAUDE_SONNET);
    });
  });

  describe('generate', () => {
    it('should generate text and return valid LLMResult', async () => {
      // Mock Anthropic API response
      const mockResponse = {
        content: [{ type: 'text', text: 'Análise pedagógica gerada' }],
        usage: {
          input_tokens: 1000,
          output_tokens: 500,
        },
        stop_reason: 'end_turn',
      };
      mockAnthropicCreate.mockResolvedValue(mockResponse);

      const result = await provider.generate('Analise esta aula', {
        temperature: 0.7,
        maxTokens: 4000,
        systemPrompt: 'Você é um assistente pedagógico',
      });

      // Validate result structure
      expect(result.texto).toBe('Análise pedagógica gerada');
      expect(result.provider).toBe(ProviderLLM.CLAUDE_SONNET);
      expect(result.modelo).toBe('claude-sonnet-4');
      expect(result.tokens_input).toBe(1000);
      expect(result.tokens_output).toBe(500);

      // Validate cost calculation: $3/1M input, $15/1M output
      const expectedCost = (1000 / 1_000_000) * 3 + (500 / 1_000_000) * 15;
      expect(result.custo_usd).toBeCloseTo(expectedCost, 6);

      expect(result.tempo_processamento_ms).toBeGreaterThanOrEqual(0);
      expect(result.metadata).toEqual({ stop_reason: 'end_turn' });

      // Validate API call parameters
      expect(mockAnthropicCreate).toHaveBeenCalledWith({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0.7,
        system: 'Você é um assistente pedagógico',
        messages: [{ role: 'user', content: 'Analise esta aula' }],
      });
    });

    it('should use default options when not provided', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Resposta' }],
        usage: { input_tokens: 100, output_tokens: 50 },
        stop_reason: 'end_turn',
      };
      mockAnthropicCreate.mockResolvedValue(mockResponse);

      await provider.generate('Prompt simples');

      expect(mockAnthropicCreate).toHaveBeenCalledWith({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0.7,
        system: undefined,
        messages: [{ role: 'user', content: 'Prompt simples' }],
      });
    });

    it('should calculate cost correctly for different token counts', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Texto' }],
        usage: {
          input_tokens: 2000,
          output_tokens: 1500,
        },
        stop_reason: 'end_turn',
      };
      mockAnthropicCreate.mockResolvedValue(mockResponse);

      const result = await provider.generate('Test');

      // Cost: (2000/1M)*3 + (1500/1M)*15 = 0.006 + 0.0225 = 0.0285
      expect(result.custo_usd).toBeCloseTo(0.0285, 6);
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('API rate limit exceeded');
      mockAnthropicCreate.mockRejectedValue(mockError);

      await expect(provider.generate('Test')).rejects.toThrow(
        'ClaudeProvider: Falha ao gerar texto - API rate limit exceeded',
      );
    });

    it('should handle non-text content type', async () => {
      const mockResponse = {
        content: [{ type: 'image', source: {} }],
        usage: { input_tokens: 100, output_tokens: 0 },
        stop_reason: 'end_turn',
      };
      mockAnthropicCreate.mockResolvedValue(mockResponse);

      const result = await provider.generate('Test');

      expect(result.texto).toBe('');
    });
  });

  describe('isAvailable', () => {
    it('should return true when API responds successfully', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'ok' }],
        usage: { input_tokens: 5, output_tokens: 1 },
        stop_reason: 'end_turn',
      };
      mockAnthropicCreate.mockResolvedValue(mockResponse);

      const result = await provider.isAvailable();

      expect(result).toBe(true);
      expect(mockAnthropicCreate).toHaveBeenCalledWith({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
    });

    it('should return false when API fails', async () => {
      mockAnthropicCreate.mockRejectedValue(new Error('Network error'));

      const result = await provider.isAvailable();

      expect(result).toBe(false);
    });
  });
});
