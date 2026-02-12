import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GoogleProvider } from '../../src/modules/stt/providers/google.provider';
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
 * GoogleProvider E2E Tests - Story 4.2
 *
 * **IMPORTANT:** These tests require GOOGLE_CLOUD_CREDENTIALS in environment to run against real API.
 * If credentials are not present, tests will be skipped gracefully.
 *
 * Cost per test run: ~$0.012 (estimated for 30s audio)
 */
describe('GoogleProvider E2E - Real API Integration', () => {
  let provider: GoogleProvider;
  let configService: ConfigService;
  let audioFixture: Buffer;
  let credentialsAvailable: boolean;

  beforeAll(async () => {
    // Load configuration from .env file
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()], // Uses .env file by default
      providers: [GoogleProvider],
    }).compile();

    configService = moduleFixture.get<ConfigService>(ConfigService);
    provider = moduleFixture.get<GoogleProvider>(GoogleProvider);

    // Check if Google credentials are available
    const credentials = configService.get<string>('GOOGLE_CLOUD_CREDENTIALS');
    credentialsAvailable =
      !!credentials &&
      credentials !== '{"type":"service_account","project_id":"..."}';

    if (!credentialsAvailable) {
      console.warn(
        '⚠️  GOOGLE_CLOUD_CREDENTIALS not configured - skipping Google Speech E2E tests',
      );
      return;
    }

    // Load audio fixture
    const audioPath = path.join(
      __dirname,
      '../fixtures/audio/test-audio-30s.mp3',
    );

    if (!fs.existsSync(audioPath)) {
      console.warn(
        `⚠️  Audio fixture not found: ${audioPath} - skipping tests`,
      );
      credentialsAvailable = false;
      return;
    }

    audioFixture = fs.readFileSync(audioPath);
  });

  describe('Transcription - Real API Call', () => {
    it('should transcribe audio successfully', async () => {
      if (!credentialsAvailable) {
        console.log('⏭️  Skipping test - no credentials or audio fixture');
        return;
      }

      const result = await provider.transcribe(audioFixture, {
        idioma: 'pt-BR',
      });

      // Validate result structure
      expect(result.texto).toBeDefined();
      expect(result.texto.length).toBeGreaterThan(50); // Non-empty transcription
      expect(result.idioma).toBe('pt-BR');
      expect(result.duracao_segundos).toBeGreaterThan(5); // At least 5s (estimated)
      expect(result.confianca).toBeGreaterThan(0.7); // Quality threshold
      expect(result.confianca).toBeLessThanOrEqual(1.0);
      expect(result.custo_usd).toBeGreaterThan(0.001); // Some cost
      expect(result.tempo_processamento_ms).toBeLessThan(30000); // <30s processing
      expect(result.metadata?.model).toBe('default');
      expect(result.metadata?.results_count).toBeGreaterThan(0);
      expect(result.metadata?.estimated_duration).toBe(true);

      console.log('✅ Google Speech transcription result:', {
        texto_length: result.texto.length,
        duracao: `~${result.duracao_segundos}s (estimado)`,
        confianca: `${(result.confianca! * 100).toFixed(1)}%`,
        custo: `$${result.custo_usd.toFixed(4)}`,
        tempo: `${result.tempo_processamento_ms}ms`,
      });
    }, 60000); // 60s timeout

    it('should handle error for invalid credentials', async () => {
      if (!credentialsAvailable) {
        console.log('⏭️  Skipping test - no audio fixture');
        return;
      }

      // Create provider with invalid credentials
      const invalidConfig = {
        get: jest.fn((key: string) => {
          if (key === 'GOOGLE_CLOUD_CREDENTIALS')
            return '{"type":"service_account"}';
          return configService.get(key);
        }),
      } as any;

      const invalidProvider = new GoogleProvider(invalidConfig);

      await expect(
        invalidProvider.transcribe(audioFixture),
      ).rejects.toThrowError(/Google Speech error/);
    }, 30000);

    it('should handle empty audio error', async () => {
      if (!credentialsAvailable) {
        console.log('⏭️  Skipping test');
        return;
      }

      const emptyBuffer = Buffer.from('');

      await expect(provider.transcribe(emptyBuffer)).rejects.toThrowError(
        /Google Speech/,
      );
    }, 30000);
  });

  describe('Health Check', () => {
    it('should report isAvailable as true with valid credentials', async () => {
      if (!credentialsAvailable) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      const available = await provider.isAvailable();
      // Google health check is expected to fail gracefully with empty audio
      // but returns true if API is reachable (non-auth error)
      expect(available).toBe(true);
    }, 10000);

    it('should report isAvailable as false with invalid credentials', async () => {
      if (!credentialsAvailable) {
        console.log('⏭️  Skipping test');
        return;
      }

      const invalidConfig = {
        get: jest.fn((key: string) => {
          if (key === 'GOOGLE_CLOUD_CREDENTIALS')
            return '{"type":"service_account"}';
          return configService.get(key);
        }),
      } as any;

      const invalidProvider = new GoogleProvider(invalidConfig);
      const available = await invalidProvider.isAvailable();
      expect(available).toBe(false);
    }, 10000);
  });

  describe('Provider Identity', () => {
    it('should return GOOGLE as provider name', () => {
      expect(provider.getName()).toBe('GOOGLE');
    });
  });
});
