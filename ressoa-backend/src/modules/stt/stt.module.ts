import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { STTService } from './stt.service';
import { TranscricaoService } from './transcricao.service';
import { WhisperProvider } from './providers/whisper.provider';
import { GoogleProvider } from './providers/google.provider';

/**
 * STT (Speech-to-Text) Module
 *
 * Provides:
 * - Multi-provider STT abstraction layer (Whisper, Google, Azure)
 * - Automatic failover: primary → fallback
 * - Transcription persistence and Aula status management
 *
 * Architecture:
 * ```
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
 */
@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    STTService,
    TranscricaoService,
    {
      provide: 'WHISPER_PROVIDER',
      useClass: WhisperProvider, // Stub in Story 4.1, real impl in Story 4.2
    },
    {
      provide: 'GOOGLE_PROVIDER',
      useClass: GoogleProvider, // Stub in Story 4.1, real impl in Story 4.2
    },
  ],
  exports: [STTService, TranscricaoService],
})
export class SttModule {}
