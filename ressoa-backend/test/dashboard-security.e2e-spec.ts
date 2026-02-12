import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

// Ensure env vars are set for ConfigModule validation (CI-safe)
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://ressoa_user:ressoa_pwd@localhost:5432/ressoa_db?schema=public';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-secret-that-is-at-least-32-characters-long';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  'test-refresh-secret-at-least-32-characters-long';
process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/**
 * Dashboard Security E2E Tests
 *
 * **Story 7.5:** RBAC Guards & Privacy Enforcement
 *
 * **Test Coverage:**
 * - Coordenador permissions (4 tests: 2 allow, 2 deny)
 * - Diretor permissions (3 tests: 2 allow, 1 deny)
 * - Professor permissions (3 tests: 1 allow, 2 deny)
 *
 * **Critical Privacy Rule:**
 * Transcrições brutas são SEMPRE privadas ao professor.
 * Coordenadores e Diretores veem apenas métricas agregadas.
 */
describe('Dashboard Security (E2E)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let professorToken: string;
  let coordenadorToken: string;
  let diretorToken: string;
  let testEscolaId: string;
  let professorId: string;
  let outroProfessorId: string;
  let professorAulaId: string;
  let outroProfessorAulaId: string;
  const testUserIds: string[] = [];
  const testTurmaIds: string[] = [];
  const testAulaIds: string[] = [];

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

    prisma = app.get<PrismaService>(PrismaService);

    // Wait for services to initialize
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Create test escola
    const escola = await prisma.escola.upsert({
      where: { cnpj: '99999999000199' },
      update: {},
      create: {
        cnpj: '99999999000199',
        nome: 'Escola Teste Dashboard Security',
      },
    });
    testEscolaId = escola.id;

    // Create test users
    const senhaHash = await bcrypt.hash('SenhaSegura123!', 10);

    // Professor 1 (main test user)
    const professor = await prisma.usuario.upsert({
      where: {
        email_escola_id: {
          email: 'professor.dashboard.security@escola.com',
          escola_id: testEscolaId,
        },
      },
      update: {},
      create: {
        email: 'professor.dashboard.security@escola.com',
        nome: 'Professor Dashboard Security',
        senha_hash: senhaHash,
        escola_id: testEscolaId,
        perfil_usuario: {
          create: {
            role: 'PROFESSOR',
          },
        },
      },
    });
    professorId = professor.id;
    testUserIds.push(professor.id);

    // Professor 2 (outro professor para testar ownership)
    const outroProfessor = await prisma.usuario.upsert({
      where: {
        email_escola_id: {
          email: 'outro.professor.dashboard.security@escola.com',
          escola_id: testEscolaId,
        },
      },
      update: {},
      create: {
        email: 'outro.professor.dashboard.security@escola.com',
        nome: 'Outro Professor Dashboard Security',
        senha_hash: senhaHash,
        escola_id: testEscolaId,
        perfil_usuario: {
          create: {
            role: 'PROFESSOR',
          },
        },
      },
    });
    outroProfessorId = outroProfessor.id;
    testUserIds.push(outroProfessor.id);

    // Coordenador
    const coordenador = await prisma.usuario.upsert({
      where: {
        email_escola_id: {
          email: 'coordenador.dashboard.security@escola.com',
          escola_id: testEscolaId,
        },
      },
      update: {},
      create: {
        email: 'coordenador.dashboard.security@escola.com',
        nome: 'Coordenador Dashboard Security',
        senha_hash: senhaHash,
        escola_id: testEscolaId,
        perfil_usuario: {
          create: {
            role: 'COORDENADOR',
          },
        },
      },
    });
    testUserIds.push(coordenador.id);

    // Diretor
    const diretor = await prisma.usuario.upsert({
      where: {
        email_escola_id: {
          email: 'diretor.dashboard.security@escola.com',
          escola_id: testEscolaId,
        },
      },
      update: {},
      create: {
        email: 'diretor.dashboard.security@escola.com',
        nome: 'Diretor Dashboard Security',
        senha_hash: senhaHash,
        escola_id: testEscolaId,
        perfil_usuario: {
          create: {
            role: 'DIRETOR',
          },
        },
      },
    });
    testUserIds.push(diretor.id);

    // Create turma for professor
    const turma = await prisma.turma.create({
      data: {
        nome: '6A - Security Test',
        disciplina: 'MATEMATICA',
        serie: 'SEXTO_ANO',
        ano_letivo: 2026,
        escola_id: testEscolaId,
        professor_id: professorId,
      },
    });
    testTurmaIds.push(turma.id);

    // Create aula for professor
    const professorAula = await prisma.aula.create({
      data: {
        data: new Date('2026-02-10'),
        turma_id: turma.id,
        professor_id: professorId,
        escola_id: testEscolaId,
        status_processamento: 'ANALISADA',
        audio_url: 'test://professor-aula.mp3',
        transcricao_texto: 'Transcrição privada do professor',
      },
    });
    professorAulaId = professorAula.id;
    testAulaIds.push(professorAula.id);

    // Create análise for professor's aula
    await prisma.analise.create({
      data: {
        aula_id: professorAulaId,
        cobertura_json: { habilidades: [] },
        analise_qualitativa_json: {},
        relatorio_texto: 'Relatório privado do professor',
        exercicios_json: { questoes: [] },
        alertas_json: { alertas: [] },
        tempo_processamento_ms: 1000,
        custo_total_usd: 0.01,
        prompt_versoes_json: {},
        status: 'AGUARDANDO_REVISAO',
      },
    });

    // Create turma for outro professor
    const outraTurma = await prisma.turma.create({
      data: {
        nome: '6B - Security Test',
        disciplina: 'MATEMATICA',
        serie: 'SEXTO_ANO',
        ano_letivo: 2026,
        escola_id: testEscolaId,
        professor_id: outroProfessorId,
      },
    });
    testTurmaIds.push(outraTurma.id);

    // Create aula for outro professor
    const outroProfessorAula = await prisma.aula.create({
      data: {
        data: new Date('2026-02-10'),
        turma_id: outraTurma.id,
        professor_id: outroProfessorId,
        escola_id: testEscolaId,
        status_processamento: 'ANALISADA',
        audio_url: 'test://outro-professor-aula.mp3',
        transcricao_texto: 'Transcrição privada do outro professor',
      },
    });
    outroProfessorAulaId = outroProfessorAula.id;
    testAulaIds.push(outroProfessorAula.id);

    // Create análise for outro professor's aula
    await prisma.analise.create({
      data: {
        aula_id: outroProfessorAulaId,
        cobertura_json: { habilidades: [] },
        analise_qualitativa_json: {},
        relatorio_texto: 'Relatório privado do outro professor',
        exercicios_json: { questoes: [] },
        alertas_json: { alertas: [] },
        tempo_processamento_ms: 1000,
        custo_total_usd: 0.01,
        prompt_versoes_json: {},
        status: 'AGUARDANDO_REVISAO',
      },
    });

    // Login as each role
    const profLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'professor.dashboard.security@escola.com',
        senha: 'SenhaSegura123!',
      });
    professorToken = profLogin.body.accessToken;

    const coordLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'coordenador.dashboard.security@escola.com',
        senha: 'SenhaSegura123!',
      });
    coordenadorToken = coordLogin.body.accessToken;

    const dirLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'diretor.dashboard.security@escola.com',
        senha: 'SenhaSegura123!',
      });
    diretorToken = dirLogin.body.accessToken;
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    await prisma.analise.deleteMany({
      where: {
        aula_id: { in: testAulaIds },
      },
    });

    await prisma.aula.deleteMany({
      where: {
        id: { in: testAulaIds },
      },
    });

    await prisma.turma.deleteMany({
      where: {
        id: { in: testTurmaIds },
      },
    });

    await prisma.usuario.deleteMany({
      where: {
        id: { in: testUserIds },
      },
    });

    const remainingUsers = await prisma.usuario.count({
      where: { escola_id: testEscolaId },
    });
    if (remainingUsers === 0) {
      await prisma.escola.delete({
        where: { id: testEscolaId },
      });
    }

    await app.close();
  });

  describe('Coordenador Permissions', () => {
    it('DEVE acessar dashboard de professores', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/coordenador/professores')
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.metricas).toBeDefined();
    });

    it('DEVE acessar dashboard de turmas', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/coordenador/turmas')
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.metricas).toBeDefined();
    });

    it('NÃO DEVE acessar transcrição bruta', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/aulas/${professorAulaId}/analise`)
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Insufficient permissions');
    });

    it('NÃO DEVE acessar endpoint de diretor', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/diretor/metricas')
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Insufficient permissions');
    });
  });

  describe('Diretor Permissions', () => {
    it('DEVE acessar dashboard executivo', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/diretor/metricas')
        .set('Authorization', `Bearer ${diretorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.kpis).toBeDefined();
    });

    it('DEVE acessar dashboards de coordenador (herança)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/coordenador/professores')
        .set('Authorization', `Bearer ${diretorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.metricas).toBeDefined();
    });

    it('NÃO DEVE acessar transcrição bruta', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/aulas/${professorAulaId}/analise`)
        .set('Authorization', `Bearer ${diretorToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Insufficient permissions');
    });
  });

  describe('Professor Permissions', () => {
    it('DEVE acessar apenas suas próprias transcrições', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/aulas/${professorAulaId}/analise`)
        .set('Authorization', `Bearer ${professorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.aula).toBeDefined();
      expect(response.body.relatorio).toContain('Relatório privado do professor');
    });

    it('NÃO DEVE acessar transcrição de outro professor', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/aulas/${outroProfessorAulaId}/analise`)
        .set('Authorization', `Bearer ${professorToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Você não tem acesso');
    });

    it('NÃO DEVE acessar dashboards de coordenador', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/coordenador/professores')
        .set('Authorization', `Bearer ${professorToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Insufficient permissions');
    });
  });
});
