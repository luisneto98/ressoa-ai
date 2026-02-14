import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { RoleUsuario } from '@prisma/client';

interface PerfilUsuarioData {
  id: string;
  usuario_id: string;
  role: 'PROFESSOR' | 'COORDENADOR' | 'DIRETOR' | 'ADMIN';
  created_at: Date;
  updated_at: Date;
}

interface UsuarioComPerfil {
  id: string;
  nome: string;
  email: string;
  senha_hash: string;
  escola_id: string | null; // null para ADMIN
  created_at: Date;
  updated_at: Date;
  perfil_usuario: PerfilUsuarioData | null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, 10);
  }

  async comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async generateTokens(
    user: UsuarioComPerfil,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      escolaId: user.escola_id,
      role: user.perfil_usuario?.role || 'PROFESSOR',
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshTokenId = randomUUID();
    const refreshToken = refreshTokenId;

    const tokenData = JSON.stringify({
      userId: user.id,
      escolaId: user.escola_id,
      role: user.perfil_usuario?.role || 'PROFESSOR',
    });

    // FIX: Use token ID directly as key (O(1) lookup instead of O(N) KEYS scan)
    await this.redisService.setex(
      `refresh_token:${refreshTokenId}`,
      604800, // 7 days in seconds
      tokenData,
    );

    return { accessToken, refreshToken };
  }

  async validateRefreshToken(
    refreshToken: string,
  ): Promise<UsuarioComPerfil | null> {
    // FIX: Direct O(1) key lookup instead of O(N) pattern scan
    const tokenData = await this.redisService.get(
      `refresh_token:${refreshToken}`,
    );

    if (!tokenData) {
      return null;
    }

    const parsed = JSON.parse(tokenData) as {
      userId: string;
      escolaId: string;
      role: string;
    };

    // SECURITY FIX (Story 1.3 Code Review): Add escola_id to WHERE clause
    // Prevents cross-tenant access via stolen refresh token UUIDs
    const user = await this.prisma.usuario.findUnique({
      where: {
        id: parsed.userId,
        escola_id: parsed.escolaId,
      },
      include: { perfil_usuario: true },
    });

    return user as UsuarioComPerfil | null;
  }

  async acceptInvitation(
    dto: AcceptInvitationDto,
  ): Promise<{ message: string }> {
    // 1. Try coordenador token first, then fallback to diretor token (Story 13.4 - AC6)
    let tokenData = await this.redisService.get(
      `invite_coordenador:${dto.token}`,
    );
    let role: RoleUsuario = RoleUsuario.COORDENADOR;
    let tokenKey = `invite_coordenador:${dto.token}`;

    // Fallback to diretor token
    if (!tokenData) {
      tokenData = await this.redisService.get(`invite_director:${dto.token}`);
      role = RoleUsuario.DIRETOR;
      tokenKey = `invite_director:${dto.token}`;
    }

    if (!tokenData) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    // 2. Parse token data (email, escolaId, nome)
    let email: string;
    let escolaId: string;
    let nome: string;
    try {
      const parsed = JSON.parse(tokenData) as {
        email: string;
        escolaId: string;
        nome: string;
      };
      email = parsed.email; // Already normalized (lowercase + trim)
      escolaId = parsed.escolaId;
      nome = parsed.nome;
    } catch (error) {
      this.logger.error(
        `Failed to parse invitation token data: ${tokenData}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new UnauthorizedException('Token inválido ou corrompido');
    }

    // 3. Validate escola exists and is active
    const escola = await this.prisma.escola.findUnique({
      where: { id: escolaId },
    });

    if (!escola) {
      throw new NotFoundException('Escola não encontrada');
    }

    if (escola.status !== 'ativa') {
      throw new BadRequestException('Escola inativa ou suspensa');
    }

    // 4. Validate email unique within escola (case-insensitive, already normalized in token)
    const existingUser = await this.prisma.usuario.findFirst({
      where: {
        email: email,
        escola_id: escolaId,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado nesta escola');
    }

    // 5. Hash password (bcrypt 10 rounds)
    const hashedPassword = await this.hashPassword(dto.senha);

    // 6. Create Usuario + PerfilUsuario in transaction
    const usuario = await this.prisma.$transaction(async (prisma) => {
      const newUsuario = await prisma.usuario.create({
        data: {
          email: email,
          nome: nome,
          senha_hash: hashedPassword,
          escola_id: escolaId,
        },
      });

      await prisma.perfilUsuario.create({
        data: {
          usuario_id: newUsuario.id,
          role, // COORDENADOR or DIRETOR based on token type
        },
      });

      return newUsuario;
    });

    // 7. Delete token (one-time use)
    await this.redisService.del(tokenKey);

    this.logger.log(
      `${role} invitation accepted: ${usuario.email} (escola: ${escola.nome})`,
    );

    return { message: 'Convite aceito com sucesso' };
  }
}
