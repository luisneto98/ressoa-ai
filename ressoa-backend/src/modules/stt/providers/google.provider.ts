import { Injectable, NotImplementedException } from '@nestjs/common';
import { ProviderSTT } from '@prisma/client';
import {
  STTProvider,
  TranscriptionResult,
  TranscribeOptions,
} from '../interfaces';

/**
 * Google Speech-to-Text Provider (Stub Implementation)
 *
 * TODO: Implementar na Story 4.2
 *
 * Specs:
 * - Model: Enhanced (v1p1beta1)
 * - Cost: $0.024/minute = $1.44/hour (96% of revenue - ONLY for fallback!)
 * - Rate Limit: 2,000 RPM (no bottleneck)
 * - Max File Size: 10 MB (REST) / 1 hour duration
 * - Expected Latency: ~0.3x real-time
 *
 * Business Rule: Use ONLY as fallback when Whisper fails
 * - Primary: Whisper = 24% revenue cost ✅
 * - Fallback: Google = 96% revenue cost ❌ (emergency only)
 *
 * @see external-integrations-api-contracts-2026-02-08.md lines 41-76
 * @see architecture.md lines 127-137 (Multi-Provider Fallback Strategy)
 */
@Injectable()
export class GoogleProvider implements STTProvider {
  getName(): ProviderSTT {
    return ProviderSTT.GOOGLE;
  }

  async transcribe(
    audioBuffer: Buffer,
    options?: TranscribeOptions,
  ): Promise<TranscriptionResult> {
    // TODO: Story 4.2 - Implement actual Google Speech-to-Text API integration
    throw new NotImplementedException(
      'GoogleProvider.transcribe() will be implemented in Story 4.2',
    );
  }

  async isAvailable(): Promise<boolean> {
    // TODO: Story 4.2 - Implement health check (verify credentials, test endpoint)
    return false;
  }
}
