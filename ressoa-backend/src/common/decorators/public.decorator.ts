import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for marking routes as public
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark routes as public (no authentication required)
 *
 * By default, all routes are protected by JwtAuthGuard (global guard).
 * Use this decorator to bypass JWT authentication for public endpoints.
 *
 * Common use cases:
 * - Login endpoint: User not yet authenticated
 * - Token refresh endpoint: Uses refresh token instead of access token
 * - Public documentation or health check endpoints
 *
 * @example
 * // Public login endpoint
 * @Public()
 * @Post('login')
 * async login(@Body() loginDto: LoginDto) {
 *   return this.authService.login(loginDto);
 * }
 *
 * @example
 * // Public refresh token endpoint
 * @Public()
 * @Post('refresh')
 * async refresh(@Body() refreshDto: RefreshTokenDto) {
 *   return this.authService.refreshToken(refreshDto.refreshToken);
 * }
 *
 * @example
 * // Protected endpoint (default - no decorator needed)
 * @Get('me')
 * async getProfile(@CurrentUser() user) {
 *   return this.authService.getProfile(user.userId);
 * }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
