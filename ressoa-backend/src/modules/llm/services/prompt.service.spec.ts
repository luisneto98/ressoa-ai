import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProviderLLM } from '@prisma/client';
import { PromptService } from './prompt.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('PromptService', () => {
  let service: PromptService;
  let prisma: PrismaService;

  const mockPrismaService = {
    prompt: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromptService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PromptService>(PromptService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clear mocks before each test
    jest.clearAllMocks();
  });

  describe('getActivePrompt', () => {
    it('should return single active prompt when only 1 exists', async () => {
      const mockPrompt = {
        id: 'prompt-1',
        nome: 'prompt-cobertura',
        versao: 'v1.0.0',
        conteudo: 'Template content',
        ativo: true,
        ab_testing: false,
      };

      mockPrismaService.prompt.findMany.mockResolvedValue([mockPrompt]);

      const result = await service.getActivePrompt('prompt-cobertura');

      expect(result).toEqual(mockPrompt);
      expect(prisma.prompt.findMany).toHaveBeenCalledWith({
        where: { nome: 'prompt-cobertura', ativo: true },
        orderBy: { versao: 'desc' },
        take: 2,
      });
    });

    it('should throw NotFoundException when no active prompts', async () => {
      mockPrismaService.prompt.findMany.mockResolvedValue([]);

      await expect(
        service.getActivePrompt('nonexistent-prompt'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getActivePrompt('nonexistent-prompt'),
      ).rejects.toThrow(
        'Nenhum prompt ativo encontrado para: nonexistent-prompt',
      );
    });

    it('should return most recent when 2 exist but ab_testing=false', async () => {
      const mockPrompts = [
        {
          id: 'prompt-2',
          nome: 'prompt-cobertura',
          versao: 'v1.1.0',
          conteudo: 'New version',
          ativo: true,
          ab_testing: false,
        },
        {
          id: 'prompt-1',
          nome: 'prompt-cobertura',
          versao: 'v1.0.0',
          conteudo: 'Old version',
          ativo: true,
          ab_testing: false,
        },
      ];

      mockPrismaService.prompt.findMany.mockResolvedValue(mockPrompts);

      const result = await service.getActivePrompt('prompt-cobertura');

      // Should return the first one (most recent)
      expect(result).toEqual(mockPrompts[0]);
    });

    it('should randomize when 2 exist and ab_testing=true (test distribution)', async () => {
      const mockPrompts = [
        {
          id: 'prompt-2',
          nome: 'prompt-cobertura',
          versao: 'v1.1.0',
          conteudo: 'New version',
          ativo: true,
          ab_testing: true,
        },
        {
          id: 'prompt-1',
          nome: 'prompt-cobertura',
          versao: 'v1.0.0',
          conteudo: 'Old version',
          ativo: true,
          ab_testing: false,
        },
      ];

      mockPrismaService.prompt.findMany.mockResolvedValue(mockPrompts);

      // Run 100 times and check distribution is roughly 50/50
      const results = { v1: 0, v2: 0 };
      for (let i = 0; i < 100; i++) {
        const result = await service.getActivePrompt('prompt-cobertura');
        if (result.versao === 'v1.1.0') results.v2++;
        else results.v1++;
      }

      // Expect roughly 50/50 distribution (with some tolerance)
      // At 100 samples, we expect 40-60 for each with high probability
      expect(results.v1).toBeGreaterThan(30);
      expect(results.v1).toBeLessThan(70);
      expect(results.v2).toBeGreaterThan(30);
      expect(results.v2).toBeLessThan(70);
    });
  });

  describe('renderPrompt', () => {
    it('should correctly substitute {{variables}}', async () => {
      const prompt = {
        id: 'prompt-1',
        nome: 'prompt-cobertura',
        versao: 'v1.0.0',
        conteudo: 'Analise: {{transcricao}} para habilidade {{habilidade}}',
        ativo: true,
        ab_testing: false,
      } as any;

      const variaveis = {
        transcricao: 'aula sobre frações',
        habilidade: 'EF06MA07',
      };

      const result = await service.renderPrompt(prompt, variaveis);

      expect(result).toBe(
        'Analise: aula sobre frações para habilidade EF06MA07',
      );
    });

    it('should handle missing variables gracefully (Handlebars renders as empty)', async () => {
      const prompt = {
        id: 'prompt-1',
        nome: 'test',
        versao: 'v1.0.0',
        conteudo: 'Template: {{var1}} e {{var2}}',
        ativo: true,
        ab_testing: false,
      } as any;

      const variaveis = { var1: 'valor1' };

      const result = await service.renderPrompt(prompt, variaveis);

      // STORY 10.6: Handlebars renders missing variables as empty string (with warning log)
      expect(result).toBe('Template: valor1 e ');
    });

    it('should handle multiple occurrences of same variable', async () => {
      const prompt = {
        id: 'prompt-1',
        nome: 'test',
        versao: 'v1.0.0',
        conteudo: '{{nome}}, bem-vindo! Olá {{nome}}!',
        ativo: true,
        ab_testing: false,
      } as any;

      const variaveis = { nome: 'Professor' };

      const result = await service.renderPrompt(prompt, variaveis);

      expect(result).toBe('Professor, bem-vindo! Olá Professor!');
    });

    it('should convert non-string values to strings', async () => {
      const prompt = {
        id: 'prompt-1',
        nome: 'test',
        versao: 'v1.0.0',
        conteudo: 'Valor: {{numero}}, Booleano: {{bool}}',
        ativo: true,
        ab_testing: false,
      } as any;

      const variaveis = { numero: 42, bool: true };

      const result = await service.renderPrompt(prompt, variaveis);

      expect(result).toBe('Valor: 42, Booleano: true');
    });

    // STORY 10.6: Tests for Handlebars conditional rendering
    describe('Handlebars conditionals (Story 10.6)', () => {
      it('should render "if" block when condition is true', async () => {
        const prompt = {
          id: 'prompt-1',
          nome: 'test-conditional',
          versao: 'v2.0.0',
          conteudo:
            "{{#if (eq tipo_ensino 'MEDIO')}}Ensino Médio{{else}}Ensino Fundamental{{/if}}",
          ativo: true,
          ab_testing: false,
        } as any;

        const variaveis = { tipo_ensino: 'MEDIO' };

        const result = await service.renderPrompt(prompt, variaveis);

        expect(result).toBe('Ensino Médio');
      });

      it('should render "else" block when condition is false', async () => {
        const prompt = {
          id: 'prompt-1',
          nome: 'test-conditional',
          versao: 'v2.0.0',
          conteudo:
            "{{#if (eq tipo_ensino 'MEDIO')}}Ensino Médio{{else}}Ensino Fundamental{{/if}}",
          ativo: true,
          ab_testing: false,
        } as any;

        const variaveis = { tipo_ensino: 'FUNDAMENTAL' };

        const result = await service.renderPrompt(prompt, variaveis);

        expect(result).toBe('Ensino Fundamental');
      });

      it('should handle nested conditionals for 3º ano EM', async () => {
        const prompt = {
          id: 'prompt-1',
          nome: 'test-nested',
          versao: 'v2.0.0',
          conteudo:
            "{{#if (eq tipo_ensino 'MEDIO')}}EM{{#if (eq serie 'TERCEIRO_ANO_EM')}} - 3º ano (ENEM){{/if}}{{else}}EF{{/if}}",
          ativo: true,
          ab_testing: false,
        } as any;

        const variaveis = {
          tipo_ensino: 'MEDIO',
          serie: 'TERCEIRO_ANO_EM',
        };

        const result = await service.renderPrompt(prompt, variaveis);

        expect(result).toBe('EM - 3º ano (ENEM)');
      });

      it('should handle "and" helper correctly', async () => {
        const prompt = {
          id: 'prompt-1',
          nome: 'test-and',
          versao: 'v2.0.0',
          conteudo:
            "{{#if (and (eq tipo_ensino 'MEDIO') (eq disciplina 'MATEMATICA'))}}Matemática EM{{else}}Outro{{/if}}",
          ativo: true,
          ab_testing: false,
        } as any;

        const variaveis = {
          tipo_ensino: 'MEDIO',
          disciplina: 'MATEMATICA',
        };

        const result = await service.renderPrompt(prompt, variaveis);

        expect(result).toBe('Matemática EM');
      });

      it('should handle "or" helper correctly', async () => {
        const prompt = {
          id: 'prompt-1',
          nome: 'test-or',
          versao: 'v2.0.0',
          conteudo:
            "{{#if (or (eq serie 'PRIMEIRO_ANO_EM') (eq serie 'SEGUNDO_ANO_EM'))}}1º ou 2º ano{{else}}Outro{{/if}}",
          ativo: true,
          ab_testing: false,
        } as any;

        const variaveis = {
          serie: 'SEGUNDO_ANO_EM',
        };

        const result = await service.renderPrompt(prompt, variaveis);

        expect(result).toBe('1º ou 2º ano');
      });

      it('should work with complex real-world template (EM context)', async () => {
        const prompt = {
          id: 'prompt-1',
          nome: 'prompt-cobertura',
          versao: 'v2.0.0',
          conteudo: `CONTEXTO:
NÍVEL: {{nivel_ensino}}
FAIXA ETÁRIA: {{faixa_etaria}}
{{#if (eq tipo_ensino 'MEDIO')}}
ESTRUTURA BNCC EM: Áreas de conhecimento
PREPARAÇÃO ENEM: Sim
{{else}}
ESTRUTURA BNCC EF: Unidades temáticas
{{/if}}`,
          ativo: true,
          ab_testing: false,
        } as any;

        const variaveis = {
          nivel_ensino: 'Ensino Médio',
          faixa_etaria: '14-17 anos',
          tipo_ensino: 'MEDIO',
        };

        const result = await service.renderPrompt(prompt, variaveis);

        expect(result).toContain('NÍVEL: Ensino Médio');
        expect(result).toContain('FAIXA ETÁRIA: 14-17 anos');
        expect(result).toContain('ESTRUTURA BNCC EM: Áreas de conhecimento');
        expect(result).toContain('PREPARAÇÃO ENEM: Sim');
        expect(result).not.toContain('ESTRUTURA BNCC EF');
      });

      it('should handle backward compatibility with simple templates', async () => {
        const prompt = {
          id: 'prompt-1',
          nome: 'test-simple',
          versao: 'v1.0.0',
          conteudo: 'Simples: {{transcricao}}',
          ativo: true,
          ab_testing: false,
        } as any;

        const variaveis = { transcricao: 'texto' };

        const result = await service.renderPrompt(prompt, variaveis);

        // Should work exactly like before (no breaking changes)
        expect(result).toBe('Simples: texto');
      });
    });
  });

  describe('createPrompt', () => {
    it('should create prompt in database', async () => {
      const promptData = {
        nome: 'prompt-cobertura',
        versao: 'v1.0.0',
        conteudo: 'Template content {{var}}',
        variaveis: { var: 'string' },
        modelo_sugerido: ProviderLLM.CLAUDE_SONNET,
        ativo: true,
        ab_testing: false,
      };

      const mockCreatedPrompt = { id: 'prompt-1', ...promptData };
      mockPrismaService.prompt.create.mockResolvedValue(mockCreatedPrompt);

      const result = await service.createPrompt(promptData);

      expect(result).toEqual(mockCreatedPrompt);
      expect(prisma.prompt.create).toHaveBeenCalledWith({ data: promptData });
    });
  });

  describe('updatePromptStatus', () => {
    it('should update prompt status', async () => {
      const mockUpdatedPrompt = {
        id: 'prompt-1',
        nome: 'prompt-cobertura',
        versao: 'v1.0.0',
        ativo: false,
        ab_testing: false,
      };

      mockPrismaService.prompt.update.mockResolvedValue(mockUpdatedPrompt);

      const result = await service.updatePromptStatus(
        'prompt-cobertura',
        'v1.0.0',
        { ativo: false },
      );

      expect(result).toEqual(mockUpdatedPrompt);
      expect(prisma.prompt.update).toHaveBeenCalledWith({
        where: { nome_versao: { nome: 'prompt-cobertura', versao: 'v1.0.0' } },
        data: { ativo: false },
      });
    });

    it('should update ab_testing flag', async () => {
      const mockUpdatedPrompt = {
        id: 'prompt-1',
        nome: 'prompt-cobertura',
        versao: 'v1.1.0',
        ativo: true,
        ab_testing: true,
      };

      mockPrismaService.prompt.update.mockResolvedValue(mockUpdatedPrompt);

      const result = await service.updatePromptStatus(
        'prompt-cobertura',
        'v1.1.0',
        { ab_testing: true },
      );

      expect(result).toEqual(mockUpdatedPrompt);
    });
  });
});
