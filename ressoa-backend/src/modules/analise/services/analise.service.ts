import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { jsonrepair } from 'jsonrepair';
import { PrismaService } from '../../../prisma/prisma.service';
import { PromptService } from '../../llm/services/prompt.service';
import { LLMRouterService } from '../../llm/services/llm-router.service';
import { LLMAnalysisType } from '../../../config/providers.config';
import { Analise, StatusAnalise } from '@prisma/client';
import type { SpeakerStats } from '../../stt/interfaces/diarization.interface';

interface TranscricaoMetadataJson {
  has_diarization?: boolean;
  speaker_stats?: SpeakerStats;
  [key: string]: unknown;
}

interface ContextoPedagogico {
  objetivo_geral: string;
  publico_alvo: string;
  metodologia: string;
  carga_horaria_total: number;
}

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
 * - Config-driven via providers.config.json (Story 14.4)
 * - LLMRouterService handles primary/fallback selection per analysis type
 *
 * @see _bmad-output/planning-artifacts/estrategia-prompts-ia-2026-02-08.md
 */
@Injectable()
export class AnaliseService {
  private readonly logger = new Logger(AnaliseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly promptService: PromptService,
    private readonly llmRouterService: LLMRouterService,
    @InjectQueue('feedback-queue') private readonly feedbackQueue: Queue,
  ) {}

  /**
   * Extrai e parseia JSON de markdown code fences.
   *
   * **Input examples:**
   * - "```json\n{\"key\": \"value\"}\n```" → {key: "value"}
   * - "{\"key\": \"value\"}" → {key: "value"}
   * - "Some text\n```json\n{\"key\": \"value\"}\n```\nMore text" → {key: "value"}
   *
   * @param output Raw LLM output (pode conter markdown)
   * @returns Parsed JSON object
   * @throws Error se JSON inválido
   */
  private parseMarkdownJSON(output: string | any): any {
    // If already an object, return as-is (for tests or pre-parsed data)
    if (typeof output !== 'string') {
      return output;
    }

    // Remove markdown code fences if present (handles both complete and truncated fences)
    const jsonMatch = output.match(/```(?:json)?\s*\n?([\s\S]*?)(?:\n?```|$)/);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : output.trim();

    // 1st attempt: parse directly
    try {
      return JSON.parse(jsonString);
    } catch (parseError) {
      // 2nd attempt: jsonrepair (handles truncated output, missing commas, trailing content)
      try {
        this.logger.warn({
          message:
            'JSON parse failed — attempting jsonrepair (likely truncated LLM output)',
          parseError:
            parseError instanceof Error ? parseError.message : 'Unknown',
          outputLength: output.length,
          outputPreview: output.substring(0, 200),
        });
        const repaired = jsonrepair(jsonString);
        const result = JSON.parse(repaired);
        this.logger.warn({
          message:
            'jsonrepair succeeded — check max_tokens config for this prompt',
        });
        return result;
      } catch (repairError) {
        this.logger.error({
          message: 'Failed to parse LLM JSON output (even after jsonrepair)',
          output: output.substring(0, 500),
          parseError:
            parseError instanceof Error ? parseError.message : 'Unknown',
          repairError:
            repairError instanceof Error ? repairError.message : 'Unknown',
        });
        throw new Error(
          `Invalid JSON from LLM: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        );
      }
    }
  }

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
    const startTime = Date.now();
    this.logger.log({
      message: 'Iniciando análise pedagógica',
      aula_id: aulaId,
    });

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
          throw new NotFoundException(
            `Prompt obrigatório não encontrado: ${nome}`,
          );
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
            // LEGACY: Habilidades BNCC (mantém para backward compat)
            habilidades: {
              include: { habilidade: true },
            },
            // NEW (Story 11.7): Objetivos genéricos (BNCC ou custom)
            objetivos: {
              include: {
                objetivo: true,
              },
            },
          },
        },
        turma: {
          include: {
            escola: true, // Para obter contexto pedagógico se custom
          },
        },
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
    // Determinar tipo de currículo
    const isCurriculoCustom = aula.turma.curriculo_tipo === 'CUSTOM';

    const contexto: any = {
      transcricao: aula.transcricao.texto,
      turma: {
        nome: aula.turma.nome,
        disciplina: aula.turma.disciplina,
        serie: aula.turma.serie,
      },
      // STORY 10.6: Adicionar contexto de tipo_ensino para adaptar prompts EM vs EF
      tipo_ensino: aula.turma.tipo_ensino || 'FUNDAMENTAL', // Default EF (backward compat)
      nivel_ensino: this.getNivelEnsino(aula.turma.tipo_ensino),
      faixa_etaria: this.getFaixaEtaria(
        aula.turma.tipo_ensino,
        aula.turma.serie,
      ),
      ano_serie: this.formatarSerie(aula.turma.serie),
      // CRITICAL FIX (Code Review): Add top-level serie/disciplina for template conditionals
      // Templates use {{#if (eq serie 'TERCEIRO_ANO_EM')}} and {{#if (eq disciplina 'LINGUA_PORTUGUESA')}}
      serie: aula.turma.serie,
      disciplina: aula.turma.disciplina,

      // NEW (Story 11.7): Contexto de currículo
      curriculo_tipo: aula.turma.curriculo_tipo, // 'BNCC' | 'CUSTOM'

      // Se custom, incluir contexto pedagógico
      // CRITICAL FIX (Code Review HIGH-3): Validate contexto_pedagogico exists for CUSTOM
      contexto_pedagogico: isCurriculoCustom
        ? (() => {
            if (!aula.turma.contexto_pedagogico) {
              throw new NotFoundException(
                `Turma CUSTOM sem contexto_pedagógico definido: ${aula.turma.id}. ` +
                  `Configure objetivo_geral, publico_alvo, metodologia e carga_horaria_total.`,
              );
            }
            const contexto = aula.turma
              .contexto_pedagogico as unknown as ContextoPedagogico;
            return {
              objetivo_geral: contexto.objetivo_geral,
              publico_alvo: contexto.publico_alvo,
              metodologia: contexto.metodologia,
              carga_horaria_total: contexto.carga_horaria_total,
            };
          })()
        : null,

      // Objetivos de aprendizagem (adapta formato BNCC vs custom)
      planejamento: this.buildPlanejamentoContext(
        aula.planejamento,
        isCurriculoCustom,
      ),

      // STORY 15.6: Diarization metadata for SRT-aware prompts
      ...(aula.transcricao.metadata_json &&
        (() => {
          const meta = aula.transcricao
            .metadata_json as TranscricaoMetadataJson;
          return {
            has_diarization: meta.has_diarization || false,
            speaker_stats: meta.speaker_stats || null,
          };
        })()),
    };

    const custoStt = aula.transcricao.custo_usd ?? 0;
    let custoTotal = custoStt; // Começa com custo STT, acumula LLM
    const promptVersoes: any = {};

    try {
      // 3. PROMPT 1: Análise de Cobertura BNCC
      this.logger.log('Executando Prompt 1: Cobertura BNCC');
      const {
        output: coberturaOutput,
        custo: custo1,
        versao: versao1,
        provider: prov1,
      } = await this.executePrompt(
        'prompt-cobertura',
        contexto,
        'analise_cobertura',
      );
      contexto.cobertura = coberturaOutput;
      custoTotal += custo1;
      promptVersoes.cobertura = versao1;

      // 4. PROMPT 2: Análise Qualitativa
      this.logger.log('Executando Prompt 2: Análise Qualitativa');
      const {
        output: qualitativaOutput,
        custo: custo2,
        versao: versao2,
        provider: prov2,
      } = await this.executePrompt(
        'prompt-qualitativa',
        contexto,
        'analise_qualitativa',
      );
      contexto.analise_qualitativa = qualitativaOutput;
      custoTotal += custo2;
      promptVersoes.qualitativa = versao2;

      // 5. PROMPT 3: Geração de Relatório
      this.logger.log('Executando Prompt 3: Geração de Relatório');
      const {
        output: relatorioOutput,
        custo: custo3,
        versao: versao3,
        provider: prov3,
      } = await this.executePrompt('prompt-relatorio', contexto, 'relatorio');
      custoTotal += custo3;
      promptVersoes.relatorio = versao3;

      // 6. PROMPT 4: Geração de Exercícios (config-driven provider)
      this.logger.log('Executando Prompt 4: Geração de Exercícios');
      const {
        output: exerciciosOutput,
        custo: custo4,
        versao: versao4,
        provider: prov4,
      } = await this.executePrompt('prompt-exercicios', contexto, 'exercicios');
      custoTotal += custo4;
      promptVersoes.exercicios = versao4;

      // 7. PROMPT 5: Detecção de Alertas
      this.logger.log('Executando Prompt 5: Detecção de Alertas');
      const {
        output: alertasOutput,
        custo: custo5,
        versao: versao5,
        provider: prov5,
      } = await this.executePrompt('prompt-alertas', contexto, 'alertas');
      custoTotal += custo5;
      promptVersoes.alertas = versao5;

      // 8. CRITICAL FIX: Wrap Analise creation + Aula update in transaction
      const analise = await this.prisma.$transaction(async (tx) => {
        // 8a. Salvar análise completa (parse markdown-wrapped JSON before saving)
        const novaAnalise = await tx.analise.create({
          data: {
            aula_id: aulaId,
            transcricao_id: aula.transcricao!.id,
            planejamento_id: aula.planejamento?.id,
            cobertura_json: this.parseMarkdownJSON(coberturaOutput),
            analise_qualitativa_json: this.parseMarkdownJSON(qualitativaOutput),
            relatorio_texto: relatorioOutput, // Keep as string (markdown text)
            exercicios_json: this.parseMarkdownJSON(exerciciosOutput),
            alertas_json: this.parseMarkdownJSON(alertasOutput),
            prompt_versoes_json: promptVersoes,
            custo_total_usd: custoTotal, // STT + 5 prompts LLM
            tempo_processamento_ms: Date.now() - startTime,
            // STT cost (denormalizado de Transcricao para facilitar queries)
            provider_stt: aula.transcricao!.provider,
            custo_stt_usd: custoStt,
            // Provider cost breakdown (Story 14.4)
            provider_llm_cobertura: prov1,
            custo_llm_cobertura_usd: custo1,
            provider_llm_qualitativa: prov2,
            custo_llm_qualitativa_usd: custo2,
            provider_llm_relatorio: prov3,
            custo_llm_relatorio_usd: custo3,
            provider_llm_exercicios: prov4,
            custo_llm_exercicios_usd: custo4,
            provider_llm_alertas: prov5,
            custo_llm_alertas_usd: custo5,
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
      const custoLlm = custoTotal - custoStt;
      this.logger.log({
        message: 'Análise pedagógica concluída',
        aula_id: aulaId,
        tipo_ensino: aula.turma.tipo_ensino || 'FUNDAMENTAL',
        serie: aula.turma.serie,
        faixa_etaria: contexto.faixa_etaria,
        custo_stt_usd: parseFloat(custoStt.toFixed(4)),
        custo_llm_usd: parseFloat(custoLlm.toFixed(4)),
        custo_total_usd: parseFloat(custoTotal.toFixed(4)),
        tempo_total_ms: tempoTotal,
        prompts_executados: 5,
      });

      return analise;
    } catch (error) {
      this.logger.error(
        `Erro ao analisar aula: aulaId=${aulaId}`,
        error instanceof Error ? error.stack : String(error),
      );
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
   * @param analysisType Tipo de análise para roteamento de provider (e.g., 'analise_cobertura')
   * @returns {{ output: object | string, custo: number, versao: string, provider: string }}
   *   - output: JSON object para prompts 1,2,4,5 | Markdown string para prompt 3
   *   - custo: Custo em USD para esta execução do prompt
   *   - versao: Versão do prompt utilizada (e.g., "v1.0.0")
   *   - provider: Provider usado (e.g., "Gemini", "Claude")
   * @private
   */
  private async executePrompt(
    nomePrompt: string,
    contexto: any,
    analysisType: LLMAnalysisType,
  ): Promise<{ output: any; custo: number; versao: string; provider: string }> {
    try {
      // 1. Buscar prompt ativo (com A/B testing se habilitado)
      const prompt = await this.promptService.getActivePrompt(nomePrompt);

      this.logger.log(
        `Executando prompt: ${nomePrompt} v${prompt.versao}, analysisType=${analysisType}`,
      );

      // 2. Renderizar prompt com variáveis do contexto
      const promptRendered = await this.promptService.renderPrompt(
        prompt,
        contexto,
      );

      // 3. Executar LLM via router (fallback + timeout + logging handled by router)
      // Use temperature/maxTokens from prompt config (variaveis) instead of hardcoded values
      const promptVars = prompt.variaveis as Record<string, any> | null;
      const temperature = promptVars?.temperature ?? 0.7;
      const maxTokens = promptVars?.max_tokens ?? 4000;

      const result = await this.llmRouterService.generateWithFallback(
        analysisType,
        promptRendered,
        { temperature, maxTokens },
      );

      // 4. Parse JSON output (assumindo que prompts retornam JSON)
      let output;
      try {
        output = JSON.parse(result.texto);
      } catch {
        // Se não é JSON, retornar texto puro (Prompt 3 - Relatório em markdown)
        output = result.texto;
      }

      this.logger.log(
        `Prompt ${nomePrompt} concluído: versao=${prompt.versao}, provider=${result.provider}, custo=$${result.custo_usd.toFixed(4)}, ` +
          `tokens_in=${result.tokens_input}, tokens_out=${result.tokens_output}`,
      );

      return {
        output,
        custo: result.custo_usd,
        versao: prompt.versao,
        provider: result.provider,
      };
    } catch (error) {
      this.logger.error(
        `Erro em executePrompt: prompt=${nomePrompt}, analysisType=${analysisType}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Busca análise completa de uma aula por aula_id.
   *
   * Carrega análise com todas as relações necessárias para visualização:
   * - Aula (com turma e professor)
   * - Transcrição
   * - Planejamento (se existir)
   *
   * **Story 6.1:** Endpoint GET /api/v1/aulas/:id/analise
   *
   * @param aulaId ID da aula
   * @returns Analise com relações carregadas ou null se não existir
   */
  async findByAulaId(aulaId: string) {
    const escolaId = this.prisma.getEscolaIdOrThrow();

    return this.prisma.analise.findFirst({
      where: {
        aula_id: aulaId,
        aula: {
          escola_id: escolaId, // ✅ CRITICAL FIX: Multi-tenancy enforcement
        },
      },
      include: {
        aula: {
          include: {
            turma: {
              select: {
                id: true,
                nome: true,
                disciplina: true,
                serie: true,
                tipo_ensino: true,
                curriculo_tipo: true, // ✅ Story 11.9: Include curriculo_tipo for adaptive rendering
                contexto_pedagogico: true, // ✅ Story 11.9: For custom turmas
              },
            },
            professor: {
              select: { id: true, nome: true, email: true },
            },
          },
        },
        transcricao: {
          select: { id: true, texto: true },
        },
        planejamento: {
          select: { id: true, bimestre: true },
        },
      },
    });
  }

  /**
   * Busca análise por ID com validação de multi-tenancy.
   *
   * **Story 6.2:** Usado para validar permissões antes de editar/aprovar
   *
   * @param analiseId ID da análise
   * @returns Analise com relações carregadas ou null se não existir
   */
  async findOne(analiseId: string) {
    const escolaId = this.prisma.getEscolaIdOrThrow();

    return this.prisma.analise.findFirst({
      where: {
        id: analiseId,
        aula: {
          escola_id: escolaId, // ✅ Multi-tenancy enforcement
        },
      },
      include: {
        aula: {
          include: {
            turma: true,
            professor: {
              select: { id: true, nome: true, email: true },
            },
          },
        },
      },
    });
  }

  /**
   * Atualiza campos de uma análise.
   *
   * **Story 6.2:** Usado para salvar edições, aprovação e rejeição
   *
   * @param analiseId ID da análise
   * @param data Dados parciais a serem atualizados
   * @returns Análise atualizada
   */
  async update(
    analiseId: string,
    data: {
      relatorio_editado?: string;
      exercicios_editado?: any; // ✅ Story 6.3: Support for editing exercises
      status?: StatusAnalise;
      aprovado_em?: Date;
      rejeitado_em?: Date;
      motivo_rejeicao?: string;
      tempo_revisao?: number;
    },
  ) {
    const escolaId = this.prisma.getEscolaIdOrThrow();

    // ✅ Multi-tenancy: Verificar se análise pertence à escola
    const analise = await this.findOne(analiseId);
    if (!analise) {
      throw new NotFoundException('Análise não encontrada');
    }

    return this.prisma.analise.update({
      where: { id: analiseId },
      data,
    });
  }

  /**
   * Enfileira job Bull para calcular diff entre relatório original e editado.
   *
   * **Story 6.2:** Feedback implícito para melhorar prompts
   *
   * **Job data:**
   * - analise_id: ID da análise
   * - original: Texto original (relatorio_texto)
   * - editado: Texto editado (relatorio_editado)
   *
   * **Job processing:**
   * - Calcula diff usando @sanity/diff-match-patch
   * - Armazena em tabela FeedbackImplicito (Story 6.2+)
   * - Usa diff para A/B testing e refine de prompts
   *
   * @param data Dados do job { analise_id, original, editado }
   * @returns Job enfileirado
   */
  async enqueueReportDiff(data: {
    analise_id: string;
    original: string;
    editado: string;
  }) {
    return this.feedbackQueue.add('calculate-report-diff', data, {
      priority: 2, // Regular priority
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  /**
   * Enfileira job Bull para analisar motivo de rejeição.
   *
   * **Story 6.2:** Feedback explícito para melhorar prompts
   *
   * **Job data:**
   * - analise_id: ID da análise rejeitada
   * - motivo: Texto do motivo de rejeição
   * - aula_id: ID da aula (para carregar contexto se necessário)
   *
   * **Job processing:**
   * - Analisa motivo com LLM para extrair padrões
   * - Armazena em tabela FeedbackExplicito (Story 6.2+)
   * - Identifica problemas recorrentes nos prompts
   *
   * @param data Dados do job { analise_id, motivo, aula_id }
   * @returns Job enfileirado
   */
  async enqueueRejectionAnalysis(data: {
    analise_id: string;
    motivo: string;
    aula_id: string;
  }) {
    return this.feedbackQueue.add('analyze-rejection', data, {
      priority: 1, // High priority (feedback is critical)
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  /**
   * Retorna nível de ensino formatado baseado em tipo_ensino.
   *
   * **Story 10.6:** Adapta prompts para EM vs EF
   *
   * @param tipoEnsino - Tipo de ensino da turma ('FUNDAMENTAL' ou 'MEDIO')
   * @returns String formatada ("Ensino Médio" ou "Ensino Fundamental")
   * @private
   */
  private getNivelEnsino(tipoEnsino?: string): string {
    return tipoEnsino === 'MEDIO' ? 'Ensino Médio' : 'Ensino Fundamental';
  }

  /**
   * Mapeia serie enum para faixa etária apropriada.
   *
   * **Story 10.6:** Usado nos prompts para adaptar linguagem e complexidade
   *
   * @param tipoEnsino - Tipo de ensino ('FUNDAMENTAL' ou 'MEDIO')
   * @param serie - Série enum (ex: 'SEXTO_ANO', 'PRIMEIRO_ANO_EM')
   * @returns Faixa etária (ex: "14-17 anos", "11-14 anos")
   * @private
   */
  private getFaixaEtaria(
    tipoEnsino: string | null | undefined,
    serie: string,
  ): string {
    if (tipoEnsino === 'MEDIO') {
      const map: Record<string, string> = {
        PRIMEIRO_ANO_EM: '14-15 anos',
        SEGUNDO_ANO_EM: '15-16 anos',
        TERCEIRO_ANO_EM: '16-17 anos',
      };
      return map[serie] || '14-17 anos';
    }

    // Ensino Fundamental
    const map: Record<string, string> = {
      SEXTO_ANO: '11-12 anos',
      SETIMO_ANO: '12-13 anos',
      OITAVO_ANO: '13-14 anos',
      NONO_ANO: '14-15 anos',
    };
    return map[serie] || '11-14 anos';
  }

  /**
   * Formata serie enum para exibição legível nos prompts.
   *
   * **Story 10.6:** Usado para contexto nos prompts
   *
   * @param serie - Série enum (ex: 'SEXTO_ANO', 'PRIMEIRO_ANO_EM')
   * @returns String formatada (ex: "6º Ano", "1º Ano (EM)")
   * @private
   */
  private formatarSerie(serie: string): string {
    if (serie.includes('_EM')) {
      // Ensino Médio: PRIMEIRO_ANO_EM → "1º Ano (EM)"
      return (
        serie
          .replace('_ANO_EM', '')
          .replace('PRIMEIRO', '1º')
          .replace('SEGUNDO', '2º')
          .replace('TERCEIRO', '3º') + ' (EM)'
      );
    }

    // Ensino Fundamental: SEXTO_ANO → "6º Ano"
    return serie
      .replace('_ANO', ' Ano')
      .replace('SEXTO', '6º')
      .replace('SETIMO', '7º')
      .replace('OITAVO', '8º')
      .replace('NONO', '9º');
  }

  /**
   * Constrói contexto de planejamento adaptado ao tipo de currículo.
   *
   * **BNCC:** Usa `habilidades` com estrutura BNCC (codigo, descricao, unidade_tematica)
   * **Custom:** Usa `objetivos` com estrutura customizada (codigo, descricao, nivel_cognitivo, criterios_evidencia)
   *
   * **Backward Compatibility:** Se planejamento não tem objetivos, usa habilidades (legacy)
   *
   * **Story 11.7:** Adaptação do pipeline de IA para currículos customizados
   *
   * @param planejamento Planejamento com habilidades E objetivos
   * @param isCurriculoCustom Se true, usa objetivos custom; se false, usa habilidades BNCC
   * @returns Objeto formatado para prompts IA
   * @private
   */
  private buildPlanejamentoContext(
    planejamento: any,
    isCurriculoCustom: boolean,
  ): any {
    if (!planejamento) return null;

    // CUSTOM: Usar objetivos customizados
    if (isCurriculoCustom && planejamento.objetivos?.length > 0) {
      return {
        tipo: 'custom',
        objetivos: planejamento.objetivos.map((po: any) => ({
          codigo: po.objetivo.codigo,
          descricao: po.objetivo.descricao,
          nivel_cognitivo: po.objetivo.nivel_cognitivo, // Bloom: LEMBRAR, ENTENDER, APLICAR...
          area_conhecimento: po.objetivo.area_conhecimento,
          criterios_evidencia: po.objetivo.criterios_evidencia || [],
          peso: po.peso,
          aulas_previstas: po.aulas_previstas,
        })),
      };
    }

    // BNCC (legacy ou explícito): Usar habilidades BNCC
    return {
      tipo: 'bncc',
      habilidades: (planejamento.habilidades || []).map((ph: any) => ({
        codigo: ph.habilidade.codigo,
        descricao: ph.habilidade.descricao,
        unidade_tematica: ph.habilidade.unidade_tematica,
      })),
    };
  }
}
