import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MonitoramentoSTTService } from './monitoramento-stt.service';
import { MonitoramentoAlertasService } from './monitoramento-alertas.service';

@Module({
  imports: [PrismaModule],
  providers: [MonitoramentoSTTService, MonitoramentoAlertasService],
  exports: [MonitoramentoSTTService],
})
export class MonitoramentoModule {}
