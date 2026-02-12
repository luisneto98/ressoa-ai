import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ProviderLLM } from '@prisma/client';
import {
  LLMProvider,
  LLMResult,
  GenerateOptions,
} from '../interfaces/llm-provider.interface';

/**
 * Provider para GPT (OpenAI) - LLM para exercícios contextuais
 * Modelo: GPT-4.6 mini
 * Custo: $0.15/1M input tokens, $0.60/1M output tokens
 */
@Injectable()
export class GPTProvider implements LLMProvider {
  private readonly logger = new Logger(GPTProvider.name);
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY não configurada - GPTProvider não funcionará',
      );
    }
    this.openai = new OpenAI({
      apiKey: apiKey || '',
    });
  }

  getName(): ProviderLLM {
    return ProviderLLM.GPT4_MINI;
  }

  /**
   * Gera texto usando GPT-4.6 mini
   * @param prompt - Prompt do usuário
   * @param options - Opções de geração
   * @returns Resultado com texto gerado e metadados
   */
  async generate(
    prompt: string,
    options?: GenerateOptions,
  ): Promise<LLMResult> {
    const startTime = Date.now();

    try {
      this.logger.log({
        message: 'Iniciando chamada OpenAI API',
        provider: 'GPT4_MINI',
        temperature: options?.temperature || 0.7,
        maxTokens: options?.maxTokens || 4000,
      });

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

      // Add system prompt if provided
      if (options?.systemPrompt) {
        messages.push({
          role: 'system' as const,
          content: options.systemPrompt,
        });
      }

      // Add user prompt
      messages.push({
        role: 'user' as const,
        content: prompt,
      });

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // GPT-4.6 mini
        max_tokens: options?.maxTokens || 4000,
        temperature: options?.temperature || 0.7,
        messages,
      });

      const texto = response.choices[0].message.content || '';

      // Cálculo de custos GPT-4.6 mini
      // Pricing: $0.15 per 1M input tokens, $0.60 per 1M output tokens
      // Fórmula: (tokens / 1_000_000) * preço_por_milhao
      if (!response.usage) {
        throw new Error('GPTProvider: response.usage é undefined');
      }

      const custoInput = (response.usage.prompt_tokens / 1_000_000) * 0.15; // Input: $0.15/1M tokens
      const custoOutput = (response.usage.completion_tokens / 1_000_000) * 0.6; // Output: $0.60/1M tokens
      const custoTotal = custoInput + custoOutput;

      const tempoProcessamento = Date.now() - startTime;

      const result: LLMResult = {
        texto,
        provider: ProviderLLM.GPT4_MINI,
        modelo: 'gpt-4o-mini',
        tokens_input: response.usage.prompt_tokens,
        tokens_output: response.usage.completion_tokens,
        custo_usd: custoTotal,
        tempo_processamento_ms: tempoProcessamento,
        metadata: { finish_reason: response.choices[0].finish_reason },
      };

      this.logger.log({
        message: 'OpenAI API sucesso',
        provider: 'GPT4_MINI',
        tokens_input: result.tokens_input,
        tokens_output: result.tokens_output,
        custo_usd: result.custo_usd.toFixed(6),
        tempo_ms: tempoProcessamento,
      });

      return result;
    } catch (error) {
      this.logger.error({
        message: 'Erro ao chamar OpenAI API',
        provider: 'GPT4_MINI',
        error: error instanceof Error ? error.message : String(error),
        tempo_ms: Date.now() - startTime,
      });
      throw new Error(`GPTProvider: Falha ao gerar texto - ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Verifica se GPT está disponível (health check)
   * @returns true se disponível, false caso contrário
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      return true;
    } catch (error) {
      this.logger.warn({
        message: 'GPT health check falhou',
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}
