import { LLMRouterService } from './llm-router.service';
import { ProvidersConfigService } from '../../providers-config/providers-config.service';
import { LLMProvider, LLMResult } from '../interfaces/llm-provider.interface';
import { LLMAnalysisType } from '../../../config/providers.config';
import { ProviderLLM } from '@prisma/client';

const mockLLMResult: LLMResult = {
  texto: 'Análise pedagógica completa.',
  provider: ProviderLLM.CLAUDE_SONNET,
  modelo: 'claude-sonnet-4-5-20250929',
  tokens_input: 1500,
  tokens_output: 800,
  custo_usd: 0.012,
  tempo_processamento_ms: 4200,
};

function createMockProvider(name: ProviderLLM): jest.Mocked<LLMProvider> {
  return {
    getName: jest.fn().mockReturnValue(name),
    generate: jest.fn().mockResolvedValue({ ...mockLLMResult, provider: name }),
    isAvailable: jest.fn().mockResolvedValue(true),
  };
}

describe('LLMRouterService', () => {
  let service: LLMRouterService;
  let claudeProvider: jest.Mocked<LLMProvider>;
  let gptProvider: jest.Mocked<LLMProvider>;
  let configService: jest.Mocked<ProvidersConfigService>;

  beforeEach(() => {
    claudeProvider = createMockProvider(ProviderLLM.CLAUDE_SONNET);
    gptProvider = createMockProvider(ProviderLLM.GPT4_MINI);
    configService = {
      getSTTConfig: jest.fn(),
      getLLMConfig: jest.fn().mockReturnValue({ primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' }),
      getConfig: jest.fn(),
    } as any;

    service = new LLMRouterService(claudeProvider, gptProvider, configService);
  });

  describe('getLLMProvider', () => {
    it('should return primary provider for analise_cobertura', () => {
      const provider = service.getLLMProvider('analise_cobertura');

      expect(provider.getName()).toBe(ProviderLLM.CLAUDE_SONNET);
      expect(configService.getLLMConfig).toHaveBeenCalledWith('analise_cobertura');
    });

    it('should return GPT when config sets GPT as primary for exercicios', () => {
      configService.getLLMConfig.mockReturnValue({ primary: 'GPT4_MINI', fallback: 'CLAUDE_SONNET' });

      const provider = service.getLLMProvider('exercicios');

      expect(provider.getName()).toBe(ProviderLLM.GPT4_MINI);
    });

    it('should throw for unknown provider key', () => {
      configService.getLLMConfig.mockReturnValue({ primary: 'GEMINI_FLASH', fallback: 'GPT4_MINI' });

      expect(() => service.getLLMProvider('analise_cobertura')).toThrow('Unknown LLM provider: GEMINI_FLASH');
    });
  });

  describe('getLLMFallback', () => {
    it('should return fallback provider based on config', () => {
      const provider = service.getLLMFallback('relatorio');

      expect(provider.getName()).toBe(ProviderLLM.GPT4_MINI);
    });

    it('should return Claude when config sets Claude as fallback', () => {
      configService.getLLMConfig.mockReturnValue({ primary: 'GPT4_MINI', fallback: 'CLAUDE_SONNET' });

      const provider = service.getLLMFallback('exercicios');

      expect(provider.getName()).toBe(ProviderLLM.CLAUDE_SONNET);
    });
  });

  describe('generateWithFallback', () => {
    const prompt = 'Analyze this lesson transcript...';
    const options = { temperature: 0.3, maxTokens: 2000 };

    it('should use primary provider on success', async () => {
      const result = await service.generateWithFallback('analise_cobertura', prompt, options);

      expect(result.provider).toBe(ProviderLLM.CLAUDE_SONNET);
      expect(claudeProvider.generate).toHaveBeenCalledWith(prompt, options);
      expect(gptProvider.generate).not.toHaveBeenCalled();
    });

    it('should fallback to secondary on primary failure', async () => {
      claudeProvider.generate.mockRejectedValueOnce(new Error('Claude API error'));

      const result = await service.generateWithFallback('analise_cobertura', prompt);

      expect(result.provider).toBe(ProviderLLM.GPT4_MINI);
      expect(claudeProvider.generate).toHaveBeenCalled();
      expect(gptProvider.generate).toHaveBeenCalled();
    });

    it('should throw when both providers fail', async () => {
      claudeProvider.generate.mockRejectedValueOnce(new Error('Claude down'));
      gptProvider.generate.mockRejectedValueOnce(new Error('GPT down'));

      await expect(
        service.generateWithFallback('relatorio', prompt),
      ).rejects.toThrow('LLM generation failed for relatorio');
    });

    it('should route different analysis types correctly', async () => {
      // exercicios uses GPT as primary
      configService.getLLMConfig.mockImplementation((type: LLMAnalysisType) => {
        if (type === 'exercicios') return { primary: 'GPT4_MINI', fallback: 'CLAUDE_SONNET' };
        return { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' };
      });

      const coberturaResult = await service.generateWithFallback('analise_cobertura', prompt);
      expect(coberturaResult.provider).toBe(ProviderLLM.CLAUDE_SONNET);

      const exerciciosResult = await service.generateWithFallback('exercicios', prompt);
      expect(exerciciosResult.provider).toBe(ProviderLLM.GPT4_MINI);
    });

    it('should work for all five analysis types', async () => {
      const types: LLMAnalysisType[] = [
        'analise_cobertura',
        'analise_qualitativa',
        'relatorio',
        'exercicios',
        'alertas',
      ];

      for (const type of types) {
        const result = await service.generateWithFallback(type, prompt);
        expect(result).toBeDefined();
        expect(configService.getLLMConfig).toHaveBeenCalledWith(type);
      }
    });

    it('should include analysisType in error message', async () => {
      claudeProvider.generate.mockRejectedValueOnce(new Error('fail1'));
      gptProvider.generate.mockRejectedValueOnce(new Error('fail2'));

      await expect(
        service.generateWithFallback('alertas', prompt),
      ).rejects.toThrow('alertas');
    });
  });
});
