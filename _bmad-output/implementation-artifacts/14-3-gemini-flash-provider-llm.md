# Story 14.3: Implementar Gemini 2.0 Flash Provider (LLM)

**Epic:** 14 - Sistema Configurável de Provider Routing
**Status:** Backlog
**Complexity:** M (5 pontos)
**Priority:** P0

---

## 📋 User Story

> **Como** sistema
> **Quero** suporte para Google Gemini 2.0 Flash
> **Para que** possa reduzir custo de análise pedagógica em 92% ($0.18 → $0.014/aula) mantendo qualidade

---

## ✅ Acceptance Criteria

- [ ] **AC1:** `GeminiProvider` criado implementando interface `LLMProvider`
- [ ] **AC2:** Suporta modelo `gemini-2.0-flash-001` via env var `GEMINI_MODEL`
- [ ] **AC3:** Provider calcula custo real: Input ($0.10/1M tokens), Output ($0.40/1M tokens)
- [ ] **AC4:** Retorna `LLMResult` normalizado (compatível com `ClaudeProvider`)
- [ ] **AC5:** Suporta context window de até 1M tokens
- [ ] **AC6:** Suporta `systemPrompt` configurável (igual Claude/GPT)
- [ ] **AC7:** Logs estruturados: modelo, tokens (input/output), custo (USD), latência (ms), stop_reason
- [ ] **AC8:** Error handling: timeout (120s), rate limit (retry 3x), API errors, safety filters
- [ ] **AC9:** Testes unitários: mock Google AI API, validação JSON output, cálculo de custo
- [ ] **AC10:** Teste E2E: executa Prompt 1 (Cobertura BNCC) com transcrição real → valida output JSON + habilidades ≥1 + custo ~$0.014 + tempo <30s

---

## 📁 Arquivos Criados/Modificados

### Novos Arquivos
- `src/modules/llm/providers/gemini.provider.ts`
- `src/modules/llm/providers/gemini.provider.spec.ts`
- `test/llm/gemini-provider.e2e-spec.ts`

### Modificados
- `.env.example` (adicionar `GOOGLE_AI_API_KEY`, `GEMINI_MODEL`)
- `src/modules/llm/llm.module.ts` (registrar GeminiProvider)
- `package.json` (adicionar dependência `@google/generative-ai`)
- `prisma/schema.prisma` (adicionar `GEMINI_FLASH` ao enum `ProviderLLM` se necessário)

---

## 🔧 Technical Notes

### Google Generative AI SDK
- SDK usa streaming por padrão - desabilitar para obter output completo
- Gemini tem safety filters que podem bloquear output - implementar handling
- Rate limit: 360 RPM (muito maior que Claude 50 RPM)
- Pricing: $0.10/1M input, $0.40/1M output

### Variáveis de Ambiente
```bash
GOOGLE_AI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.0-flash-001
```

### Dependências
```json
{
  "@google/generative-ai": "^0.21.0"
}
```

### Safety Filters Handling
Se Gemini bloquear por safety (raro em contexto pedagógico):
- Log warning com detalhes do bloqueio
- Tentar fallback provider (Claude ou GPT)

---

## 🧪 Testing Strategy

### Unit Tests
- Mock Google AI API (sucesso e erro)
- Validar output JSON normalizado
- Validar cálculo de custo correto
- Error handling (timeout, rate limit, safety block)

### E2E Test
- Executar Prompt 1 (Cobertura BNCC) com transcrição real
- Validar: output JSON válido (schema), habilidades detectadas ≥1, custo ~$0.014, tempo <30s

---

## 📚 Dependencies

- **Blockeada por:** Story 14.1 (LLMRouter precisa existir)
- **Bloqueia:** Story 14.4 (integração com pipeline)

---

**Created:** 2026-02-14
**Assigned to:** -
**Estimated Hours:** 10-12h
