import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { ContextService } from '../context/context.service';

/**
 * TenantInterceptor
 *
 * NestJS interceptor that extracts escolaId from JWT payload and injects it
 * into AsyncLocalStorage context for the duration of the request.
 *
 * Execution Order:
 * 1. Request arrives
 * 2. Guards execute (e.g., JwtAuthGuard validates JWT)
 * 3. JwtAuthGuard populates request.user with JWT payload
 * 4. ** TenantInterceptor executes ** (this interceptor)
 * 5. Extracts escolaId from request.user
 * 6. Wraps handler with contextService.run(escolaId, ...)
 * 7. Controller handler executes within tenant context
 * 8. All downstream code has access to escolaId via contextService
 *
 * Public Endpoints:
 * - If request.user is undefined (no JWT), interceptor allows request to proceed
 * - This enables public endpoints like /auth/login to work without tenant context
 *
 * Admin Users (Story 1.6):
 * - ADMIN users have escolaId = null (do not belong to any school)
 * - TenantInterceptor skips multi-tenancy for ADMIN (escolaId === null)
 * - Admin endpoints have global access across all schools
 *
 * Security:
 * - Part of Story 1.3: Multi-Tenancy Isolation
 * - Ensures every authenticated request has tenant context
 * - Works with Prisma middleware to auto-inject escola_id in queries
 * - Throws UnauthorizedException if authenticated but escolaId missing (data integrity)
 *
 * @example
 * ```typescript
 * // Register globally in AppModule
 * {
 *   provide: APP_INTERCEPTOR,
 *   useClass: TenantInterceptor,
 * }
 * ```
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly contextService: ContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Populated by JwtAuthGuard

    // Skip if no user (public endpoints like login, refresh)
    if (!user) {
      return next.handle();
    }

    // Extract escolaId from JWT payload
    const escolaId = user.escolaId;

    // ADMIN users (Story 1.6): escolaId = null (não pertencem a escola)
    // ADMIN tem acesso global ao sistema sem isolamento de tenant
    // TenantInterceptor deve IGNORAR (skip) quando escolaId = null
    if (escolaId === null) {
      // Admin bypass - sem context de multi-tenancy
      return next.handle();
    }

    // If authenticated but escolaId is undefined (not null, not string), this is a data integrity issue
    // JWT should ALWAYS have escolaId as string (normal user) or null (ADMIN)
    if (escolaId === undefined) {
      // SECURITY LOG: Detect malicious attempts to bypass multi-tenancy
      console.error(
        '[SECURITY] Authenticated request with undefined escolaId',
        {
          userId: user.userId,
          email: user.email,
          timestamp: new Date().toISOString(),
        },
      );

      throw new UnauthorizedException(
        'Escola ID não encontrado no token JWT. Token inválido ou malformado.',
      );
    }

    // Wrap request handling with tenant context
    // All downstream code (controllers, services, Prisma) can access escolaId
    return from(
      this.contextService.run(escolaId, () => firstValueFrom(next.handle())),
    );
  }
}
