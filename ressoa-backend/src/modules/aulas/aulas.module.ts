import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AulasController } from './aulas.controller';
import { AulasService } from './aulas.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    // Register transcription queue for async job enqueueing (Story 4.3)
    BullModule.registerQueue({
      name: 'transcription',
    }),
  ],
  controllers: [AulasController],
  providers: [AulasService],
  exports: [AulasService],
})
export class AulasModule {}
