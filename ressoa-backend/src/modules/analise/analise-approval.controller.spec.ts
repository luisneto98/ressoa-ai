import { Test, TestingModule } from '@nestjs/testing';
import { AnaliseApprovalController } from './analise-approval.controller';
import { AnaliseService } from './services/analise.service';
import { AulasService } from '../aulas/aulas.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { StatusAnalise } from '@prisma/client';

describe('AnaliseApprovalController - Story 6.3: editarExercicios', () => {
  let controller: AnaliseApprovalController;
  let analiseService: jest.Mocked<AnaliseService>;
  let aulasService: jest.Mocked<AulasService>;

  const mockUser = {
    userId: 'user-123',
    escolaId: 'escola-123',
    email: 'prof@escola.com',
    role: 'PROFESSOR' as const,
  };

  const mockAnalise = {
    id: 'analise-123',
    aula_id: 'aula-123',
    transcricao_id: 'trans-123',
    planejamento_id: null,
    cobertura_json: {},
    analise_qualitativa_json: {},
    relatorio_texto: 'Original report',
    relatorio_editado: null,
    exercicios_json: {
      questoes: [
        {
          numero: 1,
          enunciado: 'Questão original',
          alternativas: [
            { letra: 'A', texto: 'Alt A', correta: true },
            { letra: 'B', texto: 'Alt B', correta: false },
            { letra: 'C', texto: 'Alt C', correta: false },
            { letra: 'D', texto: 'Alt D', correta: false },
          ],
          habilidade_bncc: 'EF06MA01',
          nivel_bloom: 'Aplicação',
          explicacao: 'Explicação original',
        },
      ],
    },
    exercicios_editado: null,
    alertas_json: {},
    status: StatusAnalise.AGUARDANDO_REVISAO,
    aprovado_em: null,
    rejeitado_em: null,
    motivo_rejeicao: null,
    tempo_revisao: null,
    prompt_versoes_json: {},
    custo_total_usd: 0.1,
    tempo_processamento_ms: 60000,
    created_at: new Date(),
    updated_at: new Date(),
    aula: {
      id: 'aula-123',
      escola_id: 'escola-123',
      professor_id: 'user-123',
      turma_id: 'turma-123',
      planejamento_id: null,
      data: new Date(),
      tipo_entrada: 'AUDIO' as const,
      status_processamento: 'ANALISADA' as const,
      arquivo_url: 's3://audio.mp3',
      arquivo_tamanho: 1024,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    },
  };

  const validExerciciosDto = {
    exercicios: {
      questoes: [
        {
          numero: 1,
          enunciado: 'Questão editada pelo professor',
          alternativas: [
            { letra: 'A', texto: 'Alternativa A editada', correta: true },
            { letra: 'B', texto: 'Alternativa B editada', correta: false },
            { letra: 'C', texto: 'Alternativa C editada', correta: false },
            { letra: 'D', texto: 'Alternativa D editada', correta: false },
          ],
          habilidade_bncc: 'EF06MA01',
          nivel_bloom: 'Aplicação',
          explicacao: 'Explicação editada pelo professor',
        },
      ],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnaliseApprovalController],
      providers: [
        {
          provide: AnaliseService,
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
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

    controller = module.get<AnaliseApprovalController>(
      AnaliseApprovalController,
    );
    analiseService = module.get(AnaliseService);
    aulasService = module.get(AulasService);
  });

  describe('editarExercicios', () => {
    it('should save edited exercises successfully', async () => {
      // Arrange
      analiseService.findOne.mockResolvedValue(mockAnalise as any);
      analiseService.update.mockResolvedValue({} as any);

      // Act
      const result = await controller.editarExercicios(
        'analise-123',
        validExerciciosDto,
        mockUser,
      );

      // Assert
      expect(analiseService.findOne).toHaveBeenCalledWith('analise-123');
      expect(analiseService.update).toHaveBeenCalledWith('analise-123', {
        exercicios_editado: validExerciciosDto.exercicios,
      });
      expect(result).toEqual({
        message: 'Exercícios atualizados com sucesso',
        analiseId: 'analise-123',
      });
    });

    it('should throw NotFoundException if analise does not exist', async () => {
      // Arrange
      analiseService.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        controller.editarExercicios(
          'analise-999',
          validExerciciosDto,
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if professor is not the owner', async () => {
      // Arrange
      const otherProfessorAnalise = {
        ...mockAnalise,
        aula: { ...mockAnalise.aula, professor_id: 'other-user-456' },
      };
      analiseService.findOne.mockResolvedValue(otherProfessorAnalise as any);

      // Act & Assert
      await expect(
        controller.editarExercicios(
          'analise-123',
          validExerciciosDto,
          mockUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if status is APROVADO', async () => {
      // Arrange
      const approvedAnalise = {
        ...mockAnalise,
        status: StatusAnalise.APROVADO,
      };
      analiseService.findOne.mockResolvedValue(approvedAnalise as any);

      // Act & Assert
      await expect(
        controller.editarExercicios(
          'analise-123',
          validExerciciosDto,
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if status is REJEITADO', async () => {
      // Arrange
      const rejectedAnalise = {
        ...mockAnalise,
        status: StatusAnalise.REJEITADO,
      };
      analiseService.findOne.mockResolvedValue(rejectedAnalise as any);

      // Act & Assert
      await expect(
        controller.editarExercicios(
          'analise-123',
          validExerciciosDto,
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid structure (no questoes)', async () => {
      // Arrange
      analiseService.findOne.mockResolvedValue(mockAnalise as any);
      const invalidDto = { exercicios: {} };

      // Act & Assert
      await expect(
        controller.editarExercicios('analise-123', invalidDto as any, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for missing required fields', async () => {
      // Arrange
      analiseService.findOne.mockResolvedValue(mockAnalise as any);
      const invalidDto = {
        exercicios: {
          questoes: [
            {
              numero: 1,
              enunciado: '', // Missing enunciado
              alternativas: [],
              habilidade_bncc: '',
              nivel_bloom: '',
              explicacao: '',
            },
          ],
        },
      };

      // Act & Assert
      await expect(
        controller.editarExercicios('analise-123', invalidDto as any, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for not exactly 4 alternatives', async () => {
      // Arrange
      analiseService.findOne.mockResolvedValue(mockAnalise as any);
      const invalidDto = {
        exercicios: {
          questoes: [
            {
              numero: 1,
              enunciado: 'Questão válida',
              alternativas: [
                { letra: 'A', texto: 'Alt A', correta: true },
                { letra: 'B', texto: 'Alt B', correta: false },
              ], // Only 2 alternatives
              habilidade_bncc: 'EF06MA01',
              nivel_bloom: 'Aplicação',
              explicacao: 'Explicação',
            },
          ],
        },
      };

      // Act & Assert
      await expect(
        controller.editarExercicios('analise-123', invalidDto as any, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for not exactly 1 correct alternative', async () => {
      // Arrange
      analiseService.findOne.mockResolvedValue(mockAnalise as any);
      const invalidDto = {
        exercicios: {
          questoes: [
            {
              numero: 1,
              enunciado: 'Questão válida',
              alternativas: [
                { letra: 'A', texto: 'Alt A', correta: true },
                { letra: 'B', texto: 'Alt B', correta: true }, // Two correct
                { letra: 'C', texto: 'Alt C', correta: false },
                { letra: 'D', texto: 'Alt D', correta: false },
              ],
              habilidade_bncc: 'EF06MA01',
              nivel_bloom: 'Aplicação',
              explicacao: 'Explicação',
            },
          ],
        },
      };

      // Act & Assert
      await expect(
        controller.editarExercicios('analise-123', invalidDto as any, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid letters (not A,B,C,D)', async () => {
      // Arrange
      analiseService.findOne.mockResolvedValue(mockAnalise as any);
      const invalidDto = {
        exercicios: {
          questoes: [
            {
              numero: 1,
              enunciado: 'Questão válida',
              alternativas: [
                { letra: 'A', texto: 'Alt A', correta: true },
                { letra: 'B', texto: 'Alt B', correta: false },
                { letra: 'C', texto: 'Alt C', correta: false },
                { letra: 'E', texto: 'Alt E', correta: false }, // Invalid letter
              ],
              habilidade_bncc: 'EF06MA01',
              nivel_bloom: 'Aplicação',
              explicacao: 'Explicação',
            },
          ],
        },
      };

      // Act & Assert
      await expect(
        controller.editarExercicios('analise-123', invalidDto as any, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for duplicate letters', async () => {
      // Arrange
      analiseService.findOne.mockResolvedValue(mockAnalise as any);
      const invalidDto = {
        exercicios: {
          questoes: [
            {
              numero: 1,
              enunciado: 'Questão válida',
              alternativas: [
                { letra: 'A', texto: 'Alt A', correta: true },
                { letra: 'A', texto: 'Alt A duplicada', correta: false }, // Duplicate letter
                { letra: 'B', texto: 'Alt B', correta: false },
                { letra: 'C', texto: 'Alt C', correta: false },
              ],
              habilidade_bncc: 'EF06MA01',
              nivel_bloom: 'Aplicação',
              explicacao: 'Explicação',
            },
          ],
        },
      };

      // Act & Assert
      await expect(
        controller.editarExercicios('analise-123', invalidDto as any, mockUser),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.editarExercicios('analise-123', invalidDto as any, mockUser),
      ).rejects.toThrow(
        'Alternativas devem ter letras A, B, C, D sem duplicatas',
      );
    });

    it('should throw BadRequestException for enunciado exceeding 500 chars', async () => {
      // Arrange
      analiseService.findOne.mockResolvedValue(mockAnalise as any);
      const invalidDto = {
        exercicios: {
          questoes: [
            {
              numero: 1,
              enunciado: 'a'.repeat(501), // 501 characters
              alternativas: [
                { letra: 'A', texto: 'Alt A', correta: true },
                { letra: 'B', texto: 'Alt B', correta: false },
                { letra: 'C', texto: 'Alt C', correta: false },
                { letra: 'D', texto: 'Alt D', correta: false },
              ],
              habilidade_bncc: 'EF06MA01',
              nivel_bloom: 'Aplicação',
              explicacao: 'Explicação válida',
            },
          ],
        },
      };

      // Act & Assert
      await expect(
        controller.editarExercicios('analise-123', invalidDto as any, mockUser),
      ).rejects.toThrow('Enunciado não pode exceder 500 caracteres');
    });

    it('should throw BadRequestException for alternativa text exceeding 200 chars', async () => {
      // Arrange
      analiseService.findOne.mockResolvedValue(mockAnalise as any);
      const invalidDto = {
        exercicios: {
          questoes: [
            {
              numero: 1,
              enunciado: 'Questão válida',
              alternativas: [
                { letra: 'A', texto: 'a'.repeat(201), correta: true }, // 201 characters
                { letra: 'B', texto: 'Alt B', correta: false },
                { letra: 'C', texto: 'Alt C', correta: false },
                { letra: 'D', texto: 'Alt D', correta: false },
              ],
              habilidade_bncc: 'EF06MA01',
              nivel_bloom: 'Aplicação',
              explicacao: 'Explicação válida',
            },
          ],
        },
      };

      // Act & Assert
      await expect(
        controller.editarExercicios('analise-123', invalidDto as any, mockUser),
      ).rejects.toThrow('Texto da alternativa não pode exceder 200 caracteres');
    });

    it('should throw BadRequestException for explicacao exceeding 1000 chars', async () => {
      // Arrange
      analiseService.findOne.mockResolvedValue(mockAnalise as any);
      const invalidDto = {
        exercicios: {
          questoes: [
            {
              numero: 1,
              enunciado: 'Questão válida',
              alternativas: [
                { letra: 'A', texto: 'Alt A', correta: true },
                { letra: 'B', texto: 'Alt B', correta: false },
                { letra: 'C', texto: 'Alt C', correta: false },
                { letra: 'D', texto: 'Alt D', correta: false },
              ],
              habilidade_bncc: 'EF06MA01',
              nivel_bloom: 'Aplicação',
              explicacao: 'a'.repeat(1001), // 1001 characters
            },
          ],
        },
      };

      // Act & Assert
      await expect(
        controller.editarExercicios('analise-123', invalidDto as any, mockUser),
      ).rejects.toThrow('Explicação não pode exceder 1000 caracteres');
    });
  });
});
