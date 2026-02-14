import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('POST /api/v1/admin/schools (Story 13.1)', () => {
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

  const validDto = {
    nome: 'Colégio Teste Epic 13',
    cnpj: '12.345.678/0001-90',
    tipo: 'particular',
    contato_principal: 'Maria Silva',
    email_contato: 'epic13teste@escola.com.br',
    telefone: '(11) 98765-4321',
    plano: 'basico',
    limite_horas_mes: 400,
  };

  it('should create escola with admin token (201)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/schools')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validDto)
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      nome: validDto.nome,
      cnpj: '12345678000190', // Normalizado
      tipo: validDto.tipo,
      contato_principal: validDto.contato_principal,
      email_contato: validDto.email_contato,
      telefone: '11987654321', // Normalizado
      plano: validDto.plano,
      limite_horas_mes: validDto.limite_horas_mes,
      status: 'ativa',
      data_ativacao: expect.any(String),
      created_at: expect.any(String),
    });

    expect(response.body.status).toBe('ativa');
    expect(new Date(response.body.data_ativacao)).toBeInstanceOf(Date);
  });

  it('should reject professor token (403)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/schools')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        nome: 'Escola Não Autorizada',
        cnpj: '99.999.999/0001-99',
        tipo: 'particular',
        contato_principal: 'José',
        email_contato: 'nao@autorizado.com',
        telefone: '(11) 91111-1111',
        plano: 'trial',
        limite_horas_mes: 100,
      })
      .expect(403);
  });

  it('should reject unauthenticated request (401)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/schools')
      .send(validDto)
      .expect(401);
  });

  it('should reject duplicate CNPJ (409)', async () => {
    const dto = {
      nome: 'Colégio Duplicado',
      cnpj: '12.345.678/0001-90', // Mesmo CNPJ do primeiro teste
      tipo: 'publica_municipal',
      contato_principal: 'João',
      email_contato: 'duplicado@escola.com.br',
      telefone: '(21) 91234-5678',
      plano: 'completo',
      limite_horas_mes: 1000,
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/schools')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(dto)
      .expect(409);

    expect(response.body.message).toContain('CNPJ já cadastrado');
  });

  it('should reject duplicate email (409)', async () => {
    const dto = {
      nome: 'Colégio Email Duplicado',
      cnpj: '98.765.432/0001-10',
      tipo: 'particular',
      contato_principal: 'Ana',
      email_contato: 'epic13teste@escola.com.br', // Mesmo email do primeiro teste
      telefone: '(11) 95555-5555',
      plano: 'trial',
      limite_horas_mes: 100,
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/schools')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(dto)
      .expect(409);

    expect(response.body.message).toContain('Email de contato já cadastrado');
  });

  it('should reject invalid CNPJ format (400)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/schools')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ...validDto,
        email_contato: 'cnpjinvalido@teste.com',
        cnpj: '123', // CNPJ inválido
      })
      .expect(400);

    expect(response.body.message).toContain('CNPJ inválido');
  });

  it('should reject missing required field (400)', async () => {
    const { nome, ...dtoSemNome } = validDto;

    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/schools')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(dtoSemNome)
      .expect(400);

    expect(response.body.message).toBeDefined();
  });

  it('should accept CNPJ without formatting (unformatted variant)', async () => {
    const dto = {
      nome: 'Colégio CNPJ Não Formatado',
      cnpj: '11122233300019', // 14 dígitos sem formatação
      tipo: 'publica_estadual',
      contato_principal: 'Pedro',
      email_contato: 'cnpjnaoformatado@teste.com',
      telefone: '11988887777', // Telefone sem formatação
      plano: 'enterprise',
      limite_horas_mes: 5000,
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/schools')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(dto)
      .expect(201);

    expect(response.body.cnpj).toBe('11122233300019');
    expect(response.body.telefone).toBe('11988887777');
  });

  it('should create escola with optional endereco field', async () => {
    const dtoComEndereco = {
      ...validDto,
      nome: 'Colégio Com Endereço',
      cnpj: '22.333.444/0001-55',
      email_contato: 'comendereco@teste.com',
      endereco: {
        rua: 'Rua Exemplo',
        numero: '123',
        bairro: 'Centro',
        cidade: 'São Paulo',
        uf: 'SP',
        cep: '01234-567',
      },
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/schools')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(dtoComEndereco)
      .expect(201);

    expect(response.body.endereco).toEqual(dtoComEndereco.endereco);
  });

  it('should reject duplicate email with different case (409) - Case Insensitive', async () => {
    const dto = {
      nome: 'Colégio Email Case Insensitive',
      cnpj: '55.666.777/0001-88',
      tipo: 'particular',
      contato_principal: 'Carlos',
      email_contato: 'EPIC13TESTE@ESCOLA.COM.BR', // Uppercase version do primeiro teste
      telefone: '(11) 96666-6666',
      plano: 'basico',
      limite_horas_mes: 400,
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/schools')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(dto)
      .expect(409);

    expect(response.body.message).toContain('Email de contato já cadastrado');
  });
});
