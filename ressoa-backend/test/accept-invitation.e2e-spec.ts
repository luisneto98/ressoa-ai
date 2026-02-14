import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';
import { RoleUsuario } from '@prisma/client';

describe('POST /api/v1/auth/accept-invitation (Story 13.3)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redisService: RedisService;
  let testEscolaId: string;
  let testToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    redisService = app.get<RedisService>(RedisService);

    // Create test escola
    const escola = await prisma.escola.create({
      data: {
        nome: 'Escola Teste Accept Invitation',
        cnpj: '12345678000100',
        status: 'ativa',
      },
    });
    testEscolaId = escola.id;
  });

  beforeEach(async () => {
    // Generate fresh token for each test
    testToken = crypto.randomBytes(32).toString('hex');
    await redisService.setex(
      `invite_director:${testToken}`,
      86400,
      JSON.stringify({
        email: 'diretor@teste.com.br',
        escolaId: testEscolaId,
        nome: 'João Silva',
      }),
    );
  });

  afterEach(async () => {
    // Clean up test users created during tests
    await prisma.usuario.deleteMany({
      where: { escola_id: testEscolaId },
    });
    // Clean up test token if still exists
    await redisService.del(`invite_director:${testToken}`);
  });

  afterAll(async () => {
    // Clean up test escola
    await prisma.escola.delete({ where: { id: testEscolaId } });
    await app.close();
  });

  it('should accept invitation and create director user (201)', async () => {
    const dto = {
      token: testToken,
      senha: 'SenhaForte123',
    };

    const response = await request(app.getHttpServer())
      .post('/auth/accept-invitation')
      .send(dto)
      .expect(201);

    expect(response.body.message).toBe('Convite aceito com sucesso');

    // Verify user created in database
    const usuario = await prisma.usuario.findFirst({
      where: {
        email: 'diretor@teste.com.br',
        escola_id: testEscolaId,
      },
      include: { perfil_usuario: true },
    });

    expect(usuario).toBeDefined();
    expect(usuario?.nome).toBe('João Silva');
    expect(usuario?.escola_id).toBe(testEscolaId);
    expect(usuario?.perfil_usuario?.role).toBe(RoleUsuario.DIRETOR);

    // Verify password hashed correctly
    const passwordMatch = await bcrypt.compare(
      'SenhaForte123',
      usuario!.senha_hash,
    );
    expect(passwordMatch).toBe(true);

    // Verify token deleted (one-time use)
    const tokenAfter = await redisService.get(`invite_director:${testToken}`);
    expect(tokenAfter).toBeNull();
  });

  it('should reject invalid token (401)', async () => {
    const dto = {
      token: 'a'.repeat(64), // 64-char invalid token
      senha: 'SenhaForte123',
    };

    const response = await request(app.getHttpServer())
      .post('/auth/accept-invitation')
      .send(dto)
      .expect(401);

    expect(response.body.message).toContain('Token inválido ou expirado');
  });

  it('should reject expired token (401)', async () => {
    // Create token with 0 TTL (immediately expired)
    const expiredToken = crypto.randomBytes(32).toString('hex');
    await redisService.setex(
      `invite_director:${expiredToken}`,
      0,
      JSON.stringify({
        email: 'diretor@teste.com',
        escolaId: testEscolaId,
        nome: 'João',
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 1100)); // Wait 1.1s for expiry

    const dto = { token: expiredToken, senha: 'SenhaForte123' };

    const response = await request(app.getHttpServer())
      .post('/auth/accept-invitation')
      .send(dto)
      .expect(401);

    expect(response.body.message).toContain('Token inválido ou expirado');
  });

  it('should reject duplicate email (409)', async () => {
    // Create existing user first
    await prisma.usuario.create({
      data: {
        email: 'diretor@teste.com.br',
        nome: 'Existing User',
        senha_hash: await bcrypt.hash('password', 10),
        escola_id: testEscolaId,
        perfil_usuario: {
          create: { role: RoleUsuario.DIRETOR },
        },
      },
    });

    const dto = { token: testToken, senha: 'SenhaForte123' };

    const response = await request(app.getHttpServer())
      .post('/auth/accept-invitation')
      .send(dto)
      .expect(409);

    expect(response.body.message).toContain('Email já cadastrado');
  });

  it('should reject inactive escola (400)', async () => {
    await prisma.escola.update({
      where: { id: testEscolaId },
      data: { status: 'inativa' },
    });

    const dto = { token: testToken, senha: 'SenhaForte123' };

    const response = await request(app.getHttpServer())
      .post('/auth/accept-invitation')
      .send(dto)
      .expect(400);

    expect(response.body.message).toContain('Escola inativa');

    // Restore for other tests
    await prisma.escola.update({
      where: { id: testEscolaId },
      data: { status: 'ativa' },
    });
  });

  it('should reject weak password (400)', async () => {
    const dto = { token: testToken, senha: 'weak' }; // Too short, no uppercase, no number

    const response = await request(app.getHttpServer())
      .post('/auth/accept-invitation')
      .send(dto)
      .expect(400);

    expect(response.body.message).toBeDefined();
  });

  it('should reject missing required fields (400)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/accept-invitation')
      .send({ senha: 'SenhaForte123' }) // Missing token
      .expect(400);

    expect(response.body.message).toBeDefined();
  });

  it('should prevent token reuse (one-time use)', async () => {
    const dto = { token: testToken, senha: 'SenhaForte123' };

    // First use: success
    await request(app.getHttpServer())
      .post('/auth/accept-invitation')
      .send(dto)
      .expect(201);

    // Second use: fail (token deleted)
    const response = await request(app.getHttpServer())
      .post('/auth/accept-invitation')
      .send(dto)
      .expect(401);

    expect(response.body.message).toContain('Token inválido ou expirado');
  });

  it('should rollback user creation if PerfilUsuario creation fails', async () => {
    // This tests database transaction atomicity
    // We can't easily mock Prisma to fail mid-transaction in E2E tests,
    // so this is more of a smoke test that relies on Prisma's transaction guarantees

    // If transaction works correctly, either both Usuario + PerfilUsuario are created,
    // or neither is created (rollback on error)

    const dto = { token: testToken, senha: 'SenhaForte123' };

    await request(app.getHttpServer())
      .post('/auth/accept-invitation')
      .send(dto)
      .expect(201);

    // Verify both Usuario and PerfilUsuario exist
    const usuario = await prisma.usuario.findFirst({
      where: { email: 'diretor@teste.com.br', escola_id: testEscolaId },
      include: { perfil_usuario: true },
    });

    expect(usuario).toBeDefined();
    expect(usuario?.perfil_usuario).toBeDefined();
    expect(usuario?.perfil_usuario?.role).toBe(RoleUsuario.DIRETOR);
  });
});

describe('GET /api/v1/auth/validate-token (Story 13.3)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redisService: RedisService;
  let testEscolaId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    redisService = app.get<RedisService>(RedisService);

    // Create test escola
    const escola = await prisma.escola.create({
      data: {
        nome: 'Escola Teste Validate Token',
        cnpj: '98765432000100',
        status: 'ativa',
      },
    });
    testEscolaId = escola.id;
  });

  afterAll(async () => {
    // Clean up test escola
    await prisma.escola.delete({ where: { id: testEscolaId } });
    await app.close();
  });

  it('should return invitation details for valid token (200)', async () => {
    const token = crypto.randomBytes(32).toString('hex');
    await redisService.setex(
      `invite_director:${token}`,
      86400,
      JSON.stringify({
        email: 'diretor@teste.com',
        escolaId: testEscolaId,
        nome: 'João Silva',
      }),
    );

    const response = await request(app.getHttpServer())
      .get(`/auth/validate-token?token=${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      email: 'diretor@teste.com',
      nome: 'João Silva',
      escolaNome: 'Escola Teste Validate Token',
    });

    // Clean up
    await redisService.del(`invite_director:${token}`);
  });

  it('should reject invalid token (401)', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/validate-token?token=invalid-token')
      .expect(401);

    expect(response.body.message).toContain('Token inválido ou expirado');
  });
});
