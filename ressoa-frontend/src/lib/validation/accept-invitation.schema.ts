import { z } from 'zod';

export const acceptInvitationSchema = z
  .object({
    token: z.string().length(64, 'Token inválido'),

    senha: z
      .string()
      .min(8, 'Senha deve ter no mínimo 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número',
      ),

    senhaConfirmacao: z.string(),
  })
  .refine((data) => data.senha === data.senhaConfirmacao, {
    message: 'As senhas não coincidem',
    path: ['senhaConfirmacao'],
  });

export type AcceptInvitationFormData = z.infer<typeof acceptInvitationSchema>;
