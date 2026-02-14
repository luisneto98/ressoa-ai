# Story 14.5: Dashboard de Custos por Provider

**Epic:** 14 - Sistema Configurável de Provider Routing
**Status:** Backlog
**Complexity:** S (3 pontos)
**Priority:** P1 (nice-to-have, não blocker)

---

## 📋 User Story

> **Como** Product Owner
> **Quero** ver em dashboard quanto cada provider está custando
> **Para que** possa validar economia real e ajustar configuração baseado em dados

---

## ✅ Acceptance Criteria

- [ ] **AC1:** Endpoint `GET /api/v1/admin/analytics/provider-costs` criado (apenas Admin)
- [ ] **AC2:** Query params: `?period=last_7_days|last_30_days|last_90_days` (default: `last_30_days`)
- [ ] **AC3:** Retorna breakdown por provider com estrutura JSON detalhada (provider, tipo, operações, custo total, custo médio, latência média)
- [ ] **AC4:** Dados agregados de tabela `Analise` (campos: `custo_stt_usd`, `custo_llm_*_usd`, `provider_stt`, `provider_llm_*`)
- [ ] **AC5:** RBAC guard: apenas usuários com role `ADMIN` podem acessar
- [ ] **AC6:** Swagger docs: endpoint documentado com exemplo de response
- [ ] **AC7:** Testes unitários: mock repository, validação de agregação, cálculo de savings
- [ ] **AC8:** Teste E2E: processar 5 aulas → chamar endpoint → validar custos corretos
- [ ] **AC9:** Performance: query otimizada com índices em `created_at` e `provider_*`
- [ ] **AC10:** Frontend dashboard (opcional - pode ser Story futura): gráfico de custos por provider (recharts)

---

## 📁 Arquivos Criados/Modificados

### Novos Arquivos
- `src/modules/admin/services/provider-analytics.service.ts`
- `src/modules/admin/services/provider-analytics.service.spec.ts`
- `src/modules/admin/dto/provider-costs-response.dto.ts`
- `test/admin-provider-costs.e2e-spec.ts`

### Modificados
- `src/modules/admin/admin.controller.ts` (adicionar endpoint)
- `prisma/schema.prisma` (adicionar índices para performance)

---

## 🔧 Technical Notes

### Endpoint Response Example
```json
{
  "period": "last_30_days",
  "total_cost_usd": 21.50,
  "total_operations": 400,
  "avg_cost_per_operation": 0.0538,
  "by_provider": [
    {
      "provider": "GROQ_WHISPER_TURBO",
      "type": "STT",
      "operations": 400,
      "total_cost_usd": 13.20,
      "avg_cost_per_operation": 0.033,
      "avg_latency_ms": 8500
    },
    {
      "provider": "GEMINI_FLASH",
      "type": "LLM",
      "operations": 1600,
      "total_cost_usd": 22.40,
      "avg_cost_per_operation": 0.014,
      "avg_latency_ms": 4200
    }
  ],
  "savings_vs_baseline": {
    "baseline_provider": "CLAUDE_SONNET + OPENAI_WHISPER",
    "baseline_cost_usd": 194.40,
    "current_cost_usd": 38.00,
    "savings_usd": 156.40,
    "savings_percent": 80.45
  }
}
```

### SQL Query (Aggregate)
```sql
SELECT
  provider_stt,
  COUNT(*) as operations,
  SUM(custo_stt_usd) as total_cost,
  AVG(custo_stt_usd) as avg_cost,
  AVG(tempo_processamento_stt_ms) as avg_latency
FROM Analise
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY provider_stt
```

### Performance Índices
```sql
CREATE INDEX idx_analise_created_at_provider
ON Analise(created_at, provider_stt, provider_llm_cobertura);
```

### Baseline Cost (Hardcoded)
- Claude Sonnet 4: $0.18/aula
- OpenAI Whisper: $0.30/aula
- **Total baseline:** $0.48/aula

---

## 🧪 Testing Strategy

### Unit Tests
- Mock `AnaliseRepository`
- Validar agregação correta (SUM, AVG, COUNT)
- Validar cálculo de savings correto
- Validar período filtering (last_7_days, last_30_days)

### E2E Test
1. Processar 5 aulas (criar dados reais)
2. Chamar endpoint `GET /api/v1/admin/analytics/provider-costs`
3. Validar custos corretos por provider
4. Validar savings calculation

### Performance Test (opcional)
- Query com 10.000 análises → validar tempo <2s

---

## 📚 Dependencies

- **Blockeada por:** Story 14.4 (campos de custo precisam existir em `Analise`)
- **Bloqueia:** Nenhuma

---

**Created:** 2026-02-14
**Assigned to:** -
**Estimated Hours:** 6-8h
