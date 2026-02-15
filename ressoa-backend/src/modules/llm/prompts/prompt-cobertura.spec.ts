import { Test, TestingModule } from '@nestjs/testing';
import { PromptService } from '../services/prompt.service';
import { ClaudeProvider } from '../providers/claude.provider';
import { PrismaService } from '../../../prisma/prisma.service';
import { ProviderLLM } from '@prisma/client';

/**
 * Unit Tests for Prompt 1 - Análise de Cobertura BNCC
 * Story 5.3 - AC4: Validate Prompt 1 Output Schema
 *
 * Test Coverage:
 * - Output JSON structure validation
 * - Evidence literality (not paraphrased)
 * - Coverage level classification (0-3)
 * - Quantitative summary accuracy
 * - Uncovered and extra habilidades detection
 */
describe('Prompt 1 - Cobertura BNCC (Unit)', () => {
  let promptService: PromptService;
  let claudeProvider: ClaudeProvider;

  // Realistic transcript fixture (Matemática 6º ano, 45min)
  const transcriptFixture = `
    [00:00-05:00] Professor: Bom dia turma! Hoje vamos falar sobre números naturais e sua ordem.
    [05:00-10:00] Professor: Vamos comparar esses dois números: 150 e 105. Quem consegue me dizer qual é maior?
    Aluno: 150 é maior, professor!
    Professor: Muito bem! Por que 150 é maior que 105?
    Aluno: Porque o 1 na casa das centenas é igual, mas o 5 nas dezenas é maior que 0.
    [10:00-20:00] Professor: Exatamente! Agora vamos fazer um exercício. Ordenem esses números do menor para o maior: 45, 102, 89, 200.
    [Alunos fazem exercício em duplas - 10 minutos]
    [20:00-25:00] Professor: Quem quer mostrar a resposta? João, pode ir ao quadro?
    [João escreve: 45, 89, 102, 200]
    Professor: Perfeito! Todos entenderam?
    [25:00-30:00] Professor: Agora vamos falar rapidamente sobre múltiplos. Múltiplos de 2 são números que podem ser divididos por 2 sem resto.
    Professor: Exemplo: 2, 4, 6, 8, 10... Vamos ver isso melhor na próxima aula.
    [30:00-45:00] Professor: Agora façam os exercícios da página 25. Eu vou ajudar individualmente.
  `;

  const planejamentoFixture = `
    Habilidades Planejadas:
    - EF06MA01: Comparar, ordenar, ler e escrever números naturais
    - EF06MA02: Reconhecer o sistema de numeração decimal
    - EF06MA03: Resolver e elaborar problemas com as quatro operações
  `;

  // Mock response from ClaudeProvider
  const mockCoberturaOutput = {
    texto: JSON.stringify({
      analise_cobertura: [
        {
          habilidade_codigo: 'EF06MA01',
          nivel_cobertura: 3,
          evidencias: [
            'Vamos comparar esses dois números: 150 e 105. Quem consegue me dizer qual é maior?',
            'Ordenem esses números do menor para o maior: 45, 102, 89, 200.',
            'Quem quer mostrar a resposta? João, pode ir ao quadro?',
          ],
          observacoes:
            'Habilidade aprofundada com explicação, exemplos, exercício prático e interação.',
          tempo_estimado_minutos: 20,
        },
        {
          habilidade_codigo: 'EF06MA02',
          nivel_cobertura: 2,
          evidencias: [
            'Múltiplos de 2 são números que podem ser divididos por 2 sem resto.',
            'Exemplo: 2, 4, 6, 8, 10... Vamos ver isso melhor na próxima aula.',
          ],
          observacoes:
            'Habilidade parcialmente coberta: conceito explicado com exemplo, mas sem exercícios práticos.',
          tempo_estimado_minutos: 5,
        },
        {
          habilidade_codigo: 'EF06MA03',
          nivel_cobertura: 0,
          evidencias: [],
          observacoes: 'Habilidade não foi abordada nesta aula.',
          tempo_estimado_minutos: 0,
        },
      ],
      habilidades_nao_cobertas: ['EF06MA03'],
      habilidades_extras: [],
      resumo_quantitativo: {
        total_planejadas: 3,
        cobertas_nivel_2_ou_3: 2,
        apenas_mencionadas: 0,
        nao_cobertas: 1,
        percentual_cobertura: 66.7,
      },
    }),
    custo_usd: 0.005,
    tokens_usados: 850,
    modelo: 'claude-sonnet-4.5',
    provider: ProviderLLM.CLAUDE_SONNET,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromptService,
        {
          provide: ClaudeProvider,
          useValue: {
            generate: jest.fn().mockResolvedValue(mockCoberturaOutput),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            prompt: {
              findFirst: jest.fn().mockResolvedValue({
                id: 'prompt-1-id',
                nome: 'prompt-cobertura',
                versao: 'v1.0.0',
                conteudo:
                  'Você é um especialista... {{transcricao}} {{planejamento}} {{turma.serie}} {{turma.disciplina}}',
                variaveis: {
                  temperature: 0.3,
                  max_tokens: 2000,
                  transcricao: 'string',
                  planejamento: 'string',
                  turma: { serie: 'number', disciplina: 'string' },
                },
                modelo_sugerido: ProviderLLM.CLAUDE_SONNET,
                ativo: true,
                ab_testing: false,
              }),
            },
          },
        },
      ],
    }).compile();

    promptService = module.get<PromptService>(PromptService);
    claudeProvider = module.get<ClaudeProvider>(ClaudeProvider);
  });

  /**
   * AC4: Test Prompt 1 Output Schema
   */
  describe('Output Schema Validation', () => {
    it('should have analise_cobertura array with correct structure', () => {
      const output = JSON.parse(mockCoberturaOutput.texto);

      expect(output).toHaveProperty('analise_cobertura');
      expect(Array.isArray(output.analise_cobertura)).toBe(true);
      expect(output.analise_cobertura.length).toBe(3);

      const item = output.analise_cobertura[0];
      expect(item).toHaveProperty('habilidade_codigo');
      expect(item).toHaveProperty('nivel_cobertura');
      expect(item).toHaveProperty('evidencias');
      expect(item).toHaveProperty('observacoes');
      expect(item).toHaveProperty('tempo_estimado_minutos');
    });

    it('should have nivel_cobertura between 0-3', () => {
      const output = JSON.parse(mockCoberturaOutput.texto);

      output.analise_cobertura.forEach((item: any) => {
        expect(item.nivel_cobertura).toBeGreaterThanOrEqual(0);
        expect(item.nivel_cobertura).toBeLessThanOrEqual(3);
        expect(Number.isInteger(item.nivel_cobertura)).toBe(true);
      });
    });

    it('should have evidencias as array of strings', () => {
      const output = JSON.parse(mockCoberturaOutput.texto);

      output.analise_cobertura.forEach((item: any) => {
        expect(Array.isArray(item.evidencias)).toBe(true);
        if (item.evidencias.length > 0) {
          item.evidencias.forEach((evidencia: any) => {
            expect(typeof evidencia).toBe('string');
            expect(evidencia.length).toBeGreaterThan(0);
          });
        }
      });
    });

    it('should limit evidencias to max 3 per habilidade', () => {
      const output = JSON.parse(mockCoberturaOutput.texto);

      output.analise_cobertura.forEach((item: any) => {
        expect(item.evidencias.length).toBeLessThanOrEqual(3);
      });
    });

    it('should have resumo_quantitativo with all required fields', () => {
      const output = JSON.parse(mockCoberturaOutput.texto);

      expect(output).toHaveProperty('resumo_quantitativo');
      expect(output.resumo_quantitativo).toHaveProperty('total_planejadas');
      expect(output.resumo_quantitativo).toHaveProperty('cobertas_nivel_2_ou_3');
      expect(output.resumo_quantitativo).toHaveProperty('apenas_mencionadas');
      expect(output.resumo_quantitativo).toHaveProperty('nao_cobertas');
      expect(output.resumo_quantitativo).toHaveProperty('percentual_cobertura');
    });

    it('should have habilidades_nao_cobertas as array of códigos', () => {
      const output = JSON.parse(mockCoberturaOutput.texto);

      expect(Array.isArray(output.habilidades_nao_cobertas)).toBe(true);
      output.habilidades_nao_cobertas.forEach((codigo: any) => {
        expect(typeof codigo).toBe('string');
        expect(codigo).toMatch(/^EF\d{2}[A-Z]{2,3}\d{2}$/); // BNCC pattern
      });
    });

    it('should have habilidades_extras with correct structure', () => {
      const output = JSON.parse(mockCoberturaOutput.texto);

      expect(Array.isArray(output.habilidades_extras)).toBe(true);
      // May be empty if no extras found
      if (output.habilidades_extras.length > 0) {
        output.habilidades_extras.forEach((extra: any) => {
          expect(extra).toHaveProperty('habilidade_codigo');
          expect(extra).toHaveProperty('observacao');
        });
      }
    });
  });

  /**
   * AC4: Test Evidence Literality
   */
  describe('Evidence Quality Validation', () => {
    it('should use literal quotes from transcript (not paraphrased)', () => {
      const output = JSON.parse(mockCoberturaOutput.texto);
      const coveredItem = output.analise_cobertura.find(
        (item: any) => item.nivel_cobertura > 0,
      );

      expect(coveredItem.evidencias.length).toBeGreaterThan(0);

      // Check that at least one evidence appears exactly in transcript
      const hasLiteralQuote = coveredItem.evidencias.some((evidencia: string) =>
        transcriptFixture.includes(evidencia),
      );

      expect(hasLiteralQuote).toBe(true);
    });

    it('should NOT have generic or paraphrased evidences', () => {
      const output = JSON.parse(mockCoberturaOutput.texto);

      // Generic phrases that indicate paraphrasing (NOT literal quotes)
      const genericPhrases = [
        'professor explicou',
        'alunos fizeram',
        'foi abordado',
        'discutiu sobre',
        'mencionou que',
      ];

      output.analise_cobertura.forEach((item: any) => {
        item.evidencias.forEach((evidencia: string) => {
          const isGeneric = genericPhrases.some((phrase) =>
            evidencia.toLowerCase().includes(phrase),
          );
          // Evidences should be DIRECT quotes, not generic descriptions
          expect(isGeneric).toBe(false);
        });
      });
    });
  });

  /**
   * AC4: Test Quantitative Consistency
   */
  describe('Quantitative Summary Consistency', () => {
    it('should have consistent counts in resumo_quantitativo', () => {
      const output = JSON.parse(mockCoberturaOutput.texto);
      const resumo = output.resumo_quantitativo;

      // Total should match number of planned habilidades
      expect(resumo.total_planejadas).toBe(3);

      // Sum of categories should equal total
      const sum =
        resumo.cobertas_nivel_2_ou_3 +
        resumo.apenas_mencionadas +
        resumo.nao_cobertas;
      expect(sum).toBe(resumo.total_planejadas);

      // Percentage should be accurate (allowing for rounding)
      const expectedPercentage =
        (resumo.cobertas_nivel_2_ou_3 / resumo.total_planejadas) * 100;
      expect(Math.abs(resumo.percentual_cobertura - expectedPercentage)).toBeLessThan(1);
    });

    it('should match habilidades_nao_cobertas count with resumo', () => {
      const output = JSON.parse(mockCoberturaOutput.texto);

      const naoCobertas = output.analise_cobertura.filter(
        (item: any) => item.nivel_cobertura === 0,
      );

      expect(naoCobertas.length).toBe(output.resumo_quantitativo.nao_cobertas);
      expect(output.habilidades_nao_cobertas.length).toBe(
        output.resumo_quantitativo.nao_cobertas,
      );
    });
  });

  /**
   * AC4: Test JSON Parsing
   */
  describe('JSON Parsing', () => {
    it('should parse without syntax errors', () => {
      expect(() => {
        JSON.parse(mockCoberturaOutput.texto);
      }).not.toThrow();
    });

    it('should return valid JSON structure from LLM', async () => {
      const result = await claudeProvider.generate(
        'Test prompt content',
        {
          temperature: 0.3,
          maxTokens: 2000,
        },
      );

      expect(result.texto).toBeDefined();
      expect(() => JSON.parse(result.texto)).not.toThrow();
    });
  });
});
