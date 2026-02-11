import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { TestModule } from './modules/test/test.module';
import { ContextModule } from './common/context/context.module';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { envSchema } from './config/env';

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
    PrismaModule,
    RedisModule,
    AuthModule,
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
