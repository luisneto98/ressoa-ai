import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { RedisService } from '../../redis/redis.service';
import { EmailService } from '../../common/email/email.service';
import {
  CreateEscolaDto,
  CreateUsuarioDto,
  EscolaResponseDto,
  UsuarioResponseDto,
  InviteDirectorDto,
} from './dto';
import { RoleUsuario } from '@prisma/client';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private redisService: RedisService,
    private emailService: EmailService,
  ) {}

  /**
   * Cria uma nova escola no sistema
   * Valida CNPJ e email únicos antes de criar
   * Normaliza CNPJ e telefone (remove formatação)
   */
  async createEscola(dto: CreateEscolaDto): Promise<EscolaResponseDto> {
    // 1. Normalize CNPJ (remove formatação)
    const cnpjNormalizado = dto.cnpj.replace(/\D/g, ''); // Remove não-dígitos

    // 2. Normalize email (lowercase para case-insensitive uniqueness)
    const emailNormalizado = dto.email_contato.toLowerCase().trim();

    // 3. Validar CNPJ único
    const existingEscola = await this.prisma.escola.findUnique({
      where: { cnpj: cnpjNormalizado },
    });
    if (existingEscola) {
      throw new ConflictException('CNPJ já cadastrado no sistema');
    }

    // 4. Validar email único (case-insensitive)
    const existingEmail = await this.prisma.escola.findFirst({
      where: {
        email_contato: { equals: emailNormalizado, mode: 'insensitive' },
      },
    });
    if (existingEmail) {
      throw new ConflictException('Email de contato já cadastrado');
    }

    // 5. Normalizar telefone (remover formatação)
    const telefoneNormalizado = dto.telefone.replace(/\D/g, '');

    // 6. Criar escola com status=ativa
    const escola = await this.prisma.escola.create({
      data: {
        nome: dto.nome,
        cnpj: cnpjNormalizado, // Salva sem formatação
        tipo: dto.tipo,
        endereco: dto.endereco ?? undefined,
        contato_principal: dto.contato_principal,
        email_contato: emailNormalizado, // Salva em lowercase
        telefone: telefoneNormalizado,
        plano: dto.plano,
        limite_horas_mes: dto.limite_horas_mes,
        status: 'ativa',
        data_ativacao: new Date(),
      },
    });

    // 7. Retornar DTO (campos garantidos pela criação acima)
    return {
      id: escola.id,
      nome: escola.nome,
      cnpj: escola.cnpj as string, // Garantido pela criação acima
      tipo: escola.tipo as
        | 'particular'
        | 'publica_municipal'
        | 'publica_estadual',
      endereco: escola.endereco as object | undefined,
      contato_principal: escola.contato_principal as string,
      email_contato: escola.email_contato as string,
      telefone: escola.telefone as string,
      plano: escola.plano as string,
      limite_horas_mes: escola.limite_horas_mes as number,
      status: escola.status as string,
      data_ativacao: escola.data_ativacao as Date,
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

  /**
   * Envia convite por email para Diretor com token único
   * Valida escola existe e está ativa, email único na escola
   * Gera token seguro de 64 caracteres e armazena no Redis com TTL de 24h
   * Graceful degradation: se email falhar, token permanece válido
   */
  async inviteDirector(
    dto: InviteDirectorDto,
    userId?: string,
  ): Promise<{ message: string }> {
    // 1. Normalize email (lowercase + trim)
    const emailNormalizado = dto.email.toLowerCase().trim();

    // 2. Validate escola exists and is active
    const escola = await this.prisma.escola.findUnique({
      where: { id: dto.escola_id },
    });

    if (!escola) {
      throw new NotFoundException('Escola não encontrada');
    }

    if (escola.status !== 'ativa') {
      throw new BadRequestException('Escola inativa ou suspensa');
    }

    // 3. Validate email unique within escola (case-insensitive)
    const existingUser = await this.prisma.usuario.findFirst({
      where: {
        email: emailNormalizado,
        escola_id: dto.escola_id,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado nesta escola');
    }

    // 4. Generate unique token (64 chars hex)
    const inviteToken = crypto.randomBytes(32).toString('hex');

    // 5. Store token in Redis with 24h TTL
    const tokenData = JSON.stringify({
      email: emailNormalizado,
      escolaId: dto.escola_id,
      nome: dto.nome,
    });

    await this.redisService.setex(
      `invite_director:${inviteToken}`,
      86400, // 24 hours
      tokenData,
    );

    // 5b. Dual-write: persist to DB for listing/management (Story 13.11)
    if (userId) {
      try {
        await this.prisma.conviteUsuario.create({
          data: {
            email: emailNormalizado,
            nome_completo: dto.nome,
            tipo_usuario: 'diretor',
            escola_id: dto.escola_id,
            criado_por: userId,
            token: inviteToken,
            expira_em: new Date(Date.now() + 86400 * 1000),
            status: 'pendente',
          },
        });
      } catch (error) {
        this.logger.error('Failed to persist invite to DB (dual-write)', {
          error: error instanceof Error ? error.message : String(error),
          email: emailNormalizado,
        });
      }
    }

    // 6. Send invitation email (graceful degradation)
    try {
      await this.emailService.sendDirectorInvitationEmail(
        emailNormalizado,
        dto.nome,
        escola.nome,
        inviteToken,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to send director invitation email to ${emailNormalizado}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Don't throw - token is still valid, email might arrive later
    }

    return { message: 'Convite enviado com sucesso' };
  }
}
