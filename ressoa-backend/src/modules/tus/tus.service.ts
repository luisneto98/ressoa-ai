import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server, Upload } from '@tus/server';
import { S3Store } from '@tus/s3-store';
import { S3Client } from '@aws-sdk/client-s3';
import { PrismaService } from '../../prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class TusService {
  private server: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const s3AccessKey = this.configService.get<string>('S3_ACCESS_KEY');
    const s3SecretKey = this.configService.get<string>('S3_SECRET_KEY');

    if (!s3AccessKey || !s3SecretKey) {
      throw new Error('S3_ACCESS_KEY and S3_SECRET_KEY must be defined');
    }

    const s3Client = new S3Client({
      region: this.configService.get('S3_REGION') || 'us-east-1',
      endpoint: this.configService.get('S3_ENDPOINT'),
      credentials: {
        accessKeyId: s3AccessKey,
        secretAccessKey: s3SecretKey,
      },
      forcePathStyle: true, // Required for MinIO
    });

    const store = new S3Store({
      s3ClientConfig: {
        bucket: this.configService.get('S3_BUCKET') || 'ressoa-uploads',
        region: this.configService.get('S3_REGION') || 'us-east-1',
        endpoint: this.configService.get('S3_ENDPOINT'),
        credentials: {
          accessKeyId: s3AccessKey,
          secretAccessKey: s3SecretKey,
        },
        forcePathStyle: true, // Required for MinIO
      },
      partSize: 8 * 1024 * 1024, // 8MB chunks (optimal for S3 multipart)
    });

    this.server = new Server({
      path: '/api/v1/uploads',
      datastore: store,
      maxSize: 2 * 1024 * 1024 * 1024, // 2GB max
      namingFunction: (req: any) => {
        // Gerar nome único: {escola_id}/{professor_id}/{uuid}.{ext}
        const metadata = req.upload?.metadata || {};
        const escolaId = metadata.escola_id || 'unknown';
        const professorId = metadata.professor_id || 'unknown';
        const uuid = randomUUID();
        const ext = metadata.filetype?.split('/')[1] || 'bin';
        return `${escolaId}/${professorId}/${uuid}.${ext}`;
      },
      onIncomingRequest: async (req: any, res: any) => {
        // JWT já validado por JwtAuthGuard do NestJS
        // Validar que req.user existe
        if (!req.user) {
          throw new UnauthorizedException('JWT inválido ou ausente');
        }

        // Validar ownership: professor_id e escola_id da metadata devem corresponder ao JWT
        const metadata = req.upload?.metadata || {};
        const { professor_id, escola_id } = metadata;

        // Se ainda não tem metadata (request OPTIONS/HEAD inicial), permitir
        if (!professor_id || !escola_id) {
          return;
        }

        if (professor_id !== req.user.userId) {
          throw new ForbiddenException(
            'Upload só permitido para aulas próprias',
          );
        }

        if (escola_id !== req.user.escolaId) {
          throw new ForbiddenException('Escola não corresponde ao usuário');
        }
      },
      onUploadCreate: async (req: any, upload: Upload) => {
        // Validar metadata obrigatória
        const { escola_id, professor_id, turma_id, data, aula_id } =
          upload.metadata || {};

        if (!escola_id || !professor_id || !turma_id || !data || !aula_id) {
          throw new BadRequestException(
            'Metadata obrigatória faltando: escola_id, professor_id, turma_id, data, aula_id',
          );
        }

        // Validar formato de áudio
        const { filetype } = upload.metadata || {};
        const allowedTypes = [
          'audio/mpeg',
          'audio/wav',
          'audio/x-m4a',
          'audio/webm',
        ];

        if (!filetype || !allowedTypes.includes(filetype)) {
          throw new BadRequestException(
            `Formato não suportado. Use: mp3, wav, m4a, webm`,
          );
        }

        // Validação: arquivo não vazio
        if (!upload.size || upload.size === 0) {
          throw new BadRequestException('Arquivo vazio');
        }

        // Validação: tamanho máximo 2GB
        if (upload.size > 2 * 1024 * 1024 * 1024) {
          throw new BadRequestException('Arquivo maior que 2GB');
        }

        // ✅ CRITICAL FIX: Validar que aula pertence ao professor E escola (ownership validation)
        const aulaId = aula_id;
        const escolaId = escola_id;
        const professorId = professor_id;

        const aula = await this.prisma.aula.findUnique({
          where: {
            id: aulaId,
            escola_id: escolaId, // ✅ Multi-tenancy
            professor_id: professorId, // ✅ Ownership validation
          },
        });

        if (!aula) {
          throw new ForbiddenException('Aula não encontrada ou sem permissão');
        }

        // Atualizar status da aula: CRIADA → UPLOAD_PROGRESSO
        await this.prisma.aula.update({
          where: {
            id: aulaId,
            escola_id: escolaId, // ✅ Multi-tenancy
          },
          data: { status_processamento: 'UPLOAD_PROGRESSO' },
        });

        return { metadata: upload.metadata };
      },
      onUploadFinish: async (req: any, upload: Upload) => {
        // Upload completo - atualizar aula
        const { aula_id, escola_id } = upload.metadata || {};
        const bucket = this.configService.get('S3_BUCKET') || 'ressoa-uploads';
        const fileUrl = `s3://${bucket}/${upload.id}`;

        await this.prisma.aula.update({
          where: {
            id: aula_id as string,
            escola_id: escola_id as string, // ✅ Multi-tenancy
          },
          data: {
            status_processamento: 'AGUARDANDO_TRANSCRICAO',
            arquivo_url: fileUrl,
            arquivo_tamanho: Number(upload.size),
          },
        });

        // TODO (Epic 4): Enfileirar job de transcrição
        // await this.bullQueue.add('transcribe-aula', { aulaId: aula_id });
        // NOTE: Bull queue será implementado em Epic 4, comentar por enquanto

        return {};
      },
    });
  }

  getServer(): Server {
    return this.server;
  }
}
