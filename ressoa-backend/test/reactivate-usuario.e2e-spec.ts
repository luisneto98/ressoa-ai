import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ThrottlerStorage } from '@nestjs/throttler';
import { RoleUsuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('PATCH /api/v1/usuarios/:id/reativar (E2E) - Story 13.10', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Tokens
  let adminToken: string;
  let diretorAToken: string;
  let coordenadorAToken: string;
  let professorAToken: string;

  // User IDs (all created as deactivated)
  let professorA1Id: string;
  let professorA2Id: string;
  let professorA3Id: string;
  let coordenadorA2Id: string;
  let diretorA2Id: string;
  let professorB1Id: string;
  let alreadyActiveId: string;

  // School IDs
  let escolaAId: string;

  const EMAIL_PREFIX = 'story1310';

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

    const hash = await bcrypt.hash('Teste@123', 10);

    // Create 2 schools
    const escolaA = await prisma.escola.create({
      data: {
        nome: 'Escola A Story 13.10',
        cnpj: '13100000000101',
        tipo: 'particular',
        contato_principal: 'Contato A',
        email_contato: `${EMAIL_PREFIX}.escolaA@teste.com`,
        telefone: '11999991310',
        plano: 'basico',
        limite_horas_mes: 400,
        status: 'ativa',
        data_ativacao: new Date(),
      },
    });
    escolaAId = escolaA.id;

    const escolaB = await prisma.escola.create({
      data: {
        nome: 'Escola B Story 13.10',
        cnpj: '13100000000202',
        tipo: 'publica',
        contato_principal: 'Contato B',
        email_contato: `${EMAIL_PREFIX}.escolaB@teste.com`,
        telefone: '11999991311',
        plano: 'basico',
        limite_horas_mes: 400,
        status: 'ativa',
        data_ativacao: new Date(),
      },
    });
    const escolaBId = escolaB.id;

    // Create Admin (no escola_id) - active (needs to login)
    await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.admin@teste.com`,
        nome: 'Admin Story 1310',
        senha_hash: hash,
        perfil_usuario: { create: { role: RoleUsuario.ADMIN } },
      },
    });

    // Create Diretor A (escola A) - active (needs to login)
    await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.diretorA@teste.com`,
        nome: 'Diretor A Story 1310',
        senha_hash: hash,
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.DIRETOR } },
      },
    });

    // Create Coordenador A (escola A) - active (needs to login)
    await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.coordenadorA@teste.com`,
        nome: 'Coordenador A Story 1310',
        senha_hash: hash,
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.COORDENADOR } },
      },
    });

    // Create Professor A1 (escola A) - active (needs to login for Professor test)
    const profA1Active = await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.profA1active@teste.com`,
        nome: 'Professor A1 Active Story 1310',
        senha_hash: hash,
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.PROFESSOR } },
      },
    });

    // Create DEACTIVATED users as targets for reactivation
    // Professor A1 (escola A) - deactivated
    const profA1 = await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.profA1@teste.com`,
        nome: 'Professor A1 Story 1310',
        senha_hash: hash,
        deleted_at: new Date(),
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.PROFESSOR } },
      },
    });
    professorA1Id = profA1.id;

    // Professor A2 (escola A) - deactivated
    const profA2 = await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.profA2@teste.com`,
        nome: 'Professor A2 Story 1310',
        senha_hash: hash,
        deleted_at: new Date(),
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.PROFESSOR } },
      },
    });
    professorA2Id = profA2.id;

    // Professor A3 (escola A) - deactivated
    const profA3 = await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.profA3@teste.com`,
        nome: 'Professor A3 Story 1310',
        senha_hash: hash,
        deleted_at: new Date(),
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.PROFESSOR } },
      },
    });
    professorA3Id = profA3.id;

    // Coordenador A2 (escola A) - deactivated
    const coordA2 = await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.coordenadorA2@teste.com`,
        nome: 'Coordenador A2 Story 1310',
        senha_hash: hash,
        deleted_at: new Date(),
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.COORDENADOR } },
      },
    });
    coordenadorA2Id = coordA2.id;

    // Diretor A2 (escola A) - deactivated
    const diretorA2 = await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.diretorA2@teste.com`,
        nome: 'Diretor A2 Story 1310',
        senha_hash: hash,
        deleted_at: new Date(),
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.DIRETOR } },
      },
    });
    diretorA2Id = diretorA2.id;

    // Professor B1 (escola B) - deactivated
    const profB1 = await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.profB1@teste.com`,
        nome: 'Professor B1 Story 1310',
        senha_hash: hash,
        deleted_at: new Date(),
        escola: { connect: { id: escolaBId } },
        perfil_usuario: { create: { role: RoleUsuario.PROFESSOR } },
      },
    });
    professorB1Id = profB1.id;

    // Already active user (escola A) - for 409 test
    const activeUser = await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.active@teste.com`,
        nome: 'Active User Story 1310',
        senha_hash: hash,
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.PROFESSOR } },
      },
    });
    alreadyActiveId = activeUser.id;

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
    professorAToken = await loginUser(`${EMAIL_PREFIX}.profA1active@teste.com`);
  });

  // After each test, re-deactivate any users that were reactivated
  // Note: updateMany by email prefix is safe here (test-only data with unique EMAIL_PREFIX)
  afterEach(async () => {
    const deactivatedEmails = [
      `${EMAIL_PREFIX}.profA1@teste.com`,
      `${EMAIL_PREFIX}.profA2@teste.com`,
      `${EMAIL_PREFIX}.profA3@teste.com`,
      `${EMAIL_PREFIX}.coordenadorA2@teste.com`,
      `${EMAIL_PREFIX}.diretorA2@teste.com`,
      `${EMAIL_PREFIX}.profB1@teste.com`,
    ];
    await prisma.usuario.updateMany({
      where: { email: { in: deactivatedEmails } },
      data: { deleted_at: new Date() },
    });
    // Ensure the already active user stays active
    await prisma.usuario.update({
      where: { id: alreadyActiveId },
      data: { deleted_at: null },
    });
  });

  afterAll(async () => {
    try {
      await prisma.perfilUsuario.deleteMany({
        where: { usuario: { email: { startsWith: EMAIL_PREFIX } } },
      });
      await prisma.usuario.deleteMany({
        where: { email: { startsWith: EMAIL_PREFIX } },
      });
      await prisma.escola.deleteMany({
        where: { cnpj: { in: ['13100000000101', '13100000000202'] } },
      });
    } finally {
      await app.close();
    }
  });

  // Test 1: Admin reactivates PROFESSOR from any school → 200
  it('should allow Admin to reactivate a deactivated PROFESSOR from any school', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${professorB1Id}/reativar`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(professorB1Id);
    expect(response.body.deleted_at).toBeNull();
  });

  // Test 2: Admin reactivates DIRETOR → 200
  it('should allow Admin to reactivate a deactivated DIRETOR', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${diretorA2Id}/reativar`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(diretorA2Id);
    expect(response.body.deleted_at).toBeNull();
  });

  // Test 3: Admin reactivates COORDENADOR → 200
  it('should allow Admin to reactivate a deactivated COORDENADOR', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${coordenadorA2Id}/reativar`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(coordenadorA2Id);
    expect(response.body.deleted_at).toBeNull();
  });

  // Test 4: Diretor reactivates PROFESSOR from own school → 200
  it('should allow Diretor to reactivate deactivated PROFESSOR from own school', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${professorA2Id}/reativar`)
      .set('Authorization', `Bearer ${diretorAToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(professorA2Id);
    expect(response.body.deleted_at).toBeNull();
  });

  // Test 5: Diretor reactivates COORDENADOR from own school → 200
  it('should allow Diretor to reactivate deactivated COORDENADOR from own school', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${coordenadorA2Id}/reativar`)
      .set('Authorization', `Bearer ${diretorAToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(coordenadorA2Id);
    expect(response.body.deleted_at).toBeNull();
  });

  // Test 6: Diretor tries to reactivate DIRETOR → 403
  it('should return 403 when Diretor tries to reactivate another DIRETOR', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${diretorA2Id}/reativar`)
      .set('Authorization', `Bearer ${diretorAToken}`);

    expect(response.status).toBe(403);
  });

  // Test 7: Coordenador reactivates PROFESSOR from own school → 200
  it('should allow Coordenador to reactivate deactivated PROFESSOR from own school', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${professorA3Id}/reativar`)
      .set('Authorization', `Bearer ${coordenadorAToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(professorA3Id);
    expect(response.body.deleted_at).toBeNull();
  });

  // Test 8: Coordenador tries to reactivate COORDENADOR → 403
  it('should return 403 when Coordenador tries to reactivate a COORDENADOR', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${coordenadorA2Id}/reativar`)
      .set('Authorization', `Bearer ${coordenadorAToken}`);

    expect(response.status).toBe(403);
  });

  // Test 9: Professor tries to reactivate → 403
  it('should return 403 when Professor tries to reactivate a user', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${professorA2Id}/reativar`)
      .set('Authorization', `Bearer ${professorAToken}`);

    expect(response.status).toBe(403);
  });

  // Test 10: Reactivate already-active user → 409
  it('should return 409 when user is already active', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${alreadyActiveId}/reativar`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Usuário já está ativo');
  });

  // Test 11: Invalid UUID → 400
  it('should return 400 for invalid UUID', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/v1/usuarios/not-a-uuid/reativar')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
  });

  // Test 12: Non-existent UUID → 404
  it('should return 404 for non-existent user UUID', async () => {
    const fakeUuid = '00000000-0000-0000-0000-000000000000';
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${fakeUuid}/reativar`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Usuário não encontrado');
  });

  // Test 13: Cross-school (Diretor A reactivates Escola B user) → 404
  it('should return 404 when Diretor A tries to reactivate user from escola B (multi-tenancy)', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${professorB1Id}/reativar`)
      .set('Authorization', `Bearer ${diretorAToken}`);

    expect(response.status).toBe(404);
  });

  // Test 14: Response never contains senha_hash
  it('should NEVER return senha_hash in reactivation response', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${professorA1Id}/reativar`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.senha_hash).toBeUndefined();
    expect(response.body.password).toBeUndefined();
    expect(response.body.id).toBeDefined();
    expect(response.body.nome).toBeDefined();
    expect(response.body.email).toBeDefined();
    expect(response.body.role).toBeDefined();
    expect(response.body.deleted_at).toBeNull();
    expect(response.body.created_at).toBeDefined();
    expect(response.body.updated_at).toBeDefined();
  });
});
