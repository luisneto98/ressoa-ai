# Story 14.2: Implementar Groq Whisper Provider (STT)

Status: done

## Story

As a sistema,
I want suporte para Groq Whisper Large v3 Turbo como provider STT,
so that possa reduzir custo de STT em 89% ($0.36/hora → $0.04/hora) mantendo qualidade de transcrição.

## Acceptance Criteria

1. **AC1:** `GroqWhisperProvider` criado implementando interface `STTProvider` (mesma interface que `WhisperProvider` e `GoogleProvider`)
2. **AC2:** Suporta 3 modelos Groq via env var `GROQ_WHISPER_MODEL`:
   - `whisper-large-v3-turbo` ($0.04/hora) — primário, melhor custo-benefício
   - `distil-whisper-large-v3-en` ($0.02/hora) — ultra barato (apenas inglês)
   - `whisper-large-v3` ($0.111/hora) — máxima qualidade, WER 10.3%
3. **AC3:** Provider calcula custo real: `Math.max(duracao_segundos, 10) / 3600 * COST_PER_HOUR` com mínimo de 10 segundos cobrados
4. **AC4:** Retorna `TranscriptionResult` normalizado (compatível com WhisperProvider e GoogleProvider)
5. **AC5:** Logs estruturados incluem: modelo usado, tempo processamento (ms), custo (USD), confidence score
6. **AC6:** Error handling: timeout (300s), rate limit (429 → throw com mensagem clara), quota (402), API errors genéricos
7. **AC7:** Testes unitários: mock Groq SDK, validação de output, cálculo de custo, error handling
8. **AC8:** Health check via `isAvailable()` method
9. **AC9:** Provider registrado no `SttModule` com DI token `'GROQ_WHISPER_PROVIDER'`
10. **AC10:** Provider adicionado ao `STTRouterService.providerMap` com key `'GROQ_WHISPER'`
11. **AC11:** `ProviderSTT` enum no Prisma schema atualizado com valor `GROQ_WHISPER`
12. **AC12:** `ProviderSTTKey` no Zod schema (`providers.config.ts`) atualizado com `'GROQ_WHISPER'`
13. **AC13:** Cobertura de testes ≥85%

## Tasks / Subtasks

- [x] Task 1: Prisma schema + migration (AC: #11)
  - [x] 1.1 Adicionar `GROQ_WHISPER` ao enum `ProviderSTT` em `prisma/schema.prisma`
  - [x] 1.2 Gerar migration: `npx prisma migrate dev --name add-groq-whisper-provider`
  - [x] 1.3 Gerar Prisma client: `npx prisma generate`

- [x] Task 2: Atualizar Zod schema de providers config (AC: #12)
  - [x] 2.1 Adicionar `'GROQ_WHISPER'` ao `ProviderSTTKey` z.enum em `src/config/providers.config.ts`
  - [x] 2.2 Atualizar testes em `providers.config.spec.ts` para incluir novo valor válido

- [x] Task 3: Instalar groq-sdk (AC: #1)
  - [x] 3.1 `npm install groq-sdk` no diretório `ressoa-backend/`
  - [x] 3.2 Verificar que `groq-sdk` aparece no `package.json`

- [x] Task 4: Criar `GroqWhisperProvider` (AC: #1, #2, #3, #4, #5, #6, #8)
  - [x] 4.1 Criar `src/modules/stt/providers/groq-whisper.provider.ts`
  - [x] 4.2 Implementar `getName()` retornando `ProviderSTT.GROQ_WHISPER`
  - [x] 4.3 Implementar `transcribe(audioBuffer, options?)`:
    - Ler modelo de `GROQ_WHISPER_MODEL` env var (default: `whisper-large-v3-turbo`)
    - Criar temp file `/tmp/{uuid}.mp3` (Groq API requer file stream, igual WhisperProvider)
    - Chamar `groq.audio.transcriptions.create()` com `response_format: 'verbose_json'`
    - Normalizar language code (pt-BR → pt) usando mesma lógica do WhisperProvider
    - Calcular custo: `Math.max(duracao_segundos, 10) / 3600 * modelCost`
    - Extrair confidence de `avg_logprob` dos segments (converter logprob → probability)
    - Cleanup temp file no finally block
  - [x] 4.4 Implementar `isAvailable()`: tentar listar models da Groq API
  - [x] 4.5 Implementar mapa de custos por modelo
  - [x] 4.6 Error handling: rate limit (429), quota (402/insufficient_quota), timeout
  - [x] 4.7 Logs estruturados Pino em cada operação

- [x] Task 5: Registrar provider no SttModule (AC: #9)
  - [x] 5.1 Adicionar import de `GroqWhisperProvider` em `stt.module.ts`
  - [x] 5.2 Adicionar provider: `{ provide: 'GROQ_WHISPER_PROVIDER', useClass: GroqWhisperProvider }`
  - [x] 5.3 NÃO adicionar ao exports (provider interno, acessado via STTRouter)

- [x] Task 6: Registrar no STTRouterService (AC: #10)
  - [x] 6.1 Injetar `@Inject('GROQ_WHISPER_PROVIDER') private groqWhisperProvider: STTProvider` no constructor
  - [x] 6.2 Adicionar `['GROQ_WHISPER', this.groqWhisperProvider]` ao `providerMap`

- [x] Task 7: Atualizar .env.example e providers.config.example.json (AC: #2)
  - [x] 7.1 Adicionar `GROQ_API_KEY` e `GROQ_WHISPER_MODEL` ao `.env.example`
  - [x] 7.2 Atualizar `providers.config.example.json` com exemplo usando `GROQ_WHISPER`

- [x] Task 8: Testes unitários (AC: #7, #13)
  - [x] 8.1 Criar `src/modules/stt/providers/groq-whisper.provider.spec.ts`
  - [x] 8.2 Testes completos (ver seção Dev Notes para lista obrigatória)
  - [x] 8.3 Atualizar `stt-router.service.spec.ts` para incluir GROQ_WHISPER no providerMap mock
  - [x] 8.4 Validar cobertura ≥85%

## Dev Notes

### Arquitetura — Como tudo se encaixa

```
TranscriptionProcessor (Bull Worker - Concurrency: 3)
    ↓
TranscricaoService (Download S3, compress, persist)
    ↓
STTService (Legacy - ainda NÃO usa STTRouter, Story 14.4 fará integração)
    ↓
STTRouterService (Config-driven routing, Story 14.1)
    ↓ providerMap lookup
{WhisperProvider, GoogleProvider, GroqWhisperProvider} ← NOVO
    ↓
External APIs (OpenAI, Google Cloud, Groq)
```

**IMPORTANTE:** Esta story APENAS cria o `GroqWhisperProvider` e registra-o no router. A integração real com `TranscricaoService`/`STTService` é Story 14.4.

### Padrão a seguir: WhisperProvider (copiar e adaptar)

O `GroqWhisperProvider` DEVE seguir exatamente o mesmo padrão de `WhisperProvider` (`src/modules/stt/providers/whisper.provider.ts`):

1. **Injeção de ConfigService** para ler env vars
2. **Temp file pattern:** cria arquivo temp em `/tmp/{uuid}.mp3` → faz stream → deleta no finally
3. **API call:** `groq.audio.transcriptions.create()` (Groq SDK é OpenAI-compatible)
4. **Normalização de language code:** `pt-BR → pt` (ISO 639-1)
5. **Cálculo de cost:** baseado em duração real retornada pela API
6. **Confidence:** Groq retorna `avg_logprob` nos segments (verbose_json) — converter para 0.0-1.0
7. **Error handling:** mesmo padrão (rate limit, quota, generic error)
8. **Cleanup:** always delete temp file no finally block

### Groq SDK — API Reference

```typescript
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Transcrição com file stream (USAR ESTE PADRÃO)
const transcription = await groq.audio.transcriptions.create({
  file: fs.createReadStream(tempFilePath),     // File stream obrigatório
  model: 'whisper-large-v3-turbo',             // Model ID
  response_format: 'verbose_json',             // Para obter segments, duration, confidence
  language: 'pt',                               // ISO 639-1
  temperature: 0.0,                             // Deterministic output
});
```

### Groq API Specs

| Spec | Valor |
|------|-------|
| Endpoint | `https://api.groq.com/openai/v1/audio/transcriptions` |
| Max file size | 25 MB (free), 100 MB (dev) |
| Min billed | 10 segundos |
| Formats | flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm |
| Response | json, verbose_json, text |
| Speed | 216x real-time (turbo), 189x (large-v3) |
| WER | 12% (turbo), 10.3% (large-v3) |

### Custos por modelo

| Model ID | Custo/Hora | Para 50min áudio |
|----------|-----------|------------------|
| `whisper-large-v3-turbo` | $0.04 | $0.033 |
| `distil-whisper-large-v3-en` | $0.02 | $0.017 |
| `whisper-large-v3` | $0.111 | $0.093 |

Fórmula: `custo = Math.max(duracao_segundos, 10) / 3600 * modelCost`

### Confidence Score — Conversão de avg_logprob

Groq verbose_json retorna `avg_logprob` por segment (negativo, mais próximo de 0 = melhor):

```typescript
private calculateConfidence(segments: any[]): number {
  if (!segments || segments.length === 0) return 0.9;
  const avgLogprob = segments.reduce(
    (sum, s) => sum + (s.avg_logprob || -0.3), 0
  ) / segments.length;
  return Math.max(0, Math.min(1, 1 + avgLogprob));
}
```

### STTProvider Interface (REUTILIZAR — NÃO recriar)

```typescript
// src/modules/stt/interfaces/stt-provider.interface.ts
interface STTProvider {
  getName(): ProviderSTT;
  transcribe(audioBuffer: Buffer, options?: TranscribeOptions): Promise<TranscriptionResult>;
  isAvailable(): Promise<boolean>;
}

interface TranscriptionResult {
  texto: string;
  provider: ProviderSTT;
  idioma: string;
  duracao_segundos?: number;
  confianca?: number;
  custo_usd: number;
  tempo_processamento_ms: number;
  metadata?: Record<string, any>;
}
```

### STTRouterService — Mudanças necessárias (mínimas)

Adicionar ao constructor:
```typescript
@Inject('GROQ_WHISPER_PROVIDER') private groqWhisperProvider: STTProvider,
```
Adicionar ao providerMap:
```typescript
['GROQ_WHISPER', this.groqWhisperProvider],
```

### Prisma Schema — Enum update

Adicionar `GROQ_WHISPER` ao `enum ProviderSTT` em `prisma/schema.prisma` (depois de `MANUAL`).

### Zod Schema — Update

Adicionar `'GROQ_WHISPER'` ao `ProviderSTTKey` z.enum em `src/config/providers.config.ts`.

### NÃO modificar (out of scope)

- `STTService` (`stt.service.ts`) — Story 14.4
- `TranscricaoService` (`transcricao.service.ts`) — Story 14.4
- `TranscriptionProcessor` — Story 14.4
- `LLMRouter` / `LLMModule` — Não relacionado
- `providers.config.json` — Não mudar default (Story 14.4)

### Testing Patterns

```typescript
// Mock Groq SDK
const mockGroq = {
  audio: {
    transcriptions: { create: jest.fn() },
  },
  models: { list: jest.fn() },
};
jest.mock('groq-sdk', () => ({
  __esModule: true,
  default: jest.fn(() => mockGroq),
}));

// Mock ConfigService
const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      GROQ_API_KEY: 'gsk_test_key',
      GROQ_WHISPER_MODEL: 'whisper-large-v3-turbo',
    };
    return config[key];
  }),
};

// Test cases obrigatórios:
describe('GroqWhisperProvider', () => {
  it('should return ProviderSTT.GROQ_WHISPER from getName()');
  it('should transcribe audio and return normalized TranscriptionResult');
  it('should calculate cost correctly for whisper-large-v3-turbo');
  it('should calculate cost correctly for whisper-large-v3');
  it('should calculate cost correctly for distil-whisper-large-v3-en');
  it('should enforce minimum 10s billing');
  it('should handle rate limit error (429)');
  it('should handle quota error (402)');
  it('should handle generic API error');
  it('should cleanup temp file after transcription');
  it('should cleanup temp file on error');
  it('should normalize language codes (pt-BR → pt)');
  it('should check availability via isAvailable()');
  it('should use default model when GROQ_WHISPER_MODEL not set');
  it('should calculate confidence from avg_logprob');
});
```

### Project Structure Notes

```
Arquivos NOVOS:
├── ressoa-backend/src/modules/stt/providers/groq-whisper.provider.ts
├── ressoa-backend/src/modules/stt/providers/groq-whisper.provider.spec.ts

Arquivos MODIFICADOS:
├── ressoa-backend/prisma/schema.prisma                        (enum ProviderSTT)
├── ressoa-backend/src/config/providers.config.ts              (ProviderSTTKey)
├── ressoa-backend/src/config/providers.config.spec.ts         (testes)
├── ressoa-backend/src/modules/stt/stt.module.ts               (DI token)
├── ressoa-backend/src/modules/stt/services/stt-router.service.ts      (providerMap)
├── ressoa-backend/src/modules/stt/services/stt-router.service.spec.ts (mock)
├── ressoa-backend/.env.example                                (GROQ vars)
├── ressoa-backend/providers.config.example.json               (GROQ_WHISPER example)
├── ressoa-backend/package.json                                (groq-sdk)
```

### Previous Story Intelligence (14.1)

**Padrões estabelecidos:**
- `ProvidersConfigService` é `@Global()` — disponível em todos os módulos
- Provider map pattern: string key → STTProvider instance via `@Inject` tokens
- Timer cleanup com `clearTimeout` no finally block (code review fix)
- File watcher com `existsSync` guard antes de iniciar
- Testes: `describe/it` em inglês, `jest.fn()` para mocks

**Code review fixes da Story 14.1 (NÃO repetir erros):**
- Timer leak — always `clearTimeout` no finally
- Missing `existsSync` guard antes de `fs.watch()`

### References

- [Source: src/modules/stt/interfaces/stt-provider.interface.ts] — Interface STTProvider, TranscriptionResult, TranscribeOptions
- [Source: src/modules/stt/providers/whisper.provider.ts] — WhisperProvider (modelo a copiar)
- [Source: src/modules/stt/services/stt-router.service.ts] — STTRouterService com providerMap
- [Source: src/modules/stt/stt.module.ts] — SttModule com DI tokens
- [Source: src/config/providers.config.ts] — Zod schema, ProviderSTTKey, DEFAULT_PROVIDERS_CONFIG
- [Source: prisma/schema.prisma:58-63] — Enum ProviderSTT
- [Source: epic-14-provider-routing-configuravel.md] — Epic completo, business context, ROI
- [Source: 14-1-camada-roteamento-configuravel.md] — Previous story, patterns, code review

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Shadow database issue prevented `prisma migrate dev` — created manual migration SQL instead
- Pre-existing build errors in `llm-router.service.ts` (TS1272 import type) — NOT related to this story
- Test mock leak between `distil-whisper-large-v3-en` and `min billing` tests — fixed by resetting `mockConfigService.get` in `beforeEach`

### Completion Notes List

- GroqWhisperProvider implemented following WhisperProvider pattern exactly
- All 3 Groq models supported via `GROQ_WHISPER_MODEL` env var with cost map
- Confidence calculation uses `avg_logprob` → `Math.max(0, Math.min(1, 1 + avgLogprob))` conversion
- Minimum 10s billing enforced per Groq API specs
- Provider registered in SttModule (DI token) and STTRouterService (providerMap)
- 20 unit tests for GroqWhisperProvider, 12 for STTRouterService (1 new), 14 for providers.config — 46 total, all passing
- Coverage: 95.16% statements, 100% functions, 94.82% lines (AC13 ≥85% satisfied)
- No out-of-scope files modified (STTService, TranscricaoService, etc.)

### Change Log

- 2026-02-14: Story 14.2 implementation complete — GroqWhisperProvider with 3-model support, cost tracking, structured logs, health check, DI registration, 46/46 tests passing
- 2026-02-14: **Code Review (AI)** — 6 issues found (1 HIGH, 2 MEDIUM, 2 LOW). Auto-fixed:
  - [H1] Added 300s timeout to `transcribe()` (AC6 defense-in-depth, `Promise.race` + `clearTimeout`)
  - [M1] Updated SttModule docstring to include GROQ_WHISPER_PROVIDER and STTRouterService
  - [M3] Changed `isAvailable()` from `models.list()` to `models.retrieve(model)` for lighter health check
  - [L1] Added test for unknown model cost fallback
  - Added timeout error handling test
  - 22 unit tests for GroqWhisperProvider (was 20), all passing. 60 total tests passing.

### File List

New files:
- ressoa-backend/src/modules/stt/providers/groq-whisper.provider.ts
- ressoa-backend/src/modules/stt/providers/groq-whisper.provider.spec.ts
- ressoa-backend/prisma/migrations/20260214200000_add_groq_whisper_provider/migration.sql

Modified files:
- ressoa-backend/prisma/schema.prisma (enum ProviderSTT + GROQ_WHISPER)
- ressoa-backend/src/config/providers.config.ts (ProviderSTTKey + GROQ_WHISPER)
- ressoa-backend/src/config/providers.config.spec.ts (validSTT array + GROQ_WHISPER)
- ressoa-backend/src/modules/stt/stt.module.ts (import + GROQ_WHISPER_PROVIDER DI token)
- ressoa-backend/src/modules/stt/services/stt-router.service.ts (inject + providerMap entry)
- ressoa-backend/src/modules/stt/services/stt-router.service.spec.ts (mock + GROQ_WHISPER routing test)
- ressoa-backend/.env.example (GROQ_API_KEY, GROQ_WHISPER_MODEL)
- ressoa-backend/providers.config.example.json (GROQ_WHISPER as primary example)
- ressoa-backend/package.json (groq-sdk ^0.37.0)
- ressoa-backend/package-lock.json (groq-sdk dependencies)
