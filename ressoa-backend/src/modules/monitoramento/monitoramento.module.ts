import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../../prisma/prisma.module';
import { MonitoramentoSTTService } from './monitoramento-stt.service';
import { MonitoramentoAnaliseService } from './monitoramento-analise.service';
import { MonitoramentoAlertasService } from './monitoramento-alertas.service';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({ name: 'analysis-pipeline' }),
  ],
  providers: [
    MonitoramentoSTTService,
    MonitoramentoAnaliseService,
    MonitoramentoAlertasService,
  ],
  exports: [MonitoramentoSTTService, MonitoramentoAnaliseService],
})
export class MonitoramentoModule {}
