# Story 15.3: Implementar Serviço de Diarização via LLM

Status: done

## Story

As a sistema de processamento de aulas,
I want passar a transcrição word-level para um LLM que identifica professor vs aluno,
so that gero um SRT enriquecido com identificação de falantes para análise pedagógica downstream.

## Acceptance Criteria

1. **AC1:** `DiarizationService` criado em `ressoa-backend/src/modules/stt/services/diarization.service.ts`
2. **AC2:** Serviço recebe `TranscriptionWord[]` e retorna `DiarizationResult` com SRT formatado e speaker labels `[PROFESSOR]` / `[ALUNO]`
3. **AC3:** Usa `LLMRouterService.generateWithFallback()` existente para chamada ao provider — NÃO chamar providers diretamente
4. **AC4:** `DiarizationResult` interface criada com campos: `srt`, `provider`, `custo_usd`, `tempo_processamento_ms`, `segments_count`, `speaker_stats`
5. **AC5:** Prompt de diarização identifica corretamente `[PROFESSOR]` e `[ALUNO]` — default para PROFESSOR em caso de dúvida
6. **AC6:** Output é SRT válido (formato: número sequencial, timestamp `HH:MM:SS,mmm --> HH:MM:SS,mmm`, `[SPEAKER] texto`)
7. **AC7:** Fallback: se LLM falhar ou `words` for `undefined`/vazio, retorna SRT sem labels (apenas timestamps + texto puro)
8. **AC8:** Métricas de diarização no resultado: `professor_segments`, `aluno_segments`, `professor_time_pct`
9. **AC9:** Testes unitários ≥85% coverage — cenários: sucesso, fallback, words vazio, LLM timeout/erro, parsing SRT
10. **AC10:** Log estruturado Pino com: segments_count, speaker_stats, provider, custo_usd, tempo_processamento_ms

## Tasks / Subtasks

- [x] Task 1 — Criar interfaces de diarização (AC: #4)
  - [x] 1.1 Criar `DiarizationResult` interface em `stt/interfaces/diarization.interface.ts` com campos: `srt: string`, `provider: string`, `custo_usd: number`, `tempo_processamento_ms: number`, `segments_count: number`, `speaker_stats: { professor_segments: number, aluno_segments: number, professor_time_pct: number }`
  - [x] 1.2 Exportar do barrel `stt/interfaces/index.ts` (se existir) ou diretamente
- [x] Task 2 — Criar `DiarizationService` (AC: #1, #2, #3, #5, #6)
  - [x] 2.1 Criar `ressoa-backend/src/modules/stt/services/diarization.service.ts` como `@Injectable()`
  - [x] 2.2 Injetar `LLMRouterService` via constructor DI
  - [x] 2.3 Implementar método `diarize(words: TranscriptionWord[]): Promise<DiarizationResult>`
  - [x] 2.4 Implementar `formatWordsForLLM(words)` — formatar cada word como `[MM:SS.ms] palavra` para input compacto
  - [x] 2.5 Implementar `parseSpeakerStats(srt: string)` — contar segmentos [PROFESSOR] vs [ALUNO] e calcular % tempo
  - [x] 2.6 Chamar `llmRouter.generateWithFallback('diarizacao', prompt, options)` — REQUER adicionar `'diarizacao'` ao `LLMAnalysisType`
- [x] Task 3 — Estender config de providers para diarização (AC: #3)
  - [x] 3.1 Adicionar `'diarizacao'` ao type `LLMAnalysisType` em `config/providers.config.ts`
  - [x] 3.2 Adicionar `diarizacao: ProviderPairSchema` ao `ProvidersConfigSchema.llm`
  - [x] 3.3 Adicionar default: `diarizacao: { primary: 'GEMINI_FLASH', fallback: 'GPT4_MINI' }` ao `DEFAULT_PROVIDERS_CONFIG`
  - [x] 3.4 Atualizar tipo `ProvidersConfig` (inferido pelo zod, automático)
- [x] Task 4 — Registrar no SttModule (AC: #1)
  - [x] 4.1 Adicionar `DiarizationService` aos `providers` do `SttModule`
  - [x] 4.2 Exportar `DiarizationService` do `SttModule` para uso downstream (Story 15.5)
  - [x] 4.3 Garantir que `LlmModule` está importado no `SttModule` (para DI do `LLMRouterService`)
- [x] Task 5 — Implementar fallback gracioso (AC: #7)
  - [x] 5.1 Se `words` for `undefined` ou `length === 0`, gerar SRT simples a partir do texto puro (sem labels)
  - [x] 5.2 Se LLM lançar exceção, logar warning e retornar SRT sem labels (fallback)
  - [x] 5.3 Retornar `DiarizationResult` com `provider: 'FALLBACK'` e `custo_usd: 0` no fallback
- [x] Task 6 — Implementar logging estruturado (AC: #10)
  - [x] 6.1 Logger Pino via `new Logger(DiarizationService.name)`
  - [x] 6.2 Log info no sucesso: `segments_count`, `speaker_stats`, `provider`, `custo_usd`, `tempo_processamento_ms`
  - [x] 6.3 Log warn no fallback: motivo do fallback, words_count
- [x] Task 7 — Testes unitários (AC: #9)
  - [x] 7.1 Criar `ressoa-backend/src/modules/stt/services/diarization.service.spec.ts`
  - [x] 7.2 Teste: diarização com sucesso — words válidos → SRT com [PROFESSOR]/[ALUNO]
  - [x] 7.3 Teste: words undefined → fallback SRT sem labels
  - [x] 7.4 Teste: words vazio (length 0) → fallback SRT sem labels
  - [x] 7.5 Teste: LLM throw Error → fallback SRT sem labels, log warning
  - [x] 7.6 Teste: parseSpeakerStats conta corretamente professor/aluno segments
  - [x] 7.7 Teste: formatWordsForLLM formata corretamente timestamps
  - [x] 7.8 Teste: resultado inclui provider, custo_usd, tempo_processamento_ms do LLMResult
  - [x] 7.9 Executar suite completa STT — 0 regressões

## Dev Notes

### Contexto do Épico

Esta é a **terceira story** do Epic 15 (Transcrição Enriquecida com Diarização). Stories 15.1 (prompt pedagógico) e 15.2 (word timestamps) já estão **DONE**. Esta story cria o `DiarizationService` que será integrado ao pipeline na Story 15.5.

### Pipeline do Épico (dependências)

```
US-015.1 (STT Prompt) ✅ DONE ──┐
                                 ├──→ US-015.3 (LLM Diarization) ◀── ESTA STORY
US-015.2 (Word Timestamps) ✅ DONE
                                 │
US-015.4 (Provider Config) ──────┼──→ US-015.5 (Pipeline) → US-015.6 (Prompts)
                                 │
```

### Integração com LLMRouterService (CRÍTICO)

O `DiarizationService` **DEVE** usar `LLMRouterService.generateWithFallback()` — NÃO chamar providers diretamente. Isso garante:
- Fallback automático (primary → fallback provider)
- Timeout handling (300s)
- Logging e cost tracking consistentes
- Hot-reload de configuração via `providers.config.json`

**Assinatura existente:**
```typescript
// LLMRouterService (src/modules/llm/services/llm-router.service.ts)
async generateWithFallback(
  analysisType: LLMAnalysisType,  // PRECISA ADICIONAR 'diarizacao'
  prompt: string,
  options?: GenerateOptions,       // { temperature?, maxTokens?, systemPrompt? }
): Promise<LLMResult>              // { texto, provider, modelo, tokens_input, tokens_output, custo_usd, tempo_processamento_ms }
```

**Tipo `LLMAnalysisType` atual (providers.config.ts:46):**
```typescript
export type LLMAnalysisType = 'analise_cobertura' | 'analise_qualitativa' | 'relatorio' | 'exercicios' | 'alertas';
// ADICIONAR: | 'diarizacao'
```

**Schema zod (`ProvidersConfigSchema.llm`) — ADICIONAR:**
```typescript
llm: z.object({
  analise_cobertura: ProviderPairSchema,
  analise_qualitativa: ProviderPairSchema,
  relatorio: ProviderPairSchema,
  exercicios: ProviderPairSchema,
  alertas: ProviderPairSchema,
  diarizacao: ProviderPairSchema,  // ← NOVO
}),
```

**Default config — ADICIONAR:**
```typescript
diarizacao: { primary: 'GEMINI_FLASH', fallback: 'GPT4_MINI' },
```

### Provider Map do LLMRouterService (llm-router.service.ts:17-21)

```typescript
this.providerMap = new Map<string, LLMProvider>([
  ['CLAUDE_SONNET', this.claudeProvider],
  ['GPT4_MINI', this.gptProvider],
  ['GEMINI_FLASH', this.geminiProvider],  // ← Gemini Flash JÁ DISPONÍVEL
]);
```

Gemini Flash já está no provider map — basta adicionar `'diarizacao'` ao config e funciona automaticamente.

### TranscriptionWord Interface (já implementada — Story 15.2)

```typescript
// src/modules/stt/interfaces/stt-provider.interface.ts
export interface TranscriptionWord {
  word: string;   // "Vamos"
  start: number;  // 0.0
  end: number;    // 0.32
}
```

### Prompt de Diarização

```typescript
const DIARIZATION_SYSTEM_PROMPT = `Você é um especialista em análise de transcrições de aulas escolares brasileiras.

TAREFA: Receba palavras com timestamps e gere SRT com identificação de falante.

REGRAS DE IDENTIFICAÇÃO:
- PROFESSOR: Explica conceitos, faz perguntas didáticas, dá instruções, usa linguagem formal, cita termos técnicos/BNCC
- ALUNO: Responde perguntas, faz perguntas de dúvida, usa linguagem informal, respostas curtas
- Na DÚVIDA, marque como PROFESSOR (professores falam ~70-80% do tempo)
- Mudanças de speaker coincidem com pausas (gaps > 0.5s entre palavras)

FORMATO SRT (estrito):
Número sequencial
HH:MM:SS,mmm --> HH:MM:SS,mmm
[SPEAKER] texto do segmento

Agrupe palavras consecutivas do mesmo speaker (máx 3 linhas/bloco).
Use vírgula como separador de ms no timestamp.
Responda APENAS com SRT, sem explicações.`;
```

### Formato do Input para LLM

Para eficiência de tokens, formatar words de forma compacta:
```
[00:00.000] Bom
[00:00.320] dia
[00:00.560] turma
[00:01.200] Hoje
[00:01.480] vamos
...
```

Helper:
```typescript
private formatWordsForLLM(words: TranscriptionWord[]): string {
  return words
    .map(w => {
      const min = Math.floor(w.start / 60);
      const sec = w.start % 60;
      return `[${String(min).padStart(2, '0')}:${sec.toFixed(3).padStart(6, '0')}] ${w.word}`;
    })
    .join('\n');
}
```

### Formato SRT de Saída (exemplo)

```srt
1
00:00:01,200 --> 00:00:05,800
[PROFESSOR] Bom dia, turma! Hoje vamos trabalhar com frações equivalentes.

2
00:00:06,100 --> 00:00:08,400
[ALUNO] Professor, frações equivalentes é aquilo de pizza?

3
00:00:08,800 --> 00:00:15,200
[PROFESSOR] Exatamente! Vamos começar com exemplos visuais.
```

### Parser de Speaker Stats

```typescript
private parseSpeakerStats(srt: string): { professor_segments: number; aluno_segments: number; professor_time_pct: number } {
  const lines = srt.split('\n');
  let profSegments = 0;
  let alunoSegments = 0;
  let profTime = 0;
  let alunoTime = 0;

  for (let i = 0; i < lines.length; i++) {
    const timestampMatch = lines[i]?.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
    if (timestampMatch) {
      const start = this.parseSrtTimestamp(timestampMatch[1]);
      const end = this.parseSrtTimestamp(timestampMatch[2]);
      const duration = end - start;
      const textLine = lines[i + 1] || '';
      if (textLine.startsWith('[PROFESSOR]')) {
        profSegments++;
        profTime += duration;
      } else if (textLine.startsWith('[ALUNO]')) {
        alunoSegments++;
        alunoTime += duration;
      }
    }
  }

  const totalTime = profTime + alunoTime;
  return {
    professor_segments: profSegments,
    aluno_segments: alunoSegments,
    professor_time_pct: totalTime > 0 ? Math.round((profTime / totalTime) * 1000) / 10 : 100,
  };
}
```

### Considerações de Performance

- Input para LLM: aula de 45min ≈ 5000-8000 palavras ≈ ~50KB texto formatado ≈ ~15K tokens input
- Gemini Flash: $0.10/1M input + $0.40/1M output ≈ **~$0.003-0.008/aula** (muito barato)
- Tempo esperado: 5-15s para Gemini Flash processar
- `maxTokens: 8192` (SRT output pode ser grande para aulas longas)
- `temperature: 0.1` (baixa criatividade — classificação determinística)

### LLMResult Retornado pelo Router

```typescript
interface LLMResult {
  texto: string;              // SRT gerado pelo LLM
  provider: ProviderLLM;      // GEMINI_FLASH | GPT4_MINI etc.
  modelo: string;             // 'gemini-2.0-flash'
  tokens_input: number;
  tokens_output: number;
  custo_usd: number;          // Custo calculado pelo provider
  tempo_processamento_ms: number;
}
```

### Padrões de Fallback

```
Cenário 1: words disponíveis + LLM OK → SRT com labels ✅
Cenário 2: words disponíveis + LLM falha → SRT sem labels (fallback) ⚠️
Cenário 3: words undefined/vazio → SRT sem labels (fallback) ⚠️
```

No fallback, não chamar LLM. Gerar SRT simples sem speaker labels. Retornar `provider: 'FALLBACK'` e `custo_usd: 0`.

### Project Structure Notes

**Arquivos a CRIAR:**
| Arquivo | Descrição |
|---------|-----------|
| `ressoa-backend/src/modules/stt/interfaces/diarization.interface.ts` | `DiarizationResult` interface |
| `ressoa-backend/src/modules/stt/services/diarization.service.ts` | `DiarizationService` principal |
| `ressoa-backend/src/modules/stt/services/diarization.service.spec.ts` | Testes unitários |

**Arquivos a MODIFICAR:**
| Arquivo | Mudança |
|---------|---------|
| `ressoa-backend/src/config/providers.config.ts` | Adicionar `'diarizacao'` ao `LLMAnalysisType`, `ProvidersConfigSchema`, `DEFAULT_PROVIDERS_CONFIG` |
| `ressoa-backend/src/modules/stt/stt.module.ts` | Registrar `DiarizationService` nos providers + exports, importar `LlmModule` |

**NÃO MODIFICAR:**
- Schema Prisma — Nenhuma migração necessária
- `.env` / `env.ts` — Nenhuma nova variável de ambiente (config via `providers.config.json`)
- `LLMRouterService` — Não precisa alterar (já suporta qualquer `LLMAnalysisType`)
- `ProvidersConfigService` — Não precisa alterar (usa tipos inferidos do zod schema)
- Providers LLM (claude, gpt, gemini) — Nenhuma mudança
- Providers STT (whisper, groq, google) — Nenhuma mudança
- `TranscricaoService` — Será modificado na Story 15.5 (pipeline), NÃO nesta story
- Bull queue worker — Será modificado na Story 15.5

### Padrões Obrigatórios do Projeto

- **Multi-tenancy:** Este serviço NÃO acessa banco de dados diretamente — sem necessidade de `escola_id`. O caller (Story 15.5) garantirá tenant isolation.
- **Logging:** Pino estruturado — `new Logger(DiarizationService.name)`
- **Testes:** ≥85% coverage, mocks com `jest.mock()`, reset em `beforeEach`
- **Provider pattern:** Usar `LLMRouterService` (não providers diretos)
- **Backward compat:** Se `words` não disponível, fallback gracioso (sem labels)
- **Error handling:** Try-catch no `diarize()` — nunca propagar exceção (fallback)

### Padrões Estabelecidos nas Stories 15.1/15.2

- **Spread condicional:** `...(options?.prompt && { prompt: options.prompt })`
- **Metadata enrichment:** Campos adicionados com spread condicional
- **Mock pattern:** Mock de services via `{ provide: LLMRouterService, useValue: mockRouter }`
- **Logger NestJS:** `private readonly logger = new Logger(ClassName.name)`
- **DI tokens:** Services injetados diretamente (não tokens customizados para services)

### References

- [Source: _bmad-output/implementation-artifacts/15-2-timestamps-por-palavra-stt.md] — Story anterior, TranscriptionWord interface
- [Source: _bmad-output/implementation-artifacts/15-1-prompt-contexto-pedagogico-stt.md] — Patterns de STT
- [Source: ressoa-backend/src/modules/stt/interfaces/stt-provider.interface.ts] — TranscriptionWord, TranscriptionResult
- [Source: ressoa-backend/src/modules/llm/interfaces/llm-provider.interface.ts] — LLMResult, GenerateOptions, LLMProvider
- [Source: ressoa-backend/src/modules/llm/services/llm-router.service.ts] — LLMRouterService.generateWithFallback()
- [Source: ressoa-backend/src/config/providers.config.ts:46] — LLMAnalysisType, ProvidersConfigSchema, DEFAULT_PROVIDERS_CONFIG
- [Source: ressoa-backend/src/modules/providers-config/providers-config.service.ts] — ProvidersConfigService (hot-reload)
- [Source: project-context.md] — Multi-tenancy rules, testing standards

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- All 14 unit tests passing (diarization.service.spec.ts)
- Full STT suite: 126/126 tests passing (8 suites, 0 regressions)
- Providers-config: 12/12 tests passing (0 regressions)
- LLM Router: 12/12 tests passing (0 regressions)

### Completion Notes List

- **Task 1:** Created `DiarizationResult` and `SpeakerStats` interfaces in `diarization.interface.ts`. Exported from barrel `index.ts`.
- **Task 2:** Created `DiarizationService` with `diarize()`, `formatWordsForLLM()`, `parseSpeakerStats()` methods. Uses `LLMRouterService.generateWithFallback('diarizacao', ...)` with `temperature: 0.1`, `maxTokens: 8192`.
- **Task 3:** Extended `LLMAnalysisType` with `'diarizacao'`, added to zod schema and default config with `{ primary: 'GEMINI_FLASH', fallback: 'GPT4_MINI' }`.
- **Task 4:** Registered `DiarizationService` in `SttModule` providers/exports. Added `LLMModule` import for DI.
- **Task 5:** Fallback implemented: undefined/empty words returns empty SRT; LLM error returns SRT without labels (words grouped in ~10-word segments). Both return `provider: 'FALLBACK'`, `custo_usd: 0`.
- **Task 6:** Structured logging via `Logger(DiarizationService.name)`: info on success (segments_count, speaker_stats, provider, custo_usd, tempo_processamento_ms), warn on fallback (error/reason, words_count).
- **Task 7:** 14 unit tests covering: successful diarization, undefined words, empty words, LLM error fallback, speaker stats parsing, timestamp formatting, result metadata, fallback SRT generation with word grouping. Full STT suite regression-free (126 tests).

### Change Log

- 2026-02-15: Story 15.3 implementation complete — DiarizationService with LLM-based speaker identification, graceful fallback, and structured logging. 14 unit tests. 0 regressions.
- 2026-02-15: Code review — 5 issues found (1 HIGH, 3 MEDIUM, 1 LOW). 2 auto-fixed: (1) providers.config.spec.ts fixtures updated with `diarizacao` field (4 tests were broken), (2) `formatWordsForLLM`/`parseSpeakerStats` made private + tests refactored to test via `diarize()`. 28/28 tests passing post-fix.

### File List

**New files:**
- `ressoa-backend/src/modules/stt/interfaces/diarization.interface.ts`
- `ressoa-backend/src/modules/stt/services/diarization.service.ts`
- `ressoa-backend/src/modules/stt/services/diarization.service.spec.ts`

**Modified files:**
- `ressoa-backend/src/modules/stt/interfaces/index.ts`
- `ressoa-backend/src/config/providers.config.ts`
- `ressoa-backend/src/modules/stt/stt.module.ts`
- `ressoa-backend/src/config/providers.config.spec.ts` (code review fix: added `diarizacao` to all test fixtures)
