import { Module } from '@nestjs/common';
import { DiretorController } from './diretor.controller';
import { DiretorService } from './diretor.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../../redis/redis.module';
import { EmailModule } from '../../common/email/email.module';

@Module({
  imports: [PrismaModule, AuthModule, RedisModule, EmailModule],
  controllers: [DiretorController],
  providers: [DiretorService],
  exports: [DiretorService],
})
export class DiretorModule {}
