import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WhisperProvider } from '../../src/modules/stt/providers/whisper.provider';
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
 * WhisperProvider E2E Tests - Story 4.2
 *
 * **IMPORTANT:** These tests require OPENAI_API_KEY in environment to run against real API.
 * If API key is not present, tests will be skipped gracefully.
 *
 * Cost per test run: ~$0.003 (30s audio = 0.5min * $0.006/min)
 */
describe('WhisperProvider E2E - Real API Integration', () => {
  let provider: WhisperProvider;
  let configService: ConfigService;
  let audioFixture: Buffer;
  let expectedTranscription: string;
  let apiKeyAvailable: boolean;

  beforeAll(async () => {
    // Load configuration from .env file
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()], // Uses .env file by default
      providers: [WhisperProvider],
    }).compile();

    configService = moduleFixture.get<ConfigService>(ConfigService);
    provider = moduleFixture.get<WhisperProvider>(WhisperProvider);

    // Check if API key is available
    const apiKey = configService.get<string>('OPENAI_API_KEY');
    apiKeyAvailable = !!apiKey && apiKey !== 'sk-proj-...';

    if (!apiKeyAvailable) {
      console.warn(
        '⚠️  OPENAI_API_KEY not configured - skipping Whisper E2E tests',
      );
      return;
    }

    // Load audio fixture
    const audioPath = path.join(
      __dirname,
      '../fixtures/audio/test-audio-30s.mp3',
    );
    const transcriptionPath = path.join(
      __dirname,
      '../fixtures/audio/test-audio-30s.txt',
    );

    if (!fs.existsSync(audioPath)) {
      console.warn(
        `⚠️  Audio fixture not found: ${audioPath} - skipping tests`,
      );
      console.warn(
        '   Please add a 30s MP3 file to test/fixtures/audio/test-audio-30s.mp3',
      );
      apiKeyAvailable = false; // Disable tests if no fixture
      return;
    }

    audioFixture = fs.readFileSync(audioPath);
    expectedTranscription = fs.existsSync(transcriptionPath)
      ? fs.readFileSync(transcriptionPath, 'utf-8').trim()
      : '';
  });

  describe('Transcription - Real API Call', () => {
    it('should transcribe audio successfully', async () => {
      if (!apiKeyAvailable) {
        console.log('⏭️  Skipping test - no API key or audio fixture');
        return;
      }

      const result = await provider.transcribe(audioFixture, { idioma: 'pt' });

      // Validate result structure
      expect(result.texto).toBeDefined();
      expect(result.texto.length).toBeGreaterThan(50); // Non-empty transcription
      expect(result.idioma).toMatch(/pt/i); // Portuguese
      expect(result.duracao_segundos).toBeGreaterThan(10); // At least 10s
      expect(result.duracao_segundos).toBeLessThan(120); // Less than 2min
      expect(result.confianca).toBeGreaterThan(0.7); // Quality threshold
      expect(result.confianca).toBeLessThanOrEqual(1.0);
      expect(result.custo_usd).toBeCloseTo(0.003, 2); // 30s ≈ $0.003
      expect(result.tempo_processamento_ms).toBeLessThan(30000); // <30s processing
      expect(result.metadata?.model).toBe('whisper-1');
      expect(result.metadata?.segments_count).toBeGreaterThan(0);

      console.log('✅ Whisper transcription result:', {
        texto_length: result.texto.length,
        duracao: `${result.duracao_segundos}s`,
        confianca: `${(result.confianca! * 100).toFixed(1)}%`,
        custo: `$${result.custo_usd.toFixed(4)}`,
        tempo: `${result.tempo_processamento_ms}ms`,
      });
    }, 60000); // 60s timeout

    it('should handle error for invalid API key', async () => {
      if (!apiKeyAvailable) {
        console.log('⏭️  Skipping test - no audio fixture');
        return;
      }

      // Create provider with invalid key
      const invalidConfig = {
        get: jest.fn((key: string) => {
          if (key === 'OPENAI_API_KEY') return 'sk-invalid-key';
          return configService.get(key);
        }),
      } as any;

      const invalidProvider = new WhisperProvider(invalidConfig);

      await expect(
        invalidProvider.transcribe(audioFixture),
      ).rejects.toThrowError(/Whisper error/);
    }, 30000);
  });

  describe('Health Check', () => {
    it('should report isAvailable as true with valid key', async () => {
      if (!apiKeyAvailable) {
        console.log('⏭️  Skipping test - no API key');
        return;
      }

      const available = await provider.isAvailable();
      expect(available).toBe(true);
    }, 10000);

    it('should report isAvailable as false with invalid key', async () => {
      if (!apiKeyAvailable) {
        console.log('⏭️  Skipping test');
        return;
      }

      const invalidConfig = {
        get: jest.fn((key: string) => {
          if (key === 'OPENAI_API_KEY') return 'sk-invalid';
          return configService.get(key);
        }),
      } as any;

      const invalidProvider = new WhisperProvider(invalidConfig);
      const available = await invalidProvider.isAvailable();
      expect(available).toBe(false);
    }, 10000);
  });

  describe('Provider Identity', () => {
    it('should return WHISPER as provider name', () => {
      expect(provider.getName()).toBe('WHISPER');
    });
  });
});
