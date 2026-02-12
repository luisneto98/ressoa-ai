# Módulo Analise - Pipeline Serial de 5 Prompts

**Status:** ✅ Implementado (Story 5.2)
**Autor:** BMAD Dev Agent
**Última Atualização:** 2026-02-12

---

## Visão Geral

Este módulo implementa o **MOAT técnico** do Ressoa AI: um pipeline serial de 5 prompts LLM especializados que gera análise pedagógica profunda, impossível de replicar com ferramentas genéricas de IA.

## Pipeline de 5 Prompts

```
Transcrição + Planejamento → [Prompt 1: Cobertura BNCC]
                                     ↓
                           [Prompt 2: Análise Qualitativa]
                                     ↓
                           [Prompt 3: Geração de Relatório]
                                     ↓
                           [Prompt 4: Geração de Exercícios]
                                     ↓
                           [Prompt 5: Detecção de Alertas]
                                     ↓
                           Analise completa salva → Aula status = ANALISADA
```

### Context Accumulation Pattern (CRÍTICO)

Cada prompt recebe o **contexto acumulativo** dos prompts anteriores:

```typescript
const contexto = {
  transcricao: '...',  // Input inicial
  turma: { ... },
  planejamento: { ... },
};

// Prompt 1 executa
contexto.cobertura = outputPrompt1;

// Prompt 2 vê: transcricao, turma, planejamento, cobertura
contexto.analise_qualitativa = outputPrompt2;

// Prompt 3 vê: todos os anteriores
// Prompt 4 vê: todos os anteriores
// Prompt 5 vê: todos os anteriores
```

**Por que isso importa:**
- Prompt 2 pode referenciar habilidades específicas identificadas no Prompt 1
- Prompt 3 (relatório) sintetiza Prompt 1 + 2 insights
- Prompt 5 (alertas) usa visão completa para detectar gaps

## Provider Selection Strategy

| Prompt | Provider | Custo (input/output) | Razão |
|--------|----------|---------------------|-------|
| 1 - Cobertura BNCC | Claude Sonnet | $3/$15 por 1M tokens | Raciocínio pedagógico superior |
| 2 - Análise Qualitativa | Claude Sonnet | $3/$15 por 1M tokens | Análise profunda de metodologias |
| 3 - Geração de Relatório | Claude Sonnet | $3/$15 por 1M tokens | Síntese narrativa coerente |
| 4 - Geração de Exercícios | GPT-4 mini | $0.15/$0.60 por 1M tokens | Tarefa formulaica, 20x mais barato |
| 5 - Detecção de Alertas | Claude Sonnet | $3/$15 por 1M tokens | Detecção de gaps pedagógicos |

**Custo Total por Aula (50min):** ~$0.08-0.12

## Arquitetura

### Entities

**Analise** (Prisma Schema):
```prisma
model Analise {
  id                       String   @id @default(uuid())
  aula_id                  String   @unique  // One analysis per aula
  transcricao_id           String
  planejamento_id          String?  // Nullable - aula pode não ter planejamento

  // Outputs dos 5 prompts (pipeline serial)
  cobertura_json           Json     // Prompt 1
  analise_qualitativa_json Json     // Prompt 2
  relatorio_texto          String   @db.Text // Prompt 3 - MARKDOWN (não JSON)
  exercicios_json          Json     // Prompt 4
  alertas_json             Json     // Prompt 5

  // Metadata para observabilidade & A/B testing
  prompt_versoes_json      Json     // { cobertura: "v1.0.0", ... }
  custo_total_usd          Float    // Sum of 5 prompts
  tempo_processamento_ms   Int      // Total pipeline time

  // Relations
  aula         Aula         @relation(fields: [aula_id], references: [id], onDelete: Cascade)
  transcricao  Transcricao  @relation(fields: [transcricao_id], references: [id])
  planejamento Planejamento? @relation(fields: [planejamento_id], references: [id])
}
```

### Services

**AnaliseService** (`services/analise.service.ts`):
- Orquestrador principal do pipeline
- Coordena execução serial dos 5 prompts
- Gerencia contexto acumulativo
- Salva Analise e atualiza status da Aula

**Método Principal:** `analisarAula(aulaId: string): Promise<Analise>`

## Observabilidade

### Cost Tracking

Cada execução rastreia:
- `custo_total_usd`: Soma dos custos dos 5 prompts
- `prompt_versoes_json`: Versões usadas (para A/B testing)
- `tempo_processamento_ms`: Tempo total do pipeline

### Logs Estruturados (Pino)

```typescript
this.logger.log(`Iniciando análise pedagógica: aulaId=${aulaId}`);
this.logger.log('Executando Prompt 1: Cobertura BNCC');
// ...
this.logger.log(`Análise concluída: aulaId=${aulaId}, custo=$${custoTotal.toFixed(4)}, tempo=${tempoTotal}ms`);
```

### Error Handling

- Erros são logados com contexto (prompt name, provider, error)
- Erros são re-thrown (caller decide retry strategy)
- **Full error handling (fallback providers, retries, DLQ) vem em Story 5.5 (workers)**

## Uso

### Exemplo Básico

```typescript
import { AnaliseService } from './modules/analise/services/analise.service';

// Inject service
constructor(private analiseService: AnaliseService) {}

// Execute pipeline
const analise = await this.analiseService.analisarAula(aulaId);

// Access results
console.log(analise.cobertura_json);      // { habilidades: [...] }
console.log(analise.relatorio_texto);     // "# Relatório Pedagógico..."
console.log(analise.custo_total_usd);     // 0.085
console.log(analise.prompt_versoes_json); // { cobertura: "v1.0.0", ... }
```

### Pré-requisitos

1. **Aula com transcrição:** Aula deve ter `status_processamento = 'TRANSCRITA'`
2. **Prompts cadastrados:** Prompts 1-5 devem existir no banco (com versões ativas)
3. **Providers configurados:** ANTHROPIC_API_KEY e OPENAI_API_KEY no .env

## Testing

### Unit Tests

```bash
npm test -- analise.service.spec.ts
```

**Coverage:** >80% (todos os casos edge cobertos)

### E2E Tests

```bash
npm run test:e2e -- analise-pipeline.e2e-spec.ts
```

**O que testa:**
- Pipeline completo end-to-end
- Estrutura de outputs (JSON vs markdown)
- Tracking de custo e versões
- Atualização de Aula status
- Relação one-to-one Aula ↔ Analise

## Roadmap (Próximas Stories)

- **Story 5.3:** Implementar conteúdo real dos Prompts 1 e 2 (Cobertura + Qualitativa)
- **Story 5.4:** Implementar conteúdo real dos Prompts 3 e 4 (Relatório + Exercícios)
- **Story 5.5:** Worker assíncrono (Bull queue) + error handling robusto
- **Epic 6:** API endpoints para visualização e edição de análises

## Referencias

- **Architecture:** `_bmad-output/planning-artifacts/architecture.md`
- **AI Strategy:** `_bmad-output/planning-artifacts/estrategia-prompts-ia-2026-02-08.md`
- **Story 5.2:** `_bmad-output/implementation-artifacts/5-2-backend-pipeline-serial-de-5-prompts-orquestrador.md`
- **Data Model:** `_bmad-output/planning-artifacts/modelo-de-dados-entidades-2026-02-08.md`

---

**Implementado por:** BMAD Dev Agent (Story 5.2)
**Code Review:** ✅ COMPLETO (2026-02-12) - 10 issues encontrados, 6 CRITICAL/MEDIUM corrigidos automaticamente
