import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { STTService } from './stt.service';
import { Transcricao } from '@prisma/client';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

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
  ) {
    // Initialize AWS S3 client
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION') || 'us-east-1',
      credentials:
        accessKeyId && secretAccessKey
          ? {
              accessKeyId,
              secretAccessKey,
            }
          : undefined,
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
  async transcribeAula(aulaId: string): Promise<Transcricao> {
    // Fetch aula with multi-tenancy validation
    // Note: escola_id filtering is enforced at Aula level, Transcricao inherits via FK
    const escolaId = this.prisma.getEscolaIdOrThrow();
    const aula = await this.prisma.aula.findUnique({
      where: {
        id: aulaId,
        escola_id: escolaId, // ✅ Multi-tenancy enforcement
        deleted_at: null, // ✅ Soft delete pattern
      },
    });

    if (!aula || !aula.arquivo_url) {
      throw new NotFoundException(
        'Aula não encontrada ou sem arquivo de áudio',
      );
    }

    this.logger.log(`Iniciando transcrição para aulaId=${aulaId}`);

    // Download audio from S3
    const audioBuffer = await this.downloadFromS3(aula.arquivo_url);

    this.logger.log(
      `Áudio baixado: ${audioBuffer.length} bytes, iniciando transcrição...`,
    );

    // Transcribe using STTService (handles failover automatically)
    const result = await this.sttService.transcribe(audioBuffer, {
      idioma: 'pt-BR',
    });

    this.logger.log(
      `Transcrição concluída: provider=${result.provider}, texto_length=${result.texto.length}`,
    );

    // Save transcription to database
    const transcricao = await this.prisma.transcricao.create({
      data: {
        aula_id: aulaId,
        texto: result.texto,
        provider: result.provider, // Provider from metadata
        idioma: result.idioma,
        duracao_segundos: result.duracao_segundos,
        confianca: result.confianca,
        custo_usd: result.custo_usd,
        tempo_processamento_ms: result.tempo_processamento_ms,
        metadata_json: result.metadata,
      },
    });

    // Update Aula status to TRANSCRITA
    await this.prisma.aula.update({
      where: { id: aulaId },
      data: {
        status_processamento: 'TRANSCRITA',
      },
    });

    // Log cost for tracking (Epic 8 dashboard)
    this.logger.log(
      `Transcrição completa: aulaId=${aulaId}, provider=${transcricao.provider}, custo=$${transcricao.custo_usd?.toFixed(4) || '0.0000'}`,
    );

    return transcricao;
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
