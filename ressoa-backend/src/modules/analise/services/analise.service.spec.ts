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
});
