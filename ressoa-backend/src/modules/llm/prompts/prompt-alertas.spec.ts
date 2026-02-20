import { Test, TestingModule } from '@nestjs/testing';
import { PromptService } from '../services/prompt.service';
import { ClaudeProvider } from '../providers/claude.provider';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Unit tests for Prompt 5 - Detecção de Alertas
 * Story 5.5 - AC5: Test Prompt 5 with Realistic Scenario
 *
 * Tests alert detection logic:
 * - Gap curricular (habilidade não coberta)
 * - Metodologia desequilibrada (>80% expositiva)
 * - JSON parsing and structure validation
 * - Actionable suggestions
 */
describe('Prompt 5 - Detecção de Alertas', () => {
  let promptService: PromptService;
  let claudeProvider: ClaudeProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromptService,
        {
          provide: PrismaService,
          useValue: {
            prompt: {
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: ClaudeProvider,
          useValue: {
            generate: jest.fn(),
            getName: jest.fn().mockReturnValue('claude-haiku'),
          },
        },
      ],
    }).compile();

    promptService = module.get<PromptService>(PromptService);
    claudeProvider = module.get<ClaudeProvider>(ClaudeProvider);
  });

  it('should detect gap curricular (WARNING level)', async () => {
    // Arrange: Mock prompt and LLM response
    const mockPrompt = {
      id: 'prompt-id',
      nome: 'prompt-alertas',
      versao: 'v1.0.0',
      conteudo: 'Mock prompt content {{cobertura}}',
      ativo: true,
    };

    const mockContext = {
      cobertura: {
        habilidades: [
          { codigo: 'EF06MA01', nivel: 3 }, // Completa
          { codigo: 'EF06MA02', nivel: 2 }, // Parcial
          { codigo: 'EF06MA03', nivel: 0 }, // Gap ← alerta esperado
        ],
      },
      analise_qualitativa: {
        metodologias: { expositiva: 50, resolucao_problemas: 50 },
        bloom: { nivel_1_2: 40, nivel_3_4: 60 },
      },
      planejamento: {
        habilidades: [
          { codigo: 'EF06MA01', descricao: 'Habilidade 1' },
          { codigo: 'EF06MA02', descricao: 'Habilidade 2' },
          { codigo: 'EF06MA03', descricao: 'Habilidade 3 (gap)' },
        ],
        bimestre: 1,
        semana_atual: 3,
      },
      turma: { nome: '6A', serie: 6, disciplina: 'MATEMATICA' },
    };

    const mockLLMResponse = {
      alertas: [
        {
          tipo: 'gap_curricular',
          nivel: 'WARNING',
          titulo: 'Gap detectado: EF06MA03 não coberto',
          mensagem:
            'A habilidade EF06MA03 estava planejada mas não foi abordada.',
          acoes_sugeridas: ['Considere abordar na próxima aula'],
          metadata: { habilidade_id: 'EF06MA03', nivel_cobertura_atual: 0 },
        },
      ],
      sugestoes_proxima_aula: ['Priorizar EF06MA03'],
      resumo: {
        total_alertas: 1,
        alertas_criticos: 0,
        alertas_atencao: 1,
        alertas_informativos: 0,
        status_geral: 'atencao_recomendada',
      },
    };

    jest
      .spyOn(promptService, 'getActivePrompt')
      .mockResolvedValue(mockPrompt as any);
    jest
      .spyOn(promptService, 'renderPrompt')
      .mockResolvedValue('Rendered prompt');
    jest.spyOn(claudeProvider, 'generate').mockResolvedValue({
      texto: JSON.stringify(mockLLMResponse),
      provider: 'CLAUDE' as any,
      modelo: 'claude-sonnet-4',
      tokens_input: 500,
      tokens_output: 300,
      custo_usd: 0.008,
      tempo_processamento_ms: 1500,
    });

    // Act: Execute prompt
    const prompt = await promptService.getActivePrompt('prompt-alertas');
    const rendered = await promptService.renderPrompt(prompt, mockContext);
    const result = await claudeProvider.generate(rendered, {
      temperature: 0.4,
      maxTokens: 1000,
    });
    const output = JSON.parse(result.texto);

    // Assert: Validate gap detection
    expect(output.alertas).toHaveLength(1);
    expect(output.alertas[0].tipo).toBe('gap_curricular');
    expect(output.alertas[0].nivel).toBe('WARNING');
    expect(output.alertas[0].metadata.habilidade_id).toBe('EF06MA03');
    expect(output.alertas[0].metadata.nivel_cobertura_atual).toBe(0);
  });

  it('should detect metodologia desequilibrada (WARNING level)', async () => {
    // Arrange
    const mockPrompt = {
      id: 'prompt-id',
      nome: 'prompt-alertas',
      versao: 'v1.0.0',
      conteudo: 'Mock prompt {{analise_qualitativa}}',
      ativo: true,
    };

    const mockContext = {
      cobertura: {
        habilidades: [
          { codigo: 'EF06MA01', nivel: 3 },
          { codigo: 'EF06MA02', nivel: 3 },
        ],
      },
      analise_qualitativa: {
        metodologias: { expositiva: 85, resolucao_problemas: 15 }, // 85% expositiva ← alerta
        bloom: { nivel_1_2: 40, nivel_3_4: 60 },
      },
      planejamento: {
        habilidades: [
          { codigo: 'EF06MA01', descricao: 'Habilidade 1' },
          { codigo: 'EF06MA02', descricao: 'Habilidade 2' },
        ],
        bimestre: 1,
        semana_atual: 3,
      },
      turma: { nome: '6A', serie: 6, disciplina: 'MATEMATICA' },
    };

    const mockLLMResponse = {
      alertas: [
        {
          tipo: 'metodologia_desequilibrada',
          nivel: 'WARNING',
          titulo: 'Aula predominantemente expositiva',
          mensagem: '85% do tempo foi dedicado a metodologia expositiva.',
          acoes_sugeridas: ['Adicionar 10-15 minutos de trabalho em duplas'],
          metadata: { percentual_expositiva: 85 },
        },
      ],
      sugestoes_proxima_aula: ['Incluir atividades colaborativas'],
      resumo: {
        total_alertas: 1,
        alertas_criticos: 0,
        alertas_atencao: 1,
        alertas_informativos: 0,
        status_geral: 'atencao_recomendada',
      },
    };

    jest
      .spyOn(promptService, 'getActivePrompt')
      .mockResolvedValue(mockPrompt as any);
    jest
      .spyOn(promptService, 'renderPrompt')
      .mockResolvedValue('Rendered prompt');
    jest.spyOn(claudeProvider, 'generate').mockResolvedValue({
      texto: JSON.stringify(mockLLMResponse),
      provider: 'CLAUDE' as any,
      modelo: 'claude-sonnet-4',
      tokens_input: 500,
      tokens_output: 300,
      custo_usd: 0.008,
      tempo_processamento_ms: 1500,
    });

    // Act
    const prompt = await promptService.getActivePrompt('prompt-alertas');
    const rendered = await promptService.renderPrompt(prompt, mockContext);
    const result = await claudeProvider.generate(rendered, {
      temperature: 0.4,
      maxTokens: 1000,
    });
    const output = JSON.parse(result.texto);

    // Assert
    expect(output.alertas).toHaveLength(1);
    expect(output.alertas[0].tipo).toBe('metodologia_desequilibrada');
    expect(output.alertas[0].nivel).toBe('WARNING');
    expect(output.alertas[0].metadata.percentual_expositiva).toBe(85);
  });

  it('should provide actionable suggestions', async () => {
    // Arrange
    const mockPrompt = {
      id: 'prompt-id',
      nome: 'prompt-alertas',
      versao: 'v1.0.0',
      conteudo: 'Mock prompt',
      ativo: true,
    };

    const mockContext = {
      cobertura: {},
      analise_qualitativa: {},
      planejamento: {},
      turma: {},
    };

    const mockLLMResponse = {
      alertas: [
        {
          tipo: 'gap_curricular',
          nivel: 'WARNING',
          titulo: 'Gap detectado',
          mensagem: 'Habilidade não coberta',
          acoes_sugeridas: [
            'Considere abordar na próxima aula',
            'Verifique se há tempo hábil no bimestre',
          ],
          metadata: {},
        },
      ],
      sugestoes_proxima_aula: [
        'Priorizar EF06MA03 com 20-25 minutos dedicados',
        'Incluir 2-3 problemas práticos',
      ],
      resumo: {
        total_alertas: 1,
        alertas_criticos: 0,
        alertas_atencao: 1,
        alertas_informativos: 0,
        status_geral: 'atencao_recomendada',
      },
    };

    jest
      .spyOn(promptService, 'getActivePrompt')
      .mockResolvedValue(mockPrompt as any);
    jest
      .spyOn(promptService, 'renderPrompt')
      .mockResolvedValue('Rendered prompt');
    jest.spyOn(claudeProvider, 'generate').mockResolvedValue({
      texto: JSON.stringify(mockLLMResponse),
      provider: 'CLAUDE' as any,
      modelo: 'claude-sonnet-4',
      tokens_input: 500,
      tokens_output: 300,
      custo_usd: 0.008,
      tempo_processamento_ms: 1500,
    });

    // Act
    const prompt = await promptService.getActivePrompt('prompt-alertas');
    const rendered = await promptService.renderPrompt(prompt, mockContext);
    const result = await claudeProvider.generate(rendered, {
      temperature: 0.4,
      maxTokens: 1000,
    });
    const output = JSON.parse(result.texto);

    // Assert: Validate suggestions are actionable
    expect(output.alertas[0].acoes_sugeridas).toHaveLength(2);
    expect(output.alertas[0].acoes_sugeridas[0]).toContain('próxima aula');
    expect(output.sugestoes_proxima_aula).toHaveLength(2);
    expect(output.sugestoes_proxima_aula[0]).toContain('Priorizar');
  });

  it('should parse JSON successfully', async () => {
    // Arrange
    const mockPrompt = {
      id: 'prompt-id',
      nome: 'prompt-alertas',
      versao: 'v1.0.0',
      conteudo: 'Mock prompt',
      ativo: true,
    };

    const mockContext = {
      cobertura: {},
      analise_qualitativa: {},
      planejamento: {},
      turma: {},
    };

    const mockLLMResponse = {
      alertas: [],
      sugestoes_proxima_aula: [],
      resumo: {
        total_alertas: 0,
        alertas_criticos: 0,
        alertas_atencao: 0,
        alertas_informativos: 0,
        status_geral: 'ok',
      },
    };

    jest
      .spyOn(promptService, 'getActivePrompt')
      .mockResolvedValue(mockPrompt as any);
    jest
      .spyOn(promptService, 'renderPrompt')
      .mockResolvedValue('Rendered prompt');
    jest.spyOn(claudeProvider, 'generate').mockResolvedValue({
      texto: JSON.stringify(mockLLMResponse),
      provider: 'CLAUDE' as any,
      modelo: 'claude-sonnet-4',
      tokens_input: 500,
      tokens_output: 100,
      custo_usd: 0.006,
      tempo_processamento_ms: 1500,
    });

    // Act
    const prompt = await promptService.getActivePrompt('prompt-alertas');
    const rendered = await promptService.renderPrompt(prompt, mockContext);
    const result = await claudeProvider.generate(rendered, {
      temperature: 0.4,
      maxTokens: 1000,
    });

    // Assert: JSON should parse without errors
    expect(() => JSON.parse(result.texto)).not.toThrow();
    const output = JSON.parse(result.texto);
    expect(output).toHaveProperty('alertas');
    expect(output).toHaveProperty('sugestoes_proxima_aula');
    expect(output).toHaveProperty('resumo');
  });

  it('should include useful metadata in alertas', async () => {
    // Arrange
    const mockPrompt = {
      id: 'prompt-id',
      nome: 'prompt-alertas',
      versao: 'v1.0.0',
      conteudo: 'Mock prompt',
      ativo: true,
    };

    const mockContext = {
      cobertura: {},
      analise_qualitativa: {},
      planejamento: {},
      turma: {},
    };

    const mockLLMResponse = {
      alertas: [
        {
          tipo: 'gap_curricular',
          nivel: 'CRITICAL',
          titulo: 'Gap crítico detectado',
          mensagem: 'Habilidade não coberta há 3 semanas',
          acoes_sugeridas: ['Ação urgente necessária'],
          metadata: {
            habilidade_id: 'EF06MA05',
            nivel_cobertura_atual: 0,
            semanas_sem_cobertura: 3,
            impacto_potencial: 'alto',
          },
        },
      ],
      sugestoes_proxima_aula: [],
      resumo: {
        total_alertas: 1,
        alertas_criticos: 1,
        alertas_atencao: 0,
        alertas_informativos: 0,
        status_geral: 'acao_urgente',
      },
    };

    jest
      .spyOn(promptService, 'getActivePrompt')
      .mockResolvedValue(mockPrompt as any);
    jest
      .spyOn(promptService, 'renderPrompt')
      .mockResolvedValue('Rendered prompt');
    jest.spyOn(claudeProvider, 'generate').mockResolvedValue({
      texto: JSON.stringify(mockLLMResponse),
      provider: 'CLAUDE' as any,
      modelo: 'claude-sonnet-4',
      tokens_input: 500,
      tokens_output: 350,
      custo_usd: 0.009,
      tempo_processamento_ms: 1500,
    });

    // Act
    const prompt = await promptService.getActivePrompt('prompt-alertas');
    const rendered = await promptService.renderPrompt(prompt, mockContext);
    const result = await claudeProvider.generate(rendered, {
      temperature: 0.4,
      maxTokens: 1000,
    });
    const output = JSON.parse(result.texto);

    // Assert: Metadata should be comprehensive
    expect(output.alertas[0].metadata).toHaveProperty('habilidade_id');
    expect(output.alertas[0].metadata).toHaveProperty('nivel_cobertura_atual');
    expect(output.alertas[0].metadata).toHaveProperty('semanas_sem_cobertura');
    expect(output.alertas[0].metadata.semanas_sem_cobertura).toBe(3);
    expect(output.resumo.status_geral).toBe('acao_urgente');
  });
});
