import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { STTProvider } from './interfaces';
import { TranscriptionResult, TranscribeOptions } from './interfaces';

/**
 * Orchestrates STT transcription with automatic failover between providers.
 *
 * Architecture Pattern: Service Abstraction Layer
 * - Primary provider attempt (configurable, default: Whisper)
 * - Automatic failback to secondary provider on failure
 * - 5-minute timeout per provider attempt
 * - Structured logging for observability
 *
 * @see architecture.md lines 427-450 (Service Abstraction Layer Pattern)
 */
@Injectable()
export class STTService {
  private readonly logger = new Logger(STTService.name);
  private primaryProvider: STTProvider;
  private fallbackProvider: STTProvider;

  constructor(
    @Inject('WHISPER_PROVIDER') private whisperProvider: STTProvider,
    @Inject('GOOGLE_PROVIDER') private googleProvider: STTProvider,
    private configService: ConfigService,
  ) {
    // Configure providers based on environment variables
    const primary =
      this.configService.get<string>('STT_PRIMARY_PROVIDER') || 'WHISPER';
    const fallback =
      this.configService.get<string>('STT_FALLBACK_PROVIDER') || 'GOOGLE';

    this.primaryProvider =
      primary === 'WHISPER' ? this.whisperProvider : this.googleProvider;
    this.fallbackProvider =
      fallback === 'GOOGLE' ? this.googleProvider : this.whisperProvider;

    this.logger.log(
      `STT Service initialized: primary=${this.primaryProvider.getName()}, fallback=${this.fallbackProvider.getName()}`,
    );
  }

  /**
   * Transcribes audio buffer using primary provider with automatic fallback.
   *
   * Flow:
   * 1. Attempt transcription with primary provider (5min timeout)
   * 2. On failure, attempt with fallback provider (5min timeout)
   * 3. If both fail, throw error with both failure messages
   *
   * @param audioBuffer - Raw audio data
   * @param options - Optional transcription parameters
   * @returns Transcription result with provider metadata
   * @throws Error if both providers fail
   */
  async transcribe(
    audioBuffer: Buffer,
    options?: TranscribeOptions,
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();

    try {
      // Attempt primary provider
      this.logger.log(
        `Tentando transcrição com ${this.primaryProvider.getName()}`,
      );
      const result = await this.transcribeWithTimeout(
        this.primaryProvider,
        audioBuffer,
        options || {},
        300000, // 5min timeout
      );

      const duration = Date.now() - startTime;
      this.logger.log(
        `Transcrição bem-sucedida com ${this.primaryProvider.getName()} em ${duration}ms`,
      );
      return result;
    } catch (primaryError) {
      const primaryErrorMessage =
        primaryError instanceof Error
          ? primaryError.message
          : 'Unknown error';
      this.logger.warn(
        `Falha no provider primário: ${primaryErrorMessage}`,
      );

      // Attempt fallback provider
      try {
        this.logger.log(
          `Tentando fallback com ${this.fallbackProvider.getName()}`,
        );
        const result = await this.transcribeWithTimeout(
          this.fallbackProvider,
          audioBuffer,
          options || {},
          300000, // 5min timeout
        );

        const duration = Date.now() - startTime;
        this.logger.log(
          `Transcrição bem-sucedida com fallback ${this.fallbackProvider.getName()} em ${duration}ms`,
        );
        return result;
      } catch (fallbackError) {
        const fallbackErrorMessage =
          fallbackError instanceof Error
            ? fallbackError.message
            : 'Unknown error';
        this.logger.error(
          `Falha no provider fallback: ${fallbackErrorMessage}`,
        );
        throw new Error(
          `Transcrição falhou em ambos providers: ${primaryErrorMessage} | ${fallbackErrorMessage}`,
        );
      }
    }
  }

  /**
   * Transcribes with timeout protection using Promise.race.
   *
   * @param provider - STT provider to use
   * @param audioBuffer - Audio data
   * @param options - Transcription options
   * @param timeoutMs - Timeout in milliseconds
   * @returns Transcription result
   * @throws Error if provider fails or timeout is reached
   */
  private async transcribeWithTimeout(
    provider: STTProvider,
    audioBuffer: Buffer,
    options: TranscribeOptions,
    timeoutMs: number,
  ): Promise<TranscriptionResult> {
    return Promise.race([
      provider.transcribe(audioBuffer, options),
      this.timeout(timeoutMs),
    ]);
  }

  /**
   * Creates a promise that rejects after specified timeout.
   *
   * @param ms - Timeout in milliseconds
   * @returns Promise that rejects with timeout error
   */
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout após ${ms}ms`)), ms),
    );
  }
}
