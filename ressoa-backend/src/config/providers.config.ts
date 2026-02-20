import { z } from 'zod';
import { readFileSync, existsSync } from 'fs';
import { Logger } from '@nestjs/common';

const logger = new Logger('ProvidersConfig');

// Provider key enums matching Prisma ProviderSTT and ProviderLLM
const ProviderSTTKey = z.enum([
  'WHISPER',
  'GOOGLE',
  'AZURE',
  'MANUAL',
  'GROQ_WHISPER',
]);

const ProviderLLMKey = z.enum([
  'CLAUDE_SONNET',
  'CLAUDE_HAIKU',
  'GPT4_TURBO',
  'GPT4_MINI',
  'GEMINI_PRO',
  'GEMINI_FLASH',
]);

const ProviderPairSchema = z.object({
  primary: ProviderLLMKey,
  fallback: ProviderLLMKey,
});

export const ProvidersConfigSchema = z.object({
  version: z.string(),
  stt: z.object({
    primary: ProviderSTTKey,
    fallback: ProviderSTTKey,
  }),
  llm: z.object({
    analise_cobertura: ProviderPairSchema,
    analise_qualitativa: ProviderPairSchema,
    relatorio: ProviderPairSchema,
    exercicios: ProviderPairSchema,
    alertas: ProviderPairSchema,
    diarizacao: ProviderPairSchema,
  }),
});

export type ProvidersConfig = z.infer<typeof ProvidersConfigSchema>;
export type LLMAnalysisType =
  | 'analise_cobertura'
  | 'analise_qualitativa'
  | 'relatorio'
  | 'exercicios'
  | 'alertas'
  | 'diarizacao';

export const DEFAULT_PROVIDERS_CONFIG: ProvidersConfig = {
  version: '1.0.0',
  stt: { primary: 'WHISPER', fallback: 'GOOGLE' },
  llm: {
    analise_cobertura: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
    analise_qualitativa: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
    relatorio: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
    exercicios: { primary: 'GPT4_MINI', fallback: 'CLAUDE_SONNET' },
    alertas: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
    diarizacao: { primary: 'GEMINI_FLASH', fallback: 'GPT4_MINI' },
  },
};

export function loadProvidersConfig(configPath?: string): ProvidersConfig {
  const path =
    configPath || process.env.PROVIDERS_CONFIG_PATH || 'providers.config.json';

  if (!existsSync(path)) {
    logger.warn(`Config file not found at "${path}", using default config`);
    return { ...DEFAULT_PROVIDERS_CONFIG };
  }

  try {
    const raw = readFileSync(path, 'utf-8');
    const parsed = JSON.parse(raw);
    const validated = ProvidersConfigSchema.parse(parsed);
    logger.log(
      `Providers config loaded from "${path}" (version: ${validated.version})`,
    );
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn(
        `Invalid providers config at "${path}": ${error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}. Using default config`,
      );
    } else {
      logger.warn(
        `Failed to read providers config at "${path}": ${error instanceof Error ? error.message : 'Unknown error'}. Using default config`,
      );
    }
    return { ...DEFAULT_PROVIDERS_CONFIG };
  }
}
