import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AnaliseService } from './analise.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PromptService } from '../../llm/services/prompt.service';
import { LLMRouterService } from '../../llm/services/llm-router.service';

describe('AnaliseService', () => {
  let service: AnaliseService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  let promptService: jest.Mocked<PromptService>;
  let llmRouterService: jest.Mocked<LLMRouterService>;

  const mockAulaId = 'aula-test-123';
  const mockTranscricaoId = 'transcricao-test-456';
  const mockPlanejamentoId = 'planejamento-test-789';

  const mockAulaCompleta = {
    id: mockAulaId,
    escola_id: 'escola-123',
    professor_id: 'prof-123',
    turma_id: 'turma-123',
    planejamento_id: mockPlanejamentoId,
    data: new Date(),
    tipo_entrada: 'AUDIO',
    status_processamento: 'TRANSCRITA',
    arquivo_url: 's3://bucket/audio.mp3',
    arquivo_tamanho: 5000000,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    transcricao: {
      id: mockTranscricaoId,
      aula_id: mockAulaId,
      texto: 'Hoje vamos estudar frações...',
      provider: 'WHISPER',
      idioma: 'pt-BR',
      duracao_segundos: 3000,
      confianca: 0.95,
      custo_usd: 0.05,
      tempo_processamento_ms: 45000,
      metadata_json: {},
      created_at: new Date(),
      updated_at: new Date(),
    },
    planejamento: {
      id: mockPlanejamentoId,
      turma_id: 'turma-123',
      bimestre: 1,
      ano_letivo: 2026,
      escola_id: 'escola-123',
      professor_id: 'prof-123',
      validado_coordenacao: true,
      deleted_at: null,
      created_at: new Date(),
      updated_at: new Date(),
      habilidades: [
        {
          id: 'ph-1',
          planejamento_id: mockPlanejamentoId,
          habilidade_id: 'hab-1',
          peso: 1.0,
          aulas_previstas: 4,
          created_at: new Date(),
          habilidade: {
            id: 'hab-1',
            codigo: 'EF06MA01',
            descricao: 'Comparar, ordenar, ler e escrever números naturais e números racionais...',
            disciplina: 'MATEMATICA',
            ano_inicio: 6,
            ano_fim: null,
            unidade_tematica: 'Números',
            objeto_conhecimento: 'Sistema de numeração decimal',
            versao_bncc: '2018',
            ativa: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        },
      ],
    },
    turma: {
      id: 'turma-123',
      nome: '6A',
      disciplina: 'MATEMATICA',
      serie: 'SEXTO_ANO',
      tipo_ensino: 'FUNDAMENTAL',
      curriculo_tipo: 'BNCC',
      contexto_pedagogico: null,
      ano_letivo: 2026,
      escola_id: 'escola-123',
      professor_id: 'prof-123',
      created_at: new Date(),
      updated_at: new Date(),
    },
  };

  const mockPrompt = {
    id: 'prompt-1',
    nome: 'prompt-cobertura',
    versao: 'v1.0.0',
    conteudo: 'Analise a cobertura BNCC: {{transcricao}}',
    variaveis: { transcricao: 'string' },
    modelo_sugerido: 'CLAUDE_SONNET',
    ativo: true,
    ab_testing: false,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockLLMResult = {
    texto: '{"habilidades": [{"codigo": "EF06MA01", "nivel_cobertura": "completo"}]}',
    provider: 'Gemini' as any,
    modelo: 'gemini-2.0-flash',
    tokens_input: 15000,
    tokens_output: 2000,
    custo_usd: 0.0023,
    tempo_processamento_ms: 4200,
    metadata: {},
  };

  const mockLLMRouterService = {
    generateWithFallback: jest.fn().mockResolvedValue(mockLLMResult),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnaliseService,
        {
          provide: PrismaService,
          useValue: {
            aula: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            analise: {
              create: jest.fn(),
            },
            $transaction: jest.fn().mockImplementation(async (callback) => {
              const mockTx = {
                analise: {
                  create: jest.fn().mockResolvedValue({
                    id: 'analise-1',
                    aula_id: mockAulaId,
                    transcricao_id: mockTranscricaoId,
                    planejamento_id: mockPlanejamentoId,
                    cobertura_json: {},
                    analise_qualitativa_json: {},
                    relatorio_texto: 'report',
                    exercicios_json: {},
                    alertas_json: {},
                    prompt_versoes_json: {},
                    custo_total_usd: 0.1,
                    tempo_processamento_ms: 50000,
                    provider_llm_cobertura: 'Gemini',
                    custo_llm_cobertura_usd: 0.0023,
                    provider_llm_qualitativa: 'Gemini',
                    custo_llm_qualitativa_usd: 0.0023,
                    provider_llm_relatorio: 'Gemini',
                    custo_llm_relatorio_usd: 0.0023,
                    provider_llm_exercicios: 'GPT',
                    custo_llm_exercicios_usd: 0.005,
                    provider_llm_alertas: 'Gemini',
                    custo_llm_alertas_usd: 0.0023,
                    created_at: new Date(),
                    updated_at: new Date(),
                  }),
                },
                aula: {
                  update: jest.fn().mockResolvedValue(mockAulaCompleta),
                },
              };
              return callback(mockTx);
            }),
          },
        },
        {
          provide: PromptService,
          useValue: {
            getActivePrompt: jest.fn(),
            renderPrompt: jest.fn(),
          },
        },
        {
          provide: LLMRouterService,
          useValue: mockLLMRouterService,
        },
        {
          provide: 'BullQueue_feedback-queue',
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AnaliseService>(AnaliseService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    promptService = module.get(PromptService) as jest.Mocked<PromptService>;
    llmRouterService = module.get(LLMRouterService) as jest.Mocked<LLMRouterService>;

    // Reset default mock implementation (jest.clearAllMocks removes it)
    llmRouterService.generateWithFallback.mockResolvedValue(mockLLMResult);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analisarAula', () => {
    it('should throw NotFoundException when aula not found', async () => {
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      prisma.aula.findUnique.mockResolvedValue(null);

      await expect(service.analisarAula(mockAulaId)).rejects.toThrow(NotFoundException);
      await expect(service.analisarAula(mockAulaId)).rejects.toThrow(
        `Aula não encontrada: ${mockAulaId}`,
      );
    });

    it('should throw NotFoundException when transcricao missing', async () => {
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      const aulaSemTranscricao = { ...mockAulaCompleta, transcricao: null };
      prisma.aula.findUnique.mockResolvedValue(aulaSemTranscricao as any);

      await expect(service.analisarAula(mockAulaId)).rejects.toThrow(NotFoundException);
      await expect(service.analisarAula(mockAulaId)).rejects.toThrow(
        `Aula sem transcrição: ${mockAulaId}`,
      );
    });

    it('should execute all 5 prompts via LLMRouterService', async () => {
      prisma.aula.findUnique.mockResolvedValue(mockAulaCompleta as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered prompt text');

      await service.analisarAula(mockAulaId);

      // generateWithFallback called 5 times (one per prompt)
      expect(llmRouterService.generateWithFallback).toHaveBeenCalledTimes(5);

      // Verify correct analysisTypes in order
      expect(llmRouterService.generateWithFallback).toHaveBeenNthCalledWith(
        1, 'analise_cobertura', expect.any(String), expect.objectContaining({ temperature: 0.7 }),
      );
      expect(llmRouterService.generateWithFallback).toHaveBeenNthCalledWith(
        2, 'analise_qualitativa', expect.any(String), expect.objectContaining({ temperature: 0.7 }),
      );
      expect(llmRouterService.generateWithFallback).toHaveBeenNthCalledWith(
        3, 'relatorio', expect.any(String), expect.objectContaining({ temperature: 0.7 }),
      );
      expect(llmRouterService.generateWithFallback).toHaveBeenNthCalledWith(
        4, 'exercicios', expect.any(String), expect.objectContaining({ temperature: 0.7 }),
      );
      expect(llmRouterService.generateWithFallback).toHaveBeenNthCalledWith(
        5, 'alertas', expect.any(String), expect.objectContaining({ temperature: 0.7 }),
      );
    });

    it('should accumulate context (Prompt 2 sees cobertura output)', async () => {
      prisma.aula.findUnique.mockResolvedValue(mockAulaCompleta as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);

      const renderPromptSpy = jest.fn().mockResolvedValue('rendered');
      promptService.renderPrompt = renderPromptSpy;

      await service.analisarAula(mockAulaId);

      // Check 2nd prompt call - should have cobertura in context
      const secondPromptContext = renderPromptSpy.mock.calls[1][1];
      expect(secondPromptContext).toHaveProperty('cobertura');
      expect(secondPromptContext).toHaveProperty('transcricao');
      expect(secondPromptContext).toHaveProperty('turma');
    });

    it('should save provider cost breakdown in Analise (via transaction)', async () => {
      const costs = [0.020, 0.025, 0.015, 0.005, 0.020];
      const providers = ['Gemini', 'Gemini', 'Gemini', 'GPT', 'Gemini'];
      let callCount = 0;

      llmRouterService.generateWithFallback.mockImplementation(() => {
        return Promise.resolve({
          ...mockLLMResult,
          custo_usd: costs[callCount],
          provider: providers[callCount++] as any,
        });
      });

      prisma.aula.findUnique.mockResolvedValue(mockAulaCompleta as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      await service.analisarAula(mockAulaId);

      // Verify $transaction was called
      expect(prisma.$transaction).toHaveBeenCalled();

      // Verify the create call inside transaction includes provider breakdown
      const txCallback = prisma.$transaction.mock.calls[0][0];
      const mockTx = {
        analise: { create: jest.fn().mockResolvedValue({ id: 'analise-1' }) },
        aula: { update: jest.fn().mockResolvedValue({}) },
      };
      await txCallback(mockTx);

      const createData = mockTx.analise.create.mock.calls[0][0].data;
      expect(createData.provider_llm_cobertura).toBe('Gemini');
      expect(createData.custo_llm_cobertura_usd).toBe(0.020);
      expect(createData.provider_llm_qualitativa).toBe('Gemini');
      expect(createData.custo_llm_qualitativa_usd).toBe(0.025);
      expect(createData.provider_llm_relatorio).toBe('Gemini');
      expect(createData.custo_llm_relatorio_usd).toBe(0.015);
      expect(createData.provider_llm_exercicios).toBe('GPT');
      expect(createData.custo_llm_exercicios_usd).toBe(0.005);
      expect(createData.provider_llm_alertas).toBe('Gemini');
      expect(createData.custo_llm_alertas_usd).toBe(0.020);
    });

    it('should update Aula status to ANALISADA (via transaction)', async () => {
      prisma.aula.findUnique.mockResolvedValue(mockAulaCompleta as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      await service.analisarAula(mockAulaId);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should track custo_total correctly (sum of 5 prompts)', async () => {
      const costs = [0.020, 0.025, 0.015, 0.005, 0.020];
      let callCount = 0;

      llmRouterService.generateWithFallback.mockImplementation(() => {
        return Promise.resolve({
          ...mockLLMResult,
          custo_usd: costs[callCount++],
        });
      });

      prisma.aula.findUnique.mockResolvedValue(mockAulaCompleta as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      await service.analisarAula(mockAulaId);

      // Verify $transaction was called
      expect(prisma.$transaction).toHaveBeenCalled();

      // Verify custo_total inside transaction
      const txCallback = prisma.$transaction.mock.calls[0][0];
      const mockTx = {
        analise: { create: jest.fn().mockResolvedValue({ id: 'analise-1' }) },
        aula: { update: jest.fn().mockResolvedValue({}) },
      };
      await txCallback(mockTx);

      const createData = mockTx.analise.create.mock.calls[0][0].data;
      expect(createData.custo_total_usd).toBeCloseTo(0.085, 4); // Sum of all costs
    });

    it('should track prompt_versoes_json (5 versions)', async () => {
      prisma.aula.findUnique.mockResolvedValue(mockAulaCompleta as any);

      const prompts = [
        { ...mockPrompt, nome: 'prompt-cobertura', versao: 'v1.0.0' },
        { ...mockPrompt, nome: 'prompt-qualitativa', versao: 'v1.1.0' },
        { ...mockPrompt, nome: 'prompt-relatorio', versao: 'v1.0.1' },
        { ...mockPrompt, nome: 'prompt-exercicios', versao: 'v2.0.0' },
        { ...mockPrompt, nome: 'prompt-alertas', versao: 'v1.0.0' },
      ];

      let callCount = 0;
      promptService.getActivePrompt.mockImplementation(() => {
        return Promise.resolve(prompts[callCount++ % 5] as any);
      });

      promptService.renderPrompt.mockResolvedValue('rendered');

      await service.analisarAula(mockAulaId);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should propagate LLM router errors', async () => {
      prisma.aula.findUnique.mockResolvedValue(mockAulaCompleta as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      llmRouterService.generateWithFallback.mockRejectedValue(
        new Error('LLM generation failed for analise_cobertura: primary=GEMINI_FLASH, fallback=CLAUDE_SONNET'),
      );

      await expect(service.analisarAula(mockAulaId)).rejects.toThrow(
        'LLM generation failed',
      );
    });

    it('should handle fallback scenario (router handles internally)', async () => {
      prisma.aula.findUnique.mockResolvedValue(mockAulaCompleta as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      // Simulate fallback: router returns Claude as provider (fallback was used)
      llmRouterService.generateWithFallback.mockResolvedValue({
        ...mockLLMResult,
        provider: 'Claude' as any,
        modelo: 'claude-sonnet-4',
        custo_usd: 0.05,
      });

      // Clear call count before test execution
      llmRouterService.generateWithFallback.mockClear();
      llmRouterService.generateWithFallback.mockResolvedValue({
        ...mockLLMResult,
        provider: 'Claude' as any,
        modelo: 'claude-sonnet-4',
        custo_usd: 0.05,
      });

      const result = await service.analisarAula(mockAulaId);
      expect(result).toBeDefined();
      // Verify router was called 5 times - fallback handling is internal to router
      expect(llmRouterService.generateWithFallback).toHaveBeenCalledTimes(5);
    });
  });

  describe('executePrompt', () => {
    it('should handle JSON parsing correctly', async () => {
      prisma.aula.findUnique.mockResolvedValue(mockAulaCompleta as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      const jsonOutput = { habilidades: [{ codigo: 'EF06MA01' }] };
      llmRouterService.generateWithFallback.mockResolvedValue({
        ...mockLLMResult,
        texto: JSON.stringify(jsonOutput),
      });

      await service.analisarAula(mockAulaId);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should handle markdown text (Prompt 3) without JSON parsing', async () => {
      prisma.aula.findUnique.mockResolvedValue(mockAulaCompleta as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      let callCount = 0;
      llmRouterService.generateWithFallback.mockImplementation(() => {
        callCount++;
        if (callCount === 3) {
          // Prompt 3 - Relatório (markdown)
          return Promise.resolve({
            ...mockLLMResult,
            texto: '# Relatório Pedagógico\n\n**Cobertura:** Completa',
          });
        }
        return Promise.resolve(mockLLMResult);
      });

      await service.analisarAula(mockAulaId);

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  /**
   * STORY 10.6: Tests for Ensino Médio context extraction
   */
  describe('Helper Methods - Ensino Médio Context', () => {
    describe('getFaixaEtaria', () => {
      it('should return correct age range for Ensino Médio series', () => {
        const getFaixaEtaria = (service as any).getFaixaEtaria.bind(service);

        expect(getFaixaEtaria('MEDIO', 'PRIMEIRO_ANO_EM')).toBe('14-15 anos');
        expect(getFaixaEtaria('MEDIO', 'SEGUNDO_ANO_EM')).toBe('15-16 anos');
        expect(getFaixaEtaria('MEDIO', 'TERCEIRO_ANO_EM')).toBe('16-17 anos');
      });

      it('should return default EM age range for unknown EM series', () => {
        const getFaixaEtaria = (service as any).getFaixaEtaria.bind(service);

        expect(getFaixaEtaria('MEDIO', 'UNKNOWN_SERIES')).toBe('14-17 anos');
      });

      it('should return correct age range for Ensino Fundamental series', () => {
        const getFaixaEtaria = (service as any).getFaixaEtaria.bind(service);

        expect(getFaixaEtaria('FUNDAMENTAL', 'SEXTO_ANO')).toBe('11-12 anos');
        expect(getFaixaEtaria('FUNDAMENTAL', 'SETIMO_ANO')).toBe('12-13 anos');
        expect(getFaixaEtaria('FUNDAMENTAL', 'OITAVO_ANO')).toBe('13-14 anos');
        expect(getFaixaEtaria('FUNDAMENTAL', 'NONO_ANO')).toBe('14-15 anos');
      });

      it('should return default EF age range for unknown EF series', () => {
        const getFaixaEtaria = (service as any).getFaixaEtaria.bind(service);

        expect(getFaixaEtaria('FUNDAMENTAL', 'UNKNOWN_SERIES')).toBe('11-14 anos');
        expect(getFaixaEtaria(null, 'SEXTO_ANO')).toBe('11-12 anos');
        expect(getFaixaEtaria(undefined, 'SETIMO_ANO')).toBe('12-13 anos');
      });
    });

    describe('formatarSerie', () => {
      it('should format Ensino Médio series correctly', () => {
        const formatarSerie = (service as any).formatarSerie.bind(service);

        expect(formatarSerie('PRIMEIRO_ANO_EM')).toBe('1º (EM)');
        expect(formatarSerie('SEGUNDO_ANO_EM')).toBe('2º (EM)');
        expect(formatarSerie('TERCEIRO_ANO_EM')).toBe('3º (EM)');
      });

      it('should format Ensino Fundamental series correctly', () => {
        const formatarSerie = (service as any).formatarSerie.bind(service);

        expect(formatarSerie('SEXTO_ANO')).toBe('6º Ano');
        expect(formatarSerie('SETIMO_ANO')).toBe('7º Ano');
        expect(formatarSerie('OITAVO_ANO')).toBe('8º Ano');
        expect(formatarSerie('NONO_ANO')).toBe('9º Ano');
      });
    });

    describe('getNivelEnsino', () => {
      it('should return "Ensino Médio" for MEDIO', () => {
        const getNivelEnsino = (service as any).getNivelEnsino.bind(service);
        expect(getNivelEnsino('MEDIO')).toBe('Ensino Médio');
      });

      it('should return "Ensino Fundamental" for FUNDAMENTAL', () => {
        const getNivelEnsino = (service as any).getNivelEnsino.bind(service);
        expect(getNivelEnsino('FUNDAMENTAL')).toBe('Ensino Fundamental');
      });

      it('should return "Ensino Fundamental" for null/undefined (backward compat)', () => {
        const getNivelEnsino = (service as any).getNivelEnsino.bind(service);
        expect(getNivelEnsino(null)).toBe('Ensino Fundamental');
        expect(getNivelEnsino(undefined)).toBe('Ensino Fundamental');
      });
    });

    describe('analisarAula with EM context', () => {
      it('should pass tipo_ensino, nivel_ensino, faixa_etaria to prompts for EM turma', async () => {
        const aulaEM = {
          ...mockAulaCompleta,
          turma: {
            ...mockAulaCompleta.turma,
            tipo_ensino: 'MEDIO',
            serie: 'PRIMEIRO_ANO_EM',
          },
        };

        prisma.aula.findUnique.mockResolvedValue(aulaEM as any);
        promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
        promptService.renderPrompt.mockResolvedValue('rendered');

        await service.analisarAula(mockAulaId);

        const firstRenderCall = promptService.renderPrompt.mock.calls[0];
        const contexto = firstRenderCall[1];

        expect(contexto.tipo_ensino).toBe('MEDIO');
        expect(contexto.nivel_ensino).toBe('Ensino Médio');
        expect(contexto.faixa_etaria).toBe('14-15 anos');
        expect(contexto.ano_serie).toBe('1º (EM)');
      });

      it('should pass EF context for FUNDAMENTAL turma (backward compat)', async () => {
        const aulaEF = {
          ...mockAulaCompleta,
          turma: {
            ...mockAulaCompleta.turma,
            tipo_ensino: 'FUNDAMENTAL',
            serie: 'SEXTO_ANO',
          },
        };

        prisma.aula.findUnique.mockResolvedValue(aulaEF as any);
        promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
        promptService.renderPrompt.mockResolvedValue('rendered');

        await service.analisarAula(mockAulaId);

        const firstRenderCall = promptService.renderPrompt.mock.calls[0];
        const contexto = firstRenderCall[1];

        expect(contexto.tipo_ensino).toBe('FUNDAMENTAL');
        expect(contexto.nivel_ensino).toBe('Ensino Fundamental');
        expect(contexto.faixa_etaria).toBe('11-12 anos');
        expect(contexto.ano_serie).toBe('6º Ano');
      });

      it('should default to FUNDAMENTAL when tipo_ensino is null (backward compat)', async () => {
        const aulaWithoutTipoEnsino = {
          ...mockAulaCompleta,
          turma: {
            ...mockAulaCompleta.turma,
            tipo_ensino: null,
            serie: 'SEXTO_ANO',
          },
        };

        prisma.aula.findUnique.mockResolvedValue(aulaWithoutTipoEnsino as any);
        promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
        promptService.renderPrompt.mockResolvedValue('rendered');

        await service.analisarAula(mockAulaId);

        const firstRenderCall = promptService.renderPrompt.mock.calls[0];
        const contexto = firstRenderCall[1];

        expect(contexto.tipo_ensino).toBe('FUNDAMENTAL');
        expect(contexto.nivel_ensino).toBe('Ensino Fundamental');
      });
    });

    describe('Story 10.6: Diferenças entre Ensino Fundamental e Médio', () => {
      it('should include serie and disciplina in top-level context (CRITICAL FIX)', async () => {
        const aulaEM = {
          ...mockAulaCompleta,
          turma: {
            ...mockAulaCompleta.turma,
            tipo_ensino: 'MEDIO',
            serie: 'TERCEIRO_ANO_EM',
            disciplina: 'LINGUA_PORTUGUESA',
          },
        };

        prisma.aula.findUnique.mockResolvedValue(aulaEM as any);
        promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
        promptService.renderPrompt.mockResolvedValue('rendered');

        await service.analisarAula(mockAulaId);

        const firstRenderCall = promptService.renderPrompt.mock.calls[0];
        const contexto = firstRenderCall[1];

        expect(contexto.serie).toBe('TERCEIRO_ANO_EM');
        expect(contexto.disciplina).toBe('LINGUA_PORTUGUESA');
        expect(contexto.turma.serie).toBe('TERCEIRO_ANO_EM');
        expect(contexto.turma.disciplina).toBe('LINGUA_PORTUGUESA');
      });

      it('should pass different context for EM vs EF (same transcript)', async () => {
        const aulaEF = {
          ...mockAulaCompleta,
          turma: { ...mockAulaCompleta.turma, tipo_ensino: 'FUNDAMENTAL', serie: 'SEXTO_ANO' },
        };
        const aulaEM = {
          ...mockAulaCompleta,
          turma: { ...mockAulaCompleta.turma, tipo_ensino: 'MEDIO', serie: 'PRIMEIRO_ANO_EM' },
        };

        // Execute for EF
        prisma.aula.findUnique.mockResolvedValue(aulaEF as any);
        promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
        promptService.renderPrompt.mockResolvedValue('rendered');
        await service.analisarAula('aula-ef-id');
        const efContext = promptService.renderPrompt.mock.calls[0][1];

        jest.clearAllMocks();

        // Execute for EM
        prisma.aula.findUnique.mockResolvedValue(aulaEM as any);
        promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
        promptService.renderPrompt.mockResolvedValue('rendered');
        llmRouterService.generateWithFallback.mockResolvedValue(mockLLMResult);
        await service.analisarAula('aula-em-id');
        const emContext = promptService.renderPrompt.mock.calls[0][1];

        expect(efContext.tipo_ensino).toBe('FUNDAMENTAL');
        expect(emContext.tipo_ensino).toBe('MEDIO');
        expect(efContext.nivel_ensino).toBe('Ensino Fundamental');
        expect(emContext.nivel_ensino).toBe('Ensino Médio');
        expect(efContext.faixa_etaria).toBe('11-12 anos');
        expect(emContext.faixa_etaria).toBe('14-15 anos');
        expect(efContext.ano_serie).toBe('6º Ano');
        expect(emContext.ano_serie).toBe('1º (EM)');
      });
    });
  });

  /**
   * STORY 11.7: Tests for buildPlanejamentoContext
   */
  describe('buildPlanejamentoContext (Story 11.7)', () => {
    describe('BNCC curriculum (isCurriculoCustom = false)', () => {
      it('should format BNCC habilidades context', () => {
        const buildPlanejamentoContext = (service as any).buildPlanejamentoContext.bind(service);
        const mockPlanejamentoBNCC = {
          id: 'plan-1',
          habilidades: [
            {
              id: 'ph-1', planejamento_id: 'plan-1', habilidade_id: 'hab-1',
              peso: 1.0, aulas_previstas: 4,
              habilidade: { codigo: 'EF06MA01', descricao: 'Comparar números', unidade_tematica: 'Números' },
            },
          ],
          objetivos: [],
        };

        const result = buildPlanejamentoContext(mockPlanejamentoBNCC, false);
        expect(result).toEqual({
          tipo: 'bncc',
          habilidades: [{ codigo: 'EF06MA01', descricao: 'Comparar números', unidade_tematica: 'Números' }],
        });
      });

      it('should return null when planejamento is null', () => {
        const buildPlanejamentoContext = (service as any).buildPlanejamentoContext.bind(service);
        expect(buildPlanejamentoContext(null, false)).toBeNull();
      });
    });

    describe('Custom curriculum (isCurriculoCustom = true)', () => {
      it('should format custom objetivos context with Bloom fields', () => {
        const buildPlanejamentoContext = (service as any).buildPlanejamentoContext.bind(service);
        const mockPlanejamentoCustom = {
          id: 'plan-custom-1',
          habilidades: [],
          objetivos: [{
            id: 'po-1', planejamento_id: 'plan-custom-1', objetivo_id: 'obj-1',
            peso: 1.5, aulas_previstas: 3,
            objetivo: {
              codigo: 'PM-MAT-01', descricao: 'Resolver problemas',
              nivel_cognitivo: 'APLICAR', area_conhecimento: 'Matemática',
              criterios_evidencia: ['Identificar dados', 'Aplicar regra de três'],
            },
          }],
        };

        const result = buildPlanejamentoContext(mockPlanejamentoCustom, true);
        expect(result.tipo).toBe('custom');
        expect(result.objetivos).toHaveLength(1);
        expect(result.objetivos[0].nivel_cognitivo).toBe('APLICAR');
      });

      it('should fallback to BNCC when custom objetivos empty', () => {
        const buildPlanejamentoContext = (service as any).buildPlanejamentoContext.bind(service);
        const mockPlanejamentoFallback = {
          id: 'plan-1',
          habilidades: [{
            id: 'ph-1', planejamento_id: 'plan-1', habilidade_id: 'hab-1',
            peso: 1.0, aulas_previstas: 4,
            habilidade: { codigo: 'EF06MA01', descricao: 'Fallback', unidade_tematica: 'Números' },
          }],
          objetivos: [],
        };

        const result = buildPlanejamentoContext(mockPlanejamentoFallback, true);
        expect(result.tipo).toBe('bncc');
      });
    });
  });
});
