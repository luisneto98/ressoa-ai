# Story 14.1: Camada de Roteamento Configurável

Status: done

## Story

Como desenvolvedor,
quero uma camada de roteamento que leia configuração e roteia operações para providers específicos,
para que o sistema decida em runtime qual provider usar sem code changes.

## Acceptance Criteria

1. **AC1:** `STTRouter` service criado com métodos `getSTTProvider()` e `getSTTFallback()` que retornam `STTProvider` conforme config
2. **AC2:** `LLMRouter` service criado com método `getLLMProvider(analysisType: 'cobertura' | 'qualitativa' | 'relatorio' | 'exercicios' | 'alertas')` que retorna `LLMProvider` conforme config
3. **AC3:** Config suporta estrutura JSON:
```json
{
  "version": "1.0.0",
  "stt": {
    "primary": "WHISPER",
    "fallback": "GOOGLE"
  },
  "llm": {
    "analise_cobertura": { "primary": "CLAUDE_SONNET", "fallback": "GPT4_MINI" },
    "analise_qualitativa": { "primary": "CLAUDE_SONNET", "fallback": "GPT4_MINI" },
    "relatorio": { "primary": "CLAUDE_SONNET", "fallback": "GPT4_MINI" },
    "exercicios": { "primary": "GPT4_MINI", "fallback": "CLAUDE_SONNET" },
    "alertas": { "primary": "CLAUDE_SONNET", "fallback": "GPT4_MINI" }
  }
}
```
4. **AC4:** Router tenta primary → se falhar, tenta fallback → se falhar, throw error com contexto claro
5. **AC5:** Logs estruturados (Pino) registram: provider tentado, fallback usado (se aplicável), latência, custo, success/failure
6. **AC6:** Suporta hot-reload de config via file watcher (sem restart do servidor)
7. **AC7:** Validação de schema via Zod com mensagens de erro claras
8. **AC8:** Defaults seguros: se config ausente ou inválida, usa providers atuais (Whisper + Claude para análise, GPT4 mini para exercícios)
9. **AC9:** Testes unitários: mock providers, validação de roteamento, fallback behavior, config inválida
10. **AC10:** Cobertura de testes ≥85%

## Tasks / Subtasks

- [x] Task 1: Criar schema Zod e config loader (AC: #3, #7, #8)
  - [x] 1.1 Criar `src/config/providers.config.ts` com `ProvidersConfigSchema` (Zod)
  - [x] 1.2 Definir union types para provider keys usando valores existentes dos enums Prisma (`ProviderSTT`: WHISPER, GOOGLE, AZURE | `ProviderLLM`: CLAUDE_SONNET, GPT4_MINI, GEMINI_FLASH, etc.)
  - [x] 1.3 Implementar `loadProvidersConfig(configPath?)` que lê JSON, valida com Zod, retorna config tipada
  - [x] 1.4 Implementar defaults seguros: retorna config padrão se arquivo não existe ou Zod rejeita (com `logger.warn`)
  - [x] 1.5 Criar `src/config/providers.config.spec.ts`: schema válido, inválido, defaults, arquivo missing

- [x] Task 2: Criar `ProvidersConfigService` com hot-reload (AC: #6, #7)
  - [x] 2.1 Criar `src/modules/providers-config/providers-config.service.ts`
  - [x] 2.2 Carregar config no `onModuleInit()` via `loadProvidersConfig()`
  - [x] 2.3 Implementar `fs.watch()` com debounce 1s no config file para hot-reload
  - [x] 2.4 On file change: re-validate com Zod → se válido, swap in-memory config → se inválido, manter anterior + `logger.error`
  - [x] 2.5 Expor getters: `getSTTConfig()`, `getLLMConfig(analysisType)`
  - [x] 2.6 Criar `src/modules/providers-config/providers-config.module.ts` com `@Global()` decorator
  - [x] 2.7 Testes unitários: load, reload válido, reload inválido mantém anterior

- [x] Task 3: Criar `STTRouter` service (AC: #1, #4, #5)
  - [x] 3.1 Criar `src/modules/stt/services/stt-router.service.ts`
  - [x] 3.2 Injetar providers via DI tokens existentes: `WHISPER_PROVIDER`, `GOOGLE_PROVIDER`
  - [x] 3.3 Injetar `ProvidersConfigService` para obter config
  - [x] 3.4 Mapear provider keys → instâncias: `{ WHISPER: whisperProvider, GOOGLE: googleProvider }`
  - [x] 3.5 Implementar `getSTTProvider()`: lookup config `stt.primary` no map
  - [x] 3.6 Implementar `getSTTFallback()`: lookup config `stt.fallback` no map
  - [x] 3.7 Implementar `transcribeWithFallback(audioBuffer, options)`: primary com timeout 5min → fallback com timeout 5min → error
  - [x] 3.8 Logs estruturados em cada tentativa (provider, resultado, tempo)
  - [x] 3.9 Criar `src/modules/stt/services/stt-router.service.spec.ts`

- [x] Task 4: Criar `LLMRouter` service (AC: #2, #4, #5)
  - [x] 4.1 Criar `src/modules/llm/services/llm-router.service.ts`
  - [x] 4.2 Injetar providers via DI tokens existentes: `CLAUDE_PROVIDER`, `GPT_PROVIDER`
  - [x] 4.3 Injetar `ProvidersConfigService` para obter config
  - [x] 4.4 Mapear provider keys → instâncias: `{ CLAUDE_SONNET: claudeProvider, GPT4_MINI: gptProvider }`
  - [x] 4.5 Implementar `getLLMProvider(analysisType)`: lookup config `llm[analysisType].primary` no map
  - [x] 4.6 Implementar `getLLMFallback(analysisType)`: lookup config `llm[analysisType].fallback` no map
  - [x] 4.7 Implementar `generateWithFallback(analysisType, prompt, options)`: primary → fallback → error com logs
  - [x] 4.8 Logs estruturados em cada tentativa (provider, analysisType, tokens, custo, tempo)
  - [x] 4.9 Criar `src/modules/llm/services/llm-router.service.spec.ts`

- [x] Task 5: Registrar routers nos módulos NestJS (AC: #1, #2)
  - [x] 5.1 Atualizar `src/modules/stt/stt.module.ts`: adicionar `STTRouter` em providers e exports
  - [x] 5.2 Atualizar `src/modules/llm/llm.module.ts`: adicionar `LLMRouter` em providers e exports
  - [x] 5.3 Importar `ProvidersConfigModule` em `SttModule` e `LLMModule` (via @Global - auto-available)
  - [x] 5.4 Registrar `ProvidersConfigModule` em `AppModule`

- [x] Task 6: Criar config file padrão (AC: #3, #8)
  - [x] 6.1 Criar `ressoa-backend/providers.config.json` com config que replica comportamento atual (Whisper+Claude+GPT)
  - [x] 6.2 Criar `ressoa-backend/providers.config.example.json` documentado com todos os campos
  - [x] 6.3 Adicionar `providers.config.json` ao `.gitignore` (template vai no .example)

- [x] Task 7: Testes de integração e cobertura (AC: #9, #10)
  - [x] 7.1 STTRouter: roteamento correto, fallback funciona, config inválida usa default
  - [x] 7.2 LLMRouter: roteamento por analysisType correto, fallback funciona
  - [x] 7.3 Hot-reload: file change atualiza config, file change inválido mantém anterior
  - [x] 7.4 Validar cobertura ≥85% com `jest --coverage`

## Dev Notes

### Arquitetura Atual (NÃO quebrar - NÃO integrar nesta story)

O sistema já tem abstração de providers. Esta story cria a **camada de roteamento** como infraestrutura nova. A **integração** com o pipeline de análise é Story 14.4.

```
ANTES (atual):
  STTService → injeta WHISPER/GOOGLE diretamente, hardcoded primary/fallback via env vars
  AnaliseService → injeta CLAUDE/GPT diretamente, hardcoded por tipo de prompt

DEPOIS desta story (14.1):
  STTRouter criado e exportado (mas STTService ainda NÃO usa)
  LLMRouter criado e exportado (mas AnaliseService ainda NÃO usa)

Story 14.4 fará: STTService → STTRouter | AnaliseService → LLMRouter
```

### Interfaces Existentes (REUTILIZAR - NÃO recriar)

**LLMProvider** (`src/modules/llm/interfaces/llm-provider.interface.ts`):
```typescript
interface LLMProvider {
  getName(): ProviderLLM;
  generate(prompt: string, options?: GenerateOptions): Promise<LLMResult>;
  isAvailable(): Promise<boolean>;
}
```

**STTProvider** (`src/modules/stt/interfaces/stt-provider.interface.ts`):
```typescript
interface STTProvider {
  getName(): ProviderSTT;
  transcribe(audioBuffer: Buffer, options?: TranscribeOptions): Promise<TranscriptionResult>;
  isAvailable(): Promise<boolean>;
}
```

### DI Tokens Existentes

```typescript
// STT (em SttModule)
'WHISPER_PROVIDER' → WhisperProvider
'GOOGLE_PROVIDER'  → GoogleProvider

// LLM (em LLMModule)
'CLAUDE_PROVIDER'  → ClaudeProvider
'GPT_PROVIDER'     → GPTProvider
```

### Prisma Enums (já existem - usar como referência)

```prisma
enum ProviderSTT  { WHISPER, GOOGLE, AZURE, MANUAL }
enum ProviderLLM  { CLAUDE_SONNET, CLAUDE_HAIKU, GPT4_TURBO, GPT4_MINI, GEMINI_PRO, GEMINI_FLASH }
```

Story 14.2 adicionará `GROQ_WHISPER` ao ProviderSTT. Story 14.3 usará `GEMINI_FLASH` já existente. Os routers devem usar string keys na config que mapeiam para esses enums → design extensível para novos providers.

### STTService Fallback Pattern (referência)

`src/modules/stt/stt.service.ts` já implementa primary/fallback com timeout 5min via `Promise.race`. Usar mesmo padrão nos routers:

```typescript
private async transcribeWithTimeout(provider, audioBuffer, options, timeoutMs) {
  return Promise.race([
    provider.transcribe(audioBuffer, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout ${timeoutMs}ms`)), timeoutMs)),
  ]);
}
```

### AnaliseService Provider Selection (referência)

`src/modules/analise/services/analise.service.ts` faz hardcoded: Prompts 1,2,3,5 → Claude | Prompt 4 → GPT4 mini. O `LLMRouter` encapsula essa lógica via config.

### Config File Strategy

- `providers.config.json` contém APENAS roteamento (sem secrets)
- API keys ficam em `.env` (já configurado: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`)
- Path do config file via env var `PROVIDERS_CONFIG_PATH` (default: `providers.config.json`)
- Hot-reload via `fs.watch()` com debounce 1s (sem `chokidar`)
- Se arquivo não existe ou inválido → defaults seguros que replicam comportamento atual

### Default Config (replica comportamento atual)

```json
{
  "version": "1.0.0",
  "stt": { "primary": "WHISPER", "fallback": "GOOGLE" },
  "llm": {
    "analise_cobertura": { "primary": "CLAUDE_SONNET", "fallback": "GPT4_MINI" },
    "analise_qualitativa": { "primary": "CLAUDE_SONNET", "fallback": "GPT4_MINI" },
    "relatorio": { "primary": "CLAUDE_SONNET", "fallback": "GPT4_MINI" },
    "exercicios": { "primary": "GPT4_MINI", "fallback": "CLAUDE_SONNET" },
    "alertas": { "primary": "CLAUDE_SONNET", "fallback": "GPT4_MINI" }
  }
}
```

### Provider Key → Instance Mapping Pattern

```typescript
// LLMRouter constructor
constructor(
  @Inject('CLAUDE_PROVIDER') private claude: LLMProvider,
  @Inject('GPT_PROVIDER') private gpt: LLMProvider,
  private configService: ProvidersConfigService,
) {
  this.providerMap = new Map<string, LLMProvider>([
    ['CLAUDE_SONNET', this.claude],
    ['GPT4_MINI', this.gpt],
    // Story 14.3 adds: ['GEMINI_FLASH', this.gemini]
  ]);
}

getProviderByKey(key: string): LLMProvider {
  const provider = this.providerMap.get(key);
  if (!provider) throw new Error(`Unknown LLM provider: ${key}. Available: ${[...this.providerMap.keys()]}`);
  return provider;
}
```

### LLM Analysis Types (TypeScript type)

```typescript
export type LLMAnalysisType = 'analise_cobertura' | 'analise_qualitativa' | 'relatorio' | 'exercicios' | 'alertas';
```

Usar este type nos métodos do LLMRouter para type safety.

### Testing Patterns (seguir padrões do projeto)

- Use `describe/it` com mensagens em inglês
- Mock providers: `{ generate: jest.fn().mockResolvedValue(mockLLMResult), getName: jest.fn().mockReturnValue('CLAUDE_SONNET'), isAvailable: jest.fn().mockResolvedValue(true) }`
- Mock `ProvidersConfigService`: `{ getSTTConfig: jest.fn(), getLLMConfig: jest.fn() }`
- Mock `fs.readFileSync` e `fs.watch` para config file tests
- Use `jest.spyOn(Logger.prototype, 'log')` para validar logs estruturados

### Project Structure Notes

```
src/config/
├── env.ts                             (existente - NÃO modificar)
├── constants.ts                       (existente - NÃO modificar)
├── providers.config.ts                (NOVO - Zod schema + loader + types)
└── providers.config.spec.ts           (NOVO)

src/modules/providers-config/
├── providers-config.module.ts         (NOVO - @Global module)
├── providers-config.service.ts        (NOVO - config loading + hot-reload)
└── providers-config.service.spec.ts   (NOVO)

src/modules/stt/services/
├── stt-router.service.ts              (NOVO)
└── stt-router.service.spec.ts         (NOVO)

src/modules/llm/services/
├── llm-router.service.ts              (NOVO)
├── llm-router.service.spec.ts         (NOVO)
└── prompt.service.ts                  (existente - NÃO modificar)

Arquivos MODIFICADOS:
├── src/modules/stt/stt.module.ts      (adicionar STTRouter provider+export)
├── src/modules/llm/llm.module.ts      (adicionar LLMRouter provider+export)
├── src/app.module.ts                  (importar ProvidersConfigModule)
├── .gitignore                         (adicionar providers.config.json)

Arquivos na raiz backend:
├── providers.config.json              (NOVO - config padrão, gitignored)
└── providers.config.example.json      (NOVO - template documentado, tracked)
```

### References

- [Source: src/modules/llm/interfaces/llm-provider.interface.ts] - Interface LLMProvider + LLMResult + GenerateOptions
- [Source: src/modules/stt/interfaces/stt-provider.interface.ts] - Interface STTProvider + TranscriptionResult + TranscribeOptions
- [Source: src/modules/llm/llm.module.ts] - DI tokens CLAUDE_PROVIDER, GPT_PROVIDER
- [Source: src/modules/stt/stt.module.ts] - DI tokens WHISPER_PROVIDER, GOOGLE_PROVIDER
- [Source: src/modules/stt/stt.service.ts] - Padrão existente de fallback com timeout 5min
- [Source: src/modules/analise/services/analise.service.ts] - Pipeline 5 prompts, provider selection hardcoded
- [Source: src/config/env.ts] - Schema Zod de env vars (referência de padrão Zod)
- [Source: prisma/schema.prisma:58-79] - Enums ProviderSTT e ProviderLLM
- [Source: epic-14-provider-routing-configuravel.md] - Epic completo, business context, ROI

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed `z.ZodError.errors` → `z.ZodError.issues` (Zod v3 API)

### Completion Notes List

- **Task 1:** Created `ProvidersConfigSchema` with Zod validation for STT/LLM provider routing config. Supports all Prisma enum values. `loadProvidersConfig()` reads JSON, validates, returns typed config with safe defaults. 14 tests passing.
- **Task 2:** Created `ProvidersConfigService` as `@Global()` NestJS module with `fs.watch()` hot-reload (1s debounce). Invalid reload keeps previous config. Getters: `getSTTConfig()`, `getLLMConfig(analysisType)`. 11 tests passing.
- **Task 3:** Created `STTRouterService` with config-driven provider selection via `Map<string, STTProvider>`. Methods: `getSTTProvider()`, `getSTTFallback()`, `transcribeWithFallback()` with primary→fallback→error pattern and 5min timeout. Structured logs on each attempt. 11 tests passing.
- **Task 4:** Created `LLMRouterService` with per-analysisType provider routing. Methods: `getLLMProvider(type)`, `getLLMFallback(type)`, `generateWithFallback(type, prompt, options)`. Logs include analysisType, tokens, cost, duration. 11 tests passing.
- **Task 5:** Registered routers in SttModule, LLMModule (providers + exports). Registered ProvidersConfigModule in AppModule as @Global.
- **Task 6:** Created `providers.config.json` (gitignored) and `providers.config.example.json` (tracked) with default config that replicates current behavior.
- **Task 7:** All 47 Story 14.1 tests passing. Coverage: providers.config.ts 100%, providers-config.service.ts 95.55%, stt-router.service.ts 97.61%, llm-router.service.ts 100%. All above 85% threshold.
- **No regressions introduced:** 5 pre-existing test failures unrelated to this story (auth, admin, turmas, analise-controller, email).

### Change Log

- 2026-02-14: Story 14.1 implemented - Configurable provider routing layer with STT/LLM routers, Zod validation, hot-reload, and 47 unit tests
- 2026-02-14: Code review (AI) - 5 issues fixed: (1) HIGH: Timer leak in STTRouter transcribeWithTimeout - added clearTimeout in finally block; (2) MEDIUM: LLMRouter missing timeout protection - added generateWithTimeout with 5min timeout + timer cleanup; (3) MEDIUM: File watcher started even when config file missing - added existsSync guard; (4-5) MEDIUM: Test improvements - removed unreachable mock code in timeout test, added test for missing config file watcher skip. 48 tests passing.

### File List

New files:
- ressoa-backend/src/config/providers.config.ts
- ressoa-backend/src/config/providers.config.spec.ts
- ressoa-backend/src/modules/providers-config/providers-config.module.ts
- ressoa-backend/src/modules/providers-config/providers-config.service.ts
- ressoa-backend/src/modules/providers-config/providers-config.service.spec.ts
- ressoa-backend/src/modules/stt/services/stt-router.service.ts
- ressoa-backend/src/modules/stt/services/stt-router.service.spec.ts
- ressoa-backend/src/modules/llm/services/llm-router.service.ts
- ressoa-backend/src/modules/llm/services/llm-router.service.spec.ts
- ressoa-backend/providers.config.json
- ressoa-backend/providers.config.example.json

Modified files:
- ressoa-backend/src/modules/stt/stt.module.ts (added STTRouterService provider+export)
- ressoa-backend/src/modules/llm/llm.module.ts (added LLMRouterService provider+export)
- ressoa-backend/src/app.module.ts (added ProvidersConfigModule import)
- ressoa-backend/.gitignore (added providers.config.json)
