import { ProvidersConfigService } from './providers-config.service';
import { DEFAULT_PROVIDERS_CONFIG } from '../../config/providers.config';
import * as fs from 'fs';
import * as providersConfig from '../../config/providers.config';

jest.mock('fs');

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('ProvidersConfigService', () => {
  let service: ProvidersConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    delete process.env.PROVIDERS_CONFIG_PATH;

    // Default: config file exists so watcher can start
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.watch.mockImplementation(() => {
      const emitter = {
        on: jest.fn().mockReturnThis(),
        close: jest.fn(),
      } as any;
      return emitter;
    });

    service = new ProvidersConfigService();
  });

  afterEach(() => {
    delete process.env.DIARIZATION_ENABLED;
    service.onModuleDestroy();
  });

  describe('onModuleInit', () => {
    it('should load config on init', () => {
      const loadSpy = jest
        .spyOn(providersConfig, 'loadProvidersConfig')
        .mockReturnValue({ ...DEFAULT_PROVIDERS_CONFIG, version: '2.0.0' });

      service.onModuleInit();

      expect(loadSpy).toHaveBeenCalled();
      expect(service.getConfig().version).toBe('2.0.0');
    });

    it('should start file watcher on init', () => {
      jest
        .spyOn(providersConfig, 'loadProvidersConfig')
        .mockReturnValue(DEFAULT_PROVIDERS_CONFIG);

      service.onModuleInit();

      expect(mockedFs.watch).toHaveBeenCalled();
    });

    it('should skip file watcher when config file does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);
      jest
        .spyOn(providersConfig, 'loadProvidersConfig')
        .mockReturnValue(DEFAULT_PROVIDERS_CONFIG);

      service.onModuleInit();

      expect(mockedFs.watch).not.toHaveBeenCalled();
    });
  });

  describe('getSTTConfig', () => {
    it('should return STT config', () => {
      jest
        .spyOn(providersConfig, 'loadProvidersConfig')
        .mockReturnValue(DEFAULT_PROVIDERS_CONFIG);
      service.onModuleInit();

      const sttConfig = service.getSTTConfig();

      expect(sttConfig).toEqual({ primary: 'WHISPER', fallback: 'GOOGLE' });
    });
  });

  describe('getLLMConfig', () => {
    it('should return LLM config for analise_cobertura', () => {
      jest
        .spyOn(providersConfig, 'loadProvidersConfig')
        .mockReturnValue(DEFAULT_PROVIDERS_CONFIG);
      service.onModuleInit();

      const llmConfig = service.getLLMConfig('analise_cobertura');

      expect(llmConfig).toEqual({
        primary: 'CLAUDE_SONNET',
        fallback: 'GPT4_MINI',
      });
    });

    it('should return LLM config for exercicios (GPT4_MINI primary)', () => {
      jest
        .spyOn(providersConfig, 'loadProvidersConfig')
        .mockReturnValue(DEFAULT_PROVIDERS_CONFIG);
      service.onModuleInit();

      const llmConfig = service.getLLMConfig('exercicios');

      expect(llmConfig).toEqual({
        primary: 'GPT4_MINI',
        fallback: 'CLAUDE_SONNET',
      });
    });

    it('should return config for all analysis types', () => {
      jest
        .spyOn(providersConfig, 'loadProvidersConfig')
        .mockReturnValue(DEFAULT_PROVIDERS_CONFIG);
      service.onModuleInit();

      const types = [
        'analise_cobertura',
        'analise_qualitativa',
        'relatorio',
        'exercicios',
        'alertas',
      ] as const;
      for (const type of types) {
        const config = service.getLLMConfig(type);
        expect(config).toHaveProperty('primary');
        expect(config).toHaveProperty('fallback');
      }
    });
  });

  describe('hot-reload', () => {
    it('should reload config when file changes with valid content', () => {
      jest.useFakeTimers();
      jest
        .spyOn(providersConfig, 'loadProvidersConfig')
        .mockReturnValue(DEFAULT_PROVIDERS_CONFIG);

      let watchCallback: Function;
      mockedFs.watch.mockImplementation((_path, cb) => {
        watchCallback = cb as Function;
        return {
          on: jest.fn().mockReturnThis(),
          close: jest.fn(),
        } as any;
      });

      service.onModuleInit();
      expect(service.getSTTConfig().primary).toBe('WHISPER');

      // Simulate file change with new valid config
      const newConfig = {
        ...DEFAULT_PROVIDERS_CONFIG,
        version: '2.0.0',
        stt: { primary: 'GOOGLE', fallback: 'WHISPER' },
      };
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(newConfig));

      watchCallback!();
      jest.advanceTimersByTime(1000);

      expect(service.getSTTConfig().primary).toBe('GOOGLE');
      expect(service.getConfig().version).toBe('2.0.0');

      jest.useRealTimers();
    });

    it('should keep previous config when reload produces invalid data', () => {
      jest.useFakeTimers();
      jest
        .spyOn(providersConfig, 'loadProvidersConfig')
        .mockReturnValue(DEFAULT_PROVIDERS_CONFIG);

      let watchCallback: Function;
      mockedFs.watch.mockImplementation((_path, cb) => {
        watchCallback = cb as Function;
        return {
          on: jest.fn().mockReturnThis(),
          close: jest.fn(),
        } as any;
      });

      service.onModuleInit();
      expect(service.getSTTConfig().primary).toBe('WHISPER');

      // Simulate file change with invalid config
      mockedFs.readFileSync.mockReturnValue(JSON.stringify({ invalid: true }));

      watchCallback!();
      jest.advanceTimersByTime(1000);

      // Should keep previous config
      expect(service.getSTTConfig().primary).toBe('WHISPER');

      jest.useRealTimers();
    });

    it('should keep previous config when reload fails to read file', () => {
      jest.useFakeTimers();
      jest
        .spyOn(providersConfig, 'loadProvidersConfig')
        .mockReturnValue(DEFAULT_PROVIDERS_CONFIG);

      let watchCallback: Function;
      mockedFs.watch.mockImplementation((_path, cb) => {
        watchCallback = cb as Function;
        return {
          on: jest.fn().mockReturnThis(),
          close: jest.fn(),
        } as any;
      });

      service.onModuleInit();

      // Simulate file change but readFileSync throws
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('ENOENT');
      });

      watchCallback!();
      jest.advanceTimersByTime(1000);

      // Should keep previous config
      expect(service.getSTTConfig().primary).toBe('WHISPER');

      jest.useRealTimers();
    });

    it('should debounce rapid file changes', () => {
      jest.useFakeTimers();
      jest
        .spyOn(providersConfig, 'loadProvidersConfig')
        .mockReturnValue(DEFAULT_PROVIDERS_CONFIG);

      let watchCallback: Function;
      mockedFs.watch.mockImplementation((_path, cb) => {
        watchCallback = cb as Function;
        return {
          on: jest.fn().mockReturnThis(),
          close: jest.fn(),
        } as any;
      });

      service.onModuleInit();

      const newConfig = { ...DEFAULT_PROVIDERS_CONFIG, version: '3.0.0' };
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(newConfig));

      // Rapid successive calls
      watchCallback!();
      watchCallback!();
      watchCallback!();

      jest.advanceTimersByTime(1000);

      // readFileSync should only be called once due to debounce
      expect(mockedFs.readFileSync).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  });

  describe('isDiarizationEnabled', () => {
    it('should return true when DIARIZATION_ENABLED is "true"', () => {
      process.env.DIARIZATION_ENABLED = 'true';

      expect(service.isDiarizationEnabled()).toBe(true);
    });

    it('should return false when DIARIZATION_ENABLED is "false"', () => {
      process.env.DIARIZATION_ENABLED = 'false';

      expect(service.isDiarizationEnabled()).toBe(false);
    });

    it('should default to true when DIARIZATION_ENABLED is undefined', () => {
      delete process.env.DIARIZATION_ENABLED;

      expect(service.isDiarizationEnabled()).toBe(true);
    });

    it('should return false for any non-"true" string value', () => {
      process.env.DIARIZATION_ENABLED = 'yes';

      expect(service.isDiarizationEnabled()).toBe(false);
    });
  });

  describe('onModuleDestroy', () => {
    it('should close file watcher on destroy', () => {
      jest
        .spyOn(providersConfig, 'loadProvidersConfig')
        .mockReturnValue(DEFAULT_PROVIDERS_CONFIG);

      const closeFn = jest.fn();
      mockedFs.watch.mockImplementation(
        () =>
          ({
            on: jest.fn().mockReturnThis(),
            close: closeFn,
          }) as any,
      );

      service.onModuleInit();
      service.onModuleDestroy();

      expect(closeFn).toHaveBeenCalled();
    });
  });
});
