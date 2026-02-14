import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RoleUsuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('GET /api/v1/usuarios (E2E) - Story 13.7', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Tokens
  let adminToken: string;
  let diretorAToken: string;
  let coordenadorAToken: string;
  let professorAToken: string;
  let diretorBToken: string;

  // School IDs
  let escolaAId: string;
  let escolaBId: string;

  // Test email prefix for cleanup
  const EMAIL_PREFIX = 'story137';

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

    // Create 2 schools
    const escolaA = await prisma.escola.create({
      data: {
        nome: 'Escola A Story 13.7',
        cnpj: '13700000000101',
        tipo: 'particular',
        contato_principal: 'Contato A',
        email_contato: `${EMAIL_PREFIX}.escolaA@teste.com`,
        telefone: '11999990137',
        plano: 'basico',
        limite_horas_mes: 400,
        status: 'ativa',
        data_ativacao: new Date(),
      },
    });
    escolaAId = escolaA.id;

    const escolaB = await prisma.escola.create({
      data: {
        nome: 'Escola B Story 13.7',
        cnpj: '13700000000202',
        tipo: 'publica',
        contato_principal: 'Contato B',
        email_contato: `${EMAIL_PREFIX}.escolaB@teste.com`,
        telefone: '11999990138',
        plano: 'basico',
        limite_horas_mes: 400,
        status: 'ativa',
        data_ativacao: new Date(),
      },
    });
    escolaBId = escolaB.id;

    const hash = await bcrypt.hash('Teste@123', 10);

    // Create Admin (no escola_id)
    await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.admin@teste.com`,
        nome: 'Admin Story 137',
        senha_hash: hash,
        perfil_usuario: { create: { role: RoleUsuario.ADMIN } },
      },
    });

    // Create Diretor A (escola A)
    await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.diretorA@teste.com`,
        nome: 'Diretor A Story 137',
        senha_hash: hash,
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.DIRETOR } },
      },
    });

    // Create Coordenador A (escola A)
    await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.coordenadorA@teste.com`,
        nome: 'Coordenador A Story 137',
        senha_hash: hash,
        escola: { connect: { id: escolaAId } },
        perfil_usuario: { create: { role: RoleUsuario.COORDENADOR } },
      },
    });

    // Create 3 Professors in escola A
    for (let i = 1; i <= 3; i++) {
      await prisma.usuario.create({
        data: {
          email: `${EMAIL_PREFIX}.profA${i}@teste.com`,
          nome: `Professor A${i} Story 137`,
          senha_hash: hash,
          escola: { connect: { id: escolaAId } },
          perfil_usuario: { create: { role: RoleUsuario.PROFESSOR } },
        },
      });
    }

    // Create Diretor B (escola B)
    await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.diretorB@teste.com`,
        nome: 'Diretor B Story 137',
        senha_hash: hash,
        escola: { connect: { id: escolaBId } },
        perfil_usuario: { create: { role: RoleUsuario.DIRETOR } },
      },
    });

    // Create Professor B (escola B)
    await prisma.usuario.create({
      data: {
        email: `${EMAIL_PREFIX}.profB1@teste.com`,
        nome: 'Professor B1 Story 137',
        senha_hash: hash,
        escola: { connect: { id: escolaBId } },
        perfil_usuario: { create: { role: RoleUsuario.PROFESSOR } },
      },
    });

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
    diretorBToken = await loginUser(`${EMAIL_PREFIX}.diretorB@teste.com`);
  });

  afterAll(async () => {
    // Cleanup: delete test users then schools
    await prisma.usuario.deleteMany({
      where: {
        email: { startsWith: EMAIL_PREFIX },
      },
    });
    await prisma.escola.deleteMany({
      where: {
        cnpj: { in: ['13700000000101', '13700000000202'] },
      },
    });
    await app.close();
  });

  // Test 1: Admin sees users from all schools
  it('should return users from all schools for Admin', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/usuarios')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toBeDefined();
    expect(response.body.pagination).toBeDefined();

    // Admin sees users from both schools (at least our test users)
    const emails = response.body.data.map((u: any) => u.email);
    expect(
      emails.some((e: string) => e.includes('diretorA')),
    ).toBe(true);
    expect(
      emails.some((e: string) => e.includes('profB1')),
    ).toBe(true);

    // Admin response includes escola_nome with correct value
    const userWithEscola = response.body.data.find(
      (u: any) => u.escola_nome,
    );
    expect(userWithEscola).toBeDefined();
    expect(userWithEscola.escola_nome).toEqual(
      expect.stringContaining('Story 13.7'),
    );
  });

  // Test 2: Diretor sees only PROFESSOR + COORDENADOR from own school
  it('should return only PROFESSOR and COORDENADOR from same school for Diretor', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/usuarios')
      .set('Authorization', `Bearer ${diretorAToken}`);

    expect(response.status).toBe(200);

    const roles = response.body.data.map((u: any) => u.role);
    // Should see PROFESSOR and COORDENADOR only
    roles.forEach((role: string) => {
      expect([RoleUsuario.PROFESSOR, RoleUsuario.COORDENADOR]).toContain(role);
    });

    // Should NOT see Diretor
    expect(roles).not.toContain(RoleUsuario.DIRETOR);
    expect(roles).not.toContain(RoleUsuario.ADMIN);

    // Should only see escola A users
    const emails = response.body.data.map((u: any) => u.email);
    expect(
      emails.every((e: string) => !e.includes('profB1')),
    ).toBe(true);
  });

  // Test 3: Coordenador sees only PROFESSOR from own school
  it('should return only PROFESSOR from same school for Coordenador', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/usuarios')
      .set('Authorization', `Bearer ${coordenadorAToken}`);

    expect(response.status).toBe(200);

    const roles = response.body.data.map((u: any) => u.role);
    // Should see only PROFESSOR
    roles.forEach((role: string) => {
      expect(role).toBe(RoleUsuario.PROFESSOR);
    });

    // Should NOT see Coordenador, Diretor, or Admin
    expect(roles).not.toContain(RoleUsuario.COORDENADOR);
    expect(roles).not.toContain(RoleUsuario.DIRETOR);
    expect(roles).not.toContain(RoleUsuario.ADMIN);
  });

  // Test 4: Professor gets 403 Forbidden
  it('should return 403 when Professor tries to list users', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/usuarios')
      .set('Authorization', `Bearer ${professorAToken}`);

    expect(response.status).toBe(403);
  });

  // Test 5: Unauthenticated gets 401
  it('should return 401 when no auth token provided', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/v1/usuarios',
    );

    expect(response.status).toBe(401);
  });

  // Test 6: Pagination works correctly
  it('should paginate results correctly', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/usuarios?page=1&limit=2')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeLessThanOrEqual(2);
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(2);
    expect(response.body.pagination.total).toBeGreaterThanOrEqual(1);
    expect(response.body.pagination.pages).toBeGreaterThanOrEqual(1);
  });

  // Test 7: Search by name (case-insensitive)
  it('should filter by name search (case-insensitive)', async () => {
    const response = await request(app.getHttpServer())
      .get(
        `/api/v1/usuarios?search=professor a1`,
      )
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    expect(
      response.body.data.some((u: any) =>
        u.nome.toLowerCase().includes('professor a1'),
      ),
    ).toBe(true);
  });

  // Test 8: Search by email
  it('should filter by email search', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/usuarios?search=${EMAIL_PREFIX}.profA2`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    expect(
      response.body.data.some((u: any) =>
        u.email.includes(`${EMAIL_PREFIX}.profA2`),
      ),
    ).toBe(true);
  });

  // Test 9: Filter by role
  it('should filter by role query param', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/usuarios?role=PROFESSOR')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    response.body.data.forEach((u: any) => {
      expect(u.role).toBe(RoleUsuario.PROFESSOR);
    });
  });

  // Test 10: Invalid page returns 400
  it('should return 400 for page=-1', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/usuarios?page=-1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
  });

  // Test 11: Invalid limit returns 400
  it('should return 400 for limit=200', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/usuarios?limit=200')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
  });

  // Test 12: Multi-tenancy isolation (Diretor A cannot see escola B users)
  it('should enforce multi-tenancy: Diretor A does NOT see escola B users', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/usuarios')
      .set('Authorization', `Bearer ${diretorAToken}`);

    expect(response.status).toBe(200);

    const emails = response.body.data.map((u: any) => u.email);
    // Must NOT contain escola B users
    expect(
      emails.some((e: string) => e.includes('profB1')),
    ).toBe(false);
    expect(
      emails.some((e: string) => e.includes('diretorB')),
    ).toBe(false);
  });

  // Test 13: Coordenador cannot see Diretores or Coordenadores (role hierarchy)
  it('should enforce role hierarchy: Coordenador does NOT see Diretores or Coordenadores', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/usuarios')
      .set('Authorization', `Bearer ${coordenadorAToken}`);

    expect(response.status).toBe(200);

    const roles = response.body.data.map((u: any) => u.role);
    expect(roles).not.toContain(RoleUsuario.DIRETOR);
    expect(roles).not.toContain(RoleUsuario.COORDENADOR);

    // When Coordenador requests ?role=DIRETOR, should get empty list
    const filteredResponse = await request(app.getHttpServer())
      .get('/api/v1/usuarios?role=DIRETOR')
      .set('Authorization', `Bearer ${coordenadorAToken}`);

    expect(filteredResponse.status).toBe(200);
    expect(filteredResponse.body.data.length).toBe(0);
  });

  // Test 14: Response never contains senha_hash
  it('should NEVER return senha_hash in response', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/usuarios')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    response.body.data.forEach((u: any) => {
      expect(u.senha_hash).toBeUndefined();
      expect(u.password).toBeUndefined();
    });
  });

  // Test 15: Admin can filter by escola_id (AC3)
  it('should allow Admin to filter by escola_id', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/usuarios?escola_id=${escolaAId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);

    // Should only return users from escola A
    const emails = response.body.data.map((u: any) => u.email);
    expect(emails.some((e: string) => e.includes('diretorA'))).toBe(true);
    expect(emails.some((e: string) => e.includes('profB1'))).toBe(false);
    expect(emails.some((e: string) => e.includes('diretorB'))).toBe(false);
  });

  // Test 16: Results ordered by created_at DESC
  it('should order results by created_at DESC', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/usuarios')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);

    const dates = response.body.data.map(
      (u: any) => new Date(u.created_at).getTime(),
    );

    for (let i = 1; i < dates.length; i++) {
      expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
    }
  });
});
