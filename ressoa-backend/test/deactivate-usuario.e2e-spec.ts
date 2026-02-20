import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ThrottlerStorage } from '@nestjs/throttler';
import { RoleUsuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('PATCH /api/v1/usuarios/:id/desativar (E2E) - Story 13.9', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Tokens
  let adminToken: string;
  let diretorAToken: string;
  let coordenadorAToken: string;
  let professorAToken: string;

  // User IDs
  let adminId: string;
  let diretorAId: string;
  let coordenadorAId: string;
  let professorA1Id: string;
  let professorA2Id: string;
  let professorA3Id: string;
  let coordenadorA2Id: string;
  let diretorA2Id: string;
  let professorB1Id: string;
  let alreadyDeactivatedId: string;

  // School IDs
  let escolaAId: string;

  const EMAIL_PREFIX = 'story139';

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
        nome: 'Escola A Story 13.9',
        cnpj: '13900000000101',
        tipo: 'particular',
        contato_principal: 'Contato A',
        email_contato: `${EMAIL_PREFIX}.escolaA@teste.com`,
        telefone: '11999990190',
        plano: 'basico',
        limite_horas_mes: 400,
        status: 'ativa',
        data_ativacao: new Date(),
      },
    });
    escolaAId = escolaA.id;

    const escolaB = await prisma.escola.create({
      data: {
        nome: 'Escola B Story 13.9',
        cnpj: '13900000000202',
        tipo: 'publica',
        contato_principal: 'Contato B',
        email_contato: `${EMAIL_PREFIX}.escolaB@teste.com`,
        telefone: '11999990191',
        plano: 'basico',
        limite_horas_mes: 400,
        status: 'ativa',
        data_ativacao: new Date(),
      },
    });
    const escolaBId = escolaB.id;

    // Create Admin (no escola_id)
    const admin = await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.admin@teste.com`,
        nome: 'Admin Story 139',
        senha_hash: hash,
        perfil_usuario: { create: { role: RoleUsuario.ADMIN } },
      },
    });
    adminId = admin.id;

    // Create Diretor A (escola A)
    const diretorA = await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.diretorA@teste.com`,
        nome: 'Diretor A Story 139',
        senha_hash: hash,
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.DIRETOR } },
      },
    });
    diretorAId = diretorA.id;

    // Create Diretor A2 (escola A) - target for admin deactivation
    const diretorA2 = await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.diretorA2@teste.com`,
        nome: 'Diretor A2 Story 139',
        senha_hash: hash,
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.DIRETOR } },
      },
    });
    diretorA2Id = diretorA2.id;

    // Create Coordenador A (escola A)
    const coordenadorA = await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.coordenadorA@teste.com`,
        nome: 'Coordenador A Story 139',
        senha_hash: hash,
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.COORDENADOR } },
      },
    });
    coordenadorAId = coordenadorA.id;

    // Create Coordenador A2 (escola A) - target for deactivation
    const coordenadorA2 = await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.coordenadorA2@teste.com`,
        nome: 'Coordenador A2 Story 139',
        senha_hash: hash,
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.COORDENADOR } },
      },
    });
    coordenadorA2Id = coordenadorA2.id;

    // Create Professor A1 (escola A)
    const profA1 = await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.profA1@teste.com`,
        nome: 'Professor A1 Story 139',
        senha_hash: hash,
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.PROFESSOR } },
      },
    });
    professorA1Id = profA1.id;

    // Create Professor A2 (escola A) - for diretor deactivation test
    const profA2 = await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.profA2@teste.com`,
        nome: 'Professor A2 Story 139',
        senha_hash: hash,
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.PROFESSOR } },
      },
    });
    professorA2Id = profA2.id;

    // Create Professor A3 (escola A) - for coordenador deactivation test
    const profA3 = await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.profA3@teste.com`,
        nome: 'Professor A3 Story 139',
        senha_hash: hash,
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.PROFESSOR } },
      },
    });
    professorA3Id = profA3.id;

    // Create Professor B1 (escola B)
    const profB1 = await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.profB1@teste.com`,
        nome: 'Professor B1 Story 139',
        senha_hash: hash,
        escola: { connect: { id: escolaBId } },
        perfil_usuario: { create: { role: RoleUsuario.PROFESSOR } },
      },
    });
    professorB1Id = profB1.id;

    // Create already deactivated user (escola A)
    const deactivated = await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.deactivated@teste.com`,
        nome: 'Deactivated User Story 139',
        senha_hash: hash,
        escola: { connect: { id: escolaAId } },
        deleted_at: new Date(),
        perfil_usuario: { create: { role: RoleUsuario.PROFESSOR } },
      },
    });
    alreadyDeactivatedId = deactivated.id;

    // Login all users
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
    professorAToken = await loginUser(`${EMAIL_PREFIX}.profA1@teste.com`);
  });

  // Reset any deactivated users between tests to prevent cascading failures
  afterEach(async () => {
    await prisma.usuario.updateMany({
      where: { email: { startsWith: EMAIL_PREFIX }, deleted_at: { not: null } },
      data: { deleted_at: null },
    });
    // Re-deactivate the intentionally deactivated user
    await prisma.usuario.update({
      where: { id: alreadyDeactivatedId },
      data: { deleted_at: new Date() },
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
        where: { cnpj: { in: ['13900000000101', '13900000000202'] } },
      });
    } finally {
      await app.close();
    }
  });

  // Test 1: Admin deactivates PROFESSOR from any school → 200
  it('should allow Admin to deactivate a PROFESSOR from any school', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${professorB1Id}/desativar`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(professorB1Id);
    expect(response.body.deleted_at).toBeDefined();
    expect(response.body.deleted_at).not.toBeNull();
  });

  // Test 2: Admin deactivates DIRETOR → 200
  it('should allow Admin to deactivate a DIRETOR', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${diretorA2Id}/desativar`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(diretorA2Id);
    expect(response.body.deleted_at).toBeDefined();
  });

  // Test 3: Admin deactivates COORDENADOR → 200
  it('should allow Admin to deactivate a COORDENADOR', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${coordenadorA2Id}/desativar`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(coordenadorA2Id);
    expect(response.body.deleted_at).toBeDefined();
  });

  // Test 4: Diretor deactivates PROFESSOR from own school → 200
  it('should allow Diretor to deactivate PROFESSOR from own school', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${professorA2Id}/desativar`)
      .set('Authorization', `Bearer ${diretorAToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(professorA2Id);
    expect(response.body.deleted_at).toBeDefined();
  });

  // Test 5: Diretor deactivates COORDENADOR from own school → 200
  it('should allow Diretor to deactivate COORDENADOR from own school', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${coordenadorA2Id}/desativar`)
      .set('Authorization', `Bearer ${diretorAToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(coordenadorA2Id);
    expect(response.body.deleted_at).toBeDefined();
  });

  // Test 6: Diretor tries to deactivate DIRETOR → 403
  it('should return 403 when Diretor tries to deactivate another DIRETOR', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${diretorA2Id}/desativar`)
      .set('Authorization', `Bearer ${diretorAToken}`);

    expect(response.status).toBe(403);
  });

  // Test 7: Coordenador deactivates PROFESSOR from own school → 200
  it('should allow Coordenador to deactivate PROFESSOR from own school', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${professorA3Id}/desativar`)
      .set('Authorization', `Bearer ${coordenadorAToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(professorA3Id);
    expect(response.body.deleted_at).toBeDefined();
  });

  // Test 8: Coordenador tries to deactivate COORDENADOR → 403
  it('should return 403 when Coordenador tries to deactivate a COORDENADOR', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${coordenadorA2Id}/desativar`)
      .set('Authorization', `Bearer ${coordenadorAToken}`);

    expect(response.status).toBe(403);
  });

  // Test 9: Professor tries to deactivate (no access) → 403
  it('should return 403 when Professor tries to deactivate a user', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${professorA2Id}/desativar`)
      .set('Authorization', `Bearer ${professorAToken}`);

    expect(response.status).toBe(403);
  });

  // Test 10: Self-deactivation blocked → 400
  it('should return 400 when user tries to deactivate themselves', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${diretorAId}/desativar`)
      .set('Authorization', `Bearer ${diretorAToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Não é possível desativar a si mesmo');
  });

  // Test 11: Already deactivated user → 409
  it('should return 409 when user is already deactivated', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${alreadyDeactivatedId}/desativar`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Usuário já está desativado');
  });

  // Test 12: Invalid UUID → 400
  it('should return 400 for invalid UUID', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/v1/usuarios/not-a-uuid/desativar')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
  });

  // Test 13: Non-existent user → 404
  it('should return 404 for non-existent user UUID', async () => {
    const fakeUuid = '00000000-0000-0000-0000-000000000000';
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${fakeUuid}/desativar`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Usuário não encontrado');
  });

  // Test 14: Multi-tenancy - Diretor escola A cannot deactivate user from escola B → 404
  it('should return 404 when Diretor A tries to deactivate user from escola B (multi-tenancy)', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${professorB1Id}/desativar`)
      .set('Authorization', `Bearer ${diretorAToken}`);

    expect(response.status).toBe(404);
  });

  // Test 15: Response NEVER contains senha_hash
  it('should NEVER return senha_hash in deactivation response', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${professorA1Id}/desativar`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.senha_hash).toBeUndefined();
    expect(response.body.password).toBeUndefined();
    expect(response.body.id).toBeDefined();
    expect(response.body.nome).toBeDefined();
    expect(response.body.email).toBeDefined();
    expect(response.body.role).toBeDefined();
    expect(response.body.deleted_at).toBeDefined();
    expect(response.body.created_at).toBeDefined();
    expect(response.body.updated_at).toBeDefined();
  });

  // Test 16: Listing excludes deactivated users
  it('should exclude deactivated users from listing', async () => {
    // Deactivate professorA2
    await prisma.usuario.update({
      where: { id: professorA2Id },
      data: { deleted_at: new Date() },
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ escola_id: escolaAId });

    expect(response.status).toBe(200);
    const userIds = response.body.data.map((u: { id: string }) => u.id);
    expect(userIds).not.toContain(professorA2Id);
    expect(userIds).not.toContain(alreadyDeactivatedId);
  });
});
