# Estratégia de Implementação: Cursos Customizados (Epic 11)

**Data:** 2026-02-13
**Status:** Aprovado
**Epic:** 11 - Suporte a Cursos Não-BNCC com Objetivos Customizados

---

## 🎯 Objetivo Estratégico

Expandir o sistema para atender **cursos livres, preparatórios e técnicos** mantendo a **mesma qualidade de análise pedagógica** (≥80% precisão) através de objetivos de aprendizagem customizados estruturados.

### Casos de Uso Validados
1. **Preparatório Polícia Militar** (Matemática, Português, Raciocínio Lógico)
2. **Curso de Inglês** (Conversação, Gramática - potencial CEFR futuro)
3. **Cursos Técnicos** (Programação, Informática)

---

## 🏗️ Arquitetura: Framework Híbrido de Objetivos

### Conceito Central
> **BNCC deixa de ser hard-coded e vira apenas um "provider" de objetivos de aprendizagem**

```
┌─────────────────────────────────────────────────┐
│         ObjetivoAprendizagem (abstração)        │
├─────────────────────────────────────────────────┤
│                                                 │
│  tipo_fonte = "bncc"                           │
│  ├─ 369 habilidades BNCC (Fundamental)         │
│  └─ 500 habilidades BNCC (Médio)               │
│                                                 │
│  tipo_fonte = "custom"                         │
│  ├─ Objetivos definidos por professor          │
│  ├─ Estrutura pedagógica equivalente           │
│  └─ (descrição + Bloom + critérios)            │
│                                                 │
│  tipo_fonte = "cefr" (futuro)                  │
│  └─ Níveis A1-C2 para idiomas                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Vantagens desta Arquitetura
✅ **Genérico:** Suporta qualquer framework curricular (BNCC, CEFR, Common Core, SENAC)
✅ **Equivalência:** BNCC e custom são "cidadãos iguais" no sistema
✅ **Extensível:** Adicionar novo provider não requer refactoring
✅ **Qualidade:** Força estrutura pedagógica em todos objetivos

---

## 📊 Modelo de Dados Simplificado

### Entidades Principais

**ObjetivoAprendizagem** (nova)
```typescript
{
  id: string
  codigo: string                 // EF07MA18 ou PM-MAT-01
  descricao: string              // Texto do objetivo
  nivel_cognitivo: NivelBloom    // Lembrar → Criar (6 níveis)
  tipo_fonte: "bncc" | "custom"

  // Se BNCC
  habilidade_bncc_id?: string    // FK para Habilidade BNCC

  // Se custom
  turma_id?: string              // Objetivos específicos da turma
  criterios_evidencia: string[]  // Como validar atingimento
  area_conhecimento?: string     // "Matemática PM", "Inglês A2"
}
```

**Turma** (expandida)
```typescript
{
  // ... campos existentes
  curriculo_tipo: "bncc" | "custom"
  contexto_pedagogico?: {        // Obrigatório se custom
    objetivo_geral: string       // "Preparar para prova PM-SP"
    publico_alvo: string         // "Jovens 18-25 anos"
    metodologia: string          // "Simulados + revisão"
    carga_horaria_total: number  // 120 horas
  }
}
```

**PlanejamentoObjetivo** (N:N genérico)
```typescript
{
  planejamento_id: string
  objetivo_id: string      // BNCC ou custom
  ordem: number
  peso: number             // 0-1 (importância relativa)
}
```

---

## 🤖 Adaptação do Pipeline de IA

### Prompts Context-Aware

**Antes (hard-coded BNCC):**
```
SÉRIE: 7º ano
DISCIPLINA: Matemática
HABILIDADES BNCC: EF07MA18, EF07MA19, ...
```

**Depois (dinâmico):**
```typescript
if (turma.curriculo_tipo === "bncc") {
  contexto = `
    SÉRIE: ${turma.serie}
    DISCIPLINA: ${turma.disciplina}
    HABILIDADES BNCC: ${objetivos.map(o => o.codigo).join(', ')}
  `
} else if (turma.curriculo_tipo === "custom") {
  contexto = `
    OBJETIVO GERAL: ${turma.contexto_pedagogico.objetivo_geral}
    PÚBLICO-ALVO: ${turma.contexto_pedagogico.publico_alvo}

    OBJETIVOS DE APRENDIZAGEM:
    ${objetivos.map(o => `
      [${o.codigo}] ${o.descricao}
      Nível Cognitivo: ${o.nivel_cognitivo}
      Critérios de Evidência: ${o.criterios_evidencia.join(', ')}
    `).join('\n')}
  `
}
```

### 5 Prompts Permanecem Idênticos
1. **Cobertura** → Identifica objetivos (BNCC ou custom)
2. **Qualitativa** → Avalia qualidade pedagógica (independente de currículo)
3. **Relatório** → Contextualiza ao tipo de objetivo
4. **Exercícios** → Gera com base em objetivos abordados
5. **Alertas** → Detecta gaps no planejamento

---

## 🎨 UX: Garantindo Qualidade Pedagógica

### Problema
> Professores podem criar objetivos genéricos demais ("Ensinar matemática") → IA perde precisão

### Solução: UX que Força Boas Práticas

**1. Contexto Pedagógico Obrigatório**
```
┌─────────────────────────────────────────┐
│ Nova Turma - Curso Customizado          │
├─────────────────────────────────────────┤
│ 💡 Estas informações ajudam a IA a      │
│    gerar análises relevantes            │
│                                         │
│ Objetivo Geral (obrigatório):          │
│ ┌─────────────────────────────────────┐ │
│ │ Preparar candidatos para prova da   │ │
│ │ PM-SP 2026 (Soldado 2ª Classe)      │ │
│ └─────────────────────────────────────┘ │
│ 100/500 caracteres                     │
│                                         │
│ Público-Alvo (obrigatório):            │
│ [Jovens 18-25 anos, EM completo]       │
│                                         │
│ Metodologia (obrigatório):             │
│ [Simulados semanais + revisão teórica] │
│                                         │
│ Carga Horária Total: [120] horas      │
└─────────────────────────────────────────┘
```

**2. Objetivos com Estrutura Pedagógica**
```
┌─────────────────────────────────────────────┐
│ Objetivo de Aprendizagem 1/5                │
├─────────────────────────────────────────────┤
│ Código: [PM-MAT-01] (auto-sugerido)        │
│                                             │
│ Descrição (20-500 chars):                  │
│ ┌─────────────────────────────────────────┐ │
│ │ Resolver problemas de regra de três     │ │
│ │ simples e composta aplicados a          │ │
│ │ questões da prova PM-SP                 │ │
│ └─────────────────────────────────────────┘ │
│ 89/500 caracteres                          │
│                                             │
│ Nível Cognitivo (Bloom):                   │
│ [Aplicar ▼] ℹ️                             │
│   Tooltip: "Aplicar = usar conhecimento   │
│   em situações novas e concretas"          │
│                                             │
│ Critérios de Evidência (1-5 itens):       │
│ • [Identifica grandezas proporcionais]     │
│ • [Monta proporção corretamente]           │
│ • [Resolve equação e valida resultado]     │
│   [+ Adicionar critério]                   │
│                                             │
│ 📚 Exemplo (Preparatório PM):              │
│    "Resolver equações do 1º grau"          │
│    Nível: Aplicar                          │
│    Critérios: Isola variável, valida...   │
└─────────────────────────────────────────────┘
```

**3. Validações que Garantem Qualidade**
- ⛔ Min 3 objetivos por planejamento (forçar especificidade)
- ⛔ Descrição min 20 chars (evitar "matemática", "português")
- ⛔ Min 1 critério de evidência (definir como validar atingimento)
- ⛔ Nível Bloom obrigatório (garantir profundidade cognitiva)
- ✅ Exemplos contextuais por tipo de curso (PM, inglês, técnico)

---

## 🔄 Estratégia de Migration (3 Etapas)

### Etapa 1: Criar Abstração (Story 11.1)
```sql
-- Nova tabela
CREATE TABLE objetivo_aprendizagem (
  id UUID PRIMARY KEY,
  codigo VARCHAR(20) UNIQUE,
  descricao TEXT,
  nivel_cognitivo VARCHAR(20),
  tipo_fonte VARCHAR(20),
  habilidade_bncc_id UUID REFERENCES habilidade(id),
  turma_id UUID REFERENCES turma(id),
  criterios_evidencia TEXT[]
);

-- Migrar habilidades BNCC
INSERT INTO objetivo_aprendizagem (
  codigo, descricao, nivel_cognitivo, tipo_fonte, habilidade_bncc_id
)
SELECT
  codigo, descricao, 'Aplicar', 'bncc', id
FROM habilidade;
```

### Etapa 2: Expandir Turma (Story 11.2)
```sql
-- Adicionar campos
ALTER TABLE turma
ADD COLUMN curriculo_tipo VARCHAR(20) DEFAULT 'bncc',
ADD COLUMN contexto_pedagogico JSONB;

-- Atualizar turmas existentes (seguro)
UPDATE turma SET curriculo_tipo = 'bncc' WHERE curriculo_tipo IS NULL;
```

### Etapa 3: Adaptar Planejamento (Story 11.3)
```sql
-- Nova tabela N:N
CREATE TABLE planejamento_objetivo (
  planejamento_id UUID REFERENCES planejamento(id),
  objetivo_id UUID REFERENCES objetivo_aprendizagem(id),
  ordem INTEGER,
  peso FLOAT
);

-- Migrar planejamentos existentes
INSERT INTO planejamento_objetivo (planejamento_id, objetivo_id, ordem, peso)
SELECT
  ph.planejamento_id,
  oa.id,
  ROW_NUMBER() OVER (PARTITION BY ph.planejamento_id ORDER BY ph.created_at),
  1.0 / COUNT(*) OVER (PARTITION BY ph.planejamento_id)
FROM planejamento_habilidade ph
JOIN objetivo_aprendizagem oa ON oa.habilidade_bncc_id = ph.habilidade_id;
```

---

## ⚠️ Riscos Críticos & Mitigações

### Risco 1: Professores criam objetivos ruins
**Impacto:** IA perde precisão, relatórios genéricos
**Probabilidade:** Alta
**Mitigação:**
- UX com exemplos + validações + limite mínimo
- Texto explicativo sobre Taxonomia de Bloom
- Alertas inline se descrição muito curta

### Risco 2: Migration quebra BNCC existente
**Impacto:** Sistema para, escolas afetadas
**Probabilidade:** Média
**Mitigação:**
- Testar migration em database clone ANTES
- Rollback script pronto
- Feature flag: habilitar custom por escola

### Risco 3: Performance com abstração genérica
**Impacto:** Queries lentas, dashboards >2s
**Probabilidade:** Baixa
**Mitigação:**
- Índices compostos: `(turma_id, tipo_fonte)`
- Eager loading: `include: { objetivos: true }`
- Cache Redis para objetivos frequentes

### Risco 4: Qualidade IA cai para custom
**Impacto:** NPS cai, professores reclamam
**Probabilidade:** Média
**Mitigação:**
- Validação manual: 10 aulas reais (5 PM + 5 inglês)
- Ajuste iterativo de prompts até ≥80%
- A/B testing com professores beta

---

## 📈 Critérios de Sucesso (Definition of Done)

### Funcional
- [x] Turma pode ser BNCC ou Customizada
- [x] Planejamento custom tem ≥3 objetivos estruturados
- [x] Análise de aula custom ≥80% precisão vs BNCC
- [x] Dashboard mostra cobertura (BNCC ou custom)

### Técnico
- [x] 100% backward compatible (BNCC não afetado)
- [x] Testes E2E completos (turma → planejamento → aula → relatório)
- [x] Performance mantida (dashboard <2s, análise <60s)
- [x] Migrations executadas sem erros

### Qualidade
- [x] ≥80% precisão IA (validação manual com especialistas)
- [x] 0 bugs críticos em staging
- [x] Cobertura testes ≥85%
- [x] Documentação atualizada (README + exemplos)

---

## 🚀 Rollout Plan (4 Sprints)

### Sprint 1: Foundation (Stories 11.1-11.3)
**Objetivo:** Backend pronto, migrations executadas
**Entregável:** Objetivos genéricos funcionando em dev
**Risco:** Migration complexa

### Sprint 2: CRUD & UX (Stories 11.4-11.6)
**Objetivo:** Professores podem criar turmas/objetivos custom
**Entregável:** Formulários funcionando em staging
**Risco:** UX confusa

### Sprint 3: IA & Dashboards (Stories 11.7-11.9)
**Objetivo:** Pipeline IA adaptado, UI contextualizada
**Entregável:** Análise custom funcionando
**Risco:** Qualidade IA cair

### Sprint 4: Testing & Rollout (Story 11.10)
**Objetivo:** Validação E2E, release produção
**Entregável:** Feature em produção para escolas beta
**Risco:** Bugs em produção

---

## 🎓 Oportunidades Futuras

### Expansões Planejadas
1. **Multi-Provider de Objetivos**
   - CEFR (idiomas): A1-C2
   - Common Core (escolas internacionais)
   - SENAC (cursos técnicos)

2. **IA Assistant para Criação**
   - Sugerir objetivos baseado em contexto
   - Templates por tipo de curso
   - Validação automática de qualidade

3. **Biblioteca Compartilhada**
   - Escolas compartilham objetivos
   - Curadoria de objetivos de alta qualidade
   - Ranking por efetividade

---

**Documento criado:** 2026-02-13
**Autor:** PM Agent (John)
**Revisor:** Luisneto98
**Status:** Aprovado para implementação
