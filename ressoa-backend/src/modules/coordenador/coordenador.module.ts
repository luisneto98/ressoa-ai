import { Module } from '@nestjs/common';
import { CoordenadorController } from './coordenador.controller';
import { CoordenadorService } from './coordenador.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { EmailModule } from '../../common/email/email.module';

@Module({
  imports: [PrismaModule, RedisModule, EmailModule],
  controllers: [CoordenadorController],
  providers: [CoordenadorService],
  exports: [CoordenadorService],
})
export class CoordenadorModule {}
