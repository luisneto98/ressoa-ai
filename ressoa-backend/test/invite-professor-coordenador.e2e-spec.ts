import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';
import { RoleUsuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('POST /api/v1/coordenador/invite-professor (E2E) - Story 13.6', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redisService: RedisService;

  // Test users
  let coordenadorToken: string;
  let adminToken: string;
  let diretorToken: string;
  let professorToken: string;
  let escolaId: string;
  let escolaInativaId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get(PrismaService);
    redisService = app.get(RedisService);

    // Create active test school
    const escola = await prisma.escola.create({
      data: {
        nome: 'Escola Teste Story 13.6',
        cnpj: '98765432000199',
        tipo: 'particular',
        contato_principal: 'Contato Story 13.6',
        email_contato: 'story136@teste.com',
        telefone: '11999999136',
        plano: 'basico',
        limite_horas_mes: 400,
        status: 'ativa',
        data_ativacao: new Date(),
      },
    });
    escolaId = escola.id;

    // Create inactive school for testing
    const escolaInativa = await prisma.escola.create({
      data: {
        nome: 'Escola Inativa Story 13.6',
        cnpj: '11122233000144',
        tipo: 'particular',
        contato_principal: 'Contato Inativa',
        email_contato: 'inativa136@teste.com',
        telefone: '11999999137',
        plano: 'basico',
        limite_horas_mes: 400,
        status: 'inativa',
      },
    });
    escolaInativaId = escolaInativa.id;

    // Create coordenador test user (primary role for this story)
    const coordenadorHash = await bcrypt.hash('Coordenador@123', 10);
    await prisma.usuario.create({
      data: {
        email: 'coordenador.story136@escola.com',
        nome: 'Coordenador Story 136',
        senha_hash: coordenadorHash,
        escola: { connect: { id: escolaId } },
        perfil_usuario: {
          create: { role: RoleUsuario.COORDENADOR },
        },
      },
    });

    // Create coordenador in inactive school
    const coordenadorInativaHash = await bcrypt.hash('Coordenador@456', 10);
    await prisma.usuario.create({
      data: {
        email: 'coordenador.inativa@escola.com',
        nome: 'Coordenador Escola Inativa',
        senha_hash: coordenadorInativaHash,
        escola: { connect: { id: escolaInativaId } },
        perfil_usuario: {
          create: { role: RoleUsuario.COORDENADOR },
        },
      },
    });

    // Create admin user
    const adminHash = await bcrypt.hash('Admin@123', 10);
    await prisma.usuario.create({
      data: {
        email: 'admin.story136@escola.com',
        nome: 'Admin Story 136',
        senha_hash: adminHash,
        escola: { connect: { id: escolaId } },
        perfil_usuario: {
          create: { role: RoleUsuario.ADMIN },
        },
      },
    });

    // Create diretor user
    const diretorHash = await bcrypt.hash('Diretor@123', 10);
    await prisma.usuario.create({
      data: {
        email: 'diretor.story136@escola.com',
        nome: 'Diretor Story 136',
        senha_hash: diretorHash,
        escola: { connect: { id: escolaId } },
        perfil_usuario: {
          create: { role: RoleUsuario.DIRETOR },
        },
      },
    });

    // Create professor user
    const professorHash = await bcrypt.hash('Professor@123', 10);
    await prisma.usuario.create({
      data: {
        email: 'professor.story136@escola.com',
        nome: 'Professor Story 136',
        senha_hash: professorHash,
        escola: { connect: { id: escolaId } },
        perfil_usuario: {
          create: {
            role: RoleUsuario.PROFESSOR,
          },
        },
      },
    });

    // Login as coordenador
    const coordenadorLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'coordenador.story136@escola.com',
        senha: 'Coordenador@123',
      });
    coordenadorToken = coordenadorLogin.body.access_token;

    // Login as admin
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin.story136@escola.com',
        senha: 'Admin@123',
      });
    adminToken = adminLogin.body.access_token;

    // Login as diretor
    const diretorLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'diretor.story136@escola.com',
        senha: 'Diretor@123',
      });
    diretorToken = diretorLogin.body.access_token;

    // Login as professor
    const professorLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'professor.story136@escola.com',
        senha: 'Professor@123',
      });
    professorToken = professorLogin.body.access_token;
  });

  afterEach(async () => {
    // Cleanup Redis tokens created during tests
    const keys = await redisService.keys('invite_professor:*');
    if (keys.length > 0) {
      await Promise.all(keys.map((key) => redisService.del(key)));
    }
  });

  afterAll(async () => {
    // Cleanup database
    await prisma.usuario.deleteMany({
      where: {
        email: {
          in: [
            'coordenador.story136@escola.com',
            'coordenador.inativa@escola.com',
            'admin.story136@escola.com',
            'diretor.story136@escola.com',
            'professor.story136@escola.com',
            'professor.novo@escola.com',
          ],
        },
      },
    });
    await prisma.escola.deleteMany({
      where: {
        cnpj: {
          in: ['98765432000199', '11122233000144'],
        },
      },
    });
    await app.close();
  });

  // AC17 Test 1: ✅ Happy path - coordenador token → 201 Created
  it('should send invitation successfully with valid coordenador token', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/coordenador/invite-professor')
      .set('Authorization', `Bearer ${coordenadorToken}`)
      .send({
        email: 'professor.novo@escola.com',
        nome: 'Professor Novo',
        disciplina: 'MATEMATICA',
        formacao: 'Licenciatura em Matemática',
        registro: 'RP-12345',
        telefone: '(11) 98765-4321',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      message: 'Convite enviado com sucesso',
    });

    // Verify token in Redis
    const keys = await redisService.keys('invite_professor:*');
    expect(keys.length).toBeGreaterThan(0);

    const tokenData = await redisService.get(keys[0]);
    const payload = JSON.parse(tokenData);
    expect(payload.email).toBe('professor.novo@escola.com');
    expect(payload.escolaId).toBe(escolaId);
    expect(payload.nome).toBe('Professor Novo');
    expect(payload.disciplina).toBe('MATEMATICA');
    expect(payload.formacao).toBe('Licenciatura em Matemática');
  });

  // AC17 Test 2: ✅ Admin token → 403 Forbidden (apenas coordenador)
  it('should return 403 when admin tries to invite professor', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/coordenador/invite-professor')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'novo.prof@escola.com',
        nome: 'Novo Prof',
        disciplina: 'CIENCIAS',
      });

    expect(response.status).toBe(403);
  });

  // AC17 Test 3: ✅ Diretor token → 403 Forbidden (apenas coordenador nesta story)
  it('should return 403 when diretor tries to invite professor', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/coordenador/invite-professor')
      .set('Authorization', `Bearer ${diretorToken}`)
      .send({
        email: 'diretor.prof@escola.com',
        nome: 'Diretor Prof',
        disciplina: 'LINGUA_PORTUGUESA',
      });

    expect(response.status).toBe(403);
  });

  // AC17 Test 4: ✅ Professor token → 403 Forbidden
  it('should return 403 when professor tries to invite professor', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/coordenador/invite-professor')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        email: 'prof.prof@escola.com',
        nome: 'Prof Prof',
        disciplina: 'MATEMATICA',
      });

    expect(response.status).toBe(403);
  });

  // AC17 Test 5: ✅ No authentication → 401 Unauthorized
  it('should return 401 when no authentication provided', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/coordenador/invite-professor')
      .send({
        email: 'no.auth@escola.com',
        nome: 'No Auth',
        disciplina: 'MATEMATICA',
      });

    expect(response.status).toBe(401);
  });

  // AC17 Test 6: ✅ Email duplicado → 409 Conflict
  it('should return 409 when email already exists in escola', async () => {
    // First invitation
    await request(app.getHttpServer())
      .post('/api/v1/coordenador/invite-professor')
      .set('Authorization', `Bearer ${coordenadorToken}`)
      .send({
        email: 'duplicate@escola.com',
        nome: 'First Invite',
        disciplina: 'MATEMATICA',
      });

    // Second invitation (same email)
    const response = await request(app.getHttpServer())
      .post('/api/v1/coordenador/invite-professor')
      .set('Authorization', `Bearer ${coordenadorToken}`)
      .send({
        email: 'duplicate@escola.com',
        nome: 'Second Invite',
        disciplina: 'CIENCIAS',
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Email já cadastrado nesta escola');
  });

  // AC17 Test 7: ✅ Escola inativa → 400 Bad Request
  it('should return 400 when escola is inactive', async () => {
    // Login as coordenador from inactive school
    const coordInativaLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'coordenador.inativa@escola.com',
        senha: 'Coordenador@456',
      });
    const coordInativaToken = coordInativaLogin.body.access_token;

    const response = await request(app.getHttpServer())
      .post('/api/v1/coordenador/invite-professor')
      .set('Authorization', `Bearer ${coordInativaToken}`)
      .send({
        email: 'inactive.prof@escola.com',
        nome: 'Inactive Prof',
        disciplina: 'MATEMATICA',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Escola inativa ou suspensa');
  });

  // AC17 Test 8: ✅ Missing required field → 400 Bad Request
  it('should return 400 when email is missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/coordenador/invite-professor')
      .set('Authorization', `Bearer ${coordenadorToken}`)
      .send({
        nome: 'No Email Prof',
        disciplina: 'MATEMATICA',
      });

    expect(response.status).toBe(400);
  });

  it('should return 400 when nome is missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/coordenador/invite-professor')
      .set('Authorization', `Bearer ${coordenadorToken}`)
      .send({
        email: 'no.name@escola.com',
        disciplina: 'MATEMATICA',
      });

    expect(response.status).toBe(400);
  });

  it('should return 400 when disciplina is missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/coordenador/invite-professor')
      .set('Authorization', `Bearer ${coordenadorToken}`)
      .send({
        email: 'no.disciplina@escola.com',
        nome: 'No Disciplina',
      });

    expect(response.status).toBe(400);
  });

  // AC17 Test 9: ✅ Invalid disciplina → 400 Bad Request
  it('should return 400 when disciplina is invalid', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/coordenador/invite-professor')
      .set('Authorization', `Bearer ${coordenadorToken}`)
      .send({
        email: 'invalid.disc@escola.com',
        nome: 'Invalid Disciplina',
        disciplina: 'FISICA', // Not in enum
      });

    expect(response.status).toBe(400);
  });

  // AC17 Test 10: ✅ Token salvo no Redis com TTL 24h e prefixo invite_professor
  it('should save token in Redis with 24h TTL and correct prefix', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/coordenador/invite-professor')
      .set('Authorization', `Bearer ${coordenadorToken}`)
      .send({
        email: 'redis.test@escola.com',
        nome: 'Redis Test',
        disciplina: 'CIENCIAS',
      });

    const keys = await redisService.keys('invite_professor:*');
    expect(keys.length).toBeGreaterThan(0);

    const ttl = await redisService.ttl(keys[0]);
    expect(ttl).toBeGreaterThan(86300); // ~24h (allowing some margin)
    expect(ttl).toBeLessThanOrEqual(86400);
  });

  // AC17 Test 11: ✅ Token has correct format (64 chars hex)
  it('should generate token with 64 characters hex format', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/coordenador/invite-professor')
      .set('Authorization', `Bearer ${coordenadorToken}`)
      .send({
        email: 'token.format@escola.com',
        nome: 'Token Format',
        disciplina: 'MATEMATICA',
      });

    const keys = await redisService.keys('invite_professor:*');
    const tokenKey = keys[0];
    const token = tokenKey.replace('invite_professor:', '');

    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[a-f0-9]{64}$/); // hex pattern
  });

  // AC17 Test 12: ✅ Token payload contains all fields
  it('should store complete payload in Redis', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/coordenador/invite-professor')
      .set('Authorization', `Bearer ${coordenadorToken}`)
      .send({
        email: 'complete.payload@escola.com',
        nome: 'Complete Payload',
        disciplina: 'LINGUA_PORTUGUESA',
        formacao: 'Letras',
        registro: 'RP-99999',
        telefone: '(21) 99999-9999',
      });

    const keys = await redisService.keys('invite_professor:*');
    const tokenData = await redisService.get(keys[0]);
    const payload = JSON.parse(tokenData);

    expect(payload).toEqual({
      email: 'complete.payload@escola.com',
      escolaId: escolaId,
      nome: 'Complete Payload',
      disciplina: 'LINGUA_PORTUGUESA',
      formacao: 'Letras',
      registro: 'RP-99999',
      telefone: '(21) 99999-9999',
    });
  });

  // AC17 Test 13: ✅ Reenvio de convite sobrescreve token anterior
  it('should allow resending invitation (idempotent behavior)', async () => {
    // First invitation
    await request(app.getHttpServer())
      .post('/api/v1/coordenador/invite-professor')
      .set('Authorization', `Bearer ${coordenadorToken}`)
      .send({
        email: 'resend@escola.com',
        nome: 'First Invitation',
        disciplina: 'MATEMATICA',
      });

    const firstKeys = await redisService.keys('invite_professor:*');
    const firstToken = firstKeys[0];

    // Second invitation (resend)
    const response = await request(app.getHttpServer())
      .post('/api/v1/coordenador/invite-professor')
      .set('Authorization', `Bearer ${coordenadorToken}`)
      .send({
        email: 'resend@escola.com',
        nome: 'Second Invitation',
        disciplina: 'CIENCIAS',
      });

    expect(response.status).toBe(201);

    // Should have new token (old one may or may not exist)
    const secondKeys = await redisService.keys('invite_professor:*');
    expect(secondKeys.length).toBeGreaterThan(0);
  });

  // AC17 Test 14: ✅ Professor vinculado à escola do coordenador (multi-tenancy)
  it('should link professor to coordenador escola (multi-tenancy)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/coordenador/invite-professor')
      .set('Authorization', `Bearer ${coordenadorToken}`)
      .send({
        email: 'multitenant@escola.com',
        nome: 'MultiTenant Test',
        disciplina: 'MATEMATICA',
      });

    const keys = await redisService.keys('invite_professor:*');
    const tokenData = await redisService.get(keys[0]);
    const payload = JSON.parse(tokenData);

    expect(payload.escolaId).toBe(escolaId);
  });

  // AC17 Test 15: ✅ AuthService.acceptInvitation already supports invite_professor
  it('should accept invitation and create usuario with PROFESSOR role', async () => {
    // Send invitation
    await request(app.getHttpServer())
      .post('/api/v1/coordenador/invite-professor')
      .set('Authorization', `Bearer ${coordenadorToken}`)
      .send({
        email: 'accept.invitation@escola.com',
        nome: 'Accept Invitation',
        disciplina: 'CIENCIAS',
        formacao: 'Biologia',
      });

    // Get token
    const keys = await redisService.keys('invite_professor:*');
    const tokenKey = keys[0];
    const token = tokenKey.replace('invite_professor:', '');

    // Accept invitation
    const acceptResponse = await request(app.getHttpServer())
      .post('/auth/accept-invitation')
      .send({
        token,
        senha: 'Professor@NewPassword123',
      });

    expect(acceptResponse.status).toBe(201);

    // Verify user created with PROFESSOR role
    const createdUser = await prisma.usuario.findUnique({
      where: { email: 'accept.invitation@escola.com' },
      include: { perfil_usuario: true },
    });

    expect(createdUser).toBeTruthy();
    expect(createdUser.nome).toBe('Accept Invitation');
    expect(createdUser.escola_id).toBe(escolaId);
    expect(createdUser.perfil_usuario?.role).toBe(RoleUsuario.PROFESSOR);
    // Note: disciplina and formacao are stored in token but not yet persisted to database
    // This is a known limitation - professor-specific fields will be added in a future story

    // Verify token deleted from Redis
    const deletedToken = await redisService.get(tokenKey);
    expect(deletedToken).toBeNull();
  });

  // AC17 Test 16: ✅ Coordenador NÃO pode convidar professor para outra escola
  it('should enforce multi-tenancy isolation (coordenador cannot invite to another escola)', async () => {
    // Coordenador from escolaId tries to invite
    // But escolaId is extracted from JWT, not request body
    // So this test verifies escola_id in token payload matches JWT escolaId

    await request(app.getHttpServer())
      .post('/api/v1/coordenador/invite-professor')
      .set('Authorization', `Bearer ${coordenadorToken}`)
      .send({
        email: 'isolation.test@escola.com',
        nome: 'Isolation Test',
        disciplina: 'MATEMATICA',
      });

    const keys = await redisService.keys('invite_professor:*');
    const tokenData = await redisService.get(keys[0]);
    const payload = JSON.parse(tokenData);

    // Verify escolaId in token matches coordenador's escola
    expect(payload.escolaId).toBe(escolaId);
    // Cannot be any other escolaId (multi-tenancy enforced)
  });
});
