import { Injectable, NotImplementedException } from '@nestjs/common';
import { ProviderSTT } from '@prisma/client';
import {
  STTProvider,
  TranscriptionResult,
  TranscribeOptions,
} from '../interfaces';

/**
 * OpenAI Whisper STT Provider (Stub Implementation)
 *
 * TODO: Implementar na Story 4.2
 *
 * Specs:
 * - Model: whisper-1 (large-v3)
 * - Cost: $0.006/minute = $0.36/hour (24% of revenue)
 * - Rate Limit: 50 RPM (CRITICAL BOTTLENECK)
 * - Max File Size: 25 MB
 * - Supported Formats: mp3, mp4, mpeg, mpga, m4a, wav, webm
 * - Expected Latency: ~0.5x real-time (1h audio = 30min processing)
 *
 * @see external-integrations-api-contracts-2026-02-08.md lines 41-76
 * @see architecture.md lines 127-137, 566-603 (Rate Limiting Context)
 */
@Injectable()
export class WhisperProvider implements STTProvider {
  getName(): ProviderSTT {
    return ProviderSTT.WHISPER;
  }

  async transcribe(
    audioBuffer: Buffer,
    options?: TranscribeOptions,
  ): Promise<TranscriptionResult> {
    // TODO: Story 4.2 - Implement actual Whisper API integration
    throw new NotImplementedException(
      'WhisperProvider.transcribe() will be implemented in Story 4.2',
    );
  }

  async isAvailable(): Promise<boolean> {
    // TODO: Story 4.2 - Implement health check (verify API key, test endpoint)
    return false;
  }
}
