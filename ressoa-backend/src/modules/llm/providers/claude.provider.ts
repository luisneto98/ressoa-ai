import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { ProviderLLM } from '@prisma/client';
import {
  LLMProvider,
  LLMResult,
  GenerateOptions,
} from '../interfaces/llm-provider.interface';

/**
 * Provider para Claude (Anthropic) - LLM para análise pedagógica
 * Modelo: Claude 4.6 Sonnet
 * Custo: $3/1M input tokens, $15/1M output tokens
 */
@Injectable()
export class ClaudeProvider implements LLMProvider {
  private readonly logger = new Logger(ClaudeProvider.name);
  private anthropic: Anthropic;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'ANTHROPIC_API_KEY não configurada - ClaudeProvider não funcionará',
      );
    }
    this.anthropic = new Anthropic({
      apiKey: apiKey || '',
    });
  }

  getName(): ProviderLLM {
    return ProviderLLM.CLAUDE_SONNET;
  }

  /**
   * Gera texto usando Claude 4.6 Sonnet
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
        message: 'Iniciando chamada Claude API',
        provider: 'CLAUDE_SONNET',
        temperature: options?.temperature || 0.7,
        maxTokens: options?.maxTokens || 4000,
      });

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514', // Claude 4.6 Sonnet
        max_tokens: options?.maxTokens || 4000,
        temperature: options?.temperature || 0.7,
        system: options?.systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      });

      const texto =
        response.content[0].type === 'text' ? response.content[0].text : '';

      // Cálculo de custos Claude 4.6 Sonnet
      // Pricing: $3.00 per 1M input tokens, $15.00 per 1M output tokens
      // Fórmula: (tokens / 1_000_000) * preço_por_milhao
      const custoInput = (response.usage.input_tokens / 1_000_000) * 3; // Input: $3/1M tokens
      const custoOutput = (response.usage.output_tokens / 1_000_000) * 15; // Output: $15/1M tokens
      const custoTotal = custoInput + custoOutput;

      const tempoProcessamento = Date.now() - startTime;

      const result: LLMResult = {
        texto,
        provider: ProviderLLM.CLAUDE_SONNET,
        modelo: 'claude-sonnet-4',
        tokens_input: response.usage.input_tokens,
        tokens_output: response.usage.output_tokens,
        custo_usd: custoTotal,
        tempo_processamento_ms: tempoProcessamento,
        metadata: { stop_reason: response.stop_reason },
      };

      this.logger.log({
        message: 'Claude API sucesso',
        provider: 'CLAUDE_SONNET',
        tokens_input: result.tokens_input,
        tokens_output: result.tokens_output,
        custo_usd: result.custo_usd.toFixed(6),
        tempo_ms: tempoProcessamento,
      });

      return result;
    } catch (error) {
      this.logger.error({
        message: 'Erro ao chamar Claude API',
        provider: 'CLAUDE_SONNET',
        error: error.message,
        tempo_ms: Date.now() - startTime,
      });
      throw new Error(
        `ClaudeProvider: Falha ao gerar texto - ${error.message}`,
      );
    }
  }

  /**
   * Verifica se Claude está disponível (health check)
   * @returns true se disponível, false caso contrário
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      return true;
    } catch (error) {
      this.logger.warn({
        message: 'Claude health check falhou',
        error: error.message,
      });
      return false;
    }
  }
}
