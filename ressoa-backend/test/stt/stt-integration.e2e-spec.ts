import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { STTService } from '../../src/modules/stt/stt.service';
import { WhisperProvider } from '../../src/modules/stt/providers/whisper.provider';
import { GoogleProvider } from '../../src/modules/stt/providers/google.provider';
import { ProviderSTT } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Set minimal required env vars for ConfigModule (CI-safe)
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://localhost:5432/test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-secret-that-is-at-least-32-characters-long';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  'test-refresh-secret-at-least-32-characters-long';

/**
 * STT Integration E2E Tests - Story 4.2
 *
 * **Tests:**
 * - Whisper as primary provider (lowest cost)
 * - Google as fallback (automatic failover)
 * - Provider comparison (quality vs cost)
 *
 * **Requirements:**
 * - OPENAI_API_KEY in environment (for Whisper)
 * - GOOGLE_CLOUD_CREDENTIALS in environment (for Google fallback)
 * - test/fixtures/audio/test-audio-30s.mp3
 */
describe('STT Integration E2E - Multi-Provider', () => {
  let sttService: STTService;
  let whisperProvider: WhisperProvider;
  let googleProvider: GoogleProvider;
  let configService: ConfigService;
  let audioFixture: Buffer;
  let bothProvidersAvailable: boolean;
  let whisperAvailable: boolean;
  let googleAvailable: boolean;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()], // Uses .env file by default
      providers: [
        STTService,
        WhisperProvider,
        GoogleProvider,
        {
          provide: 'WHISPER_PROVIDER',
          useClass: WhisperProvider,
        },
        {
          provide: 'GOOGLE_PROVIDER',
          useClass: GoogleProvider,
        },
      ],
    }).compile();

    sttService = moduleFixture.get<STTService>(STTService);
    whisperProvider = moduleFixture.get<WhisperProvider>(WhisperProvider);
    googleProvider = moduleFixture.get<GoogleProvider>(GoogleProvider);
    configService = moduleFixture.get<ConfigService>(ConfigService);

    // Check provider availability
    const openaiKey = configService.get<string>('OPENAI_API_KEY');
    const googleCreds = configService.get<string>('GOOGLE_CLOUD_CREDENTIALS');

    whisperAvailable = !!openaiKey && openaiKey !== 'sk-proj-...';
    googleAvailable =
      !!googleCreds &&
      googleCreds !== '{"type":"service_account","project_id":"..."}';
    bothProvidersAvailable = whisperAvailable && googleAvailable;

    if (!bothProvidersAvailable) {
      console.warn(
        '⚠️  One or more STT providers not configured - some tests will be skipped',
      );
      console.warn(`   Whisper: ${whisperAvailable ? '✅' : '❌'}`);
      console.warn(`   Google: ${googleAvailable ? '✅' : '❌'}`);
    }

    // Load audio fixture
    const audioPath = path.join(
      __dirname,
      '../fixtures/audio/test-audio-30s.mp3',
    );

    if (!fs.existsSync(audioPath)) {
      console.warn(
        `⚠️  Audio fixture not found: ${audioPath} - integration tests will be skipped`,
      );
      bothProvidersAvailable = false;
      whisperAvailable = false;
      googleAvailable = false;
      return;
    }

    audioFixture = fs.readFileSync(audioPath);
  });

  describe('Primary Provider (Whisper)', () => {
    it('should use Whisper as primary provider by default', async () => {
      if (!whisperAvailable) {
        console.log('⏭️  Skipping test - Whisper not available');
        return;
      }

      const result = await sttService.transcribe(audioFixture, {
        idioma: 'pt-BR',
      });

      // Verify Whisper was used (should be primary)
      expect(result.provider).toBe(ProviderSTT.WHISPER);
      expect(result.texto).toBeDefined();
      expect(result.custo_usd).toBeLessThan(0.01); // Whisper cheaper than Google

      console.log('✅ Primary provider (Whisper) used:', {
        provider: result.provider,
        custo: `$${result.custo_usd.toFixed(4)}`,
      });
    }, 60000);
  });

  describe('Fallback Logic', () => {
    it('should fallback to Google when Whisper fails', async () => {
      if (!bothProvidersAvailable) {
        console.log('⏭️  Skipping test - both providers required');
        return;
      }

      // Mock Whisper failure by passing invalid provider temporarily
      // In real scenario, this would be a Whisper API failure (rate limit, quota)
      jest
        .spyOn(whisperProvider, 'transcribe')
        .mockRejectedValueOnce(new Error('Whisper simulated failure'));

      const result = await sttService.transcribe(audioFixture);

      // Should have fallen back to Google
      expect(result.provider).toBe(ProviderSTT.GOOGLE);
      expect(result.texto).toBeDefined();

      console.log('✅ Fallback to Google succeeded:', {
        provider: result.provider,
        custo: `$${result.custo_usd.toFixed(4)}`,
      });

      // Restore original implementation
      jest.restoreAllMocks();
    }, 60000);
  });

  describe('Provider Comparison', () => {
    it('should compare Whisper vs Google quality and cost', async () => {
      if (!bothProvidersAvailable) {
        console.log('⏭️  Skipping test - both providers required');
        return;
      }

      // Test both providers with same audio
      const whisperResult = await whisperProvider.transcribe(audioFixture, {
        idioma: 'pt',
      });
      const googleResult = await googleProvider.transcribe(audioFixture, {
        idioma: 'pt-BR',
      });

      console.log('📊 Provider Comparison:');
      console.log('Whisper:', {
        texto_length: whisperResult.texto.length,
        confianca: `${(whisperResult.confianca! * 100).toFixed(1)}%`,
        custo: `$${whisperResult.custo_usd.toFixed(4)}`,
        tempo: `${whisperResult.tempo_processamento_ms}ms`,
      });
      console.log('Google:', {
        texto_length: googleResult.texto.length,
        confianca: `${(googleResult.confianca! * 100).toFixed(1)}%`,
        custo: `$${googleResult.custo_usd.toFixed(4)}`,
        tempo: `${googleResult.tempo_processamento_ms}ms`,
      });

      // Both should have similar-length transcriptions (within 30% variance)
      const lengthRatio =
        whisperResult.texto.length / googleResult.texto.length;
      expect(lengthRatio).toBeGreaterThan(0.7);
      expect(lengthRatio).toBeLessThan(1.3);

      // Both should have good confidence
      expect(whisperResult.confianca).toBeGreaterThan(0.7);
      expect(googleResult.confianca).toBeGreaterThan(0.7);

      // Whisper should be cheaper (typically ~75% cheaper)
      expect(whisperResult.custo_usd).toBeLessThan(googleResult.custo_usd);

      console.log(
        `💰 Cost savings using Whisper: ${(((googleResult.custo_usd - whisperResult.custo_usd) / googleResult.custo_usd) * 100).toFixed(1)}%`,
      );
    }, 120000); // 2min timeout for both providers
  });

  describe('Error Handling', () => {
    it('should throw error when both providers fail', async () => {
      if (!bothProvidersAvailable) {
        console.log('⏭️  Skipping test');
        return;
      }

      // Mock both providers to fail
      jest
        .spyOn(whisperProvider, 'transcribe')
        .mockRejectedValueOnce(new Error('Whisper down'));
      jest
        .spyOn(googleProvider, 'transcribe')
        .mockRejectedValueOnce(new Error('Google down'));

      await expect(sttService.transcribe(audioFixture)).rejects.toThrow(
        /Transcrição falhou em ambos providers/,
      );

      jest.restoreAllMocks();
    }, 30000);
  });
});
