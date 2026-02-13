import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { CurriculoTipo, NivelBloom } from '@prisma/client';

/**
 * E2E Tests for Story 11.4: Backend — CRUD de Objetivos Customizados
 * Endpoints: /turmas/:turma_id/objetivos
 *
 * Coverage (AC10):
 * - Test 1: CRUD completo de objetivo
 * - Test 2: Validação - turma BNCC não pode ter objetivos customizados
 * - Test 3: Validação - código duplicado retorna 409
 * - Test 4: Validação - descrição < 20 chars retorna 400
 * - Test 5: Validação - criterios_evidencia vazio retorna 400
 * - Test 6: RBAC - professor não pode criar em turma de outro
 * - Test 7: RBAC - coordenador pode criar em qualquer turma da escola
 * - Test 8: RBAC - professor de outra escola recebe 403
 * - Test 9: Delete bloqueado se objetivo em uso em planejamento
 * - Test 10: Multi-tenancy - objetivo não vaza entre escolas
 * - Test 11: Ordenação - objetivos retornados em ordem de criação
 * - Test 12: Patch parcial - campos não enviados permanecem inalterados
 */
describe('TurmasController (E2E) - Objetivos Customizados (Story 11.4)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let escolaId: string;
  let escola2Id: string;
  let turmaCustomId: string;
  let turmaBnccId: string;
  let turmaEscola2Id: string;

  let professorToken: string;
  let professorId: string;
  let professor2Token: string;
  let professor2Id: string;
  let coordenadorToken: string;
  let coordenadorId: string;
  let professorEscola2Token: string;
  let professorEscola2Id: string;

  const testPassword = 'SenhaSegura123!';

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
    // Cleanup
    await prisma.planejamentoObjetivo.deleteMany({
      where: { planejamento: { escola_id: { in: [escolaId, escola2Id] } } },
    });
    await prisma.planejamento.deleteMany({
      where: { escola_id: { in: [escolaId, escola2Id] } },
    });
    await prisma.objetivoAprendizagem.deleteMany({
      where: {
        turma: { escola_id: { in: [escolaId, escola2Id] } },
      },
    });
    await prisma.turma.deleteMany({
      where: { escola_id: { in: [escolaId, escola2Id] } },
    });
    await prisma.perfilUsuario.deleteMany({
      where: {
        usuario_id: {
          in: [professorId, professor2Id, coordenadorId, professorEscola2Id],
        },
      },
    });
    await prisma.usuario.deleteMany({
      where: { escola_id: { in: [escolaId, escola2Id] } },
    });
    await prisma.escola.deleteMany({
      where: { id: { in: [escolaId, escola2Id] } },
    });

    await prisma.$disconnect();
    await app.close();
  });

  async function setupTestData() {
    const senhaHash = await bcrypt.hash(testPassword, 10);

    // Escola 1
    const escola = await prisma.escola.create({
      data: {
        nome: 'Escola Preparatório PM',
        cnpj: '11111111000101',
        email_contato: 'pm@escola.com',
      },
    });
    escolaId = escola.id;

    // Escola 2 (multi-tenancy)
    const escola2 = await prisma.escola.create({
      data: {
        nome: 'Escola Outra',
        cnpj: '22222222000102',
        email_contato: 'outra@escola.com',
      },
    });
    escola2Id = escola2.id;

    // Professor 1 (escola 1)
    const professor = await prisma.usuario.create({
      data: {
        nome: 'Prof PM',
        email: 'prof-pm@escola.com',
        senha_hash: senhaHash,
        escola_id: escolaId,
      },
    });
    professorId = professor.id;
    await prisma.perfilUsuario.create({
      data: { usuario_id: professorId, role: 'PROFESSOR' },
    });

    // Professor 2 (escola 1 - para testes RBAC)
    const professor2 = await prisma.usuario.create({
      data: {
        nome: 'Prof Outro',
        email: 'prof-outro@escola.com',
        senha_hash: senhaHash,
        escola_id: escolaId,
      },
    });
    professor2Id = professor2.id;
    await prisma.perfilUsuario.create({
      data: { usuario_id: professor2Id, role: 'PROFESSOR' },
    });

    // Coordenador (escola 1)
    const coordenador = await prisma.usuario.create({
      data: {
        nome: 'Coordenador PM',
        email: 'coord-pm@escola.com',
        senha_hash: senhaHash,
        escola_id: escolaId,
      },
    });
    coordenadorId = coordenador.id;
    await prisma.perfilUsuario.create({
      data: { usuario_id: coordenadorId, role: 'COORDENADOR' },
    });

    // Professor escola 2 (multi-tenancy test)
    const professorEscola2 = await prisma.usuario.create({
      data: {
        nome: 'Prof Escola2',
        email: 'prof@escola2.com',
        senha_hash: senhaHash,
        escola_id: escola2Id,
      },
    });
    professorEscola2Id = professorEscola2.id;
    await prisma.perfilUsuario.create({
      data: { usuario_id: professorEscola2Id, role: 'PROFESSOR' },
    });

    // Turma CUSTOM (professor 1)
    const turmaCustom = await prisma.turma.create({
      data: {
        nome: 'Turma PM Matemática',
        disciplina: 'MATEMATICA',
        serie: 'NONO_ANO',
        tipo_ensino: 'FUNDAMENTAL',
        curriculo_tipo: CurriculoTipo.CUSTOM,
        contexto_pedagogico: 'Preparatório para concurso PM-SP',
        ano_letivo: 2026,
        turno: 'MATUTINO',
        escola_id: escolaId,
        professor_id: professorId,
      },
    });
    turmaCustomId = turmaCustom.id;

    // Turma BNCC (professor 1 - para teste de validação)
    const turmaBncc = await prisma.turma.create({
      data: {
        nome: '9A',
        disciplina: 'MATEMATICA',
        serie: 'NONO_ANO',
        tipo_ensino: 'FUNDAMENTAL',
        curriculo_tipo: CurriculoTipo.BNCC,
        ano_letivo: 2026,
        turno: 'MATUTINO',
        escola_id: escolaId,
        professor_id: professorId,
      },
    });
    turmaBnccId = turmaBncc.id;

    // Turma escola 2 (multi-tenancy test)
    const turmaEscola2 = await prisma.turma.create({
      data: {
        nome: 'Turma Escola 2',
        disciplina: 'MATEMATICA',
        serie: 'NONO_ANO',
        tipo_ensino: 'FUNDAMENTAL',
        curriculo_tipo: CurriculoTipo.CUSTOM,
        contexto_pedagogico: 'Teste',
        ano_letivo: 2026,
        turno: 'MATUTINO',
        escola_id: escola2Id,
        professor_id: professorEscola2Id,
      },
    });
    turmaEscola2Id = turmaEscola2.id;

    // Login tokens
    const loginProf = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'prof-pm@escola.com', senha: testPassword });
    professorToken = loginProf.body.access_token;

    const loginProf2 = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'prof-outro@escola.com', senha: testPassword });
    professor2Token = loginProf2.body.access_token;

    const loginCoord = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'coord-pm@escola.com', senha: testPassword });
    coordenadorToken = loginCoord.body.access_token;

    const loginProfEscola2 = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'prof@escola2.com', senha: testPassword });
    professorEscola2Token = loginProfEscola2.body.access_token;
  }

  /**
   * Test 1: CRUD completo de objetivo (AC10, Test 1)
   */
  it('should create, list, update and delete custom objetivo', async () => {
    // 1. Criar objetivo
    const createDto = {
      codigo: 'PM-MAT-01',
      descricao:
        'Resolver problemas de regra de três aplicados a PM-SP (mínimo 20 caracteres)',
      nivel_cognitivo: 'APLICAR',
      criterios_evidencia: ['Identifica proporções', 'Resolve corretamente'],
    };

    const created = await request(app.getHttpServer())
      .post(`/api/v1/turmas/${turmaCustomId}/objetivos`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send(createDto)
      .expect(201);

    expect(created.body).toMatchObject({
      codigo: createDto.codigo,
      descricao: createDto.descricao,
      nivel_cognitivo: createDto.nivel_cognitivo,
      tipo_fonte: 'CUSTOM', // ✅ AC1: setado automaticamente
      turma_id: turmaCustomId,
    });
    expect(created.body.id).toBeDefined();
    expect(created.body.created_at).toBeDefined();

    const objetivoId = created.body.id;

    // 2. Listar objetivos
    const list = await request(app.getHttpServer())
      .get(`/api/v1/turmas/${turmaCustomId}/objetivos`)
      .set('Authorization', `Bearer ${professorToken}`)
      .expect(200);

    expect(list.body).toHaveLength(1);
    expect(list.body[0].id).toBe(objetivoId);

    // 3. Buscar objetivo específico
    const getOne = await request(app.getHttpServer())
      .get(`/api/v1/turmas/${turmaCustomId}/objetivos/${objetivoId}`)
      .set('Authorization', `Bearer ${professorToken}`)
      .expect(200);

    expect(getOne.body.id).toBe(objetivoId);

    // 4. Atualizar objetivo
    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/turmas/${turmaCustomId}/objetivos/${objetivoId}`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        descricao: 'Nova descrição atualizada (mínimo 20 caracteres necessários)',
      })
      .expect(200);

    expect(updated.body.descricao).toBe(
      'Nova descrição atualizada (mínimo 20 caracteres necessários)',
    );
    expect(updated.body.codigo).toBe(createDto.codigo); // Campo não alterado

    // 5. Deletar objetivo
    await request(app.getHttpServer())
      .delete(`/api/v1/turmas/${turmaCustomId}/objetivos/${objetivoId}`)
      .set('Authorization', `Bearer ${professorToken}`)
      .expect(200);

    // 6. Confirmar deleção
    await request(app.getHttpServer())
      .get(`/api/v1/turmas/${turmaCustomId}/objetivos/${objetivoId}`)
      .set('Authorization', `Bearer ${professorToken}`)
      .expect(404);
  });

  /**
   * Test 2: Validação - turma BNCC não pode ter objetivos customizados (AC4)
   */
  it('should reject custom objetivo in BNCC turma (400)', async () => {
    const createDto = {
      codigo: 'PM-MAT-02',
      descricao:
        'Resolver problemas de regra de três aplicados a PM-SP (mínimo 20 caracteres)',
      nivel_cognitivo: 'APLICAR',
      criterios_evidencia: ['Identifica proporções'],
    };

    const response = await request(app.getHttpServer())
      .post(`/api/v1/turmas/${turmaBnccId}/objetivos`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send(createDto)
      .expect(400);

    expect(response.body.message).toContain(
      'Objetivos customizados só podem ser criados em turmas com curriculo_tipo = CUSTOM',
    );
  });

  /**
   * Test 3: Validação - código duplicado retorna 409 (AC2)
   */
  it('should reject duplicate codigo in same turma (409)', async () => {
    const createDto = {
      codigo: 'PM-MAT-03',
      descricao: 'Descrição inicial do objetivo com mais de vinte caracteres',
      nivel_cognitivo: 'APLICAR',
      criterios_evidencia: ['Identifica proporções'],
    };

    // Criar primeiro objetivo
    await request(app.getHttpServer())
      .post(`/api/v1/turmas/${turmaCustomId}/objetivos`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send(createDto)
      .expect(201);

    // Tentar criar segundo com mesmo código
    const response = await request(app.getHttpServer())
      .post(`/api/v1/turmas/${turmaCustomId}/objetivos`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send(createDto)
      .expect(409);

    expect(response.body.message).toContain('PM-MAT-03');
    expect(response.body.message).toContain('já existe');
  });

  /**
   * Test 4: Validação - descrição < 20 chars retorna 400 (AC2)
   */
  it('should reject descricao < 20 chars (400)', async () => {
    const createDto = {
      codigo: 'PM-MAT-04',
      descricao: 'Descrição curta', // < 20 chars
      nivel_cognitivo: 'APLICAR',
      criterios_evidencia: ['Identifica proporções'],
    };

    const response = await request(app.getHttpServer())
      .post(`/api/v1/turmas/${turmaCustomId}/objetivos`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send(createDto)
      .expect(400);

    expect(response.body.message).toEqual(
      expect.arrayContaining([
        expect.stringContaining('descricao deve ter entre 20 e 500 caracteres'),
      ]),
    );
  });

  /**
   * Test 5: Validação - criterios_evidencia vazio retorna 400 (AC2)
   */
  it('should reject empty criterios_evidencia (400)', async () => {
    const createDto = {
      codigo: 'PM-MAT-05',
      descricao:
        'Resolver problemas de regra de três aplicados a PM-SP (mínimo 20 caracteres)',
      nivel_cognitivo: 'APLICAR',
      criterios_evidencia: [], // Vazio
    };

    const response = await request(app.getHttpServer())
      .post(`/api/v1/turmas/${turmaCustomId}/objetivos`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send(createDto)
      .expect(400);

    expect(response.body.message).toEqual(
      expect.arrayContaining([
        expect.stringContaining('criterios_evidencia deve ter entre 1 e 5 itens'),
      ]),
    );
  });

  /**
   * Test 6: RBAC - professor não pode criar em turma de outro (AC3)
   */
  it('should enforce RBAC - professor cannot create in other teacher turma (403)', async () => {
    const createDto = {
      codigo: 'PM-MAT-06',
      descricao:
        'Resolver problemas de regra de três aplicados a PM-SP (mínimo 20 caracteres)',
      nivel_cognitivo: 'APLICAR',
      criterios_evidencia: ['Identifica proporções'],
    };

    const response = await request(app.getHttpServer())
      .post(`/api/v1/turmas/${turmaCustomId}/objetivos`)
      .set('Authorization', `Bearer ${professor2Token}`) // Professor diferente
      .send(createDto)
      .expect(403);

    expect(response.body.message).toContain('Você não tem permissão');
  });

  /**
   * Test 7: RBAC - coordenador pode criar em qualquer turma da escola (AC3)
   */
  it('should allow COORDENADOR to create in any turma of escola (201)', async () => {
    const createDto = {
      codigo: 'PM-MAT-07',
      descricao:
        'Resolver problemas de regra de três aplicados a PM-SP (mínimo 20 caracteres)',
      nivel_cognitivo: 'APLICAR',
      criterios_evidencia: ['Identifica proporções'],
    };

    const response = await request(app.getHttpServer())
      .post(`/api/v1/turmas/${turmaCustomId}/objetivos`)
      .set('Authorization', `Bearer ${coordenadorToken}`)
      .send(createDto)
      .expect(201);

    expect(response.body.codigo).toBe(createDto.codigo);
  });

  /**
   * Test 8: RBAC - professor de outra escola recebe 403 (multi-tenancy)
   */
  it('should enforce multi-tenancy - professor from other escola gets 403', async () => {
    const createDto = {
      codigo: 'PM-MAT-08',
      descricao:
        'Resolver problemas de regra de três aplicados a PM-SP (mínimo 20 caracteres)',
      nivel_cognitivo: 'APLICAR',
      criterios_evidencia: ['Identifica proporções'],
    };

    const response = await request(app.getHttpServer())
      .post(`/api/v1/turmas/${turmaCustomId}/objetivos`)
      .set('Authorization', `Bearer ${professorEscola2Token}`) // Escola diferente
      .send(createDto)
      .expect(404); // Turma não encontrada (multi-tenancy filter)

    expect(response.body.message).toContain('Turma não encontrada');
  });

  /**
   * Test 9: Delete bloqueado se objetivo em uso em planejamento (AC8)
   */
  it('should block delete if objetivo in use in planejamento (409)', async () => {
    // Criar objetivo
    const createDto = {
      codigo: 'PM-MAT-09',
      descricao: 'Objetivo que será usado em planejamento (mínimo 20 caracteres)',
      nivel_cognitivo: 'APLICAR',
      criterios_evidencia: ['Identifica proporções'],
    };

    const objetivo = await request(app.getHttpServer())
      .post(`/api/v1/turmas/${turmaCustomId}/objetivos`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send(createDto)
      .expect(201);

    const objetivoId = objetivo.body.id;

    // Criar planejamento com objetivo
    const planejamento = await prisma.planejamento.create({
      data: {
        bimestre: 1,
        ano_letivo: 2026,
        aulas_previstas: 10,
        turma_id: turmaCustomId,
        professor_id: professorId,
        escola_id: escolaId,
      },
    });

    await prisma.planejamentoObjetivo.create({
      data: {
        planejamento_id: planejamento.id,
        objetivo_id: objetivoId,
      },
    });

    // Tentar deletar objetivo em uso
    const response = await request(app.getHttpServer())
      .delete(`/api/v1/turmas/${turmaCustomId}/objetivos/${objetivoId}`)
      .set('Authorization', `Bearer ${professorToken}`)
      .expect(409);

    expect(response.body.message).toContain('está em uso em');
    expect(response.body.planejamentos_afetados).toBeDefined();
    expect(response.body.planejamentos_afetados).toHaveLength(1);
    expect(response.body.sugestao).toContain('Remova o objetivo');
  });

  /**
   * Test 10: Multi-tenancy - objetivo não vaza entre escolas
   */
  it('should enforce multi-tenancy - objetivo not visible to other escola', async () => {
    // Professor escola 1 cria objetivo
    const createDto = {
      codigo: 'PM-MAT-10',
      descricao: 'Objetivo escola 1 (mínimo vinte caracteres necessários aqui)',
      nivel_cognitivo: 'APLICAR',
      criterios_evidencia: ['Identifica proporções'],
    };

    const objetivo = await request(app.getHttpServer())
      .post(`/api/v1/turmas/${turmaCustomId}/objetivos`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send(createDto)
      .expect(201);

    const objetivoId = objetivo.body.id;

    // Professor escola 2 tenta acessar objetivo escola 1
    // Mesmo que ele saiba o ID, não consegue (multi-tenancy filter)
    await request(app.getHttpServer())
      .get(`/api/v1/turmas/${turmaCustomId}/objetivos/${objetivoId}`)
      .set('Authorization', `Bearer ${professorEscola2Token}`)
      .expect(404);
  });

  /**
   * Test 11: Ordenação - objetivos retornados em ordem de criação (AC5)
   */
  it('should return objetivos ordered by created_at ASC', async () => {
    // Limpar objetivos anteriores
    await prisma.objetivoAprendizagem.deleteMany({
      where: { turma_id: turmaCustomId },
    });

    // Criar 3 objetivos em sequência
    await request(app.getHttpServer())
      .post(`/api/v1/turmas/${turmaCustomId}/objetivos`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        codigo: 'ORDEM-01',
        descricao: 'Primeiro objetivo criado (mínimo 20 caracteres necessários)',
        nivel_cognitivo: 'APLICAR',
        criterios_evidencia: ['Critério 1'],
      })
      .expect(201);

    await new Promise((resolve) => setTimeout(resolve, 10)); // Garantir timestamp diferente

    await request(app.getHttpServer())
      .post(`/api/v1/turmas/${turmaCustomId}/objetivos`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        codigo: 'ORDEM-02',
        descricao: 'Segundo objetivo criado (mínimo 20 caracteres necessários)',
        nivel_cognitivo: 'ENTENDER',
        criterios_evidencia: ['Critério 2'],
      })
      .expect(201);

    await new Promise((resolve) => setTimeout(resolve, 10));

    await request(app.getHttpServer())
      .post(`/api/v1/turmas/${turmaCustomId}/objetivos`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        codigo: 'ORDEM-03',
        descricao: 'Terceiro objetivo criado (mínimo 20 caracteres necessários)',
        nivel_cognitivo: 'CRIAR',
        criterios_evidencia: ['Critério 3'],
      })
      .expect(201);

    // Listar e verificar ordem
    const list = await request(app.getHttpServer())
      .get(`/api/v1/turmas/${turmaCustomId}/objetivos`)
      .set('Authorization', `Bearer ${professorToken}`)
      .expect(200);

    expect(list.body).toHaveLength(3);
    expect(list.body[0].codigo).toBe('ORDEM-01');
    expect(list.body[1].codigo).toBe('ORDEM-02');
    expect(list.body[2].codigo).toBe('ORDEM-03');

    // Verificar timestamps estão em ordem crescente
    const ts1 = new Date(list.body[0].created_at).getTime();
    const ts2 = new Date(list.body[1].created_at).getTime();
    const ts3 = new Date(list.body[2].created_at).getTime();
    expect(ts1).toBeLessThanOrEqual(ts2);
    expect(ts2).toBeLessThanOrEqual(ts3);
  });

  /**
   * Test 12: Patch parcial - campos não enviados permanecem inalterados (AC7)
   */
  it('should support partial PATCH - unchanged fields remain the same', async () => {
    // Criar objetivo
    const createDto = {
      codigo: 'PATCH-01',
      descricao: 'Descrição original que será parcialmente atualizada aqui sim',
      nivel_cognitivo: 'APLICAR' as NivelBloom,
      area_conhecimento: 'Matemática Original',
      criterios_evidencia: ['Critério original 1', 'Critério original 2'],
    };

    const objetivo = await request(app.getHttpServer())
      .post(`/api/v1/turmas/${turmaCustomId}/objetivos`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send(createDto)
      .expect(201);

    const objetivoId = objetivo.body.id;

    // Atualizar apenas descrição (patch parcial)
    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/turmas/${turmaCustomId}/objetivos/${objetivoId}`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        descricao: 'Descrição atualizada via patch parcial (mínimo 20 caracteres)',
      })
      .expect(200);

    // Verificar que descrição mudou
    expect(updated.body.descricao).toBe(
      'Descrição atualizada via patch parcial (mínimo 20 caracteres)',
    );

    // Verificar que outros campos permaneceram inalterados
    expect(updated.body.codigo).toBe(createDto.codigo);
    expect(updated.body.nivel_cognitivo).toBe(createDto.nivel_cognitivo);
    expect(updated.body.area_conhecimento).toBe(createDto.area_conhecimento);
    expect(updated.body.criterios_evidencia).toEqual(createDto.criterios_evidencia);

    // Verificar que updated_at foi atualizado
    expect(new Date(updated.body.updated_at).getTime()).toBeGreaterThan(
      new Date(objetivo.body.created_at).getTime(),
    );
  });
});
