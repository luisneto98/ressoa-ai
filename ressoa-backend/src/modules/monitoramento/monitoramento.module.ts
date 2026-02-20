import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../../prisma/prisma.module';
import { MonitoramentoSTTService } from './monitoramento-stt.service';
import { MonitoramentoAnaliseService } from './monitoramento-analise.service';
import { MonitoramentoAlertasService } from './monitoramento-alertas.service';
import { MonitoramentoCustosService } from './monitoramento-custos.service';
import { MonitoramentoPromptsService } from './monitoramento-prompts.service';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({ name: 'analysis-pipeline' }),
  ],
  providers: [
    MonitoramentoSTTService,
    MonitoramentoAnaliseService,
    MonitoramentoAlertasService,
    MonitoramentoCustosService,
    MonitoramentoPromptsService,
  ],
  exports: [
    MonitoramentoSTTService,
    MonitoramentoAnaliseService,
    MonitoramentoCustosService,
    MonitoramentoPromptsService,
  ],
})
export class MonitoramentoModule {}
