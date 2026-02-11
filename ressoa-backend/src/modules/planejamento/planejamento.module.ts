import { Module } from '@nestjs/common';
import { PlanejamentoController } from './planejamento.controller';
import { PlanejamentoService } from './planejamento.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PlanejamentoController],
  providers: [PlanejamentoService],
  exports: [PlanejamentoService],
})
export class PlanejamentoModule {}
