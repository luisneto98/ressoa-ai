import { Module } from '@nestjs/common';
import { AulasController } from './aulas.controller';
import { AulasService } from './aulas.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AulasController],
  providers: [AulasService],
  exports: [AulasService],
})
export class AulasModule {}
