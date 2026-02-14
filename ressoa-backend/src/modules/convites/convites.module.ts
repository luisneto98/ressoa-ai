import { Module } from '@nestjs/common';
import { ConvitesController } from './convites.controller';
import { ConvitesService } from './convites.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [ConvitesController],
  providers: [ConvitesService],
  exports: [ConvitesService],
})
export class ConvitesModule {}
