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

describe('Convites API (E2E) - Story 13.11', () => {
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
  let convitePendenteAId: string;
  let convitePendenteBId: string;
  let conviteAceitoId: string;
  let conviteCanceladoId: string;
  let conviteExpiradoId: string;
  let convitePaginacao1Id: string;

  const EMAIL_PREFIX = 'story1311';

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
        nome: 'Escola A Story 13.11',
        cnpj: '13110000000101',
        tipo: 'particular',
        contato_principal: 'Contato A',
        email_contato: `${EMAIL_PREFIX}.escolaA@teste.com`,
        telefone: '11999991311',
        plano: 'basico',
        limite_horas_mes: 400,
        status: 'ativa',
        data_ativacao: new Date(),
      },
    });
    escolaAId = escolaA.id;

    const escolaB = await prisma.escola.create({
      data: {
        nome: 'Escola B Story 13.11',
        cnpj: '13110000000202',
        tipo: 'publica',
        contato_principal: 'Contato B',
        email_contato: `${EMAIL_PREFIX}.escolaB@teste.com`,
        telefone: '11999991312',
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
        nome: 'Admin Story 1311',
        senha_hash: hash,
        perfil_usuario: { create: { role: RoleUsuario.ADMIN } },
      },
    });
    adminUserId = admin.id;

    const diretorA = await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.diretorA@teste.com`,
        nome: 'Diretor A Story 1311',
        senha_hash: hash,
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.DIRETOR } },
      },
    });
    diretorAUserId = diretorA.id;

    await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.coordenadorA@teste.com`,
        nome: 'Coordenador A Story 1311',
        senha_hash: hash,
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.COORDENADOR } },
      },
    });

    await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.profA@teste.com`,
        nome: 'Professor A Story 1311',
        senha_hash: hash,
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.PROFESSOR } },
      },
    });

    // Create convites via DB (+ Redis for pending)
    const token1 = crypto.randomBytes(32).toString('hex');
    const convitePendenteA = await prisma.conviteUsuario.create({
      data: {
        email: `${EMAIL_PREFIX}.convite1@teste.com`,
        nome_completo: 'Convite Pendente A',
        tipo_usuario: 'professor',
        escola_id: escolaAId,
        criado_por: diretorAUserId,
        token: token1,
        expira_em: new Date(Date.now() + 86400 * 1000),
        status: 'pendente',
      },
    });
    convitePendenteAId = convitePendenteA.id;
    await redisService.setex(
      `invite_professor:${token1}`,
      86400,
      JSON.stringify({
        email: `${EMAIL_PREFIX}.convite1@teste.com`,
        escolaId: escolaAId,
        nome: 'Convite Pendente A',
      }),
    );

    const token2 = crypto.randomBytes(32).toString('hex');
    const convitePendenteB = await prisma.conviteUsuario.create({
      data: {
        email: `${EMAIL_PREFIX}.convite2@teste.com`,
        nome_completo: 'Convite Pendente B',
        tipo_usuario: 'coordenador',
        escola_id: escolaBId,
        criado_por: adminUserId,
        token: token2,
        expira_em: new Date(Date.now() + 86400 * 1000),
        status: 'pendente',
      },
    });
    convitePendenteBId = convitePendenteB.id;
    await redisService.setex(
      `invite_coordenador:${token2}`,
      86400,
      JSON.stringify({
        email: `${EMAIL_PREFIX}.convite2@teste.com`,
        escolaId: escolaBId,
        nome: 'Convite Pendente B',
      }),
    );

    const token3 = crypto.randomBytes(32).toString('hex');
    const conviteAceito = await prisma.conviteUsuario.create({
      data: {
        email: `${EMAIL_PREFIX}.convite3@teste.com`,
        nome_completo: 'Convite Aceito',
        tipo_usuario: 'professor',
        escola_id: escolaAId,
        criado_por: diretorAUserId,
        token: token3,
        expira_em: new Date(Date.now() + 86400 * 1000),
        status: 'aceito',
        aceito_em: new Date(),
      },
    });
    conviteAceitoId = conviteAceito.id;

    const token4 = crypto.randomBytes(32).toString('hex');
    const conviteCancelado = await prisma.conviteUsuario.create({
      data: {
        email: `${EMAIL_PREFIX}.convite4@teste.com`,
        nome_completo: 'Convite Cancelado',
        tipo_usuario: 'diretor',
        escola_id: escolaAId,
        criado_por: adminUserId,
        token: token4,
        expira_em: new Date(Date.now() + 86400 * 1000),
        status: 'cancelado',
      },
    });
    conviteCanceladoId = conviteCancelado.id;

    const token5 = crypto.randomBytes(32).toString('hex');
    const conviteExpirado = await prisma.conviteUsuario.create({
      data: {
        email: `${EMAIL_PREFIX}.convite5@teste.com`,
        nome_completo: 'Convite Expirado',
        tipo_usuario: 'professor',
        escola_id: escolaAId,
        criado_por: diretorAUserId,
        token: token5,
        expira_em: new Date(Date.now() - 86400 * 1000), // Past expiration
        status: 'expirado',
      },
    });
    conviteExpiradoId = conviteExpirado.id;
    await redisService.setex(
      `invite_professor:${token5}`,
      10, // Short TTL since it's "expired"
      JSON.stringify({
        email: `${EMAIL_PREFIX}.convite5@teste.com`,
        escolaId: escolaAId,
        nome: 'Convite Expirado',
      }),
    );

    // Extra convite for pagination
    const token6 = crypto.randomBytes(32).toString('hex');
    const convitePag = await prisma.conviteUsuario.create({
      data: {
        email: `${EMAIL_PREFIX}.convite6@teste.com`,
        nome_completo: 'Convite Paginacao',
        tipo_usuario: 'professor',
        escola_id: escolaAId,
        criado_por: diretorAUserId,
        token: token6,
        expira_em: new Date(Date.now() + 86400 * 1000),
        status: 'pendente',
      },
    });
    convitePaginacao1Id = convitePag.id;

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
        where: { cnpj: { in: ['13110000000101', '13110000000202'] } },
      });
    } finally {
      await app.close();
    }
  });

  // Test 1: Admin lista convites de todas escolas → 200
  it('should allow Admin to list convites from all schools', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/convites')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toBeDefined();
    expect(response.body.pagination).toBeDefined();
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
  });

  // Test 2: Diretor lista apenas convites da sua escola → 200
  it('should only show convites from own school for Diretor', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/convites')
      .set('Authorization', `Bearer ${diretorAToken}`);

    expect(response.status).toBe(200);
    // All returned convites should be from escola A
    for (const convite of response.body.data) {
      expect(convite.escola_id).toBe(escolaAId);
    }
  });

  // Test 3: Coordenador lista apenas convites da sua escola → 200
  it('should only show convites from own school for Coordenador', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/convites')
      .set('Authorization', `Bearer ${coordenadorAToken}`);

    expect(response.status).toBe(200);
    for (const convite of response.body.data) {
      expect(convite.escola_id).toBe(escolaAId);
    }
  });

  // Test 4: Professor tenta listar → 403
  it('should return 403 when Professor tries to list convites', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/convites')
      .set('Authorization', `Bearer ${professorAToken}`);

    expect(response.status).toBe(403);
  });

  // Test 5: Admin cancela convite pendente → 200
  it('should allow Admin to cancel a pending convite', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/convites/${convitePendenteAId}/cancelar`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('cancelado');

    // Verify DB state
    const convite = await prisma.conviteUsuario.findUnique({
      where: { id: convitePendenteAId },
    });
    expect(convite?.status).toBe('cancelado');
  });

  // Test 6: Diretor cancela convite da sua escola → 200
  it('should allow Diretor to cancel convite from own school', async () => {
    // Use the pagination convite (still pending, escola A)
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/convites/${convitePaginacao1Id}/cancelar`)
      .set('Authorization', `Bearer ${diretorAToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('cancelado');
  });

  // Test 7: Diretor tenta cancelar convite de outra escola → 404
  it('should return 404 when Diretor tries to cancel convite from another school', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/convites/${convitePendenteBId}/cancelar`)
      .set('Authorization', `Bearer ${diretorAToken}`);

    expect(response.status).toBe(404);
  });

  // Test 8: Coordenador cancela convite da sua escola → 200
  it('should allow Coordenador to cancel convite from own school', async () => {
    // Use the expired convite (escola A, status expirado → still cancellable)
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/convites/${conviteExpiradoId}/cancelar`)
      .set('Authorization', `Bearer ${coordenadorAToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('cancelado');
  });

  // Test 9: Professor tenta cancelar → 403
  it('should return 403 when Professor tries to cancel a convite', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/convites/${convitePendenteBId}/cancelar`)
      .set('Authorization', `Bearer ${professorAToken}`);

    expect(response.status).toBe(403);
  });

  // Test 10: Cancelar convite já aceito → 400
  it('should return 400 when cancelling an already accepted convite', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/convites/${conviteAceitoId}/cancelar`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Não é possível cancelar convite já aceito',
    );
  });

  // Test 11: Cancelar convite já cancelado → 409
  it('should return 409 when cancelling an already cancelled convite', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/convites/${conviteCanceladoId}/cancelar`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Convite já foi cancelado');
  });

  // Test 12: Cancelar convite com UUID inválido → 400
  it('should return 400 for invalid UUID', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/v1/convites/not-a-uuid/cancelar')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
  });

  // Test 13: Cancelar convite inexistente → 404
  it('should return 404 for non-existent convite UUID', async () => {
    const fakeUuid = '00000000-0000-0000-0000-000000000000';
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/convites/${fakeUuid}/cancelar`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Convite não encontrado');
  });

  // Test 14: Filtro por status funciona → 200
  it('should filter convites by status', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/convites?status=aceito')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    for (const convite of response.body.data) {
      expect(convite.status).toBe('aceito');
    }
  });

  // Test 15: Convite cancelado não pode ser aceito → 410
  it('should return 410 when accepting a cancelled convite', async () => {
    // Get the token of the cancelled convite
    const convite = await prisma.conviteUsuario.findUnique({
      where: { id: conviteCanceladoId },
    });

    // Create the Redis key for this convite so acceptInvitation can find it
    await redisService.setex(
      `invite_director:${convite!.token}`,
      86400,
      JSON.stringify({
        email: convite!.email,
        escolaId: escolaAId,
        nome: convite!.nome_completo,
      }),
    );

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/accept-invitation')
      .send({
        token: convite!.token,
        senha: 'Teste@123',
      });

    expect(response.status).toBe(410);
    expect(response.body.message).toBe('Este convite foi cancelado');

    // Clean up Redis key
    await redisService.del(`invite_director:${convite!.token}`);
  });

  // Test 16: Paginação funciona (page, limit) → 200
  it('should paginate convites correctly', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/convites?page=1&limit=2')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeLessThanOrEqual(2);
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(2);
    expect(response.body.pagination.total).toBeGreaterThanOrEqual(1);
    expect(response.body.pagination.pages).toBeGreaterThanOrEqual(1);
  });
});
