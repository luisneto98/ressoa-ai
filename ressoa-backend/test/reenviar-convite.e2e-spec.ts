import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';
import { ThrottlerStorage } from '@nestjs/throttler';
import { RoleUsuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

describe('Reenviar Convite API (E2E) - Story 13.12', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redisService: RedisService;

  // Tokens
  let adminToken: string;
  let diretorAToken: string;
  let coordenadorAToken: string;
  let professorAToken: string;

  // IDs
  let escolaAId: string;
  let escolaBId: string;
  let adminUserId: string;
  let diretorAUserId: string;

  // Convite IDs
  let conviteExpiradoAId: string;
  let conviteExpiradoAToken: string;
  let convitePendenteAId: string;
  let convitePendenteAToken: string;
  let conviteAceitoId: string;
  let conviteCanceladoAId: string;
  let conviteCanceladoAToken: string;
  let convitePendenteBId: string;
  let conviteDiretorAId: string;
  let conviteDiretorAToken: string;

  const EMAIL_PREFIX = 'story1312';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ThrottlerStorage)
      .useValue({
        increment: () =>
          Promise.resolve({
            totalHits: 1,
            timeToExpire: 60000,
            isBlocked: false,
            timeToBlockExpire: 0,
          }),
        onApplicationShutdown: () => {},
      })
      .compile();

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
    redisService = app.get(RedisService);

    const hash = await bcrypt.hash('Teste@123', 10);

    // Create 2 schools
    const escolaA = await prisma.escola.create({
      data: {
        nome: 'Escola A Story 13.12',
        cnpj: '13120000000101',
        tipo: 'particular',
        contato_principal: 'Contato A',
        email_contato: `${EMAIL_PREFIX}.escolaA@teste.com`,
        telefone: '11999991312',
        plano: 'basico',
        limite_horas_mes: 400,
        status: 'ativa',
        data_ativacao: new Date(),
      },
    });
    escolaAId = escolaA.id;

    const escolaB = await prisma.escola.create({
      data: {
        nome: 'Escola B Story 13.12',
        cnpj: '13120000000202',
        tipo: 'publica',
        contato_principal: 'Contato B',
        email_contato: `${EMAIL_PREFIX}.escolaB@teste.com`,
        telefone: '11999991313',
        plano: 'basico',
        limite_horas_mes: 400,
        status: 'ativa',
        data_ativacao: new Date(),
      },
    });
    escolaBId = escolaB.id;

    // Create users
    const admin = await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.admin@teste.com`,
        nome: 'Admin Story 1312',
        senha_hash: hash,
        perfil_usuario: { create: { role: RoleUsuario.ADMIN } },
      },
    });
    adminUserId = admin.id;

    const diretorA = await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.diretorA@teste.com`,
        nome: 'Diretor A Story 1312',
        senha_hash: hash,
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.DIRETOR } },
      },
    });
    diretorAUserId = diretorA.id;

    await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.coordenadorA@teste.com`,
        nome: 'Coordenador A Story 1312',
        senha_hash: hash,
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.COORDENADOR } },
      },
    });

    await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.profA@teste.com`,
        nome: 'Professor A Story 1312',
        senha_hash: hash,
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.PROFESSOR } },
      },
    });

    // Create convites

    // Expired invite (escola A, professor)
    conviteExpiradoAToken = crypto.randomBytes(32).toString('hex');
    const conviteExpiradoA = await prisma.conviteUsuario.create({
      data: {
        email: `${EMAIL_PREFIX}.expired@teste.com`,
        nome_completo: 'Convite Expirado A',
        tipo_usuario: 'professor',
        escola_id: escolaAId,
        criado_por: diretorAUserId,
        token: conviteExpiradoAToken,
        expira_em: new Date(Date.now() - 86400 * 1000),
        status: 'expirado',
      },
    });
    conviteExpiradoAId = conviteExpiradoA.id;

    // Pending invite (escola A, coordenador)
    convitePendenteAToken = crypto.randomBytes(32).toString('hex');
    const convitePendenteA = await prisma.conviteUsuario.create({
      data: {
        email: `${EMAIL_PREFIX}.pending@teste.com`,
        nome_completo: 'Convite Pendente A',
        tipo_usuario: 'coordenador',
        escola_id: escolaAId,
        criado_por: diretorAUserId,
        token: convitePendenteAToken,
        expira_em: new Date(Date.now() + 86400 * 1000),
        status: 'pendente',
      },
    });
    convitePendenteAId = convitePendenteA.id;
    await redisService.setex(
      `invite_coordenador:${convitePendenteAToken}`,
      86400,
      JSON.stringify({
        email: `${EMAIL_PREFIX}.pending@teste.com`,
        escolaId: escolaAId,
        nome: 'Convite Pendente A',
      }),
    );

    // Accepted invite (escola A)
    const tokenAceito = crypto.randomBytes(32).toString('hex');
    const conviteAceito = await prisma.conviteUsuario.create({
      data: {
        email: `${EMAIL_PREFIX}.accepted@teste.com`,
        nome_completo: 'Convite Aceito',
        tipo_usuario: 'professor',
        escola_id: escolaAId,
        criado_por: diretorAUserId,
        token: tokenAceito,
        expira_em: new Date(Date.now() + 86400 * 1000),
        status: 'aceito',
        aceito_em: new Date(),
      },
    });
    conviteAceitoId = conviteAceito.id;

    // Cancelled invite (escola A, diretor)
    conviteCanceladoAToken = crypto.randomBytes(32).toString('hex');
    const conviteCanceladoA = await prisma.conviteUsuario.create({
      data: {
        email: `${EMAIL_PREFIX}.cancelled@teste.com`,
        nome_completo: 'Convite Cancelado A',
        tipo_usuario: 'diretor',
        escola_id: escolaAId,
        criado_por: adminUserId,
        token: conviteCanceladoAToken,
        expira_em: new Date(Date.now() + 86400 * 1000),
        status: 'cancelado',
      },
    });
    conviteCanceladoAId = conviteCanceladoA.id;

    // Pending invite (escola B) - for cross-tenant test
    const tokenPendenteB = crypto.randomBytes(32).toString('hex');
    const convitePendenteB = await prisma.conviteUsuario.create({
      data: {
        email: `${EMAIL_PREFIX}.pendingB@teste.com`,
        nome_completo: 'Convite Pendente B',
        tipo_usuario: 'professor',
        escola_id: escolaBId,
        criado_por: adminUserId,
        token: tokenPendenteB,
        expira_em: new Date(Date.now() + 86400 * 1000),
        status: 'pendente',
      },
    });
    convitePendenteBId = convitePendenteB.id;

    // Director invite (escola A) - to test director email type
    conviteDiretorAToken = crypto.randomBytes(32).toString('hex');
    const conviteDiretorA = await prisma.conviteUsuario.create({
      data: {
        email: `${EMAIL_PREFIX}.director@teste.com`,
        nome_completo: 'Convite Diretor A',
        tipo_usuario: 'diretor',
        escola_id: escolaAId,
        criado_por: adminUserId,
        token: conviteDiretorAToken,
        expira_em: new Date(Date.now() - 86400 * 1000),
        status: 'expirado',
      },
    });
    conviteDiretorAId = conviteDiretorA.id;

    // Login all callers
    const loginUser = async (email: string) => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, senha: 'Teste@123' });
      return res.body.accessToken;
    };

    adminToken = await loginUser(`${EMAIL_PREFIX}.admin@teste.com`);
    diretorAToken = await loginUser(`${EMAIL_PREFIX}.diretorA@teste.com`);
    coordenadorAToken = await loginUser(
      `${EMAIL_PREFIX}.coordenadorA@teste.com`,
    );
    professorAToken = await loginUser(`${EMAIL_PREFIX}.profA@teste.com`);
  });

  afterAll(async () => {
    try {
      await prisma.conviteUsuario.deleteMany({
        where: { email: { startsWith: EMAIL_PREFIX } },
      });
      await prisma.perfilUsuario.deleteMany({
        where: { usuario: { email: { startsWith: EMAIL_PREFIX } } },
      });
      await prisma.usuario.deleteMany({
        where: { email: { startsWith: EMAIL_PREFIX } },
      });
      await prisma.escola.deleteMany({
        where: { cnpj: { in: ['13120000000101', '13120000000202'] } },
      });
    } finally {
      await app.close();
    }
  });

  // Test 1: Admin resends expired invite → 200
  it('should allow Admin to resend an expired invite', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/convites/${conviteExpiradoAId}/reenviar`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(201);
    expect(response.body.message).toContain('reenviado');
    expect(response.body.message).toContain(`${EMAIL_PREFIX}.expired@teste.com`);
  });

  // Test 2: Diretor resends own school invite → 201
  it('should allow Diretor to resend invite from own school', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/convites/${convitePendenteAId}/reenviar`)
      .set('Authorization', `Bearer ${diretorAToken}`);

    expect(response.status).toBe(201);
    expect(response.body.message).toContain('reenviado');
  });

  // Test 3: Diretor cross-tenant blocked → 404
  it('should return 404 when Diretor tries to resend invite from another school', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/convites/${convitePendenteBId}/reenviar`)
      .set('Authorization', `Bearer ${diretorAToken}`);

    expect(response.status).toBe(404);
  });

  // Test 4: Coordenador resends own school invite → 201
  it('should allow Coordenador to resend invite from own school', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/convites/${conviteDiretorAId}/reenviar`)
      .set('Authorization', `Bearer ${coordenadorAToken}`);

    expect(response.status).toBe(201);
    expect(response.body.message).toContain('reenviado');
  });

  // Test 5: Professor blocked → 403
  it('should return 403 when Professor tries to resend a convite', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/convites/${conviteExpiradoAId}/reenviar`)
      .set('Authorization', `Bearer ${professorAToken}`);

    expect(response.status).toBe(403);
  });

  // Test 6: Resend accepted invite → 400
  it('should return 400 when resending an accepted invite', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/convites/${conviteAceitoId}/reenviar`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Não é possível reenviar convite já aceito',
    );
  });

  // Test 7: Resend cancelled invite → 201 (allowed per AC6)
  it('should allow resending a cancelled invite', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/convites/${conviteCanceladoAId}/reenviar`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(201);
    expect(response.body.message).toContain('reenviado');
  });

  // Test 8: Resend creates new DB record + cancels old
  it('should create new invite record and cancel old one on resend', async () => {
    // Create a fresh invite to resend
    const freshToken = crypto.randomBytes(32).toString('hex');
    const freshConvite = await prisma.conviteUsuario.create({
      data: {
        email: `${EMAIL_PREFIX}.fresh@teste.com`,
        nome_completo: 'Fresh Convite',
        tipo_usuario: 'professor',
        escola_id: escolaAId,
        criado_por: diretorAUserId,
        token: freshToken,
        expira_em: new Date(Date.now() - 1000), // expired
        status: 'expirado',
      },
    });

    const response = await request(app.getHttpServer())
      .post(`/api/v1/convites/${freshConvite.id}/reenviar`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(201);

    // Verify old invite is cancelled
    const oldInvite = await prisma.conviteUsuario.findUnique({
      where: { id: freshConvite.id },
    });
    expect(oldInvite?.status).toBe('cancelado');

    // Verify new invite exists
    const newInvites = await prisma.conviteUsuario.findMany({
      where: {
        email: `${EMAIL_PREFIX}.fresh@teste.com`,
        status: 'pendente',
      },
    });
    expect(newInvites.length).toBe(1);
    expect(newInvites[0].token).not.toBe(freshToken);
    expect(new Date(newInvites[0].expira_em).getTime()).toBeGreaterThan(
      Date.now(),
    );
  });

  // Test 9: New Redis token exists, old deleted
  it('should set new Redis token and delete old one', async () => {
    // Create a fresh invite with known Redis token
    const oldToken = crypto.randomBytes(32).toString('hex');
    const freshConvite = await prisma.conviteUsuario.create({
      data: {
        email: `${EMAIL_PREFIX}.redis@teste.com`,
        nome_completo: 'Redis Test Convite',
        tipo_usuario: 'coordenador',
        escola_id: escolaAId,
        criado_por: diretorAUserId,
        token: oldToken,
        expira_em: new Date(Date.now() - 1000),
        status: 'expirado',
      },
    });

    // Set old Redis token
    await redisService.setex(
      `invite_coordenador:${oldToken}`,
      86400,
      JSON.stringify({
        email: `${EMAIL_PREFIX}.redis@teste.com`,
        escolaId: escolaAId,
        nome: 'Redis Test Convite',
      }),
    );

    const response = await request(app.getHttpServer())
      .post(`/api/v1/convites/${freshConvite.id}/reenviar`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(201);

    // Verify old Redis key deleted
    const oldRedisValue = await redisService.get(
      `invite_coordenador:${oldToken}`,
    );
    expect(oldRedisValue).toBeNull();

    // Verify new Redis key exists
    const newInvite = await prisma.conviteUsuario.findFirst({
      where: {
        email: `${EMAIL_PREFIX}.redis@teste.com`,
        status: 'pendente',
      },
    });
    const newRedisValue = await redisService.get(
      `invite_coordenador:${newInvite!.token}`,
    );
    expect(newRedisValue).not.toBeNull();
  });

  // Test 10: New invite can be accepted (full flow)
  it('should allow accepting the new resent invite', async () => {
    // Create and resend an invite
    const oldToken = crypto.randomBytes(32).toString('hex');
    const freshConvite = await prisma.conviteUsuario.create({
      data: {
        email: `${EMAIL_PREFIX}.accept@teste.com`,
        nome_completo: 'Accept Test',
        tipo_usuario: 'professor',
        escola_id: escolaAId,
        criado_por: diretorAUserId,
        token: oldToken,
        expira_em: new Date(Date.now() - 1000),
        status: 'expirado',
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/convites/${freshConvite.id}/reenviar`)
      .set('Authorization', `Bearer ${adminToken}`);

    // Get the new invite's token
    const newInvite = await prisma.conviteUsuario.findFirst({
      where: {
        email: `${EMAIL_PREFIX}.accept@teste.com`,
        status: 'pendente',
      },
    });

    // Accept the new invite
    const acceptResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/accept-invitation')
      .send({
        token: newInvite!.token,
        senha: 'Teste@123',
      });

    expect(acceptResponse.status).toBe(201);

    // Clean up created user
    await prisma.perfilUsuario.deleteMany({
      where: { usuario: { email: `${EMAIL_PREFIX}.accept@teste.com` } },
    });
    await prisma.usuario.deleteMany({
      where: { email: `${EMAIL_PREFIX}.accept@teste.com` },
    });
  });

  // Test 11: Invalid UUID → 400
  it('should return 400 for invalid UUID', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/convites/not-a-uuid/reenviar')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
  });

  // Test 12: Non-existent invite → 404
  it('should return 404 for non-existent invite UUID', async () => {
    const fakeUuid = '00000000-0000-0000-0000-000000000000';
    const response = await request(app.getHttpServer())
      .post(`/api/v1/convites/${fakeUuid}/reenviar`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Convite não encontrado');
  });
});
