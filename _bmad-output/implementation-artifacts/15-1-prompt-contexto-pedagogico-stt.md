# Story 15.1: Adicionar Prompt de Contexto Pedagógico ao STT

Status: done

## Story

As a sistema de transcrição,
I want enviar um prompt com vocabulário pedagógico/BNCC ao STT,
so that a acurácia na transcrição de termos técnicos educacionais melhore significativamente.

## Acceptance Criteria

1. **AC1:** Whisper provider aceita parâmetro `prompt` opcional na chamada de transcrição
2. **AC2:** Groq Whisper provider aceita parâmetro `prompt` opcional na chamada de transcrição
3. **AC3:** Prompt de vocabulário é selecionado com base na disciplina da aula (via `Planejamento` → `disciplina_id` → `Disciplina.nome`)
4. **AC4:** Prompt default (genérico) usado quando disciplina não está disponível
5. **AC5:** Prompt não excede 224 tokens (~800 chars) — validado em testes unitários
6. **AC6:** Sem regressão nos testes existentes de transcrição
7. **AC7:** Log do prompt utilizado registrado no `metadata` da `TranscriptionResult`

## Tasks / Subtasks

- [x] Task 1 — Estender `TranscribeOptions` com campo `prompt` (AC: #1, #2)
  - [x] 1.1 Adicionar campo `prompt?: string` à interface `TranscribeOptions` em `stt-provider.interface.ts`
- [x] Task 2 — Criar mapa de prompts por disciplina (AC: #3, #4, #5)
  - [x] 2.1 Criar arquivo `ressoa-backend/src/modules/stt/constants/stt-prompts.ts`
  - [x] 2.2 Definir `STT_PROMPTS: Record<string, string>` com chaves: `matematica`, `lingua_portuguesa`, `ciencias`, `default`
  - [x] 2.3 Validar que cada prompt ≤ 800 chars em teste unitário
- [x] Task 3 — Whisper provider: passar `prompt` ao API (AC: #1, #7)
  - [x] 3.1 Em `whisper.provider.ts`, extrair `options?.prompt` e passar ao `openai.audio.transcriptions.create()`
  - [x] 3.2 Registrar `stt_prompt_key` no campo `metadata` do resultado
  - [x] 3.3 Testes unitários: com prompt, sem prompt, prompt undefined
- [x] Task 4 — Groq Whisper provider: passar `prompt` ao API (AC: #2, #7)
  - [x] 4.1 Em `groq-whisper.provider.ts`, extrair `options?.prompt` e passar ao `groq.audio.transcriptions.create()`
  - [x] 4.2 Registrar `stt_prompt_key` no campo `metadata` do resultado
  - [x] 4.3 Testes unitários: com prompt, sem prompt, prompt undefined
- [x] Task 5 — Resolver disciplina na `TranscricaoService` e passar prompt (AC: #3, #4)
  - [x] 5.1 Em `transcricao.service.ts`, antes de chamar `sttService.transcribe()`, buscar o `Planejamento` vinculado à `Aula` (via `aula.planejamento_id`)
  - [x] 5.2 Extrair `disciplina.nome` do planejamento e mapear para chave do `STT_PROMPTS`
  - [x] 5.3 Passar `{ idioma: 'pt-BR', prompt: resolvedPrompt }` ao `sttService.transcribe()`
  - [x] 5.4 Se disciplina não encontrada, usar `STT_PROMPTS.default`
- [x] Task 6 — STT Router: propagar `prompt` no fallback (AC: #1, #2)
  - [x] 6.1 Verificar que `stt-router.service.ts` repassa `options` (incluindo `prompt`) ao fallback provider
  - [x] 6.2 Teste unitário confirmando propagação do prompt no cenário de fallback
- [x] Task 7 — Testes de não-regressão (AC: #6)
  - [x] 7.1 Executar suite existente de testes STT e confirmar 0 regressões
  - [x] 7.2 Novos testes: prompt undefined (backward compat), prompt com disciplina válida, prompt default

## Dev Notes

### Contexto do Épico

Esta é a **primeira story** do Epic 15 (Transcrição Enriquecida com Diarização). O objetivo do épico é enriquecer a transcrição com timestamps por palavra, prompt pedagógico e diarização professor/aluno via LLM. Esta story é **independente** e pode ser implementada em paralelo com US-015.2 (timestamps por palavra).

### Comportamento do Parâmetro `prompt` no Whisper/Groq

O `prompt` do Whisper **NÃO é uma instrução** — é uma lista de vocabulário/contexto que o modelo usa para calibrar reconhecimento de fala. Limite: **224 tokens (~800 chars)**. A API aceita o parâmetro diretamente:

```typescript
// OpenAI Whisper
await this.openai.audio.transcriptions.create({
  file: fs.createReadStream(tempFilePath),
  model: 'whisper-1',
  language: idioma,
  response_format: 'verbose_json',
  prompt: sttPrompt, // ← NOVO: string de vocabulário
});

// Groq Whisper (API compatível com OpenAI)
await this.groq.audio.transcriptions.create({
  file: fs.createReadStream(tempFilePath),
  model,
  response_format: 'verbose_json',
  language: idioma,
  temperature: 0.0,
  prompt: sttPrompt, // ← NOVO: string de vocabulário
});
```

### Prompts por Disciplina

```typescript
// Arquivo: ressoa-backend/src/modules/stt/constants/stt-prompts.ts
export const STT_PROMPTS: Record<string, string> = {
  matematica: `Frações, equações, álgebra, geometria, probabilidade, estatística.
Habilidades BNCC: EF06MA01, EF07MA02, EF08MA03, EF09MA04.
Termos: mínimo múltiplo comum, máximo divisor comum, plano cartesiano,
números racionais, expressões algébricas, teorema de Pitágoras.`,

  lingua_portuguesa: `Gêneros textuais, coesão, coerência, morfossintaxe, semântica.
Habilidades BNCC: EF67LP01, EF69LP03, EF89LP05.
Termos: substantivo, adjetivo, advérbio, conjunção, oração subordinada,
figuras de linguagem, dissertação argumentativa, crônica, resenha.`,

  ciencias: `Ecossistema, célula, átomo, molécula, energia, fotossíntese.
Habilidades BNCC: EF06CI01, EF07CI02, EF08CI03, EF09CI04.
Termos: sistema digestório, cadeia alimentar, tabela periódica,
reação química, gravitação, eletromagnetismo, camada de ozônio.`,

  default: `Habilidades BNCC, competências, objetivos de aprendizagem.
Termos pedagógicos: avaliação formativa, sequência didática,
plano de aula, metodologia ativa, aprendizagem significativa.`,
};
```

### Resolução de Disciplina na TranscricaoService

A `Aula` tem relação com `Planejamento` (via `planejamento_id`), que por sua vez tem relação com `Disciplina` (via `disciplina_id`). Para resolver o prompt:

```typescript
// Em transcricao.service.ts, ANTES de chamar sttService.transcribe():
const aula = await this.prisma.aula.findUnique({
  where: { id: aulaId, escola_id: escolaId, deleted_at: null },
  include: {
    planejamento: {
      include: { disciplina: true },
    },
  },
});

const disciplinaNome = aula?.planejamento?.disciplina?.nome?.toLowerCase() || '';
const promptKey = this.resolveSttPromptKey(disciplinaNome);
const sttPrompt = STT_PROMPTS[promptKey] || STT_PROMPTS.default;

// Passar ao STT
const result = await this.sttService.transcribe(audioBuffer, {
  idioma: 'pt-BR',
  prompt: sttPrompt,
});
```

**Mapeamento disciplina → chave do prompt:**
- "Matemática" → `matematica`
- "Língua Portuguesa" → `lingua_portuguesa`
- "Ciências" → `ciencias`
- Qualquer outra → `default`

### Project Structure Notes

**Arquivos a MODIFICAR (existentes):**
| Arquivo | Mudança |
|---------|---------|
| `ressoa-backend/src/modules/stt/interfaces/stt-provider.interface.ts` | Adicionar `prompt?: string` a `TranscribeOptions` |
| `ressoa-backend/src/modules/stt/providers/whisper.provider.ts` | Passar `options?.prompt` ao `openai.audio.transcriptions.create()` + metadata |
| `ressoa-backend/src/modules/stt/providers/groq-whisper.provider.ts` | Passar `options?.prompt` ao `groq.audio.transcriptions.create()` + metadata |
| `ressoa-backend/src/modules/stt/transcricao.service.ts` | Resolver disciplina → prompt, passar ao `sttService.transcribe()` |
| `ressoa-backend/src/modules/stt/services/stt-router.service.ts` | Verificar que `options` (com `prompt`) é propagado no fallback |

**Arquivos a CRIAR (novos):**
| Arquivo | Conteúdo |
|---------|----------|
| `ressoa-backend/src/modules/stt/constants/stt-prompts.ts` | Mapa `STT_PROMPTS` com vocabulário por disciplina |
| `ressoa-backend/src/modules/stt/constants/stt-prompts.spec.ts` | Testes de validação (tamanho ≤ 800 chars) |

**NÃO MODIFICAR:**
- `env.ts` — Nenhuma nova variável de ambiente necessária nesta story
- Schema Prisma — Nenhuma migração necessária
- Google provider — Não suporta `prompt` (ignorar)

### Padrões Obrigatórios do Projeto

- **Multi-tenancy:** `TranscricaoService` já usa `escola_id` via `prisma.getEscolaIdOrThrow()` — manter padrão
- **Logging:** Pino estruturado — logar `stt_prompt_key` usado em cada transcrição
- **Testes:** ≥85% coverage, mocks com `jest.mock()`, reset em `beforeEach`
- **Provider pattern:** Manter interface `STTProvider` inalterada exceto `TranscribeOptions`
- **Backward compat:** Se `prompt` for `undefined`, comportamento idêntico ao atual

### Padrões Estabelecidos em Stories Anteriores (Epic 14)

- **DI tokens:** `'WHISPER_PROVIDER'`, `'GROQ_WHISPER_PROVIDER'` — usar nos testes
- **Router pattern:** `STTRouterService` injeta todos providers e usa `Map<string, STTProvider>`
- **Timeout:** Whisper sem timeout explícito, Groq com 300s via `Promise.race`
- **Temp files:** Padrão `/tmp/${crypto.randomUUID()}.mp3` com cleanup em `finally`
- **Cost tracking:** `custo_usd` calculado por provider, salvo na `Transcricao`
- **Mock pattern:** Mock do SDK inteiro via `jest.mock('openai')` / `jest.mock('groq-sdk')`

### Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Prompt degrada transcrição em vez de melhorar | Feature flag futura (US-015.4 `DIARIZATION_ENABLED`), por hora `prompt` é sempre enviado |
| Prompt excede 224 tokens | Teste unitário valida ≤ 800 chars em build time |
| Disciplina não encontrada no planejamento | Fallback para `STT_PROMPTS.default` |
| Groq API não suporta `prompt` | Documentação Groq confirma suporte (API compatível OpenAI) — testar em dev |

### References

- [Source: _bmad-output/implementation-artifacts/epics/epic-002-transcricao-enriquecida-diarizacao.md#US-015.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#STT-Service-Abstraction]
- [Source: ressoa-backend/src/modules/stt/interfaces/stt-provider.interface.ts] — Interface atual
- [Source: ressoa-backend/src/modules/stt/providers/whisper.provider.ts:84-90] — Chamada Whisper atual
- [Source: ressoa-backend/src/modules/stt/providers/groq-whisper.provider.ts:59-66] — Chamada Groq atual
- [Source: ressoa-backend/src/modules/stt/transcricao.service.ts:109-111] — Chamada STT atual (sem prompt)
- [Source: project-context.md] — Multi-tenancy rules, testing standards

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- ✅ Task 1: Added `prompt?: string` to `TranscribeOptions` interface — backward compatible (optional field)
- ✅ Task 2: Created `stt-prompts.ts` with `STT_PROMPTS` map (4 discipline keys), `resolveSttPromptKey()` helper with diacritic-aware normalization, and `STT_PROMPT_MAX_LENGTH` constant. All 18 unit tests passing (prompt length validation, key resolution for all disciplines).
- ✅ Task 3: Whisper provider now conditionally passes `prompt` to OpenAI API and sets `stt_prompt_used: true` in metadata. 11 unit tests (5 new prompt-specific).
- ✅ Task 4: Groq Whisper provider now conditionally passes `prompt` to Groq API and sets `stt_prompt_used: true` in metadata. 26 unit tests (4 new prompt-specific).
- ✅ Task 5: `TranscricaoService.transcribeAula()` now resolves discipline from `Aula → Planejamento → Disciplina`, maps to prompt key, and passes vocabulary prompt to STT. Falls back to `default` prompt when planejamento is null or discipline is unknown. 8 unit tests covering all discipline mappings + stt_prompt_key in metadata.
- ✅ Task 6: STT Router already correctly propagates `options` (including `prompt`) to both primary and fallback providers. Added 2 explicit tests confirming prompt propagation in primary and fallback scenarios. 14 total router tests.
- ✅ Task 7: Full STT module regression test — 98/98 tests passing, 0 regressions.

### Change Log

- 2026-02-15: Story 15.1 implementation complete — STT pedagogical prompt support for Whisper and Groq providers
- 2026-02-15: Code review — Fixed: H1 (Record<string,any> → spread condicional), M1 (stt_prompt_key no metadata), L1 (log padronizado pt-BR). 98/98 testes.

### File List

**Modified:**
- `ressoa-backend/src/modules/stt/interfaces/stt-provider.interface.ts` — Added `prompt?: string` to `TranscribeOptions`
- `ressoa-backend/src/modules/stt/providers/whisper.provider.ts` — Pass `prompt` to OpenAI API, track in metadata
- `ressoa-backend/src/modules/stt/providers/groq-whisper.provider.ts` — Pass `prompt` to Groq API, track in metadata
- `ressoa-backend/src/modules/stt/transcricao.service.ts` — Resolve discipline → prompt key, pass prompt to STT
- `ressoa-backend/src/modules/stt/services/stt-router.service.spec.ts` — Added 2 prompt propagation tests

**Created:**
- `ressoa-backend/src/modules/stt/constants/stt-prompts.ts` — `STT_PROMPTS` map + `resolveSttPromptKey()` + `STT_PROMPT_MAX_LENGTH`
- `ressoa-backend/src/modules/stt/constants/stt-prompts.spec.ts` — 18 unit tests for prompt validation and key resolution
- `ressoa-backend/src/modules/stt/providers/whisper.provider.spec.ts` — 11 unit tests for Whisper provider (prompt support)
- `ressoa-backend/src/modules/stt/transcricao.service.spec.ts` — 8 unit tests for discipline-based prompt resolution + stt_prompt_key validation
