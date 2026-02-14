import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';
import { RoleUsuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('POST /api/v1/diretor/invite-professor (Story 13.5)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redisService: RedisService;
  let diretorToken: string;
  let adminToken: string;
  let coordenadorToken: string;
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

    // Create test school
    const escola = await prisma.escola.create({
      data: {
        nome: 'Escola Teste Story 13.5',
        cnpj: '12345678000135',
        tipo: 'particular',
        contato_principal: 'Contato Teste',
        email_contato: 'story135@teste.com',
        telefone: '11999999998',
        plano: 'basico',
        limite_horas_mes: 400,
        status: 'ativa',
        data_ativacao: new Date(),
      },
    });

    testEscolaId = escola.id;

    // Create diretor test user
    const hashedPassword = await bcrypt.hash('Diretor@123', 10);

    await prisma.usuario.create({
      data: {
        email: 'diretor.story135@escola.com',
        nome: 'Diretor Story 135',
        senha_hash: hashedPassword,
        escola: {
          connect: { id: testEscolaId },
        },
        perfil_usuario: {
          create: {
            role: RoleUsuario.DIRETOR,
          },
        },
      },
    });

    // Create coordenador test user
    const coordenadorHash = await bcrypt.hash('Coordenador@123', 10);
    await prisma.usuario.create({
      data: {
        email: 'coordenador.story135@escola.com',
        nome: 'Coordenador Story 135',
        senha_hash: coordenadorHash,
        escola: {
          connect: { id: testEscolaId },
        },
        perfil_usuario: {
          create: {
            role: RoleUsuario.COORDENADOR,
          },
        },
      },
    });

    // Login as diretor
    const diretorLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'diretor.story135@escola.com',
        senha: 'Diretor@123',
      });

    if (diretorLogin.status !== 200) {
      throw new Error(
        `Diretor login failed: ${diretorLogin.status} - ${JSON.stringify(diretorLogin.body)}`,
      );
    }

    diretorToken = diretorLogin.body.access_token;

    // Login as coordenador
    const coordenadorLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'coordenador.story135@escola.com',
        senha: 'Coordenador@123',
      });

    if (coordenadorLogin.status !== 200) {
      throw new Error(
        `Coordenador login failed: ${coordenadorLogin.status}`,
      );
    }

    coordenadorToken = coordenadorLogin.body.access_token;

    // Login as admin
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

    // Login as professor
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
    // Cleanup: delete test users and school
    await prisma.perfilUsuario.deleteMany({
      where: { usuario: { escola_id: testEscolaId } },
    });
    await prisma.usuario.deleteMany({
      where: { escola_id: testEscolaId },
    });
    await prisma.escola.delete({
      where: { id: testEscolaId },
    });

    // Cleanup: delete Redis tokens
    const tokenKeys = await redisService.keys('invite_professor:*');
    for (const key of tokenKeys) {
      await redisService.del(key);
    }

    await app.close();
  });

  beforeEach(async () => {
    // Cleanup: delete professors created in tests
    const professoresIds = await prisma.usuario.findMany({
      where: {
        escola_id: testEscolaId,
        email: {
          in: [
            'professor.teste@escola.com.br',
            'professor.duplicado@escola.com',
            'professor.reinvite@escola.com',
            'professor.uppercase@escola.com',
          ],
        },
      },
      select: { id: true },
    });

    await prisma.perfilUsuario.deleteMany({
      where: { usuario_id: { in: professoresIds.map((u) => u.id) } },
    });

    await prisma.usuario.deleteMany({
      where: { id: { in: professoresIds.map((u) => u.id) } },
    });

    // Cleanup: delete Redis tokens
    const tokenKeys = await redisService.keys('invite_professor:*');
    for (const key of tokenKeys) {
      await redisService.del(key);
    }
  });

  it('should send invitation with diretor token (201)', async () => {
    const dto = {
      email: 'professor.teste@escola.com.br',
      nome: 'Professor Teste',
      disciplina: 'MATEMATICA',
      formacao: 'Licenciatura em Matemática',
      registro: 'RP 12345-SP',
      telefone: '(11) 98765-4321',
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-professor')
      .set('Authorization', `Bearer ${diretorToken}`)
      .send(dto)
      .expect(201);

    expect(response.body).toHaveProperty(
      'message',
      'Convite enviado com sucesso',
    );

    // Verify Redis token stored
    const tokenKeys = await redisService.keys('invite_professor:*');
    expect(tokenKeys.length).toBeGreaterThan(0);

    // Verify token format (64 chars hex)
    const token = tokenKeys[0].split(':')[1];
    expect(token).toMatch(/^[a-f0-9]{64}$/);

    // Verify token data includes all fields
    const tokenData = await redisService.get(tokenKeys[0]);
    const parsed = JSON.parse(tokenData!);
    expect(parsed).toMatchObject({
      email: dto.email.toLowerCase(),
      escolaId: testEscolaId,
      nome: dto.nome,
      disciplina: dto.disciplina,
      formacao: dto.formacao,
      registro: dto.registro,
      telefone: dto.telefone,
    });

    // Verify TTL (~24h)
    const ttl = await redisService.ttl(tokenKeys[0]);
    expect(ttl).toBeGreaterThan(86300); // 24h - 100s margin
  });

  it('should send invitation with only required fields (201)', async () => {
    const dto = {
      email: 'professor.teste@escola.com.br',
      nome: 'Professor Teste',
      disciplina: 'LINGUA_PORTUGUESA',
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-professor')
      .set('Authorization', `Bearer ${diretorToken}`)
      .send(dto)
      .expect(201);

    expect(response.body).toHaveProperty(
      'message',
      'Convite enviado com sucesso',
    );

    // Verify token data does NOT include optional fields
    const tokenKeys = await redisService.keys('invite_professor:*');
    const tokenData = await redisService.get(tokenKeys[0]);
    const parsed = JSON.parse(tokenData!);
    expect(parsed).toMatchObject({
      email: dto.email.toLowerCase(),
      escolaId: testEscolaId,
      nome: dto.nome,
      disciplina: dto.disciplina,
    });
    expect(parsed.formacao).toBeUndefined();
    expect(parsed.registro).toBeUndefined();
    expect(parsed.telefone).toBeUndefined();
  });

  it('should reject with admin token (403)', async () => {
    const dto = {
      email: 'professor.teste@escola.com.br',
      nome: 'Professor Teste',
      disciplina: 'MATEMATICA',
    };

    await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-professor')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(dto)
      .expect(403);
  });

  it('should reject with coordenador token (403)', async () => {
    const dto = {
      email: 'professor.teste@escola.com.br',
      nome: 'Professor Teste',
      disciplina: 'MATEMATICA',
    };

    await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-professor')
      .set('Authorization', `Bearer ${coordenadorToken}`)
      .send(dto)
      .expect(403);
  });

  it('should reject with professor token (403)', async () => {
    const dto = {
      email: 'professor.teste@escola.com.br',
      nome: 'Professor Teste',
      disciplina: 'MATEMATICA',
    };

    await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-professor')
      .set('Authorization', `Bearer ${professorToken}`)
      .send(dto)
      .expect(403);
  });

  it('should reject without authentication (401)', async () => {
    const dto = {
      email: 'professor.teste@escola.com.br',
      nome: 'Professor Teste',
      disciplina: 'MATEMATICA',
    };

    await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-professor')
      .send(dto)
      .expect(401);
  });

  it('should reject duplicate email (409)', async () => {
    // Create existing professor with same email
    const hashedPassword = await bcrypt.hash('Prof@123', 10);

    await prisma.usuario.create({
      data: {
        email: 'professor.duplicado@escola.com',
        nome: 'Professor Existente',
        senha_hash: hashedPassword,
        escola: {
          connect: { id: testEscolaId },
        },
        perfil_usuario: {
          create: {
            role: RoleUsuario.PROFESSOR,
          },
        },
      },
    });

    const dto = {
      email: 'professor.duplicado@escola.com',
      nome: 'Professor Novo',
      disciplina: 'MATEMATICA',
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-professor')
      .set('Authorization', `Bearer ${diretorToken}`)
      .send(dto)
      .expect(409);

    expect(response.body).toHaveProperty(
      'message',
      'Email já cadastrado nesta escola',
    );
  });

  it('should reject if escola is inactive (400)', async () => {
    // Update escola status to 'inativa'
    await prisma.escola.update({
      where: { id: testEscolaId },
      data: { status: 'inativa' },
    });

    const dto = {
      email: 'professor.teste@escola.com.br',
      nome: 'Professor Teste',
      disciplina: 'MATEMATICA',
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-professor')
      .set('Authorization', `Bearer ${diretorToken}`)
      .send(dto)
      .expect(400);

    expect(response.body).toHaveProperty(
      'message',
      'Escola inativa ou suspensa',
    );

    // Restore escola status
    await prisma.escola.update({
      where: { id: testEscolaId },
      data: { status: 'ativa' },
    });
  });

  it('should reject missing required field: email (400)', async () => {
    const dto = {
      // email missing
      nome: 'Professor Teste',
      disciplina: 'MATEMATICA',
    };

    await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-professor')
      .set('Authorization', `Bearer ${diretorToken}`)
      .send(dto)
      .expect(400);
  });

  it('should reject missing required field: nome (400)', async () => {
    const dto = {
      email: 'professor.teste@escola.com.br',
      // nome missing
      disciplina: 'MATEMATICA',
    };

    await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-professor')
      .set('Authorization', `Bearer ${diretorToken}`)
      .send(dto)
      .expect(400);
  });

  it('should reject missing required field: disciplina (400)', async () => {
    const dto = {
      email: 'professor.teste@escola.com.br',
      nome: 'Professor Teste',
      // disciplina missing
    };

    await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-professor')
      .set('Authorization', `Bearer ${diretorToken}`)
      .send(dto)
      .expect(400);
  });

  it('should reject invalid disciplina (400)', async () => {
    const dto = {
      email: 'professor.teste@escola.com.br',
      nome: 'Professor Teste',
      disciplina: 'HISTORIA', // Invalid disciplina
    };

    await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-professor')
      .set('Authorization', `Bearer ${diretorToken}`)
      .send(dto)
      .expect(400);
  });

  // MEDIUM-2 FIX: Add test for invalid email format
  it('should reject invalid email format (400)', async () => {
    const dto = {
      email: 'invalid-email-format',
      nome: 'Professor Teste',
      disciplina: 'MATEMATICA',
    };

    await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-professor')
      .set('Authorization', `Bearer ${diretorToken}`)
      .send(dto)
      .expect(400);
  });

  // MEDIUM-3 FIX: Add test for nome too short
  it('should reject nome too short (400)', async () => {
    const dto = {
      email: 'professor.teste@escola.com.br',
      nome: 'Jo', // 2 chars - below minimum
      disciplina: 'MATEMATICA',
    };

    await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-professor')
      .set('Authorization', `Bearer ${diretorToken}`)
      .send(dto)
      .expect(400);
  });

  // MEDIUM-1 FIX: Add test for invalid telefone format
  it('should reject invalid telefone format (400)', async () => {
    const dto = {
      email: 'professor.teste@escola.com.br',
      nome: 'Professor Teste',
      disciplina: 'MATEMATICA',
      telefone: 'abc123', // Invalid format
    };

    await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-professor')
      .set('Authorization', `Bearer ${diretorToken}`)
      .send(dto)
      .expect(400);
  });

  it('should allow resending invitation (overwrites previous token)', async () => {
    const dto = {
      email: 'professor.reinvite@escola.com',
      nome: 'Professor Reenvio',
      disciplina: 'CIENCIAS',
    };

    // First invitation
    await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-professor')
      .set('Authorization', `Bearer ${diretorToken}`)
      .send(dto)
      .expect(201);

    const firstTokenKeys = await redisService.keys('invite_professor:*');
    expect(firstTokenKeys.length).toBe(1);
    const firstToken = firstTokenKeys[0].split(':')[1];

    // LOW-2 FIX: Extract magic number to constant
    const TOKEN_GENERATION_DELAY_MS = 100;
    await new Promise((resolve) =>
      setTimeout(resolve, TOKEN_GENERATION_DELAY_MS),
    );

    // Second invitation (same email)
    await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-professor')
      .set('Authorization', `Bearer ${diretorToken}`)
      .send(dto)
      .expect(201);

    const secondTokenKeys = await redisService.keys('invite_professor:*');
    expect(secondTokenKeys.length).toBe(1);
    const secondToken = secondTokenKeys[0].split(':')[1];

    // Tokens should be different (new token generated)
    expect(firstToken).not.toBe(secondToken);
  });

  it('should enforce multi-tenancy (professor linked to diretor escola)', async () => {
    const dto = {
      email: 'professor.teste@escola.com.br',
      nome: 'Professor Teste',
      disciplina: 'MATEMATICA',
    };

    await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-professor')
      .set('Authorization', `Bearer ${diretorToken}`)
      .send(dto)
      .expect(201);

    const tokenKeys = await redisService.keys('invite_professor:*');
    const tokenData = await redisService.get(tokenKeys[0]);
    const parsed = JSON.parse(tokenData!);

    // Verify escolaId matches diretor's escola
    expect(parsed.escolaId).toBe(testEscolaId);
  });

  it('should normalize email to lowercase', async () => {
    const dto = {
      email: 'PROFESSOR.UPPERCASE@ESCOLA.COM',
      nome: 'Professor Teste',
      disciplina: 'MATEMATICA',
    };

    await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-professor')
      .set('Authorization', `Bearer ${diretorToken}`)
      .send(dto)
      .expect(201);

    const tokenKeys = await redisService.keys('invite_professor:*');
    const tokenData = await redisService.get(tokenKeys[0]);
    const parsed = JSON.parse(tokenData!);

    // Email should be normalized to lowercase
    expect(parsed.email).toBe('professor.uppercase@escola.com');
  });

  it('should accept invitation and create PROFESSOR user', async () => {
    // Send invitation
    const inviteDto = {
      email: 'professor.accept@escola.com',
      nome: 'Professor Accept Test',
      disciplina: 'MATEMATICA',
      formacao: 'Licenciatura em Matemática',
    };

    await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-professor')
      .set('Authorization', `Bearer ${diretorToken}`)
      .send(inviteDto)
      .expect(201);

    // Get token from Redis
    const tokenKeys = await redisService.keys('invite_professor:*');
    const token = tokenKeys[0].split(':')[1];

    // Accept invitation
    const acceptDto = {
      token,
      senha: 'Professor@123',
    };

    const response = await request(app.getHttpServer())
      .post('/auth/accept-invitation')
      .send(acceptDto)
      .expect(201);

    expect(response.body).toHaveProperty(
      'message',
      'Convite aceito com sucesso',
    );

    // Verify user created with role PROFESSOR
    const user = await prisma.usuario.findFirst({
      where: {
        email: inviteDto.email.toLowerCase(),
        escola_id: testEscolaId,
      },
      include: { perfil_usuario: true },
    });

    expect(user).not.toBeNull();
    expect(user?.perfil_usuario?.role).toBe(RoleUsuario.PROFESSOR);
    expect(user?.escola_id).toBe(testEscolaId);

    // Verify token deleted (one-time use)
    const tokenDataAfter = await redisService.get(tokenKeys[0]);
    expect(tokenDataAfter).toBeNull();

    // Cleanup: delete created user
    if (user) {
      await prisma.perfilUsuario.deleteMany({
        where: { usuario_id: user.id },
      });
      await prisma.usuario.delete({
        where: { id: user.id },
      });
    }
  });
});
