# Story 14.4: Integração do Router com Pipeline de Análise

**Epic:** 14 - Sistema Configurável de Provider Routing
**Status:** Backlog
**Complexity:** M (5 pontos)
**Priority:** P0

---

## 📋 User Story

> **Como** pipeline de análise
> **Quero** usar o ProviderRouter para selecionar providers dinamicamente
> **Para que** cada prompt use o provider configurado em `providers.config.json` sem code changes

---

## ✅ Acceptance Criteria

- [ ] **AC1:** `AnaliseService` refatorado para usar `LLMRouter.getLLMProvider(analysisType)` em vez de chamar `ClaudeProvider` diretamente
- [ ] **AC2:** `STTService` refatorado para usar `STTRouter.getSTTProvider()` em vez de chamar `WhisperSTTService` diretamente
- [ ] **AC3:** Config padrão criado em `providers.config.json` (raiz do projeto) com Groq + Gemini como primários
- [ ] **AC4:** Se provider primário falhar (timeout, API error), sistema automaticamente tenta fallback
- [ ] **AC5:** Logs mostram claramente: provider primário tentado, fallback usado (se aplicável), custo total da operação
- [ ] **AC6:** Análise completa (5 prompts) registra breakdown de custos por provider em JSON estruturado
- [ ] **AC7:** Testes E2E: processa 1 aula completa (upload áudio → STT → 5 prompts LLM) com novo setup → valida análise bem-sucedida + providers corretos + custo ~$0.053
- [ ] **AC8:** Fallback testado: forçar falha de provider primário e validar que fallback é usado
- [ ] **AC9:** Compatibilidade backward: providers antigos (OpenAI Whisper + Claude) continuam funcionando
- [ ] **AC10:** Documentação atualizada: README com instruções de configuração de providers

---

## 📁 Arquivos Criados/Modificados

### Novos Arquivos
- `providers.config.json` (raiz do projeto)
- `test/analise-pipeline-routed.e2e-spec.ts`

### Modificados
- `src/modules/analise/services/analise.service.ts` (usar LLMRouter)
- `src/modules/analise/services/analise.service.spec.ts` (atualizar testes)
- `src/modules/stt/stt.service.ts` (usar STTRouter)
- `src/modules/stt/stt.service.spec.ts` (atualizar testes)
- `README.md` (seção de configuração de providers)
- `prisma/schema.prisma` (adicionar campos de custo por provider em `Analise`)

---

## 🔧 Technical Notes

### Config Padrão (providers.config.json)
```json
{
  "version": "1.0.0",
  "stt": {
    "primary": "GROQ_WHISPER_TURBO",
    "fallback": "OPENAI_WHISPER"
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

### Breakdown de Custos (Analise entity)
Adicionar campos:
- `custo_stt_usd: Decimal`
- `provider_stt: String`
- `custo_llm_cobertura_usd: Decimal`
- `provider_llm_cobertura: String`
- (repetir para qualitativa, relatorio, exercicios, alertas)
- `custo_total_usd: Decimal` (soma de todos)

### Router Injection
```typescript
// analise.service.ts
constructor(
  private readonly llmRouter: LLMRouter,
  private readonly sttRouter: STTRouter,
) {}

async analisarCobertura(transcricao: string, planejamento: any) {
  const provider = await this.llmRouter.getLLMProvider('analise_cobertura');
  const result = await provider.generate(prompt);
  // ... salvar custo e provider usado
}
```

---

## 🧪 Testing Strategy

### Unit Tests
- Mock LLMRouter e STTRouter
- Validar que services chamam routers corretamente
- Validar que custos são salvos corretamente

### E2E Tests
1. **Happy Path:** Processar 1 aula completa com config otimizado → validar sucesso + custos corretos
2. **Fallback:** Forçar falha de Groq → validar que OpenAI Whisper é usado
3. **Backward Compatibility:** Config com providers antigos → validar que funciona

---

## 📚 Dependencies

- **Blockeada por:** Stories 14.1, 14.2, 14.3 (routers e providers precisam existir)
- **Bloqueia:** Story 14.5 (dashboard de custos precisa dos campos de custo)

---

**Created:** 2026-02-14
**Assigned to:** -
**Estimated Hours:** 10-12h
