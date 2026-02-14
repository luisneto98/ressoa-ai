import { z } from 'zod';

/**
 * Schema de validação para convite de Diretor
 * Story 13.2 - Task 6: Zod Schema Frontend
 *
 * Valida:
 * - Email: formato válido, normalizado (lowercase + trim)
 * - Nome: 3-100 caracteres, trimmed
 */
export const inviteDirectorSchema = z.object({
  email: z
    .string({ required_error: 'Email é obrigatório' })
    .email('Email inválido')
    .trim()
    .toLowerCase()
    .min(1, 'Email não pode ser vazio'),

  nome: z
    .string({ required_error: 'Nome é obrigatório' })
    .trim()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
});

/**
 * Tipo TypeScript inferido do schema
 * Usado no React Hook Form
 */
export type InviteDirectorFormData = z.infer<typeof inviteDirectorSchema>;
