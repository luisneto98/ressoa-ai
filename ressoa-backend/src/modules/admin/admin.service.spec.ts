import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateEscolaDto } from './dto';

describe('AdminService.createEscola', () => {
  let service: AdminService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    escola: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockAuthService = {
    hashPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create escola with status ativa', async () => {
    const dto: CreateEscolaDto = {
      nome: 'Colégio Teste',
      cnpj: '12345678000190',
      tipo: 'particular',
      contato_principal: 'Maria Silva',
      email_contato: 'contato@teste.com.br',
      telefone: '11987654321',
      plano: 'basico',
      limite_horas_mes: 400,
    };

    mockPrismaService.escola.findUnique.mockResolvedValue(null);
    mockPrismaService.escola.findFirst.mockResolvedValue(null);
    mockPrismaService.escola.create.mockResolvedValue({
      id: '123e4567-e89b-12d3-a456-426614174000',
      nome: dto.nome,
      cnpj: '12345678000190',
      tipo: dto.tipo,
      endereco: null,
      contato_principal: dto.contato_principal,
      email_contato: dto.email_contato,
      telefone: '11987654321',
      plano: dto.plano,
      limite_horas_mes: dto.limite_horas_mes,
      status: 'ativa',
      data_ativacao: new Date('2026-02-14T10:00:00.000Z'),
      created_at: new Date('2026-02-14T10:00:00.000Z'),
      updated_at: new Date('2026-02-14T10:00:00.000Z'),
    });

    const result = await service.createEscola(dto);

    expect(result.status).toBe('ativa');
    expect(result.data_ativacao).toBeDefined();
    expect(result.cnpj).toBe('12345678000190');
  });

  it('should throw ConflictException for duplicate CNPJ', async () => {
    const dto: CreateEscolaDto = {
      nome: 'Colégio Teste',
      cnpj: '12.345.678/0001-90',
      tipo: 'particular',
      contato_principal: 'Maria Silva',
      email_contato: 'contato@teste.com.br',
      telefone: '11987654321',
      plano: 'basico',
      limite_horas_mes: 400,
    };

    // Simula CNPJ já existente
    mockPrismaService.escola.findUnique.mockResolvedValue({
      id: 'existing-id',
      cnpj: '12345678000190',
    });

    await expect(service.createEscola(dto)).rejects.toThrow(ConflictException);
    await expect(service.createEscola(dto)).rejects.toThrow(
      'CNPJ já cadastrado no sistema',
    );
  });

  it('should throw ConflictException for duplicate email', async () => {
    const dto: CreateEscolaDto = {
      nome: 'Colégio Teste',
      cnpj: '12345678000190',
      tipo: 'particular',
      contato_principal: 'Maria Silva',
      email_contato: 'contato@teste.com.br',
      telefone: '11987654321',
      plano: 'basico',
      limite_horas_mes: 400,
    };

    // CNPJ único, mas email duplicado
    mockPrismaService.escola.findUnique.mockResolvedValue(null);
    mockPrismaService.escola.findFirst.mockResolvedValue({
      id: 'existing-id',
      email_contato: dto.email_contato,
    });

    await expect(service.createEscola(dto)).rejects.toThrow(ConflictException);
    await expect(service.createEscola(dto)).rejects.toThrow(
      'Email de contato já cadastrado',
    );
  });

  it('should normalize CNPJ and telefone before saving', async () => {
    const dto: CreateEscolaDto = {
      nome: 'Colégio Teste',
      cnpj: '12.345.678/0001-90',
      tipo: 'particular',
      contato_principal: 'Maria Silva',
      email_contato: 'contato@teste.com.br',
      telefone: '(11) 98765-4321',
      plano: 'basico',
      limite_horas_mes: 400,
    };

    mockPrismaService.escola.findUnique.mockResolvedValue(null);
    mockPrismaService.escola.findFirst.mockResolvedValue(null);
    mockPrismaService.escola.create.mockResolvedValue({
      id: '123e4567-e89b-12d3-a456-426614174000',
      nome: dto.nome,
      cnpj: '12345678000190', // Normalizado
      tipo: dto.tipo,
      endereco: null,
      contato_principal: dto.contato_principal,
      email_contato: dto.email_contato,
      telefone: '11987654321', // Normalizado
      plano: dto.plano,
      limite_horas_mes: dto.limite_horas_mes,
      status: 'ativa',
      data_ativacao: new Date('2026-02-14T10:00:00.000Z'),
      created_at: new Date('2026-02-14T10:00:00.000Z'),
      updated_at: new Date('2026-02-14T10:00:00.000Z'),
    });

    const result = await service.createEscola(dto);

    expect(result.cnpj).toBe('12345678000190'); // Sem formatação
    expect(result.telefone).toBe('11987654321'); // Sem formatação

    // Verifica que o create foi chamado com valores normalizados
    expect(mockPrismaService.escola.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cnpj: '12345678000190',
          telefone: '11987654321',
        }),
      }),
    );
  });
});
