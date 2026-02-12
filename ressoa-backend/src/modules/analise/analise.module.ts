import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { LlmModule } from '../llm/llm.module';
import { AnaliseService } from './services/analise.service';

/**
 * Módulo responsável pela análise pedagógica de aulas usando pipeline de 5 prompts LLM.
 *
 * Este módulo implementa o MOAT técnico do sistema: o pipeline serial de 5 prompts
 * especializados que gera análise pedagógica profunda, impossível de replicar com
 * ferramentas genéricas de IA.
 *
 * Pipeline:
 * 1. Cobertura BNCC (Claude)
 * 2. Análise Qualitativa (Claude)
 * 3. Geração de Relatório (Claude)
 * 4. Geração de Exercícios (GPT-4 mini - cost optimization)
 * 5. Detecção de Alertas (Claude)
 *
 * Cada prompt vê outputs dos prompts anteriores (contexto acumulativo).
 */
@Module({
  imports: [
    PrismaModule,
    LlmModule, // Provides PromptService, ClaudeProvider, GPTProvider
  ],
  providers: [AnaliseService],
  exports: [AnaliseService],
})
export class AnaliseModule {}
