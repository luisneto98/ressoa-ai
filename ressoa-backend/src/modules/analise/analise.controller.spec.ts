import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { AnaliseController } from './analise.controller';
import { AnaliseService } from './services/analise.service';
import { AulasService } from '../aulas/aulas.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

describe('AnaliseController', () => {
  let controller: AnaliseController;
  let analiseService: jest.Mocked<AnaliseService>;
  let aulasService: jest.Mocked<AulasService>;

  const mockUser: AuthenticatedUser = {
    userId: 'prof-123',
    email: 'prof@escola.com',
    escolaId: 'escola-1',
    role: 'PROFESSOR',
  };

  const mockAula = {
    id: 'aula-1',
    titulo: 'Matemática - Equações',
    data: new Date('2026-02-10'),
    professor_id: 'prof-123',
    turma: {
      id: 'turma-1',
      nome: '6º A',
      serie: '6',
      disciplina: 'MATEMATICA',
    },
    status_processamento: 'ANALISADA',
  };

  const mockAnalise = {
    id: 'analise-1',
    aula_id: 'aula-1',
    transcricao_id: 'trans-1',
    planejamento_id: 'plan-1',
    cobertura_json: {
      habilidades: [
        {
          codigo: 'EF06MA01',
          descricao: 'Comparar, ordenar e resolver problemas',
          nivel_cobertura: 'COMPLETE',
          evidencias: [{ texto_literal: 'Vamos resolver equações' }],
        },
      ],
    },
    analise_qualitativa_json: {
      niveis_bloom: { lembrar: 20, entender: 50, aplicar: 30 },
      metodologias: ['Expositiva', 'Resolução de problemas'],
    },
    relatorio_texto: '# Relatório da Aula\n\nExcelente cobertura.',
    exercicios_json: [
      {
        enunciado: 'Resolva a equação x + 5 = 10',
        gabarito: 'x = 5',
        nivel_bloom: 2,
      },
    ],
    alertas_json: {
      alertas: [
        {
          tipo: 'TEMPO_INSUFICIENTE',
          nivel: 'WARNING',
          titulo: 'Tempo reduzido',
          mensagem: 'Aula mais curta que o planejado',
          acoes_sugeridas: ['Revisar planejamento'],
        },
      ],
      sugestoes_proxima_aula: ['Revisar conceitos', 'Propor exercícios'],
    },
    status: 'APROVADA',
    tempo_processamento_ms: 45000,
    custo_total_usd: 0.198,
    prompt_versoes_json: { cobertura: 'v1.0.0', qualitativa: 'v1.0.0' },
    created_at: new Date('2026-02-10T10:00:00Z'),
    updated_at: new Date('2026-02-10T10:00:00Z'),
    aula: mockAula,
    transcricao: { id: 'trans-1', texto: 'Hoje vamos estudar equações' },
    planejamento: { id: 'plan-1', titulo: 'Equações do 1º grau' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnaliseController],
      providers: [
        {
          provide: AnaliseService,
          useValue: {
            findByAulaId: jest.fn(),
          },
        },
        {
          provide: AulasService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AnaliseController>(AnaliseController);
    analiseService = module.get(AnaliseService);
    aulasService = module.get(AulasService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAnaliseByAula', () => {
    it('should return analysis for professor owner', async () => {
      aulasService.findOne.mockResolvedValue(mockAula as any);
      analiseService.findByAulaId.mockResolvedValue(mockAnalise as any);

      const result = await controller.getAnaliseByAula('aula-1', mockUser);

      expect(aulasService.findOne).toHaveBeenCalledWith('aula-1', mockUser);
      expect(aulasService.findOne).toHaveBeenCalledTimes(1);
      expect(analiseService.findByAulaId).toHaveBeenCalledWith('aula-1');
      expect(analiseService.findByAulaId).toHaveBeenCalledTimes(1);

      expect(result).toEqual({
        id: 'analise-1',
        aula: {
          id: 'aula-1',
          titulo: 'Aula - 6º A',
          data_aula: mockAula.data,
          turma: {
            nome: '6º A',
            serie: '6',
            disciplina: 'MATEMATICA',
          },
          status: 'ANALISADA',
        },
        cobertura_bncc: mockAnalise.cobertura_json,
        analise_qualitativa: mockAnalise.analise_qualitativa_json,
        relatorio: mockAnalise.relatorio_texto,
        relatorio_original: mockAnalise.relatorio_texto, // ✅ Story 6.2
        tem_edicao_relatorio: false, // ✅ Story 6.2
        exercicios: mockAnalise.exercicios_json,
        exercicios_original: mockAnalise.exercicios_json, // ✅ Story 6.3
        tem_edicao_exercicios: false, // ✅ Story 6.3
        alertas: mockAnalise.alertas_json,
        status: mockAnalise.status, // ✅ Story 6.2
        metadata: {
          tempo_processamento_ms: 45000,
          custo_total_usd: 0.198,
          prompt_versoes: mockAnalise.prompt_versoes_json,
          created_at: mockAnalise.created_at,
        },
      });
    });

    it('should throw 403 for non-owner professor', async () => {
      const aulaFromOtherProf = {
        ...mockAula,
        professor_id: 'prof-999', // Different professor
      };

      aulasService.findOne.mockResolvedValue(aulaFromOtherProf as any);

      await expect(
        controller.getAnaliseByAula('aula-1', mockUser),
      ).rejects.toThrow(ForbiddenException);

      expect(aulasService.findOne).toHaveBeenCalledWith('aula-1', mockUser);
      expect(aulasService.findOne).toHaveBeenCalledTimes(1);
      expect(analiseService.findByAulaId).not.toHaveBeenCalled();
    });

    it('should throw 404 for non-existent aula', async () => {
      aulasService.findOne.mockResolvedValue(null as any);

      await expect(
        controller.getAnaliseByAula('aula-999', mockUser),
      ).rejects.toThrow(NotFoundException);

      expect(analiseService.findByAulaId).not.toHaveBeenCalled();
    });

    it('should throw 404 for aula without analysis', async () => {
      aulasService.findOne.mockResolvedValue(mockAula as any);
      analiseService.findByAulaId.mockResolvedValue(null);

      await expect(
        controller.getAnaliseByAula('aula-1', mockUser),
      ).rejects.toThrow(NotFoundException);

      expect(aulasService.findOne).toHaveBeenCalledWith('aula-1', mockUser);
      expect(aulasService.findOne).toHaveBeenCalledTimes(1);
      expect(analiseService.findByAulaId).toHaveBeenCalledWith('aula-1');
      expect(analiseService.findByAulaId).toHaveBeenCalledTimes(1);
    });
  });
});
