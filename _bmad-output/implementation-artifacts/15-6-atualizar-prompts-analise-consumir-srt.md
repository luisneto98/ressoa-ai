# Story 15.6: Atualizar Prompts de Análise para Consumir SRT

Status: done

## Story

As a pipeline de análise pedagógica,
I want interpretar transcrições em formato SRT com speaker labels,
so that as análises diferenciem falas do professor e dos alunos, gerando insights de participação.

## Acceptance Criteria

1. Os 5 prompts de análise (v4.0.0) reconhecem e interpretam formato SRT com `[PROFESSOR]`/`[ALUNO]` labels (AC: #1)
2. A análise diferencia contribuições do professor vs alunos — evidências citam speaker labels (AC: #2)
3. Timestamps SRT são usados para referenciar momentos específicos da aula nas evidências (AC: #3)
4. Compatibilidade mantida: se receber texto puro (legado sem SRT), os prompts ainda funcionam corretamente (AC: #4)
5. Relatórios gerados incluem insights de participação (% fala professor/aluno, qualidade de interações) (AC: #5)

## Tasks / Subtasks

- [x] Task 1: Criar prompt-cobertura-v4.0.0.json (AC: #1, #2, #3, #4)
  - [x] 1.1 Copiar `prompt-cobertura-v3.0.0.json` → `prompt-cobertura-v4.0.0.json`
  - [x] 1.2 Adicionar seção SRT input format na instrução (aceitar SRT ou texto puro)
  - [x] 1.3 Instruir LLM a usar speaker labels para classificar evidências como professor-explanation vs student-response
  - [x] 1.4 Instruir uso de timestamps nas evidências literais (ex: `[00:08:30] [PROFESSOR] "Vamos resolver..."`)
  - [x] 1.5 Atualizar schema JSON de output: adicionar `speaker` field em cada evidência
  - [x] 1.6 Adicionar fallback instruction: "Se transcrição NÃO contém labels [PROFESSOR]/[ALUNO], trate como texto puro"
  - [x] 1.7 Definir `versao: "v4.0.0"`, `ativo: true`, desativar v3.0.0 (`ativo: false`)
- [x] Task 2: Criar prompt-qualitativa-v4.0.0.json (AC: #1, #2, #3, #4, #5)
  - [x] 2.1 Copiar `prompt-qualitativa-v3.0.0.json` → `prompt-qualitativa-v4.0.0.json`
  - [x] 2.2 Adicionar dimensão de análise: "Dinâmica de Interação Professor-Aluno"
  - [x] 2.3 Instruir LLM a usar labels para medir engajamento real (respostas de alunos = engajamento alto)
  - [x] 2.4 Adicionar campo `participacao_alunos` no output JSON com métricas de interação
  - [x] 2.5 Instruir uso de timestamps para referenciar momentos de interação
  - [x] 2.6 Adicionar fallback para texto puro (manter análise funcional sem speaker labels)
- [x] Task 3: Criar prompt-relatorio-v4.0.0.json (AC: #1, #2, #3, #4, #5)
  - [x] 3.1 Copiar `prompt-relatorio-v3.0.0.json` → `prompt-relatorio-v4.0.0.json`
  - [x] 3.2 Adicionar seção "Dinâmica da Aula" no template do relatório markdown
  - [x] 3.3 Incluir insights de % fala professor vs alunos (se diarização disponível)
  - [x] 3.4 Instruir uso de timestamps para citar momentos-chave (ex: "Aos 15:30, o professor...")
  - [x] 3.5 Incluir blockquotes com speaker labels em citações da transcrição
  - [x] 3.6 Adicionar fallback: "Se sem speaker labels, omitir seção de dinâmica de participação"
- [x] Task 4: Criar prompt-exercicios-v4.0.0.json (AC: #1, #3, #4)
  - [x] 4.1 Copiar `prompt-exercicios-v3.0.0.json` → `prompt-exercicios-v4.0.0.json`
  - [x] 4.2 Instruir LLM a contextualizar exercícios com momentos da aula usando timestamps
  - [x] 4.3 Instruir uso de dúvidas/respostas dos alunos (labels `[ALUNO]`) para gerar exercícios que reforçam pontos de confusão
  - [x] 4.4 Adicionar fallback para texto puro
- [x] Task 5: Criar prompt-alertas-v4.0.0.json (AC: #1, #2, #3, #4, #5)
  - [x] 5.1 Copiar `prompt-alertas-v3.0.0.json` → `prompt-alertas-v4.0.0.json`
  - [x] 5.2 Adicionar tipo de alerta: `PARTICIPACAO_DESEQUILIBRADA` (professor fala >90% do tempo)
  - [x] 5.3 Adicionar tipo de alerta positivo: `INTERACAO_FREQUENTE` (muitas trocas professor-aluno)
  - [x] 5.4 Instruir uso de timestamps para localizar momentos de alert (ex: "Entre 05:00-25:00, zero participação")
  - [x] 5.5 Adicionar campo `speaker_analysis` no output JSON com breakdown professor/aluno
  - [x] 5.6 Adicionar fallback para texto puro
- [x] Task 6: Desativar prompts v3.0.0 no seed (AC: #1)
  - [x] 6.1 Em cada v3.0.0 JSON: definir `"ativo": false`
  - [x] 6.2 Garantir que apenas v4.0.0 tem `"ativo": true` para cada prompt
  - [x] 6.3 Rodar `npx prisma db seed` para atualizar banco
- [x] Task 7: Atualizar `analise.service.ts` se necessário (AC: #2, #5)
  - [x] 7.1 Verificar se `contexto.transcricao` já envia SRT completo (deve ser — `aula.transcricao.texto` agora contém SRT por Story 15.5)
  - [x] 7.2 Opcionalmente: passar `metadata_json.has_diarization` e `metadata_json.speaker_stats` no contexto para que prompts saibam se SRT tem labels
  - [x] 7.3 Se metadata necessária: adicionar `include: { transcricao: true }` já existente — extrair `metadata_json` do registro
- [x] Task 8: Testes unitários para prompts v4.0.0 (AC: #1-#5)
  - [x] 8.1 Testar que `PromptService.getActivePrompt('prompt-cobertura')` retorna v4.0.0
  - [x] 8.2 Testar que `PromptService.renderPrompt()` substitui `{{transcricao}}` com conteúdo SRT
  - [x] 8.3 Testar que prompts v3.0.0 estão `ativo: false` no seed
  - [x] 8.4 Testar que pipeline aceita SRT input e gera output enriquecido com speaker context
  - [x] 8.5 Testar backward compatibility: pipeline aceita texto puro e gera output sem speaker data
- [x] Task 9: Run full test suite — zero regressions (AC: #4)
  - [x] 9.1 Run all analise module tests
  - [x] 9.2 Run all LLM module tests
  - [x] 9.3 Run full backend test suite

## Dev Notes

### Abordagem: Versionamento via Seed Files (NÃO código)

Os prompts de análise são **JSON seed files** em `ressoa-backend/prisma/seeds/prompts/`. A mudança principal desta story é **criar 5 novos JSONs (v4.0.0)** e desativar os v3.0.0. O code change no `analise.service.ts` é **mínimo ou zero** — a transcrição já chega como SRT via `aula.transcricao.texto` (Story 15.5).

**Fluxo já existente (NÃO precisa mudar):**
```
analise.service.ts → contexto.transcricao = aula.transcricao.texto
  → PromptService.renderPrompt(prompt, contexto)
    → Handlebars substitui {{transcricao}} com SRT
      → LLM recebe SRT enriquecido
```

### Arquivos a Criar

| Arquivo | Ação |
|---------|------|
| `ressoa-backend/prisma/seeds/prompts/prompt-cobertura-v4.0.0.json` | CRIAR |
| `ressoa-backend/prisma/seeds/prompts/prompt-qualitativa-v4.0.0.json` | CRIAR |
| `ressoa-backend/prisma/seeds/prompts/prompt-relatorio-v4.0.0.json` | CRIAR |
| `ressoa-backend/prisma/seeds/prompts/prompt-exercicios-v4.0.0.json` | CRIAR |
| `ressoa-backend/prisma/seeds/prompts/prompt-alertas-v4.0.0.json` | CRIAR |

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `ressoa-backend/prisma/seeds/prompts/prompt-cobertura-v3.0.0.json` | MODIFICAR: `"ativo": false` |
| `ressoa-backend/prisma/seeds/prompts/prompt-qualitativa-v3.0.0.json` | MODIFICAR: `"ativo": false` |
| `ressoa-backend/prisma/seeds/prompts/prompt-relatorio-v3.0.0.json` | MODIFICAR: `"ativo": false` |
| `ressoa-backend/prisma/seeds/prompts/prompt-exercicios-v3.0.0.json` | MODIFICAR: `"ativo": false` |
| `ressoa-backend/prisma/seeds/prompts/prompt-alertas-v3.0.0.json` | MODIFICAR: `"ativo": false` |
| `ressoa-backend/src/modules/analise/services/analise.service.ts` | POSSIVELMENTE: adicionar metadata diarização ao contexto |
| `ressoa-backend/src/modules/analise/services/analise.service.spec.ts` | MODIFICAR: testes para validar SRT handling |

### Critical: O que MUDAR em cada Prompt v4.0.0

**Padrão comum a TODOS os 5 prompts:**

1. **Seção de Input Format** — Adicionar instrução logo antes de `{{transcricao}}`:
```
# FORMATO DA TRANSCRIÇÃO

A transcrição pode estar em dois formatos:

**Formato SRT (com diarização):**
```srt
1
00:00:01,200 --> 00:00:05,800
[PROFESSOR] Bom dia, turma! Hoje vamos trabalhar com frações.

2
00:00:06,100 --> 00:00:08,400
[ALUNO] Professor, frações é aquilo de pizza?
```

**Formato texto puro (legado, sem diarização):**
```
Bom dia, turma! Hoje vamos trabalhar com frações...
```

Se a transcrição contém labels [PROFESSOR] e [ALUNO], USE essas informações para enriquecer sua análise.
Se NÃO contém labels, realize a análise normalmente com base no texto disponível.
```

2. **Evidências com Timestamps** — Mudar instrução de evidências para incluir timestamps:
```
"evidencias": ["[00:08:30] [PROFESSOR] Vamos resolver usando regra de três"]
```
em vez de apenas `["Vamos resolver usando regra de três"]`

3. **Backward Compatibility** — Cada prompt DEVE funcionar com ambos os formatos:
   - SRT com `[PROFESSOR]`/`[ALUNO]` labels e timestamps
   - Texto puro sem labels (aulas antigas ou diarização desativada)

### Critical: Mudanças ESPECÍFICAS por Prompt

**Prompt 1 (Cobertura):**
- Evidências incluem `speaker` e `timestamp` para rastreabilidade
- Distinguir se conceito foi explicado pelo professor vs perguntado pelo aluno
- Novo campo opcional no output: `"interacoes_relevantes": [{"timestamp": "00:05:30", "speaker": "ALUNO", "texto": "..."}]`

**Prompt 2 (Qualitativa):**
- Nova dimensão de análise: "Dinâmica de Interação"
- `engajamento_alunos` calculado com base em labels `[ALUNO]` (não apenas inferido)
- Novo campo: `"participacao_alunos": { "intervencoes_contadas": N, "perguntas_alunos": N, "respostas_alunos": N, "tempo_estimado_fala_alunos_pct": N }`

**Prompt 3 (Relatório):**
- Nova seção markdown: "### Dinâmica de Participação"
- Citações com `> [PROFESSOR] "texto"` e `> [ALUNO] "texto"` quando disponíveis
- Insights tipo: "Os alunos participaram em ~25% do tempo, com X intervenções espontâneas"
- Se sem labels: omitir seção de participação (não inventar dados)

**Prompt 4 (Exercícios):**
- Usar dúvidas dos alunos (`[ALUNO]`) para gerar exercícios de reforço
- Referenciar momento da aula: "Baseado na dúvida levantada aos 08:30..."
- Menor impacto dos 5 prompts — exercícios já são gerados por contexto

**Prompt 5 (Alertas):**
- Novo tipo de alerta: `PARTICIPACAO_DESEQUILIBRADA` (professor >90% do tempo)
- Novo tipo positivo: `INTERACAO_FREQUENTE` (alta frequência de trocas professor-aluno)
- Dados de suporte incluem `speaker_analysis` com breakdown de tempo e contagem
- Se sem labels: não gerar alertas de participação (impossível calcular)

### Critical: NÃO Mudar o Serviço de Análise (Provável)

O `analise.service.ts` (695 linhas) **provavelmente NÃO precisa de mudanças**:
- `contexto.transcricao = aula.transcricao.texto` já carrega o SRT completo (Story 15.5)
- O Handlebars `{{transcricao}}` substitui com o SRT no prompt
- Os LLMs recebem o SRT como parte do prompt renderizado

**Exceção:** Se quisermos passar metadata de diarização ao contexto:
```typescript
// OPTIONAL: Adicionar metadata de diarização ao contexto
contexto.has_diarization = aula.transcricao.metadata_json?.has_diarization || false;
contexto.speaker_stats = aula.transcricao.metadata_json?.speaker_stats || null;
```
Isso permitiria usar `{{#if has_diarization}}` em prompts Handlebars para conditionals. **Recomendar mas não obrigar** — os prompts podem detectar formato SRT diretamente.

### Versioning Convention

Seguir README de prompts (`ressoa-backend/prisma/seeds/prompts/README.md`):
- **v4.0.0** = MAJOR change — SRT speaker label support é breaking change na interpretação de input
- Manter v1.0.0, v2.0.0, v3.0.0 como histórico (com `ativo: false`)
- Seed script auto-descobre JSONs no diretório (Story 5.4)

### Formato SRT que os Prompts Receberão

Exemplo real de output da Story 15.5 (campo `texto` da `Transcricao`):
```srt
1
00:00:01,200 --> 00:00:05,800
[PROFESSOR] Bom dia, turma! Hoje vamos trabalhar com frações equivalentes, habilidade EF06MA01.

2
00:00:06,100 --> 00:00:08,400
[ALUNO] Professor, frações equivalentes é aquilo de pizza?

3
00:00:08,800 --> 00:00:15,200
[PROFESSOR] Exatamente! Vamos começar com exemplos visuais.

4
00:00:15,500 --> 00:00:17,100
[ALUNO] É metade!
```

**Quando diarização desabilitada ou fallback:** SRT sem labels:
```srt
1
00:00:01,200 --> 00:00:05,800
Bom dia, turma! Hoje vamos trabalhar com frações equivalentes.
```

**Quando sem word timestamps (Google provider):** Texto puro, sem SRT.

### Existing Code Patterns to Follow

- **Prompt JSON structure:** Seguir exatamente o schema de v3.0.0 (nome, versao, modelo_sugerido, ativo, ab_testing, variaveis, conteudo)
- **Handlebars template syntax:** `{{transcricao}}`, `{{#if (eq curriculo_tipo 'BNCC')}}`, `{{#each planejamento.habilidades}}`
- **Temperatura:** Manter mesmos valores de v3.0.0 por prompt (0.3, 0.5, 0.6, 0.7, 0.4)
- **Max tokens:** Aumentar levemente se necessário (prompts SRT geram output maior com timestamps)
- **Modelo sugerido:** Manter mesmos de v3.0.0 (CLAUDE_SONNET para 1,2,3,5; GPT4_MINI para 4)

### Project Structure Notes

- Mudanças confinadas a `ressoa-backend/prisma/seeds/prompts/` (5 novos JSONs, 5 edições)
- Mudança mínima em `ressoa-backend/src/modules/analise/services/analise.service.ts` (opcional: metadata)
- Nenhuma migração de banco necessária
- Nenhuma mudança de schema Prisma
- Nenhum novo módulo ou dependência

### References

- [Source: epic-002-transcricao-enriquecida-diarizacao.md#US-015.6] — ACs e detalhes técnicos
- [Source: prompt-cobertura-v3.0.0.json] — Template base para v4.0.0
- [Source: prompt-qualitativa-v3.0.0.json] — Template base para v4.0.0
- [Source: prompt-relatorio-v3.0.0.json] — Template base para v4.0.0
- [Source: prompt-exercicios-v3.0.0.json] — Template base para v4.0.0
- [Source: prompt-alertas-v3.0.0.json] — Template base para v4.0.0
- [Source: analise.service.ts] — Orquestrador do pipeline (695 linhas)
- [Source: prompt.service.ts] — Renderização Handlebars com `renderPrompt()`
- [Source: prompts/README.md] — Versioning strategy, A/B testing docs
- [Source: project-context.md] — Multi-tenancy e patterns
- [Source: 15-5-integracao-pipeline-stt-diarizacao.md] — Story anterior: SRT output format

### Previous Story Intelligence (Stories 15.1-15.5)

**Key patterns established:**
- `Transcricao.texto` agora contém SRT enriquecido com `[PROFESSOR]`/`[ALUNO]` labels (Story 15.5)
- `metadata_json.has_diarization: boolean` indica se SRT tem labels (Story 15.5)
- `metadata_json.speaker_stats` contém breakdown professor/aluno (Story 15.5)
- Feature flag `DIARIZATION_ENABLED` controla se diarização roda (Story 15.4)
- Fallback gracioso: se diarização falhar, SRT sem labels é salvo (Story 15.5)

**Code review learnings:**
- Always run full test suite (caught broken fixtures in 15.3)
- Use `...(condition && { field: value })` spread conditional pattern
- Private helper methods tested via public API, not directly (15.3 refactor)
- `has_diarization` returns `false` when fallback (code review fix 15.5)

**Test counts (baseline — no regressions):**
- STT module: 126 tests | Analise module: 8+ tests | LLM module: varies

### Git Intelligence

**Recent commits (last 5):**
- `7dcad6b` fix(story-15.5): apply code review fixes for STT-diarization pipeline
- `67a7b9f` feat(story-15.5): integrate STT-diarization pipeline with SRT output and cost tracking
- `804fc3e` feat(story-15.4): add diarization provider configuration with feature flag toggle
- `aa39355` feat(story-15.3): add LLM-based speaker diarization service
- `7db3d32` feat(story-15.2): add word-level timestamps

**Commit message pattern:** `feat(story-15.X): <description>`
**Expected commit for this story:** `feat(story-15.6): update analysis prompts to consume SRT with speaker labels`

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation with no blockers.

### Completion Notes List

- Created 5 new v4.0.0 prompt seed files with SRT/speaker label support and backward compatibility
- Each v4.0.0 prompt includes: SRT format instructions, speaker label handling, timestamp references, and plain text fallback
- Prompt-cobertura v4.0.0: Added `speaker` field in evidences, `interacoes_relevantes` array, max_tokens 2000→2500
- Prompt-qualitativa v4.0.0: Added "Dinâmica de Interação Professor-Aluno" dimension, `participacao_alunos` object, max_tokens 1500→2000
- Prompt-relatorio v4.0.0: Added "Dinâmica de Participação" section with blockquotes and timestamps, max_tokens 3000→3500
- Prompt-exercicios v4.0.0: Added `contexto_aula` field linking exercises to specific moments and student doubts
- Prompt-alertas v4.0.0: Added `PARTICIPACAO_DESEQUILIBRADA` and `INTERACAO_FREQUENTE` alert types, `speaker_analysis` JSON object, max_tokens 1500→2000
- Deactivated all 5 v3.0.0 prompts (`ativo: false`)
- Added diarization metadata (`has_diarization`, `speaker_stats`) to pipeline context in `analise.service.ts` using conditional spread pattern
- Added 30 new tests: 5 context/metadata tests + 25 seed file validation tests (5 v4 ativo, 5 v3 ativo, 5 speaker labels, 5 backward compat, 5 specific fields)
- All 61 analise service tests passing (30 new for Story 15.6), 0 regressions introduced (6 pre-existing failures in unrelated suites)

### Change Log

- 2026-02-16: Story 15.6 implementation complete — 5 v4.0.0 prompts created, 5 v3.0.0 deactivated, analise.service.ts updated with diarization metadata, 30 new tests added
- 2026-02-16: Code review fixes — replaced `as any` with typed `TranscricaoMetadataJson` interface, corrected test count documentation

### File List

**New files:**
- `ressoa-backend/prisma/seeds/prompts/prompt-cobertura-v4.0.0.json`
- `ressoa-backend/prisma/seeds/prompts/prompt-qualitativa-v4.0.0.json`
- `ressoa-backend/prisma/seeds/prompts/prompt-relatorio-v4.0.0.json`
- `ressoa-backend/prisma/seeds/prompts/prompt-exercicios-v4.0.0.json`
- `ressoa-backend/prisma/seeds/prompts/prompt-alertas-v4.0.0.json`

**Modified files:**
- `ressoa-backend/prisma/seeds/prompts/prompt-cobertura-v3.0.0.json` (ativo: true → false)
- `ressoa-backend/prisma/seeds/prompts/prompt-qualitativa-v3.0.0.json` (ativo: true → false)
- `ressoa-backend/prisma/seeds/prompts/prompt-relatorio-v3.0.0.json` (ativo: true → false)
- `ressoa-backend/prisma/seeds/prompts/prompt-exercicios-v3.0.0.json` (ativo: true → false)
- `ressoa-backend/prisma/seeds/prompts/prompt-alertas-v3.0.0.json` (ativo: true → false)
- `ressoa-backend/src/modules/analise/services/analise.service.ts` (added diarization metadata to context, typed TranscricaoMetadataJson)
- `ressoa-backend/src/modules/analise/services/analise.service.spec.ts` (added 30 new tests for Story 15.6)
