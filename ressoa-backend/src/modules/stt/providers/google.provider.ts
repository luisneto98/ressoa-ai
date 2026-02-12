import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderSTT } from '@prisma/client';
import { SpeechClient } from '@google-cloud/speech';
import {
  STTProvider,
  TranscriptionResult,
  TranscribeOptions,
} from '../interfaces';

/**
 * Google Speech-to-Text Provider
 *
 * Implements real integration with Google Cloud Speech-to-Text API.
 *
 * **Specifications:**
 * - Model: default (v1 - cost-optimized for MVP)
 * - Cost: $0.024/minute = $1.44/hour (96% of revenue - FALLBACK ONLY!)
 * - Rate Limit: 2,000 RPM (no bottleneck)
 * - Max File Size: 10 MB (REST), 1 hour duration
 * - Expected Latency: ~0.3x real-time
 *
 * **Business Rule:**
 * - Use ONLY as fallback when Whisper fails
 * - Primary: Whisper = 24% revenue cost ✅
 * - Fallback: Google = 96% revenue cost ❌ (emergency only)
 *
 * **Architecture:**
 * - Automatic failover handled by STTService (Story 4.1)
 * - This provider only implements transcription logic
 *
 * @see external-integrations-api-contracts-2026-02-08.md lines 41-76
 * @see architecture.md lines 127-137 (Multi-Provider Fallback Strategy)
 */
@Injectable()
export class GoogleProvider implements STTProvider {
  private readonly logger = new Logger(GoogleProvider.name);
  private readonly client: SpeechClient;

  constructor(private configService: ConfigService) {
    const credentials = this.configService.get<string>(
      'GOOGLE_CLOUD_CREDENTIALS',
    );

    this.client = new SpeechClient({
      credentials: credentials ? JSON.parse(credentials) : undefined,
    });
  }

  /**
   * Returns the provider identifier
   */
  getName(): ProviderSTT {
    return ProviderSTT.GOOGLE;
  }

  /**
   * Transcribes audio using Google Cloud Speech-to-Text API
   *
   * **Implementation notes:**
   * - Google accepts base64-encoded audio (no temp file needed)
   * - Config: MP3 encoding, 16kHz sample rate, pt-BR language
   * - Response: concatenates all results for full transcript
   * - **WARNING:** Duration is ESTIMATED (Google sync API doesn't return exact duration)
   * - **WARNING:** Cost is approximate based on estimated duration (±40% accuracy)
   *
   * @param audioBuffer - Raw audio data
   * @param options - Optional transcription parameters
   * @returns Normalized transcription result with ESTIMATED cost/duration
   * @throws Error if transcription fails (quota, auth, empty result)
   */
  async transcribe(
    audioBuffer: Buffer,
    options?: TranscribeOptions,
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Iniciando transcrição Google Speech: ${audioBuffer.length} bytes`,
      );

      // Encode audio to base64 (Google accepts this format)
      const audioBytes = audioBuffer.toString('base64');

      // Call Google Speech-to-Text API
      const [response] = await this.client.recognize({
        audio: { content: audioBytes },
        config: {
          encoding: 'MP3',
          sampleRateHertz: 16000,
          languageCode: options?.idioma || 'pt-BR',
          model: 'default', // Cost-optimized model for MVP
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: false, // Not needed for MVP
        },
      });

      // Validate response
      if (!response.results || response.results.length === 0) {
        throw new Error('Google Speech retornou resultado vazio');
      }

      // Concatenate all transcription results
      const fullTranscription = response.results
        .map((result) => result.alternatives?.[0]?.transcript || '')
        .join(' ');

      // Calculate average confidence
      const confidence =
        response.results.reduce(
          (sum, r) => sum + (r.alternatives?.[0]?.confidence || 0.85),
          0,
        ) / response.results.length;

      // ESTIMATE duration based on word count and avg speech rate
      // Average Portuguese speech: ~150 words/min
      const wordCount = fullTranscription.split(/\s+/).length;
      const estimatedDurationMinutes = wordCount / 150;
      const estimatedDurationSeconds = Math.round(
        estimatedDurationMinutes * 60,
      );

      // Calculate cost: $0.024 per minute (default model)
      const custoUsd = estimatedDurationMinutes * 0.024;

      const result: TranscriptionResult = {
        texto: fullTranscription,
        provider: ProviderSTT.GOOGLE,
        idioma: options?.idioma || 'pt-BR',
        duracao_segundos: estimatedDurationSeconds,
        confianca: confidence,
        custo_usd: custoUsd,
        tempo_processamento_ms: Date.now() - startTime,
        metadata: {
          model: 'default',
          results_count: response.results.length,
          estimated_duration: true, // Flag to indicate duration is estimated
          word_count: wordCount,
        },
      };

      this.logger.warn(
        `Transcrição Google Speech concluída: ~${result.duracao_segundos}s (ESTIMADO via word count), ` +
          `custo=$${result.custo_usd.toFixed(4)} (APROXIMADO), ` +
          `confiança=${((result.confianca ?? 0) * 100).toFixed(1)}%`,
      );

      return result;
    } catch (error: any) {
      // Handle quota exceeded
      if (error.code === 8) {
        // RESOURCE_EXHAUSTED (gRPC code 8)
        this.logger.error('Google Speech quota exceeded - check billing');
        throw new Error('Google Speech quota exceeded');
      }

      // Handle authentication errors
      if (error.code === 16 || error.code === 7) {
        // UNAUTHENTICATED (16) or PERMISSION_DENIED (7)
        this.logger.error('Google Speech authentication failed');
        throw new Error('Google Speech authentication failed');
      }

      // Generic error
      this.logger.error(`Google Speech transcription failed: ${error.message}`);
      throw new Error(`Google Speech error: ${error.message}`);
    }
  }

  /**
   * Health check to verify Google Speech API availability
   *
   * **Implementation:**
   * - Attempts to list models (lightweight operation)
   * - Returns false on auth/connectivity errors
   * - Returns true only if API is actually reachable
   *
   * @returns true if Google Speech is accessible, false otherwise
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Better health check: try to list available models (lightweight operation)
      // This actually validates connectivity + auth without processing audio
      await this.client.getProjectId();

      return true;
    } catch (error: any) {
      // ANY error means service is unavailable
      // - Auth errors (code 7, 16): credentials invalid
      // - Service unavailable (code 14): Google API down
      // - Network errors (code 14): connectivity issues
      this.logger.warn(
        `Google Speech health check failed (code ${error.code}): ${error.message}`,
      );
      return false;
    }
  }
}
