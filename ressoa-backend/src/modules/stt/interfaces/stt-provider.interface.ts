import { ProviderSTT } from '@prisma/client';

/**
 * Normalized transcription result returned by all STT providers.
 * Ensures consistent data structure regardless of underlying provider.
 */
export interface TranscriptionResult {
  /** Full transcription text */
  texto: string;

  /** Provider that performed the transcription */
  provider: ProviderSTT;

  /** Detected or specified language code (e.g., 'pt-BR') */
  idioma: string;

  /** Audio duration in seconds (if available) */
  duracao_segundos?: number;

  /** Confidence score between 0.0 and 1.0 (if available) */
  confianca?: number;

  /** Cost of transcription in USD (required for cost tracking) */
  custo_usd: number;

  /** Processing time in milliseconds */
  tempo_processamento_ms: number;

  /** Provider-specific metadata */
  metadata?: Record<string, any>;
}

/**
 * Common interface that all STT providers must implement.
 * Enables provider-agnostic code and easy switching between providers.
 */
export interface STTProvider {
  /**
   * Returns the provider identifier (WHISPER, GOOGLE, AZURE, etc.)
   */
  getName(): ProviderSTT;

  /**
   * Transcribes audio buffer to text using the provider's API.
   * @param audioBuffer - Raw audio data as Buffer
   * @param options - Optional transcription parameters
   * @returns Normalized transcription result
   * @throws Error if transcription fails
   */
  transcribe(
    audioBuffer: Buffer,
    options?: TranscribeOptions,
  ): Promise<TranscriptionResult>;

  /**
   * Health check to verify provider availability and credentials.
   * @returns true if provider is accessible and configured correctly
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Optional parameters for transcription requests.
 */
export interface TranscribeOptions {
  /** Language code (default: pt-BR) */
  idioma?: string;

  /** Provider-specific model identifier (e.g., 'whisper-1', 'enhanced') */
  model?: string;

  /** Vocabulary/context prompt to improve transcription accuracy (max ~224 tokens / ~800 chars) */
  prompt?: string;
}
