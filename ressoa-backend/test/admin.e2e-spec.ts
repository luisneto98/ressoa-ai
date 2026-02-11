import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RoleUsuario } from '@prisma/client';

describe('Admin Endpoints (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let professorToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get(PrismaService);

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/admin/schools', () => {
    const validEscolaDto = {
      nome: 'Escola Teste XYZ',
      cnpj: '98.765.432/0001-10',
      email_contato: 'teste@escolaxyz.com',
      telefone: '(21) 91234-5678',
    };

    it('should create a new school successfully (admin)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/schools')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validEscolaDto);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        nome: validEscolaDto.nome,
        cnpj: validEscolaDto.cnpj,
        email_contato: validEscolaDto.email_contato,
        telefone: validEscolaDto.telefone,
        created_at: expect.any(String),
      });
    });

    it('should return 409 if CNPJ already exists', async () => {
      // Tentar criar escola duplicada
      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/schools')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validEscolaDto);

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('CNPJ já cadastrado');
    });

    it('should return 403 if user is not ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/schools')
        .set('Authorization', `Bearer ${professorToken}`)
        .send({
          nome: 'Escola Não Autorizada',
          cnpj: '11.111.111/0001-11',
          email_contato: 'nao@autorizada.com',
        });

      expect(response.status).toBe(403);
    });

    it('should return 401 if no token provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/schools')
        .send(validEscolaDto);

      expect(response.status).toBe(401);
    });

    it('should return 400 if CNPJ format is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/schools')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validEscolaDto,
          cnpj: '12345678000190', // Sem formatação
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('formato');
    });
  });

  describe('POST /api/v1/admin/users', () => {
    let testEscolaId: string;

    beforeAll(async () => {
      // Criar ou buscar escola de teste (upsert para evitar duplicate key)
      const escola = await prisma.escola.upsert({
        where: { cnpj: '11.222.333/0001-44' },
        update: {},
        create: {
          nome: 'Escola Teste Usuários',
          cnpj: '11.222.333/0001-44',
          email_contato: 'usuarios@teste.com',
        },
      });
      testEscolaId = escola.id;
    });

    const validUsuarioDto = {
      email: 'novoprofessor@teste.com',
      senha: 'Senha@123',
      nome: 'Novo Professor Teste',
      escola_id: '', // Preenchido no teste
      role: RoleUsuario.PROFESSOR,
    };

    it('should create a new user successfully (admin)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validUsuarioDto,
          escola_id: testEscolaId,
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        email: validUsuarioDto.email,
        nome: validUsuarioDto.nome,
        escola_id: testEscolaId,
        role: RoleUsuario.PROFESSOR,
      });
      expect(response.body.senha).toBeUndefined(); // NUNCA retornar senha
      expect(response.body.senha_hash).toBeUndefined(); // NUNCA retornar senha_hash
    });

    it('should return 404 if escola_id does not exist', async () => {
      const fakeUUID = '00000000-0000-0000-0000-000000000000';
      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validUsuarioDto,
          email: 'outro@teste.com',
          escola_id: fakeUUID,
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Escola não encontrada');
    });

    it('should return 409 if email already exists in school', async () => {
      // Tentar criar usuário duplicado
      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validUsuarioDto,
          escola_id: testEscolaId,
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('Email já cadastrado');
    });

    it('should return 400 if trying to create ADMIN user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validUsuarioDto,
          email: 'fraudeadmin@teste.com',
          escola_id: testEscolaId,
          role: RoleUsuario.ADMIN,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('ADMIN via API');
    });

    it('should return 403 if user is not ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${professorToken}`)
        .send({
          ...validUsuarioDto,
          email: 'outro2@teste.com',
          escola_id: testEscolaId,
        });

      expect(response.status).toBe(403);
    });

    it('should return 400 if password does not meet requirements', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validUsuarioDto,
          email: 'senhafraca@teste.com',
          senha: 'senha', // Sem maiúscula e número
          escola_id: testEscolaId,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Senha');
    });
  });

  describe('Admin Flow (Integration)', () => {
    it('should complete full admin flow successfully', async () => {
      // 1. Admin cria escola
      const escolaResponse = await request(app.getHttpServer())
        .post('/api/v1/admin/schools')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Escola Fluxo Completo',
          cnpj: '55.666.777/0001-88',
          email_contato: 'fluxo@completo.com',
        });

      expect(escolaResponse.status).toBe(201);
      const escolaId = escolaResponse.body.id;

      // 2. Admin cria professor para a escola
      const userResponse = await request(app.getHttpServer())
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'professor@fluxo.com',
          senha: 'Senha@456',
          nome: 'Professor Fluxo',
          escola_id: escolaId,
          role: RoleUsuario.PROFESSOR,
        });

      expect(userResponse.status).toBe(201);

      // 3. Professor faz login com credenciais criadas
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'professor@fluxo.com',
          senha: 'Senha@456',
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.access_token).toBeDefined();

      const newProfessorToken = loginResponse.body.access_token;

      // 4. Professor tenta acessar admin endpoints → 403
      const forbiddenResponse = await request(app.getHttpServer())
        .post('/api/v1/admin/schools')
        .set('Authorization', `Bearer ${newProfessorToken}`)
        .send({
          nome: 'Escola Não Autorizada',
          cnpj: '99.888.777/0001-66',
          email_contato: 'nao@autorizada.com',
        });

      expect(forbiddenResponse.status).toBe(403);
    });
  });
});
