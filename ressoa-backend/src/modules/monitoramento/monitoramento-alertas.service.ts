import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MonitoramentoSTTService } from './monitoramento-stt.service';
import { MonitoramentoAnaliseService } from './monitoramento-analise.service';

@Injectable()
export class MonitoramentoAlertasService {
  private readonly logger = new Logger('MonitoramentoAlertas');

  constructor(
    private readonly monitoramentoSTTService: MonitoramentoSTTService,
    private readonly monitoramentoAnaliseService: MonitoramentoAnaliseService,
  ) {}

  @Cron('*/15 * * * *')
  async verificarTaxaErroSTT(): Promise<void> {
    try {
      const { taxaErro, erros, total } =
        await this.monitoramentoSTTService.getTaxaErroUltimaHora();

      if (taxaErro > 5) {
        this.logger.warn(
          `ALERTA STT: Taxa de erro ${taxaErro.toFixed(2)}% (${erros}/${total}) na última hora`,
          { taxaErro, erros, total, threshold: 5 },
        );
      }
    } catch (error) {
      this.logger.error(
        'Falha ao verificar taxa de erro STT',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  @Cron('*/15 * * * *')
  async verificarFilaAnalise(): Promise<void> {
    try {
      const waiting =
        await this.monitoramentoAnaliseService.getQueueWaitingCount();

      if (waiting > 50) {
        this.logger.warn(
          `ALERTA ANÁLISE: Fila de análise alta! ${waiting} jobs aguardando processamento. Considere escalar workers.`,
          { waiting, threshold: 50 },
        );
      }
    } catch (error) {
      this.logger.error(
        'Falha ao verificar fila de análise',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
