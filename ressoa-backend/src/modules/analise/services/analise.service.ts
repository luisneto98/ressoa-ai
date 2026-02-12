import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PromptService } from '../../llm/services/prompt.service';
import { ClaudeProvider } from '../../llm/providers/claude.provider';
import { GPTProvider } from '../../llm/providers/gpt.provider';
import { LLMProvider } from '../../llm/interfaces/llm-provider.interface';
import { Analise } from '@prisma/client';

/**
 * Orquestrador do pipeline serial de 5 prompts para análise pedagógica.
 *
 * Este serviço implementa o CORE do MOAT técnico: executa 5 prompts LLM sequencialmente,
 * cada um vendo os outputs dos anteriores (context accumulation pattern).
 *
 * **Custo target:** ~$0.08-0.12 por aula (50min)
 * **Tempo target:** ~45-60s (5 prompts seriais)
 * **Qualidade target:** >90% dos relatórios usáveis sem edição significativa
 *
 * **Provider Selection Strategy:**
 * - Claude Sonnet: Prompts 1, 2, 3, 5 (pedagogical reasoning)
 * - GPT-4 mini: Prompt 4 (exercise generation - 20x cheaper)
 *
 * @see _bmad-output/planning-artifacts/estrategia-prompts-ia-2026-02-08.md
 */
@Injectable()
export class AnaliseService {
  private readonly logger = new Logger(AnaliseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly promptService: PromptService,
    @Inject('CLAUDE_PROVIDER') private readonly claudeProvider: ClaudeProvider,
    @Inject('GPT_PROVIDER') private readonly gptProvider: GPTProvider,
  ) {}

  /**
   * Executa pipeline completo de análise pedagógica em uma aula.
   *
   * **Pipeline Flow:**
   * 1. Load aula + transcricao + planejamento
   * 2. Execute Prompt 1 (Cobertura BNCC) → add to context
   * 3. Execute Prompt 2 (Análise Qualitativa) → add to context
   * 4. Execute Prompt 3 (Geração de Relatório)
   * 5. Execute Prompt 4 (Geração de Exercícios)
   * 6. Execute Prompt 5 (Detecção de Alertas)
   * 7. Save Analise entity
   * 8. Update Aula status → ANALISADA
   *
   * @param aulaId ID da aula a ser analisada
   * @returns Analise entity com outputs dos 5 prompts
   * @throws NotFoundException se aula ou transcrição não existir
   */
  async analisarAula(aulaId: string): Promise<Analise> {
    this.logger.log(`Iniciando análise pedagógica: aulaId=${aulaId}`);
    const startTime = Date.now();

    // 0. CRITICAL FIX: Validate all required prompts exist BEFORE executing any
    const requiredPrompts = [
      'prompt-cobertura',
      'prompt-qualitativa',
      'prompt-relatorio',
      'prompt-exercicios',
      'prompt-alertas',
    ];

    this.logger.log('Validando existência de prompts necessários...');
    await Promise.all(
      requiredPrompts.map(async (nome) => {
        const prompt = await this.promptService.getActivePrompt(nome);
        if (!prompt) {
          throw new NotFoundException(`Prompt obrigatório não encontrado: ${nome}`);
        }
      }),
    );

    // 1. Buscar dados necessários
    const aula = await this.prisma.aula.findUnique({
      where: { id: aulaId },
      include: {
        transcricao: true,
        planejamento: {
          include: {
            habilidades: {
              include: { habilidade: true },
            },
          },
        },
        turma: true,
      },
    });

    if (!aula) {
      throw new NotFoundException(`Aula não encontrada: ${aulaId}`);
    }

    if (!aula.transcricao) {
      throw new NotFoundException(
        `Aula sem transcrição: ${aulaId}. Status: ${aula.status_processamento}`,
      );
    }

    // 2. Construir contexto inicial (inputs para pipeline)
    const contexto: any = {
      transcricao: aula.transcricao.texto,
      turma: {
        nome: aula.turma.nome,
        disciplina: aula.turma.disciplina,
        serie: aula.turma.serie,
      },
      planejamento: aula.planejamento
        ? {
            habilidades: aula.planejamento.habilidades.map((ph) => ({
              codigo: ph.habilidade.codigo,
              descricao: ph.habilidade.descricao,
              unidade_tematica: ph.habilidade.unidade_tematica,
            })),
          }
        : null,
    };

    let custoTotal = 0;
    const promptVersoes: any = {};

    try {
      // 3. PROMPT 1: Análise de Cobertura BNCC
      this.logger.log('Executando Prompt 1: Cobertura BNCC');
      const {
        output: coberturaOutput,
        custo: custo1,
        versao: versao1,
      } = await this.executePrompt('prompt-cobertura', contexto, this.claudeProvider);
      contexto.cobertura = coberturaOutput;
      custoTotal += custo1;
      promptVersoes.cobertura = versao1;

      // 4. PROMPT 2: Análise Qualitativa
      this.logger.log('Executando Prompt 2: Análise Qualitativa');
      const {
        output: qualitativaOutput,
        custo: custo2,
        versao: versao2,
      } = await this.executePrompt('prompt-qualitativa', contexto, this.claudeProvider);
      contexto.analise_qualitativa = qualitativaOutput;
      custoTotal += custo2;
      promptVersoes.qualitativa = versao2;

      // 5. PROMPT 3: Geração de Relatório
      this.logger.log('Executando Prompt 3: Geração de Relatório');
      const {
        output: relatorioOutput,
        custo: custo3,
        versao: versao3,
      } = await this.executePrompt('prompt-relatorio', contexto, this.claudeProvider);
      custoTotal += custo3;
      promptVersoes.relatorio = versao3;

      // 6. PROMPT 4: Geração de Exercícios (GPT-4 mini - cost optimization)
      this.logger.log('Executando Prompt 4: Geração de Exercícios (GPT mini)');
      const {
        output: exerciciosOutput,
        custo: custo4,
        versao: versao4,
      } = await this.executePrompt('prompt-exercicios', contexto, this.gptProvider);
      custoTotal += custo4;
      promptVersoes.exercicios = versao4;

      // 7. PROMPT 5: Detecção de Alertas
      this.logger.log('Executando Prompt 5: Detecção de Alertas');
      const {
        output: alertasOutput,
        custo: custo5,
        versao: versao5,
      } = await this.executePrompt('prompt-alertas', contexto, this.claudeProvider);
      custoTotal += custo5;
      promptVersoes.alertas = versao5;

      // 8. CRITICAL FIX: Wrap Analise creation + Aula update in transaction
      const analise = await this.prisma.$transaction(async (tx) => {
        // 8a. Salvar análise completa
        const novaAnalise = await tx.analise.create({
          data: {
            aula_id: aulaId,
            transcricao_id: aula.transcricao.id,
            planejamento_id: aula.planejamento?.id,
            cobertura_json: coberturaOutput,
            analise_qualitativa_json: qualitativaOutput,
            relatorio_texto: relatorioOutput,
            exercicios_json: exerciciosOutput,
            alertas_json: alertasOutput,
            prompt_versoes_json: promptVersoes,
            custo_total_usd: custoTotal,
            tempo_processamento_ms: Date.now() - startTime,
          },
        });

        // 8b. Atualizar aula: status → ANALISADA (atomic with analise creation)
        await tx.aula.update({
          where: { id: aulaId },
          data: {
            status_processamento: 'ANALISADA',
          },
        });

        return novaAnalise;
      });

      const tempoTotal = Date.now() - startTime;
      this.logger.log(
        `Análise concluída: aulaId=${aulaId}, custo=$${custoTotal.toFixed(4)}, tempo=${tempoTotal}ms`,
      );

      return analise;
    } catch (error) {
      this.logger.error(`Erro ao analisar aula: aulaId=${aulaId}`, error.stack);
      throw error;
    }
  }

  /**
   * Executa um prompt individual do pipeline.
   *
   * **Context Accumulation Pattern:**
   * - Cada prompt recebe contexto com outputs dos prompts anteriores
   * - Permite análise progressivamente mais profunda e coerente
   *
   * **A/B Testing:**
   * - PromptService.getActivePrompt() automaticamente seleciona versão A ou B
   * - Se A/B testing habilitado, faz split 50/50 entre versões
   *
   * @param nomePrompt Nome do prompt (e.g., "prompt-cobertura")
   * @param contexto Objeto com variáveis para renderizar no prompt
   * @param provider Provider LLM a ser usado (ClaudeProvider ou GPTProvider)
   * @returns {{ output: object | string, custo: number, versao: string }}
   *   - output: JSON object para prompts 1,2,4,5 | Markdown string para prompt 3
   *   - custo: Custo em USD para esta execução do prompt
   *   - versao: Versão do prompt utilizada (e.g., "v1.0.0")
   * @private
   */
  private async executePrompt(
    nomePrompt: string,
    contexto: any,
    provider: LLMProvider,
  ): Promise<{ output: any; custo: number; versao: string }> {
    try {
      // 1. Buscar prompt ativo (com A/B testing se habilitado)
      const prompt = await this.promptService.getActivePrompt(nomePrompt);

      this.logger.log(
        `Executando prompt: ${nomePrompt} v${prompt.versao}, provider=${provider.getName()}`,
      );

      // 2. Renderizar prompt com variáveis do contexto
      const promptRendered = await this.promptService.renderPrompt(prompt, contexto);

      // 3. Executar LLM
      const result = await provider.generate(promptRendered, {
        temperature: 0.7,
        maxTokens: 4000,
      });

      // 4. Parse JSON output (assumindo que prompts retornam JSON)
      let output;
      try {
        output = JSON.parse(result.texto);
      } catch {
        // Se não é JSON, retornar texto puro (Prompt 3 - Relatório em markdown)
        output = result.texto;
      }

      // MEDIUM FIX: Log individual prompt metrics for debugging and cost monitoring
      this.logger.log(
        `Prompt ${nomePrompt} concluído: versao=${prompt.versao}, custo=$${result.custo_usd.toFixed(4)}, ` +
        `tokens_in=${result.tokens_entrada}, tokens_out=${result.tokens_saida}`,
      );

      return {
        output,
        custo: result.custo_usd,
        versao: prompt.versao,
      };
    } catch (error) {
      this.logger.error(
        `Erro em executePrompt: prompt=${nomePrompt}, provider=${provider.getName()}`,
        error.stack,
      );
      throw error;
    }
  }
}
