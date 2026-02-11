import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

/**
 * JWT Authentication Guard with @Public decorator support
 *
 * By default (when registered globally in AppModule), all routes require
 * JWT authentication. Use the @Public decorator to bypass authentication
 * for specific endpoints (e.g., login, refresh).
 *
 * Execution flow:
 * 1. Check if route has @Public decorator
 * 2. If public → Allow access immediately (bypass JWT validation)
 * 3. If not public → Run JWT validation via Passport strategy
 * 4. If JWT valid → Populate request.user and allow access
 * 5. If JWT invalid → Return 401 Unauthorized
 *
 * @example
 * // Public route (no authentication)
 * @Public()
 * @Post('login')
 * login() { ... }
 *
 * @example
 * // Protected route (requires JWT)
 * @Get('profile')
 * getProfile(@CurrentUser() user) { ... }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if route is marked as public using @Public decorator
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // Method level
      context.getClass(), // Controller level
    ]);

    // If route is public, bypass JWT validation
    if (isPublic) {
      return true;
    }

    // Otherwise, execute standard JWT validation
    return super.canActivate(context);
  }
}
