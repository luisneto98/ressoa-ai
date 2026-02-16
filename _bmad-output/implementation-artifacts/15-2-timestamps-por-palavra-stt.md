# Story 15.2: Timestamps por Palavra no STT

Status: done

## Story

As a sistema de transcrição,
I want receber timestamps no nível de palavra (não apenas segmentos),
so that a etapa de diarização (Story 15.3) tenha granularidade temporal precisa para identificar turnos de fala professor/aluno.

## Acceptance Criteria

1. **AC1:** Whisper provider solicita `timestamp_granularities: ['word', 'segment']` na chamada de transcrição
2. **AC2:** Groq Whisper provider solicita `timestamp_granularities: ['word', 'segment']` na chamada de transcrição
3. **AC3:** `TranscriptionResult` inclui campo `words` com array de `{ word, start, end }` por palavra
4. **AC4:** Array `words` corretamente populado por ambos os providers (Whisper e Groq)
5. **AC5:** Campo `texto` continua sendo preenchido normalmente (compatibilidade retroativa)
6. **AC6:** Testes unitários verificam parsing correto do array `words`
7. **AC7:** Google provider não é afetado (não suporta word-level — ignora graciosamente)

## Tasks / Subtasks

- [x] Task 1 — Adicionar `TranscriptionWord` interface e campo `words` ao `TranscriptionResult` (AC: #3)
  - [x] 1.1 Criar interface `TranscriptionWord { word: string; start: number; end: number }` em `stt-provider.interface.ts`
  - [x] 1.2 Adicionar campo `words?: TranscriptionWord[]` ao `TranscriptionResult`
- [x] Task 2 — Whisper provider: ativar word-level timestamps (AC: #1, #4, #5)
  - [x] 2.1 Adicionar `timestamp_granularities: ['word', 'segment']` ao `openai.audio.transcriptions.create()` (linha ~85-91)
  - [x] 2.2 Extrair `words` do response — mapear `response.words[]` (top-level quando `timestamp_granularities` ativo) para `TranscriptionWord[]`
  - [x] 2.3 Adicionar `word_count: words.length` ao `metadata`
  - [x] 2.4 Testes unitários: response com words, response sem words (backward compat), validação de mapeamento word→TranscriptionWord
- [x] Task 3 — Groq Whisper provider: ativar word-level timestamps (AC: #2, #4, #5)
  - [x] 3.1 Adicionar `timestamp_granularities: ['word', 'segment']` ao `groq.audio.transcriptions.create()` (linha ~60-67)
  - [x] 3.2 Extrair `words` do response — mapear `(response as any).words[]` para `TranscriptionWord[]`
  - [x] 3.3 Adicionar `word_count: words.length` ao `metadata`
  - [x] 3.4 Testes unitários: response com words, response sem words (backward compat)
- [x] Task 4 — Google provider: garantir graceful ignore (AC: #7)
  - [x] 4.1 Verificar que Google provider não quebra — `words` fica `undefined` no result (já é o comportamento padrão)
  - [x] 4.2 Teste unitário confirmando que result.words é undefined para Google provider
- [x] Task 5 — STT Router: verificar propagação (AC: #3)
  - [x] 5.1 Confirmar que `transcribeWithFallback` não altera/descarta `words` do result
  - [x] 5.2 Teste unitário: result com `words` é passado intacto pelo router
- [x] Task 6 — TranscricaoService: salvar words no metadata (AC: #3, #4)
  - [x] 6.1 Adicionar `words` e `word_count` ao `metadata_json` salvo na `Transcricao`
  - [x] 6.2 Teste unitário: metadata_json inclui words array quando disponível
- [x] Task 7 — Testes de não-regressão (AC: #5, #6)
  - [x] 7.1 Executar suite completa de testes STT — 0 regressões
  - [x] 7.2 Novos testes: words parsing para Whisper e Groq

## Dev Notes

### Contexto do Épico

Esta é a **segunda story** do Epic 15 (Transcrição Enriquecida com Diarização). A Story 15.1 (prompt pedagógico) já foi implementada. Esta story é **independente** da 15.1 mas é **pré-requisito** para a Story 15.3 (diarização via LLM) — o `words[]` array será o input para o `DiarizationService`.

### Pipeline do Épico (dependências)

```
US-015.1 (STT Prompt) ✅ DONE ──┐
                                 ├──→ US-015.3 (LLM Diarization) → US-015.5 (Pipeline) → US-015.6 (Prompts)
US-015.2 (Word Timestamps) ◀── ESTA STORY
                                 │
US-015.4 (Provider Config) ──────┘
```

### Comportamento do `timestamp_granularities` no Whisper/Groq

O parâmetro `timestamp_granularities` é suportado por OpenAI Whisper e Groq. **REQUER** `response_format: 'verbose_json'` (já ativo em ambos os providers).

**OpenAI Whisper API:**
```typescript
const response = await this.openai.audio.transcriptions.create({
  file: fs.createReadStream(tempFilePath),
  model: 'whisper-1',
  language: idioma,
  response_format: 'verbose_json', // ✅ Já ativo
  ...(options?.prompt && { prompt: options.prompt }),
  timestamp_granularities: ['word', 'segment'], // ← NOVO
});
```

Quando `timestamp_granularities` inclui `'word'`, o response contém um array `words` **no nível top-level** (não dentro de segments):
```json
{
  "text": "Texto completo...",
  "language": "pt",
  "duration": 123.45,
  "segments": [ ... ],
  "words": [
    { "word": "Vamos", "start": 0.0, "end": 0.32 },
    { "word": "abrir", "start": 0.32, "end": 0.56 },
    { "word": "o", "start": 0.56, "end": 0.64 },
    { "word": "livro", "start": 0.64, "end": 0.98 }
  ]
}
```

**Groq Whisper API (OpenAI-compatível):**
Mesma interface — `timestamp_granularities: ['word', 'segment']` retorna `words[]` top-level no response. Groq usa modelos `whisper-large-v3` e `whisper-large-v3-turbo`.

### Código Atual dos Providers (referência exata)

**Whisper provider — chamada API (whisper.provider.ts:85-91):**
```typescript
const response = await this.openai.audio.transcriptions.create({
  file: fs.createReadStream(tempFilePath),
  model: 'whisper-1',
  language: idioma,
  response_format: 'verbose_json',
  ...(options?.prompt && { prompt: options.prompt }),
});
```

**Whisper provider — construção do result (whisper.provider.ts:94-113):**
```typescript
const result: TranscriptionResult = {
  texto: response.text,
  provider: ProviderSTT.WHISPER,
  idioma: response.language || 'pt-BR',
  duracao_segundos: response.duration,
  confianca,
  custo_usd: custoUsd,
  tempo_processamento_ms: Date.now() - startTime,
  metadata: {
    model: 'whisper-1',
    segments_count: response.segments?.length || 0,
    ...(options?.prompt && { stt_prompt_used: true }),
  },
};
```

**Groq provider — chamada API (groq-whisper.provider.ts:60-67):**
```typescript
const response = await this.groq.audio.transcriptions.create({
  file: fs.createReadStream(tempFilePath),
  model,
  response_format: 'verbose_json',
  language: idioma,
  temperature: 0.0,
  ...(options?.prompt && { prompt: options.prompt }),
});
```

**Groq provider — construção do result (groq-whisper.provider.ts:78-102):**
```typescript
const result: TranscriptionResult = {
  texto: response.text,
  provider: ProviderSTT.GROQ_WHISPER,
  idioma: (response as any).language || 'pt-BR',
  duracao_segundos: duracaoSegundos,
  confianca,
  custo_usd: custoUsd,
  tempo_processamento_ms: Date.now() - startTime,
  metadata: {
    model,
    segments_count: segments.length,
    billed_seconds: billedSeconds,
    cost_per_hour: costPerHour,
    ...(options?.prompt && { stt_prompt_used: true }),
  },
};
```

### Implementação Específica por Task

**Task 1 — Interface (stt-provider.interface.ts):**
```typescript
// Adicionar ANTES de TranscriptionResult
export interface TranscriptionWord {
  /** Palavra transcrita */
  word: string;
  /** Início em segundos (ex: 0.32) */
  start: number;
  /** Fim em segundos (ex: 0.56) */
  end: number;
}

// Adicionar ao TranscriptionResult
export interface TranscriptionResult {
  // ... campos existentes (NÃO alterar) ...

  /** Word-level timestamps (optional — only when provider supports timestamp_granularities) */
  words?: TranscriptionWord[];
}
```

**Task 2 — Whisper provider (whisper.provider.ts):**
```typescript
// Chamada API — adicionar timestamp_granularities
const response = await this.openai.audio.transcriptions.create({
  file: fs.createReadStream(tempFilePath),
  model: 'whisper-1',
  language: idioma,
  response_format: 'verbose_json',
  ...(options?.prompt && { prompt: options.prompt }),
  timestamp_granularities: ['word', 'segment'], // ← NOVO
});

// Extrair words do response (top-level)
const words: TranscriptionWord[] | undefined = (response as any).words?.map(
  (w: any) => ({
    word: w.word,
    start: w.start,
    end: w.end,
  }),
);

// No result — adicionar words e word_count
const result: TranscriptionResult = {
  // ... campos existentes ...
  words,
  metadata: {
    model: 'whisper-1',
    segments_count: response.segments?.length || 0,
    ...(options?.prompt && { stt_prompt_used: true }),
    ...(words && { word_count: words.length }),
  },
};
```

**Task 3 — Groq provider (groq-whisper.provider.ts):**
Mesmo padrão do Whisper. Groq API é OpenAI-compatível, mesmos parâmetros.

**Task 6 — TranscricaoService (transcricao.service.ts:114-146):**
```typescript
// Salvar words no metadata_json
const transcricao = await this.prisma.transcricao.create({
  data: {
    aula_id: aulaId,
    texto: result.texto,
    provider: result.provider,
    idioma: result.idioma,
    duracao_segundos: result.duracao_segundos,
    confianca: result.confianca,
    custo_usd: result.custo_usd,
    tempo_processamento_ms: result.tempo_processamento_ms,
    metadata_json: {
      ...result.metadata,
      stt_prompt_key: promptKey,
      ...(result.words && { words: result.words, word_count: result.words.length }),
    },
  },
});
```

### Considerações de Performance

- Array `words` para aula de 45min (~5000-8000 palavras): ~200-300KB em JSON
- Armazenamento em `metadata_json` (JSONB) — PostgreSQL otimiza com compressão TOAST
- Sem necessidade de migração Prisma — `metadata_json` já é campo JSON flexível
- `words` é usado downstream APENAS pela Story 15.3 (DiarizationService) — vida útil curta

### Project Structure Notes

**Arquivos a MODIFICAR (existentes):**
| Arquivo | Mudança |
|---------|---------|
| `ressoa-backend/src/modules/stt/interfaces/stt-provider.interface.ts` | Adicionar `TranscriptionWord` interface + `words?: TranscriptionWord[]` ao `TranscriptionResult` |
| `ressoa-backend/src/modules/stt/providers/whisper.provider.ts` | Adicionar `timestamp_granularities`, extrair `words[]` do response |
| `ressoa-backend/src/modules/stt/providers/groq-whisper.provider.ts` | Adicionar `timestamp_granularities`, extrair `words[]` do response |
| `ressoa-backend/src/modules/stt/transcricao.service.ts` | Salvar `words` e `word_count` no `metadata_json` |

**Arquivos de TESTE a MODIFICAR/CRIAR:**
| Arquivo | Mudança |
|---------|---------|
| `ressoa-backend/src/modules/stt/providers/whisper.provider.spec.ts` | Adicionar testes: response com words, sem words, mapeamento correto |
| `ressoa-backend/src/modules/stt/providers/groq-whisper.provider.spec.ts` | Adicionar testes: response com words, sem words, mapeamento correto |
| `ressoa-backend/src/modules/stt/services/stt-router.service.spec.ts` | Teste: words propagado intacto pelo router |
| `ressoa-backend/src/modules/stt/transcricao.service.spec.ts` | Teste: metadata_json inclui words quando disponível |

**NÃO MODIFICAR:**
- Schema Prisma — Nenhuma migração necessária (`metadata_json` já é JSONB flexível)
- `.env` / `env.ts` — Nenhuma nova variável de ambiente
- Google provider — NÃO suporta `timestamp_granularities` (result.words fica undefined)
- STT prompts (`stt-prompts.ts`) — Sem mudanças
- Bull queue / worker — Sem mudanças

### Padrões Obrigatórios do Projeto

- **Multi-tenancy:** `TranscricaoService` já usa `escola_id` — manter padrão (ver project-context.md)
- **Logging:** Pino estruturado — logar `word_count` quando disponível
- **Testes:** ≥85% coverage, mocks com `jest.mock()`, reset em `beforeEach`
- **Provider pattern:** Interface `STTProvider` — apenas adicionar `words` ao `TranscriptionResult`
- **Backward compat:** Se provider não retorna `words`, campo fica `undefined`
- **Type casting:** Groq SDK types incompletos — usar `(response as any).words` (padrão já usado para `segments` e `duration`)

### Padrões Estabelecidos na Story 15.1

- **Spread condicional:** `...(options?.prompt && { prompt: options.prompt })` — usar mesmo padrão para words
- **Metadata enrichment:** Campos adicionados ao metadata com spread condicional
- **Mock pattern:** Mock do SDK inteiro via `jest.mock('openai')` / `jest.mock('groq-sdk')`
- **DI tokens:** `'WHISPER_PROVIDER'`, `'GROQ_WHISPER_PROVIDER'`
- **Temp files:** `/tmp/${crypto.randomUUID()}.mp3` com cleanup em `finally`

### Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Groq API não suporta `timestamp_granularities` | Documentação Groq confirma suporte (API compatível OpenAI). Se falhar, extrair words de `segments[].words[]` como fallback |
| Array words muito grande (aula longa) | ~300KB para 45min — TOAST compression do PostgreSQL + vida útil curta (usado apenas por Story 15.3) |
| TypeScript types do SDK não incluem `words` | Usar `(response as any).words` — mesmo padrão do `duration` e `segments` no Groq provider |
| API retorna words vazio em áudio ruim | Tratar `words?.length === 0` como `undefined` — Story 15.3 terá fallback para texto puro |

### References

- [Source: _bmad-output/implementation-artifacts/epics/epic-002-transcricao-enriquecida-diarizacao.md#US-015.2]
- [Source: _bmad-output/implementation-artifacts/15-1-prompt-contexto-pedagogico-stt.md] — Story anterior (patterns)
- [Source: ressoa-backend/src/modules/stt/interfaces/stt-provider.interface.ts] — Interface atual
- [Source: ressoa-backend/src/modules/stt/providers/whisper.provider.ts:85-113] — Chamada Whisper + result
- [Source: ressoa-backend/src/modules/stt/providers/groq-whisper.provider.ts:60-102] — Chamada Groq + result
- [Source: ressoa-backend/src/modules/stt/transcricao.service.ts:114-146] — Salvar transcrição
- [Source: ressoa-backend/src/modules/stt/services/stt-router.service.ts:34-99] — Router passthrough
- [Source: project-context.md] — Multi-tenancy rules, testing standards

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed existing Groq test `should call Groq API with correct parameters` which had hard-coded expected params without `timestamp_granularities`

### Completion Notes List

- **Task 1:** Added `TranscriptionWord` interface (`word`, `start`, `end` fields) and `words?: TranscriptionWord[]` field to `TranscriptionResult` in `stt-provider.interface.ts`
- **Task 2:** Whisper provider now sends `timestamp_granularities: ['word', 'segment']` in API call. Extracts `words` from top-level response using `(response as any).words`. Adds `word_count` to metadata when words available. Empty arrays treated as undefined (backward compat). 5 new tests added.
- **Task 3:** Groq Whisper provider — identical pattern to Whisper. Uses `as any` cast for Groq SDK type compatibility. 4 new tests added. Updated 1 existing test for new API parameter.
- **Task 4:** Google provider verified — no code changes needed. `words` stays `undefined` as Google doesn't support `timestamp_granularities`. Covered by STT Router test (undefined words propagation).
- **Task 5:** STT Router verified — `transcribeWithFallback` passes through `words` field intact. 2 new tests added (with words, without words).
- **Task 6:** TranscricaoService now saves `words` and `word_count` to `metadata_json` using spread conditional pattern. 2 new tests added.
- **Task 7:** Full STT test suite — 95/95 tests passing, 0 regressions. 13 new tests total across 4 spec files.

### File List

**Modified:**
- `ressoa-backend/src/modules/stt/interfaces/stt-provider.interface.ts` — Added `TranscriptionWord` interface + `words` field
- `ressoa-backend/src/modules/stt/providers/whisper.provider.ts` — Added `timestamp_granularities`, word extraction, `word_count` metadata
- `ressoa-backend/src/modules/stt/providers/groq-whisper.provider.ts` — Added `timestamp_granularities`, word extraction, `word_count` metadata
- `ressoa-backend/src/modules/stt/transcricao.service.ts` — Save `words` + `word_count` in `metadata_json`
- `ressoa-backend/src/modules/stt/providers/whisper.provider.spec.ts` — 5 new tests (words extraction, backward compat, mapping)
- `ressoa-backend/src/modules/stt/providers/groq-whisper.provider.spec.ts` — 4 new tests + 1 updated (timestamp_granularities param)
- `ressoa-backend/src/modules/stt/services/stt-router.service.spec.ts` — 2 new tests (words propagation)
- `ressoa-backend/src/modules/stt/transcricao.service.spec.ts` — 2 new tests (words in metadata_json)

## Change Log

- 2026-02-15: Story 15.2 implemented — Word-level timestamps for Whisper and Groq STT providers. Added `TranscriptionWord` interface, `timestamp_granularities` parameter, word extraction from API responses, and persistence in `metadata_json`. 13 new unit tests, 95/95 total STT tests passing.
- 2026-02-15: Code review (AI) — 1 HIGH (H1 DRY - accepted as provider pattern), 3 MEDIUM (M1 logging word_count fixed, M2 Google comment clarified, M3 Groq extra_field test added), 2 LOW (accepted). Auto-fixed M1+M2+M3. 96/96 tests passing. Status → done.
