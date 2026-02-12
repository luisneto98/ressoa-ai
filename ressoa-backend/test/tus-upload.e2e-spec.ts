import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { StatusProcessamento } from '@prisma/client';

describe('TUS Upload Server (E2E) - Story 3.2', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Tokens & IDs
  let escola1Id: string;
  let escola2Id: string;
  let professor1Token: string;
  let professor2Token: string;
  let professor1Id: string;
  let professor2Id: string;
  let turma1Id: string;
  let turma2Id: string;

  // Helper to encode TUS metadata (base64)
  function encodeMetadata(metadata: Record<string, string>): string {
    return Object.entries(metadata)
      .map(([key, value]) => `${key} ${Buffer.from(value).toString('base64')}`)
      .join(',');
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    // Wait for services to initialize
    await new Promise((resolve) => setTimeout(resolve, 100));

    // === SETUP TEST DATA ===

    // 1️⃣ Use Demo School + create additional school for cross-tenant tests
    const escolaDemo = await prisma.escola.findUnique({
      where: { cnpj: '12.345.678/0001-90' },
    });

    if (!escolaDemo) {
      throw new Error('Demo school not found. Run: npx prisma db seed');
    }
    escola1Id = escolaDemo.id;

    const escola2 = await prisma.escola.upsert({
      where: { cnpj: '44.444.444/0001-44' },
      update: {},
      create: {
        nome: 'Escola Teste TUS B',
        cnpj: '44.444.444/0001-44',
        email_contato: 'tus@escolab.com',
      },
    });
    escola2Id = escola2.id;

    // 2️⃣ Create professors
    const professor1 = await prisma.usuario.findFirst({
      where: {
        email: 'professor@escolademo.com',
        escola_id: escola1Id,
      },
    });

    if (!professor1) {
      throw new Error('Demo professor not found. Run: npx prisma db seed');
    }
    professor1Id = professor1.id;

    const senhaHash = await bcrypt.hash('Test@123', 10);

    const professor2 = await prisma.usuario.upsert({
      where: {
        email_escola_id: {
          email: 'prof2@tus.com',
          escola_id: escola2Id,
        },
      },
      update: {},
      create: {
        nome: 'Professor TUS 2',
        email: 'prof2@tus.com',
        senha_hash: senhaHash,
        escola_id: escola2Id,
        perfil_usuario: {
          create: {
            role: 'PROFESSOR',
          },
        },
      },
    });
    professor2Id = professor2.id;

    // 3️⃣ Login professors
    const loginProf1 = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'professor@escolademo.com', senha: 'Test@123' });
    professor1Token = loginProf1.body.access_token;

    const loginProf2 = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'prof2@tus.com', senha: 'Test@123' });
    professor2Token = loginProf2.body.access_token;

    // 4️⃣ Create Turmas
    const turma1 = await prisma.turma.findFirst({
      where: { escola_id: escola1Id },
    });
    if (!turma1) {
      throw new Error('Demo turma not found. Run: npx prisma db seed');
    }
    turma1Id = turma1.id;

    const turma2 = await prisma.turma.create({
      data: {
        nome: '6º Ano TUS',
        ano_escolar: '6',
        escola_id: escola2Id,
      },
    });
    turma2Id = turma2.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.aula.deleteMany({
      where: {
        OR: [{ escola_id: escola1Id }, { escola_id: escola2Id }],
      },
    });

    await prisma.turma.deleteMany({
      where: { id: turma2Id },
    });

    await prisma.usuario.deleteMany({
      where: { email: 'prof2@tus.com' },
    });

    await prisma.escola.deleteMany({
      where: { cnpj: '44.444.444/0001-44' },
    });

    await app.close();
  });

  describe('POST /api/v1/uploads (Initiate Upload)', () => {
    it('should reject upload without JWT token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/uploads')
        .set('Upload-Length', '1000000')
        .set('Tus-Resumable', '1.0.0');

      expect(response.status).toBe(401);
    });

    it('should initiate upload with valid metadata', async () => {
      // 1. Create aula first
      const aulaResponse = await request(app.getHttpServer())
        .post('/api/v1/aulas')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({
          turma_id: turma1Id,
          data: '2026-02-11',
          tipo_entrada: 'AUDIO',
        });

      expect(aulaResponse.status).toBe(201);
      const aulaId = aulaResponse.body.id;

      // 2. Initiate TUS upload
      const metadata = encodeMetadata({
        filename: 'test.mp3',
        filetype: 'audio/mpeg',
        aula_id: aulaId,
        escola_id: escola1Id,
        professor_id: professor1Id,
        turma_id: turma1Id,
        data: '2026-02-11',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${professor1Token}`)
        .set('Upload-Length', '26214400') // 25MB
        .set('Upload-Metadata', metadata)
        .set('Tus-Resumable', '1.0.0');

      expect(response.status).toBe(201);
      expect(response.headers.location).toBeDefined();
      expect(response.headers.location).toContain('/api/v1/uploads/');

      // 3. Verify aula status updated to UPLOAD_PROGRESSO
      const aulaUpdated = await prisma.aula.findUnique({
        where: { id: aulaId },
      });
      expect(aulaUpdated?.status_processamento).toBe('UPLOAD_PROGRESSO');
    });

    it('should reject upload with missing required metadata', async () => {
      const aulaResponse = await request(app.getHttpServer())
        .post('/api/v1/aulas')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({
          turma_id: turma1Id,
          data: '2026-02-11',
          tipo_entrada: 'AUDIO',
        });

      const aulaId = aulaResponse.body.id;

      // Missing turma_id in metadata
      const metadata = encodeMetadata({
        filename: 'test.mp3',
        filetype: 'audio/mpeg',
        aula_id: aulaId,
        escola_id: escola1Id,
        professor_id: professor1Id,
        // turma_id: MISSING!
        data: '2026-02-11',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${professor1Token}`)
        .set('Upload-Length', '1000000')
        .set('Upload-Metadata', metadata)
        .set('Tus-Resumable', '1.0.0');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Metadata obrigatória faltando');
    });

    it('should reject upload with invalid audio format', async () => {
      const aulaResponse = await request(app.getHttpServer())
        .post('/api/v1/aulas')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({
          turma_id: turma1Id,
          data: '2026-02-11',
          tipo_entrada: 'AUDIO',
        });

      const aulaId = aulaResponse.body.id;

      // Invalid filetype: video/mp4
      const metadata = encodeMetadata({
        filename: 'video.mp4',
        filetype: 'video/mp4', // ❌ Not allowed
        aula_id: aulaId,
        escola_id: escola1Id,
        professor_id: professor1Id,
        turma_id: turma1Id,
        data: '2026-02-11',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${professor1Token}`)
        .set('Upload-Length', '1000000')
        .set('Upload-Metadata', metadata)
        .set('Tus-Resumable', '1.0.0');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Formato não suportado');
    });
  });

  describe('PATCH /api/v1/uploads/:id (Upload Chunks)', () => {
    it('should upload file with resumption (happy path)', async () => {
      // 1. Create aula
      const aulaResponse = await request(app.getHttpServer())
        .post('/api/v1/aulas')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({
          turma_id: turma1Id,
          data: '2026-02-11',
          tipo_entrada: 'AUDIO',
        });

      expect(aulaResponse.status).toBe(201);
      const aulaId = aulaResponse.body.id;
      expect(aulaResponse.body.status_processamento).toBe('CRIADA');

      // 2. Initiate upload
      const fileSize = 25 * 1024 * 1024; // 25MB
      const chunkSize = 8 * 1024 * 1024; // 8MB

      const metadata = encodeMetadata({
        filename: 'test-resumable.mp3',
        filetype: 'audio/mpeg',
        aula_id: aulaId,
        escola_id: escola1Id,
        professor_id: professor1Id,
        turma_id: turma1Id,
        data: '2026-02-11',
      });

      const initResponse = await request(app.getHttpServer())
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${professor1Token}`)
        .set('Upload-Length', fileSize.toString())
        .set('Upload-Metadata', metadata)
        .set('Tus-Resumable', '1.0.0');

      expect(initResponse.status).toBe(201);
      const uploadUrl = initResponse.headers.location;
      expect(uploadUrl).toBeDefined();

      // 3. Verify status updated to UPLOAD_PROGRESSO
      const aulaAfterInit = await prisma.aula.findUnique({
        where: { id: aulaId },
      });
      expect(aulaAfterInit?.status_processamento).toBe('UPLOAD_PROGRESSO');

      // 4. Upload first chunk (0-8MB)
      const chunk1Response = await request(app.getHttpServer())
        .patch(uploadUrl)
        .set('Authorization', `Bearer ${professor1Token}`)
        .set('Upload-Offset', '0')
        .set('Content-Type', 'application/offset+octet-stream')
        .set('Tus-Resumable', '1.0.0')
        .send(Buffer.alloc(chunkSize));

      expect(chunk1Response.status).toBe(204);
      expect(chunk1Response.headers['upload-offset']).toBe(
        chunkSize.toString(),
      );

      // 5. Check progress with HEAD request
      const headResponse = await request(app.getHttpServer())
        .head(uploadUrl)
        .set('Authorization', `Bearer ${professor1Token}`)
        .set('Tus-Resumable', '1.0.0');

      expect(headResponse.status).toBe(200);
      expect(headResponse.headers['upload-offset']).toBe(chunkSize.toString());

      // 6. Resume upload (second chunk: 8MB-16MB)
      const chunk2Response = await request(app.getHttpServer())
        .patch(uploadUrl)
        .set('Authorization', `Bearer ${professor1Token}`)
        .set('Upload-Offset', chunkSize.toString())
        .set('Content-Type', 'application/offset+octet-stream')
        .set('Tus-Resumable', '1.0.0')
        .send(Buffer.alloc(chunkSize));

      expect(chunk2Response.status).toBe(204);
      expect(chunk2Response.headers['upload-offset']).toBe(
        (chunkSize * 2).toString(),
      );

      // 7. Final chunk (16MB-25MB)
      const remainingSize = fileSize - chunkSize * 2;
      const chunk3Response = await request(app.getHttpServer())
        .patch(uploadUrl)
        .set('Authorization', `Bearer ${professor1Token}`)
        .set('Upload-Offset', (chunkSize * 2).toString())
        .set('Content-Type', 'application/offset+octet-stream')
        .set('Tus-Resumable', '1.0.0')
        .send(Buffer.alloc(remainingSize));

      expect(chunk3Response.status).toBe(204);

      // 8. Verify aula updated after completion
      const aulaFinal = await prisma.aula.findUnique({
        where: { id: aulaId },
      });
      expect(aulaFinal?.status_processamento).toBe('AGUARDANDO_TRANSCRICAO');
      expect(aulaFinal?.arquivo_url).toContain('s3://');
      expect(aulaFinal?.arquivo_url).toContain('ressoa-uploads');
      expect(aulaFinal?.arquivo_tamanho).toBe(fileSize);
    });
  });

  describe('Multi-Tenancy Security', () => {
    it('should enforce tenant isolation (cross-school upload blocked)', async () => {
      // Professor 1 (Escola A) creates aula
      const aulaResponse = await request(app.getHttpServer())
        .post('/api/v1/aulas')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({
          turma_id: turma1Id,
          data: '2026-02-11',
          tipo_entrada: 'AUDIO',
        });

      expect(aulaResponse.status).toBe(201);
      const aulaId = aulaResponse.body.id;

      // Professor 2 (Escola B) tries to upload to Professor 1's aula
      const metadata = encodeMetadata({
        filename: 'hack.mp3',
        filetype: 'audio/mpeg',
        aula_id: aulaId,
        escola_id: escola2Id, // ❌ Different school!
        professor_id: professor2Id,
        turma_id: turma2Id,
        data: '2026-02-11',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${professor2Token}`)
        .set('Upload-Length', '1000000')
        .set('Upload-Metadata', metadata)
        .set('Tus-Resumable', '1.0.0');

      // Should fail because aula belongs to Escola A but metadata says Escola B
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should block upload when professor_id in metadata does not match JWT', async () => {
      const aulaResponse = await request(app.getHttpServer())
        .post('/api/v1/aulas')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({
          turma_id: turma1Id,
          data: '2026-02-11',
          tipo_entrada: 'AUDIO',
        });

      const aulaId = aulaResponse.body.id;

      // Professor 1 tries to upload but claims to be Professor 2 in metadata
      const metadata = encodeMetadata({
        filename: 'fake.mp3',
        filetype: 'audio/mpeg',
        aula_id: aulaId,
        escola_id: escola1Id,
        professor_id: professor2Id, // ❌ Wrong professor!
        turma_id: turma1Id,
        data: '2026-02-11',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${professor1Token}`)
        .set('Upload-Length', '1000000')
        .set('Upload-Metadata', metadata)
        .set('Tus-Resumable', '1.0.0');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Edge Cases', () => {
    it('should reject empty file (size = 0)', async () => {
      const aulaResponse = await request(app.getHttpServer())
        .post('/api/v1/aulas')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({
          turma_id: turma1Id,
          data: '2026-02-11',
          tipo_entrada: 'AUDIO',
        });

      const aulaId = aulaResponse.body.id;

      const metadata = encodeMetadata({
        filename: 'empty.mp3',
        filetype: 'audio/mpeg',
        aula_id: aulaId,
        escola_id: escola1Id,
        professor_id: professor1Id,
        turma_id: turma1Id,
        data: '2026-02-11',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${professor1Token}`)
        .set('Upload-Length', '0') // ❌ Empty file
        .set('Upload-Metadata', metadata)
        .set('Tus-Resumable', '1.0.0');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Arquivo vazio');
    });

    it('should reject file larger than 2GB', async () => {
      const aulaResponse = await request(app.getHttpServer())
        .post('/api/v1/aulas')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({
          turma_id: turma1Id,
          data: '2026-02-11',
          tipo_entrada: 'AUDIO',
        });

      const aulaId = aulaResponse.body.id;

      const metadata = encodeMetadata({
        filename: 'huge.mp3',
        filetype: 'audio/mpeg',
        aula_id: aulaId,
        escola_id: escola1Id,
        professor_id: professor1Id,
        turma_id: turma1Id,
        data: '2026-02-11',
      });

      const tooLarge = (2 * 1024 * 1024 * 1024 + 1).toString(); // 2GB + 1 byte

      const response = await request(app.getHttpServer())
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${professor1Token}`)
        .set('Upload-Length', tooLarge)
        .set('Upload-Metadata', metadata)
        .set('Tus-Resumable', '1.0.0');

      expect(response.status).toBe(413); // Payload Too Large
    });
  });
});
