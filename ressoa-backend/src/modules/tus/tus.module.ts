import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TusController } from './tus.controller';
import { TusService } from './tus.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AulasModule } from '../aulas/aulas.module';

@Module({
  imports: [ConfigModule, PrismaModule, AulasModule],
  controllers: [TusController],
  providers: [TusService],
  exports: [TusService],
})
export class TusModule {}
