import { readFileSync } from 'fs';
import { join } from 'path';
import Handlebars from 'handlebars';

/**
 * Unit Tests for Prompt v5.0.0 — Seções Condicionais de Descrições
 * Story 16.3 - AC3, AC5, AC6, AC7, AC8, AC9, AC11
 *
 * Valida que:
 * - Blocos {{#if descricao_planejamento}} e {{#if descricao_aula}} são renderizados quando variáveis existem
 * - Blocos são OMITIDOS quando variáveis são null/undefined (retrocompatibilidade)
 * - prompt-exercicios-v5.0.0 usa APENAS descricao_aula (AC9)
 * - prompt-alertas-v5.0.0 contém tipo DESVIO_OBJETIVO (AC8)
 */

const promptsDir = join(
  __dirname,
  '../../../../prisma/seeds/prompts',
);

function loadPromptConteudo(nome: string, versao: string): string {
  const file = join(promptsDir, `${nome}-${versao}.json`);
  const data = JSON.parse(readFileSync(file, 'utf-8'));
  return data.conteudo;
}

// Registrar helper 'eq' usado nos templates (mesmo padrão do PromptService)
// NOTA: helpers 'and' e 'or' removidos — não são usados em nenhum prompt v5.0.0
Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);

function renderConteudo(
  conteudo: string,
  variaveis: Record<string, unknown>,
): string {
  const template = Handlebars.compile(conteudo);
  return template(variaveis);
}

// Contexto mínimo válido para renderização sem erros de variáveis ausentes
const baseContextoBNCC = {
  curriculo_tipo: 'BNCC',
  transcricao: 'Bom dia turma! Hoje vamos estudar frações.',
  turma: { nome: '6A', disciplina: 'MATEMATICA', serie: 'SEXTO_ANO' },
  tipo_ensino: 'FUNDAMENTAL',
  nivel_ensino: 'Ensino Fundamental',
  faixa_etaria: '11-12 anos',
  ano_serie: '6º Ano',
  serie: 'SEXTO_ANO',
  disciplina: 'MATEMATICA',
  planejamento: {
    tipo: 'bncc',
    habilidades: [
      {
        codigo: 'EF06MA01',
        descricao: 'Comparar números',
        unidade_tematica: 'Números',
      },
    ],
  },
  cobertura: {},
  analise_qualitativa: {},
  contexto_pedagogico: null,
  has_diarization: false,
  speaker_stats: null,
};

describe('Prompts v5.0.0 — Seções Condicionais de Descrições (Story 16.3)', () => {
  const promptNames = [
    'prompt-cobertura',
    'prompt-qualitativa',
    'prompt-relatorio',
    'prompt-exercicios',
    'prompt-alertas',
  ];

  describe('Estrutura dos arquivos v5.0.0', () => {
    it.each(promptNames)('%s-v5.0.0 deve ter versao v5.0.0 e ativo=true', (nome) => {
      const file = join(promptsDir, `${nome}-v5.0.0.json`);
      const data = JSON.parse(readFileSync(file, 'utf-8'));

      expect(data.versao).toBe('v5.0.0');
      expect(data.ativo).toBe(true);
      expect(data.ab_testing).toBe(false);
    });

    it.each(promptNames)(
      '%s-v5.0.0 deve ter variaveis descricao_planejamento e descricao_aula',
      (nome) => {
        const file = join(promptsDir, `${nome}-v5.0.0.json`);
        const data = JSON.parse(readFileSync(file, 'utf-8'));

        expect(data.variaveis).toHaveProperty('descricao_planejamento');
        expect(data.variaveis).toHaveProperty('descricao_aula');
        expect(data.variaveis.descricao_planejamento).toBe('string | null');
        expect(data.variaveis.descricao_aula).toBe('string | null');
      },
    );

    it.each(promptNames)(
      '%s-v5.0.0 deve usar triple braces para descricao_aula e descricao_planejamento (evita HTML encoding)',
      (nome) => {
        const file = join(promptsDir, `${nome}-v5.0.0.json`);
        const data = JSON.parse(readFileSync(file, 'utf-8'));

        // descricao_aula usa triple braces em todos os 5 prompts (obrigatório — AC3)
        expect(data.conteudo).toContain('{{{descricao_aula}}}');

        // descricao_planejamento usa triple braces nos prompts que têm o bloco condicional
        // (prompt-exercicios-v5.0.0 não usa descricao_planejamento no template — AC9)
        if (nome !== 'prompt-exercicios') {
          expect(data.conteudo).toContain('{{{descricao_planejamento}}}');
        }
      },
    );
  });

  describe('prompt-cobertura-v5.0.0 — Template Rendering', () => {
    let conteudo: string;

    beforeAll(() => {
      conteudo = loadPromptConteudo('prompt-cobertura', 'v5.0.0');
    });

    it('deve renderizar bloco descricao_aula quando variável existe', () => {
      const rendered = renderConteudo(conteudo, {
        ...baseContextoBNCC,
        descricao_aula: 'Trabalhar frações equivalentes com material concreto',
        descricao_planejamento: null,
      });

      expect(rendered).toContain('Objetivo Específico desta Aula');
      expect(rendered).toContain('Trabalhar frações equivalentes com material concreto');
    });

    it('deve omitir bloco descricao_aula quando variável é null', () => {
      const rendered = renderConteudo(conteudo, {
        ...baseContextoBNCC,
        descricao_aula: null,
        descricao_planejamento: null,
      });

      expect(rendered).not.toContain('Objetivo Específico desta Aula');
    });

    it('deve omitir bloco descricao_aula quando variável é undefined', () => {
      const rendered = renderConteudo(conteudo, {
        ...baseContextoBNCC,
        descricao_planejamento: null,
        // descricao_aula ausente (undefined)
      });

      expect(rendered).not.toContain('Objetivo Específico desta Aula');
    });

    it('deve renderizar bloco descricao_planejamento quando variável existe', () => {
      const rendered = renderConteudo(conteudo, {
        ...baseContextoBNCC,
        descricao_planejamento: 'Ênfase em material concreto e jogos matemáticos',
        descricao_aula: null,
      });

      expect(rendered).toContain('Contexto do Planejamento Bimestral');
      expect(rendered).toContain('Ênfase em material concreto e jogos matemáticos');
    });

    it('deve omitir bloco descricao_planejamento quando variável é null', () => {
      const rendered = renderConteudo(conteudo, {
        ...baseContextoBNCC,
        descricao_planejamento: null,
        descricao_aula: null,
      });

      expect(rendered).not.toContain('Contexto do Planejamento Bimestral');
    });

    it('deve renderizar ambos blocos quando ambas descrições existem', () => {
      const rendered = renderConteudo(conteudo, {
        ...baseContextoBNCC,
        descricao_planejamento: 'Foco em álgebra e geometria',
        descricao_aula: 'Introduzir equações de 1º grau',
      });

      expect(rendered).toContain('Contexto do Planejamento Bimestral');
      expect(rendered).toContain('Foco em álgebra e geometria');
      expect(rendered).toContain('Objetivo Específico desta Aula');
      expect(rendered).toContain('Introduzir equações de 1º grau');
    });

    it('deve preservar todas as seções essenciais do v4 quando ambas descrições são null (retrocompatibilidade)', () => {
      const v4conteudo = loadPromptConteudo('prompt-cobertura', 'v4.0.0');

      const renderedV4 = renderConteudo(v4conteudo, {
        ...baseContextoBNCC,
      });
      const renderedV5 = renderConteudo(conteudo, {
        ...baseContextoBNCC,
        descricao_planejamento: null,
        descricao_aula: null,
      });

      // O conteúdo essencial do v4 deve estar presente no v5 com descrições null
      expect(renderedV5).toContain('CONTEXTO DA TURMA');
      expect(renderedV5).toContain('FORMATO DA TRANSCRIÇÃO');
      expect(renderedV5).not.toContain('Objetivo Específico');
      expect(renderedV5).not.toContain('Contexto do Planejamento Bimestral');
      // Garante que o v4 também não tem esses blocos
      expect(renderedV4).not.toContain('Objetivo Específico');
    });
  });

  describe('prompt-qualitativa-v5.0.0 — Template Rendering', () => {
    let conteudo: string;

    beforeAll(() => {
      conteudo = loadPromptConteudo('prompt-qualitativa', 'v5.0.0');
    });

    it('deve renderizar bloco descricao_planejamento antes da ANÁLISE DE COBERTURA', () => {
      const rendered = renderConteudo(conteudo, {
        ...baseContextoBNCC,
        descricao_planejamento: 'Metodologia ativa com ABP',
        descricao_aula: null,
      });

      expect(rendered).toContain('Contexto do Planejamento Bimestral');
      expect(rendered).toContain('Metodologia ativa com ABP');
      expect(rendered).toContain('ANÁLISE DE COBERTURA');

      // Bloco de planejamento deve vir ANTES de ANÁLISE DE COBERTURA
      const planejIdx = rendered.indexOf('Contexto do Planejamento Bimestral');
      const coberturIdx = rendered.indexOf('ANÁLISE DE COBERTURA');
      expect(planejIdx).toBeLessThan(coberturIdx);
    });

    it('deve renderizar bloco descricao_aula com texto sobre qualidade didática', () => {
      const rendered = renderConteudo(conteudo, {
        ...baseContextoBNCC,
        descricao_planejamento: null,
        descricao_aula: 'Ensinar operações com frações usando exemplos do cotidiano',
      });

      expect(rendered).toContain('Objetivo Específico desta Aula');
      expect(rendered).toContain('Avalie a qualidade didática também sob a ótica deste objetivo');
    });

    // AC11: Verificar omissão quando descrições são null (retrocompatibilidade)
    it('deve omitir ambos os blocos quando descricao_planejamento e descricao_aula são null', () => {
      const rendered = renderConteudo(conteudo, {
        ...baseContextoBNCC,
        descricao_planejamento: null,
        descricao_aula: null,
      });

      expect(rendered).not.toContain('Contexto do Planejamento Bimestral');
      expect(rendered).not.toContain('Objetivo Específico desta Aula');
      // Seção principal deve estar presente (retrocompatibilidade total com v4)
      expect(rendered).toContain('ANÁLISE DE COBERTURA');
    });
  });

  describe('prompt-relatorio-v5.0.0 — Template Rendering', () => {
    let conteudo: string;

    beforeAll(() => {
      conteudo = loadPromptConteudo('prompt-relatorio', 'v5.0.0');
    });

    it('deve renderizar bloco descricao_aula com instrução para referenciar objetivo no relatório', () => {
      const rendered = renderConteudo(conteudo, {
        ...baseContextoBNCC,
        descricao_planejamento: null,
        descricao_aula: 'Apresentar frações e suas representações visuais',
      });

      expect(rendered).toContain('Objetivo Específico desta Aula');
      expect(rendered).toContain('O relatório deve referenciar este objetivo');
      expect(rendered).toContain('Apresentar frações e suas representações visuais');
    });

    it('deve omitir seções de descrição antes de DADOS DE ANÁLISE quando null', () => {
      const rendered = renderConteudo(conteudo, {
        ...baseContextoBNCC,
        descricao_planejamento: null,
        descricao_aula: null,
      });

      expect(rendered).not.toContain('Objetivo Específico desta Aula');
      expect(rendered).not.toContain('Contexto do Planejamento Bimestral');
      expect(rendered).toContain('DADOS DE ANÁLISE');
    });
  });

  describe('prompt-exercicios-v5.0.0 — Template Rendering (AC9: somente descricao_aula)', () => {
    let conteudo: string;

    beforeAll(() => {
      conteudo = loadPromptConteudo('prompt-exercicios', 'v5.0.0');
    });

    it('deve ter APENAS bloco descricao_aula (sem descricao_planejamento) no template', () => {
      // AC9: exercicios prioriza exercícios alinhados ao descricao_aula — sem bloco de planejamento
      expect(conteudo).not.toContain('{{#if descricao_planejamento}}');
      expect(conteudo).toContain('{{#if descricao_aula}}');
    });

    it('deve renderizar instrução de prioridade quando descricao_aula existe', () => {
      const rendered = renderConteudo(conteudo, {
        ...baseContextoBNCC,
        descricao_aula: 'Reforçar conceito de frações equivalentes',
        descricao_planejamento: null,
      });

      expect(rendered).toContain('Objetivo Específico desta Aula');
      expect(rendered).toContain('Priorize exercícios que reforcem especificamente o objetivo');
      expect(rendered).toContain('Reforçar conceito de frações equivalentes');
    });

    it('deve omitir bloco quando descricao_aula é null', () => {
      const rendered = renderConteudo(conteudo, {
        ...baseContextoBNCC,
        descricao_aula: null,
        descricao_planejamento: null,
      });

      expect(rendered).not.toContain('Objetivo Específico desta Aula');
    });
  });

  describe('prompt-alertas-v5.0.0 — Template Rendering (AC8: DESVIO_OBJETIVO)', () => {
    let conteudo: string;

    beforeAll(() => {
      conteudo = loadPromptConteudo('prompt-alertas', 'v5.0.0');
    });

    it('deve conter tipo de alerta DESVIO_OBJETIVO na seção de alertas de cobertura', () => {
      expect(conteudo).toContain('DESVIO_OBJETIVO');
      expect(conteudo).toContain('somente se descricao_aula existe');
    });

    it('deve renderizar bloco descricao_aula com o objetivo para comparação', () => {
      const rendered = renderConteudo(conteudo, {
        ...baseContextoBNCC,
        descricao_planejamento: null,
        descricao_aula: 'Trabalhar frações com material concreto',
      });

      expect(rendered).toContain('Objetivo Específico desta Aula');
      expect(rendered).toContain('Trabalhar frações com material concreto');
    });

    it('deve renderizar bloco descricao_planejamento resumido', () => {
      const rendered = renderConteudo(conteudo, {
        ...baseContextoBNCC,
        descricao_planejamento: 'Foco em operações com frações',
        descricao_aula: null,
      });

      expect(rendered).toContain('Contexto do Planejamento Bimestral');
      expect(rendered).toContain('Foco em operações com frações');
    });

    it('deve manter DESVIO_OBJETIVO visível na seção de tipos de alertas (AC8)', () => {
      const rendered = renderConteudo(conteudo, {
        ...baseContextoBNCC,
        descricao_planejamento: null,
        descricao_aula: null,
      });

      // DESVIO_OBJETIVO fica no texto estático dos tipos de alertas, sempre visível
      expect(rendered).toContain('DESVIO_OBJETIVO');
      expect(rendered).toContain('Severidade: IMPORTANTE');
    });

    // AC11: Verificar omissão dos blocos condicionais quando descrições são null
    it('deve omitir blocos de contexto do professor quando ambas descrições são null (retrocompatibilidade)', () => {
      const rendered = renderConteudo(conteudo, {
        ...baseContextoBNCC,
        descricao_planejamento: null,
        descricao_aula: null,
      });

      // Blocos condicionais de contexto devem ser omitidos
      expect(rendered).not.toContain('Contexto do Planejamento Bimestral');
      expect(rendered).not.toContain('Objetivo Específico desta Aula');
      // Seção principal de dados deve estar presente (retrocompatibilidade total com v4)
      expect(rendered).toContain('DADOS DE ANÁLISE');
    });
  });

  describe('v4.0.0 — Verificação de desativação (AC4)', () => {
    it.each(promptNames)(
      '%s-v4.0.0 deve ter ativo=false (desativado pela Story 16.3)',
      (nome) => {
        const file = join(promptsDir, `${nome}-v4.0.0.json`);
        const data = JSON.parse(readFileSync(file, 'utf-8'));

        expect(data.ativo).toBe(false);
      },
    );
  });
});
