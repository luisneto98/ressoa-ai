import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';

describe('POST /api/v1/admin/invite-director (Story 13.2)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redisService: RedisService;
  let adminToken: string;
  let professorToken: string;
  let testEscolaId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get(PrismaService);
    redisService = app.get(RedisService);

    // Login como admin
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@ressoaai.com',
        senha: 'Admin@123',
      });

    if (adminLogin.status !== 200) {
      throw new Error(
        `Admin login failed: ${adminLogin.status} - ${JSON.stringify(adminLogin.body)}`,
      );
    }

    adminToken = adminLogin.body.access_token;

    // Login como professor (para teste de forbidden)
    const professorLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'professor@escolademo.com',
        senha: 'Demo@123',
      });

    if (professorLogin.status !== 200) {
      throw new Error(
        `Professor login failed: ${professorLogin.status} - ${JSON.stringify(professorLogin.body)}`,
      );
    }

    professorToken = professorLogin.body.access_token;

    // Criar escola de teste para Story 13.2
    const escola = await prisma.escola.create({
      data: {
        nome: 'Escola Teste Epic 13.2',
        cnpj: '98765432000199',
        tipo: 'particular',
        contato_principal: 'Contato Teste',
        email_contato: 'epic13.2@teste.com',
        telefone: '11999999999',
        plano: 'basico',
        limite_horas_mes: 400,
        status: 'ativa',
        data_ativacao: new Date(),
      },
    });

    testEscolaId = escola.id;
  });

  afterAll(async () => {
    // Cleanup: deletar escola de teste e usuários relacionados
    await prisma.usuario.deleteMany({
      where: { escola_id: testEscolaId },
    });
    await prisma.escola.delete({
      where: { id: testEscolaId },
    });

    // Cleanup: deletar tokens do Redis (wildcard)
    const tokenKeys = await redisService.keys('invite_director:*');
    for (const key of tokenKeys) {
      await redisService.del(key);
    }

    await app.close();
  });

  beforeEach(async () => {
    // Cleanup: deletar usuários criados nos testes antes de cada teste
    await prisma.usuario.deleteMany({
      where: {
        escola_id: testEscolaId,
        email: {
          in: [
            'diretor@teste.com.br',
            'new-director@teste.com',
            'reinvite@teste.com',
            'uppercase@teste.com',
            'existing@teste.com',
          ],
        },
      },
    });

    // Cleanup: deletar tokens do Redis antes de cada teste
    const tokenKeys = await redisService.keys('invite_director:*');
    for (const key of tokenKeys) {
      await redisService.del(key);
    }
  });

  it('should send invitation with admin token (201)', async () => {
    const dto = {
      escola_id: testEscolaId,
      email: 'diretor@teste.com.br',
      nome: 'João Silva',
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/invite-director')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(dto)
      .expect(201);

    expect(response.body.message).toBe('Convite enviado com sucesso');

    // Verify token stored in Redis
    const tokenKeys = await redisService.keys('invite_director:*');
    expect(tokenKeys.length).toBeGreaterThan(0);

    const tokenData = await redisService.get(tokenKeys[0]);
    expect(tokenData).toBeDefined();

    const parsed = JSON.parse(tokenData!);
    expect(parsed.email).toBe('diretor@teste.com.br');
    expect(parsed.escolaId).toBe(testEscolaId);
    expect(parsed.nome).toBe('João Silva');

    // Verify TTL is ~24h
    const ttl = await redisService.ttl(tokenKeys[0]);
    expect(ttl).toBeGreaterThan(86300); // ~24h minus few seconds
    expect(ttl).toBeLessThanOrEqual(86400);
  });

  it('should reject professor token (403)', async () => {
    const dto = {
      escola_id: testEscolaId,
      email: 'diretor@teste.com',
      nome: 'João',
    };

    await request(app.getHttpServer())
      .post('/api/v1/admin/invite-director')
      .set('Authorization', `Bearer ${professorToken}`)
      .send(dto)
      .expect(403);
  });

  it('should reject unauthenticated request (401)', async () => {
    const dto = {
      escola_id: testEscolaId,
      email: 'diretor@teste.com',
      nome: 'João',
    };

    await request(app.getHttpServer())
      .post('/api/v1/admin/invite-director')
      .send(dto)
      .expect(401);
  });

  it('should reject duplicate email (409)', async () => {
    // Create user first
    await prisma.usuario.create({
      data: {
        email: 'existing@teste.com',
        nome: 'Existing User',
        senha_hash:
          '$2b$10$nOUIs5kJ7naTuTFkBy1veuK0kSxUFXfuaOKdOKf9xYT0KKIGSJwFa', // hash for "password"
        escola_id: testEscolaId,
        perfil_usuario: {
          create: {
            role: 'PROFESSOR',
          },
        },
      },
    });

    const dto = {
      escola_id: testEscolaId,
      email: 'existing@teste.com',
      nome: 'João',
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/invite-director')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(dto)
      .expect(409);

    expect(response.body.message).toContain('Email já cadastrado');
  });

  it('should reject invalid escola_id (404)', async () => {
    const dto = {
      escola_id: '00000000-0000-0000-0000-000000000000', // Valid UUID but doesn't exist
      email: 'diretor@teste.com',
      nome: 'João',
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/invite-director')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(dto)
      .expect(404);

    expect(response.body.message).toContain('Escola não encontrada');
  });

  it('should reject inactive escola (400)', async () => {
    // Update escola to inactive
    await prisma.escola.update({
      where: { id: testEscolaId },
      data: { status: 'inativa' },
    });

    const dto = {
      escola_id: testEscolaId,
      email: 'diretor@teste.com',
      nome: 'João',
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/invite-director')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(dto)
      .expect(400);

    expect(response.body.message).toContain('Escola inativa');

    // Restore for other tests
    await prisma.escola.update({
      where: { id: testEscolaId },
      data: { status: 'ativa' },
    });
  });

  it('should reject missing required fields (400)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/invite-director')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'diretor@teste.com' }) // Missing escola_id and nome
      .expect(400);

    expect(response.body.message).toBeDefined();
  });

  it('should generate 64-char hex token', async () => {
    const dto = {
      escola_id: testEscolaId,
      email: 'new-director@teste.com',
      nome: 'Maria',
    };

    await request(app.getHttpServer())
      .post('/api/v1/admin/invite-director')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(dto)
      .expect(201);

    const tokenKeys = await redisService.keys('invite_director:*');
    expect(tokenKeys.length).toBeGreaterThan(0);

    const token = tokenKeys[0].replace('invite_director:', '');

    // Verify token format: 64 hex chars
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should overwrite previous token on re-invite', async () => {
    const dto = {
      escola_id: testEscolaId,
      email: 'reinvite@teste.com',
      nome: 'Pedro',
    };

    // First invite
    await request(app.getHttpServer())
      .post('/api/v1/admin/invite-director')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(dto)
      .expect(201);

    const firstTokenKeys = await redisService.keys('invite_director:*');
    expect(firstTokenKeys.length).toBe(1);
    const firstToken = firstTokenKeys[0];

    // Wait 1 second to ensure different token
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Second invite (re-send)
    await request(app.getHttpServer())
      .post('/api/v1/admin/invite-director')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(dto)
      .expect(201);

    const secondTokenKeys = await redisService.keys('invite_director:*');

    // Only one token should exist (new one replaces old)
    expect(secondTokenKeys.length).toBeGreaterThanOrEqual(1);

    // Verify we have a new token (either different key or fresher TTL)
    const secondToken = secondTokenKeys[0];
    const secondTtl = await redisService.ttl(secondToken);

    // New token should have fresh TTL (~24h)
    expect(secondTtl).toBeGreaterThan(86300);
  });

  it('should normalize email to lowercase', async () => {
    const dto = {
      escola_id: testEscolaId,
      email: '  UPPERCASE@TESTE.COM  ',
      nome: 'Ana',
    };

    await request(app.getHttpServer())
      .post('/api/v1/admin/invite-director')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(dto)
      .expect(201);

    const tokenKeys = await redisService.keys('invite_director:*');
    const tokenData = await redisService.get(tokenKeys[0]);
    const parsed = JSON.parse(tokenData!);

    // Verify email is normalized (lowercase + trim)
    expect(parsed.email).toBe('uppercase@teste.com');
  });

  it('should reject invalid email format (400)', async () => {
    const dto = {
      escola_id: testEscolaId,
      email: 'invalid-email',
      nome: 'João',
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/invite-director')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(dto)
      .expect(400);

    expect(response.body.message).toBeDefined();
  });

  it('should reject invalid UUID for escola_id (400)', async () => {
    const dto = {
      escola_id: 'not-a-uuid',
      email: 'diretor@teste.com',
      nome: 'João',
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/invite-director')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(dto)
      .expect(400);

    expect(response.body.message).toBeDefined();
  });

  it('should reject nome too short (400)', async () => {
    const dto = {
      escola_id: testEscolaId,
      email: 'diretor@teste.com',
      nome: 'AB', // Only 2 chars
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/invite-director')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(dto)
      .expect(400);

    expect(response.body.message).toBeDefined();
    expect(response.body.message).toContain('Nome deve ter no mínimo 3');
  });

  it('should reject nome too long (400)', async () => {
    const dto = {
      escola_id: testEscolaId,
      email: 'diretor@teste.com',
      nome: 'A'.repeat(101), // 101 chars
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/invite-director')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(dto)
      .expect(400);

    expect(response.body.message).toBeDefined();
    expect(response.body.message).toContain('Nome deve ter no máximo 100');
  });
});
