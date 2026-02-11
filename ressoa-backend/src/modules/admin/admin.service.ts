import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import {
  CreateEscolaDto,
  CreateUsuarioDto,
  EscolaResponseDto,
  UsuarioResponseDto,
} from './dto';
import { RoleUsuario } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  /**
   * Cria uma nova escola no sistema
   * Valida CNPJ único antes de criar
   */
  async createEscola(dto: CreateEscolaDto): Promise<EscolaResponseDto> {
    // Validar CNPJ único
    const existingEscola = await this.prisma.escola.findUnique({
      where: { cnpj: dto.cnpj },
    });

    if (existingEscola) {
      throw new ConflictException('CNPJ já cadastrado no sistema');
    }

    // Criar escola
    const escola = await this.prisma.escola.create({
      data: {
        nome: dto.nome,
        cnpj: dto.cnpj,
        email_contato: dto.email_contato,
        telefone: dto.telefone,
      },
    });

    return {
      id: escola.id,
      nome: escola.nome,
      cnpj: escola.cnpj!, // Safe: came from validated DTO
      email_contato: escola.email_contato!, // Safe: came from validated DTO
      telefone: escola.telefone ?? undefined, // Convert null to undefined
      created_at: escola.created_at,
    };
  }

  /**
   * Cria um novo usuário no sistema
   * Valida escola existe, email único na escola, e não permite criar ADMIN via API
   */
  async createUsuario(dto: CreateUsuarioDto): Promise<UsuarioResponseDto> {
    // Validação: não permitir criação de ADMIN via API
    if (dto.role === RoleUsuario.ADMIN) {
      throw new BadRequestException(
        'Não é permitido criar usuários ADMIN via API',
      );
    }

    // Validar que escola existe
    const escola = await this.prisma.escola.findUnique({
      where: { id: dto.escola_id },
    });

    if (!escola) {
      throw new NotFoundException('Escola não encontrada');
    }

    // Validar email único dentro da escola
    // Constraint: @@unique([email, escola_id]) no Prisma schema
    const existingUser = await this.prisma.usuario.findFirst({
      where: {
        email: dto.email,
        escola_id: dto.escola_id,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado nesta escola');
    }

    // Hashear senha (bcrypt com 10 salt rounds)
    const hashedPassword = await this.authService.hashPassword(dto.senha);

    // Criar usuário com perfil em transação
    const usuario = await this.prisma.usuario.create({
      data: {
        email: dto.email,
        senha_hash: hashedPassword,
        nome: dto.nome,
        escola_id: dto.escola_id,
        perfil_usuario: {
          create: {
            role: dto.role,
          },
        },
      },
      include: {
        perfil_usuario: true,
      },
    });

    return {
      id: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      escola_id: usuario.escola_id!, // Safe: came from validated DTO
      role: usuario.perfil_usuario!.role, // Safe: just created with nested create
      created_at: usuario.created_at,
      // NUNCA retornar senha ou senha_hash
    };
  }
}
