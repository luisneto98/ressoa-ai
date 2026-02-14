import {
  Controller,
  Post,
  Get,
  Body,
  UnauthorizedException,
  NotFoundException,
  HttpCode,
  Logger,
  Query,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { EmailService } from '../../common/email/email.service';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthenticatedUser } from './decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto, LogoutResponseDto } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { RoleUsuario } from '@prisma/client';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
  ) {}

  @Public() // Public endpoint - no JWT authentication required
  @Post('login')
  @HttpCode(200) // FIX: Force 200 OK as specified in AC (not 201 default)
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // v6+ syntax
  @ApiOperation({ summary: 'Login com email e senha' })
  @ApiResponse({
    status: 200,
    description: 'Login bem-sucedido',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  @ApiResponse({
    status: 429,
    description: 'Muitas tentativas - aguarde 1 minuto',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    // 1. Buscar usuário por email (include perfil_usuario e escola)
    const user = await this.prisma.usuario.findFirst({
      where: { email: loginDto.email },
      include: {
        perfil_usuario: true,
        escola: true,
      },
    });

    // 2. Validar se usuário existe
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 3. Validar senha
    const isPasswordValid = await this.authService.comparePassword(
      loginDto.senha,
      user.senha_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 4. FIX: Validate escola relationship exists (prevent null pointer)
    // ADMIN users can have escola_id = null (global access)
    if (!user.escola && user.perfil_usuario?.role !== RoleUsuario.ADMIN) {
      throw new UnauthorizedException('Usuário sem escola associada');
    }

    // 5. Gerar tokens
    const tokens = await this.authService.generateTokens(user);

    // 6. Retornar response
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.perfil_usuario?.role || 'PROFESSOR',
        // ADMIN users have escola = null (global access)
        escola: user.escola
          ? {
              id: user.escola.id,
              nome: user.escola.nome,
            }
          : null,
      },
    };
  }

  @Post('logout')
  @HttpCode(200) // Force 200 for consistency
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout e invalidação de refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Logout realizado com sucesso',
    type: LogoutResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Token JWT inválido' })
  async logout(@Body() dto: RefreshTokenDto): Promise<LogoutResponseDto> {
    // FIX: Direct O(1) key lookup + validate token exists before claiming success
    const deleted = await this.redisService.del(
      `refresh_token:${dto.refreshToken}`,
    );

    if (deleted === 0) {
      throw new UnauthorizedException('Refresh token inválido ou já expirado');
    }

    return {
      message: 'Logout realizado com sucesso',
    };
  }

  @Public() // Public endpoint - uses refresh token instead of JWT
  @Post('refresh')
  @HttpCode(200) // Force 200 for consistency
  @ApiOperation({ summary: 'Renovar access token usando refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Tokens renovados com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido ou expirado',
  })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
    // 1. Validar refresh token
    const user = await this.authService.validateRefreshToken(dto.refreshToken);

    if (!user) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    // 2. Buscar dados atualizados do usuário
    // SECURITY FIX (Story 1.3 Code Review): Add escola_id to WHERE clause
    // TenantInterceptor provides escolaId via context, but refresh endpoint is public
    // So we use escola_id from validated refresh token instead
    const updatedUser = await this.prisma.usuario.findUnique({
      where: {
        id: user.id,
        escola_id: user.escola_id,
      },
      include: {
        perfil_usuario: true,
        escola: true,
      },
    });

    if (!updatedUser) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // 3. FIX: Validate escola relationship exists
    // ADMIN users can have escola_id = null (global access)
    if (
      !updatedUser.escola &&
      updatedUser.perfil_usuario?.role !== RoleUsuario.ADMIN
    ) {
      throw new UnauthorizedException('Usuário sem escola associada');
    }

    // 4. Gerar NOVOS tokens (rotation)
    const newTokens = await this.authService.generateTokens(updatedUser);

    // 5. FIX: Direct O(1) key deletion (old token rotation)
    await this.redisService.del(`refresh_token:${dto.refreshToken}`);

    // 6. Retornar novos tokens
    return {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        nome: updatedUser.nome,
        role: updatedUser.perfil_usuario?.role || 'PROFESSOR',
        // ADMIN users have escola = null (global access)
        escola: updatedUser.escola
          ? {
              id: updatedUser.escola.id,
              nome: updatedUser.escola.nome,
            }
          : null,
      },
    };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter dados do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Dados do usuário' })
  @ApiResponse({
    status: 401,
    description: 'Token JWT inválido ou expirado',
  })
  async getProfile(@CurrentUser() currentUser: AuthenticatedUser) {
    // SECURITY FIX (Story 1.3 Code Review): Add escola_id to WHERE clause
    // TenantInterceptor injects escolaId into context from JWT payload
    // We MUST use it to ensure multi-tenant isolation
    const escolaId = this.prisma.getEscolaIdOrThrow();

    // Buscar dados completos do usuário
    const user = await this.prisma.usuario.findUnique({
      where: {
        id: currentUser.userId,
        escola_id: escolaId,
      },
      include: {
        perfil_usuario: true,
        escola: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // FIX: Validate escola relationship exists
    // ADMIN users can have escola_id = null (global access)
    if (!user.escola && user.perfil_usuario?.role !== RoleUsuario.ADMIN) {
      throw new UnauthorizedException('Usuário sem escola associada');
    }

    return {
      id: user.id,
      email: user.email,
      nome: user.nome,
      role: user.perfil_usuario?.role || 'PROFESSOR',
      // ADMIN users have escola = null (global access)
      escola: user.escola
        ? {
            id: user.escola.id,
            nome: user.escola.nome,
          }
        : null,
    };
  }

  /**
   * POST /auth/forgot-password - Request password reset via email
   * Story 1.5 - Task 3: Implement forgot-password endpoint
   *
   * Security features (OWASP best practices):
   * - Generic response (don't reveal if email exists)
   * - Rate limiting (3 requests per hour)
   * - Token stored in Redis with 1-hour TTL
   * - Audit logging for security events
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per hour
  @ApiOperation({ summary: 'Solicitar recuperação de senha via email' })
  @ApiResponse({
    status: 200,
    description: 'Instruções enviadas se email existir',
    schema: {
      properties: {
        message: {
          type: 'string',
          example:
            'Se o email existir no sistema, você receberá instruções para redefinir sua senha.',
        },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Muitas tentativas - aguarde 1 hora',
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    // Audit logging: Log forgot password attempt (Story 1.4 learning)
    this.logger.log(`Password reset requested for email: ${dto.email}`);

    // Buscar usuário por email
    const user = await this.prisma.usuario.findFirst({
      where: { email: dto.email },
    });

    // SECURITY: ALWAYS return 200 (Story 1.2 learning: generic error messages)
    // Don't reveal whether email exists
    if (user) {
      // Gerar token aleatório seguro (256 bits = 64 chars hex)
      const resetToken = crypto.randomBytes(32).toString('hex');

      // CODE REVIEW FIX (Issue #1, #2): Store userId AND escolaId for multi-tenancy
      // This enables: (1) proper tenant isolation in reset-password
      //               (2) efficient refresh token invalidation by userId
      const tokenData = JSON.stringify({
        userId: user.id,
        escolaId: user.escola_id,
      });

      // Armazenar no Redis com TTL de 1 hora (3600 segundos)
      await this.redisService.setex(
        `reset_password:${resetToken}`,
        3600, // 1 hour
        tokenData, // Store JSON with userId + escolaId
      );

      // Enviar email (não aguardar para não revelar timing - security)
      this.emailService
        .sendPasswordResetEmail(user.email, resetToken)
        .catch((err) => {
          // Log error but continue (don't throw - security)
          this.logger.error(`Failed to send reset email: ${err.message}`);
        });

      // Audit logging: Success
      this.logger.log(`Password reset token generated for user: ${user.id}`);
    } else {
      // Audit logging: Email not found (but still return success)
      this.logger.log(`Password reset requested for non-existent email`);
    }

    // Generic response (same for found/not found)
    return {
      message:
        'Se o email existir no sistema, você receberá instruções para redefinir sua senha.',
    };
  }

  /**
   * POST /auth/reset-password - Reset password with token from email
   * Story 1.5 - Task 4: Implement reset-password endpoint
   *
   * Security features:
   * - Token validation (Redis lookup with O(1) performance)
   * - One-time use token (deleted after use)
   * - Strong password validation (DTO)
   * - Force logout on all devices (invalidate refresh tokens)
   * - Audit logging
   */
  @Public()
  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Redefinir senha com token de recuperação' })
  @ApiResponse({
    status: 200,
    description: 'Senha redefinida com sucesso',
    schema: {
      properties: {
        message: {
          type: 'string',
          example:
            'Senha redefinida com sucesso. Faça login com sua nova senha.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token inválido ou expirado',
  })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    // Audit logging: Reset password attempt
    this.logger.log(
      `Password reset attempt with token: ${dto.token.substring(0, 8)}...`,
    );

    // 1. Buscar token no Redis (O(1) direct lookup - Story 1.2 learning)
    const tokenData = await this.redisService.get(
      `reset_password:${dto.token}`,
    );

    if (!tokenData) {
      // Audit logging: Invalid/expired token
      this.logger.warn('Password reset failed: invalid or expired token');
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    // CODE REVIEW FIX (Issue #1, #2): Parse JSON to get userId AND escolaId
    let userId: string;
    let escolaId: string;
    try {
      const parsed = JSON.parse(tokenData);
      userId = parsed.userId;
      escolaId = parsed.escolaId;
    } catch (error) {
      // Handle legacy tokens (pre-fix) that only stored userId as plain string
      // This ensures backward compatibility during deployment
      userId = tokenData;
      escolaId = null as any; // Will fail escola_id check below if legacy token
      this.logger.warn(`Legacy reset token format detected - missing escolaId`);
    }

    // 2. Buscar usuário com multi-tenancy check (project-context.md Rule #3)
    // CODE REVIEW FIX (Issue #2): Include escola_id in WHERE clause
    const user = await this.prisma.usuario.findUnique({
      where: {
        id: userId,
        escola_id: escolaId, // Multi-tenancy isolation
      },
    });

    if (!user) {
      // This shouldn't happen (token exists but user doesn't, or wrong escola)
      this.logger.error(
        `Password reset: Token found but user ${userId} not found or escola mismatch`,
      );
      throw new NotFoundException('Usuário não encontrado');
    }

    // 3. Hashear nova senha (Story 1.1: use existing hashPassword method)
    const hashedPassword = await this.authService.hashPassword(dto.novaSenha);

    // 4. Atualizar senha no banco (with escola_id for multi-tenancy)
    // CODE REVIEW FIX (Issue #2): Include escola_id in WHERE clause
    await this.prisma.usuario.update({
      where: {
        id: userId,
        escola_id: escolaId, // Multi-tenancy isolation
      },
      data: { senha_hash: hashedPassword },
    });

    // 5. Deletar token do Redis (one-time use - security)
    await this.redisService.del(`reset_password:${dto.token}`);

    // 6. Invalidar todos refresh tokens (force logout em todos dispositivos)
    // CODE REVIEW FIX (Issue #1): Implement refresh token invalidation
    // NOTE: This uses O(n) scan since key pattern is refresh_token:${tokenId} without userId
    //       However, this is acceptable for password reset (rare operation, security-critical)
    try {
      const allRefreshKeys = await this.redisService.keys('refresh_token:*');
      let invalidatedCount = 0;

      // Scan all refresh tokens and invalidate ones belonging to this user
      for (const key of allRefreshKeys) {
        const refreshData = await this.redisService.get(key);
        if (refreshData) {
          try {
            const parsed = JSON.parse(refreshData);
            // Match by userId from token payload
            if (parsed.userId === userId && parsed.escolaId === escolaId) {
              await this.redisService.del(key);
              invalidatedCount++;
            }
          } catch {
            // Legacy token format or invalid JSON - skip
            continue;
          }
        }
      }

      this.logger.log(
        `Invalidated ${invalidatedCount} refresh tokens for user ${userId} (force logout)`,
      );
    } catch (error) {
      // Log error but don't fail password reset if token invalidation fails
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to invalidate refresh tokens: ${errorMessage}`);
    }

    // Audit logging: Success
    this.logger.log(`Password reset successful for user: ${userId}`);

    return {
      message: 'Senha redefinida com sucesso. Faça login com sua nova senha.',
    };
  }

  @Public()
  @Get('validate-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validar token de convite e obter informações pré-visualização',
  })
  @ApiResponse({
    status: 200,
    description: 'Token válido',
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'diretor@escola.com' },
        nome: { type: 'string', example: 'João Silva' },
        escolaNome: { type: 'string', example: 'Escola Teste' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado' })
  async validateToken(
    @Query('token') token: string,
  ): Promise<{ email: string; nome: string; escolaNome: string }> {
    // 1. Validate token format (64 characters hex)
    if (!token || token.length !== 64) {
      throw new UnauthorizedException('Token inválido');
    }

    // 2. Validate token exists in Redis
    const tokenData = await this.redisService.get(`invite_director:${token}`);
    if (!tokenData) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    // 3. Parse token data
    let email: string;
    let escolaId: string;
    let nome: string;
    try {
      const parsed = JSON.parse(tokenData) as {
        email: string;
        escolaId: string;
        nome: string;
      };
      email = parsed.email;
      escolaId = parsed.escolaId;
      nome = parsed.nome;
    } catch (error) {
      throw new UnauthorizedException('Token inválido ou corrompido');
    }

    // 4. Get escola name
    const escola = await this.prisma.escola.findUnique({
      where: { id: escolaId },
      select: { nome: true },
    });

    if (!escola) {
      throw new UnauthorizedException('Escola não encontrada');
    }

    return {
      email,
      nome,
      escolaNome: escola.nome,
    };
  }

  @Public()
  @Post('accept-invitation')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Aceitar convite de diretor e criar senha' })
  @ApiResponse({
    status: 201,
    description: 'Convite aceito com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Convite aceito com sucesso' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado nesta escola' })
  @ApiResponse({ status: 404, description: 'Escola não encontrada' })
  @ApiResponse({ status: 400, description: 'Escola inativa ou senha fraca' })
  async acceptInvitation(
    @Body() dto: AcceptInvitationDto,
  ): Promise<{ message: string }> {
    return this.authService.acceptInvitation(dto);
  }
}
