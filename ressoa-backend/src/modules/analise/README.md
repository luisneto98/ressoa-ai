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

## Prompt Content Details (Story 5.3)

### Prompt 1 - Análise de Cobertura BNCC

**Objetivo:** Classificar quais habilidades BNCC foram cobertas e em qual profundidade (0-3 níveis).

**Schema de Saída:**
```json
{
  "analise_cobertura": [
    {
      "habilidade_codigo": "EF06MA01",
      "nivel_cobertura": 0 | 1 | 2 | 3,
      "evidencias": ["Trecho literal 1...", "Trecho literal 2..."],
      "observacoes": "Notas pedagógicas",
      "tempo_estimado_minutos": 15
    }
  ],
  "habilidades_nao_cobertas": ["EF06MA02"],
  "habilidades_extras": [],
  "resumo_quantitativo": {
    "total_planejadas": 3,
    "cobertas_nivel_2_ou_3": 1,
    "apenas_mencionadas": 1,
    "nao_cobertas": 1,
    "percentual_cobertura": 33.3
  }
}
```

**Níveis de Cobertura:**
- **Nível 0:** Não coberta (não aparece na aula)
- **Nível 1:** Mencionada (citação breve, sem desenvolvimento)
- **Nível 2:** Parcialmente coberta (conceitos explicados + 1 exemplo, SEM profundidade)
- **Nível 3:** Aprofundada (explicação completa + 2+ exemplos + exercícios + interação)

**Evidências LITERAIS:** Prompt instrui LLM a copiar e colar trechos EXATOS da transcrição, NÃO paráfrases.

**Temperature:** 0.3 (baixa criatividade → classificação conservadora e determinística)

---

### Prompt 2 - Análise Qualitativa Pedagógica

**Objetivo:** Avaliar qualidade pedagógica em 6 dimensões.

**Schema de Saída:**
```json
{
  "taxonomia_bloom": {
    "niveis_identificados": [2, 3],
    "nivel_dominante": 2,
    "avaliacao": "...",
    "sugestao": "..."
  },
  "coerencia_narrativa": {
    "score": 8,
    "estrutura_presente": true,
    "conexao_conhecimento_previo": true,
    "sequencia_logica": true,
    "fechamento": false,
    "observacoes": "..."
  },
  "adequacao_linguistica": {
    "adequada_para_serie": true,
    "observacoes": "...",
    "exemplos_adequacao": ["..."]
  },
  "metodologia": {
    "dominante": "Expositiva dialogada",
    "metodos_identificados": ["..."],
    "percentual_estimado": {
      "expositiva": 60,
      "investigativa": 10,
      "colaborativa": 0,
      "pratica": 30
    },
    "variacao": true,
    "avaliacao": "..."
  },
  "engajamento": {
    "nivel": "alto",
    "perguntas_alunos": 5,
    "participacao_estimulada": true,
    "discussoes": true,
    "sinais_positivos": ["..."],
    "sinais_dificuldade": ["..."],
    "avaliacao": "..."
  },
  "clareza_comunicacao": {
    "score": 9,
    "explicacoes_claras": true,
    "uso_exemplos": true,
    "reformulacoes": 2,
    "observacoes": "..."
  },
  "resumo_geral": {
    "pontos_fortes": ["...", "..."],
    "pontos_atencao": ["...", "..."],
    "nota_geral": 8.5
  }
}
```

**6 Dimensões Pedagógicas:**
1. **Taxonomia de Bloom:** Níveis cognitivos (Lembrar → Criar)
2. **Coerência Narrativa:** Estrutura da aula (introdução, desenvolvimento, consolidação)
3. **Adequação Linguística:** Linguagem apropriada para idade (6º-9º ano)
4. **Metodologia de Ensino:** Expositiva, investigativa, colaborativa, prática
5. **Engajamento:** Sinais positivos/negativos de participação
6. **Clareza e Comunicação:** Clareza, exemplos, reformulações

**Temperature:** 0.4 (ligeiramente mais criativa que Prompt 1 → insights pedagógicos nuançados)

---

## Pedagogical Foundations

**Bloom's Taxonomy (6 Níveis):**
```
Nível 1: Lembrar (Remember) - Recall facts
Nível 2: Compreender (Understand) - Explain ideas
Nível 3: Aplicar (Apply) - Use in new situations
Nível 4: Analisar (Analyze) - Break down, compare
Nível 5: Avaliar (Evaluate) - Make judgments
Nível 6: Criar (Create) - Produce something new
```

**Age-Appropriate Cognitive Levels:**
| Série | Idade | Linguagem Esperada | Nível de Abstração |
|-------|-------|--------------------|--------------------|
| 6º | 11-12 | Exemplos concretos, analogias do cotidiano | Baixo |
| 7º | 12-13 | Mistura concreto-abstrato | Médio |
| 8º | 13-14 | Abstrações permitidas | Alto |
| 9º | 14-15 | Hipotético-dedutivo | Muito Alto |

**Quality Criteria (90% Usable Target):**
- Professor lê relatório e reconhece que é fiel à aula
- Faz no máximo 2-3 ajustes pequenos (adicionar nome de aluno, ajustar termo)
- NÃO precisa reescrever seções
- **Mensurável:** >80% taxa de aprovação, <5min tempo de revisão, <3 edições por relatório, <5% taxa de rejeição

---

## Prompt Seed Files

Prompts são armazenados em arquivos JSON e seedados via `npx prisma db seed`:

**Localização:** `prisma/seeds/prompts/`
- `prompt-cobertura-v1.0.0.json` - Prompt 1
- `prompt-qualitativa-v1.0.0.json` - Prompt 2

**Documentação:** Ver `prisma/seeds/prompts/README.md` para detalhes de versionamento, A/B testing e atualização de prompts.

---

## Roadmap (Próximas Stories)

- **Story 5.3:** ✅ **COMPLETO** - Prompts 1 e 2 implementados e testados
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
