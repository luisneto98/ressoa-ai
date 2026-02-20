import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { ClaudeProvider } from './providers/claude.provider';
import { GPTProvider } from './providers/gpt.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { PromptService } from './services/prompt.service';
import { LLMRouterService } from './services/llm-router.service';

/**
 * Módulo LLM - Abstração multi-provider com versionamento de prompts
 *
 * **Providers:**
 * - ClaudeProvider (Claude 4.6 Sonnet) - Análise pedagógica
 * - GPTProvider (GPT-4.6 mini) - Exercícios contextuais
 * - GeminiProvider (Gemini 2.0 Flash) - Análise pedagógica low-cost
 *
 * **Services:**
 * - PromptService - Versionamento e A/B testing de prompts
 *
 * **Dependency Injection:**
 * - Use @Inject('CLAUDE_PROVIDER') para ClaudeProvider
 * - Use @Inject('GPT_PROVIDER') para GPTProvider
 * - Use @Inject('GEMINI_PROVIDER') para GeminiProvider
 * - Inject PromptService diretamente
 */
@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    {
      provide: 'CLAUDE_PROVIDER',
      useClass: ClaudeProvider,
    },
    {
      provide: 'GPT_PROVIDER',
      useClass: GPTProvider,
    },
    {
      provide: 'GEMINI_PROVIDER',
      useClass: GeminiProvider,
    },
    PromptService,
    LLMRouterService, // Config-driven LLM provider routing (Story 14.1)
  ],
  exports: [
    'CLAUDE_PROVIDER',
    'GPT_PROVIDER',
    'GEMINI_PROVIDER',
    PromptService,
    LLMRouterService,
  ],
})
export class LLMModule {}
