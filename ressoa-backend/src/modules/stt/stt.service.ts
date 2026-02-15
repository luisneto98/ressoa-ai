import { Injectable, Logger } from '@nestjs/common';
import { TranscriptionResult, TranscribeOptions } from './interfaces';
import { STTRouterService } from './services/stt-router.service';

/**
 * Orchestrates STT transcription by delegating to STTRouterService.
 *
 * Architecture Pattern: Thin Delegation Layer
 * - Delegates provider selection and failover to STTRouterService (Story 14.1)
 * - Config-driven routing via providers.config.json
 * - Public interface unchanged for backward compatibility
 *
 * @see architecture.md lines 427-450 (Service Abstraction Layer Pattern)
 */
@Injectable()
export class STTService {
  private readonly logger = new Logger(STTService.name);

  constructor(private readonly sttRouterService: STTRouterService) {
    this.logger.log('STT Service initialized: delegating to STTRouterService');
  }

  /**
   * Transcribes audio buffer using config-driven provider with automatic fallback.
   *
   * Delegates entirely to STTRouterService which handles:
   * - Primary/fallback provider selection via providers.config.json
   * - 5-minute timeout per provider attempt
   * - Automatic failover on provider failure
   * - Structured logging for observability
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
    return this.sttRouterService.transcribeWithFallback(audioBuffer, options);
  }
}
