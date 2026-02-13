import { z } from 'zod';
import { TipoEnsino, Serie, Turno, CurriculoTipo, ContextoPedagogicoDto } from '@/types/turma';

/**
 * Zod validation schema for Turma form
 * Story 10.4 - Frontend Gestão de Turmas
 * Story 11.5 - Contexto Pedagógico para Cursos Customizados
 *
 * Validations:
 * - nome: required, min 3, max 100 chars
 * - tipo_ensino: required, enum FUNDAMENTAL | MEDIO
 * - serie: required, must be compatible with tipo_ensino
 * - disciplina: required
 * - ano_letivo: required, number between 2020-2030
 * - turno: required, enum MATUTINO | VESPERTINO | INTEGRAL
 * - professor_id: required, uuid
 * - curriculo_tipo: optional, default 'BNCC'
 * - contexto_pedagogico: optional, required if curriculo_tipo = CUSTOM
 *
 * Custom validations:
 * 1. serie must be compatible with tipo_ensino
 * 2. contexto_pedagogico required if curriculo_tipo = CUSTOM
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

    professor_id: z.string({ message: 'Professor é obrigatório' }).uuid('Professor inválido'),

    curriculo_tipo: z.enum(['BNCC', 'CUSTOM'] as const).optional().default('BNCC'),

    contexto_pedagogico: z
      .object({
        objetivo_geral: z
          .string()
          .min(100, 'Descreva o objetivo com no mínimo 100 caracteres')
          .max(500, 'Máximo 500 caracteres permitidos'),
        publico_alvo: z
          .string()
          .min(20, 'Descreva o público com no mínimo 20 caracteres')
          .max(200, 'Máximo 200 caracteres'),
        metodologia: z
          .string()
          .min(20, 'Descreva a metodologia com no mínimo 20 caracteres')
          .max(300, 'Máximo 300 caracteres'),
        carga_horaria_total: z
          .number({ message: 'Carga horária total é obrigatória' })
          .int('Informe um número válido')
          .min(8, 'Carga horária mínima: 8 horas')
          .max(1000, 'Carga horária máxima: 1000 horas'),
      })
      .optional(),
  })
  .refine(
    (data) => {
      // Validação custom 1: série compatível com tipo_ensino
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
  )
  .refine(
    (data) => {
      // Validação custom 2: contexto pedagógico obrigatório se curriculo_tipo = CUSTOM
      if (data.curriculo_tipo === 'CUSTOM') {
        return (
          !!data.contexto_pedagogico &&
          !!data.contexto_pedagogico.objetivo_geral &&
          !!data.contexto_pedagogico.publico_alvo &&
          !!data.contexto_pedagogico.metodologia &&
          data.contexto_pedagogico.carga_horaria_total !== undefined &&
          data.contexto_pedagogico.carga_horaria_total !== null
        );
      }
      return true; // BNCC não requer contexto
    },
    {
      message: 'Contexto pedagógico é obrigatório para cursos customizados',
      path: ['contexto_pedagogico'],
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
  professor_id?: string | null;
  professor?: { id: string; nome: string; email: string } | null;
  curriculo_tipo?: CurriculoTipo;
  contexto_pedagogico?: ContextoPedagogicoDto;
}): TurmaFormData => {
  if (turma) {
    return {
      nome: turma.nome,
      tipo_ensino: turma.tipo_ensino,
      serie: turma.serie,
      disciplina: turma.disciplina,
      ano_letivo: turma.ano_letivo,
      turno: turma.turno,
      professor_id: turma.professor?.id ?? turma.professor_id ?? '',
      curriculo_tipo: turma.curriculo_tipo ?? 'BNCC',
      contexto_pedagogico: turma.contexto_pedagogico,
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
    professor_id: '',
    curriculo_tipo: 'BNCC',
  };
};
