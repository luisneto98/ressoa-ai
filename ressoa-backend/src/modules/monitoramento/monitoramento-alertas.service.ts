import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MonitoramentoSTTService } from './monitoramento-stt.service';
import { MonitoramentoAnaliseService } from './monitoramento-analise.service';
import {
  MonitoramentoCustosService,
  CUSTO_ALTO_THRESHOLD_USD,
} from './monitoramento-custos.service';

@Injectable()
export class MonitoramentoAlertasService {
  private readonly logger = new Logger('MonitoramentoAlertas');

  constructor(
    private readonly monitoramentoSTTService: MonitoramentoSTTService,
    private readonly monitoramentoAnaliseService: MonitoramentoAnaliseService,
    private readonly monitoramentoCustosService: MonitoramentoCustosService,
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

  @Cron('0 9 * * *') // Diariamente às 9h UTC
  async verificarCustosAltos(): Promise<void> {
    try {
      const { escolas } = await this.monitoramentoCustosService.getMetricas();
      const escolasAltas = escolas.filter(
        (e) => e.custo_total > CUSTO_ALTO_THRESHOLD_USD,
      );

      if (escolasAltas.length > 0) {
        this.logger.warn(
          `ALERTA CUSTOS: ${escolasAltas.length} escola(s) com custo acima de $${CUSTO_ALTO_THRESHOLD_USD}/mês`,
          {
            escolas: escolasAltas.map((e) => ({
              nome: e.escola_nome,
              custo: e.custo_total,
            })),
          },
        );
      }
    } catch (error) {
      this.logger.error(
        'Falha ao verificar custos altos',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
