import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { STTService } from './stt.service';
import { DiarizationService } from './services/diarization.service';
import type { DiarizationResult } from './interfaces/diarization.interface';
import { Transcricao } from '@prisma/client';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { STT_PROMPTS, resolveSttPromptKey } from './constants/stt-prompts';

const execFileAsync = promisify(execFile);

/**
 * Service for transcription persistence and audio processing.
 *
 * Responsibilities:
 * - Download audio files from S3/MinIO
 * - Orchestrate STT transcription via STTService
 * - Persist transcription results to database
 * - Update Aula status lifecycle
 *
 * Multi-tenancy: Transcricao inherits tenant isolation via Aula FK.
 * No direct escola_id filtering needed - validation occurs when fetching Aula.
 *
 * @see architecture.md lines 427-450 (Service Abstraction Layer)
 * @see project-context.md (Multi-tenancy via FK inheritance)
 */
@Injectable()
export class TranscricaoService {
  private readonly logger = new Logger(TranscricaoService.name);
  private readonly s3Client: S3Client;

  constructor(
    private prisma: PrismaService,
    private sttService: STTService,
    private configService: ConfigService,
    private diarizationService: DiarizationService,
  ) {
    // Initialize S3 client (compatible with MinIO)
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY');
    const secretAccessKey = this.configService.get<string>('S3_SECRET_KEY');

    this.s3Client = new S3Client({
      region: this.configService.get<string>('S3_REGION') || 'us-east-1',
      endpoint: this.configService.get<string>('S3_ENDPOINT'),
      credentials:
        accessKeyId && secretAccessKey
          ? { accessKeyId, secretAccessKey }
          : undefined,
      forcePathStyle: true, // Required for MinIO
    });
  }

  /**
   * Transcribes audio from an Aula and persists the result.
   *
   * Flow:
   * 1. Fetch Aula with escola_id validation (multi-tenancy)
   * 2. Download audio from S3
   * 3. Transcribe using STTService (with failover)
   * 4. Save Transcricao to database
   * 5. Update Aula status to TRANSCRITA
   * 6. Log cost for tracking
   *
   * @param aulaId - UUID of the Aula to transcribe
   * @returns Created Transcricao entity
   * @throws NotFoundException if Aula not found or has no audio file
   * @throws Error if transcription or S3 download fails
   */
  async transcribeAula(aulaId: string, escolaIdOverride?: string): Promise<Transcricao> {
    // Fetch aula with multi-tenancy validation
    // escolaIdOverride: used by Bull workers that run outside HTTP context
    const escolaId = escolaIdOverride || this.prisma.getEscolaIdOrThrow();
    const aula = await this.prisma.aula.findUnique({
      where: {
        id: aulaId,
        escola_id: escolaId, // ✅ Multi-tenancy enforcement
        deleted_at: null, // ✅ Soft delete pattern
      },
      include: {
        planejamento: {
          include: { disciplina: true },
        },
      },
    });

    if (!aula || !aula.arquivo_url) {
      throw new NotFoundException(
        'Aula não encontrada ou sem arquivo de áudio',
      );
    }

    this.logger.log(`Iniciando transcrição para aulaId=${aulaId}`);

    // Download audio from S3
    let audioBuffer = await this.downloadFromS3(aula.arquivo_url);

    this.logger.log(
      `Áudio baixado: ${audioBuffer.length} bytes`,
    );

    // Compress if over Whisper 25MB limit
    const WHISPER_LIMIT = 25 * 1024 * 1024;
    if (audioBuffer.length > WHISPER_LIMIT) {
      this.logger.log(`Áudio excede 25MB (${(audioBuffer.length / 1024 / 1024).toFixed(1)}MB). Comprimindo...`);
      audioBuffer = await this.compressAudio(audioBuffer);
      this.logger.log(`Áudio comprimido: ${(audioBuffer.length / 1024 / 1024).toFixed(1)}MB`);
    }

    // Resolve discipline-specific STT prompt for vocabulary context
    const disciplinaNome = aula.planejamento?.disciplina?.nome || '';
    const promptKey = resolveSttPromptKey(disciplinaNome);
    const sttPrompt = STT_PROMPTS[promptKey] || STT_PROMPTS.default;

    this.logger.log(
      `Prompt STT resolvido: disciplina="${disciplinaNome}", chave="${promptKey}"`,
    );

    // Transcribe using STTService (handles failover automatically)
    const sttStartTime = Date.now();
    const result = await this.sttService.transcribe(audioBuffer, {
      idioma: 'pt-BR',
      prompt: sttPrompt,
    });
    const sttDurationMs = Date.now() - sttStartTime;

    this.logger.log({
      msg: 'STT transcription completed',
      provider: result.provider,
      texto_length: result.texto.length,
      words_count: result.words?.length ?? 0,
      stt_duration_ms: sttDurationMs,
      custo_usd: result.custo_usd,
    });

    // Diarization: enrich transcription with speaker labels (Story 15.5)
    // DiarizationService.diarize() handles: feature flag, empty words, LLM errors
    let diarizationResult: DiarizationResult | null = null;
    const diarizationStartTime = Date.now();
    try {
      diarizationResult = await this.diarizationService.diarize(result.words);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn({
        msg: 'Diarization unexpected error — using original texto as fallback',
        error: errorMsg,
        aulaId,
      });
    }
    const diarizationDurationMs = Date.now() - diarizationStartTime;

    // Determine final texto: prefer diarization SRT, fallback to original
    let finalTexto = result.texto;
    if (diarizationResult && diarizationResult.srt.length > 0) {
      finalTexto = diarizationResult.srt;
    }

    // Accumulate costs: STT + diarization
    const totalCusto = result.custo_usd + (diarizationResult?.custo_usd ?? 0);
    const totalProcessingMs = sttDurationMs + diarizationDurationMs;

    // Determine has_diarization: true only when real diarization occurred (not FALLBACK)
    const hasDiarization = !!diarizationResult && diarizationResult.provider !== 'FALLBACK';

    // Save transcription to database
    const transcricao = await this.prisma.transcricao.create({
      data: {
        aula_id: aulaId,
        texto: finalTexto,
        provider: result.provider,
        idioma: result.idioma,
        duracao_segundos: result.duracao_segundos,
        confianca: result.confianca,
        custo_usd: totalCusto,
        tempo_processamento_ms: totalProcessingMs,
        metadata_json: {
          ...result.metadata,
          stt_prompt_key: promptKey,
          ...(result.words && { words: result.words, word_count: result.words.length }),
          has_diarization: hasDiarization,
          ...(diarizationResult && {
            diarization_provider: diarizationResult.provider,
            diarization_cost_usd: diarizationResult.custo_usd,
            diarization_processing_ms: diarizationDurationMs,
            speaker_stats: diarizationResult.speaker_stats,
          }),
        },
      },
    });

    // Update Aula status to TRANSCRITA
    await this.prisma.aula.update({
      where: { id: aulaId },
      data: {
        status_processamento: 'TRANSCRITA',
      },
    });

    // Structured logging: timing and cost breakdown (AC #6, #7)
    this.logger.log({
      msg: 'Transcription pipeline complete',
      aulaId,
      provider: transcricao.provider,
      stt_cost_usd: result.custo_usd,
      diarization_cost_usd: diarizationResult?.custo_usd ?? 0,
      total_cost_usd: totalCusto,
      stt_duration_ms: sttDurationMs,
      diarization_duration_ms: diarizationDurationMs,
      total_duration_ms: totalProcessingMs,
      has_diarization: hasDiarization,
    });

    return transcricao;
  }

  /**
   * Compress audio to mp3 64kbps mono using ffmpeg-static.
   * Reduces file size to fit within Whisper's 25MB limit.
   */
  private async compressAudio(audioBuffer: Buffer): Promise<Buffer> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ffmpegPath = require('ffmpeg-static') as string;
    const id = randomUUID();
    const inputPath = join(tmpdir(), `${id}-input`);
    const outputPath = join(tmpdir(), `${id}-output.mp3`);

    try {
      await writeFile(inputPath, audioBuffer);

      await execFileAsync(ffmpegPath, [
        '-i', inputPath,
        '-ac', '1',           // mono
        '-ar', '16000',       // 16kHz (optimal for speech)
        '-b:a', '64k',        // 64kbps bitrate
        '-y',                 // overwrite
        outputPath,
      ], { timeout: 120000 }); // 2 min timeout

      return await readFile(outputPath);
    } finally {
      // Cleanup temp files
      await unlink(inputPath).catch(() => {});
      await unlink(outputPath).catch(() => {});
    }
  }

  /**
   * Downloads audio file from S3/MinIO.
   *
   * Supports S3 URL format: s3://bucket-name/path/to/file.mp3
   *
   * @param s3Url - S3 URL of the audio file
   * @returns Audio data as Buffer
   * @throws Error if URL format is invalid or download fails
   */
  private async downloadFromS3(s3Url: string): Promise<Buffer> {
    // Parse S3 URL: s3://bucket-name/path/to/file.mp3
    const match = s3Url.match(/s3:\/\/([^/]+)\/(.*)/);
    if (!match) {
      throw new Error(`Invalid S3 URL format: ${s3Url}`);
    }

    const [, bucket, key] = match;

    this.logger.log(`Downloading from S3: bucket=${bucket}, key=${key}`);

    try {
      // Download file using AWS SDK v3
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of response.Body as Readable) {
        chunks.push(Buffer.from(chunk));
      }

      const audioBuffer = Buffer.concat(chunks);
      this.logger.log(`Download completo: ${audioBuffer.length} bytes`);

      return audioBuffer;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Erro ao baixar arquivo do S3: ${errorMessage}`);
      throw new Error(`Falha ao baixar arquivo do S3: ${errorMessage}`);
    }
  }
}
