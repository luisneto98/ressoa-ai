import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Additional E2E Tests for Story 11.2: Edge Case - Explicit null contexto_pedagogico
 * Addresses MEDIUM-3 finding from code review
 */
describe('TurmasController (E2E) - Explicit null contexto_pedagogico', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let coordenadorToken: string;
  let escolaId: string;
  let professorId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);

    await setupTestData();
  });

  afterAll(async () => {
    await prisma.turma.deleteMany({ where: { escola_id: escolaId } });
    await prisma.perfilUsuario.deleteMany({
      where: { usuario_id: professorId },
    });
    await prisma.usuario.deleteMany({ where: { escola_id: escolaId } });
    await prisma.escola.delete({ where: { id: escolaId } });
    await prisma.$disconnect();
    await app.close();
  });

  /**
   * Setup test data: escola, coordenador, professor
   */
  async function setupTestData() {
    const escola = await prisma.escola.create({
      data: {
        nome: 'Escola Edge Case Null',
        cnpj: '11122233344455',
        email_contato: 'null-edge@escola.com',
      },
    });
    escolaId = escola.id;

    const password = 'TestPassword123!';
    const senhaHash = await bcrypt.hash(password, 10);

    const coordenador = await prisma.usuario.create({
      data: {
        nome: 'Coord Null Test',
        email: 'coord-null@escola.com',
        senha_hash: senhaHash,
        escola_id: escolaId,
      },
    });

    await prisma.perfilUsuario.create({
      data: {
        usuario_id: coordenador.id,
        role: 'COORDENADOR',
      },
    });

    const professor = await prisma.usuario.create({
      data: {
        nome: 'Prof Null Test',
        email: 'prof-null@escola.com',
        senha_hash: senhaHash,
        escola_id: escolaId,
      },
    });
    professorId = professor.id;

    await prisma.perfilUsuario.create({
      data: {
        usuario_id: professorId,
        role: 'PROFESSOR',
      },
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'coord-null@escola.com',
        senha: password,
      });

    coordenadorToken = `Bearer ${loginResponse.body.accessToken}`;
  }

  it('should accept BNCC turma with explicit null contexto_pedagogico', async () => {
    const dto = {
      nome: 'Turma BNCC Null',
      disciplina: 'MATEMATICA',
      serie: 'SEXTO_ANO',
      tipo_ensino: 'FUNDAMENTAL',
      curriculo_tipo: 'BNCC',
      contexto_pedagogico: null, // ✅ Explicitly null for BNCC
      ano_letivo: 2026,
      turno: 'MATUTINO',
      professor_id: professorId,
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/turmas')
      .set('Authorization', coordenadorToken)
      .send(dto)
      .expect(201);

    expect(response.body.curriculo_tipo).toBe('BNCC');
    expect(response.body.contexto_pedagogico).toBeNull();
  });

  it('should reject CUSTOM turma with explicit null contexto_pedagogico', async () => {
    const dto = {
      nome: 'Turma CUSTOM Null',
      disciplina: 'CIENCIAS',
      serie: 'SETIMO_ANO',
      tipo_ensino: 'FUNDAMENTAL',
      curriculo_tipo: 'CUSTOM',
      contexto_pedagogico: null, // ❌ Invalid for CUSTOM
      ano_letivo: 2026,
      turno: 'VESPERTINO',
      professor_id: professorId,
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/turmas')
      .set('Authorization', coordenadorToken)
      .send(dto)
      .expect(400);

    const message = JSON.stringify(response.body.message);
    expect(message).toContain('contexto_pedagogico');
    expect(message).toContain('obrigatório');
  });
});
