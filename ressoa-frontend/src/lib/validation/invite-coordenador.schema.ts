import { z } from 'zod';

export const inviteCoordenadorSchema = z.object({
  email: z
    .string({ required_error: 'Email é obrigatório' })
    .email('Email inválido')
    .trim()
    .toLowerCase(),
  nome: z
    .string({ required_error: 'Nome é obrigatório' })
    .trim()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
});

export type InviteCoordenadorFormData = z.infer<
  typeof inviteCoordenadorSchema
>;
