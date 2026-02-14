import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CoberturaModule } from '../../cobertura/cobertura.module';
import { MonitoramentoModule } from '../monitoramento/monitoramento.module';
import { RedisModule } from '../../redis/redis.module';
import { EmailModule } from '../../common/email/email.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CoberturaModule,
    MonitoramentoModule,
    RedisModule,
    EmailModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
