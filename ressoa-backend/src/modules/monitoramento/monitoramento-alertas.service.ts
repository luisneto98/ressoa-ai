import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MonitoramentoSTTService } from './monitoramento-stt.service';

@Injectable()
export class MonitoramentoAlertasService {
  private readonly logger = new Logger('MonitoramentoAlertas');

  constructor(
    private readonly monitoramentoSTTService: MonitoramentoSTTService,
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
}
