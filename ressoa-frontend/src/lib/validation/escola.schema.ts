import { z } from 'zod';

/**
 * Schema de validação para cadastro de escola (Epic 13 Story 13.1)
 * Valida campos obrigatórios e formatos (CNPJ, telefone, email, CEP)
 */
export const escolaFormSchema = z.object({
  nome: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(200, 'Nome deve ter no máximo 200 caracteres')
    .trim(),

  cnpj: z
    .string()
    .regex(
      /^(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|\d{14})$/,
      'CNPJ inválido (formato: XX.XXX.XXX/XXXX-XX)',
    ),

  tipo: z.enum(['particular', 'publica_municipal', 'publica_estadual'], {
    errorMap: () => ({ message: 'Selecione um tipo de escola' }),
  }),

  contato_principal: z
    .string()
    .min(3, 'Nome do responsável deve ter no mínimo 3 caracteres')
    .max(100, 'Nome do responsável deve ter no máximo 100 caracteres')
    .trim(),

  email_contato: z.string().email('Email inválido'),

  telefone: z
    .string()
    .regex(
      /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/,
      'Telefone inválido (formato: (XX) XXXXX-XXXX)',
    ),

  plano: z.enum(['trial', 'basico', 'completo', 'enterprise'], {
    errorMap: () => ({ message: 'Selecione um plano' }),
  }),

  limite_horas_mes: z
    .number()
    .int()
    .min(1, 'Limite deve ser no mínimo 1 hora/mês'),

  endereco: z
    .object({
      rua: z.string().optional(),
      numero: z.string().optional(),
      bairro: z.string().optional(),
      cidade: z.string().optional(),
      uf: z
        .string()
        .length(2, 'UF deve ter 2 caracteres')
        .optional()
        .or(z.literal('')),
      cep: z
        .string()
        .regex(/^\d{5}-?\d{3}$/, 'CEP inválido')
        .optional()
        .or(z.literal('')),
    })
    .optional(),
});

export type EscolaFormData = z.infer<typeof escolaFormSchema>;

/**
 * Formata CNPJ para padrão brasileiro: XX.XXX.XXX/XXXX-XX
 * Input aceita formatado ou não formatado (14 dígitos)
 */
export function formatCNPJ(value: string): string {
  const cnpj = value.replace(/\D/g, ''); // Remove não-dígitos
  if (cnpj.length === 14) {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return value; // Retorna original se não tiver 14 dígitos
}

/**
 * Formata telefone para padrão brasileiro: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 * Suporta 10 dígitos (fixo) ou 11 dígitos (celular)
 */
export function formatTelefone(value: string): string {
  const telefone = value.replace(/\D/g, '');
  if (telefone.length === 10) {
    // Fixo: (11) 1234-5678
    return telefone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (telefone.length === 11) {
    // Celular: (11) 98765-4321
    return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return value; // Retorna original se tamanho inválido
}

/**
 * Retorna o limite de horas default baseado no plano contratado
 * Valores conforme AC9: Trial=100, Básico=400, Completo=1000, Enterprise=5000
 */
export function getLimiteHorasPorPlano(
  plano: string,
): number {
  const defaults: Record<string, number> = {
    trial: 100,
    basico: 400,
    completo: 1000,
    enterprise: 5000,
  };
  return defaults[plano] || 100; // Default para trial se plano inválido
}
