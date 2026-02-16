import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { ProviderLLM } from '@prisma/client';
import {
  LLMProvider,
  LLMResult,
  GenerateOptions,
} from '../interfaces/llm-provider.interface';

/**
 * Provider para Google Gemini 2.0 Flash - LLM para análise pedagógica
 * Modelo padrão: gemini-2.0-flash (configurável via GEMINI_MODEL)
 * Custo: $0.10/1M input tokens, $0.40/1M output tokens
 */
@Injectable()
export class GeminiProvider implements LLMProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private ai: GoogleGenAI;
  private readonly model: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY não configurada - GeminiProvider não funcionará',
      );
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
    this.model =
      this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.0-flash';
  }

  getName(): ProviderLLM {
    return ProviderLLM.GEMINI_FLASH;
  }

  /**
   * Gera texto usando Google Gemini Flash
   * @param prompt - Prompt do usuário
   * @param options - Opções de geração
   * @returns Resultado com texto gerado e metadados
   */
  async generate(
    prompt: string,
    options?: GenerateOptions,
  ): Promise<LLMResult> {
    const startTime = Date.now();
    const temperature = options?.temperature ?? 0.7;
    const maxOutputTokens = options?.maxTokens ?? 4000;

    let timer: ReturnType<typeof setTimeout>;

    try {
      this.logger.log({
        message: 'Iniciando chamada Gemini API',
        provider: 'GEMINI_FLASH',
        model: this.model,
        temperature,
        maxOutputTokens,
      });

      const apiCall = this.ai.models.generateContent({
        model: this.model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: options?.systemPrompt,
          temperature,
          maxOutputTokens,
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
          ],
        },
      });

      const response = await Promise.race([
        apiCall,
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('GeminiProvider: Timeout após 120s')),
            120000,
          );
        }),
      ]);

      // Check safety filter block
      const finishReason =
        response.candidates?.[0]?.finishReason ?? 'UNKNOWN';
      if (finishReason === 'SAFETY') {
        throw new Error(
          'GeminiProvider: Output bloqueado por safety filters - ' +
            'conteúdo pode ter sido classificado incorretamente. ' +
            'Safety ratings: ' +
            JSON.stringify(response.candidates?.[0]?.safetyRatings),
        );
      }

      const texto = response.text ?? '';

      // Token usage
      const tokensInput = response.usageMetadata?.promptTokenCount ?? 0;
      const tokensOutput =
        response.usageMetadata?.candidatesTokenCount ?? 0;

      // Cost calculation: $0.10/1M input, $0.40/1M output
      const custoInput = (tokensInput / 1_000_000) * 0.1;
      const custoOutput = (tokensOutput / 1_000_000) * 0.4;
      const custoTotal = custoInput + custoOutput;

      const tempoProcessamento = Date.now() - startTime;

      const result: LLMResult = {
        texto,
        provider: ProviderLLM.GEMINI_FLASH,
        modelo: this.model,
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
        custo_usd: custoTotal,
        tempo_processamento_ms: tempoProcessamento,
        metadata: { finish_reason: finishReason },
      };

      this.logger.log({
        message: 'Gemini API sucesso',
        provider: 'GEMINI_FLASH',
        model: this.model,
        tokens_input: result.tokens_input,
        tokens_output: result.tokens_output,
        custo_usd: result.custo_usd.toFixed(6),
        tempo_ms: tempoProcessamento,
        finish_reason: finishReason,
      });

      return result;
    } catch (error) {
      const tempoMs = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Detect rate limit (429)
      if (
        error instanceof Error &&
        ('status' in error || 'code' in error)
      ) {
        const statusCode =
          (error as any).status ?? (error as any).code;
        if (statusCode === 429) {
          this.logger.error({
            message: 'Gemini API rate limit (429)',
            provider: 'GEMINI_FLASH',
            error: errorMessage,
            tempo_ms: tempoMs,
          });
          throw new Error(
            `GeminiProvider: Rate limit excedido (429) - ${errorMessage}`,
          );
        }
      }

      // Detect quota exceeded
      if (errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        this.logger.error({
          message: 'Gemini API quota exceeded',
          provider: 'GEMINI_FLASH',
          error: errorMessage,
          tempo_ms: tempoMs,
        });
        throw new Error(
          `GeminiProvider: Quota excedida - ${errorMessage}`,
        );
      }

      this.logger.error({
        message: 'Erro ao chamar Gemini API',
        provider: 'GEMINI_FLASH',
        error: errorMessage,
        tempo_ms: tempoMs,
      });
      throw new Error(
        `GeminiProvider: Falha ao gerar texto - ${errorMessage}`,
      );
    } finally {
      clearTimeout(timer!);
    }
  }

  /**
   * Verifica se Gemini está disponível (health check lightweight)
   * @returns true se disponível, false caso contrário
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.ai.models.get({ model: this.model });
      return true;
    } catch (error) {
      this.logger.warn({
        message: 'Gemini health check falhou',
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}
