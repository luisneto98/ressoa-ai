import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';
import { RoleUsuario } from '@prisma/client';

describe('POST /api/v1/diretor/invite-coordenador (Story 13.4)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redisService: RedisService;
  let diretorToken: string;
  let adminToken: string;
  let professorToken: string;
  let testEscolaId: string;
  let testDiretorId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get(PrismaService);
    redisService = app.get(RedisService);

    // Criar escola de teste
    const escola = await prisma.escola.create({
      data: {
        nome: 'Escola Teste Story 13.4',
        cnpj: '12345678000134',
        tipo: 'particular',
        contato_principal: 'Contato Teste',
        email_contato: 'story134@teste.com',
        telefone: '11999999999',
        plano: 'basico',
        limite_horas_mes: 400,
        status: 'ativa',
        data_ativacao: new Date(),
      },
    });

    testEscolaId = escola.id;

    // Criar diretor de teste
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash('Diretor@123', 10);

    const diretor = await prisma.usuario.create({
      data: {
        email: 'diretor.teste@escola.com',
        nome: 'Diretor Teste',
        senha_hash: hashedPassword,
        escola_id: testEscolaId,
        perfilUsuario: {
          create: {
            role: RoleUsuario.DIRETOR,
          },
        },
      },
    });

    testDiretorId = diretor.id;

    // Login como diretor
    const diretorLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'diretor.teste@escola.com',
        senha: 'Diretor@123',
      });

    if (diretorLogin.status !== 200) {
      throw new Error(
        `Diretor login failed: ${diretorLogin.status} - ${JSON.stringify(diretorLogin.body)}`,
      );
    }

    diretorToken = diretorLogin.body.access_token;

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

    // Login como professor
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
    // Cleanup: deletar usuários e escola de teste
    await prisma.perfilUsuario.deleteMany({
      where: { usuario: { escola_id: testEscolaId } },
    });
    await prisma.usuario.deleteMany({
      where: { escola_id: testEscolaId },
    });
    await prisma.escola.delete({
      where: { id: testEscolaId },
    });

    // Cleanup: deletar tokens do Redis
    const tokenKeys = await redisService.keys('invite_coordenador:*');
    for (const key of tokenKeys) {
      await redisService.del(key);
    }

    await app.close();
  });

  beforeEach(async () => {
    // Cleanup: deletar coordenadores criados nos testes
    const coordenadoresIds = await prisma.usuario.findMany({
      where: {
        escola_id: testEscolaId,
        email: {
          in: [
            'coordenador.teste@escola.com.br',
            'coordenador.duplicado@escola.com',
            'reinvite@escola.com',
          ],
        },
      },
      select: { id: true },
    });

    await prisma.perfilUsuario.deleteMany({
      where: { usuario_id: { in: coordenadoresIds.map((u) => u.id) } },
    });

    await prisma.usuario.deleteMany({
      where: { id: { in: coordenadoresIds.map((u) => u.id) } },
    });

    // Cleanup: deletar tokens do Redis
    const tokenKeys = await redisService.keys('invite_coordenador:*');
    for (const key of tokenKeys) {
      await redisService.del(key);
    }
  });

  it('should send invitation with diretor token (201)', async () => {
    const dto = {
      email: 'coordenador.teste@escola.com.br',
      nome: 'Coordenador Teste',
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-coordenador')
      .set('Authorization', `Bearer ${diretorToken}`)
      .send(dto)
      .expect(201);

    expect(response.body).toHaveProperty('message', 'Convite enviado com sucesso');

    // Verify Redis token stored
    const tokenKeys = await redisService.keys('invite_coordenador:*');
    expect(tokenKeys.length).toBeGreaterThan(0);

    // Verify token format (64 chars hex)
    const token = tokenKeys[0].split(':')[1];
    expect(token).toMatch(/^[a-f0-9]{64}$/);

    // Verify token data
    const tokenData = await redisService.get(tokenKeys[0]);
    const parsed = JSON.parse(tokenData!);
    expect(parsed).toMatchObject({
      email: dto.email.toLowerCase(),
      escolaId: testEscolaId,
      nome: dto.nome,
    });

    // Verify TTL (~24h)
    const ttl = await redisService.ttl(tokenKeys[0]);
    expect(ttl).toBeGreaterThan(86300); // 24h - 100s margin
  });

  it('should reject with admin token (403)', async () => {
    const dto = {
      email: 'coordenador.teste@escola.com.br',
      nome: 'Coordenador Teste',
    };

    await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-coordenador')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(dto)
      .expect(403);
  });

  it('should reject with professor token (403)', async () => {
    const dto = {
      email: 'coordenador.teste@escola.com.br',
      nome: 'Coordenador Teste',
    };

    await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-coordenador')
      .set('Authorization', `Bearer ${professorToken}`)
      .send(dto)
      .expect(403);
  });

  it('should reject without authentication (401)', async () => {
    const dto = {
      email: 'coordenador.teste@escola.com.br',
      nome: 'Coordenador Teste',
    };

    await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-coordenador')
      .send(dto)
      .expect(401);
  });

  it('should reject duplicate email (409)', async () => {
    // Create existing coordenador with same email
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash('Coord@123', 10);

    await prisma.usuario.create({
      data: {
        email: 'coordenador.duplicado@escola.com',
        nome: 'Coordenador Existente',
        senha_hash: hashedPassword,
        escola_id: testEscolaId,
        perfilUsuario: {
          create: {
            role: RoleUsuario.COORDENADOR,
          },
        },
      },
    });

    const dto = {
      email: 'coordenador.duplicado@escola.com',
      nome: 'Coordenador Novo',
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-coordenador')
      .set('Authorization', `Bearer ${diretorToken}`)
      .send(dto)
      .expect(409);

    expect(response.body).toHaveProperty('message', 'Email já cadastrado nesta escola');
  });

  it('should reject if escola is inactive (400)', async () => {
    // Update escola status to 'inativa'
    await prisma.escola.update({
      where: { id: testEscolaId },
      data: { status: 'inativa' },
    });

    const dto = {
      email: 'coordenador.teste@escola.com.br',
      nome: 'Coordenador Teste',
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-coordenador')
      .set('Authorization', `Bearer ${diretorToken}`)
      .send(dto)
      .expect(400);

    expect(response.body).toHaveProperty('message', 'Escola inativa ou suspensa');

    // Restore escola status
    await prisma.escola.update({
      where: { id: testEscolaId },
      data: { status: 'ativa' },
    });
  });

  it('should reject missing required fields (400)', async () => {
    const dto = {
      email: 'coordenador.teste@escola.com.br',
      // nome missing
    };

    await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-coordenador')
      .set('Authorization', `Bearer ${diretorToken}`)
      .send(dto)
      .expect(400);
  });

  it('should allow resending invitation (overwrites previous token)', async () => {
    const dto = {
      email: 'reinvite@escola.com',
      nome: 'Coordenador Reenvio',
    };

    // First invitation
    await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-coordenador')
      .set('Authorization', `Bearer ${diretorToken}`)
      .send(dto)
      .expect(201);

    const firstTokenKeys = await redisService.keys('invite_coordenador:*');
    expect(firstTokenKeys.length).toBe(1);
    const firstToken = firstTokenKeys[0].split(':')[1];

    // Wait 100ms to ensure different token
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Second invitation (same email)
    await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-coordenador')
      .set('Authorization', `Bearer ${diretorToken}`)
      .send(dto)
      .expect(201);

    const secondTokenKeys = await redisService.keys('invite_coordenador:*');
    expect(secondTokenKeys.length).toBe(1);
    const secondToken = secondTokenKeys[0].split(':')[1];

    // Tokens should be different (new token generated)
    expect(firstToken).not.toBe(secondToken);
  });

  it('should enforce multi-tenancy (coordenador linked to diretor escola)', async () => {
    const dto = {
      email: 'coordenador.teste@escola.com.br',
      nome: 'Coordenador Teste',
    };

    await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-coordenador')
      .set('Authorization', `Bearer ${diretorToken}`)
      .send(dto)
      .expect(201);

    const tokenKeys = await redisService.keys('invite_coordenador:*');
    const tokenData = await redisService.get(tokenKeys[0]);
    const parsed = JSON.parse(tokenData!);

    // Verify escolaId matches diretor's escola
    expect(parsed.escolaId).toBe(testEscolaId);
  });

  it('should normalize email to lowercase', async () => {
    const dto = {
      email: 'COORDENADOR.UPPERCASE@ESCOLA.COM',
      nome: 'Coordenador Teste',
    };

    await request(app.getHttpServer())
      .post('/api/v1/diretor/invite-coordenador')
      .set('Authorization', `Bearer ${diretorToken}`)
      .send(dto)
      .expect(201);

    const tokenKeys = await redisService.keys('invite_coordenador:*');
    const tokenData = await redisService.get(tokenKeys[0]);
    const parsed = JSON.parse(tokenData!);

    // Email should be normalized to lowercase
    expect(parsed.email).toBe('coordenador.uppercase@escola.com');
  });
});
