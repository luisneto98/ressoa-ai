# Epic 10: Gestão de Turmas & Suporte a Ensino Médio

**Status:** Backlog
**Created:** 2026-02-12
**Estimated Effort:** 8-10 stories, ~4-5 semanas
**Priority:** HIGH (expande mercado + resolve gap operacional)

---

## 🎯 Goal

Permitir que Diretores e Coordenadores cadastrem turmas de forma independente, e expandir o sistema para suportar Ensino Médio (1º-3º ano EM), mantendo todas as funcionalidades pedagógicas do sistema (planejamento BNCC, análise de cobertura, dashboards) compatíveis com ambos os níveis de ensino.

---

## 👥 User Outcome

- **Diretor/Coordenador** pode criar, editar e gerenciar turmas sem depender de seeds ou admin interno
- **Professor** pode lecionar para turmas de Ensino Médio com mesma qualidade de análise pedagógica baseada em BNCC
- **Sistema** suporta escolas que oferecem Fundamental (6º-9º) E Ensino Médio (1º-3º)

---

## 📋 FRs Covered

- **Novo:** FR51: Diretor/Coordenador pode criar e gerenciar turmas
- **Novo:** FR52: Sistema suporta turmas de Ensino Médio (1º-3º ano)
- **Novo:** FR53: Sistema filtra habilidades BNCC por tipo de ensino (Fundamental vs Médio)
- **Expansão de:** FR3, FR31-FR36 (dashboards e planejamento agora incluem EM)

---

## 🚀 Key Deliverables

### Backend
- [x] Expandir modelo `Turma` com campo `tipo_ensino` (ENUM: FUNDAMENTAL, MEDIO)
- [x] Expandir enum `Serie` para incluir: PRIMEIRO_ANO_EM, SEGUNDO_ANO_EM, TERCEIRO_ANO_EM
- [x] API CRUD completa de Turmas (POST, PUT, DELETE) com RBAC
- [x] Seeding de habilidades BNCC do Ensino Médio (~500 habilidades: LGG, MAT, CNT, CHS)
- [x] Ajustar queries de habilidades para filtrar por `tipo_ensino`
- [x] Adaptar prompts de IA para considerar faixa etária 14-17 anos (EM)

### Frontend
- [x] Tela de gestão de turmas (lista, criar, editar, deletar) - acessível por Diretor/Coordenador
- [x] Formulário de turma com seletor de `tipo_ensino` + `serie` dinâmico
- [x] Adaptar seletor de habilidades BNCC em planejamento para mostrar LGG/MAT/CNT/CHS quando EM
- [x] Filtros de `tipo_ensino` em dashboards de cobertura
- [x] Badge visual diferenciando Fundamental vs Médio

### Data Migration
- [x] Adicionar `tipo_ensino = FUNDAMENTAL` para turmas existentes (default seguro)
- [x] Seed script idempotente para habilidades EM

---

## 🔧 Technical Notes

### Compatibilidade Retroativa
- Turmas existentes recebem `tipo_ensino = FUNDAMENTAL` automaticamente
- Funcionalidades antigas continuam idênticas

### BNCC Ensino Médio
- **Estrutura hierárquica diferente:** Áreas (LGG, MAT, CNT, CHS) > Competências > Habilidades
- **Código alfanumérico:** `EM13LGG101` (EM = Ensino Médio, 13 = etapa, LGG = Linguagens, 101 = habilidade)
- **~500 habilidades totais** (vs 369 do Fundamental)
- **Fonte:** BNCC oficial MEC 2018 (mesmo documento que Fundamental)

### Prompts de IA
- **Bloom Taxonomy para EM:** Ajuste de complexidade cognitiva (14-17 anos vs 11-14 anos)
- **Metodologias pedagógicas:** Apropriadas para adolescentes (mais investigação, menos direcionamento)
- **Exercícios:** Considerar preparação ENEM/vestibular (EM) vs formação básica (Fundamental)

### Permissões
- **POST/PUT/DELETE `/turmas`:** Apenas DIRETOR + COORDENADOR
- **GET `/turmas`:**
  - PROFESSOR (filtra por `professor_id`)
  - COORDENADOR/DIRETOR (todas da escola)

### Validações
- Nome único por escola + ano_letivo + turno
- Serie compatível com tipo_ensino:
  - SEXTO_ANO → NONO_ANO: só se FUNDAMENTAL
  - PRIMEIRO_ANO_EM → TERCEIRO_ANO_EM: só se MEDIO
- Disciplina válida para ambos níveis (MA/LP/CI aplicam a ambos; LGG/CNT/CHS só para EM)

---

## 📊 NFRs Addressed

- **NFR-SCALE-02:** Suporte a escolas maiores (Fundamental + Médio = ~2x volume de turmas)
- **NFR-ACCESS-02:** Navegação por teclado em formulário de turmas
- **NFR-SEC-03:** Multi-tenancy (turmas isoladas por escola_id)

---

## 🔗 Dependencies

- ✅ **Epic 0:** BNCC seeding infrastructure já existe
- ✅ **Epic 1:** RBAC foundations já existem (apenas adicionar guards em novos endpoints)
- ✅ **Epic 2:** Planejamento BNCC já existe (apenas filtrar habilidades por tipo_ensino)

---

## ⚠️ Risk Mitigation

### Risco 1: BNCC Ensino Médio tem estrutura diferente
- **Descrição:** EM não usa Unidades Temáticas, usa Competências de Área
- **Mitigação:** Modelo de dados já suporta campos opcionais; mapear hierarquia EM como JSON adicional se necessário

### Risco 2: Prompts de IA podem gerar análises inadequadas para EM
- **Descrição:** Análises muito infantilizadas ou simplificadas para faixa etária 14-17
- **Mitigação:** Criar variantes de prompts por faixa etária; A/B testing com professores EM durante rollout

---

## 📝 Stories

### Story 10.1: Backend — Expandir Modelo Turma com Tipo de Ensino e Novas Séries
**Status:** Backlog
**Effort:** 3 pontos
**Descrição:** Adicionar campo `tipo_ensino` ao modelo Turma e expandir enum `Serie` para incluir 1º-3º ano EM

### Story 10.2: Backend — API CRUD Completa de Turmas com RBAC
**Status:** Backlog
**Effort:** 5 pontos
**Descrição:** Criar endpoints POST/PUT/DELETE para turmas com permissões Diretor/Coordenador

### Story 10.3: Backend — Seeding de Habilidades BNCC do Ensino Médio
**Status:** Backlog
**Effort:** 5 pontos
**Descrição:** Mapear e inserir ~500 habilidades BNCC do EM via seed script idempotente

### Story 10.4: Frontend — Tela de Gestão de Turmas (CRUD)
**Status:** Backlog
**Effort:** 8 pontos
**Descrição:** Criar tela de listagem, formulário de criação/edição e deleção de turmas

### Story 10.5: Frontend — Adaptar Seletor de Habilidades BNCC para Ensino Médio
**Status:** Backlog
**Effort:** 5 pontos
**Descrição:** Adaptar seletor de habilidades no planejamento para mostrar habilidades EM quando aplicável

### Story 10.6: Backend — Ajustar Prompts de IA para Ensino Médio
**Status:** Backlog
**Effort:** 8 pontos
**Descrição:** Criar variantes de prompts adaptadas para faixa etária e complexidade cognitiva do EM

### Story 10.7: Frontend — Filtros de Tipo de Ensino em Dashboards
**Status:** Backlog
**Effort:** 5 pontos
**Descrição:** Adicionar filtros de tipo de ensino em dashboards de cobertura

### Story 10.8: Backend — Query Optimization para Turmas Multi-Tipo
**Status:** Backlog
**Effort:** 3 pontos
**Descrição:** Otimizar queries e adicionar índices para performance com Fundamental + Médio

### Story 10.9: Testing E2E — CRUD de Turmas & Análise EM
**Status:** Backlog
**Effort:** 8 pontos
**Descrição:** Criar suite de testes E2E para validar fluxo completo de gestão de turmas e análise EM

### Story 10.10: Documentation — Guia de Migração para Escolas com EM
**Status:** Backlog
**Effort:** 2 pontos
**Descrição:** Documentar processo de migração e uso de Ensino Médio para usuários e suporte

---

## 📈 Progress Tracking

- **Total Stories:** 10
- **Completed:** 0
- **In Progress:** 0
- **Backlog:** 10
- **Estimated Total Effort:** ~52 pontos

---

## 📅 Timeline Estimate

Assumindo time de 1 dev full-time (~13 pontos/semana):
- **Week 1-2:** Stories 10.1, 10.2, 10.3 (backend foundation)
- **Week 3:** Story 10.4 (frontend CRUD)
- **Week 4:** Stories 10.5, 10.7 (frontend adaptações)
- **Week 5:** Stories 10.6, 10.8, 10.9, 10.10 (IA, otimização, testes, docs)

**Total:** ~5 semanas

---

## ✅ Definition of Done (Epic-Level)

- [ ] Diretor/Coordenador pode criar turmas EM via UI
- [ ] Professor pode criar planejamento para turma EM com habilidades BNCC corretas
- [ ] Análise pedagógica de aula EM usa prompts apropriados para faixa etária
- [ ] Dashboards filtram por tipo de ensino (Fundamental vs Médio)
- [ ] Turmas existentes (Fundamental) continuam funcionando sem alterações
- [ ] ~500 habilidades BNCC do EM estão no banco
- [ ] Testes E2E cobrem fluxo completo (CRUD + análise EM)
- [ ] Documentação de migração está disponível
- [ ] Code review completo em todas as stories
- [ ] Performance: dashboards carregam em <2s mesmo com 2x turmas

---

## 🔄 Retrospective (Após Conclusão)

_A ser preenchido após conclusão do épico_

### What Went Well
- TBD

### What Could Be Improved
- TBD

### Action Items
- TBD

---

## 📚 References

- [PRD](../planning-artifacts/prd.md)
- [Architecture](../planning-artifacts/architecture.md)
- [BNCC Mapeamento Curricular](../planning-artifacts/bncc-mapeamento-curricular-2026-02-06.md)
- [Epics Master File](../planning-artifacts/epics.md) - Ver Epic 10 para detalhes completos de cada story
