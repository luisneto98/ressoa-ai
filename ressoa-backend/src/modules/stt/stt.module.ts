import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';
import { STTService } from './stt.service';
import { TranscricaoService } from './transcricao.service';
import { WhisperProvider } from './providers/whisper.provider';
import { GoogleProvider } from './providers/google.provider';
import { TranscriptionProcessor } from './workers/transcription.processor';

/**
 * STT (Speech-to-Text) Module
 *
 * Provides:
 * - Multi-provider STT abstraction layer (Whisper, Google, Azure)
 * - Automatic failover: primary → fallback
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
 * Providers (WHISPER_PROVIDER, GOOGLE_PROVIDER)
 *         ↓
 * External APIs (OpenAI, Google Cloud)
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
    TranscriptionProcessor, // Worker for async transcription (Story 4.3)
    {
      provide: 'WHISPER_PROVIDER',
      useClass: WhisperProvider, // Real implementation (Story 4.2) - OpenAI Whisper API
    },
    {
      provide: 'GOOGLE_PROVIDER',
      useClass: GoogleProvider, // Real implementation (Story 4.2) - Google Cloud Speech API
    },
  ],
  exports: [STTService, TranscricaoService],
})
export class SttModule {}
