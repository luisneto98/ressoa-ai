import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ContextService } from '../common/context/context.service';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    configService: ConfigService,
    private readonly contextService: ContextService,
  ) {
    // Use PrismaPg adapter (required for Prisma v7)
    // Note: PrismaPg adapter does NOT support $use() middleware API
    // For MVP, we rely on PostgreSQL Row-Level Security (RLS) for tenant isolation
    // This is acceptable defense-in-depth: RLS at database level is more secure than app-level
    const adapter = new PrismaPg({
      connectionString: configService.get<string>('DATABASE_URL'),
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();

    // Note: Middleware support via $use() is not available with PrismaPg adapter
    // Multi-tenant isolation is enforced by:
    // 1. PostgreSQL RLS policies (database-level security)
    // 2. TenantInterceptor + ContextService (application-level context tracking)
    // 3. Manual escola_id injection in service methods when needed
    //
    // For MVP, RLS provides sufficient security guarantees.
    // Future enhancement: Migrate to Prisma Accelerate or standard client for middleware support
  }

  /**
   * Get escolaId from current request context
   *
   * Helper method to retrieve the tenant ID from AsyncLocalStorage.
   * Use this in service methods to manually inject escola_id when needed.
   *
   * @returns escolaId string or undefined if no context
   *
   * @example
   * ```typescript
   * const escolaId = this.prisma.getEscolaId();
   * const users = await this.prisma.usuario.findMany({
   *   where: { escola_id: escolaId }
   * });
   * ```
   */
  getEscolaId(): string | undefined {
    return this.contextService.getEscolaId();
  }

  /**
   * Get escolaId or throw error
   *
   * Like getEscolaId() but throws if no context is available.
   * Use when tenant context is required.
   *
   * @returns escolaId string (never undefined)
   * @throws Error if no context available
   */
  getEscolaIdOrThrow(): string {
    return this.contextService.getEscolaIdOrThrow();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
