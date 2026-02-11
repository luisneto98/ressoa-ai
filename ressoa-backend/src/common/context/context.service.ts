import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * Tenant Context Interface
 * Stores the current tenant (escola) ID for multi-tenant isolation
 */
interface TenantContext {
  escolaId: string;
}

/**
 * ContextService
 *
 * Manages tenant context using Node.js AsyncLocalStorage.
 * This enables implicit context propagation throughout async call chains
 * without explicitly passing escolaId to every function.
 *
 * Usage:
 * ```typescript
 * // Set context (typically in interceptor/middleware)
 * await contextService.run(escolaId, async () => {
 *   // All code here has access to escolaId
 *   await someService.doWork(); // Can call getEscolaId() internally
 * });
 *
 * // Get context anywhere in the call chain
 * const escolaId = contextService.getEscolaId();
 * ```
 *
 * Architecture Context:
 * - Part of Story 1.3: Multi-Tenancy Isolation
 * - Works with TenantInterceptor to inject context from JWT
 * - Works with Prisma middleware to auto-inject escola_id in queries
 * - Enables defense-in-depth security for multi-tenant data isolation
 */
@Injectable()
export class ContextService {
  private readonly als = new AsyncLocalStorage<TenantContext>();

  /**
   * Run callback within tenant context
   *
   * Creates an AsyncLocalStorage context with the given escolaId
   * and executes the callback within that context.
   *
   * @param escolaId - UUID of the escola (tenant)
   * @param callback - Async function to execute with context
   * @returns Promise resolving to callback's return value
   * @throws Re-throws any error thrown by callback
   *
   * @example
   * ```typescript
   * const result = await contextService.run('escola-uuid', async () => {
   *   return await userService.getUsers(); // Has access to escolaId
   * });
   * ```
   */
  run<T>(escolaId: string, callback: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.als.run({ escolaId }, async () => {
        try {
          const result = await callback();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Get current tenant ID from context
   *
   * Returns the escolaId from AsyncLocalStorage if available.
   * Safe to call anywhere in the call chain.
   *
   * @returns escolaId string or undefined if no context
   *
   * @example
   * ```typescript
   * const escolaId = contextService.getEscolaId();
   * if (escolaId) {
   *   // Inside tenant context
   * } else {
   *   // Outside tenant context (e.g., public endpoint)
   * }
   * ```
   */
  getEscolaId(): string | undefined {
    const store = this.als.getStore();
    return store?.escolaId;
  }

  /**
   * Get current tenant ID or throw error
   *
   * Like getEscolaId() but throws an error if no context is available.
   * Use when escolaId is required and absence indicates a bug.
   *
   * @returns escolaId string (never undefined)
   * @throws Error if no context available
   *
   * @example
   * ```typescript
   * // In a service that MUST have tenant context
   * const escolaId = contextService.getEscolaIdOrThrow();
   * // Guaranteed to have escolaId or error was thrown
   * ```
   */
  getEscolaIdOrThrow(): string {
    const escolaId = this.getEscolaId();
    if (!escolaId) {
      throw new Error('Tenant context not available');
    }
    return escolaId;
  }
}
