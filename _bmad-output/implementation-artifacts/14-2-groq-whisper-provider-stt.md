# Story 14.2: Implementar Groq Whisper Provider (STT)

**Epic:** 14 - Sistema Configurável de Provider Routing
**Status:** Backlog
**Complexity:** S (3 pontos)
**Priority:** P0

---

## 📋 User Story

> **Como** sistema
> **Quero** suporte para Groq Whisper Large v3 Turbo
> **Para que** possa reduzir custo de STT em 89% ($0.36 → $0.04/hora) mantendo qualidade

---

## ✅ Acceptance Criteria

- [ ] **AC1:** `GroqWhisperProvider` criado implementando interface `STTProvider`
- [ ] **AC2:** Suporta 3 modelos Groq via env var `GROQ_WHISPER_MODEL` (whisper-large-v3-turbo, distil-whisper, whisper-large-v3)
- [ ] **AC3:** Provider calcula custo real baseado em: `(duration_minutes / 60) * COST_PER_HOUR`
- [ ] **AC4:** Retorna `TranscriptionResult` normalizado (compatível com `WhisperSTTService`)
- [ ] **AC5:** Logs estruturados incluem: modelo usado, tempo processamento (ms), custo (USD), confidence score
- [ ] **AC6:** Error handling: timeout (300s), rate limit (retry 3x), API errors (mensagens claras)
- [ ] **AC7:** Testes unitários: mock Groq API, validação de output, cálculo de custo, error handling
- [ ] **AC8:** Teste E2E: processa 1 áudio real de 50min e valida transcrição + confidence ≥0.85 + custo ~$0.033 + tempo <60s
- [ ] **AC9:** Health check via `isAvailable()` method
- [ ] **AC10:** Cobertura de testes ≥85%

---

## 📁 Arquivos Criados/Modificados

### Novos Arquivos
- `src/modules/stt/providers/groq-whisper.provider.ts`
- `src/modules/stt/providers/groq-whisper.provider.spec.ts`
- `test/stt/groq-whisper-provider.e2e-spec.ts`

### Modificados
- `.env.example` (adicionar `GROQ_API_KEY`, `GROQ_WHISPER_MODEL`)
- `src/modules/stt/stt.module.ts` (registrar GroqWhisperProvider)
- `package.json` (adicionar dependência `groq-sdk`)

---

## 🔧 Technical Notes

### API Groq
- Compatível com OpenAI Whisper API (facilitação migração)
- Rate limit: 30 requests/min (menor que OpenAI 50 RPM)
- Pricing: $0.04/hora (Turbo), $0.02/hora (Distil), $0.111/hora (Large v3)

### Variáveis de Ambiente
```bash
GROQ_API_KEY=gsk_...
GROQ_WHISPER_MODEL=whisper-large-v3-turbo
```

### Dependências
```json
{
  "groq-sdk": "^0.7.0"
}
```

---

## 🧪 Testing Strategy

### Unit Tests
- Mock Groq API (sucesso e erro)
- Validar output normalizado
- Validar cálculo de custo correto
- Error handling (timeout, rate limit, API error)

### E2E Test
- Processar 1 áudio real de 50min
- Validar: transcrição retornada, confidence ≥0.85, custo ~$0.033, tempo <60s

---

## 📚 Dependencies

- **Blockeada por:** Story 14.1 (STTRouter precisa existir)
- **Bloqueia:** Story 14.4 (integração com pipeline)

---

**Created:** 2026-02-14
**Assigned to:** -
**Estimated Hours:** 6-8h
