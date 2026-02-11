import { Module } from '@nestjs/common';
import { HabilidadesService } from './habilidades.service';
import { HabilidadesController } from './habilidades.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';

/**
 * Módulo de Habilidades BNCC
 *
 * Responsabilidades:
 * - Endpoint GET /api/v1/habilidades (query otimizada com cache)
 * - Full-text search (PostgreSQL tsvector)
 * - Filtros combinados (disciplina, serie, unidade_tematica, search)
 * - Redis cache (7 dias TTL - dados estáticos)
 * - RBAC: Professor, Coordenador, Diretor
 *
 * CRITICAL: Habilidades são dados GLOBAIS (sem multi-tenancy)
 */
@Module({
  imports: [
    PrismaModule, // Para queries no banco
    RedisModule,  // Para cache
  ],
  controllers: [HabilidadesController],
  providers: [HabilidadesService],
  exports: [HabilidadesService], // ✅ Exportar para uso em outros módulos (Story 2.3 frontend)
})
export class HabilidadesModule {}
