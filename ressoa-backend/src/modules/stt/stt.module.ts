import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';
import { STTService } from './stt.service';
import { TranscricaoService } from './transcricao.service';
import { WhisperProvider } from './providers/whisper.provider';
import { GoogleProvider } from './providers/google.provider';
import { GroqWhisperProvider } from './providers/groq-whisper.provider';
import { TranscriptionProcessor } from './workers/transcription.processor';
import { STTRouterService } from './services/stt-router.service';
import { DiarizationService } from './services/diarization.service';
import { LLMModule } from '../llm/llm.module';

/**
 * STT (Speech-to-Text) Module
 *
 * Provides:
 * - Multi-provider STT abstraction layer (Whisper, Google, Groq Whisper)
 * - Config-driven routing with automatic failover: primary → fallback (Story 14.1)
 * - Transcription persistence and Aula status management
 * - Async transcription processing via Bull queue workers (Story 4.3)
 *
 * Architecture:
 * ```
 * TranscriptionProcessor (Worker - Story 4.3)
 *         ↓
 * TranscricaoService (Application Layer)
 *         ↓
 * STTService (Orchestration Layer with Failover)
 *         ↓
 * STTRouterService (Config-driven routing - Story 14.1)
 *         ↓
 * Providers (WHISPER_PROVIDER, GOOGLE_PROVIDER, GROQ_WHISPER_PROVIDER)
 *         ↓
 * External APIs (OpenAI, Google Cloud, Groq)
 * ```
 *
 * @see architecture.md lines 427-450 (Service Abstraction Layer Pattern)
 * @see architecture.md lines 500-550 (Async Processing with Bull)
 */
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    NotificacoesModule, // Story 4.4: Import to access NotificacoesService
    LLMModule, // Story 15.3: Import to access LLMRouterService for diarization
    // Bull Queue for Transcription Worker (Story 4.3)
    BullModule.registerQueue({
      name: 'transcription',
      // Note: Concurrency is configured via @Process decorator in TranscriptionProcessor
      // Default concurrency: 3 (prevents Whisper rate limiting - 50 RPM)
    }),
    // CRITICAL FIX (Code Review Issue #4): Import analysis-pipeline queue
    // Needed by TranscriptionProcessor to enqueue analysis jobs after transcription
    BullModule.registerQueue({
      name: 'analysis-pipeline',
      // Note: This queue is OWNED by AnaliseModule, we just register here for injection
    }),
  ],
  providers: [
    STTService,
    TranscricaoService,
    STTRouterService, // Config-driven STT provider routing (Story 14.1)
    DiarizationService, // Story 15.3: LLM-based speaker diarization
    TranscriptionProcessor, // Worker for async transcription (Story 4.3)
    {
      provide: 'WHISPER_PROVIDER',
      useClass: WhisperProvider, // Real implementation (Story 4.2) - OpenAI Whisper API
    },
    {
      provide: 'GOOGLE_PROVIDER',
      useClass: GoogleProvider, // Real implementation (Story 4.2) - Google Cloud Speech API
    },
    {
      provide: 'GROQ_WHISPER_PROVIDER',
      useClass: GroqWhisperProvider, // Story 14.2 - Groq Whisper Large v3 Turbo (89% cost reduction)
    },
  ],
  exports: [
    STTService,
    TranscricaoService,
    STTRouterService,
    DiarizationService,
  ],
})
export class SttModule {}
