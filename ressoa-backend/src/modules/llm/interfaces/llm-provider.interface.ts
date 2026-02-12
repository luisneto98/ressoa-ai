import { ProviderLLM } from '@prisma/client';

/**
 * Resultado de uma chamada LLM com metadados de custo e performance
 */
export interface LLMResult {
  texto: string;
  provider: ProviderLLM;
  modelo: string;
  tokens_input: number;
  tokens_output: number;
  custo_usd: number;
  tempo_processamento_ms: number;
  metadata?: Record<string, any>;
}

/**
 * Opções para geração de texto via LLM
 */
export interface GenerateOptions {
  /** Temperatura de criatividade (0.0 = determinístico, 1.0 = criativo) */
  temperature?: number;
  /** Máximo de tokens para geração */
  maxTokens?: number;
  /** Prompt de sistema (contexto/instruções gerais) */
  systemPrompt?: string;
}

/**
 * Interface comum para providers de LLM
 * Implementada por ClaudeProvider, GPTProvider, GeminiProvider
 */
export interface LLMProvider {
  /**
   * Retorna o nome do provider
   */
  getName(): ProviderLLM;

  /**
   * Gera texto a partir de um prompt
   * @param prompt - Prompt do usuário
   * @param options - Opções de geração (temperatura, tokens, system prompt)
   * @returns Resultado da geração com metadados
   */
  generate(prompt: string, options?: GenerateOptions): Promise<LLMResult>;

  /**
   * Verifica se o provider está disponível (health check)
   * @returns true se o provider está funcionando, false caso contrário
   */
  isAvailable(): Promise<boolean>;
}
