import { Module } from '@nestjs/common';
import { TestController } from './test.controller';

/**
 * Test Module for RBAC E2E Testing
 *
 * ⚠️ IMPORTANT: This module is for testing purposes only.
 * It should be removed or disabled in production environments.
 *
 * Provides test endpoints to validate:
 * - Role-based access control (RBAC)
 * - JwtAuthGuard behavior
 * - RolesGuard enforcement
 * - @Roles decorator functionality
 * - @Public decorator functionality
 */
@Module({
  controllers: [TestController],
})
export class TestModule {}
