import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { RoleUsuario } from '@prisma/client';

/**
 * Test Controller for RBAC E2E Testing
 *
 * ⚠️ IMPORTANT: This controller is for testing purposes only.
 * These endpoints should be removed or disabled in production.
 *
 * Provides test endpoints with different role restrictions to validate:
 * - @Roles decorator functionality
 * - RolesGuard enforcement
 * - Multi-role endpoint behavior
 * - Public vs protected endpoint behavior
 */
@ApiTags('test')
@Controller('test')
export class TestController {
  constructor() {
    // Fail-safe: Throw error if accidentally deployed to production
    // This provides defense-in-depth if TestModule is not conditionally loaded
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'TestController should not be instantiated in production! ' +
          'Remove TestModule from AppModule imports or set NODE_ENV correctly.',
      );
    }
  }
  /**
   * Endpoint accessible only by PROFESSOR role
   * Used to test single-role restriction
   */
  @Roles(RoleUsuario.PROFESSOR)
  @Get('professor-only')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[TEST] Endpoint acessível apenas por Professor' })
  professorOnly(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: 'Acesso permitido - Professor',
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Endpoint accessible only by COORDENADOR role
   * Used to test single-role restriction for different role
   */
  @Roles(RoleUsuario.COORDENADOR)
  @Get('coordenador-only')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[TEST] Endpoint acessível apenas por Coordenador',
  })
  coordenadorOnly(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: 'Acesso permitido - Coordenador',
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Endpoint accessible by COORDENADOR or DIRETOR roles
   * Used to test multi-role restriction
   */
  @Roles(RoleUsuario.COORDENADOR, RoleUsuario.DIRETOR)
  @Get('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[TEST] Endpoint acessível por Coordenador ou Diretor',
  })
  admin(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: 'Acesso permitido - Admin',
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Endpoint accessible by any authenticated user (no @Roles decorator)
   * Used to test default behavior without role restriction
   */
  @Get('authenticated')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[TEST] Endpoint acessível por qualquer usuário autenticado',
  })
  authenticated(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: 'Acesso permitido - Qualquer autenticado',
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
    };
  }
}
