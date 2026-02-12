import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../../prisma/prisma.module';
import { LLMModule } from '../llm/llm.module';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';
import { AulasModule } from '../aulas/aulas.module';
import { AnaliseService } from './services/analise.service';
import { AnaliseController } from './analise.controller';
import { AnalysisProcessorWorker } from '../../workers/analysis-processor.worker';

/**
 * Módulo responsável pela análise pedagógica de aulas usando pipeline de 5 prompts LLM.
 *
 * Este módulo implementa o MOAT técnico do sistema: o pipeline serial de 5 prompts
 * especializados que gera análise pedagógica profunda, impossível de replicar com
 * ferramentas genéricas de IA.
 *
 * Pipeline:
 * 1. Cobertura BNCC (Claude Sonnet)
 * 2. Análise Qualitativa (Claude Sonnet)
 * 3. Geração de Relatório (Claude Sonnet)
 * 4. Geração de Exercícios (GPT-4 mini - cost optimization)
 * 5. Detecção de Alertas (Claude Haiku - cost optimization)
 *
 * Cada prompt vê outputs dos prompts anteriores (contexto acumulativo).
 *
 * **Story 5.5 Additions:**
 * - AnalysisProcessorWorker: Bull queue worker que orquestra pipeline assíncrono
 * - Queue 'analysis-pipeline': Processa análises de aulas com retry exponencial
 *
 * **Story 6.1 Additions:**
 * - AnaliseController: GET /api/v1/aulas/:id/analise endpoint
 * - AulasModule import: Para validar permissões de acesso (professor ownership)
 */
@Module({
  imports: [
    PrismaModule,
    LLMModule, // Provides PromptService, ClaudeProvider, GPTProvider
    NotificacoesModule, // Provides NotificacaoService for completion notifications
    AulasModule, // Provides AulasService for permission validation (Story 6.1)
    BullModule.registerQueue({
      name: 'analysis-pipeline',
      defaultJobOptions: {
        attempts: 3, // Retry 3x on failure
        backoff: {
          type: 'exponential',
          delay: 5000, // 5s, 25s, 125s
        },
        timeout: 120000, // 2 minutes max (5 prompts serial)
        removeOnComplete: 100, // Keep last 100 for debugging
        removeOnFail: 1000, // Keep failed jobs for DLQ inspection
      },
    }),
  ],
  controllers: [AnaliseController],
  providers: [AnaliseService, AnalysisProcessorWorker],
  exports: [AnaliseService, BullModule],
})
export class AnaliseModule {}
