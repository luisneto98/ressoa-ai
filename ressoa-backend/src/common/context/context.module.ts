import { Global, Module } from '@nestjs/common';
import { ContextService } from './context.service';

/**
 * ContextModule
 *
 * Global module that provides ContextService for multi-tenant isolation.
 * Being global means it's automatically available in all other modules
 * without needing explicit imports.
 *
 * Architecture Decision:
 * - Global module to avoid boilerplate imports in every module
 * - ContextService is infrastructure-level, needed everywhere
 * - Part of Story 1.3: Multi-Tenancy Isolation strategy
 *
 * Usage:
 * ```typescript
 * // Import in AppModule only
 * @Module({
 *   imports: [ContextModule],
 * })
 * export class AppModule {}
 *
 * // Use in any service without importing
 * @Injectable()
 * export class SomeService {
 *   constructor(private contextService: ContextService) {}
 * }
 * ```
 */
@Global()
@Module({
  providers: [ContextService],
  exports: [ContextService],
})
export class ContextModule {}
