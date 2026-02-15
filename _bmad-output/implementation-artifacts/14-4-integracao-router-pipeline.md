# Story 14.4: Integrar Router com Pipeline de Analise

Status: done

## Story

As a pipeline de analise,
I want usar o ProviderRouter para selecionar providers dinamicamente,
so that cada prompt use o provider configurado em `providers.config.json` sem code changes.

## Acceptance Criteria

1. **AC1:** `AnaliseService` refatorado para usar `LLMRouterService.generateWithFallback(analysisType)` em vez de `claudeProvider`/`gptProvider` direto
2. **AC2:** `STTService` refatorado para delegar para `STTRouterService.transcribeWithFallback()` em vez de implementar failover proprio
3. **AC3:** Config padrao criado em `ressoa-backend/providers.config.json` com Groq + Gemini como primarios
4. **AC4:** Se provider primario falhar (timeout, API error), sistema automaticamente tenta fallback (ja implementado nos routers)
5. **AC5:** Logs mostram: provider tentado, fallback usado (se aplicavel), custo por prompt
6. **AC6:** Analise completa (5 prompts) registra breakdown de custos por provider em campos dedicados no Prisma schema
7. **AC7:** Testes unitarios atualizados: mock LLMRouterService/STTRouterService em vez de providers diretos
8. **AC8:** Fallback testado: forcar falha de provider primario e validar que fallback e usado
9. **AC9:** Compatibilidade backward: providers antigos (OpenAI Whisper + Claude) continuam funcionando via config
10. **AC10:** Documentacao atualizada: README com instrucoes de configuracao de providers

## Tasks / Subtasks

- [x] Task 1: Refatorar `AnaliseService` para usar `LLMRouterService` (AC: #1, #5, #6)
  - [x] 1.1 Remover `@Inject('CLAUDE_PROVIDER')` e `@Inject('GPT_PROVIDER')` do constructor
  - [x] 1.2 Injetar `LLMRouterService` no constructor
  - [x] 1.3 Refatorar `executePrompt()` para usar `llmRouterService.generateWithFallback(analysisType, prompt, options)` em vez de `provider.generate()`
  - [x] 1.4 Mapear nomes de prompt para `LLMAnalysisType`:
    - `prompt-cobertura` → `analise_cobertura`
    - `prompt-qualitativa` → `analise_qualitativa`
    - `prompt-relatorio` → `relatorio`
    - `prompt-exercicios` → `exercicios`
    - `prompt-alertas` → `alertas`
  - [x] 1.5 Registrar breakdown de custos por prompt (provider usado + custo) no objeto `Analise`
  - [x] 1.6 Remover imports de `ClaudeProvider` e `GPTProvider`
- [x] Task 2: Adicionar campos de custo por provider no Prisma schema (AC: #6)
  - [x] 2.1 Adicionar campos na model `Analise`:
    - `provider_stt String?`
    - `custo_stt_usd Float?`
    - `provider_llm_cobertura String?`
    - `custo_llm_cobertura_usd Float?`
    - `provider_llm_qualitativa String?`
    - `custo_llm_qualitativa_usd Float?`
    - `provider_llm_relatorio String?`
    - `custo_llm_relatorio_usd Float?`
    - `provider_llm_exercicios String?`
    - `custo_llm_exercicios_usd Float?`
    - `provider_llm_alertas String?`
    - `custo_llm_alertas_usd Float?`
  - [x] 2.2 Gerar e aplicar migration Prisma
  - [x] 2.3 Todos campos opcionais (nullable) para backward compat com analises existentes
- [x] Task 3: Refatorar `STTService` para delegar a `STTRouterService` (AC: #2, #4)
  - [x] 3.1 Remover `@Inject('WHISPER_PROVIDER')` e `@Inject('GOOGLE_PROVIDER')` do constructor
  - [x] 3.2 Remover `ConfigService` injection e logica de provider selection
  - [x] 3.3 Injetar `STTRouterService`
  - [x] 3.4 Simplificar `transcribe()` para delegar a `sttRouterService.transcribeWithFallback(audioBuffer, options)`
  - [x] 3.5 Remover metodos privados `transcribeWithTimeout()` e `timeout()` (ja existem no router)
  - [x] 3.6 Manter interface publica `transcribe(audioBuffer, options)` inalterada para nao quebrar `TranscricaoService`
- [x] Task 4: Corrigir imports de modulos (AC: #1, #2)
  - [x] 4.1 `AnaliseModule`: garantir que importa `LlmModule` (que exporta `LLMRouterService`)
  - [x] 4.2 `SttModule`: garantir que `STTRouterService` esta disponivel para `STTService`
  - [x] 4.3 Verificar que `ProvidersConfigModule` esta importado em `LlmModule` e `SttModule`
- [x] Task 5: Criar `providers.config.json` otimizado (AC: #3)
  - [x] 5.1 Criar arquivo em `ressoa-backend/providers.config.json` com Groq + Gemini como primarios
- [x] Task 6: Atualizar testes unitarios (AC: #7, #8)
  - [x] 6.1 `analise.service.spec.ts`: substituir mocks de `CLAUDE_PROVIDER`/`GPT_PROVIDER` por mock de `LLMRouterService`
  - [x] 6.2 `stt.service.spec.ts`: substituir mocks de `WHISPER_PROVIDER`/`GOOGLE_PROVIDER` por mock de `STTRouterService`
  - [x] 6.3 Adicionar teste de fallback: mock `generateWithFallback` para simular fallback
  - [x] 6.4 Validar que custos por provider sao salvos corretamente no Analise
- [x] Task 7: Atualizar README (AC: #10)
  - [x] 7.1 Adicionar secao de configuracao de providers em README.md

## Dev Notes

### Refatoracao do AnaliseService - Abordagem Exata

O `AnaliseService` (679 linhas) e o orquestrador do pipeline de 5 prompts. A refatoracao e cirurgica:

**ANTES (hardcoded):**
```typescript
constructor(
  @Inject('CLAUDE_PROVIDER') private readonly claudeProvider: ClaudeProvider,
  @Inject('GPT_PROVIDER') private readonly gptProvider: GPTProvider,
) {}

// Prompt 1,2,3,5 usa Claude direto:
await this.executePrompt('prompt-cobertura', contexto, this.claudeProvider);
// Prompt 4 usa GPT direto:
await this.executePrompt('prompt-exercicios', contexto, this.gptProvider);
```

**DEPOIS (router-driven):**
```typescript
constructor(
  private readonly llmRouterService: LLMRouterService,
) {}

// executePrompt agora recebe analysisType em vez de provider:
private async executePrompt(
  nomePrompt: string,
  contexto: any,
  analysisType: LLMAnalysisType, // 'analise_cobertura' | 'analise_qualitativa' | ...
): Promise<{ output: any; custo: number; versao: string; provider: string }> {
  const prompt = await this.promptService.getActivePrompt(nomePrompt);
  const promptRendered = await this.promptService.renderPrompt(prompt, contexto);

  // Router ja implementa fallback + timeout + logging
  const result = await this.llmRouterService.generateWithFallback(
    analysisType,
    promptRendered,
    { temperature: 0.7, maxTokens: 4000 },
  );

  return {
    output: this.parseOutput(result.texto),
    custo: result.custo_usd,
    versao: prompt.versao,
    provider: result.provider, // Enum string do provider usado
  };
}
```

**Chamadas no pipeline (5 linhas mudam):**
```typescript
// Prompt 1: Cobertura
const { output: coberturaOutput, custo: custo1, versao: versao1, provider: prov1 } =
  await this.executePrompt('prompt-cobertura', contexto, 'analise_cobertura');

// Prompt 2: Qualitativa
const { output: qualitativaOutput, custo: custo2, versao: versao2, provider: prov2 } =
  await this.executePrompt('prompt-qualitativa', contexto, 'analise_qualitativa');

// Prompt 3: Relatorio
const { output: relatorioOutput, custo: custo3, versao: versao3, provider: prov3 } =
  await this.executePrompt('prompt-relatorio', contexto, 'relatorio');

// Prompt 4: Exercicios (antes GPT direto, agora config-driven)
const { output: exerciciosOutput, custo: custo4, versao: versao4, provider: prov4 } =
  await this.executePrompt('prompt-exercicios', contexto, 'exercicios');

// Prompt 5: Alertas
const { output: alertasOutput, custo: custo5, versao: versao5, provider: prov5 } =
  await this.executePrompt('prompt-alertas', contexto, 'alertas');
```

**Salvar breakdown no Prisma:**
```typescript
const novaAnalise = await tx.analise.create({
  data: {
    aula_id: aulaId,
    // ... campos existentes ...
    custo_total_usd: custoTotal,
    // NOVOS campos de breakdown:
    provider_llm_cobertura: prov1,
    custo_llm_cobertura_usd: custo1,
    provider_llm_qualitativa: prov2,
    custo_llm_qualitativa_usd: custo2,
    provider_llm_relatorio: prov3,
    custo_llm_relatorio_usd: custo3,
    provider_llm_exercicios: prov4,
    custo_llm_exercicios_usd: custo4,
    provider_llm_alertas: prov5,
    custo_llm_alertas_usd: custo5,
  },
});
```

### Refatoracao do STTService - Simplificacao

O `STTService` (150 linhas) implementa failover proprio que agora e redundante com `STTRouterService`.

**ANTES (failover manual):**
```typescript
constructor(
  @Inject('WHISPER_PROVIDER') private whisperProvider: STTProvider,
  @Inject('GOOGLE_PROVIDER') private googleProvider: STTProvider,
  private configService: ConfigService,
) {
  // Logica manual de provider selection via env vars
  const primary = this.configService.get<string>('STT_PRIMARY_PROVIDER') || 'WHISPER';
  // ...
}

async transcribe(audioBuffer: Buffer, options?: TranscribeOptions): Promise<TranscriptionResult> {
  // 60+ linhas de try/catch manual com timeout
}
```

**DEPOIS (delegacao ao router):**
```typescript
constructor(
  private readonly sttRouterService: STTRouterService,
) {}

async transcribe(
  audioBuffer: Buffer,
  options?: TranscribeOptions,
): Promise<TranscriptionResult> {
  return this.sttRouterService.transcribeWithFallback(audioBuffer, options);
}
```

**IMPORTANTE:** A interface publica `transcribe(audioBuffer, options)` NAO muda. O `TranscricaoService` que chama `sttService.transcribe()` NAO precisa ser modificado.

### LLMRouterService API (ja implementado em Story 14.1)

```typescript
// src/modules/llm/services/llm-router.service.ts
class LLMRouterService {
  // Provider map: CLAUDE_SONNET, GPT4_MINI, GEMINI_FLASH
  constructor(
    @Inject('CLAUDE_PROVIDER') claudeProvider,
    @Inject('GPT_PROVIDER') gptProvider,
    @Inject('GEMINI_PROVIDER') geminiProvider,
    configService: ProvidersConfigService,
  ) {}

  // Metodo principal - usa config para selecionar provider
  async generateWithFallback(
    analysisType: LLMAnalysisType, // 'analise_cobertura' | 'analise_qualitativa' | ...
    prompt: string,
    options?: GenerateOptions,
  ): Promise<LLMResult> // Retorna: { texto, provider, modelo, tokens_input, tokens_output, custo_usd, tempo_processamento_ms }
}
```

### STTRouterService API (ja implementado em Story 14.1)

```typescript
// src/modules/stt/services/stt-router.service.ts
class STTRouterService {
  // Provider map: WHISPER, GOOGLE, GROQ_WHISPER
  async transcribeWithFallback(
    audioBuffer: Buffer,
    options?: TranscribeOptions,
  ): Promise<TranscriptionResult> // Retorna: { texto, provider, idioma, duracao_segundos, confianca, custo_usd, tempo_processamento_ms }
}
```

### LLMResult Interface (retorno do router)

```typescript
interface LLMResult {
  texto: string;         // Resposta do LLM
  provider: ProviderLLM; // Enum: 'Claude' | 'GPT' | 'Gemini'
  modelo: string;        // Ex: 'gemini-2.0-flash'
  tokens_input: number;
  tokens_output: number;
  custo_usd: number;
  tempo_processamento_ms: number;
  metadata?: Record<string, any>;
}
```

### Config Padrao (providers.config.json)

```json
{
  "version": "1.0.0",
  "stt": {
    "primary": "GROQ_WHISPER",
    "fallback": "WHISPER"
  },
  "llm": {
    "analise_cobertura": { "primary": "GEMINI_FLASH", "fallback": "CLAUDE_SONNET" },
    "analise_qualitativa": { "primary": "GEMINI_FLASH", "fallback": "CLAUDE_SONNET" },
    "relatorio": { "primary": "GEMINI_FLASH", "fallback": "GPT4_MINI" },
    "exercicios": { "primary": "GPT4_MINI", "fallback": "GEMINI_FLASH" },
    "alertas": { "primary": "GEMINI_FLASH", "fallback": "CLAUDE_SONNET" }
  }
}
```

**IMPORTANTE:** O `providers.config.example.json` ja existe com defaults conservadores (Claude como primario). O novo `providers.config.json` deve usar os providers otimizados (Gemini/Groq).

### Prisma Migration - Campos Novos na Analise

Todos campos devem ser `nullable` (`?` em Prisma) para backward compat com analises existentes:

```prisma
model Analise {
  // ... campos existentes ...

  // Provider cost breakdown (Story 14.4)
  provider_stt              String?
  custo_stt_usd             Float?
  provider_llm_cobertura    String?
  custo_llm_cobertura_usd   Float?
  provider_llm_qualitativa  String?
  custo_llm_qualitativa_usd Float?
  provider_llm_relatorio    String?
  custo_llm_relatorio_usd   Float?
  provider_llm_exercicios   String?
  custo_llm_exercicios_usd  Float?
  provider_llm_alertas      String?
  custo_llm_alertas_usd     Float?
}
```

**Nota sobre custo STT:** O `STTService` e chamado pelo `TranscricaoService`, NAO pelo `AnaliseService`. Os campos `provider_stt` e `custo_stt_usd` devem ser preenchidos pelo `TranscricaoService` quando ele chama `sttService.transcribe()`. O resultado de `TranscriptionResult` ja contem `provider` e `custo_usd`. Alternativa: preencher estes campos no `AnaliseService` buscando dados da transcricao existente. **Decisao recomendada:** Preencher no AnaliseService a partir do `aula.transcricao` ja carregado (se tiver campos de provider/custo no Transcricao model) OU deixar null por enquanto e preencher em story futura.

### Mapeamento prompt → LLMAnalysisType

| Nome do Prompt | LLMAnalysisType | Provider Atual | Provider Otimizado |
|---|---|---|---|
| `prompt-cobertura` | `analise_cobertura` | Claude Sonnet | Gemini Flash |
| `prompt-qualitativa` | `analise_qualitativa` | Claude Sonnet | Gemini Flash |
| `prompt-relatorio` | `relatorio` | Claude Sonnet | Gemini Flash |
| `prompt-exercicios` | `exercicios` | GPT-4 mini | GPT-4 mini |
| `prompt-alertas` | `alertas` | Claude Sonnet | Gemini Flash |

### Project Structure Notes

**Arquivos a modificar:**
```
ressoa-backend/
├── prisma/schema.prisma              # Adicionar campos de custo por provider
├── src/modules/
│   ├── analise/
│   │   ├── services/
│   │   │   ├── analise.service.ts     # PRINCIPAL: refatorar para usar LLMRouterService
│   │   │   └── analise.service.spec.ts # Atualizar mocks
│   │   └── analise.module.ts          # Verificar imports
│   └── stt/
│       ├── stt.service.ts             # Simplificar para delegar a STTRouterService
│       ├── stt.service.spec.ts        # Atualizar mocks
│       └── stt.module.ts              # Verificar imports
├── providers.config.json              # NOVO: config otimizado
└── README.md                          # Secao de configuracao
```

**Arquivos que NAO devem ser modificados:**
- `src/modules/llm/services/llm-router.service.ts` - Ja implementado (Story 14.1)
- `src/modules/stt/services/stt-router.service.ts` - Ja implementado (Story 14.1)
- `src/modules/llm/providers/*.ts` - Providers ja implementados (Stories 14.1-14.3)
- `src/modules/stt/providers/*.ts` - Providers ja implementados
- `src/modules/providers-config/*` - Config service ja implementado (Story 14.1)
- `src/modules/stt/workers/transcription.processor.ts` - Chama TranscricaoService, NAO STTService direto

### Testing Strategy

**Mock pattern para LLMRouterService:**
```typescript
const mockLLMRouterService = {
  generateWithFallback: jest.fn().mockResolvedValue({
    texto: '{"cobertura": "dados"}',
    provider: 'Gemini',
    modelo: 'gemini-2.0-flash',
    tokens_input: 15000,
    tokens_output: 2000,
    custo_usd: 0.0023,
    tempo_processamento_ms: 4200,
  }),
};

// No TestingModule:
{ provide: LLMRouterService, useValue: mockLLMRouterService }
```

**Mock pattern para STTRouterService:**
```typescript
const mockSTTRouterService = {
  transcribeWithFallback: jest.fn().mockResolvedValue({
    texto: 'transcricao do audio',
    provider: 'Groq',
    idioma: 'pt',
    duracao_segundos: 3000,
    confianca: 0.95,
    custo_usd: 0.033,
    tempo_processamento_ms: 8500,
  }),
};

// No TestingModule:
{ provide: STTRouterService, useValue: mockSTTRouterService }
```

**Testes criticos:**
1. Pipeline completo: 5 prompts executados com `generateWithFallback` chamado 5x com analysisTypes corretos
2. Breakdown de custos: verificar que `provider_llm_*` e `custo_llm_*_usd` sao salvos no `analise.create()`
3. Fallback: mock `generateWithFallback` para lancar erro → verificar que erro propaga (fallback e responsabilidade do router)
4. STTService delega: `transcribe()` chama `sttRouterService.transcribeWithFallback()` exatamente 1x

### Previous Story Intelligence (14.3)

**Learnings from Story 14.3 (Gemini Provider):**
- SDK correto: `@google/genai` (NAO `@google/generative-ai` que e deprecated)
- `isAvailable()` deve usar chamada leve (`models.get()`) em vez de generate
- Safety settings: `BLOCK_ONLY_HIGH` para todas 4 categorias
- Coverage target: 95%+ branch (atingido 95.12%)
- Code review encontrou 4 issues - todos auto-fixed
- 36 testes no modulo LLM total passando

**Learnings from Story 14.1 (Router Layer):**
- ProvidersConfigModule e `@Global()` - nao precisa importar explicitamente
- Hot-reload do config funciona via `fs.watch()` com debounce 1s
- Timeout de 300s (5min) configurado nos routers
- 48 testes no modulo de config passando

**Patterns de codigo estabelecidos:**
- Providers implementam interface `LLMProvider` / `STTProvider`
- DI tokens: `'CLAUDE_PROVIDER'`, `'GPT_PROVIDER'`, `'GEMINI_PROVIDER'`, `'WHISPER_PROVIDER'`, `'GOOGLE_PROVIDER'`, `'GROQ_WHISPER_PROVIDER'`
- `LLMResult` retorna `provider` como enum string (ex: `'Claude'`, `'GPT'`, `'Gemini'`)
- `TranscriptionResult` retorna `provider` como enum string

### Multi-Tenancy

**NENHUM impacto em multi-tenancy.** Esta story refatora internals de provider selection. Todas queries Prisma com `escola_id` permanecem inalteradas. O `AnaliseService.findByAulaId()`, `findOne()`, e `update()` NAO sao afetados.

### References

- [Source: ressoa-backend/src/modules/analise/services/analise.service.ts] - AnaliseService atual (679 linhas)
- [Source: ressoa-backend/src/modules/stt/stt.service.ts] - STTService atual (150 linhas)
- [Source: ressoa-backend/src/modules/llm/services/llm-router.service.ts] - LLMRouterService (Story 14.1)
- [Source: ressoa-backend/src/modules/stt/services/stt-router.service.ts] - STTRouterService (Story 14.1)
- [Source: ressoa-backend/src/modules/llm/interfaces/llm-provider.interface.ts] - LLMProvider/LLMResult interfaces
- [Source: ressoa-backend/src/modules/stt/interfaces/stt-provider.interface.ts] - STTProvider/TranscriptionResult interfaces
- [Source: ressoa-backend/src/config/providers.config.ts] - Zod schema + LLMAnalysisType type
- [Source: ressoa-backend/src/modules/providers-config/providers-config.service.ts] - Config hot-reload service
- [Source: prisma/schema.prisma] - Analise model (campos a adicionar)
- [Source: _bmad-output/planning-artifacts/architecture.md] - Decisoes arquiteturais
- [Source: _bmad-output/implementation-artifacts/14-1-camada-roteamento-configuravel.md] - Story 14.1 (router layer)
- [Source: _bmad-output/implementation-artifacts/14-3-gemini-flash-provider-llm.md] - Story 14.3 (Gemini provider)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Pre-existing test failures in: auth.service.spec.ts, admin.service.spec.ts, email.service.spec.ts, turmas.service.spec.ts, analise.controller.spec.ts (verified NOT caused by this story)
- Prisma migration shadow database issue (P3006) - workaround: manual migration file creation + `prisma migrate resolve`

### Completion Notes List

- AnaliseService refactored: removed direct `@Inject('CLAUDE_PROVIDER')` and `@Inject('GPT_PROVIDER')`, now uses `LLMRouterService.generateWithFallback()` with `LLMAnalysisType` for each of 5 prompts
- `executePrompt()` signature changed from `(name, ctx, provider: LLMProvider)` to `(name, ctx, analysisType: LLMAnalysisType)`, now returns `provider` string in result
- Provider cost breakdown saved per-prompt in Analise entity (12 new nullable fields)
- STTService simplified from ~150 lines to ~45 lines - pure delegation to STTRouterService
- `providers.config.json` updated to optimized config: Groq Whisper (STT) + Gemini Flash (LLM primary) + cost-effective fallbacks
- 31 unit tests for AnaliseService (all pass) - mocks updated from CLAUDE_PROVIDER/GPT_PROVIDER to LLMRouterService
- 5 unit tests for STTService (all pass) - new test file created with STTRouterService mock
- 202 tests across 13 related suites pass (0 regressions from this story)
- README updated with provider configuration documentation

### File List

- `ressoa-backend/prisma/schema.prisma` - Added 12 provider cost breakdown fields to Analise model
- `ressoa-backend/prisma/migrations/20260214300000_add_provider_cost_breakdown/migration.sql` - NEW: Migration adding cost fields
- `ressoa-backend/src/modules/analise/services/analise.service.ts` - Refactored to use LLMRouterService
- `ressoa-backend/src/modules/analise/services/analise.service.spec.ts` - Updated mocks to LLMRouterService
- `ressoa-backend/src/modules/analise/analise.module.ts` - Updated comment (LLMModule provides LLMRouterService)
- `ressoa-backend/src/modules/stt/stt.service.ts` - Simplified to delegate to STTRouterService
- `ressoa-backend/src/modules/stt/stt.service.spec.ts` - NEW: Unit tests for simplified STTService
- `ressoa-backend/providers.config.json` - Updated to optimized provider config (Groq+Gemini primary)
- `ressoa-backend/README.md` - Added provider configuration documentation section

## Senior Developer Review (AI)

**Reviewer:** Luisneto98 (via Claude Opus 4.6)
**Date:** 2026-02-14
**Outcome:** APPROVED (3 MEDIUM + 1 LOW → all MEDIUM auto-fixed)

### Findings

| # | Severity | Description | Status |
|---|----------|-------------|--------|
| MEDIUM-1 | MEDIUM | Stale JSDoc on `executePrompt()` referenced old `provider: LLMProvider` param | FIXED |
| MEDIUM-2 | MEDIUM | Module JSDoc had hardcoded provider names (Claude Sonnet, GPT-4 mini, Claude Haiku) | FIXED |
| MEDIUM-3 | MEDIUM | `mockAulaCompleta.turma` missing `tipo_ensino`, `curriculo_tipo`, `contexto_pedagogico` | FIXED |
| LOW-1 | LOW | `provider_stt`/`custo_stt_usd` fields exist in schema but never populated | DEFERRED (by design) |

### AC Validation

All 10 ACs verified as implemented. All tasks verified as done.

### Test Results

66 tests pass (31 AnaliseService + 5 STTService + 30 monitoring) - 0 regressions.

## Change Log

- 2026-02-14: Story 14.4 implemented - Integrated LLMRouterService and STTRouterService with analysis pipeline and STT service. Added provider cost breakdown fields to Prisma schema. Updated tests and documentation.
- 2026-02-14: Code review (AI) - Fixed 3 MEDIUM issues: stale JSDoc in executePrompt, stale module JSDoc, incomplete mock data. All tests pass.
