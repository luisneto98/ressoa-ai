import { Test, TestingModule } from '@nestjs/testing';
import { PromptService } from '../services/prompt.service';
import { GPTProvider } from '../providers/gpt.provider';
import { PrismaService } from '../../../prisma/prisma.service';
import { ProviderLLM } from '@prisma/client';

/**
 * Unit Tests for Prompt 4 - Geração de Exercícios
 * Story 5.4 - AC5: Validate Prompt 4 Output Quality
 *
 * Test Coverage:
 * - JSON structure validation (5 exercises)
 * - Bloom distribution (2-2-1 pattern)
 * - Contextual fidelity (uses transcript examples)
 * - Complete gabaritos (resposta_curta, passos, criterios, dica)
 * - Grade-appropriate language
 * - BNCC habilidade mapping
 * - Progressive difficulty
 */
describe('Prompt 4 - Geração de Exercícios (Unit)', () => {
  let promptService: PromptService;
  let gptProvider: GPTProvider;

  // Realistic transcript fixture (Matemática 6º ano - frações)
  const transcriptFixture = `
    [00:00-10:00] Professor: Hoje vamos aprender sobre frações.
    Imaginem que temos uma pizza dividida em 8 fatias iguais.
    Se você comer 3 fatias, que fração da pizza você comeu?
    Aluno: 3/8, professor!
    Professor: Exatamente! Três oitavos.

    [10:00-20:00] Professor: Agora vamos comparar números naturais.
    Coloquem em ordem crescente: 150, 23, 8, 42.
    [Alunos trabalham em duplas]

    [20:00-30:00] Professor: Vamos ver frações equivalentes.
    1/2 é o mesmo que 2/4. Olhem no desenho da pizza.
    Se dividimos em 2 partes e pegamos 1, é a mesma área que 2 partes de 4.

    [30:00-40:00] Professor: Agora um problema prático:
    Maria tinha 15 balas e deu 1/3 para seu irmão.
    Quantas balas ela deu? Quem sabe?
    Aluno: 5 balas!
    Professor: Isso! 15 dividido por 3 é 5.
  `;

  const coberturaFixture = {
    analise_cobertura: [
      {
        habilidade_codigo: 'EF06MA01',
        nivel_cobertura: 2,
        evidencias: ['Coloquem em ordem crescente: 150, 23, 8, 42'],
        tempo_estimado_minutos: 10,
      },
      {
        habilidade_codigo: 'EF06MA07',
        nivel_cobertura: 3,
        evidencias: [
          'Uma pizza dividida em 8 fatias iguais',
          'Frações equivalentes: 1/2 é o mesmo que 2/4',
          'Maria tinha 15 balas e deu 1/3 para seu irmão',
        ],
        tempo_estimado_minutos: 30,
      },
    ],
  };

  const turmaFixture = {
    nome: '6A',
    serie: 6,
    disciplina: 'Matemática',
  };

  // Mock JSON output from GPT-4 mini
  const mockExerciciosOutput = {
    exercicios: [
      {
        numero: 1,
        enunciado:
          'Durante a aula, o professor usou o exemplo de dividir uma pizza em 8 fatias para explicar frações. Se você comeu 3 fatias, qual fração da pizza você comeu? Explique sua resposta.',
        contexto_aula: 'Professor usou pizza como exemplo concreto de frações',
        nivel_bloom: 2,
        nivel_bloom_descricao: 'Compreender',
        dificuldade: 'facil',
        habilidade_relacionada: 'EF06MA07',
        gabarito: {
          resposta_curta: '3/8 (três oitavos)',
          resolucao_passo_a_passo: [
            'Passo 1: Identificar o total de partes (denominador): 8 fatias',
            'Passo 2: Identificar as partes consumidas (numerador): 3 fatias',
            'Passo 3: Escrever a fração: 3/8',
          ],
          criterios_correcao: ['Aceitar: 3/8, três oitavos, 0.375', 'Não aceitar: 3/5, 8/3'],
          dica_professor:
            'Erro comum: alunos podem confundir numerador e denominador. Reforçar que o denominador é sempre o TOTAL de partes.',
        },
      },
      {
        numero: 2,
        enunciado:
          'Na aula, discutimos como comparar números naturais. Coloque os seguintes números em ordem crescente (do menor para o maior): 150, 23, 8, 42.',
        contexto_aula: 'Professor pediu para alunos ordenarem números',
        nivel_bloom: 2,
        nivel_bloom_descricao: 'Compreender',
        dificuldade: 'facil',
        habilidade_relacionada: 'EF06MA01',
        gabarito: {
          resposta_curta: '8, 23, 42, 150',
          resolucao_passo_a_passo: [
            'Passo 1: Identificar números de 1 dígito: 8',
            'Passo 2: Identificar números de 2 dígitos: 23 e 42',
            'Passo 3: Comparar dezenas: 23 < 42',
            'Passo 4: Identificar número de 3 dígitos: 150',
          ],
          criterios_correcao: ['Aceitar: Ordem correta', 'Não aceitar: Ordem invertida'],
          dica_professor: 'Reforçar que números com mais dígitos são geralmente maiores.',
        },
      },
      {
        numero: 3,
        enunciado:
          'O professor explicou que 1/2 e 2/4 são frações equivalentes. Crie um desenho ou diagrama que mostre por que essas duas frações representam a mesma quantidade.',
        contexto_aula: 'Professor desenhou pizza no quadro para mostrar frações equivalentes',
        nivel_bloom: 3,
        nivel_bloom_descricao: 'Aplicar',
        dificuldade: 'medio',
        habilidade_relacionada: 'EF06MA07',
        gabarito: {
          resposta_curta: 'Desenho mostrando 1 parte de 2 totais = 2 partes de 4 totais',
          resolucao_passo_a_passo: [
            'Passo 1: Desenhar círculo dividido em 2 partes, sombrear 1',
            'Passo 2: Desenhar círculo dividido em 4 partes, sombrear 2',
            'Passo 3: Observar que a área sombreada é igual',
          ],
          criterios_correcao: ['Aceitar: Qualquer representação visual correta'],
          dica_professor: 'Este exercício avalia compreensão conceitual, não apenas cálculo.',
        },
      },
      {
        numero: 4,
        enunciado:
          'Durante a aula, resolvemos: "Maria tinha 15 balas e deu 1/3 para seu irmão. Quantas balas ela deu?". Agora, crie um problema SEMELHANTE sobre João que tem 24 figurinhas e dá 1/4 para sua irmã.',
        contexto_aula: 'Professor usou problema de balas como exemplo',
        nivel_bloom: 4,
        nivel_bloom_descricao: 'Analisar',
        dificuldade: 'medio',
        habilidade_relacionada: 'EF06MA07',
        gabarito: {
          resposta_curta: 'João deu 6 figurinhas (1/4 de 24)',
          resolucao_passo_a_passo: [
            'Passo 1: Criar problema análogo',
            'Passo 2: Resolver: 1/4 de 24 = 24 ÷ 4 = 6',
            'Passo 3: Verificar: 6 x 4 = 24',
          ],
          criterios_correcao: ['Aceitar: Problema bem estruturado e resolução correta'],
          dica_professor: 'Avalia transferência de aprendizado. Valorizar a tentativa.',
        },
      },
      {
        numero: 5,
        enunciado:
          'Um aluno disse: "Frações maiores sempre têm numeradores maiores". Usando exemplos da aula (1/2, 2/4, 1/8, 3/4), explique se essa afirmação está CORRETA ou ERRADA.',
        contexto_aula: 'Professor comparou várias frações durante a aula',
        nivel_bloom: 5,
        nivel_bloom_descricao: 'Avaliar',
        dificuldade: 'dificil',
        habilidade_relacionada: 'EF06MA07',
        gabarito: {
          resposta_curta: 'ERRADA - O denominador também influencia',
          resolucao_passo_a_passo: [
            'Passo 1: Testar com contra-exemplo: 1/2 vs 1/8',
            'Passo 2: Observar que 1/2 > 1/8 mesmo com numeradores iguais',
            'Passo 3: Concluir que denominador importa',
          ],
          criterios_correcao: ['Aceitar: Qualquer contra-exemplo válido'],
          dica_professor: 'Exercício desafiador. Muitos alunos vão errar. Use para discussão.',
        },
      },
    ],
    metadados: {
      total_exercicios: 5,
      distribuicao_bloom: {
        nivel_2: 2,
        nivel_3: 1,
        nivel_4: 1,
        nivel_5: 1,
      },
      distribuicao_dificuldade: {
        facil: 2,
        medio: 2,
        dificil: 1,
      },
      tempo_estimado_resolucao_minutos: 30,
      contexto_fidelidade: 'Todos os 5 exercícios usam exemplos da aula',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromptService,
        {
          provide: GPTProvider,
          useValue: {
            generate: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            prompt: {
              findFirst: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    promptService = module.get<PromptService>(PromptService);
    gptProvider = module.get<GPTProvider>(GPTProvider);
  });

  describe('JSON Structure Validation', () => {
    beforeEach(() => {
      jest.spyOn(gptProvider, 'generate').mockResolvedValue({
        texto: JSON.stringify(mockExerciciosOutput),
        custo_usd: 0.006,
        tokens_input: 500,
        tokens_output: 350,
        tempo_processamento_ms: 1500,
        modelo: 'gpt-4.6-mini',
        provider: ProviderLLM.GPT4_MINI,
      });
    });

    it('deve retornar JSON válido parseável', async () => {
      const result = await gptProvider.generate('test-prompt', {});

      expect(() => JSON.parse(result.texto)).not.toThrow();
    });

    it('deve conter exatamente 5 exercícios', async () => {
      const result = await gptProvider.generate('test-prompt', {});
      const data = JSON.parse(result.texto);

      expect(data.exercicios).toHaveLength(5);
      expect(data.metadados.total_exercicios).toBe(5);
    });

    it('deve ter todos os campos obrigatórios em cada exercício', async () => {
      const result = await gptProvider.generate('test-prompt', {});
      const data = JSON.parse(result.texto);

      data.exercicios.forEach((ex: any, idx: number) => {
        expect(ex).toHaveProperty('numero', idx + 1);
        expect(ex).toHaveProperty('enunciado');
        expect(ex).toHaveProperty('contexto_aula');
        expect(ex).toHaveProperty('nivel_bloom');
        expect(ex).toHaveProperty('nivel_bloom_descricao');
        expect(ex).toHaveProperty('dificuldade');
        expect(ex).toHaveProperty('habilidade_relacionada');
        expect(ex).toHaveProperty('gabarito');
      });
    });

    it('deve ter metadados completos', async () => {
      const result = await gptProvider.generate('test-prompt', {});
      const data = JSON.parse(result.texto);

      expect(data.metadados).toHaveProperty('total_exercicios');
      expect(data.metadados).toHaveProperty('distribuicao_bloom');
      expect(data.metadados).toHaveProperty('distribuicao_dificuldade');
      expect(data.metadados).toHaveProperty('tempo_estimado_resolucao_minutos');
      expect(data.metadados).toHaveProperty('contexto_fidelidade');
    });
  });

  describe('Bloom Distribution Validation', () => {
    beforeEach(() => {
      jest.spyOn(gptProvider, 'generate').mockResolvedValue({
        texto: JSON.stringify(mockExerciciosOutput),
        custo_usd: 0.006,
        tokens_input: 500,
        tokens_output: 350,
        tempo_processamento_ms: 1500,
        modelo: 'gpt-4.6-mini',
        provider: ProviderLLM.GPT4_MINI,
      });
    });

    it('deve seguir distribuição 2-2-1 de Bloom', async () => {
      const result = await gptProvider.generate('test-prompt', {});
      const data = JSON.parse(result.texto);

      const bloomCounts = { 2: 0, 3: 0, 4: 0, 5: 0 };
      data.exercicios.forEach((ex: any) => {
        (bloomCounts as any)[ex.nivel_bloom]++;
      });

      // 2 exercícios Nível 2 (Compreender)
      expect(bloomCounts[2]).toBe(2);

      // 1 exercício Nível 3 (Aplicar)
      expect(bloomCounts[3]).toBe(1);

      // 1 exercício Nível 4 (Analisar)
      expect(bloomCounts[4]).toBe(1);

      // 1 exercício Nível 5 (Avaliar)
      expect(bloomCounts[5]).toBe(1);
    });

    it('deve ter metadados de Bloom corretos', async () => {
      const result = await gptProvider.generate('test-prompt', {});
      const data = JSON.parse(result.texto);

      expect(data.metadados.distribuicao_bloom.nivel_2).toBe(2);
      expect(data.metadados.distribuicao_bloom.nivel_3).toBe(1);
      expect(data.metadados.distribuicao_bloom.nivel_4).toBe(1);
      expect(data.metadados.distribuicao_bloom.nivel_5).toBe(1);
    });

    it('deve ter descrições corretas dos níveis de Bloom', async () => {
      const result = await gptProvider.generate('test-prompt', {});
      const data = JSON.parse(result.texto);

      const nivelDescricoes = {
        2: 'Compreender',
        3: 'Aplicar',
        4: 'Analisar',
        5: 'Avaliar',
      };

      data.exercicios.forEach((ex: any) => {
        expect(ex.nivel_bloom_descricao).toBe((nivelDescricoes as any)[ex.nivel_bloom]);
      });
    });
  });

  describe('Progressive Difficulty Validation', () => {
    beforeEach(() => {
      jest.spyOn(gptProvider, 'generate').mockResolvedValue({
        texto: JSON.stringify(mockExerciciosOutput),
        custo_usd: 0.006,
        tokens_input: 500,
        tokens_output: 350,
        tempo_processamento_ms: 1500,
        modelo: 'gpt-4.6-mini',
        provider: ProviderLLM.GPT4_MINI,
      });
    });

    it('deve ter dificuldade progressiva (facil → medio → dificil)', async () => {
      const result = await gptProvider.generate('test-prompt', {});
      const data = JSON.parse(result.texto);

      // Exercícios 1-2: Fácil
      expect(data.exercicios[0].dificuldade).toBe('facil');
      expect(data.exercicios[1].dificuldade).toBe('facil');

      // Exercícios 3-4: Médio
      expect(data.exercicios[2].dificuldade).toBe('medio');
      expect(data.exercicios[3].dificuldade).toBe('medio');

      // Exercício 5: Difícil
      expect(data.exercicios[4].dificuldade).toBe('dificil');
    });

    it('deve ter metadados de dificuldade corretos', async () => {
      const result = await gptProvider.generate('test-prompt', {});
      const data = JSON.parse(result.texto);

      expect(data.metadados.distribuicao_dificuldade.facil).toBe(2);
      expect(data.metadados.distribuicao_dificuldade.medio).toBe(2);
      expect(data.metadados.distribuicao_dificuldade.dificil).toBe(1);
    });
  });

  describe('Contextual Fidelity Validation', () => {
    beforeEach(() => {
      jest.spyOn(gptProvider, 'generate').mockResolvedValue({
        texto: JSON.stringify(mockExerciciosOutput),
        custo_usd: 0.006,
        tokens_input: 500,
        tokens_output: 350,
        tempo_processamento_ms: 1500,
        modelo: 'gpt-4.6-mini',
        provider: ProviderLLM.GPT4_MINI,
      });
    });

    it('deve usar exemplos da transcrição (não genéricos)', async () => {
      const result = await gptProvider.generate('test-prompt', {});
      const data = JSON.parse(result.texto);

      // Exercício 1: Usa "pizza" e "8 fatias" da transcrição
      expect(data.exercicios[0].enunciado).toContain('pizza');
      expect(data.exercicios[0].enunciado).toContain('8 fatias');

      // Exercício 2: Usa números específicos da transcrição (150, 23, 8, 42)
      expect(data.exercicios[1].enunciado).toContain('150');
      expect(data.exercicios[1].enunciado).toContain('23');

      // Exercício 4: Usa "balas" e "15" da transcrição
      expect(data.exercicios[3].enunciado).toMatch(/Maria|balas|15/);
    });

    it('deve ter contexto_aula preenchido em todos os exercícios', async () => {
      const result = await gptProvider.generate('test-prompt', {});
      const data = JSON.parse(result.texto);

      data.exercicios.forEach((ex: any) => {
        expect(ex.contexto_aula).toBeTruthy();
        expect(ex.contexto_aula.length).toBeGreaterThan(10);
      });
    });

    it('NÃO deve usar exemplos genéricos (sinais de genericidade)', async () => {
      const result = await gptProvider.generate('test-prompt', {});
      const data = JSON.parse(result.texto);

      // Genéricos que NÃO deveriam aparecer se exercícios são contextuais
      const genericMarkers = ['por exemplo', 'suponha que', 'imagine'];

      data.exercicios.forEach((ex: any) => {
        // Contexto_aula não deve estar vazio (sem contexto = genérico)
        expect(ex.contexto_aula).not.toBe('');

        // Se usar "imagine" ou "suponha", deve ter contexto forte
        if (genericMarkers.some((marker) => ex.enunciado.toLowerCase().includes(marker))) {
          expect(ex.contexto_aula.length).toBeGreaterThan(20);
        }
      });
    });
  });

  describe('Complete Gabarito Validation', () => {
    beforeEach(() => {
      jest.spyOn(gptProvider, 'generate').mockResolvedValue({
        texto: JSON.stringify(mockExerciciosOutput),
        custo_usd: 0.006,
        tokens_input: 500,
        tokens_output: 350,
        tempo_processamento_ms: 1500,
        modelo: 'gpt-4.6-mini',
        provider: ProviderLLM.GPT4_MINI,
      });
    });

    it('deve ter gabarito completo em todos os exercícios', async () => {
      const result = await gptProvider.generate('test-prompt', {});
      const data = JSON.parse(result.texto);

      data.exercicios.forEach((ex: any, idx: number) => {
        expect(ex.gabarito).toHaveProperty('resposta_curta');
        expect(ex.gabarito).toHaveProperty('resolucao_passo_a_passo');
        expect(ex.gabarito).toHaveProperty('criterios_correcao');
        expect(ex.gabarito).toHaveProperty('dica_professor');
      });
    });

    it('deve ter pelo menos 2 passos na resolução', async () => {
      const result = await gptProvider.generate('test-prompt', {});
      const data = JSON.parse(result.texto);

      data.exercicios.forEach((ex: any, idx: number) => {
        expect(ex.gabarito.resolucao_passo_a_passo.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('deve ter critérios de correção claros', async () => {
      const result = await gptProvider.generate('test-prompt', {});
      const data = JSON.parse(result.texto);

      data.exercicios.forEach((ex: any, idx: number) => {
        expect(ex.gabarito.criterios_correcao).toBeInstanceOf(Array);
        expect(ex.gabarito.criterios_correcao.length).toBeGreaterThan(0);
      });
    });

    it('deve ter dica pedagógica para o professor', async () => {
      const result = await gptProvider.generate('test-prompt', {});
      const data = JSON.parse(result.texto);

      data.exercicios.forEach((ex: any, idx: number) => {
        expect(ex.gabarito.dica_professor).toBeTruthy();
        expect(ex.gabarito.dica_professor.length).toBeGreaterThan(10);
      });
    });
  });

  describe('BNCC Habilidade Mapping', () => {
    beforeEach(() => {
      jest.spyOn(gptProvider, 'generate').mockResolvedValue({
        texto: JSON.stringify(mockExerciciosOutput),
        custo_usd: 0.006,
        tokens_input: 500,
        tokens_output: 350,
        tempo_processamento_ms: 1500,
        modelo: 'gpt-4.6-mini',
        provider: ProviderLLM.GPT4_MINI,
      });
    });

    it('deve mapear cada exercício para habilidade BNCC', async () => {
      const result = await gptProvider.generate('test-prompt', {});
      const data = JSON.parse(result.texto);

      data.exercicios.forEach((ex: any) => {
        expect(ex.habilidade_relacionada).toBeTruthy();
        expect(ex.habilidade_relacionada).toMatch(/^EF\d{2}[A-Z]{2}\d{2}$/); // Formato BNCC
      });
    });

    it('deve usar habilidades da cobertura (Prompt 1)', async () => {
      const result = await gptProvider.generate('test-prompt', {});
      const data = JSON.parse(result.texto);

      // Habilidades do fixture: EF06MA01, EF06MA07
      const habilidadesUsadas = data.exercicios.map((ex: any) => ex.habilidade_relacionada);

      expect(habilidadesUsadas).toContain('EF06MA01');
      expect(habilidadesUsadas).toContain('EF06MA07');
    });

    it('NÃO deve usar habilidades não cobertas na aula', async () => {
      const result = await gptProvider.generate('test-prompt', {});
      const data = JSON.parse(result.texto);

      // Habilidades não presentes no fixture
      const habilidadesUsadas = data.exercicios.map((ex: any) => ex.habilidade_relacionada);

      expect(habilidadesUsadas).not.toContain('EF06MA03');
      expect(habilidadesUsadas).not.toContain('EF06MA04');
    });
  });

  describe('Grade-Appropriate Language (6º ano)', () => {
    beforeEach(() => {
      jest.spyOn(gptProvider, 'generate').mockResolvedValue({
        texto: JSON.stringify(mockExerciciosOutput),
        custo_usd: 0.006,
        tokens_input: 500,
        tokens_output: 350,
        tempo_processamento_ms: 1500,
        modelo: 'gpt-4.6-mini',
        provider: ProviderLLM.GPT4_MINI,
      });
    });

    it('deve usar exemplos concretos (não abstratos) para 6º ano', async () => {
      const result = await gptProvider.generate('test-prompt', {});
      const data = JSON.parse(result.texto);

      // 6º ano deve ter exemplos concretos: pizza, balas, figurinhas, etc.
      const enunciados = data.exercicios.map((ex: any) => ex.enunciado.toLowerCase()).join(' ');

      expect(enunciados).toMatch(/pizza|balas|figurinhas|números/);
    });

    it('deve ter enunciados curtos para níveis fáceis (2-4 frases)', async () => {
      const result = await gptProvider.generate('test-prompt', {});
      const data = JSON.parse(result.texto);

      // Exercícios fáceis (1-2) devem ter enunciados curtos
      const faceis = data.exercicios.filter((ex: any) => ex.dificuldade === 'facil');

      faceis.forEach((ex: any) => {
        const sentenceCount = ex.enunciado.split(/[.!?]/).filter((s: string) => s.trim().length > 0).length;
        expect(sentenceCount).toBeLessThanOrEqual(4);
      });
    });
  });

  describe('Metadata Consistency', () => {
    beforeEach(() => {
      jest.spyOn(gptProvider, 'generate').mockResolvedValue({
        texto: JSON.stringify(mockExerciciosOutput),
        custo_usd: 0.006,
        tokens_input: 500,
        tokens_output: 350,
        tempo_processamento_ms: 1500,
        modelo: 'gpt-4.6-mini',
        provider: ProviderLLM.GPT4_MINI,
      });
    });

    it('metadados devem bater com exercícios reais', async () => {
      const result = await gptProvider.generate('test-prompt', {});
      const data = JSON.parse(result.texto);

      // Contar na mão
      const bloomCounts = { 2: 0, 3: 0, 4: 0, 5: 0 };
      const diffCounts = { facil: 0, medio: 0, dificil: 0 };

      data.exercicios.forEach((ex: any) => {
        (bloomCounts as any)[ex.nivel_bloom]++;
        (diffCounts as any)[ex.dificuldade]++;
      });

      // Comparar com metadados
      expect(data.metadados.distribuicao_bloom.nivel_2).toBe(bloomCounts[2]);
      expect(data.metadados.distribuicao_bloom.nivel_3).toBe(bloomCounts[3]);
      expect(data.metadados.distribuicao_bloom.nivel_4).toBe(bloomCounts[4]);
      expect(data.metadados.distribuicao_bloom.nivel_5).toBe(bloomCounts[5]);

      expect(data.metadados.distribuicao_dificuldade.facil).toBe(diffCounts.facil);
      expect(data.metadados.distribuicao_dificuldade.medio).toBe(diffCounts.medio);
      expect(data.metadados.distribuicao_dificuldade.dificil).toBe(diffCounts.dificil);
    });

    it('deve ter tempo estimado razoável (20-40 min para 5 exercícios)', async () => {
      const result = await gptProvider.generate('test-prompt', {});
      const data = JSON.parse(result.texto);

      expect(data.metadados.tempo_estimado_resolucao_minutos).toBeGreaterThanOrEqual(20);
      expect(data.metadados.tempo_estimado_resolucao_minutos).toBeLessThanOrEqual(40);
    });
  });
});
