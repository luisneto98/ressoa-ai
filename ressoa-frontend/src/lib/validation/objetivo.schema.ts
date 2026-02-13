import { z } from 'zod';
import { NivelBloom } from '@/types/objetivo';

/**
 * Schema de validação Zod para Objetivo de Aprendizagem Customizado
 *
 * Validações pedagógicas:
 * - Código: 3-20 chars, A-Z 0-9 - _ (pattern permite busca/filtragem eficiente)
 * - Descrição: Min 20 chars (força especificidade), max 500
 * - Critérios: 1-5 itens (cada 10-200 chars) - evidências observáveis
 */
export const objetivoSchema = z.object({
  codigo: z
    .string()
    .min(3, 'Código deve ter no mínimo 3 caracteres')
    .max(20, 'Código deve ter no máximo 20 caracteres')
    .regex(/^[A-Z0-9\-_]+$/, 'Código deve conter apenas A-Z, 0-9, hífen e underscore')
    .transform((val) => val.toUpperCase()), // Garante uppercase

  descricao: z
    .string()
    .min(20, 'Descrição deve ter no mínimo 20 caracteres (seja específico!)')
    .max(500, 'Máximo 500 caracteres permitidos'),

  area_conhecimento: z
    .string()
    .max(100, 'Máximo 100 caracteres')
    .optional()
    .or(z.literal('')), // Permite string vazia

  nivel_cognitivo: z.nativeEnum(NivelBloom, {
    errorMap: () => ({ message: 'Selecione um nível cognitivo (Taxonomia de Bloom)' }),
  }),

  criterios_evidencia: z
    .array(
      z
        .string()
        .min(10, 'Critério muito curto, mínimo 10 caracteres')
        .max(200, 'Critério muito longo, máximo 200 caracteres')
    )
    .min(1, 'Adicione pelo menos 1 critério de evidência')
    .max(5, 'Máximo 5 critérios permitidos'),

  ordem: z.number().int().positive(),
});

/**
 * Type inference do schema Zod (usado em React Hook Form)
 */
export type ObjetivoFormData = z.infer<typeof objetivoSchema>;
