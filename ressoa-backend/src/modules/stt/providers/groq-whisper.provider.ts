import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderSTT } from '@prisma/client';
import Groq from 'groq-sdk';
import * as fs from 'fs';
import * as crypto from 'crypto';
import {
  STTProvider,
  TranscriptionResult,
  TranscriptionWord,
  TranscribeOptions,
} from '../interfaces';

const MODEL_COSTS: Record<string, number> = {
  'whisper-large-v3-turbo': 0.04,
  'distil-whisper-large-v3-en': 0.02,
  'whisper-large-v3': 0.111,
};

const DEFAULT_MODEL = 'whisper-large-v3-turbo';
const MIN_BILLED_SECONDS = 10;
const TRANSCRIPTION_TIMEOUT_MS = 300_000; // 300s timeout per AC6

@Injectable()
export class GroqWhisperProvider implements STTProvider {
  private readonly logger = new Logger(GroqWhisperProvider.name);
  private readonly groq: Groq;

  constructor(private configService: ConfigService) {
    this.groq = new Groq({
      apiKey: this.configService.get<string>('GROQ_API_KEY'),
    });
  }

  getName(): ProviderSTT {
    return ProviderSTT.GROQ_WHISPER;
  }

  async transcribe(
    audioBuffer: Buffer,
    options?: TranscribeOptions,
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();
    let tempFilePath: string | null = null;

    try {
      const model =
        this.configService.get<string>('GROQ_WHISPER_MODEL') || DEFAULT_MODEL;
      const idioma = this.normalizeLanguageCode(options?.idioma || 'pt');

      this.logger.log(
        `Iniciando transcrição Groq Whisper: ${audioBuffer.length} bytes, modelo=${model}`,
      );

      // Groq API requires file stream — create temporary file
      tempFilePath = `/tmp/${crypto.randomUUID()}.mp3`;
      await fs.promises.writeFile(tempFilePath, audioBuffer);

      let timer: ReturnType<typeof setTimeout>;
      const response = await Promise.race([
        this.groq.audio.transcriptions.create({
          file: fs.createReadStream(tempFilePath),
          model,
          response_format: 'verbose_json',
          language: idioma,
          temperature: 0.0,
          ...(options?.prompt && { prompt: options.prompt }),
          timestamp_granularities: ['word', 'segment'],
        } as any),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () =>
              reject(
                new Error(
                  `Groq Whisper timeout after ${TRANSCRIPTION_TIMEOUT_MS}ms`,
                ),
              ),
            TRANSCRIPTION_TIMEOUT_MS,
          );
        }),
      ]);
      clearTimeout(timer!);

      // Calculate cost: Math.max(duration, 10s) / 3600 * costPerHour
      const duracaoSegundos = (response as any).duration || 0;
      const billedSeconds = Math.max(duracaoSegundos, MIN_BILLED_SECONDS);
      const costPerHour = MODEL_COSTS[model] || MODEL_COSTS[DEFAULT_MODEL];
      const custoUsd = (billedSeconds / 3600) * costPerHour;

      // Calculate confidence from avg_logprob in segments
      const segments = (response as any).segments || [];
      const confianca = this.calculateConfidence(segments);

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
        provider: ProviderSTT.GROQ_WHISPER,
        idioma: (response as any).language || 'pt-BR',
        duracao_segundos: duracaoSegundos,
        confianca,
        custo_usd: custoUsd,
        tempo_processamento_ms: Date.now() - startTime,
        metadata: {
          model,
          segments_count: segments.length,
          billed_seconds: billedSeconds,
          cost_per_hour: costPerHour,
          ...(options?.prompt && { stt_prompt_used: true }),
          ...(words && { word_count: words.length }),
        },
        words,
      };

      this.logger.log(
        `Transcrição Groq Whisper concluída: ${result.duracao_segundos}s, ` +
          `modelo=${model}, custo=$${result.custo_usd.toFixed(6)}, ` +
          `confiança=${((result.confianca ?? 0) * 100).toFixed(1)}%, ` +
          `tempo=${result.tempo_processamento_ms}ms` +
          (words ? `, words=${words.length}` : ''),
      );

      return result;
    } catch (error: any) {
      if (error.status === 429) {
        this.logger.warn('Groq Whisper rate limit exceeded');
        throw new Error('Groq Whisper rate limit exceeded');
      }

      if (error.status === 402 || error.error?.code === 'insufficient_quota') {
        this.logger.error('Groq Whisper quota exceeded - check billing');
        throw new Error('Groq Whisper quota exceeded');
      }

      this.logger.error(`Groq Whisper transcription failed: ${error.message}`);
      throw new Error(`Groq Whisper error: ${error.message}`);
    } finally {
      if (tempFilePath) {
        try {
          await fs.promises.unlink(tempFilePath);
        } catch (unlinkError: any) {
          this.logger.error(
            `CRITICAL: Failed to delete temp file ${tempFilePath}: ${unlinkError.message}. Check /tmp disk usage!`,
          );
        }
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Use models.retrieve for lighter health check (single model vs full list)
      const model =
        this.configService.get<string>('GROQ_WHISPER_MODEL') || DEFAULT_MODEL;
      const response = await this.groq.models.retrieve(model);
      return !!response;
    } catch (error: any) {
      this.logger.warn(`Groq Whisper health check failed: ${error.message}`);
      return false;
    }
  }

  private normalizeLanguageCode(idioma: string): string {
    const baseLang = idioma.split('-')[0].toLowerCase();
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

    this.logger.warn(
      `Language '${idioma}' not validated, using 'pt' as default`,
    );
    return 'pt';
  }

  private calculateConfidence(segments: any[]): number {
    if (!segments || segments.length === 0) return 0.9;
    const avgLogprob =
      segments.reduce(
        (sum: number, s: any) => sum + (s.avg_logprob || -0.3),
        0,
      ) / segments.length;
    return Math.max(0, Math.min(1, 1 + avgLogprob));
  }
}
