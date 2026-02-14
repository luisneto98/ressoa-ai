# Epic 14: Sistema Configurável de Provider Routing (IA Cost Optimization)

**Status:** Backlog
**Created:** 2026-02-14
**Estimated Effort:** 5 stories, ~1.5-2 sprints (~21 pontos)
**Priority:** CRITICAL (impacto direto em margem operacional - economia de 89%)

---

## 🎯 Goal

Implementar sistema de roteamento configurável de providers de IA (STT e LLM) que permite **trocar providers via configuração** (sem code changes) para **reduzir custos operacionais em 89%** (de R$0.93/aula para R$0.27/aula), mantendo qualidade pedagógica e permitindo A/B testing fácil.

---

## 👥 User Outcome

- **Product Owner** pode alterar providers de IA em produção apenas mudando `.env` ou `providers.config.json` (zero downtime, zero deploy)
- **Tech Lead** tem visibilidade de custos por provider em dashboard e pode otimizar configuração baseado em dados reais
- **Professor** não percebe mudança (qualidade mantida) mas custos operacionais caem 89%, aumentando margem do produto
- **Time de Vendas** pode oferecer preços mais competitivos com margem saudável

---

## 📋 FRs Covered

- **Novo:** FR54: Sistema deve suportar múltiplos providers de STT (Groq Whisper, OpenAI Whisper) com roteamento configurável
- **Novo:** FR55: Sistema deve suportar múltiplos providers de LLM (Gemini 2.0 Flash, Claude, GPT-4o mini) com roteamento configurável por tipo de análise
- **Novo:** FR56: Sistema deve ter fallback automático se provider primário falhar
- **Novo:** FR57: Dashboard Admin deve mostrar custos por provider para análise e otimização
- **Aprimoramento de:** FR18 (transcrição de áudio), FR19 (análise pedagógica por IA), FR46 (monitoramento de custos)

---

## 💰 Business Impact

### **ROI Projetado**

**Custo Atual (baseline):**
- STT (OpenAI Whisper): $0.30/aula
- LLM (Claude Sonnet 4): $0.186/aula
- **Total: $0.486/aula (~R$2.43 @ R$5/USD)**

**Custo Projetado (otimizado):**
- STT (Groq Whisper Large v3 Turbo): $0.033/aula
- LLM (Gemini 2.0 Flash): $0.014/aula
- LLM (GPT-4o mini - exercícios): $0.006/aula
- **Total: $0.053/aula (~R$0.27)**

**Economia:** **89%** (R$2.16/aula)

### **Impacto Financeiro**

| Escala | Aulas/Mês | Economia Mensal | Economia Anual |
|--------|-----------|-----------------|----------------|
| **1 escola** | 400 | R$864 | R$10.368 |
| **10 escolas** | 4.000 | R$8.640 | R$103.680 |
| **100 escolas** | 40.000 | R$86.400 | **R$1.036.800** |

**ROI do desenvolvimento:**
- Investimento: ~10 dias dev = ~R$8.000
- Payback: **~9 dias** (com 100 escolas) ou **~1 mês** (com 1 escola)

---

## 🚀 Key Deliverables

### Backend - Provider Infrastructure
- [ ] `ProviderRouter` service para STT com roteamento configurável
- [ ] `LLMRouter` service para LLM com roteamento por tipo de análise (cobertura, qualitativa, relatório, exercícios, alertas)
- [ ] `GroqWhisperProvider` implementando interface `STTProvider`
- [ ] `GeminiProvider` implementando interface `LLMProvider`
- [ ] Sistema de fallback automático (primary → fallback → error)
- [ ] Hot-reload de configuração (sem restart)

### Configuration Layer
- [ ] Schema de configuração em JSON com validação via Zod
- [ ] Suporte para configuração via `.env` (secrets) + `providers.config.json` (routing logic)
- [ ] Defaults seguros (fallback para providers atuais se config inválida)

### Integration & Testing
- [ ] `AnaliseService` e `STTService` integrados com routers
- [ ] Testes E2E: aula completa processada com novo setup
- [ ] Validação de qualidade: 30 aulas reais processadas com Gemini vs Claude (comparação)

### Monitoring & Analytics
- [ ] Dashboard Admin: custos por provider (breakdown detalhado)
- [ ] Logs estruturados: provider usado, latência, custo, success/failure
- [ ] Endpoint `/api/v1/admin/analytics/provider-costs` (métricas agregadas)

---

## 📦 Stories

### **Story 14.1: Camada de Roteamento Configurável**
**Complexidade:** M (5 pontos) | **Prioridade:** P0 (blocker)

**User Story:**
> Como desenvolvedor, quero uma camada de roteamento que leia configuração e roteia operações para providers específicos, para que o sistema decida em runtime qual provider usar sem code changes.

**Acceptance Criteria:**
- [ ] AC1: `ProviderRouter` service criado para STT com métodos `getSTTProvider(operation)` e `getSTTFallback()`
- [ ] AC2: `LLMRouter` service criado para LLM com método `getLLMProvider(analysisType: 'cobertura' | 'qualitativa' | 'relatorio' | 'exercicios' | 'alertas')`
- [ ] AC3: Config suporta estrutura:
```typescript
{
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
- [ ] AC4: Router tenta primary → se falhar, tenta fallback → se falhar, throw error com contexto claro
- [ ] AC5: Logs estruturados (Pino) registram: provider tentado, fallback usado (se aplicável), latência, custo, success/failure
- [ ] AC6: Suporta hot-reload de config via `ConfigService.watch()` (sem restart do servidor)
- [ ] AC7: Validação de schema via Zod com mensagens de erro claras
- [ ] AC8: Defaults seguros: se config inválida ou ausente, usa providers atuais (OpenAI Whisper + Claude)
- [ ] AC9: Testes unitários: mock providers, validação de roteamento, fallback behavior, config inválida
- [ ] AC10: Cobertura de testes ≥85%

**Arquivos:**
- `src/modules/stt/services/stt-router.service.ts` (novo)
- `src/modules/stt/services/stt-router.service.spec.ts` (novo)
- `src/modules/llm/services/llm-router.service.ts` (novo)
- `src/modules/llm/services/llm-router.service.spec.ts` (novo)
- `src/config/providers.config.ts` (novo - schema Zod + loader)
- `src/config/providers.config.spec.ts` (novo)

**Technical Notes:**
- Router usa Dependency Injection (NestJS) para obter providers
- Config loader usa `ConfigService` do NestJS
- Fallback logic com retry exponential backoff (3 tentativas, 1s → 2s → 4s)

---

### **Story 14.2: Implementar Groq Whisper Provider (STT)**
**Complexidade:** S (3 pontos) | **Prioridade:** P0

**User Story:**
> Como sistema, quero suporte para Groq Whisper Large v3 Turbo, para que possa reduzir custo de STT em 89% ($0.36 → $0.04/hora) mantendo qualidade.

**Acceptance Criteria:**
- [ ] AC1: `GroqWhisperProvider` criado implementando interface `STTProvider`
- [ ] AC2: Suporta 3 modelos Groq via env var `GROQ_WHISPER_MODEL`:
  - `whisper-large-v3-turbo` ($0.04/hora) - primário
  - `distil-whisper` ($0.02/hora) - ultra barato
  - `whisper-large-v3` ($0.111/hora) - máxima qualidade
- [ ] AC3: Provider calcula custo real baseado em: `(duration_minutes / 60) * COST_PER_HOUR`
- [ ] AC4: Retorna `TranscriptionResult` normalizado (compatível com `WhisperSTTService`)
- [ ] AC5: Logs estruturados incluem: modelo usado, tempo processamento (ms), custo (USD), confidence score
- [ ] AC6: Error handling: timeout (300s), rate limit (retry 3x), API errors (mensagens claras)
- [ ] AC7: Testes unitários: mock Groq API, validação de output, cálculo de custo, error handling
- [ ] AC8: Teste E2E: processa 1 áudio real de 50min e valida:
  - Transcrição retornada
  - Confidence ≥0.85
  - Custo calculado correto (~$0.033)
  - Tempo processamento <60s
- [ ] AC9: Health check via `isAvailable()` method
- [ ] AC10: Cobertura de testes ≥85%

**Arquivos:**
- `src/modules/stt/providers/groq-whisper.provider.ts` (novo)
- `src/modules/stt/providers/groq-whisper.provider.spec.ts` (novo)
- `test/stt/groq-whisper-provider.e2e-spec.ts` (novo)

**Variáveis de ambiente:**
```bash
# .env
GROQ_API_KEY=gsk_...
GROQ_WHISPER_MODEL=whisper-large-v3-turbo  # ou distil-whisper, whisper-large-v3
```

**Dependências:**
```json
{
  "groq-sdk": "^0.7.0"
}
```

**Technical Notes:**
- Groq API é compatível com OpenAI Whisper API (facilitação migração)
- Rate limit Groq: 30 requests/min (menor que OpenAI 50 RPM) - considerar queue
- Pricing Groq: $0.04/hora (Turbo), $0.02/hora (Distil), $0.111/hora (Large v3)

---

### **Story 14.3: Implementar Gemini 2.0 Flash Provider (LLM)**
**Complexidade:** M (5 pontos) | **Prioridade:** P0

**User Story:**
> Como sistema, quero suporte para Google Gemini 2.0 Flash, para que possa reduzir custo de análise pedagógica em 92% ($0.18 → $0.014/aula) mantendo qualidade.

**Acceptance Criteria:**
- [ ] AC1: `GeminiProvider` criado implementando interface `LLMProvider`
- [ ] AC2: Suporta modelo `gemini-2.0-flash-001` via env var `GEMINI_MODEL`
- [ ] AC3: Provider calcula custo real:
  - Input: `(tokens_input / 1_000_000) * 0.10` USD
  - Output: `(tokens_output / 1_000_000) * 0.40` USD
- [ ] AC4: Retorna `LLMResult` normalizado (compatível com `ClaudeProvider`)
- [ ] AC5: Suporta context window de até 1M tokens
- [ ] AC6: Suporta `systemPrompt` configurável (igual Claude/GPT)
- [ ] AC7: Logs estruturados incluem: modelo usado, tokens (input/output), custo (USD), latência (ms), stop_reason
- [ ] AC8: Error handling: timeout (120s), rate limit (retry 3x exponential backoff), API errors, safety filters (se Gemini bloquear por safety)
- [ ] AC9: Testes unitários: mock Google AI API, validação JSON output, cálculo de custo, error handling
- [ ] AC10: Teste E2E: executa Prompt 1 (Cobertura BNCC) com transcrição real de 50min e valida:
  - Output JSON válido (schema Prompt 1)
  - Habilidades detectadas ≥1
  - Custo calculado ~$0.014
  - Tempo processamento <30s

**Arquivos:**
- `src/modules/llm/providers/gemini.provider.ts` (novo)
- `src/modules/llm/providers/gemini.provider.spec.ts` (novo)
- `test/llm/gemini-provider.e2e-spec.ts` (novo)

**Variáveis de ambiente:**
```bash
# .env
GOOGLE_AI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.0-flash-001
```

**Dependências:**
```json
{
  "@google/generative-ai": "^0.21.0"
}
```

**Technical Notes:**
- Google Generative AI SDK usa streaming por padrão - desabilitar para obter output completo
- Gemini tem safety filters que podem bloquear output - implementar handling
- Rate limit Gemini: 360 RPM (muito maior que Claude 50 RPM)
- Pricing Gemini: $0.10/1M input, $0.40/1M output

---

### **Story 14.4: Integração do Router com Pipeline de Análise**
**Complexidade:** M (5 pontos) | **Prioridade:** P0

**User Story:**
> Como pipeline de análise, quero usar o ProviderRouter para selecionar providers dinamicamente, para que cada prompt use o provider configurado em `providers.config.json` sem code changes.

**Acceptance Criteria:**
- [ ] AC1: `AnaliseService` refatorado para usar `LLMRouter.getLLMProvider(analysisType)` em vez de chamar `ClaudeProvider` diretamente
- [ ] AC2: `STTService` refatorado para usar `STTRouter.getSTTProvider()` em vez de chamar `WhisperSTTService` diretamente
- [ ] AC3: Config padrão criado em `providers.config.json` (raiz do projeto):
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
- [ ] AC4: Se provider primário falhar (timeout, API error), sistema automaticamente tenta fallback
- [ ] AC5: Logs mostram claramente: provider primário tentado, fallback usado (se aplicável), custo total da operação
- [ ] AC6: Análise completa (5 prompts) registra breakdown de custos:
```typescript
{
  "analise_id": "uuid",
  "custos": {
    "stt": { "provider": "GROQ_WHISPER_TURBO", "custo_usd": 0.033 },
    "llm_cobertura": { "provider": "GEMINI_FLASH", "custo_usd": 0.0035 },
    "llm_qualitativa": { "provider": "GEMINI_FLASH", "custo_usd": 0.0035 },
    "llm_relatorio": { "provider": "GEMINI_FLASH", "custo_usd": 0.0035 },
    "llm_exercicios": { "provider": "GPT4_MINI", "custo_usd": 0.006 },
    "llm_alertas": { "provider": "GEMINI_FLASH", "custo_usd": 0.0035 },
    "total_usd": 0.053
  }
}
```
- [ ] AC7: Testes E2E: processa 1 aula completa (upload áudio → STT → 5 prompts LLM) com novo setup e valida:
  - Análise completa bem-sucedida
  - Providers corretos usados conforme config
  - Custo total ~$0.053
  - Output JSON válido em todos os 5 prompts
- [ ] AC8: Fallback testado: forçar falha de provider primário e validar que fallback é usado
- [ ] AC9: Compatibilidade backward: providers antigos (OpenAI Whisper + Claude) continuam funcionando
- [ ] AC10: Documentação atualizada: README com instruções de configuração de providers

**Arquivos afetados:**
- `src/modules/analise/services/analise.service.ts`
- `src/modules/analise/services/analise.service.spec.ts`
- `src/modules/stt/stt.service.ts`
- `src/modules/stt/stt.service.spec.ts`
- `providers.config.json` (novo - raiz do projeto)
- `test/analise-pipeline-routed.e2e-spec.ts` (novo)
- `README.md` (atualizar seção de configuração)

**Technical Notes:**
- Router injection via NestJS DI (constructor injection)
- Config loader usa singleton pattern (cache de config)
- Logs devem incluir `analysis_id` para rastreabilidade

---

### **Story 14.5: Dashboard de Custos por Provider**
**Complexidade:** S (3 pontos) | **Prioridade:** P1 (nice-to-have)

**User Story:**
> Como Product Owner, quero ver em dashboard quanto cada provider está custando, para que possa validar economia real e ajustar configuração baseado em dados.

**Acceptance Criteria:**
- [ ] AC1: Endpoint `GET /api/v1/admin/analytics/provider-costs` criado (apenas Admin)
- [ ] AC2: Query params: `?period=last_7_days|last_30_days|last_90_days` (default: `last_30_days`)
- [ ] AC3: Retorna breakdown por provider:
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
    },
    {
      "provider": "GPT4_MINI",
      "type": "LLM",
      "operations": 400,
      "total_cost_usd": 2.40,
      "avg_cost_per_operation": 0.006,
      "avg_latency_ms": 3100
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
- [ ] AC4: Dados agregados de tabela `Analise` (campos: `custo_stt_usd`, `custo_llm_usd`, `provider_stt`, `provider_llm_*`)
- [ ] AC5: RBAC guard: apenas usuários com role `ADMIN` podem acessar
- [ ] AC6: Swagger docs: endpoint documentado com exemplo de response
- [ ] AC7: Testes unitários: mock repository, validação de agregação, cálculo de savings
- [ ] AC8: Teste E2E: processar 5 aulas → chamar endpoint → validar custos corretos
- [ ] AC9: Performance: query otimizada com índices em `created_at` e `provider_*`
- [ ] AC10: Frontend dashboard (opcional - pode ser Story futura): gráfico de custos por provider (recharts)

**Arquivos:**
- `src/modules/admin/admin.controller.ts` (adicionar endpoint)
- `src/modules/admin/services/provider-analytics.service.ts` (novo)
- `src/modules/admin/services/provider-analytics.service.spec.ts` (novo)
- `src/modules/admin/dto/provider-costs-response.dto.ts` (novo)
- `test/admin-provider-costs.e2e-spec.ts` (novo)

**Technical Notes:**
- Query usa agregação SQL: `GROUP BY provider, SUM(custo_usd), AVG(tempo_processamento_ms)`
- Índices necessários: `CREATE INDEX idx_analise_created_at_provider ON Analise(created_at, provider_stt, provider_llm_cobertura)`
- Baseline cost calculado via config hardcoded (Claude: $0.18, OpenAI Whisper: $0.36)

---

## 🔧 Technical Architecture

### **Provider Routing Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                    REQUEST: Processar Aula                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────▼─────────────┐
                │   AnaliseService         │
                │   (Orchestrator)         │
                └────────────┬─────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼──────┐    ┌─────▼──────┐    ┌─────▼──────┐
    │ STTRouter  │    │ LLMRouter  │    │ LLMRouter  │
    │            │    │ (Prompt 1) │    │ (Prompt 2) │
    └─────┬──────┘    └─────┬──────┘    └─────┬──────┘
          │                 │                  │
          │ reads config    │ reads config     │
    ┌─────▼──────────────────▼──────────────────▼─────┐
    │         providers.config.json                    │
    │  {                                               │
    │    "stt": { "primary": "GROQ_WHISPER_TURBO" },  │
    │    "llm": {                                      │
    │      "analise_cobertura": { "primary": "GEMINI" }│
    │    }                                             │
    │  }                                               │
    └─────┬──────────────────┬──────────────────┬─────┘
          │                  │                  │
    ┌─────▼──────┐    ┌─────▼──────┐    ┌─────▼──────┐
    │ Groq       │    │ Gemini     │    │ Gemini     │
    │ Provider   │    │ Provider   │    │ Provider   │
    └─────┬──────┘    └─────┬──────┘    └─────┬──────┘
          │                 │                  │
          │ API call        │ API call         │
    ┌─────▼──────┐    ┌─────▼──────┐    ┌─────▼──────┐
    │ Groq API   │    │ Google AI  │    │ Google AI  │
    └─────┬──────┘    └─────┬──────┘    └─────┬──────┘
          │                 │                  │
          └─────────────────┴──────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  Logs + Metrics  │
                    │  (Pino + Prisma) │
                    └──────────────────┘
```

### **Fallback Logic**

```typescript
// STTRouter.getSTTProvider()
async getSTTProvider(): Promise<STTProvider> {
  const config = this.configService.get('stt');

  try {
    const primary = this.getPrimaryProvider(config.primary);
    if (await primary.isAvailable()) {
      this.logger.log(`Using primary STT provider: ${config.primary}`);
      return primary;
    }
  } catch (error) {
    this.logger.warn(`Primary STT provider failed: ${error.message}`);
  }

  // Fallback
  try {
    const fallback = this.getFallbackProvider(config.fallback);
    this.logger.warn(`Using fallback STT provider: ${config.fallback}`);
    return fallback;
  } catch (error) {
    this.logger.error(`Fallback STT provider failed: ${error.message}`);
    throw new Error('All STT providers unavailable');
  }
}
```

### **Config Schema (Zod Validation)**

```typescript
// src/config/providers.config.ts
import { z } from 'zod';

const ProviderEnum = z.enum([
  'GROQ_WHISPER_TURBO',
  'GROQ_DISTIL_WHISPER',
  'GROQ_WHISPER_LARGE',
  'OPENAI_WHISPER',
  'GEMINI_FLASH',
  'CLAUDE_SONNET',
  'GPT4_MINI',
]);

const STTConfigSchema = z.object({
  primary: ProviderEnum,
  fallback: ProviderEnum,
});

const LLMAnalysisConfigSchema = z.object({
  primary: ProviderEnum,
  fallback: ProviderEnum,
});

export const ProvidersConfigSchema = z.object({
  version: z.string(),
  stt: STTConfigSchema,
  llm: z.object({
    analise_cobertura: LLMAnalysisConfigSchema,
    analise_qualitativa: LLMAnalysisConfigSchema,
    relatorio: LLMAnalysisConfigSchema,
    exercicios: LLMAnalysisConfigSchema,
    alertas: LLMAnalysisConfigSchema,
  }),
});

export type ProvidersConfig = z.infer<typeof ProvidersConfigSchema>;
```

---

## ⚠️ Risks & Mitigations

| Risco | Prob | Impacto | Mitigação |
|-------|------|---------|-----------|
| **Gemini gera relatórios piores que Claude** | M | Alto | POC com 30 aulas reais antes de produção + fallback automático para Claude |
| **Groq Whisper tem WER maior em PT-BR** | M | Médio | Testar com 10 áudios reais diversos (ruído alto, sotaques) + fallback para OpenAI |
| **Rate limits Groq/Gemini** | B | Médio | Implementar retry com exponential backoff + fallback + queue system (Bull) |
| **Config inválida quebra sistema** | B | Alto | Validação de schema Zod + defaults seguros (fallback para providers atuais) |
| **Groq/Gemini downtime** | B | Médio | Fallback automático para OpenAI/Claude + logs + alertas |
| **Migração quebra pipeline existente** | M | Crítico | Testes E2E extensivos + rollout gradual (10% → 50% → 100%) + flag de feature |

---

## 📋 Testing Strategy

### **Unit Tests**
- Routers: validação de roteamento, fallback logic, config inválida
- Providers: mock APIs, validação de output, cálculo de custo
- Config loader: schema validation, defaults, hot-reload

### **E2E Tests**
- Pipeline completo: 1 aula (upload → STT → 5 prompts LLM)
- Fallback: forçar falha de provider primário
- Multi-provider: processar 3 aulas com configs diferentes

### **Quality Validation (POC)**
- Processar 30 aulas reais com:
  - Config A: Claude + OpenAI Whisper (baseline)
  - Config B: Gemini + Groq Whisper (otimizado)
- Comparar métricas:
  - Taxa de aprovação de relatórios
  - Tempo de revisão por professor
  - WER (Word Error Rate) de transcrições
  - NPS (se possível coletar)

### **Performance Tests**
- Latência: validar que Groq/Gemini não adicionam latência significativa
- Throughput: processar 50 aulas em paralelo (stress test)

---

## 📊 Success Metrics

### **Métricas de Negócio (90 dias após rollout)**
- [ ] Custo médio por aula ≤ R$0.30 (economia ≥85%)
- [ ] Economia total acumulada ≥ R$20.000 (assumindo 10 escolas)
- [ ] Taxa de aprovação de relatórios ≥ 80% (mantida vs baseline Claude)

### **Métricas Técnicas**
- [ ] Uptime de providers ≥ 99.5% (combinado primary + fallback)
- [ ] Latência média STT ≤ 60s (para 50min de áudio)
- [ ] Latência média LLM ≤ 30s (por prompt)
- [ ] Taxa de fallback ≤ 5% (indica alta disponibilidade de providers primários)

### **Métricas de Qualidade**
- [ ] WER (Word Error Rate) Groq ≤ 15% (validado com 30 áudios)
- [ ] Taxa de aprovação de relatórios Gemini ≥ 75% (comparado a Claude 80%)
- [ ] Tempo de revisão de relatórios ≤ 5min (mantido)

---

## 🚀 Rollout Plan

### **Fase 1: Development & Testing (Semana 1-2)**
- Implementar Stories 14.1, 14.2, 14.3
- Testes unitários + E2E
- POC com 30 aulas reais (validação de qualidade)

### **Fase 2: Integration (Semana 2-3)**
- Implementar Story 14.4 (integração com pipeline)
- Testes E2E completos
- Configurar `providers.config.json` padrão

### **Fase 3: Monitoring (Semana 3-4)**
- Implementar Story 14.5 (dashboard de custos)
- Configurar alertas (Sentry + logs)
- Documentação completa

### **Fase 4: Gradual Rollout (Semana 4-6)**
- **Semana 4:** 10% das escolas (1-2 escolas piloto)
- **Semana 5:** 50% das escolas (monitorar métricas)
- **Semana 6:** 100% das escolas (se métricas OK)

**Critérios para avançar fases:**
- Taxa de aprovação ≥ 75%
- Taxa de fallback ≤ 10%
- Nenhum erro crítico reportado

**Rollback plan:**
- Se métricas críticas falharem: reverter config para providers antigos (1 linha de mudança em `providers.config.json`)
- Zero downtime (hot-reload de config)

---

## 📚 Documentation

### **User-Facing**
- [ ] README.md: instruções de configuração de providers
- [ ] Admin guide: como interpretar dashboard de custos

### **Developer-Facing**
- [ ] Architecture Decision Record (ADR): Provider Routing Strategy
- [ ] API docs: endpoint `/api/v1/admin/analytics/provider-costs` (Swagger)
- [ ] Migration guide: como adicionar novo provider no futuro

### **Operations**
- [ ] Runbook: troubleshooting provider failures
- [ ] Monitoring setup: dashboards + alertas (Sentry)

---

## 🎯 Definition of Done (Epic Level)

- [ ] Todas as 5 stories completadas e code review aprovado
- [ ] Testes E2E passando (coverage ≥85%)
- [ ] POC validado: 30 aulas processadas com Gemini/Groq com qualidade aceitável
- [ ] Dashboard de custos mostrando economia real
- [ ] Documentação completa (README + ADR + Runbook)
- [ ] Rollout gradual completo (100% escolas usando novos providers)
- [ ] Economia de custos ≥85% validada em produção

---

## 📅 Timeline

| Fase | Duração | Entregável |
|------|---------|------------|
| **Sprint 1 (Semanas 1-2)** | 10 dias | Stories 14.1, 14.2, 14.3 + POC |
| **Sprint 2 (Semanas 3-4)** | 10 dias | Stories 14.4, 14.5 + Docs + Rollout 10% |
| **Consolidação (Semanas 5-6)** | 10 dias | Rollout 50% → 100% + Validação |
| **TOTAL** | **~30 dias** | Epic completo + economia validada |

---

## 🔗 Related Epics

- **Epic 4:** Transcrição de Áudio (STT) - base para Story 14.2
- **Epic 5:** Análise Pedagógica por IA (LLM) - base para Story 14.3
- **Epic 8:** Monitoramento e Observabilidade - base para Story 14.5

---

**Created by:** Luisneto98
**Reviewed by:** -
**Last Updated:** 2026-02-14
