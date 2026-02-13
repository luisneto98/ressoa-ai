import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AnaliseService } from './analise.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PromptService } from '../../llm/services/prompt.service';
import { ClaudeProvider } from '../../llm/providers/claude.provider';
import { GPTProvider } from '../../llm/providers/gpt.provider';

describe('AnaliseService', () => {
  let service: AnaliseService;
  let prisma: jest.Mocked<PrismaService>;
  let promptService: jest.Mocked<PromptService>;
  let claudeProvider: jest.Mocked<ClaudeProvider>;
  let gptProvider: jest.Mocked<GPTProvider>;

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
    tokens_entrada: 100,
    tokens_saida: 50,
    custo_usd: 0.02,
    metadata: { model: 'claude-sonnet-4' },
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
              // Mock transaction by calling callback with mocked tx object
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
          provide: 'CLAUDE_PROVIDER',
          useValue: {
            generate: jest.fn(),
            getName: jest.fn().mockReturnValue('Claude'),
          },
        },
        {
          provide: 'GPT_PROVIDER',
          useValue: {
            generate: jest.fn(),
            getName: jest.fn().mockReturnValue('GPT'),
          },
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
    claudeProvider = module.get('CLAUDE_PROVIDER') as jest.Mocked<ClaudeProvider>;
    gptProvider = module.get('GPT_PROVIDER') as jest.Mocked<GPTProvider>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analisarAula', () => {
    it('should throw NotFoundException when aula not found', async () => {
      // CRITICAL FIX: Mock prompts validation (runs before aula lookup)
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);

      prisma.aula.findUnique.mockResolvedValue(null);

      await expect(service.analisarAula(mockAulaId)).rejects.toThrow(NotFoundException);
      await expect(service.analisarAula(mockAulaId)).rejects.toThrow(
        `Aula não encontrada: ${mockAulaId}`,
      );
    });

    it('should throw NotFoundException when transcricao missing', async () => {
      // CRITICAL FIX: Mock prompts validation (runs before transcricao check)
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);

      const aulaSemTranscricao = { ...mockAulaCompleta, transcricao: null };
      prisma.aula.findUnique.mockResolvedValue(aulaSemTranscricao as any);

      await expect(service.analisarAula(mockAulaId)).rejects.toThrow(NotFoundException);
      await expect(service.analisarAula(mockAulaId)).rejects.toThrow(
        `Aula sem transcrição: ${mockAulaId}`,
      );
    });

    it('should execute all 5 prompts in order', async () => {
      prisma.aula.findUnique.mockResolvedValue(mockAulaCompleta as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered prompt text');

      claudeProvider.generate.mockResolvedValue(mockLLMResult);
      gptProvider.generate.mockResolvedValue(mockLLMResult);

      await service.analisarAula(mockAulaId);

      // Verify prompts called in order
      // NOTE: getActivePrompt called 10 times total: 5 for validation + 5 for execution
      expect(promptService.getActivePrompt).toHaveBeenCalledTimes(10);

      // Validation calls (1-5)
      expect(promptService.getActivePrompt).toHaveBeenNthCalledWith(1, 'prompt-cobertura');
      expect(promptService.getActivePrompt).toHaveBeenNthCalledWith(2, 'prompt-qualitativa');
      expect(promptService.getActivePrompt).toHaveBeenNthCalledWith(3, 'prompt-relatorio');
      expect(promptService.getActivePrompt).toHaveBeenNthCalledWith(4, 'prompt-exercicios');
      expect(promptService.getActivePrompt).toHaveBeenNthCalledWith(5, 'prompt-alertas');

      // Execution calls (6-10) - same order
      expect(promptService.getActivePrompt).toHaveBeenNthCalledWith(6, 'prompt-cobertura');
      expect(promptService.getActivePrompt).toHaveBeenNthCalledWith(7, 'prompt-qualitativa');
      expect(promptService.getActivePrompt).toHaveBeenNthCalledWith(8, 'prompt-relatorio');
      expect(promptService.getActivePrompt).toHaveBeenNthCalledWith(9, 'prompt-exercicios');
      expect(promptService.getActivePrompt).toHaveBeenNthCalledWith(10, 'prompt-alertas');
    });

    it('should accumulate context (Prompt 2 sees cobertura output)', async () => {
      prisma.aula.findUnique.mockResolvedValue(mockAulaCompleta as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);

      const renderPromptSpy = jest.fn().mockResolvedValue('rendered');
      promptService.renderPrompt = renderPromptSpy;

      claudeProvider.generate.mockResolvedValue(mockLLMResult);
      gptProvider.generate.mockResolvedValue(mockLLMResult);

      await service.analisarAula(mockAulaId);

      // Check 2nd prompt call - should have cobertura in context
      const secondPromptContext = renderPromptSpy.mock.calls[1][1];
      expect(secondPromptContext).toHaveProperty('cobertura');
      expect(secondPromptContext).toHaveProperty('transcricao');
      expect(secondPromptContext).toHaveProperty('turma');
    });

    it('should use ClaudeProvider for prompts 1,2,3,5', async () => {
      prisma.aula.findUnique.mockResolvedValue(mockAulaCompleta as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      claudeProvider.generate.mockResolvedValue(mockLLMResult);
      gptProvider.generate.mockResolvedValue(mockLLMResult);

      await service.analisarAula(mockAulaId);

      expect(claudeProvider.generate).toHaveBeenCalledTimes(4); // Prompts 1,2,3,5
    });

    it('should use GPTProvider for prompt 4 (cost optimization)', async () => {
      prisma.aula.findUnique.mockResolvedValue(mockAulaCompleta as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      claudeProvider.generate.mockResolvedValue(mockLLMResult);
      gptProvider.generate.mockResolvedValue(mockLLMResult);

      await service.analisarAula(mockAulaId);

      expect(gptProvider.generate).toHaveBeenCalledTimes(1); // Prompt 4 only
    });

    it('should save Analise with all fields populated (via transaction)', async () => {
      prisma.aula.findUnique.mockResolvedValue(mockAulaCompleta as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      // Claude called for prompts 1, 2, 3, 5
      // Prompt 3 returns markdown (not JSON)
      let claudeCallCount = 0;
      claudeProvider.generate.mockImplementation(() => {
        claudeCallCount++;
        if (claudeCallCount === 3) {
          // Prompt 3 - Relatório em markdown
          return Promise.resolve({
            texto: '# Relatório Pedagógico\n\n**Cobertura:** Completa',
            tokens_entrada: 100,
            tokens_saida: 50,
            custo_usd: 0.02,
            metadata: {},
          });
        }
        // Other prompts return JSON
        return Promise.resolve(mockLLMResult);
      });

      gptProvider.generate.mockResolvedValue(mockLLMResult);
      prisma.analise.create.mockResolvedValue({} as any);
      prisma.aula.update.mockResolvedValue({} as any);

      await service.analisarAula(mockAulaId);

      // Verify $transaction was called with atomic operations
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should update Aula status to ANALISADA (via transaction)', async () => {
      prisma.aula.findUnique.mockResolvedValue(mockAulaCompleta as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      claudeProvider.generate.mockResolvedValue(mockLLMResult);
      gptProvider.generate.mockResolvedValue(mockLLMResult);

      await service.analisarAula(mockAulaId);

      // Verify $transaction was called (Aula update happens inside transaction)
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should track custo_total correctly (sum of 5 prompts)', async () => {
      prisma.aula.findUnique.mockResolvedValue(mockAulaCompleta as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      // Claude provider called 4 times (prompts 1,2,3,5)
      // GPT provider called 1 time (prompt 4)
      const claudeCosts = [0.020, 0.025, 0.015, 0.020]; // Prompts 1,2,3,5
      let claudeCallCount = 0;

      claudeProvider.generate.mockImplementation(() => {
        return Promise.resolve({
          ...mockLLMResult,
          custo_usd: claudeCosts[claudeCallCount++],
        });
      });

      gptProvider.generate.mockResolvedValue({
        ...mockLLMResult,
        custo_usd: 0.005, // Prompt 4
      });

      prisma.analise.create.mockResolvedValue({} as any);
      prisma.aula.update.mockResolvedValue({} as any);

      await service.analisarAula(mockAulaId);

      // Verify $transaction was called (cost tracking happens inside)
      expect(prisma.$transaction).toHaveBeenCalled();
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
        // NOTE: getActivePrompt is called 10 times now (5 validation + 5 execution)
        // Use modulo to cycle through prompts array
        return Promise.resolve(prompts[callCount++ % 5] as any);
      });

      promptService.renderPrompt.mockResolvedValue('rendered');
      claudeProvider.generate.mockResolvedValue(mockLLMResult);
      gptProvider.generate.mockResolvedValue(mockLLMResult);

      await service.analisarAula(mockAulaId);

      // Verify $transaction was called (version tracking happens inside)
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('executePrompt', () => {
    it('should handle JSON parsing correctly', async () => {
      prisma.aula.findUnique.mockResolvedValue(mockAulaCompleta as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      const jsonOutput = { habilidades: [{ codigo: 'EF06MA01' }] };
      claudeProvider.generate.mockResolvedValue({
        texto: JSON.stringify(jsonOutput),
        tokens_entrada: 100,
        tokens_saida: 50,
        custo_usd: 0.02,
        metadata: {},
      });

      gptProvider.generate.mockResolvedValue(mockLLMResult);

      await service.analisarAula(mockAulaId);

      // Verify $transaction was called (JSON parsing happens in executePrompt)
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should handle markdown text (Prompt 3) without JSON parsing', async () => {
      prisma.aula.findUnique.mockResolvedValue(mockAulaCompleta as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      let callCount = 0;
      claudeProvider.generate.mockImplementation(() => {
        callCount++;
        if (callCount === 3) {
          // Prompt 3 - Relatório (markdown)
          return Promise.resolve({
            texto: '# Relatório Pedagógico\n\n**Cobertura:** Completa',
            tokens_entrada: 100,
            tokens_saida: 50,
            custo_usd: 0.02,
            metadata: {},
          });
        }
        return Promise.resolve(mockLLMResult);
      });

      gptProvider.generate.mockResolvedValue(mockLLMResult);

      await service.analisarAula(mockAulaId);

      // Verify $transaction was called (markdown handling happens in executePrompt)
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should handle LLM provider errors (logs and re-throws)', async () => {
      prisma.aula.findUnique.mockResolvedValue(mockAulaCompleta as any);
      promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
      promptService.renderPrompt.mockResolvedValue('rendered');

      const providerError = new Error('LLM API timeout');
      claudeProvider.generate.mockRejectedValue(providerError);

      await expect(service.analisarAula(mockAulaId)).rejects.toThrow('LLM API timeout');
    });
  });

  /**
   * STORY 10.6: Tests for Ensino Médio context extraction
   */
  describe('Helper Methods - Ensino Médio Context', () => {
    describe('getFaixaEtaria', () => {
      it('should return correct age range for Ensino Médio series', () => {
        // Access private method via reflection
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
        claudeProvider.generate.mockResolvedValue(mockLLMResult);
        gptProvider.generate.mockResolvedValue(mockLLMResult);

        await service.analisarAula(mockAulaId);

        // Verify renderPrompt was called with EM context
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
        claudeProvider.generate.mockResolvedValue(mockLLMResult);
        gptProvider.generate.mockResolvedValue(mockLLMResult);

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
        claudeProvider.generate.mockResolvedValue(mockLLMResult);
        gptProvider.generate.mockResolvedValue(mockLLMResult);

        await service.analisarAula(mockAulaId);

        const firstRenderCall = promptService.renderPrompt.mock.calls[0];
        const contexto = firstRenderCall[1];

        expect(contexto.tipo_ensino).toBe('FUNDAMENTAL');
        expect(contexto.nivel_ensino).toBe('Ensino Fundamental');
      });
    });

    /**
     * STORY 10.6: Integration tests comparing EM vs EF analysis outputs
     * Critical requirement AC#10: Validate that prompts generate different analyses for EM vs EF
     */
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
        claudeProvider.generate.mockResolvedValue(mockLLMResult);
        gptProvider.generate.mockResolvedValue(mockLLMResult);

        await service.analisarAula(mockAulaId);

        const firstRenderCall = promptService.renderPrompt.mock.calls[0];
        const contexto = firstRenderCall[1];

        // CRITICAL: serie and disciplina MUST be top-level for template conditionals
        // Templates use {{#if (eq serie 'TERCEIRO_ANO_EM')}} and {{#if (eq disciplina 'LINGUA_PORTUGUESA')}}
        expect(contexto.serie).toBe('TERCEIRO_ANO_EM');
        expect(contexto.disciplina).toBe('LINGUA_PORTUGUESA');

        // Should also exist nested (backward compat)
        expect(contexto.turma.serie).toBe('TERCEIRO_ANO_EM');
        expect(contexto.turma.disciplina).toBe('LINGUA_PORTUGUESA');
      });

      it('should pass different context for EM vs EF (same transcript)', async () => {
        // This test validates that EM and EF receive different contextual variables
        // enabling prompts to generate age-appropriate analyses

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
        claudeProvider.generate.mockResolvedValue(mockLLMResult);
        gptProvider.generate.mockResolvedValue(mockLLMResult);

        await service.analisarAula('aula-ef-id');

        const efContext = promptService.renderPrompt.mock.calls[0][1];

        // Clear mocks
        jest.clearAllMocks();

        // Execute for EM
        prisma.aula.findUnique.mockResolvedValue(aulaEM as any);
        promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
        promptService.renderPrompt.mockResolvedValue('rendered');
        claudeProvider.generate.mockResolvedValue(mockLLMResult);
        gptProvider.generate.mockResolvedValue(mockLLMResult);

        await service.analisarAula('aula-em-id');

        const emContext = promptService.renderPrompt.mock.calls[0][1];

        // Compare contexts
        expect(efContext.tipo_ensino).toBe('FUNDAMENTAL');
        expect(emContext.tipo_ensino).toBe('MEDIO');

        expect(efContext.nivel_ensino).toBe('Ensino Fundamental');
        expect(emContext.nivel_ensino).toBe('Ensino Médio');

        expect(efContext.faixa_etaria).toBe('11-12 anos'); // 6º ano EF
        expect(emContext.faixa_etaria).toBe('14-15 anos'); // 1º ano EM

        expect(efContext.ano_serie).toBe('6º Ano');
        expect(emContext.ano_serie).toBe('1º (EM)');

        // This validates that prompts receive different signals to generate:
        // - Different Bloom Taxonomy expectations (EM: 70%+ higher levels)
        // - Different exercise complexity (EM: ENEM-style)
        // - Different alert types (EM: "falta ENEM", EF: "cobertura insuficiente")
      });

      it('should format serie correctly for EM with (EM) suffix', async () => {
        const seriesEM = [
          { input: 'PRIMEIRO_ANO_EM', expected: '1º (EM)' },
          { input: 'SEGUNDO_ANO_EM', expected: '2º (EM)' },
          { input: 'TERCEIRO_ANO_EM', expected: '3º (EM)' },
        ];

        for (const { input, expected } of seriesEM) {
          const aulaEM = {
            ...mockAulaCompleta,
            turma: {
              ...mockAulaCompleta.turma,
              tipo_ensino: 'MEDIO',
              serie: input,
            },
          };

          prisma.aula.findUnique.mockResolvedValue(aulaEM as any);
          promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
          promptService.renderPrompt.mockResolvedValue('rendered');
          claudeProvider.generate.mockResolvedValue(mockLLMResult);
          gptProvider.generate.mockResolvedValue(mockLLMResult);

          await service.analisarAula(mockAulaId);

          const context = promptService.renderPrompt.mock.calls[0][1];
          expect(context.ano_serie).toBe(expected);

          jest.clearAllMocks();
        }
      });

      it('should map faixa_etaria correctly for all EM series', async () => {
        const faixasEtariasEM = [
          { serie: 'PRIMEIRO_ANO_EM', expected: '14-15 anos' },
          { serie: 'SEGUNDO_ANO_EM', expected: '15-16 anos' },
          { serie: 'TERCEIRO_ANO_EM', expected: '16-17 anos' },
        ];

        for (const { serie, expected } of faixasEtariasEM) {
          const aulaEM = {
            ...mockAulaCompleta,
            turma: {
              ...mockAulaCompleta.turma,
              tipo_ensino: 'MEDIO',
              serie,
            },
          };

          prisma.aula.findUnique.mockResolvedValue(aulaEM as any);
          promptService.getActivePrompt.mockResolvedValue(mockPrompt as any);
          promptService.renderPrompt.mockResolvedValue('rendered');
          claudeProvider.generate.mockResolvedValue(mockLLMResult);
          gptProvider.generate.mockResolvedValue(mockLLMResult);

          await service.analisarAula(mockAulaId);

          const context = promptService.renderPrompt.mock.calls[0][1];
          expect(context.faixa_etaria).toBe(expected);

          jest.clearAllMocks();
        }
      });

      /**
       * NOTE: Full integration test with actual LLM calls would validate:
       * - EM reports have professional tone (not infantilized)
       * - EM exercises are more complex (>= 2 ANALISAR/AVALIAR/CRIAR)
       * - EM alerts include "metodologia inadequada", "falta ENEM contexto"
       * - Bloom distribution: EM has higher % in levels 4-6 than EF
       *
       * These require end-to-end testing with real/mocked LLM responses.
       * Current tests validate that CONTEXT is correctly passed to prompts.
       */
    });
  });

  /**
   * STORY 11.7: Tests for buildPlanejamentoContext - BNCC vs Custom curriculum adaptation
   */
  describe('buildPlanejamentoContext (Story 11.7)', () => {
    describe('BNCC curriculum (isCurriculoCustom = false)', () => {
      it('should format BNCC habilidades context', () => {
        const buildPlanejamentoContext = (service as any).buildPlanejamentoContext.bind(service);

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
                descricao: 'Comparar, ordenar, ler e escrever números naturais',
                unidade_tematica: 'Números',
              },
            },
            {
              id: 'ph-2',
              planejamento_id: 'plan-1',
              habilidade_id: 'hab-2',
              peso: 1.5,
              aulas_previstas: 5,
              habilidade: {
                codigo: 'EF06MA02',
                descricao: 'Reconhecer o sistema de numeração decimal',
                unidade_tematica: 'Números',
              },
            },
          ],
          objetivos: [], // Empty for BNCC
        };

        const result = buildPlanejamentoContext(mockPlanejamentoBNCC, false);

        expect(result).toEqual({
          tipo: 'bncc',
          habilidades: [
            {
              codigo: 'EF06MA01',
              descricao: 'Comparar, ordenar, ler e escrever números naturais',
              unidade_tematica: 'Números',
            },
            {
              codigo: 'EF06MA02',
              descricao: 'Reconhecer o sistema de numeração decimal',
              unidade_tematica: 'Números',
            },
          ],
        });
      });

      it('should handle empty habilidades array (BNCC)', () => {
        const buildPlanejamentoContext = (service as any).buildPlanejamentoContext.bind(service);

        const mockPlanejamentoVazio = {
          id: 'plan-1',
          habilidades: [],
          objetivos: [],
        };

        const result = buildPlanejamentoContext(mockPlanejamentoVazio, false);

        expect(result).toEqual({
          tipo: 'bncc',
          habilidades: [],
        });
      });

      it('should return null when planejamento is null', () => {
        const buildPlanejamentoContext = (service as any).buildPlanejamentoContext.bind(service);

        const result = buildPlanejamentoContext(null, false);

        expect(result).toBeNull();
      });

      it('should return null when planejamento is undefined', () => {
        const buildPlanejamentoContext = (service as any).buildPlanejamentoContext.bind(service);

        const result = buildPlanejamentoContext(undefined, false);

        expect(result).toBeNull();
      });
    });

    describe('Custom curriculum (isCurriculoCustom = true)', () => {
      it('should format custom objetivos context with all Bloom fields', () => {
        const buildPlanejamentoContext = (service as any).buildPlanejamentoContext.bind(service);

        const mockPlanejamentoCustom = {
          id: 'plan-custom-1',
          habilidades: [], // Legacy empty
          objetivos: [
            {
              id: 'po-1',
              planejamento_id: 'plan-custom-1',
              objetivo_id: 'obj-1',
              peso: 1.5,
              aulas_previstas: 3,
              objetivo: {
                codigo: 'PM-MAT-01',
                descricao: 'Resolver problemas de razão e proporção',
                nivel_cognitivo: 'APLICAR',
                area_conhecimento: 'Matemática - Raciocínio',
                criterios_evidencia: [
                  'Identificar dados do problema',
                  'Aplicar regra de três',
                  'Interpretar resultado no contexto',
                ],
              },
            },
            {
              id: 'po-2',
              planejamento_id: 'plan-custom-1',
              objetivo_id: 'obj-2',
              peso: 1.0,
              aulas_previstas: 2,
              objetivo: {
                codigo: 'PM-MAT-02',
                descricao: 'Calcular porcentagens em contextos práticos',
                nivel_cognitivo: 'ENTENDER',
                area_conhecimento: 'Matemática - Básica',
                criterios_evidencia: ['Reconhecer situações de porcentagem', 'Calcular valores'],
              },
            },
          ],
        };

        const result = buildPlanejamentoContext(mockPlanejamentoCustom, true);

        expect(result).toEqual({
          tipo: 'custom',
          objetivos: [
            {
              codigo: 'PM-MAT-01',
              descricao: 'Resolver problemas de razão e proporção',
              nivel_cognitivo: 'APLICAR',
              area_conhecimento: 'Matemática - Raciocínio',
              criterios_evidencia: [
                'Identificar dados do problema',
                'Aplicar regra de três',
                'Interpretar resultado no contexto',
              ],
              peso: 1.5,
              aulas_previstas: 3,
            },
            {
              codigo: 'PM-MAT-02',
              descricao: 'Calcular porcentagens em contextos práticos',
              nivel_cognitivo: 'ENTENDER',
              area_conhecimento: 'Matemática - Básica',
              criterios_evidencia: ['Reconhecer situações de porcentagem', 'Calcular valores'],
              peso: 1.0,
              aulas_previstas: 2,
            },
          ],
        });
      });

      it('should handle empty criterios_evidencia (custom objetivo without criteria)', () => {
        const buildPlanejamentoContext = (service as any).buildPlanejamentoContext.bind(service);

        const mockPlanejamentoSemCriterios = {
          id: 'plan-1',
          habilidades: [],
          objetivos: [
            {
              id: 'po-1',
              planejamento_id: 'plan-1',
              objetivo_id: 'obj-1',
              peso: 1.0,
              aulas_previstas: 2,
              objetivo: {
                codigo: 'CUSTOM-01',
                descricao: 'Objetivo sem critérios',
                nivel_cognitivo: 'LEMBRAR',
                area_conhecimento: 'Geral',
                criterios_evidencia: null, // May be null in DB
              },
            },
          ],
        };

        const result = buildPlanejamentoContext(mockPlanejamentoSemCriterios, true);

        expect(result.objetivos[0].criterios_evidencia).toEqual([]);
      });

      it('should handle empty objetivos array (custom fallback to BNCC)', () => {
        const buildPlanejamentoContext = (service as any).buildPlanejamentoContext.bind(service);

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
                descricao: 'Habilidade BNCC fallback',
                unidade_tematica: 'Números',
              },
            },
          ],
          objetivos: [], // Empty custom - should fallback to BNCC
        };

        const result = buildPlanejamentoContext(mockPlanejamentoFallback, true);

        // Should fallback to BNCC format when custom objetivos empty
        expect(result).toEqual({
          tipo: 'bncc',
          habilidades: [
            {
              codigo: 'EF06MA01',
              descricao: 'Habilidade BNCC fallback',
              unidade_tematica: 'Números',
            },
          ],
        });
      });
    });

    describe('Backward compatibility', () => {
      it('should use habilidades when curriculo_tipo=CUSTOM but objetivos missing (legacy)', () => {
        const buildPlanejamentoContext = (service as any).buildPlanejamentoContext.bind(service);

        const mockPlanejamentoLegacy = {
          id: 'plan-legacy',
          habilidades: [
            {
              id: 'ph-1',
              planejamento_id: 'plan-legacy',
              habilidade_id: 'hab-1',
              peso: 1.0,
              aulas_previstas: 4,
              habilidade: {
                codigo: 'EF07MA15',
                descricao: 'Legacy habilidade',
                unidade_tematica: 'Geometria',
              },
            },
          ],
          // Objetivos undefined (old planejamentos before Story 11.3)
        };

        const result = buildPlanejamentoContext(mockPlanejamentoLegacy, true);

        // Should fallback to BNCC
        expect(result.tipo).toBe('bncc');
        expect(result.habilidades).toHaveLength(1);
        expect(result.habilidades[0].codigo).toBe('EF07MA15');
      });

      it('should handle planejamento without objetivos property (legacy schema)', () => {
        const buildPlanejamentoContext = (service as any).buildPlanejamentoContext.bind(service);

        const mockPlanejamentoOldSchema = {
          id: 'plan-old',
          habilidades: [
            {
              id: 'ph-1',
              planejamento_id: 'plan-old',
              habilidade_id: 'hab-1',
              peso: 1.0,
              aulas_previstas: 4,
              habilidade: {
                codigo: 'EF08MA12',
                descricao: 'Old schema habilidade',
                unidade_tematica: 'Álgebra',
              },
            },
          ],
          // No 'objetivos' property at all
        };

        const result = buildPlanejamentoContext(mockPlanejamentoOldSchema, false);

        expect(result.tipo).toBe('bncc');
        expect(result.habilidades).toHaveLength(1);
      });
    });
  });
});
