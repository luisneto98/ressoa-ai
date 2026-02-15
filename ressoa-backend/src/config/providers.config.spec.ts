import { ProvidersConfigSchema, loadProvidersConfig, DEFAULT_PROVIDERS_CONFIG } from './providers.config';
import * as fs from 'fs';

jest.mock('fs');

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('ProvidersConfigSchema', () => {
  it('should validate a correct config', () => {
    const config = {
      version: '1.0.0',
      stt: { primary: 'WHISPER', fallback: 'GOOGLE' },
      llm: {
        analise_cobertura: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
        analise_qualitativa: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
        relatorio: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
        exercicios: { primary: 'GPT4_MINI', fallback: 'CLAUDE_SONNET' },
        alertas: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
      },
    };

    expect(() => ProvidersConfigSchema.parse(config)).not.toThrow();
  });

  it('should reject config with invalid STT provider', () => {
    const config = {
      version: '1.0.0',
      stt: { primary: 'INVALID', fallback: 'GOOGLE' },
      llm: {
        analise_cobertura: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
        analise_qualitativa: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
        relatorio: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
        exercicios: { primary: 'GPT4_MINI', fallback: 'CLAUDE_SONNET' },
        alertas: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
      },
    };

    expect(() => ProvidersConfigSchema.parse(config)).toThrow();
  });

  it('should reject config with invalid LLM provider', () => {
    const config = {
      version: '1.0.0',
      stt: { primary: 'WHISPER', fallback: 'GOOGLE' },
      llm: {
        analise_cobertura: { primary: 'INVALID_MODEL', fallback: 'GPT4_MINI' },
        analise_qualitativa: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
        relatorio: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
        exercicios: { primary: 'GPT4_MINI', fallback: 'CLAUDE_SONNET' },
        alertas: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
      },
    };

    expect(() => ProvidersConfigSchema.parse(config)).toThrow();
  });

  it('should reject config with missing llm analysis types', () => {
    const config = {
      version: '1.0.0',
      stt: { primary: 'WHISPER', fallback: 'GOOGLE' },
      llm: {
        analise_cobertura: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
        // missing other types
      },
    };

    expect(() => ProvidersConfigSchema.parse(config)).toThrow();
  });

  it('should reject config with missing version', () => {
    const config = {
      stt: { primary: 'WHISPER', fallback: 'GOOGLE' },
      llm: {
        analise_cobertura: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
        analise_qualitativa: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
        relatorio: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
        exercicios: { primary: 'GPT4_MINI', fallback: 'CLAUDE_SONNET' },
        alertas: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
      },
    };

    expect(() => ProvidersConfigSchema.parse(config)).toThrow();
  });

  it('should accept all valid ProviderSTT enum values', () => {
    const validSTT = ['WHISPER', 'GOOGLE', 'AZURE', 'MANUAL', 'GROQ_WHISPER'];
    for (const provider of validSTT) {
      const config = {
        version: '1.0.0',
        stt: { primary: provider, fallback: 'GOOGLE' },
        llm: {
          analise_cobertura: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
          analise_qualitativa: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
          relatorio: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
          exercicios: { primary: 'GPT4_MINI', fallback: 'CLAUDE_SONNET' },
          alertas: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
        },
      };
      expect(() => ProvidersConfigSchema.parse(config)).not.toThrow();
    }
  });

  it('should accept all valid ProviderLLM enum values', () => {
    const validLLM = ['CLAUDE_SONNET', 'CLAUDE_HAIKU', 'GPT4_TURBO', 'GPT4_MINI', 'GEMINI_PRO', 'GEMINI_FLASH'];
    for (const provider of validLLM) {
      const config = {
        version: '1.0.0',
        stt: { primary: 'WHISPER', fallback: 'GOOGLE' },
        llm: {
          analise_cobertura: { primary: provider, fallback: 'GPT4_MINI' },
          analise_qualitativa: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
          relatorio: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
          exercicios: { primary: 'GPT4_MINI', fallback: 'CLAUDE_SONNET' },
          alertas: { primary: 'CLAUDE_SONNET', fallback: 'GPT4_MINI' },
        },
      };
      expect(() => ProvidersConfigSchema.parse(config)).not.toThrow();
    }
  });
});

describe('loadProvidersConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return default config when file does not exist', () => {
    mockedFs.existsSync.mockReturnValue(false);

    const config = loadProvidersConfig('/nonexistent/path.json');

    expect(config).toEqual(DEFAULT_PROVIDERS_CONFIG);
    expect(mockedFs.existsSync).toHaveBeenCalledWith('/nonexistent/path.json');
  });

  it('should load and validate config from file', () => {
    const validConfig = {
      version: '2.0.0',
      stt: { primary: 'GOOGLE', fallback: 'WHISPER' },
      llm: {
        analise_cobertura: { primary: 'GPT4_MINI', fallback: 'CLAUDE_SONNET' },
        analise_qualitativa: { primary: 'GPT4_MINI', fallback: 'CLAUDE_SONNET' },
        relatorio: { primary: 'GPT4_MINI', fallback: 'CLAUDE_SONNET' },
        exercicios: { primary: 'GPT4_MINI', fallback: 'CLAUDE_SONNET' },
        alertas: { primary: 'GPT4_MINI', fallback: 'CLAUDE_SONNET' },
      },
    };

    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(validConfig));

    const config = loadProvidersConfig('/path/to/config.json');

    expect(config).toEqual(validConfig);
  });

  it('should return default config when file contains invalid JSON', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue('not valid json');

    const config = loadProvidersConfig('/path/to/config.json');

    expect(config).toEqual(DEFAULT_PROVIDERS_CONFIG);
  });

  it('should return default config when file has invalid schema', () => {
    const invalidConfig = {
      version: '1.0.0',
      stt: { primary: 'INVALID_PROVIDER', fallback: 'GOOGLE' },
      llm: {},
    };

    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(invalidConfig));

    const config = loadProvidersConfig('/path/to/config.json');

    expect(config).toEqual(DEFAULT_PROVIDERS_CONFIG);
  });

  it('should use default path when no path provided', () => {
    mockedFs.existsSync.mockReturnValue(false);
    delete process.env.PROVIDERS_CONFIG_PATH;

    loadProvidersConfig();

    expect(mockedFs.existsSync).toHaveBeenCalledWith('providers.config.json');
  });

  it('should use PROVIDERS_CONFIG_PATH env var when set', () => {
    process.env.PROVIDERS_CONFIG_PATH = '/custom/path.json';
    mockedFs.existsSync.mockReturnValue(false);

    loadProvidersConfig();

    expect(mockedFs.existsSync).toHaveBeenCalledWith('/custom/path.json');
    delete process.env.PROVIDERS_CONFIG_PATH;
  });

  it('should prefer explicit path over env var', () => {
    process.env.PROVIDERS_CONFIG_PATH = '/env/path.json';
    mockedFs.existsSync.mockReturnValue(false);

    loadProvidersConfig('/explicit/path.json');

    expect(mockedFs.existsSync).toHaveBeenCalledWith('/explicit/path.json');
    delete process.env.PROVIDERS_CONFIG_PATH;
  });
});
