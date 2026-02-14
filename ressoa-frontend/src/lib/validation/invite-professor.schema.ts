import { z } from 'zod';

// Disciplina enum matching backend
export enum Disciplina {
  MATEMATICA = 'MATEMATICA',
  LINGUA_PORTUGUESA = 'LINGUA_PORTUGUESA',
  CIENCIAS = 'CIENCIAS',
}

// Phone regex matching backend pattern: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
const phoneRegex = /^\(\d{2}\)\s?\d{4,5}-\d{4}$/;

export const inviteProfessorSchema = z.object({
  email: z
    .string({ required_error: 'Email é obrigatório' })
    .email('Email inválido')
    .trim()
    .toLowerCase(),
  nome: z
    .string({ required_error: 'Nome é obrigatório' })
    .trim()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(200, 'Nome deve ter no máximo 200 caracteres'),
  disciplina: z.nativeEnum(Disciplina, {
    errorMap: () => ({ message: 'Disciplina inválida' }),
  }),
  formacao: z
    .string()
    .max(200, 'Formação deve ter no máximo 200 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),
  registro: z
    .string()
    .max(50, 'Registro deve ter no máximo 50 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),
  telefone: z
    .string()
    .regex(phoneRegex, 'Telefone deve estar no formato (XX) XXXXX-XXXX')
    .trim()
    .optional()
    .or(z.literal('')),
});

export type InviteProfessorFormData = z.infer<typeof inviteProfessorSchema>;
