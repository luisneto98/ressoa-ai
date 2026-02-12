import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { ClaudeProvider } from './providers/claude.provider';
import { GPTProvider } from './providers/gpt.provider';
import { PromptService } from './services/prompt.service';

/**
 * Módulo LLM - Abstração multi-provider com versionamento de prompts
 *
 * **Providers:**
 * - ClaudeProvider (Claude 4.6 Sonnet) - Análise pedagógica
 * - GPTProvider (GPT-4.6 mini) - Exercícios contextuais
 *
 * **Services:**
 * - PromptService - Versionamento e A/B testing de prompts
 *
 * **Dependency Injection:**
 * - Use @Inject('CLAUDE_PROVIDER') para ClaudeProvider
 * - Use @Inject('GPT_PROVIDER') para GPTProvider
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
    PromptService,
  ],
  exports: ['CLAUDE_PROVIDER', 'GPT_PROVIDER', PromptService],
})
export class LLMModule {}
