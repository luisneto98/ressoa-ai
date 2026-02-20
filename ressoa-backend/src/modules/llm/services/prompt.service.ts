import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prompt, ProviderLLM } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import Handlebars from 'handlebars';

// STORY 10.6: Register Handlebars helpers for conditionals in prompts
Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('and', (a, b) => a && b);
Handlebars.registerHelper('or', (a, b) => a || b);

/**
 * Service para gerenciar prompts versionados com A/B testing
 *
 * **Versionamento:**
 * - Cada prompt tem nome (ex: "prompt-cobertura") e versão (ex: "v1.0.0")
 * - Múltiplas versões podem estar ativas simultaneamente para A/B testing
 *
 * **A/B Testing:**
 * - Se 2 versões estão ativas E a mais recente tem `ab_testing=true` → split 50/50
 * - Após validação, versão antiga é desativada
 *
 * **Template Rendering (STORY 10.6):**
 * - Usa Handlebars para suportar condicionais: {{#if (eq tipo_ensino 'MEDIO')}}...{{/if}}
 * - Substitui {{variavel}} com valores fornecidos
 * - Variáveis faltando são deixadas como {{variavel}} (debugging)
 * - Helpers disponíveis: eq (igualdade), and (lógico), or (lógico)
 */
@Injectable()
export class PromptService {
  private readonly logger = new Logger(PromptService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Retorna prompt ativo para dado nome
   * Se há A/B testing ativo, escolhe aleatoriamente entre 2 versões (50/50)
   *
   * @param nome - Nome do prompt (ex: "prompt-cobertura")
   * @returns Prompt ativo (pode ser v1 ou v2 se A/B testing)
   * @throws NotFoundException se nenhum prompt ativo encontrado
   */
  async getActivePrompt(nome: string): Promise<Prompt> {
    this.logger.log({
      message: 'Buscando prompt ativo',
      nome,
    });

    // Query up to 2 active prompts, ordered by version DESC (newest first)
    const promptsAtivos = await this.prisma.prompt.findMany({
      where: { nome, ativo: true },
      orderBy: { versao: 'desc' },
      take: 2,
    });

    if (promptsAtivos.length === 0) {
      this.logger.error({
        message: 'Nenhum prompt ativo encontrado',
        nome,
      });
      throw new NotFoundException(
        `Nenhum prompt ativo encontrado para: ${nome}`,
      );
    }

    // Se há 2 prompts ativos e o mais recente tem ab_testing=true → 50/50 random
    if (promptsAtivos.length === 2 && promptsAtivos[0].ab_testing) {
      const escolhido =
        Math.random() < 0.5 ? promptsAtivos[0] : promptsAtivos[1];
      this.logger.log({
        message: 'A/B testing ativo - prompt escolhido aleatoriamente',
        nome,
        versao_escolhida: escolhido.versao,
        versoes_disponiveis: promptsAtivos.map((p) => p.versao),
      });
      return escolhido;
    }

    // Caso contrário, retornar o mais recente (index 0)
    this.logger.log({
      message: 'Prompt ativo retornado',
      nome,
      versao: promptsAtivos[0].versao,
      ab_testing: promptsAtivos[0].ab_testing,
    });

    return promptsAtivos[0];
  }

  /**
   * Renderiza template de prompt substituindo {{variáveis}} usando Handlebars
   *
   * Suporta:
   * - Substituição simples: {{variavel}}
   * - Condicionais: {{#if (eq tipo_ensino 'MEDIO')}}...{{/if}}
   * - Helpers: eq, and, or
   *
   * @param prompt - Prompt com template
   * @param variaveis - Valores para substituir no template
   * @returns String com variáveis substituídas
   *
   * @example
   * ```
   * prompt.conteudo = "{{#if (eq tipo_ensino 'MEDIO')}}Ensino Médio{{else}}Fundamental{{/if}}"
   * variaveis = { tipo_ensino: "MEDIO" }
   * // Retorna: "Ensino Médio"
   * ```
   */
  async renderPrompt(
    prompt: Prompt,
    variaveis: Record<string, any>,
  ): Promise<string> {
    // STORY 10.6: Use Handlebars for conditional template rendering
    const template = Handlebars.compile(prompt.conteudo);
    const conteudo = template(variaveis);

    // Log warning for missing variables (left as {{key}} in output)
    const missingVars = conteudo.match(/{{([^}]+)}}/g);
    if (missingVars) {
      this.logger.warn({
        message: 'Variáveis faltando no prompt rendering',
        prompt_nome: prompt.nome,
        prompt_versao: prompt.versao,
        variaveis_faltando: missingVars,
      });
    }

    return conteudo;
  }

  /**
   * Cria novo prompt versionado
   *
   * @param data - Dados do prompt
   * @returns Prompt criado
   *
   * @example
   * ```
   * await promptService.createPrompt({
   *   nome: "prompt-cobertura",
   *   versao: "v1.0.0",
   *   conteudo: "Analise a cobertura BNCC: {{transcricao}}",
   *   variaveis: { transcricao: "string", planejamento: "string" },
   *   modelo_sugerido: ProviderLLM.CLAUDE_SONNET,
   *   ativo: true,
   *   ab_testing: false,
   * });
   * ```
   */
  async createPrompt(data: {
    nome: string;
    versao: string;
    conteudo: string;
    variaveis?: any;
    modelo_sugerido?: ProviderLLM;
    ativo?: boolean;
    ab_testing?: boolean;
  }): Promise<Prompt> {
    this.logger.log({
      message: 'Criando novo prompt',
      nome: data.nome,
      versao: data.versao,
      ativo: data.ativo ?? false,
      ab_testing: data.ab_testing ?? false,
    });

    return this.prisma.prompt.create({ data });
  }

  /**
   * Atualiza status de prompt (ativo/inativo, ab_testing)
   *
   * @param nome - Nome do prompt
   * @param versao - Versão do prompt
   * @param updates - Campos para atualizar
   * @returns Prompt atualizado
   */
  async updatePromptStatus(
    nome: string,
    versao: string,
    updates: { ativo?: boolean; ab_testing?: boolean },
  ): Promise<Prompt> {
    this.logger.log({
      message: 'Atualizando status do prompt',
      nome,
      versao,
      updates,
    });

    return this.prisma.prompt.update({
      where: { nome_versao: { nome, versao } },
      data: updates,
    });
  }
}
