import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderSTT } from '@prisma/client';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as crypto from 'crypto';
import {
  STTProvider,
  TranscriptionResult,
  TranscriptionWord,
  TranscribeOptions,
} from '../interfaces';

/**
 * OpenAI Whisper STT Provider
 *
 * Implements real integration with OpenAI Whisper API for audio transcription.
 *
 * **Specifications:**
 * - Model: whisper-1 (large-v3 under the hood)
 * - Cost: $0.006/minute = $0.36/hour (24% of revenue)
 * - Rate Limit: 50 RPM (CRITICAL BOTTLENECK - handled by Bull queue in Story 4.3)
 * - Max File Size: 25 MB
 * - Supported Formats: mp3, mp4, mpeg, mpga, m4a, wav, webm
 * - Expected Latency: ~0.5x real-time (1h audio = 30min processing)
 *
 * **Business Context:**
 * - PRIMARY provider (lowest cost, high quality)
 * - Fallback to Google only on failure (automatic via STTService)
 *
 * @see external-integrations-api-contracts-2026-02-08.md lines 41-76
 * @see architecture.md lines 127-137, 566-603 (Rate Limiting Context)
 */
@Injectable()
export class WhisperProvider implements STTProvider {
  private readonly logger = new Logger(WhisperProvider.name);
  private readonly openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  /**
   * Returns the provider identifier
   */
  getName(): ProviderSTT {
    return ProviderSTT.WHISPER;
  }

  /**
   * Transcribes audio using OpenAI Whisper API
   *
   * **Implementation notes:**
   * - Whisper API requires file stream (not Buffer directly) → creates temp file
   * - Response format: verbose_json (includes segments, duration, confidence)
   * - Cost calculation: $0.006 per minute (charged per second)
   * - Cleanup: temp file deleted in finally block to prevent disk bloat
   *
   * @param audioBuffer - Raw audio data
   * @param options - Optional transcription parameters
   * @returns Normalized transcription result with cost tracking
   * @throws Error if transcription fails (rate limit, quota, API error)
   */
  async transcribe(
    audioBuffer: Buffer,
    options?: TranscribeOptions,
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();
    let tempFilePath: string | null = null;

    try {
      this.logger.log(
        `Iniciando transcrição Whisper: ${audioBuffer.length} bytes`,
      );

      // Validate language code (Whisper supports ISO 639-1 codes)
      const idioma = this.normalizeLanguageCode(options?.idioma || 'pt');

      // Whisper requires file stream - create temporary file
      tempFilePath = `/tmp/${crypto.randomUUID()}.mp3`;
      await fs.promises.writeFile(tempFilePath, audioBuffer);

      // Call OpenAI Whisper API
      const response = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1', // Abstraction for whisper-large-v3
        language: idioma, // ISO 639-1 format (pt, not pt-BR)
        response_format: 'verbose_json', // Includes segments, duration, confidence
        ...(options?.prompt && { prompt: options.prompt }),
        timestamp_granularities: ['word', 'segment'],
      });

      // Calculate cost: $0.006 per minute
      const duracaoMinutos = (response.duration || 0) / 60;
      const custoUsd = duracaoMinutos * 0.006;

      // Calculate average confidence from segments
      const confianca = this.calculateConfidence(response.segments || []);

      // Extract word-level timestamps (top-level when timestamp_granularities active)
      const rawWords = (response as any).words;
      const words: TranscriptionWord[] | undefined =
        rawWords?.length > 0
          ? rawWords.map((w: any) => ({
              word: w.word,
              start: w.start,
              end: w.end,
            }))
          : undefined;

      const result: TranscriptionResult = {
        texto: response.text,
        provider: ProviderSTT.WHISPER,
        idioma: response.language || 'pt-BR',
        duracao_segundos: response.duration,
        confianca,
        custo_usd: custoUsd,
        tempo_processamento_ms: Date.now() - startTime,
        metadata: {
          model: 'whisper-1',
          segments_count: response.segments?.length || 0,
          ...(options?.prompt && { stt_prompt_used: true }),
          ...(words && { word_count: words.length }),
        },
        words,
      };

      this.logger.log(
        `Transcrição Whisper concluída: ${result.duracao_segundos}s, ` +
          `custo=$${result.custo_usd.toFixed(4)}, ` +
          `confiança=${((result.confianca ?? 0) * 100).toFixed(1)}%` +
          (words ? `, words=${words.length}` : ''),
      );

      return result;
    } catch (error: any) {
      // Handle rate limiting and quota errors
      if (error.code === 'rate_limit_exceeded' || error.status === 429) {
        this.logger.warn('Whisper rate limit exceeded (50 RPM)');
        throw new Error('Whisper rate limit exceeded');
      }

      if (error.status === 402 || error.code === 'insufficient_quota') {
        this.logger.error('Whisper quota exceeded - check billing');
        throw new Error('Whisper quota exceeded');
      }

      // Generic error
      this.logger.error(`Whisper transcription failed: ${error.message}`);
      throw new Error(`Whisper error: ${error.message}`);
    } finally {
      // Cleanup temp file (critical to prevent disk bloat)
      if (tempFilePath) {
        try {
          await fs.promises.unlink(tempFilePath);
        } catch (unlinkError: any) {
          this.logger.error(
            `CRITICAL: Failed to delete temp file ${tempFilePath}: ${unlinkError.message}. Check /tmp disk usage!`,
          );
          // TODO Story 4.3: Add /tmp cleanup monitoring metric
        }
      }
    }
  }

  /**
   * Normalizes language codes to Whisper-compatible ISO 639-1 format
   *
   * @param idioma - Language code (supports pt-BR, pt, en-US, etc.)
   * @returns Normalized ISO 639-1 code (pt, en, es, etc.)
   */
  private normalizeLanguageCode(idioma: string): string {
    // Extract base language from locale (pt-BR → pt)
    const baseLang = idioma.split('-')[0].toLowerCase();

    // Whisper supports 97 languages - validate common ones
    const supportedLanguages = [
      'pt',
      'en',
      'es',
      'fr',
      'de',
      'it',
      'ja',
      'ko',
      'zh',
      'ru',
      'ar',
      'hi',
    ];

    if (supportedLanguages.includes(baseLang)) {
      return baseLang;
    }

    // Default to Portuguese for unsupported languages (MVP context)
    this.logger.warn(
      `Language '${idioma}' not validated, using 'pt' as default`,
    );
    return 'pt';
  }

  /**
   * Health check to verify Whisper API availability
   *
   * **Implementation:**
   * - Tests if API key is valid by retrieving whisper-1 model info
   * - Returns false on failure (never throws - required for monitoring)
   *
   * @returns true if Whisper is accessible, false otherwise
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.openai.models.retrieve('whisper-1');
      return !!response;
    } catch (error: any) {
      this.logger.warn(`Whisper health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Calculates average confidence from Whisper segments
   *
   * **Logic:**
   * - Whisper returns confidence per segment (0.0 to 1.0)
   * - Average confidence across all segments
   * - Default to 0.9 if no segments (Whisper typically has high quality)
   *
   * @param segments - Array of transcription segments from Whisper response
   * @returns Average confidence score (0.0 to 1.0)
   */
  private calculateConfidence(segments: any[]): number {
    if (!segments || segments.length === 0) {
      return 0.9; // Default high confidence for Whisper
    }

    const totalConfidence = segments.reduce(
      (sum, seg) => sum + (seg.confidence || 0.9),
      0,
    );

    return totalConfidence / segments.length;
  }
}
