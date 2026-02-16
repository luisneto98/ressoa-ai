import { Injectable, Inject, Logger } from '@nestjs/common';
import type { LLMProvider, LLMResult, GenerateOptions } from '../interfaces/llm-provider.interface';
import { LLMAnalysisType } from '../../../config/providers.config';
import { ProvidersConfigService } from '../../providers-config/providers-config.service';

@Injectable()
export class LLMRouterService {
  private readonly logger = new Logger(LLMRouterService.name);
  private readonly providerMap: Map<string, LLMProvider>;

  constructor(
    @Inject('CLAUDE_PROVIDER') private claudeProvider: LLMProvider,
    @Inject('GPT_PROVIDER') private gptProvider: LLMProvider,
    @Inject('GEMINI_PROVIDER') private geminiProvider: LLMProvider,
    private configService: ProvidersConfigService,
  ) {
    this.providerMap = new Map<string, LLMProvider>([
      ['CLAUDE_SONNET', this.claudeProvider],
      ['GPT4_MINI', this.gptProvider],
      ['GEMINI_FLASH', this.geminiProvider],
    ]);
  }

  getLLMProvider(analysisType: LLMAnalysisType): LLMProvider {
    const config = this.configService.getLLMConfig(analysisType);
    return this.getProviderByKey(config.primary);
  }

  getLLMFallback(analysisType: LLMAnalysisType): LLMProvider {
    const config = this.configService.getLLMConfig(analysisType);
    return this.getProviderByKey(config.fallback);
  }

  async generateWithFallback(
    analysisType: LLMAnalysisType,
    prompt: string,
    options?: GenerateOptions,
  ): Promise<LLMResult> {
    const config = this.configService.getLLMConfig(analysisType);
    const startTime = Date.now();

    // Primary attempt
    try {
      const primary = this.getProviderByKey(config.primary);
      this.logger.log(
        `LLM routing: analysisType=${analysisType}, attempting primary provider ${config.primary}`,
      );

      const result = await this.generateWithTimeout(primary, prompt, options, 300000);

      const duration = Date.now() - startTime;
      this.logger.log(
        `LLM generation successful: analysisType=${analysisType}, provider=${config.primary}, tokens=${result.tokens_input}+${result.tokens_output}, cost=$${result.custo_usd}, duration=${duration}ms`,
      );
      return result;
    } catch (primaryError) {
      const primaryMsg =
        primaryError instanceof Error ? primaryError.message : 'Unknown error';
      this.logger.warn(
        `LLM primary provider ${config.primary} failed for ${analysisType}: ${primaryMsg}`,
      );

      // Fallback attempt
      try {
        const fallback = this.getProviderByKey(config.fallback);
        this.logger.log(
          `LLM routing: analysisType=${analysisType}, attempting fallback provider ${config.fallback}`,
        );

        const result = await this.generateWithTimeout(fallback, prompt, options, 300000);

        const duration = Date.now() - startTime;
        this.logger.log(
          `LLM fallback successful: analysisType=${analysisType}, provider=${config.fallback}, tokens=${result.tokens_input}+${result.tokens_output}, cost=$${result.custo_usd}, duration=${duration}ms`,
        );
        return result;
      } catch (fallbackError) {
        const fallbackMsg =
          fallbackError instanceof Error
            ? fallbackError.message
            : 'Unknown error';
        this.logger.error(
          `LLM all providers failed for ${analysisType}: primary=${config.primary} (${primaryMsg}), fallback=${config.fallback} (${fallbackMsg})`,
        );
        throw new Error(
          `LLM generation failed for ${analysisType}: primary=${config.primary} (${primaryMsg}), fallback=${config.fallback} (${fallbackMsg})`,
        );
      }
    }
  }

  private async generateWithTimeout(
    provider: LLMProvider,
    prompt: string,
    options: GenerateOptions | undefined,
    timeoutMs: number,
  ): Promise<LLMResult> {
    let timer: ReturnType<typeof setTimeout>;
    try {
      return await Promise.race([
        provider.generate(prompt, options),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`Timeout after ${timeoutMs}ms`)),
            timeoutMs,
          );
        }),
      ]);
    } finally {
      clearTimeout(timer!);
    }
  }

  private getProviderByKey(key: string): LLMProvider {
    const provider = this.providerMap.get(key);
    if (!provider) {
      throw new Error(
        `Unknown LLM provider: ${key}. Available: ${[...this.providerMap.keys()].join(', ')}`,
      );
    }
    return provider;
  }
}
