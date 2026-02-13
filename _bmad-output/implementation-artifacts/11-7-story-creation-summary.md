# Story 11.7 - Criação de Story Resumo

**Data:** 2026-02-13
**Story:** 11-7-backend-adaptar-prompts-ia-objetivos-genericos
**Status:** ready-for-dev

---

## 📋 Resumo Executivo

Story 11.7 adapta o **MOAT técnico** (pipeline de 5 prompts especializados) para trabalhar com objetivos de aprendizagem genéricos (BNCC ou customizados) através de **context-aware prompts** usando Handlebars conditionals.

**Meta de Qualidade:** ≥80% precisão na análise de cursos customizados (mesma qualidade que análises BNCC).

---

## 🎯 Principais Entregas

### Backend - Análise Adaptativa

1. **AnaliseService expandido:**
   - Query Prisma carrega `planejamento.objetivos` (além de `.habilidades` legacy)
   - Contexto inclui `curriculo_tipo` e `contexto_pedagogico` (se custom)
   - Novo método `buildPlanejamentoContext()` formata objetivos BNCC ou custom dinamicamente

2. **Prompts v2.0.0 (5 prompts atualizados):**
   - Handlebars conditionals: `{{#if (eq curriculo_tipo 'CUSTOM')}}...{{/if}}`
   - Seções específicas para BNCC vs Custom
   - Custom: critérios de evidência, níveis Bloom, adequação cognitiva
   - BNCC: mantém estrutura existente (backward compatible)

3. **Seed idempotente:**
   - Cria prompts v2.0.0 com suporte custom
   - Mantém v1.0.0 ativos (A/B testing opcional)
   - 10 prompts ativos: 5 x v1.0.0 + 5 x v2.0.0

### Validação de Qualidade

4. **Testes Manuais (AC9):**
   - 5 aulas custom reais (3 PM + 2 Inglês)
   - Métricas: ≥80% concordância humano vs IA
   - Documentação de casos de falha em `11-7-validation-results.md`

5. **Testes de Regressão (AC7):**
   - 3 aulas BNCC (6º, 7º, 8º ano)
   - Outputs v1 vs v2 devem ser idênticos
   - Qualidade mantida

6. **Testes Unitários (AC11):**
   - 75 testes (15 custom x 5 prompts)
   - Cobertura ≥85%

---

## 🔑 Acceptance Criteria (12 ACs)

| AC | Descrição | Complexidade |
|----|-----------|--------------|
| AC1 | Análise carrega objetivos genéricos (BNCC + custom) | 🟡 Média |
| AC2 | Contexto determina tipo (BNCC vs Custom) | 🟢 Baixa |
| AC3 | Método `buildPlanejamentoContext()` formata dinamicamente | 🟡 Média |
| AC4 | Prompt 1 (Cobertura) v2.0.0 com contexto condicional | 🔴 Alta |
| AC5 | Prompts 2-5 v2.0.0 com contexto condicional | 🔴 Alta |
| AC6 | Seed script executa idempotentemente | 🟢 Baixa |
| AC7 | Análise BNCC continua funcionando (regressão) | 🟡 Média |
| AC8 | Análise CUSTOM retorna formato expandido | 🟡 Média |
| AC9 | Validação manual: 5 aulas custom, qualidade ≥80% | 🔴 Alta |
| AC10 | Performance mantida (< 60s, mesmo SLA) | 🟢 Baixa |
| AC11 | Testes unitários custom (15/15 por prompt) | 🟡 Média |
| AC12 | Documentação atualizada | 🟢 Baixa |

**Complexidade Geral:** 🔴 **Alta** (8 pontos) - Prompts são o MOAT técnico, requerem ajuste fino iterativo

---

## 📚 Contexto Técnico Relevante

### Pipeline de IA Existente (Stories 5.3-5.5)

```typescript
// ressoa-backend/src/modules/analise/services/analise.service.ts
async analisarAula(aulaId: string): Promise<Analise> {
  // 1. Load aula + transcricao + planejamento
  // 2. Build contexto inicial
  // 3. Execute Prompt 1 (Cobertura) → contexto.cobertura
  // 4. Execute Prompt 2 (Qualitativa) → contexto.analise_qualitativa
  // 5. Execute Prompt 3 (Relatório)
  // 6. Execute Prompt 4 (Exercícios)
  // 7. Execute Prompt 5 (Alertas)
  // 8. Save Analise entity
}
```

### Handlebars Helpers (Story 10.6)

```typescript
// ressoa-backend/src/modules/llm/services/prompt.service.ts (linhas 7-9)
Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('and', (a, b) => a && b);
Handlebars.registerHelper('or', (a, b) => a || b);
```

**Uso:**
```handlebars
{{#if (eq curriculo_tipo 'CUSTOM')}}
  Contexto custom com critérios de evidência e níveis Bloom
{{else}}
  Contexto BNCC com habilidades e unidades temáticas
{{/if}}
```

### Modelo de Dados (Stories 11.1-11.3)

```prisma
model ObjetivoAprendizagem {
  tipo_fonte: BNCC | CUSTOM
  // Se BNCC: habilidade_bncc_id
  // Se CUSTOM: criterios_evidencia[], nivel_cognitivo (Bloom)
}

model Turma {
  curriculo_tipo: BNCC | CUSTOM
  contexto_pedagogico: JSON? // 4 campos obrigatórios se custom
}

model PlanejamentoObjetivo {
  planejamento_id, objetivo_id (N:N)
  peso, aulas_previstas
}
```

---

## 🎓 Learnings from Previous Stories

### Story 10.6 (Prompts EM)
- ✅ Handlebars conditionals funcionam perfeitamente
- ✅ Pattern: `{{#if (eq tipo_ensino 'MEDIO')}}` adapta contexto
- ✅ A/B testing: v1 + v2 ativos simultaneamente

### Story 11.3 (Planejamento Objetivos Genéricos)
- ✅ `PlanejamentoObjetivo` N:N já implementado
- ✅ Backward compatibility: `habilidades` coexiste com `objetivos`
- ✅ Query Prisma: `include: { objetivos: { include: { objetivo: true } } }`

### Story 11.4-11.6 (Frontend Custom)
- ✅ `curriculo_tipo`: 'BNCC' | 'CUSTOM'
- ✅ Objetivos custom: `criterios_evidencia` (array), `nivel_cognitivo` (enum Bloom)
- ✅ Validação: mínimo 3 objetivos, máximo 10

### Story 5.3-5.5 (Pipeline IA)
- ✅ Context accumulation pattern funciona bem
- ✅ Parsing markdown JSON: `parseMarkdownJSON()` extrai ```json...```
- ✅ Custo target: ~$0.08-0.12 por aula (50min)
- ⚠️ **Qualidade target: >90% usável** (Story 11.7 mantém mesma meta para custom)

---

## 🛠️ Arquivos a Modificar

### Backend - Análise Service
```
ressoa-backend/src/modules/analise/services/analise.service.ts
├─ analisarAula(): Expandir query Prisma (linhas 117-130)
├─ Contexto inicial: Adicionar curriculo_tipo (linhas 142-168)
└─ buildPlanejamentoContext(): Novo método privado (após linha 273)
```

### Backend - Seed Prompts
```
ressoa-backend/prisma/seeds/05-prompts-ia.seed.ts (criar se não existir)
├─ prompt-cobertura v2.0.0 (CRITICAL: maior impacto na qualidade)
├─ prompt-qualitativa v2.0.0
├─ prompt-relatorio v2.0.0
├─ prompt-exercicios v2.0.0
└─ prompt-alertas v2.0.0
```

### Testes
```
ressoa-backend/src/modules/llm/prompts/
├─ prompt-cobertura.spec.ts: Suite "Custom Curriculum" (3 testes)
├─ prompt-qualitativa.spec.ts: Idem
├─ prompt-relatorio.spec.ts: Idem
├─ prompt-exercicios.spec.ts: Idem
└─ prompt-alertas.spec.ts: Idem
```

---

## ⚠️ Riscos e Mitigações

### Risco 1: Qualidade de análise IA cai para cursos custom
- **Probabilidade:** Média
- **Impacto:** Alto (quebra a proposta de valor)
- **Mitigação:**
  - AC9: Validação manual com 5 aulas reais (≥80% precisão)
  - Ajuste iterativo de prompts (max 3 iterações)
  - Documentar casos de falha para melhoria futura
  - Se falhar: considerar prompts específicos por tipo de curso (PM, Inglês, etc.)

### Risco 2: Prompts v2.0.0 quebram análises BNCC existentes
- **Probabilidade:** Baixa (Handlebars conditionals isolam código)
- **Impacto:** Crítico (regressão em funcionalidade core)
- **Mitigação:**
  - AC7: Testes de regressão com 3 aulas BNCC (6º, 7º, 8º)
  - Comparação diff JSON v1 vs v2
  - Manter v1.0.0 ativo como fallback (A/B testing)

### Risco 3: Performance degradada (> 60s)
- **Probabilidade:** Baixa (contexto adicional marginal)
- **Impacto:** Médio (SLA violado)
- **Mitigação:**
  - AC10: Medição de tempo total e breakdown por prompt
  - Comparar custo USD custom vs BNCC (< 15% variação)
  - Otimizar prompts se necessário (remover verbosidade)

---

## 🔍 Checklist de Validação (Dev Agent)

Antes de marcar story como `done`, validar:

- [ ] ✅ **AC1-AC3:** Contexto construído corretamente (log estruturado mostra `curriculo_tipo`, `contexto_pedagogico`)
- [ ] ✅ **AC4-AC5:** Prompts v2.0.0 renderizam blocos corretos (BNCC vs Custom)
- [ ] ✅ **AC6:** Seed executa sem erros, 10 prompts ativos (5 v1 + 5 v2)
- [ ] ✅ **AC7:** Análise BNCC idêntica (diff JSON v1 vs v2 = 0 diferenças)
- [ ] ✅ **AC8:** Análise CUSTOM retorna campos expandidos (`criterios_atendidos`, `nivel_bloom_*`)
- [ ] ✅ **AC9:** 5 aulas custom validadas, qualidade ≥80% (concordância humano vs IA)
- [ ] ✅ **AC10:** Tempo < 60s, custo USD < 15% variação
- [ ] ✅ **AC11:** 75 testes passando (15 custom x 5 prompts)
- [ ] ✅ **AC12:** Documentação atualizada (`estrategia-prompts-ia-2026-02-08.md`)

---

## 📊 Métricas de Sucesso

### Qualidade de Análise (Target: ≥80%)
- **Cobertura:** ≥80% dos objetivos identificados corretamente
- **Evidências:** 100% literais (não parafraseadas)
- **Nível Bloom:** ≥70% concordância planejado vs detectado
- **Critérios de Evidência:** ≥75% identificados corretamente
- **Relatório Usável:** ≥80% sem edição significativa

### Performance (Target: SLA mantido)
- **Tempo Total:** < 60s (mesmo SLA BNCC)
- **Custo USD:** < 15% variação vs BNCC (~$0.08-0.12 por aula)

### Testes (Target: ≥85% cobertura)
- **Testes Unitários:** 75 passando (15 custom x 5 prompts)
- **Testes Manuais:** 5 aulas custom validadas
- **Testes Regressão:** 3 aulas BNCC sem diferenças

---

## 📖 Referências Técnicas

**Documentação Principal:**
- [estrategia-prompts-ia-2026-02-08.md#2-Fundamentos-Pedagógicos](../_bmad-output/planning-artifacts/estrategia-prompts-ia-2026-02-08.md) - Taxonomia Bloom, critérios qualidade
- [estrategia-prompts-ia-2026-02-08.md#3-Arquitetura-Pipeline](../_bmad-output/planning-artifacts/estrategia-prompts-ia-2026-02-08.md) - Pipeline serial 5 prompts
- [epic-11-suporte-cursos-customizados.md#Story-11.7](./epic-11-suporte-cursos-customizados.md) - AC original, validação manual
- [architecture.md#AD-5.1-Pipeline-IA](../_bmad-output/planning-artifacts/architecture.md) - Decisão arquitetural pipeline

**Código Relevante:**
- `ressoa-backend/src/modules/llm/services/prompt.service.ts#89-127` - `renderPrompt()` Handlebars
- `ressoa-backend/src/modules/analise/services/analise.service.ts#90-273` - Pipeline `analisarAula()`
- `ressoa-backend/prisma/schema.prisma` - Modelos ObjetivoAprendizagem, PlanejamentoObjetivo

**Stories Relacionadas:**
- Story 11.1: Modelo ObjetivoAprendizagem
- Story 11.3: Planejamento N:N com objetivos
- Story 10.6: Handlebars conditionals (EM vs EF)
- Story 5.3-5.5: Pipeline de IA (5 prompts)

---

**Story criada:** 2026-02-13
**Workflow:** BMad create-story
**Status inicial:** ready-for-dev
**Epic:** 11 - Suporte a Cursos Customizados
**Complexidade:** 🔴 Alta (8 pontos, ~2-3 dias)
**Prioridade:** ALTA (habilita mercado de cursos livres com qualidade mantida)
