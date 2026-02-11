import { SetMetadata } from '@nestjs/common';
import { RoleUsuario } from '@prisma/client';

/**
 * Metadata key for storing required roles
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator to protect endpoints by role
 *
 * Marks an endpoint as requiring one or more specific roles.
 * Use with @Roles(RoleUsuario.ROLE_NAME) to restrict access.
 * RolesGuard will enforce these restrictions.
 *
 * @param roles - List of allowed roles for this endpoint
 *
 * @example
 * // Only professors can access
 * @Roles(RoleUsuario.PROFESSOR)
 * @Get('minhas-aulas')
 * getMinhasAulas(@CurrentUser() user) { ... }
 *
 * @example
 * // Coordenadores and Diretores can access
 * @Roles(RoleUsuario.COORDENADOR, RoleUsuario.DIRETOR)
 * @Get('metricas-escola')
 * getMetricas(@CurrentUser() user) { ... }
 *
 * @example
 * // No @Roles decorator = any authenticated user can access
 * @Get('meu-perfil')
 * getPerfil(@CurrentUser() user) { ... }
 */
export const Roles = (...roles: RoleUsuario[]) => SetMetadata(ROLES_KEY, roles);
