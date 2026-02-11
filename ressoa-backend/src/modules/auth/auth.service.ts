import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

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
}
