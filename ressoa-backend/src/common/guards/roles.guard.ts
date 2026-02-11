import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleUsuario } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard to enforce role-based access control (RBAC)
 *
 * This guard works in conjunction with the @Roles decorator to restrict
 * endpoint access based on user roles.
 *
 * Execution order (configured in AppModule):
 * 1. JwtAuthGuard validates JWT and populates request.user
 * 2. RolesGuard (this guard) checks @Roles metadata and validates user.role
 * 3. Controller handler executes if allowed
 *
 * Behavior:
 * - If no @Roles decorator: Allows access (any authenticated user)
 * - If @Roles decorator present: Allows only users with matching role
 * - If user or user.role missing: Denies access (guards against auth bypass)
 *
 * @example
 * // In AppModule providers:
 * {
 *   provide: APP_GUARD,
 *   useClass: JwtAuthGuard, // Execute first
 * },
 * {
 *   provide: APP_GUARD,
 *   useClass: RolesGuard, // Execute second
 * }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from @Roles decorator metadata
    // Checks both method-level and class-level decorators
    const requiredRoles = this.reflector.getAllAndOverride<RoleUsuario[]>(
      ROLES_KEY,
      [
        context.getHandler(), // Method level
        context.getClass(), // Controller level
      ],
    );

    // If no @Roles decorator, allow access (no role restriction)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get user from request (populated by JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If user or role is missing, deny access
    // This guards against JWT validation bypasses
    if (!user || !user.role) {
      this.logger.warn('Authorization failed: Missing user or role', {
        path: request.url,
        method: request.method,
        hasUser: !!user,
        hasRole: !!user?.role,
      });
      return false;
    }

    // Validate that role is a valid RoleUsuario enum value
    const validRoles = Object.values(RoleUsuario);
    if (!validRoles.includes(user.role)) {
      this.logger.warn('Authorization failed: Invalid role value', {
        userId: user.userId,
        invalidRole: user.role,
        validRoles,
        path: request.url,
      });
      return false;
    }

    // Check if user's role is in the list of required roles
    const hasRequiredRole = requiredRoles.includes(user.role);

    if (!hasRequiredRole) {
      this.logger.warn('Authorization failed: User lacks required role', {
        userId: user.userId,
        userRole: user.role,
        requiredRoles,
        path: request.url,
        method: request.method,
      });
    }

    return hasRequiredRole;
  }
}
