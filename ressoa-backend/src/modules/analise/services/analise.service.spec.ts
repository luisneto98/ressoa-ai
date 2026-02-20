import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Prisma } from '@prisma/client';
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
    // Story 16.2: campo descricao adicionado ao modelo Aula (nullable)
    descricao: null,
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
      // Story 16.1: campo descricao adicionado ao modelo Planejamento (nullable)
      descricao: null,
      validado_coordenacao: true,
      deleted_at: null,
      created_at: new Date(),
      updated_at: new Date(),
      // Story 11.7: objetivos genéricos (vazio para turmas BNCC no mock base)
      objetivos: [],
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
            descricao:
              'Comparar, ordenar, ler e escrever números naturais e números racionais...',
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
    texto:
      '{"habilidades": [{"codigo": "EF06MA01", "nivel_cobertura": "completo"}]}',
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
    prisma = module.get(PrismaService);
    promptService = module.get(PromptService);
    llmRouterService = module.get(LLMRouterService);

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

      await expect(service.analisarAula(mockAulaId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.analisarAula(mockAulaId)).rejects.toThrow(
        `Aula não encontrada: ${mockAulaId}`,
      );
    });

    it('should throw NotFoundException when transcricao missing', async () => {
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      const aulaSemTranscricao = { ...mockAulaCompleta, transcricao: null };
      prisma.aula.findUnique.mockResolvedValue(aulaSemTranscricao as any);

      await expect(service.analisarAula(mockAulaId)).rejects.toThrow(
        NotFoundException,
      );
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
        1,
        'analise_cobertura',
        expect.any(String),
        expect.objectContaining({ temperature: 0.7 }),
      );
      expect(llmRouterService.generateWithFallback).toHaveBeenNthCalledWith(
        2,
        'analise_qualitativa',
        expect.any(String),
        expect.objectContaining({ temperature: 0.7 }),
      );
      expect(llmRouterService.generateWithFallback).toHaveBeenNthCalledWith(
        3,
        'relatorio',
        expect.any(String),
        expect.objectContaining({ temperature: 0.7 }),
      );
      expect(llmRouterService.generateWithFallback).toHaveBeenNthCalledWith(
        4,
        'exercicios',
        expect.any(String),
        expect.objectContaining({ temperature: 0.7 }),
      );
      expect(llmRouterService.generateWithFallback).toHaveBeenNthCalledWith(
        5,
        'alertas',
        expect.any(String),
        expect.objectContaining({ temperature: 0.7 }),
      );
    });

    it('should use temperature and maxTokens from prompt variaveis', async () => {
      llmRouterService.generateWithFallback.mockClear();
      prisma.aula.findUnique.mockResolvedValue(mockAulaCompleta as any);
      promptService.renderPrompt.mockResolvedValue('rendered prompt text');

      const promptsWithTemperature = [
        {
          ...mockPrompt,
          nome: 'prompt-cobertura',
          variaveis: { temperature: 0.3, max_tokens: 2500 },
        },
        {
          ...mockPrompt,
          nome: 'prompt-qualitativa',
          variaveis: { temperature: 0.5, max_tokens: 2000 },
        },
        {
          ...mockPrompt,
          nome: 'prompt-relatorio',
          variaveis: { temperature: 0.6, max_tokens: 3000 },
        },
        {
          ...mockPrompt,
          nome: 'prompt-exercicios',
          variaveis: { temperature: 0.7, max_tokens: 4000 },
        },
        {
          ...mockPrompt,
          nome: 'prompt-alertas',
          variaveis: { temperature: 0.4, max_tokens: 2000 },
        },
      ];

      // getActivePrompt is called 10 times: 5 for validation + 5 for execution
      // Validation calls (0-4) use index % 5, execution calls (5-9) also use index % 5
      let callCount = 0;
      promptService.getActivePrompt.mockImplementation(() => {
        const idx = callCount++ % 5;
        return Promise.resolve(promptsWithTemperature[idx] as any);
      });

      await service.analisarAula(mockAulaId);

      // Verify each prompt's temperature/maxTokens was passed correctly
      const calls = llmRouterService.generateWithFallback.mock.calls;
      expect(calls).toHaveLength(5);

      expect(calls[0][0]).toBe('analise_cobertura');
      expect(calls[0][2]).toEqual({ temperature: 0.3, maxTokens: 2500 });

      expect(calls[1][0]).toBe('analise_qualitativa');
      expect(calls[1][2]).toEqual({ temperature: 0.5, maxTokens: 2000 });

      expect(calls[2][0]).toBe('relatorio');
      expect(calls[2][2]).toEqual({ temperature: 0.6, maxTokens: 3000 });

      expect(calls[3][0]).toBe('exercicios');
      expect(calls[3][2]).toEqual({ temperature: 0.7, maxTokens: 4000 });

      expect(calls[4][0]).toBe('alertas');
      expect(calls[4][2]).toEqual({ temperature: 0.4, maxTokens: 2000 });
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
      const costs = [0.02, 0.025, 0.015, 0.005, 0.02];
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
      expect(createData.provider_stt).toBe('WHISPER');
      expect(createData.custo_stt_usd).toBe(0.05);
      expect(createData.provider_llm_cobertura).toBe('Gemini');
      expect(createData.custo_llm_cobertura_usd).toBe(0.02);
      expect(createData.provider_llm_qualitativa).toBe('Gemini');
      expect(createData.custo_llm_qualitativa_usd).toBe(0.025);
      expect(createData.provider_llm_relatorio).toBe('Gemini');
      expect(createData.custo_llm_relatorio_usd).toBe(0.015);
      expect(createData.provider_llm_exercicios).toBe('GPT');
      expect(createData.custo_llm_exercicios_usd).toBe(0.005);
      expect(createData.provider_llm_alertas).toBe('Gemini');
      expect(createData.custo_llm_alertas_usd).toBe(0.02);
    });

    it('should update Aula status to ANALISADA (via transaction)', async () => {
      prisma.aula.findUnique.mockResolvedValue(mockAulaCompleta as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      await service.analisarAula(mockAulaId);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should track custo_total correctly (STT + 5 prompts LLM)', async () => {
      const costs = [0.02, 0.025, 0.015, 0.005, 0.02];
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

      // Verify custo_total inside transaction (STT=0.05 + LLM=0.085 = 0.135)
      const txCallback = prisma.$transaction.mock.calls[0][0];
      const mockTx = {
        analise: { create: jest.fn().mockResolvedValue({ id: 'analise-1' }) },
        aula: { update: jest.fn().mockResolvedValue({}) },
      };
      await txCallback(mockTx);

      const createData = mockTx.analise.create.mock.calls[0][0].data;
      expect(createData.custo_stt_usd).toBeCloseTo(0.05, 4); // From transcricao.custo_usd
      expect(createData.provider_stt).toBe('WHISPER');
      expect(createData.custo_total_usd).toBeCloseTo(0.135, 4); // STT + LLM
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
        new Error(
          'LLM generation failed for analise_cobertura: primary=GEMINI_FLASH, fallback=CLAUDE_SONNET',
        ),
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

        expect(getFaixaEtaria('FUNDAMENTAL', 'UNKNOWN_SERIES')).toBe(
          '11-14 anos',
        );
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
          turma: {
            ...mockAulaCompleta.turma,
            tipo_ensino: 'FUNDAMENTAL',
            serie: 'SEXTO_ANO',
          },
        };
        const aulaEM = {
          ...mockAulaCompleta,
          turma: {
            ...mockAulaCompleta.turma,
            tipo_ensino: 'MEDIO',
            serie: 'PRIMEIRO_ANO_EM',
          },
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
        const buildPlanejamentoContext = (
          service as any
        ).buildPlanejamentoContext.bind(service);
        const mockPlanejamentoBNCC = {
          id: 'plan-1',
          habilidades: [
            {
              id: 'ph-1',
              planejamento_id: 'plan-1',
              habilidade_id: 'hab-1',
              peso: 1.0,
              aulas_previstas: 4,
              habilidade: {
                codigo: 'EF06MA01',
                descricao: 'Comparar números',
                unidade_tematica: 'Números',
              },
            },
          ],
          objetivos: [],
        };

        const result = buildPlanejamentoContext(mockPlanejamentoBNCC, false);
        expect(result).toEqual({
          tipo: 'bncc',
          habilidades: [
            {
              codigo: 'EF06MA01',
              descricao: 'Comparar números',
              unidade_tematica: 'Números',
            },
          ],
        });
      });

      it('should return null when planejamento is null', () => {
        const buildPlanejamentoContext = (
          service as any
        ).buildPlanejamentoContext.bind(service);
        expect(buildPlanejamentoContext(null, false)).toBeNull();
      });
    });

    describe('Custom curriculum (isCurriculoCustom = true)', () => {
      it('should format custom objetivos context with Bloom fields', () => {
        const buildPlanejamentoContext = (
          service as any
        ).buildPlanejamentoContext.bind(service);
        const mockPlanejamentoCustom = {
          id: 'plan-custom-1',
          habilidades: [],
          objetivos: [
            {
              id: 'po-1',
              planejamento_id: 'plan-custom-1',
              objetivo_id: 'obj-1',
              peso: 1.5,
              aulas_previstas: 3,
              objetivo: {
                codigo: 'PM-MAT-01',
                descricao: 'Resolver problemas',
                nivel_cognitivo: 'APLICAR',
                area_conhecimento: 'Matemática',
                criterios_evidencia: [
                  'Identificar dados',
                  'Aplicar regra de três',
                ],
              },
            },
          ],
        };

        const result = buildPlanejamentoContext(mockPlanejamentoCustom, true);
        expect(result.tipo).toBe('custom');
        expect(result.objetivos).toHaveLength(1);
        expect(result.objetivos[0].nivel_cognitivo).toBe('APLICAR');
      });

      it('should fallback to BNCC when custom objetivos empty', () => {
        const buildPlanejamentoContext = (
          service as any
        ).buildPlanejamentoContext.bind(service);
        const mockPlanejamentoFallback = {
          id: 'plan-1',
          habilidades: [
            {
              id: 'ph-1',
              planejamento_id: 'plan-1',
              habilidade_id: 'hab-1',
              peso: 1.0,
              aulas_previstas: 4,
              habilidade: {
                codigo: 'EF06MA01',
                descricao: 'Fallback',
                unidade_tematica: 'Números',
              },
            },
          ],
          objetivos: [],
        };

        const result = buildPlanejamentoContext(mockPlanejamentoFallback, true);
        expect(result.tipo).toBe('bncc');
      });
    });
  });

  /**
   * STORY 15.6: Tests for SRT-aware prompts and diarization metadata
   */
  describe('Story 15.6: SRT Diarization Metadata in Context', () => {
    it('should pass has_diarization and speaker_stats when metadata_json contains them', async () => {
      const aulaWithDiarization = {
        ...mockAulaCompleta,
        transcricao: {
          ...mockAulaCompleta.transcricao,
          texto:
            '1\n00:00:01,200 --> 00:00:05,800\n[PROFESSOR] Bom dia, turma!\n\n2\n00:00:06,100 --> 00:00:08,400\n[ALUNO] Bom dia!\n',
          metadata_json: {
            has_diarization: true,
            speaker_stats: {
              professor_segments: 10,
              aluno_segments: 5,
              professor_words: 200,
              aluno_words: 50,
            },
          },
        },
      };

      prisma.aula.findUnique.mockResolvedValue(aulaWithDiarization as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      await service.analisarAula(mockAulaId);

      const firstRenderCall = promptService.renderPrompt.mock.calls[0];
      const contexto = firstRenderCall[1];

      expect(contexto.has_diarization).toBe(true);
      expect(contexto.speaker_stats).toEqual({
        professor_segments: 10,
        aluno_segments: 5,
        professor_words: 200,
        aluno_words: 50,
      });
    });

    it('should default has_diarization to false when metadata_json has no diarization', async () => {
      const aulaWithoutDiarization = {
        ...mockAulaCompleta,
        transcricao: {
          ...mockAulaCompleta.transcricao,
          texto: 'Bom dia, turma! Hoje vamos estudar frações...',
          metadata_json: {
            provider: 'whisper',
            has_diarization: false,
          },
        },
      };

      prisma.aula.findUnique.mockResolvedValue(aulaWithoutDiarization as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      await service.analisarAula(mockAulaId);

      const firstRenderCall = promptService.renderPrompt.mock.calls[0];
      const contexto = firstRenderCall[1];

      expect(contexto.has_diarization).toBe(false);
      expect(contexto.speaker_stats).toBeNull();
    });

    it('should not include diarization fields when metadata_json is null', async () => {
      const aulaNoMetadata = {
        ...mockAulaCompleta,
        transcricao: {
          ...mockAulaCompleta.transcricao,
          texto: 'Bom dia, turma!',
          metadata_json: null,
        },
      };

      prisma.aula.findUnique.mockResolvedValue(aulaNoMetadata as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      await service.analisarAula(mockAulaId);

      const firstRenderCall = promptService.renderPrompt.mock.calls[0];
      const contexto = firstRenderCall[1];

      expect(contexto.has_diarization).toBeUndefined();
      expect(contexto.speaker_stats).toBeUndefined();
    });

    it('should pass SRT content as transcricao in context', async () => {
      const srtContent =
        '1\n00:00:01,200 --> 00:00:05,800\n[PROFESSOR] Bom dia, turma!\n\n2\n00:00:06,100 --> 00:00:08,400\n[ALUNO] Bom dia!\n';
      const aulaWithSRT = {
        ...mockAulaCompleta,
        transcricao: {
          ...mockAulaCompleta.transcricao,
          texto: srtContent,
          metadata_json: { has_diarization: true },
        },
      };

      prisma.aula.findUnique.mockResolvedValue(aulaWithSRT as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      await service.analisarAula(mockAulaId);

      const firstRenderCall = promptService.renderPrompt.mock.calls[0];
      const contexto = firstRenderCall[1];

      expect(contexto.transcricao).toBe(srtContent);
    });

    it('should handle plain text transcription (backward compatibility)', async () => {
      const plainText =
        'Bom dia, turma! Hoje vamos estudar frações equivalentes.';
      const aulaPlainText = {
        ...mockAulaCompleta,
        transcricao: {
          ...mockAulaCompleta.transcricao,
          texto: plainText,
          metadata_json: {},
        },
      };

      prisma.aula.findUnique.mockResolvedValue(aulaPlainText as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      await service.analisarAula(mockAulaId);

      const firstRenderCall = promptService.renderPrompt.mock.calls[0];
      const contexto = firstRenderCall[1];

      expect(contexto.transcricao).toBe(plainText);
      // Empty metadata_json should still spread (has_diarization defaults to false)
      expect(contexto.has_diarization).toBe(false);
    });
  });

  /**
   * STORY 16.3: Tests for descricao_planejamento and descricao_aula in context
   */
  describe('Contexto com descrições v5.0.0 (Story 16.3)', () => {
    it('contexto inclui descricao_aula quando aula.descricao existe', async () => {
      const aulaComDescricao = {
        ...mockAulaCompleta,
        descricao: 'Trabalhar frações equivalentes com material concreto',
        planejamento: { ...mockAulaCompleta.planejamento, descricao: null },
      };

      prisma.aula.findUnique.mockResolvedValue(aulaComDescricao as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      await service.analisarAula(mockAulaId);

      const contexto = promptService.renderPrompt.mock.calls[0][1];
      expect(contexto.descricao_aula).toBe(
        'Trabalhar frações equivalentes com material concreto',
      );
    });

    it('contexto inclui descricao_planejamento quando planejamento.descricao existe', async () => {
      const aulaComDescPlanj = {
        ...mockAulaCompleta,
        descricao: null,
        planejamento: {
          ...mockAulaCompleta.planejamento,
          descricao: 'Ênfase em material concreto e jogos matemáticos',
        },
      };

      prisma.aula.findUnique.mockResolvedValue(aulaComDescPlanj as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      await service.analisarAula(mockAulaId);

      const contexto = promptService.renderPrompt.mock.calls[0][1];
      expect(contexto.descricao_planejamento).toBe(
        'Ênfase em material concreto e jogos matemáticos',
      );
    });

    it('contexto tem descricao_aula = null quando aula.descricao é null', async () => {
      const aulaSemDescricao = { ...mockAulaCompleta, descricao: null };

      prisma.aula.findUnique.mockResolvedValue(aulaSemDescricao as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      await service.analisarAula(mockAulaId);

      const contexto = promptService.renderPrompt.mock.calls[0][1];
      expect(contexto.descricao_aula).toBeNull();
    });

    it('contexto tem descricao_planejamento = null quando planejamento.descricao é null', async () => {
      const aulaComPlanjSemDesc = {
        ...mockAulaCompleta,
        planejamento: { ...mockAulaCompleta.planejamento, descricao: null },
      };

      prisma.aula.findUnique.mockResolvedValue(aulaComPlanjSemDesc as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      await service.analisarAula(mockAulaId);

      const contexto = promptService.renderPrompt.mock.calls[0][1];
      expect(contexto.descricao_planejamento).toBeNull();
    });

    it('contexto tem descricao_planejamento = null quando planejamento é null', async () => {
      const aulaSemPlanejamento = { ...mockAulaCompleta, planejamento: null };

      prisma.aula.findUnique.mockResolvedValue(aulaSemPlanejamento as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      await service.analisarAula(mockAulaId);

      const contexto = promptService.renderPrompt.mock.calls[0][1];
      expect(contexto.descricao_planejamento).toBeNull();
    });

    it('pipeline v5 executa sem erro quando ambas descrições são null (retrocompatibilidade)', async () => {
      llmRouterService.generateWithFallback.mockClear(); // Reset call count from previous tests
      const aulaSemDescricoes = {
        ...mockAulaCompleta,
        descricao: null,
        planejamento: { ...mockAulaCompleta.planejamento, descricao: null },
      };

      prisma.aula.findUnique.mockResolvedValue(aulaSemDescricoes as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      const result = await service.analisarAula(mockAulaId);
      expect(result).toBeDefined();

      const contexto = promptService.renderPrompt.mock.calls[0][1];
      expect(contexto.descricao_aula).toBeNull();
      expect(contexto.descricao_planejamento).toBeNull();

      // Todos os 5 prompts devem ter sido executados
      expect(llmRouterService.generateWithFallback).toHaveBeenCalledTimes(5);
    });

    it('descricao_aula e descricao_planejamento são incluídos em todos os 5 prompts do pipeline', async () => {
      const aulaComAmbas = {
        ...mockAulaCompleta,
        descricao: 'Objetivo da aula: frações',
        planejamento: {
          ...mockAulaCompleta.planejamento,
          descricao: 'Planejamento bimestral: números racionais',
        },
      };

      prisma.aula.findUnique.mockResolvedValue(aulaComAmbas as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      await service.analisarAula(mockAulaId);

      // Verifica que todos os 5 renderPrompt calls têm as descrições no contexto
      expect(promptService.renderPrompt).toHaveBeenCalledTimes(5);
      for (let i = 0; i < 5; i++) {
        const contexto = promptService.renderPrompt.mock.calls[i][1];
        expect(contexto.descricao_aula).toBe('Objetivo da aula: frações');
        expect(contexto.descricao_planejamento).toBe(
          'Planejamento bimestral: números racionais',
        );
      }
    });
  });

  /**
   * STORY 15.6: Validate v4.0.0 prompt seed files
   */
  describe('Story 15.6: Prompt Seed Files Validation', () => {
    const promptsDir = join(__dirname, '../../../../prisma/seeds/prompts');

    const promptNames = [
      'prompt-cobertura',
      'prompt-qualitativa',
      'prompt-relatorio',
      'prompt-exercicios',
      'prompt-alertas',
    ];

    it.each(promptNames)(
      'should have v4.0.0 file with ativo=false for %s (superseded by v5.0.0 - Story 16.3)',
      (nome) => {
        const filePath = join(promptsDir, `${nome}-v4.0.0.json`);
        const content = JSON.parse(readFileSync(filePath, 'utf-8'));

        expect(content.nome).toBe(nome);
        expect(content.versao).toBe('v4.0.0');
        expect(content.ativo).toBe(false);
      },
    );

    it.each(promptNames.filter((n) => n !== 'prompt-relatorio'))(
      'should have v5.0.0 file with ativo=true for %s (Story 16.3 — other prompts unaffected by 16.4)',
      (nome) => {
        const filePath = join(promptsDir, `${nome}-v5.0.0.json`);
        const content = JSON.parse(readFileSync(filePath, 'utf-8'));

        expect(content.nome).toBe(nome);
        expect(content.versao).toBe('v5.0.0');
        expect(content.ativo).toBe(true);
        expect(content.variaveis).toHaveProperty('descricao_planejamento');
        expect(content.variaveis).toHaveProperty('descricao_aula');
      },
    );

    it('prompt-relatorio-v5.0.0 should be ativo=false (superseded by v5.1.0 — Story 16.4, AC#3)', () => {
      const filePath = join(promptsDir, 'prompt-relatorio-v5.0.0.json');
      const content = JSON.parse(readFileSync(filePath, 'utf-8'));
      expect(content.nome).toBe('prompt-relatorio');
      expect(content.versao).toBe('v5.0.0');
      expect(content.ativo).toBe(false);
    });

    it.each(promptNames)(
      'should have v3.0.0 file with ativo=false for %s',
      (nome) => {
        const filePath = join(promptsDir, `${nome}-v3.0.0.json`);
        const content = JSON.parse(readFileSync(filePath, 'utf-8'));

        expect(content.nome).toBe(nome);
        expect(content.versao).toBe('v3.0.0');
        expect(content.ativo).toBe(false);
      },
    );

    it.each(promptNames)(
      'v4.0.0 %s should contain speaker label references',
      (nome) => {
        const filePath = join(promptsDir, `${nome}-v4.0.0.json`);
        const content = JSON.parse(readFileSync(filePath, 'utf-8'));

        expect(content.conteudo).toContain('[PROFESSOR]');
        expect(content.conteudo).toContain('[ALUNO]');
        // Prompts 1-2 reference SRT format directly; prompts 3-5 reference speaker labels from analysis
        expect(content.conteudo).toMatch(
          /SRT|speaker label|speaker_analysis|diarização/i,
        );
      },
    );

    it.each(promptNames)(
      'v4.0.0 %s should contain backward compatibility fallback',
      (nome) => {
        const filePath = join(promptsDir, `${nome}-v4.0.0.json`);
        const content = JSON.parse(readFileSync(filePath, 'utf-8'));

        // Each prompt must handle plain text gracefully
        expect(content.conteudo).toMatch(
          /texto puro|sem labels|NÃO contém labels/i,
        );
      },
    );

    it('v4.0.0 prompt-cobertura should have speaker field in evidence schema', () => {
      const filePath = join(promptsDir, 'prompt-cobertura-v4.0.0.json');
      const content = JSON.parse(readFileSync(filePath, 'utf-8'));

      expect(content.conteudo).toContain('"speaker"');
      expect(content.conteudo).toContain('interacoes_relevantes');
    });

    it('v4.0.0 prompt-qualitativa should have participacao_alunos field', () => {
      const filePath = join(promptsDir, 'prompt-qualitativa-v4.0.0.json');
      const content = JSON.parse(readFileSync(filePath, 'utf-8'));

      expect(content.conteudo).toContain('participacao_alunos');
      expect(content.conteudo).toContain('intervencoes_contadas');
    });

    it('v4.0.0 prompt-relatorio should have Dinâmica de Participação section', () => {
      const filePath = join(promptsDir, 'prompt-relatorio-v4.0.0.json');
      const content = JSON.parse(readFileSync(filePath, 'utf-8'));

      expect(content.conteudo).toContain('Dinâmica de Participação');
      expect(content.conteudo).toContain('blockquote');
    });

    it('v4.0.0 prompt-exercicios should reference student doubts for exercises', () => {
      const filePath = join(promptsDir, 'prompt-exercicios-v4.0.0.json');
      const content = JSON.parse(readFileSync(filePath, 'utf-8'));

      expect(content.conteudo).toContain('dúvidas dos alunos');
      expect(content.conteudo).toContain('contexto_aula');
    });

    it('v4.0.0 prompt-alertas should have PARTICIPACAO_DESEQUILIBRADA and INTERACAO_FREQUENTE', () => {
      const filePath = join(promptsDir, 'prompt-alertas-v4.0.0.json');
      const content = JSON.parse(readFileSync(filePath, 'utf-8'));

      expect(content.conteudo).toContain('PARTICIPACAO_DESEQUILIBRADA');
      expect(content.conteudo).toContain('INTERACAO_FREQUENTE');
      expect(content.conteudo).toContain('speaker_analysis');
    });

    it('prompt-relatorio-v5.1.0 should exist with ativo=true, max_tokens=5000, and aderencia_json instruction (Story 16.4)', () => {
      const filePath = join(promptsDir, 'prompt-relatorio-v5.1.0.json');
      const content = JSON.parse(readFileSync(filePath, 'utf-8'));

      expect(content.nome).toBe('prompt-relatorio');
      expect(content.versao).toBe('v5.1.0');
      expect(content.ativo).toBe(true);
      expect(content.variaveis.max_tokens).toBe(5000);
      expect(content.conteudo).toContain('aderencia_json');
      expect(content.conteudo).toContain('faixa_aderencia');
      expect(content.conteudo).toContain('BAIXA');
      expect(content.conteudo).toContain('TOTAL');
      expect(content.conteudo).toContain('avaliar o quanto foi alcançado');
    });
  });

  /**
   * STORY 16.4: Tests for extractAderenciaJson + aderencia_objetivo_json pipeline
   */
  describe('extractAderenciaJson — Story 16.4', () => {
    const validAderenciaJson = {
      faixa_aderencia: 'ALTA',
      descricao_faixa: 'Entre 70% e 90% do objetivo foi trabalhado',
      analise_qualitativa: 'O professor abordou os principais pontos do objetivo. A atividade em grupos foi parcialmente executada.',
      pontos_atingidos: ['Uso de exemplos visuais', 'Vocabulário técnico adequado'],
      pontos_nao_atingidos: ['Atividade em grupos não realizada'],
      recomendacao: 'Retomar a atividade em grupos na próxima aula.',
    };

    const validAderenciaBlock = `\n\`\`\`aderencia_json\n${JSON.stringify(validAderenciaJson, null, 2)}\n\`\`\``;

    it('extrai e valida aderencia_json quando bloco está presente e descricao_aula existe', () => {
      const extractAderenciaJson = (service as any).extractAderenciaJson.bind(service);
      const relatorio = '## Resumo Executivo\n\nÓtima aula.' + validAderenciaBlock;
      const descricaoAula = 'Trabalhar frações equivalentes com material concreto';

      const result = extractAderenciaJson(relatorio, descricaoAula);

      expect(result.aderenciaJson).not.toBeNull();
      expect(result.aderenciaJson.faixa_aderencia).toBe('ALTA');
      expect(result.aderenciaJson.pontos_atingidos).toHaveLength(2);
      expect(result.relatorioLimpo).not.toContain('aderencia_json');
      expect(result.relatorioLimpo).toContain('## Resumo Executivo');
    });

    it('retorna null quando bloco está ausente no output (degradação graciosa)', () => {
      const extractAderenciaJson = (service as any).extractAderenciaJson.bind(service);
      const relatorio = '## Resumo Executivo\n\nÓtima aula sem bloco aderencia.';
      const descricaoAula = 'Trabalhar frações';

      const result = extractAderenciaJson(relatorio, descricaoAula);

      expect(result.aderenciaJson).toBeNull();
      expect(result.relatorioLimpo).toBe(relatorio);
    });

    it('retorna null quando JSON do bloco é inválido (campo obrigatório ausente)', () => {
      const extractAderenciaJson = (service as any).extractAderenciaJson.bind(service);
      const incompleteJson = '{"faixa_aderencia": "ALTA"}'; // missing required fields
      const relatorio = '## Relatório\n\nConteúdo.' + `\n\`\`\`aderencia_json\n${incompleteJson}\n\`\`\``;
      const descricaoAula = 'Objetivo declarado';

      const result = extractAderenciaJson(relatorio, descricaoAula);

      expect(result.aderenciaJson).toBeNull();
    });

    it('retorna null quando descricao_aula é null (sem aderência esperada)', () => {
      const extractAderenciaJson = (service as any).extractAderenciaJson.bind(service);
      const relatorio = '## Relatório\n\nConteúdo.' + validAderenciaBlock;

      const result = extractAderenciaJson(relatorio, null);

      expect(result.aderenciaJson).toBeNull();
      expect(result.relatorioLimpo).toBe(relatorio);
    });

    it('remove bloco aderencia_json do relatorio_limpo preservando restante do markdown', () => {
      const extractAderenciaJson = (service as any).extractAderenciaJson.bind(service);
      const before = '## Seção 1\n\nTexto antes do bloco.';
      const after = '## Seção 2\n\nTexto após o bloco.';
      const relatorio = before + validAderenciaBlock + '\n\n' + after;

      const result = extractAderenciaJson(relatorio, 'Objetivo');

      expect(result.relatorioLimpo).toContain('## Seção 1');
      expect(result.relatorioLimpo).toContain('## Seção 2');
      expect(result.relatorioLimpo).not.toContain('aderencia_json');
      expect(result.relatorioLimpo).not.toContain('faixa_aderencia');
    });

    it('analisarAula persiste aderencia_objetivo_json quando descricao_aula existe', async () => {
      const aulaComDescricao = {
        ...mockAulaCompleta,
        descricao: 'Trabalhar frações equivalentes',
      };

      prisma.aula.findUnique.mockResolvedValue(aulaComDescricao as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      const relatorioComAderencia =
        '## Resumo Executivo\n\nÓtima aula.' + validAderenciaBlock;

      let callCount = 0;
      llmRouterService.generateWithFallback.mockImplementation(() => {
        callCount++;
        if (callCount === 3) {
          return Promise.resolve({ ...mockLLMResult, texto: relatorioComAderencia });
        }
        return Promise.resolve(mockLLMResult);
      });

      await service.analisarAula(mockAulaId);

      const txCallback = prisma.$transaction.mock.calls[0][0];
      const mockTx = {
        analise: { create: jest.fn().mockResolvedValue({ id: 'analise-1' }) },
        aula: { update: jest.fn().mockResolvedValue({}) },
      };
      await txCallback(mockTx);

      const createData = mockTx.analise.create.mock.calls[0][0].data;
      expect(createData.aderencia_objetivo_json).not.toBeNull();
      expect(createData.aderencia_objetivo_json).toMatchObject({
        faixa_aderencia: 'ALTA',
      });
    });

    it('analisarAula salva aderencia_objetivo_json como null quando descricao_aula é null', async () => {
      const aulaSemDescricao = { ...mockAulaCompleta, descricao: null };

      prisma.aula.findUnique.mockResolvedValue(aulaSemDescricao as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      await service.analisarAula(mockAulaId);

      const txCallback = prisma.$transaction.mock.calls[0][0];
      const mockTx = {
        analise: { create: jest.fn().mockResolvedValue({ id: 'analise-1' }) },
        aula: { update: jest.fn().mockResolvedValue({}) },
      };
      await txCallback(mockTx);

      const createData = mockTx.analise.create.mock.calls[0][0].data;
      // When descricao_aula is null, aderenciaJson is null → null ?? Prisma.DbNull = Prisma.DbNull
      expect(createData.aderencia_objetivo_json).toBe(Prisma.DbNull);
    });
  });
});
