import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ThrottlerStorage } from '@nestjs/throttler';
import { RoleUsuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('PATCH /api/v1/usuarios/:id (E2E) - Story 13.8', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Tokens
  let adminToken: string;
  let diretorAToken: string;
  let coordenadorAToken: string;
  let professorAToken: string;

  // User IDs
  let professorA1Id: string;
  let professorA2Id: string;
  let coordenadorAId: string;
  let diretorAId: string;
  let professorB1Id: string;

  // Test email prefix for cleanup
  const EMAIL_PREFIX = 'story138';

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
        nome: 'Escola A Story 13.8',
        cnpj: '13800000000101',
        tipo: 'particular',
        contato_principal: 'Contato A',
        email_contato: `${EMAIL_PREFIX}.escolaA@teste.com`,
        telefone: '11999990180',
        plano: 'basico',
        limite_horas_mes: 400,
        status: 'ativa',
        data_ativacao: new Date(),
      },
    });
    const escolaAId = escolaA.id;

    const escolaB = await prisma.escola.create({
      data: {
        nome: 'Escola B Story 13.8',
        cnpj: '13800000000202',
        tipo: 'publica',
        contato_principal: 'Contato B',
        email_contato: `${EMAIL_PREFIX}.escolaB@teste.com`,
        telefone: '11999990181',
        plano: 'basico',
        limite_horas_mes: 400,
        status: 'ativa',
        data_ativacao: new Date(),
      },
    });
    const escolaBId = escolaB.id;

    // Create Admin (no escola_id)
    await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.admin@teste.com`,
        nome: 'Admin Story 138',
        senha_hash: hash,
        perfil_usuario: { create: { role: RoleUsuario.ADMIN } },
      },
    });

    // Create Diretor A (escola A)
    const diretorA = await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.diretorA@teste.com`,
        nome: 'Diretor A Story 138',
        senha_hash: hash,
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.DIRETOR } },
      },
    });
    diretorAId = diretorA.id;

    // Create Coordenador A (escola A)
    const coordenadorA = await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.coordenadorA@teste.com`,
        nome: 'Coordenador A Story 138',
        senha_hash: hash,
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.COORDENADOR } },
      },
    });
    coordenadorAId = coordenadorA.id;

    // Create Professor A1 (escola A)
    const profA1 = await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.profA1@teste.com`,
        nome: 'Professor A1 Story 138',
        senha_hash: hash,
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.PROFESSOR } },
      },
    });
    professorA1Id = profA1.id;

    // Create Professor A2 (escola A) — for email uniqueness testing
    const profA2 = await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.profA2@teste.com`,
        nome: 'Professor A2 Story 138',
        senha_hash: hash,
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.PROFESSOR } },
      },
    });
    professorA2Id = profA2.id;

    // Create Diretor B (escola B)
    await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.diretorB@teste.com`,
        nome: 'Diretor B Story 138',
        senha_hash: hash,
        escola: { connect: { id: escolaBId } },
        perfil_usuario: { create: { role: RoleUsuario.DIRETOR } },
      },
    });

    // Create Professor B1 (escola B)
    const profB1 = await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.profB1@teste.com`,
        nome: 'Professor B1 Story 138',
        senha_hash: hash,
        escola: { connect: { id: escolaBId } },
        perfil_usuario: { create: { role: RoleUsuario.PROFESSOR } },
      },
    });
    professorB1Id = profB1.id;

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

  afterAll(async () => {
    try {
      // Cleanup: delete test users then schools
      await prisma.usuario.deleteMany({
        where: { email: { startsWith: EMAIL_PREFIX } },
      });
      await prisma.escola.deleteMany({
        where: { cnpj: { in: ['13800000000101', '13800000000202'] } },
      });
    } finally {
      await app.close();
    }
  });

  // Test 1: Admin edits user from any school → 200
  it('should allow Admin to update a user from any school', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${professorB1Id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Professor B1 Updated' });

    expect(response.status).toBe(200);
    expect(response.body.nome).toBe('Professor B1 Updated');
    expect(response.body.id).toBe(professorB1Id);
  });

  // Test 2: Diretor updates PROFESSOR from own school → 200
  it('should allow Diretor to update PROFESSOR from own school', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${professorA1Id}`)
      .set('Authorization', `Bearer ${diretorAToken}`)
      .send({ nome: 'Professor A1 Updated By Diretor' });

    expect(response.status).toBe(200);
    expect(response.body.nome).toBe('Professor A1 Updated By Diretor');
  });

  // Test 3: Diretor updates COORDENADOR from own school → 200
  it('should allow Diretor to update COORDENADOR from own school', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${coordenadorAId}`)
      .set('Authorization', `Bearer ${diretorAToken}`)
      .send({ nome: 'Coordenador A Updated' });

    expect(response.status).toBe(200);
    expect(response.body.nome).toBe('Coordenador A Updated');
  });

  // Test 4: Diretor cannot edit another DIRETOR → 403
  it('should return 403 when Diretor tries to edit another DIRETOR', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${diretorAId}`)
      .set('Authorization', `Bearer ${diretorAToken}`)
      .send({ nome: 'Should Fail' });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      'Sem permissão para editar este usuário',
    );
  });

  // Test 5: Coordenador updates PROFESSOR from own school → 200
  it('should allow Coordenador to update PROFESSOR from own school', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${professorA1Id}`)
      .set('Authorization', `Bearer ${coordenadorAToken}`)
      .send({ nome: 'Professor A1 Updated By Coord' });

    expect(response.status).toBe(200);
    expect(response.body.nome).toBe('Professor A1 Updated By Coord');
  });

  // Test 6: Coordenador cannot edit COORDENADOR → 403
  it('should return 403 when Coordenador tries to edit a COORDENADOR', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${coordenadorAId}`)
      .set('Authorization', `Bearer ${coordenadorAToken}`)
      .send({ nome: 'Should Fail' });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      'Sem permissão para editar este usuário',
    );
  });

  // Test 7: Professor cannot access endpoint → 403
  it('should return 403 when Professor tries to edit a user', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${professorA1Id}`)
      .set('Authorization', `Bearer ${professorAToken}`)
      .send({ nome: 'Should Fail' });

    expect(response.status).toBe(403);
  });

  // Test 8: Unauthenticated → 401
  it('should return 401 when no auth token provided', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${professorA1Id}`)
      .send({ nome: 'Should Fail' });

    expect(response.status).toBe(401);
  });

  // Test 9: Diretor escola A cannot edit user from escola B (multi-tenancy) → 404
  it('should return 404 when Diretor A tries to edit user from escola B (multi-tenancy)', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${professorB1Id}`)
      .set('Authorization', `Bearer ${diretorAToken}`)
      .send({ nome: 'Should Fail' });

    expect(response.status).toBe(404);
  });

  // Test 10: Email duplicado na mesma escola → 409
  it('should return 409 when email already exists in same school', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${professorA1Id}`)
      .set('Authorization', `Bearer ${diretorAToken}`)
      .send({ email: `${EMAIL_PREFIX}.profA2@teste.com` });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Email já cadastrado nesta escola');
  });

  // Test 11: Self email (same email as current) → 200 (no conflict)
  it('should allow update with own current email (no conflict)', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${professorA2Id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: `${EMAIL_PREFIX}.profA2@teste.com`,
        nome: 'Professor A2 SelfEmail',
      });

    expect(response.status).toBe(200);
    // Email not changed, so it keeps original case from DB
    expect(response.body.nome).toBe('Professor A2 SelfEmail');
  });

  // Test 12: Body inválido → 400
  it('should return 400 for invalid body (nome too short)', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${professorA1Id}`)
      .set('Authorization', `Bearer ${diretorAToken}`)
      .send({ nome: 'AB' });

    expect(response.status).toBe(400);
  });

  // Test 13: Body vazio → 400
  it('should return 400 for empty body', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${professorA1Id}`)
      .set('Authorization', `Bearer ${coordenadorAToken}`)
      .send({});

    expect(response.status).toBe(400);
  });

  // Test 14: UUID inexistente → 404
  it('should return 404 for non-existent UUID', async () => {
    const fakeUuid = '00000000-0000-0000-0000-000000000000';
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${fakeUuid}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Should Not Work' });

    expect(response.status).toBe(404);
  });

  // Test 15: Response NEVER contains senha_hash
  it('should NEVER return senha_hash in response', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/usuarios/${professorA2Id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Professor A2 Security Test' });

    expect(response.status).toBe(200);
    expect(response.body.senha_hash).toBeUndefined();
    expect(response.body.password).toBeUndefined();
    expect(response.body.id).toBeDefined();
    expect(response.body.nome).toBeDefined();
    expect(response.body.email).toBeDefined();
    expect(response.body.role).toBeDefined();
    expect(response.body.created_at).toBeDefined();
    expect(response.body.updated_at).toBeDefined();
  });
});
