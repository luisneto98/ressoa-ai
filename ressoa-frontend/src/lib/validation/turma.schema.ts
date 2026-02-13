import { z } from 'zod';
import { TipoEnsino, Serie, Turno } from '@/types/turma';

/**
 * Zod validation schema for Turma form
 * Story 10.4 - Frontend Gestão de Turmas
 *
 * Validations:
 * - nome: required, min 3, max 100 chars
 * - tipo_ensino: required, enum FUNDAMENTAL | MEDIO
 * - serie: required, must be compatible with tipo_ensino
 * - disciplina: required
 * - ano_letivo: required, number between 2020-2030
 * - turno: required, enum MATUTINO | VESPERTINO | INTEGRAL
 * - quantidade_alunos: optional, number between 1-50
 *
 * Custom validation: serie must be compatible with tipo_ensino
 */

export const turmaFormSchema = z
  .object({
    nome: z
      .string({ message: 'Nome é obrigatório' })
      .min(1, 'Nome é obrigatório')
      .min(3, 'Nome deve ter ao menos 3 caracteres')
      .max(100, 'Nome não pode exceder 100 caracteres')
      .trim(),

    tipo_ensino: z.enum(['FUNDAMENTAL', 'MEDIO'] as const, {
      message: 'Tipo de ensino é obrigatório',
    }),

    serie: z.enum(
      [
        'SEXTO_ANO',
        'SETIMO_ANO',
        'OITAVO_ANO',
        'NONO_ANO',
        'PRIMEIRO_ANO_EM',
        'SEGUNDO_ANO_EM',
        'TERCEIRO_ANO_EM',
      ] as const,
      { message: 'Série é obrigatória' }
    ),

    disciplina: z
      .string({ message: 'Disciplina é obrigatória' })
      .min(1, 'Disciplina é obrigatória')
      .trim(),

    ano_letivo: z
      .number({
        message: 'Ano letivo é obrigatório',
      })
      .int('Ano letivo deve ser um número inteiro')
      .min(2020, 'Ano letivo deve ser entre 2020 e 2030')
      .max(2030, 'Ano letivo deve ser entre 2020 e 2030'),

    turno: z.enum(['MATUTINO', 'VESPERTINO', 'INTEGRAL'] as const, {
      message: 'Turno é obrigatório',
    }),

    quantidade_alunos: z
      .number({
        message: 'Quantidade de alunos deve ser um número',
      })
      .int('Quantidade de alunos deve ser um número inteiro')
      .min(1, 'Mínimo de 1 aluno')
      .max(50, 'Máximo de 50 alunos')
      .nullable()
      .optional(),
  })
  .refine(
    (data) => {
      // Validação custom: série compatível com tipo_ensino
      const fundamentalSeries: string[] = [
        Serie.SEXTO_ANO,
        Serie.SETIMO_ANO,
        Serie.OITAVO_ANO,
        Serie.NONO_ANO,
      ];
      const medioSeries: string[] = [Serie.PRIMEIRO_ANO_EM, Serie.SEGUNDO_ANO_EM, Serie.TERCEIRO_ANO_EM];

      if (data.tipo_ensino === TipoEnsino.FUNDAMENTAL) {
        return fundamentalSeries.includes(data.serie);
      }
      if (data.tipo_ensino === TipoEnsino.MEDIO) {
        return medioSeries.includes(data.serie);
      }
      return true;
    },
    {
      message: 'Série incompatível com o tipo de ensino selecionado',
      path: ['serie'],
    }
  );

export type TurmaFormData = z.infer<typeof turmaFormSchema>;

/**
 * Helper to get default values for form
 * @param turma Optional turma data for edit mode
 * @returns Default values object
 */
export const getTurmaFormDefaults = (turma?: {
  nome: string;
  tipo_ensino: TipoEnsino;
  serie: Serie;
  disciplina: string;
  ano_letivo: number;
  turno: Turno;
  quantidade_alunos: number | null;
}): TurmaFormData => {
  if (turma) {
    return {
      nome: turma.nome,
      tipo_ensino: turma.tipo_ensino,
      serie: turma.serie,
      disciplina: turma.disciplina,
      ano_letivo: turma.ano_letivo,
      turno: turma.turno,
      quantidade_alunos: turma.quantidade_alunos,
    };
  }

  // Default values for create mode
  return {
    nome: '',
    tipo_ensino: TipoEnsino.FUNDAMENTAL,
    serie: Serie.SEXTO_ANO,
    disciplina: '',
    ano_letivo: new Date().getFullYear(),
    turno: Turno.MATUTINO,
    quantidade_alunos: null,
  };
};
