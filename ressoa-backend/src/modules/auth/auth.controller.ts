import {
  Controller,
  Post,
  Get,
  Body,
  UnauthorizedException,
  NotFoundException,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import {
  CurrentUser,
  AuthenticatedUser,
} from './decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto, LogoutResponseDto } from './dto/auth-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  @Public() // Public endpoint - no JWT authentication required
  @Post('login')
  @HttpCode(200) // FIX: Force 200 OK as specified in AC (not 201 default)
  @Throttle({ limit: 20, ttl: 60000 }) // FIX: Simplified syntax for v6+
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
    if (!user.escola) {
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
        escola: {
          id: user.escola.id,
          nome: user.escola.nome,
        },
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
    if (!updatedUser.escola) {
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
        escola: {
          id: updatedUser.escola.id,
          nome: updatedUser.escola.nome,
        },
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
    if (!user.escola) {
      throw new UnauthorizedException('Usuário sem escola associada');
    }

    return {
      id: user.id,
      email: user.email,
      nome: user.nome,
      role: user.perfil_usuario?.role || 'PROFESSOR',
      escola: {
        id: user.escola.id,
        nome: user.escola.nome,
      },
    };
  }
}
