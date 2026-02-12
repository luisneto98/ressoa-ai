import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';

/**
 * Processador de jobs de feedback (implícito e explícito).
 *
 * **Story 6.2:** Processa diffs de edição e motivos de rejeição para
 * alimentar loop de melhoria contínua dos prompts.
 *
 * **Jobs:**
 * - `calculate-report-diff`: Calcula diff entre original e editado (feedback implícito)
 * - `analyze-rejection`: Analisa motivo de rejeição (feedback explícito)
 *
 * **Future Implementation (Story 6.2+):**
 * - Armazenar diffs em tabela FeedbackImplicito
 * - Usar @sanity/diff-match-patch para cálculo preciso de diffs
 * - Análise de motivos com LLM para extrair padrões
 * - Agregar feedback para A/B testing de prompts
 *
 * @see _bmad-output/planning-artifacts/estrategia-prompts-ia-2026-02-08.md
 */
@Processor('feedback-queue')
export class FeedbackProcessor {
  private readonly logger = new Logger(FeedbackProcessor.name);

  /**
   * Processa job de cálculo de diff entre relatório original e editado.
   *
   * **Story 6.2 (MVP):** Log stub para demonstração
   * **Story 6.2+ (Future):**
   * - Calcular diff real usando @sanity/diff-match-patch
   * - Armazenar em tabela FeedbackImplicito
   * - Usar diff para treinar/refinar prompts via A/B testing
   *
   * **Métricas target:**
   * - Tempo de revisão < 5 minutos = prompt de qualidade
   * - Diff pequeno (< 10% do texto) = prompt preciso
   *
   * @param job Job Bull com data: { analise_id, original, editado }
   * @returns Promise<{ success: boolean, analise_id: string }>
   */
  @Process('calculate-report-diff')
  async handleReportDiff(job: Job) {
    const { analise_id, original, editado } = job.data;

    this.logger.log(`Calculando diff para análise ${analise_id}`);

    // TODO Story 6.2+: Implementar cálculo real de diff usando @sanity/diff-match-patch
    // TODO: Armazenar diff em tabela FeedbackImplicito
    // TODO: Usar diff para treinar/refinar prompts via A/B testing

    // STUB: Log para demonstração
    const diffChars = editado.length - original.length;
    this.logger.log(
      `Diff calculado (stub) - ${Math.abs(diffChars)} caracteres de diferença (${diffChars > 0 ? 'adicionados' : 'removidos'})`,
    );

    return { success: true, analise_id };
  }

  /**
   * Processa job de análise de motivo de rejeição.
   *
   * **Story 6.2 (MVP):** Log stub para demonstração
   * **Story 6.2+ (Future):**
   * - Implementar análise de motivo de rejeição com LLM
   * - Armazenar em tabela FeedbackExplicito
   * - Usar motivo para identificar padrões de falha nos prompts
   * - Agrupar motivos similares para priorizar melhorias
   *
   * **Métricas target:**
   * - Taxa de aprovação > 80% (poucos rejeitados)
   * - Motivos agrupados para identificar problemas recorrentes
   *
   * @param job Job Bull com data: { analise_id, motivo, aula_id }
   * @returns Promise<{ success: boolean, analise_id: string, motivo: string }>
   */
  @Process('analyze-rejection')
  async handleRejection(job: Job) {
    const { analise_id, motivo, aula_id } = job.data;

    this.logger.log(`Analisando rejeição para análise ${analise_id}`);

    // TODO Story 6.2+: Implementar análise de motivo de rejeição
    // TODO: Armazenar em tabela FeedbackExplicito
    // TODO: Usar motivo para identificar padrões de falha nos prompts

    // STUB: Log para demonstração
    this.logger.log(`Feedback explícito registrado (stub): "${motivo.substring(0, 100)}..."`);

    return { success: true, analise_id, motivo };
  }
}
