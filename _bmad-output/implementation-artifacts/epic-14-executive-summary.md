# Epic 14: Provider Routing - Executive Summary

**Data:** 2026-02-14
**Autor:** Luisneto98 (Product Owner)
**Status:** Aprovado para Backlog

---

## 🎯 O Que É?

Sistema de roteamento configurável de providers de IA que permite **trocar providers via arquivo de configuração** (sem mudanças de código) para otimizar custos operacionais.

---

## 💰 Por Que Importa?

### **Impacto Financeiro Direto**

| Métrica | Atual | Otimizado | Economia |
|---------|-------|-----------|----------|
| **Custo por aula** | R$2.43 | R$0.27 | **-89%** |
| **1 escola (400 aulas/mês)** | R$972/mês | R$108/mês | **R$10.368/ano** |
| **100 escolas** | R$97.200/mês | R$10.800/mês | **R$1.036.800/ano** |

### **ROI do Desenvolvimento**
- **Investimento:** ~10 dias dev = R$8.000
- **Payback:** 9 dias (100 escolas) ou 1 mês (1 escola)
- **Retorno em 1 ano:** 13.000% ROI (100 escolas)

---

## 🔧 Como Funciona?

### **Antes (Hard-coded):**
```typescript
// Código rígido - mudar provider = deploy
const provider = new ClaudeProvider();
const result = await provider.generate(prompt);
```

### **Depois (Configurável):**
```json
// providers.config.json - mudar provider = editar arquivo
{
  "llm": {
    "analise_cobertura": {
      "primary": "GEMINI_FLASH",  // ← trocar aqui
      "fallback": "CLAUDE_SONNET"
    }
  }
}
```

**Zero downtime. Zero deploy. Zero risco.**

---

## 📊 Providers Propostos

### **STT (Speech-to-Text)**
| Provider | Atual | Novo | Economia |
|----------|-------|------|----------|
| OpenAI Whisper | $0.36/h ✅ Atual | - | - |
| **Groq Whisper Turbo** | - | $0.04/h 🚀 Novo | **-89%** |

### **LLM (Análise Pedagógica)**
| Provider | Atual | Novo | Uso Proposto |
|----------|-------|------|--------------|
| Claude Sonnet 4 | $3/$15 per 1M ✅ Atual | - | Fallback |
| **Gemini 2.0 Flash** | - | $0.10/$0.40 per 1M 🚀 Novo | Análise Principal |
| GPT-4o mini | $0.15/$0.60 per 1M ✅ Atual | - | Exercícios (manter) |

---

## 📦 Escopo (5 Stories)

| # | Story | Pontos | Descrição |
|---|-------|--------|-----------|
| 14.1 | Routing Layer | 5 | Infraestrutura de roteamento configurável |
| 14.2 | Groq Whisper | 3 | Provider STT 89% mais barato |
| 14.3 | Gemini Flash | 5 | Provider LLM 92% mais barato |
| 14.4 | Integração | 5 | Conectar pipeline com routers |
| 14.5 | Dashboard | 3 | Visibilidade de custos |
| **TOTAL** | **21 pontos** | **~1.5-2 sprints** |

---

## ⏱️ Timeline

```
Sprint 1 (Semanas 1-2):
├─ Stories 14.1, 14.2, 14.3
├─ POC com 30 aulas reais
└─ Validação de qualidade

Sprint 2 (Semanas 3-4):
├─ Stories 14.4, 14.5
├─ Testes E2E completos
└─ Rollout 10% → 50% → 100%

Total: ~30 dias (4 semanas)
```

---

## ✅ Success Criteria

### **Métricas de Negócio (90 dias pós-rollout)**
- [ ] Custo médio/aula ≤ R$0.30 (economia ≥85%)
- [ ] Economia acumulada ≥ R$20.000 (10 escolas)
- [ ] Taxa de aprovação de relatórios ≥ 80% (mantida vs baseline)

### **Métricas Técnicas**
- [ ] Uptime combinado ≥ 99.5%
- [ ] Latência STT ≤ 60s (50min áudio)
- [ ] Latência LLM ≤ 30s (por prompt)

### **Métricas de Qualidade**
- [ ] WER Groq ≤ 15% (validado com 30 áudios)
- [ ] Aprovação Gemini ≥ 75% (vs Claude 80%)

---

## ⚠️ Riscos & Mitigações

| Risco | Prob | Mitigação |
|-------|------|-----------|
| Gemini piora qualidade | M | POC + fallback automático para Claude |
| Groq STT pior em PT-BR | M | Testar 10 áudios reais + fallback OpenAI |
| Rate limits | B | Retry + fallback + queue (Bull) |
| Config inválida | B | Schema validation + defaults seguros |

---

## 🚀 Rollout Plan

1. **Desenvolvimento** (Semanas 1-2): Implementar + POC
2. **Testes** (Semana 3): E2E + validação qualidade
3. **Gradual** (Semanas 4-6):
   - 10% escolas (piloto)
   - 50% escolas (monitorar)
   - 100% escolas (se métricas OK)

**Rollback:** 1 linha de mudança em `providers.config.json` (zero downtime)

---

## 💡 Benefícios Adicionais

### **Além da Economia de Custos:**

1. **Flexibilidade Comercial**
   - Testar preços mais agressivos (margem maior)
   - Oferecer planos Premium/Basic com providers diferentes

2. **Resiliência Operacional**
   - Fallback automático se provider falhar
   - Zero vendor lock-in

3. **A/B Testing Facilitado**
   - Testar providers por escola/professor
   - Validar qualidade antes de rollout 100%

4. **Visibilidade de Custos**
   - Dashboard Admin mostra breakdown por provider
   - Decisões baseadas em dados reais

---

## 📋 Checklist de Aprovação

- [x] ROI calculado e validado (13.000% em 1 ano)
- [x] Riscos identificados e mitigados
- [x] Success criteria definidos
- [x] Rollout plan detalhado
- [x] Stories criadas e estimadas (21 pontos)
- [x] Dependencies mapeadas
- [ ] Aprovação do Tech Lead (pendente)
- [ ] Aprovação do Product Owner (pendente)

---

## 🎬 Próximos Passos

1. **Revisão Técnica:** Tech Lead revisar arquitetura proposta
2. **Priorização:** PM adicionar ao backlog do próximo sprint
3. **Kickoff:** SM convocar reunião de planning para Epic 14

---

**Perguntas?** Contato: Luisneto98

**Documentos Relacionados:**
- Epic completo: `epic-14-provider-routing-configuravel.md`
- Stories individuais: `14-1-*.md` até `14-5-*.md`
- Sprint status: `sprint-status.yaml`
