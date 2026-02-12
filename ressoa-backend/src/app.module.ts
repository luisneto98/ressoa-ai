import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { PlanejamentoModule } from './modules/planejamento/planejamento.module';
import { HabilidadesModule } from './modules/habilidades/habilidades.module';
import { TurmasModule } from './modules/turmas/turmas.module';
import { AulasModule } from './modules/aulas/aulas.module';
import { SttModule } from './modules/stt/stt.module';
import { TestModule } from './modules/test/test.module';
import { ContextModule } from './common/context/context.module';
import { EmailModule } from './common/email/email.module';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { envSchema } from './config/env';

// Conditionally import TusModule only in non-test environments
// This avoids Jest issues with ESM dependencies (@tus/server uses srvx which is ESM-only)
const conditionalImports: DynamicModule[] = [];

if (process.env.NODE_ENV !== 'test') {
  // Dynamic import to avoid loading TUS dependencies in test environment

  const { TusModule } = require('./modules/tus/tus.module');
  conditionalImports.push(TusModule);
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 10, // default global limit
      },
    ]),
    ContextModule, // Global module for multi-tenant context
    EmailModule, // Global module for email service (Story 1.5)
    PrismaModule,
    RedisModule,
    AuthModule,
    AdminModule, // Admin endpoints for school/user management (Story 1.6)
    PlanejamentoModule, // Planejamento CRUD API (Story 2.1)
    HabilidadesModule, // Habilidades BNCC Query API (Story 2.2)
    TurmasModule, // Turmas Query API (Story 2.3 - blocker resolution)
    AulasModule, // Aula Entity & Basic CRUD (Story 3.1)
    SttModule, // STT Service Abstraction Layer (Story 4.1)
    // TUS Upload Server (Story 3.2) - dynamically loaded in non-test environments
    ...conditionalImports,
    // RBAC test endpoints - only load in non-production environments
    ...(process.env.NODE_ENV !== 'production' ? [TestModule] : []),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global Guards - Execution order matters!
    // 1. JwtAuthGuard: Validates JWT and populates request.user
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 2. RolesGuard: Validates user.role based on @Roles decorator
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // 3. ThrottlerGuard: Rate limiting (executes after auth/authz)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global Interceptors
    // TenantInterceptor: Injects escolaId context (executes after guards)
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule {}
