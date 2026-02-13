# Epic 11: Suporte a Cursos Não-BNCC com Objetivos Customizados

**Status:** Backlog
**Created:** 2026-02-13
**Estimated Effort:** 10 stories, ~3-4 sprints (~60 pontos)
**Priority:** HIGH (expande mercado + mantém qualidade pedagógica)

---

## 🎯 Goal

Permitir que o sistema atenda **cursos livres, preparatórios e técnicos** (ex: preparatório para Polícia Militar, curso de inglês, curso técnico) mantendo a **mesma qualidade de análise pedagógica** através de objetivos de aprendizagem customizados estruturados, sem depender exclusivamente da BNCC.

---

## 👥 User Outcome

- **Coordenador/Diretor** pode criar turmas de cursos livres (preparatórios, idiomas, técnicos) com objetivos de aprendizagem próprios
- **Professor de curso livre** define objetivos pedagógicos claros (descrição + nível Bloom + critérios de evidência) no planejamento
- **Sistema** analisa aulas de cursos customizados com **mesma qualidade** (≥80% precisão) que turmas BNCC
- **IA** gera relatórios contextualizados ao tipo de curso (ex: "aprofundar questões de lógica" para preparatório PM)

---

## 📋 FRs Covered

- **Novo:** FR54: Turma pode ter tipo de currículo BNCC ou Customizado
- **Novo:** FR55: Turma customizada requer contexto pedagógico (objetivo geral, público-alvo, metodologia)
- **Novo:** FR56: Professor define objetivos de aprendizagem customizados (mínimo 3 por planejamento)
- **Novo:** FR57: Objetivos customizados têm estrutura pedagógica (descrição + nível Bloom + critérios de evidência)
- **Novo:** FR58: Pipeline de IA adapta contexto dinamicamente (BNCC vs customizado)
- **Expansão de:** FR3, FR4, FR5 (planejamento, análise, dashboards agora incluem cursos customizados)

---

## 🚀 Key Deliverables

### Backend
- [ ] Criar entidade `ObjetivoAprendizagem` genérica (abstrai BNCC + customizados)
- [ ] Migrar habilidades BNCC existentes para `ObjetivoAprendizagem` (tipo_fonte = `bncc`)
- [ ] Expandir modelo `Turma` com `curriculo_tipo` (ENUM: `bncc`, `custom`) e `contexto_pedagogico` (JSON)
- [ ] Adaptar `Planejamento` para usar objetivos genéricos (N:N com `ObjetivoAprendizagem`)
- [ ] API CRUD de objetivos customizados com RBAC (professor/coordenador)
- [ ] Adaptar pipeline de IA (5 prompts) para contexto dinâmico

### Frontend
- [ ] Expandir formulário de turma com opção "Curso Customizado" + campos de contexto pedagógico
- [ ] Tela de gestão de objetivos customizados no planejamento (com exemplos e validações)
- [ ] Adaptar dashboard de cobertura para objetivos BNCC ou customizados
- [ ] Relatório de aula contextualizado (BNCC vs customizado)

### Data Migration
- [ ] Migração de habilidades BNCC para `ObjetivoAprendizagem` (seed idempotente)
- [ ] Adicionar `curriculo_tipo = bncc` para turmas existentes (default seguro)
- [ ] Migrar `PlanejamentoHabilidade` para `PlanejamentoObjetivo`

---

## 🔧 Technical Notes

### Arquitetura: Framework Híbrido de Objetivos

**Conceito Central:**
- `ObjetivoAprendizagem` é abstração genérica que unifica BNCC e objetivos customizados
- BNCC vira "provider" de objetivos (tipo_fonte: `bncc`)
- Cursos livres usam provider `custom`
- Pipeline de IA permanece idêntico (5 prompts) — apenas contexto muda

**Modelo de Dados:**
```prisma
model ObjetivoAprendizagem {
  id                   String
  codigo               String          // EF07MA18 (BNCC) ou PM-MAT-01 (custom)
  descricao            Text            // Descrição do objetivo
  nivel_cognitivo      NivelBloom      // Lembrar | Entender | Aplicar | Analisar | Avaliar | Criar
  tipo_fonte           TipoFonte       // "bncc" | "custom" | "cefr" | "senac"

  // Se BNCC
  habilidade_bncc_id   String?         // FK para Habilidade BNCC existente

  // Se custom
  turma_id             String?         // FK para Turma (objetivos específicos daquela turma)
  area_conhecimento    String?         // Ex: "Programação", "Redação ENEM", "Inglês Conversação"
  criterios_evidencia  String[]        // Como saber se foi atingido?
  contexto_json        Json?           // Metadados adicionais
}

model Turma {
  // ... campos existentes
  curriculo_tipo         CurriculoTipo  // "bncc" | "custom"
  contexto_pedagogico    Json? {
    objetivo_geral: string              // "Preparar alunos para prova PM-SP"
    publico_alvo: string                // "Jovens 18-25 anos, ensino médio completo"
    metodologia: string                 // "Simulados + revisão teórica"
    carga_horaria_total: number         // Horas totais do curso
  }
}

model PlanejamentoObjetivo {
  planejamento_id  String
  objetivo_id      String           // Pode ser BNCC ou custom
  ordem            Int
  peso             Float            // Importância relativa (0-1)
  observacoes      String?
}
```

### Compatibilidade Retroativa
- Turmas existentes recebem `curriculo_tipo = bncc` automaticamente
- Habilidades BNCC migradas para `ObjetivoAprendizagem` via seed
- Planejamentos existentes migrados para `PlanejamentoObjetivo`
- Funcionalidades BNCC continuam idênticas

### Prompts de IA (Adaptação Dinâmica)

**Prompt 1: Análise de Cobertura (adaptado)**
```
CONTEXTO DA TURMA:
- Tipo: {curriculo_tipo}
{se bncc}
  - Série: {serie}, Disciplina: {disciplina}
  - Habilidades BNCC planejadas: [lista]
{se custom}
  - Objetivo Geral: {contexto_pedagogico.objetivo_geral}
  - Público-Alvo: {contexto_pedagogico.publico_alvo}
  - Objetivos de Aprendizagem: [lista customizada com critérios de evidência]

TRANSCRIÇÃO: {texto}

TAREFA:
Identifique quais objetivos de aprendizagem foram abordados nesta aula.
Para cada objetivo identificado, forneça:
1. Evidências literais da transcrição
2. Nível de profundidade (Bloom: {nivel_cognitivo esperado})
3. % de cobertura estimada (0-100%)
```

**Prompts 2-5:** Mantêm lógica, apenas contextualizam outputs

### Casos de Uso Reais
1. **Preparatório Polícia Militar:** Matemática, Português, Raciocínio Lógico (objetivos: resolver questões específicas)
2. **Curso de Inglês:** Conversação, gramática (objetivos: atingir níveis CEFR A1-B2)
3. **Curso Técnico:** Programação, Informática (objetivos: competências profissionalizantes)

### Validações
- **Contexto pedagógico:** Obrigatório se `curriculo_tipo = custom` (4 campos)
- **Objetivos customizados:** Mínimo 3 por planejamento
- **Descrição de objetivo:** Min 20 chars, max 500 chars
- **Critérios de evidência:** Min 1 item, max 5 itens
- **Código único:** Por turma (para objetivos custom)

### Permissões
- **POST/PUT `/turmas/:id/objetivos`:** Apenas PROFESSOR + COORDENADOR da turma
- **DELETE `/objetivos/:id`:** Soft delete (erro se usado em planejamento)
- **GET `/turmas/:id/objetivos`:** PROFESSOR/COORDENADOR/DIRETOR da escola

---

## 📊 NFRs Addressed

- **NFR-SCALE-03:** Sistema genérico (suporta N tipos de currículo, não apenas BNCC)
- **NFR-USAB-03:** UX com exemplos contextuais por tipo de curso
- **NFR-QUALITY-01:** Qualidade de análise IA mantida (≥80% precisão vs baseline BNCC)
- **NFR-ACCESS-02:** Navegação por teclado em formulários de objetivos customizados

---

## 🔗 Dependencies

- ✅ **Epic 0:** BNCC seeding infrastructure (reutiliza para migração)
- ✅ **Epic 1:** RBAC foundations (adiciona guards em novos endpoints)
- ✅ **Epic 2:** Planejamento BNCC (refatora para objetivos genéricos)
- ✅ **Epic 5:** Pipeline de IA (adapta prompts para contexto dinâmico)
- ✅ **Epic 10:** Turmas expandidas (reutiliza arquitetura de enum `tipo_ensino`)

---

## ⚠️ Risk Mitigation

### Risco 1: Professores criam objetivos genéricos demais → IA perde qualidade
- **Probabilidade:** Alta
- **Impacto:** Alto
- **Mitigação:**
  - UX com exemplos contextuais por tipo de curso (PM, inglês, técnico)
  - Validação de completude (min 20 chars descrição, ≥1 critério)
  - Limite mínimo: 3 objetivos por planejamento
  - Texto explicativo inline sobre boas práticas

### Risco 2: Refactoring quebra fluxo BNCC existente
- **Probabilidade:** Média
- **Impacto:** Crítico
- **Mitigação:**
  - Migration cuidadosa em 3 etapas (objetivos → turmas → planejamentos)
  - Seed script idempotente para habilidades BNCC
  - Testes E2E de regressão ANTES de release
  - Feature flag para habilitar cursos customizados por escola

### Risco 3: Performance de queries com abstração genérica
- **Probabilidade:** Baixa
- **Impacto:** Médio
- **Mitigação:**
  - Índices compostos (`turma_id`, `tipo_fonte`)
  - Eager loading com `include` no Prisma
  - Cache Redis para objetivos frequentemente acessados
  - Materialized view `CoberturaBimestral` adaptada

### Risco 4: Qualidade de análise IA cai para cursos custom
- **Probabilidade:** Média
- **Impacto:** Alto
- **Mitigação:**
  - Validação manual com 10 aulas reais (5 PM + 5 inglês)
  - Ajuste iterativo de prompts até atingir ≥80% precisão
  - A/B testing com professores de cursos customizados
  - Feedback loop explícito (NPS após relatório)

---

## 📝 Stories

### Story 11.1: Backend — Modelo de Dados - Objetivos de Aprendizagem
**Status:** Backlog
**Effort:** 5 pontos
**Descrição:** Criar entidade `ObjetivoAprendizagem` genérica e migrar habilidades BNCC existentes

**Acceptance Criteria:**
- [ ] Model `ObjetivoAprendizagem` criado no Prisma (todos campos + constraints)
- [ ] Migration executada com sucesso
- [ ] Seed script migra 369 habilidades BNCC para objetivos (tipo_fonte = `bncc`)
- [ ] Validação: `tipo_fonte = custom` requer `criterios_evidencia` (≥1)
- [ ] Validação: `codigo` é único por `turma_id` (para custom)
- [ ] Testes unitários de validação passam

---

### Story 11.2: Backend — Expandir Turma com Tipo de Currículo
**Status:** Backlog
**Effort:** 3 pontos
**Descrição:** Adicionar campos de contexto pedagógico à `Turma` para diferenciar BNCC de cursos customizados

**Acceptance Criteria:**
- [ ] Campos `curriculo_tipo` e `contexto_pedagogico` adicionados ao model Turma
- [ ] Migration + atualização de turmas existentes (set `curriculo_tipo = bncc`)
- [ ] Validação DTO: `contexto_pedagogico` obrigatório se `curriculo_tipo != bncc`
- [ ] Endpoints `POST /turmas` e `PATCH /turmas/:id` atualizados
- [ ] Testes E2E: criar turma BNCC, criar turma custom
- [ ] Turmas existentes continuam funcionando (backward compatible)

---

### Story 11.3: Backend — Planejamento com Objetivos Genéricos
**Status:** Backlog
**Effort:** 8 pontos
**Descrição:** Adaptar `Planejamento` para usar `ObjetivoAprendizagem` (BNCC ou custom) via relacionamento N:N

**Acceptance Criteria:**
- [ ] Model `PlanejamentoObjetivo` criado (N:N com campos: ordem, peso, observacoes)
- [ ] Migration + índices compostos criados
- [ ] Service `Planejamento` atualizado (query retorna objetivos com `include`)
- [ ] Validação: mínimo 3 objetivos por planejamento
- [ ] Seed script migra `PlanejamentoHabilidade` existente para `PlanejamentoObjetivo`
- [ ] Planejamentos BNCC existentes continuam funcionando
- [ ] Query planejamento + objetivos < 100ms (índices otimizados)
- [ ] Testes unitários passam (17/17)

---

### Story 11.4: Backend — CRUD de Objetivos Customizados
**Status:** Backlog
**Effort:** 5 pontos
**Descrição:** Criar API CRUD para objetivos de aprendizagem customizados com RBAC

**Acceptance Criteria:**
- [ ] Endpoints criados: `POST/GET/PATCH/DELETE /turmas/:id/objetivos`
- [ ] DTO de validação (codigo, descricao min 20/max 500, nivel_cognitivo, criterios_evidencia min 1/max 5)
- [ ] RBAC: apenas professor/coordenador da turma pode criar/editar
- [ ] Soft delete (erro 409 se objetivo usado em planejamento)
- [ ] Código duplicado na mesma turma → erro 409
- [ ] Coordenador de outra escola não pode editar → erro 403
- [ ] Testes E2E passam (8 cenários)

---

### Story 11.5: Frontend — Cadastro de Turma com Contexto Pedagógico
**Status:** Backlog
**Effort:** 5 pontos
**Descrição:** Expandir formulário de turma para permitir criação de cursos customizados com contexto pedagógico

**Acceptance Criteria:**
- [ ] Radio group "Tipo de Currículo" adicionado (BNCC | Curso Customizado)
- [ ] Campos de contexto pedagógico aparecem apenas se "Customizado"
- [ ] Campos: objetivo_geral (100-500 chars), publico_alvo, metodologia, carga_horaria_total (min 8h)
- [ ] Tooltip com exemplo (Preparatório PM) ao passar mouse no InfoIcon
- [ ] Validação frontend mostra erros se campos incompletos
- [ ] Integração com `POST /turmas` funcionando
- [ ] Turma criada aparece no dashboard com badge "Curso Customizado"
- [ ] Testes unitários passam (5/5)

---

### Story 11.6: Frontend — Gestão de Objetivos Customizados no Planejamento
**Status:** Backlog
**Effort:** 8 pontos
**Descrição:** Criar tela de definição de objetivos customizados ao criar planejamento bimestral

**Acceptance Criteria:**
- [ ] Componente `ObjetivosCustomForm.tsx` criado (lista min 3, max 10 objetivos)
- [ ] Campos por objetivo: codigo (auto-sugerido), descricao (contador 20-500), nivel_cognitivo (select Bloom com tooltips), criterios_evidencia (lista editável)
- [ ] Exemplos contextuais por área (PM - Matemática, Inglês - Conversação)
- [ ] Níveis Bloom têm tooltip explicativo (ex: "Aplicar = usar conhecimento em situações novas")
- [ ] Validação: não permite salvar com <3 objetivos (erro inline)
- [ ] Código duplicado → erro inline "Código já usado"
- [ ] Reordenação drag-and-drop funciona
- [ ] Integração com `POST /turmas/:id/objetivos` funcionando
- [ ] Objetivos salvos aparecem no planejamento
- [ ] Testes unitários passam (12/12)

---

### Story 11.7: Backend — Adaptar Prompts de IA para Objetivos Genéricos
**Status:** Backlog
**Effort:** 13 pontos
**Descrição:** Adaptar pipeline de IA (5 prompts) para trabalhar com objetivos BNCC ou customizados dinamicamente

**Acceptance Criteria:**
- [ ] Prompt 1 (Cobertura) atualizado com contexto dinâmico (BNCC vs custom)
- [ ] Template condicional: se custom, inclui contexto_pedagogico + objetivos customizados
- [ ] Prompts 2-5 atualizados com contexto dinâmico similar
- [ ] Análise de aula BNCC continua funcionando identicamente (regressão)
- [ ] Análise de aula custom retorna: objetivos identificados (código + % cobertura), evidências literais, nível Bloom detectado vs planejado
- [ ] Testes manuais: 5 aulas preparatório PM + 5 aulas inglês
- [ ] Qualidade: ≥80% concordância com avaliação humana (validação manual)
- [ ] Performance: tempo de análise < 60s (mesmo SLA)
- [ ] Testes unitários de prompts passam (23/23)

---

### Story 11.8: Frontend — Dashboard de Cobertura Adaptado
**Status:** Backlog
**Effort:** 5 pontos
**Descrição:** Adaptar dashboard para visualizar cobertura de objetivos (BNCC ou customizados) por turma

**Acceptance Criteria:**
- [ ] Filtro "Tipo de Currículo" adicionado (BNCC | Custom | Todos)
- [ ] Card de turma mostra badge com tipo (`curriculo_tipo`)
- [ ] Métrica de cobertura adaptada: BNCC = "% Habilidades BNCC", Custom = "% Objetivos Customizados"
- [ ] Drill-down lista objetivos com status (planejado, abordado, não abordado)
- [ ] Filtrar "Tipo = Custom" mostra apenas turmas não-BNCC
- [ ] Query otimizada: `CoberturaBimestral` inclui objetivos customizados
- [ ] Dashboard mostra turmas BNCC e custom juntas
- [ ] Testes unitários passam (8/8)

---

### Story 11.9: Frontend — Relatório de Aula para Turmas Custom
**Status:** Backlog
**Effort:** 3 pontos
**Descrição:** Adaptar relatório de aula para exibir análise baseada em objetivos customizados

**Acceptance Criteria:**
- [ ] Seção "Cobertura de Objetivos" é dinâmica (BNCC: "Habilidades BNCC" | Custom: "Objetivos de Aprendizagem")
- [ ] Para cada objetivo: código, descrição, % cobertura (barra), nível Bloom planejado vs detectado, evidências (collapse/expand), badge status (✅ Atingido | ⚠️ Parcial | ❌ Não abordado)
- [ ] Seção "Sugestões para Próxima Aula" contextualizada ao curso (ex: "Aprofundar simulado de questões de lógica" para PM)
- [ ] Evidências são literais da transcrição (não parafraseadas)
- [ ] Relatório BNCC continua idêntico (regressão)
- [ ] Professor pode aprovar/rejeitar análise (fluxo existente funciona)
- [ ] Testes unitários passam (5/5)

---

### Story 11.10: Testing — Validação E2E e Qualidade de Análise
**Status:** Backlog
**Effort:** 5 pontos
**Descrição:** Validar fluxo completo de curso customizado end-to-end e qualidade de análise IA

**Acceptance Criteria:**
- [ ] Teste E2E completo (Playwright):
  - Criar turma custom (preparatório PM)
  - Definir 5 objetivos customizados no planejamento
  - Upload de aula (simulado de matemática para PM)
  - Validar análise: 3/5 objetivos identificados, evidências presentes, sugestões relevantes
  - Dashboard mostra cobertura correta
- [ ] Testes de regressão BNCC:
  - Criar turma BNCC (7º ano Matemática)
  - Validar que fluxo continua idêntico
  - 100% dos testes BNCC existentes passam
- [ ] Teste de performance:
  - 100 turmas (50 BNCC + 50 custom)
  - Dashboard carrega em <2s
- [ ] Validação manual de qualidade:
  - 10 aulas reais (5 PM + 5 inglês)
  - Concordância humano vs IA ≥80%
  - Documentar casos de falha para melhoria futura
- [ ] Documentação atualizada com exemplos (PM, inglês, técnico)

---

## 📊 Epic Metrics (Definition of Done)

### Funcional
- [ ] Turma pode ser criada como BNCC ou Curso Customizado
- [ ] Planejamento de turma custom tem ≥3 objetivos bem definidos (descrição + Bloom + critérios)
- [ ] Análise de aula custom funciona com mesma qualidade (≥80% precisão vs BNCC baseline)
- [ ] Dashboard mostra cobertura de objetivos (BNCC ou custom) corretamente
- [ ] Relatório de aula contextualizado ao tipo de curso

### Técnico
- [ ] Sistema 100% backward compatible (turmas BNCC existentes não afetadas)
- [ ] Testes E2E cobrem fluxo completo (criar turma → planejamento → aula → relatório)
- [ ] Performance mantida (dashboard <2s, análise <60s)
- [ ] Testes de regressão BNCC passam 100%
- [ ] Migrations executadas sem erros (dev + staging)

### Qualidade
- [ ] ≥80% precisão de análise IA para cursos custom (validação manual com especialistas)
- [ ] 0 bugs críticos reportados em staging
- [ ] Cobertura de testes ≥85% (backend + frontend)
- [ ] Documentação atualizada (README, exemplos, guia de boas práticas)

---

## 🎓 Learning & Innovation

### Oportunidades de Aprendizado
- Abstração de domínio complexo (BNCC → framework genérico)
- Adaptação de LLMs com contexto dinâmico (template condicional)
- UX que guia boas práticas (exemplos contextuais, validações pedagógicas)

### Inovação Técnica
- **Framework de Objetivos Híbrido:** Abstração permite adicionar futuros providers (CEFR, Common Core, SENAC) sem refactoring
- **Prompts Context-Aware:** IA adapta linguagem e critérios ao tipo de curso automaticamente
- **Validation-Driven UX:** Sistema força qualidade pedagógica via validações e exemplos

---

## 📅 Release Plan

### Sprint 1 (Stories 11.1 - 11.3)
- Backend foundation: modelos, migrations, validações
- **Risk:** Migration pode ser complexa
- **Mitigation:** Testar em dev database primeiro, rollback plan

### Sprint 2 (Stories 11.4 - 11.6)
- Backend CRUD + Frontend turmas/objetivos
- **Risk:** UX de objetivos pode ser confusa
- **Mitigation:** User testing com 2-3 professores reais

### Sprint 3 (Stories 11.7 - 11.9)
- Adaptação de IA + UI dashboards/relatórios
- **Risk:** Qualidade de IA pode cair
- **Mitigation:** Validação manual iterativa, ajuste de prompts

### Sprint 4 (Story 11.10)
- Testing E2E + validação de qualidade
- **Risk:** Descobrir bugs tarde demais
- **Mitigation:** Testing contínuo durante sprints anteriores

---

## 🚀 Post-Epic Opportunities

### Futuras Expansões
1. **Multi-Provider de Objetivos:**
   - CEFR para cursos de idiomas (A1-C2)
   - Common Core para escolas internacionais
   - SENAC para cursos técnicos profissionalizantes

2. **IA Assistant para Criação de Objetivos:**
   - Sugestões baseadas em contexto pedagógico
   - Templates por tipo de curso (PM, ENEM, idiomas)
   - Validação automática de qualidade pedagógica

3. **Biblioteca de Objetivos Compartilhados:**
   - Escolas podem compartilhar objetivos de cursos similares
   - Curadoria de objetivos de alta qualidade
   - Ranking por efetividade (feedback de análises)

---

**Épico criado em:** 2026-02-13
**Autor:** PM Agent (John)
**Aprovado por:** Luisneto98
