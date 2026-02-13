import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { CurriculoTipo } from '@prisma/client';

/**
 * E2E Tests for Story 11.2: Turma Curriculo Tipo
 * Tests BNCC vs CUSTOM turma creation and updates
 */
describe('TurmasController (E2E) - Curriculo Tipo', () => {
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
    app.setGlobalPrefix('api/v1'); // ✅ Match main.ts global prefix

    // ✅ Enable global validation pipe (same as main.ts)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup
    await prisma.turma.deleteMany({
      where: { escola_id: escolaId },
    });
    await prisma.perfilUsuario.deleteMany({
      where: { usuario_id: { in: [professorId] } },
    });
    await prisma.usuario.deleteMany({
      where: { escola_id: escolaId },
    });
    await prisma.escola.delete({
      where: { id: escolaId },
    });

    await prisma.$disconnect();
    await app.close();
  });

  async function setupTestData() {
    // Create escola
    const escola = await prisma.escola.create({
      data: {
        nome: 'Escola Teste Curriculo',
        cnpj: '12345678000199',
        email_contato: 'teste@escola.com',
      },
    });
    escolaId = escola.id;

    // Hash password
    const testPassword = 'SenhaSegura123!';
    const senhaHash = await bcrypt.hash(testPassword, 10);

    // Create coordenador
    const coordenador = await prisma.usuario.create({
      data: {
        nome: 'Coordenador Teste',
        email: 'coordenador-curriculo@escola.com',
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

    // Create professor
    const professor = await prisma.usuario.create({
      data: {
        nome: 'Professor Teste',
        email: 'professor-curriculo@escola.com',
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

    // Login as coordenador
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'coordenador-curriculo@escola.com',
        senha: testPassword,
      });

    coordenadorToken = `Bearer ${loginResponse.body.accessToken}`;
  }

  describe('POST /api/v1/turmas - Create BNCC turma', () => {
    it('should create BNCC turma without contexto_pedagogico', async () => {
      const dto = {
        nome: '7A Matemática',
        disciplina: 'MATEMATICA',
        serie: 'SETIMO_ANO',
        tipo_ensino: 'FUNDAMENTAL',
        curriculo_tipo: 'BNCC',
        ano_letivo: 2026,
        turno: 'MATUTINO',
        professor_id: professorId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/turmas')
        .set('Authorization', coordenadorToken)
        .send(dto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.curriculo_tipo).toBe('BNCC');
      expect(response.body.contexto_pedagogico).toBeNull();
      expect(response.body.nome).toBe('7A Matemática');
    });

    it('should create BNCC turma with default curriculo_tipo when not specified', async () => {
      const dto = {
        nome: '8B Ciências',
        disciplina: 'CIENCIAS',
        serie: 'OITAVO_ANO',
        tipo_ensino: 'FUNDAMENTAL',
        // curriculo_tipo omitted - should default to BNCC
        ano_letivo: 2026,
        turno: 'VESPERTINO',
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
  });

  describe('POST /api/v1/turmas - Create CUSTOM turma', () => {
    it('should create CUSTOM turma with full contexto_pedagogico', async () => {
      const dto = {
        nome: 'Preparatório PM 2026',
        disciplina: 'MATEMATICA',
        serie: 'PRIMEIRO_ANO_EM',
        tipo_ensino: 'MEDIO',
        curriculo_tipo: 'CUSTOM',
        contexto_pedagogico: {
          objetivo_geral:
            'Preparar alunos para prova de matemática da Polícia Militar de São Paulo, abordando raciocínio lógico, álgebra e geometria',
          publico_alvo:
            'Jovens entre 18-25 anos, ensino médio completo, aspirantes a carreira militar',
          metodologia:
            'Simulados semanais baseados em provas anteriores + revisão teórica de conceitos-chave + resolução comentada',
          carga_horaria_total: 120,
        },
        ano_letivo: 2026,
        turno: 'NOTURNO',
        professor_id: professorId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/turmas')
        .set('Authorization', coordenadorToken)
        .send(dto)
        .expect(201);

      expect(response.body.curriculo_tipo).toBe('CUSTOM');
      expect(response.body.contexto_pedagogico).toMatchObject(
        dto.contexto_pedagogico,
      );
      expect(response.body.contexto_pedagogico.objetivo_geral).toBe(
        dto.contexto_pedagogico.objetivo_geral,
      );
    });
  });

  describe('POST /api/v1/turmas - Validation errors', () => {
    it('should reject CUSTOM turma without contexto_pedagogico', async () => {
      const dto = {
        nome: 'Curso Técnico',
        disciplina: 'MATEMATICA',
        serie: 'PRIMEIRO_ANO_EM',
        tipo_ensino: 'MEDIO',
        curriculo_tipo: 'CUSTOM',
        // contexto_pedagogico omitted (undefined) - ❌ Required for CUSTOM
        ano_letivo: 2026,
        turno: 'MATUTINO',
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

    it('should reject CUSTOM turma with incomplete contexto_pedagogico', async () => {
      const dto = {
        nome: 'Curso Incompleto',
        disciplina: 'MATEMATICA',
        serie: 'SEGUNDO_ANO_EM',
        tipo_ensino: 'MEDIO',
        curriculo_tipo: 'CUSTOM',
        contexto_pedagogico: {
          objetivo_geral:
            'Apenas objetivo geral sem os outros campos obrigatórios necessários para validação completa',
          // Faltam: publico_alvo, metodologia, carga_horaria_total
        },
        ano_letivo: 2026,
        turno: 'INTEGRAL',
        professor_id: professorId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/turmas')
        .set('Authorization', coordenadorToken)
        .send(dto)
        .expect(400);

      const message = JSON.stringify(response.body.message);
      expect(message).toContain('publico_alvo');
      expect(message).toContain('metodologia');
      expect(message).toContain('carga_horaria_total');
    });
  });

  describe('PATCH /api/v1/turmas/:id - Update turma', () => {
    let turmaBnccId: string;
    let turmaCustomId: string;

    beforeAll(async () => {
      // Create BNCC turma for testing
      const turmaBncc = await prisma.turma.create({
        data: {
          nome: 'Turma BNCC Update Test',
          disciplina: 'MATEMATICA',
          serie: 'SEXTO_ANO',
          tipo_ensino: 'FUNDAMENTAL',
          curriculo_tipo: CurriculoTipo.BNCC,
          ano_letivo: 2026,
          turno: 'MATUTINO',
          escola_id: escolaId,
          professor_id: professorId,
        },
      });
      turmaBnccId = turmaBncc.id;

      // Create CUSTOM turma for testing
      const turmaCustom = await prisma.turma.create({
        data: {
          nome: 'Turma CUSTOM Update Test',
          disciplina: 'LINGUA_PORTUGUESA',
          serie: 'TERCEIRO_ANO_EM',
          tipo_ensino: 'MEDIO',
          curriculo_tipo: CurriculoTipo.CUSTOM,
          contexto_pedagogico: {
            objetivo_geral:
              'Preparação para ENEM com foco em redação e interpretação de textos complexos da área de linguagens',
            publico_alvo: 'Alunos de terceiro ano do ensino médio',
            metodologia: 'Redações semanais + correção individualizada',
            carga_horaria_total: 80,
          },
          ano_letivo: 2026,
          turno: 'VESPERTINO',
          escola_id: escolaId,
          professor_id: professorId,
        },
      });
      turmaCustomId = turmaCustom.id;
    });

    it('should update turma from BNCC to CUSTOM', async () => {
      const updateDto = {
        curriculo_tipo: 'CUSTOM',
        contexto_pedagogico: {
          objetivo_geral:
            'Curso preparatório para Olimpíada de Matemática com foco em problemas complexos e raciocínio avançado',
          publico_alvo: 'Alunos de sexto ano com alto desempenho',
          metodologia: 'Resolução de problemas olímpicos + teoria avançada',
          carga_horaria_total: 60,
        },
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/turmas/${turmaBnccId}`)
        .set('Authorization', coordenadorToken)
        .send(updateDto)
        .expect(200);

      expect(response.body.curriculo_tipo).toBe('CUSTOM');
      expect(response.body.contexto_pedagogico).toBeDefined();
      expect(response.body.contexto_pedagogico.objetivo_geral).toBe(
        updateDto.contexto_pedagogico.objetivo_geral,
      );
    });

    it('should update turma from CUSTOM to BNCC (with warning if objectives exist)', async () => {
      const updateDto = {
        curriculo_tipo: 'BNCC',
        contexto_pedagogico: null, // Limpar contexto
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/turmas/${turmaCustomId}`)
        .set('Authorization', coordenadorToken)
        .send(updateDto)
        .expect(200);

      expect(response.body.curriculo_tipo).toBe('BNCC');
      expect(response.body.contexto_pedagogico).toBeNull();

      // Warning may exist if objetivos_customizados are present
      // (not checked here as we don't have objectives in this test)
    });
  });

  describe('GET /api/v1/turmas - List turmas', () => {
    it('should return turmas with curriculo_tipo field', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/turmas')
        .set('Authorization', coordenadorToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // All turmas should have curriculo_tipo
      response.body.forEach((turma: any) => {
        expect(turma).toHaveProperty('curriculo_tipo');
        expect(['BNCC', 'CUSTOM']).toContain(turma.curriculo_tipo);
      });
    });
  });
});
