# Story 11.4 Creation Summary

**Data:** 2026-02-13
**Story:** 11-4-backend-crud-objetivos-customizados
**Epic:** 11 - Suporte a Cursos Não-BNCC com Objetivos Customizados
**Status:** ready-for-dev ✅

---

## 🎯 Story Overview

**As a** professor ou coordenador
**I want** endpoints CRUD para criar, editar e deletar objetivos de aprendizagem customizados por turma
**So that** posso definir objetivos pedagógicos específicos para cursos não-BNCC (preparatórios, técnicos, idiomas)

---

## 📋 Acceptance Criteria Summary

Story define **10 Acceptance Criteria completos**:

1. **AC1:** Endpoint POST /turmas/:turma_id/objetivos — Criar objetivo customizado
2. **AC2:** Validações de negócio no DTO (7 validações detalhadas)
3. **AC3:** RBAC - Apenas professor/coordenador/diretor da turma podem criar
4. **AC4:** Validação - Turma deve ter curriculo_tipo = CUSTOM
5. **AC5:** Endpoint GET /turmas/:turma_id/objetivos — Listar objetivos
6. **AC6:** Endpoint GET /turmas/:turma_id/objetivos/:id — Buscar específico
7. **AC7:** Endpoint PATCH /turmas/:turma_id/objetivos/:id — Atualizar
8. **AC8:** Endpoint DELETE /turmas/:turma_id/objetivos/:id — Deletar (com proteção de uso)
9. **AC9:** Testes unitários completos (≥ 20 testes, coverage ≥ 85%)
10. **AC10:** Testes E2E completos (≥ 12 testes E2E)

---

## 🏗️ Arquitetura Técnica

### Padrão Nested Routes
```
/turmas/:turma_id/objetivos
  ├── POST /          → criar objetivo
  ├── GET /           → listar objetivos da turma
  ├── GET /:id        → buscar objetivo específico
  ├── PATCH /:id      → atualizar objetivo
  └── DELETE /:id     → deletar objetivo (se não em uso)
```

### Validações em 3 Camadas

1. **DTO Layer (class-validator):**
   - Código: 3-20 chars, obrigatório
   - Descrição: 20-500 chars (forçar especificidade pedagógica)
   - Nível cognitivo: enum Bloom (LEMBRAR → CRIAR)
   - Critérios evidência: 1-5 itens, cada 10-200 chars
   - Área conhecimento: opcional, max 100 chars

2. **Service Layer (regras de negócio):**
   - Turma deve ter `curriculo_tipo = CUSTOM`
   - Código único dentro da turma
   - RBAC: professor só acessa turmas próprias
   - Objetivo em uso não pode ser deletado

3. **Database Layer (constraints):**
   - Foreign key: `turma_id` → `turma.id`
   - Unique constraint: `(turma_id, codigo)` (implícito via validação service)
   - Índices: `tipo_fonte`, `turma_id` (já existem - Story 11.1)

### RBAC Multi-Layer

```typescript
// 1. Guard Layer
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PROFESSOR, Role.COORDENADOR, Role.DIRETOR)

// 2. Service Layer
if (turma.professor_id !== user.sub && user.role === 'PROFESSOR') {
  throw new ForbiddenException('Você não tem permissão...');
}

// 3. Multi-tenancy Layer
if (turma.escola_id !== user.escola_id) {
  throw new ForbiddenException('Acesso negado');
}
```

---

## 📊 Regras de Negócio Críticas

**RN-OBJETIVO-01:** Objetivos customizados só em turmas `curriculo_tipo = CUSTOM`

**RN-OBJETIVO-02:** Código único por turma (pode repetir entre turmas)

**RN-OBJETIVO-03:** Descrição 20-500 chars (evitar genéricos tipo "matemática")

**RN-OBJETIVO-04:** 1-5 critérios de evidência por objetivo

**RN-OBJETIVO-05:** Cada critério: 10-200 chars (evitar "OK", "Sim")

**RN-OBJETIVO-06:** Objetivo em uso em planejamentos **NÃO pode ser deletado**

**RN-OBJETIVO-07:** `tipo_fonte` sempre "CUSTOM" (backend seta, não aceita do cliente)

**RN-OBJETIVO-08:** RBAC: professor/coordenador/diretor da escola

**RN-OBJETIVO-09:** Multi-tenancy: queries filtram por `turma.escola_id`

---

## 🧪 Cobertura de Testes

### Testes Unitários (≥ 20 testes)

**Grupo create():**
1. Criar objetivo com dados válidos ✅
2. Setar `tipo_fonte = CUSTOM` automaticamente ✅
3. Rejeitar turma não-CUSTOM (400) ✅
4. Rejeitar código duplicado (409) ✅
5. Rejeitar descrição < 20 chars (400) ✅
6. Rejeitar criterios_evidencia vazio (400) ✅
7. Rejeitar nível cognitivo inválido (400) ✅
8. RBAC - professor só cria em turma própria (403) ✅

**Grupo findAll():**
9. Retornar objetivos ordenados por created_at ✅
10. Retornar array vazio para turma BNCC ✅
11. RBAC - professor só lista turmas próprias (403) ✅

**Grupo findOne():**
12. Retornar objetivo por ID ✅
13. Retornar 404 se não existe ✅
14. Retornar 404 se de outra turma (isolamento) ✅

**Grupo update():**
15. Atualizar campos parcialmente (PATCH) ✅
16. Atualizar `updated_at` ✅
17. Rejeitar código duplicado (409) ✅
18. Aplicar validações ✅
19. RBAC (403) ✅

**Grupo remove():**
20. Deletar objetivo não vinculado (200) ✅
21. Impedir delete se em uso (409) ✅
22. RBAC (403) ✅

**Target:** ≥ 85% coverage em `objetivos.service.ts`

### Testes E2E (≥ 12 testes)

1. CRUD completo (create → list → update → delete) ✅
2. Turma BNCC não pode ter objetivos customizados ✅
3. Código duplicado → 409 ✅
4. Descrição < 20 chars → 400 ✅
5. Criterios vazio → 400 ✅
6. RBAC - professor não cria em turma alheia → 403 ✅
7. RBAC - coordenador cria em qualquer turma escola → 201 ✅
8. RBAC - professor outra escola → 403 ✅
9. Delete bloqueado se em uso em planejamento → 409 ✅
10. Multi-tenancy - objetivo não vaza entre escolas ✅
11. Ordenação por created_at ✅
12. Patch parcial - campos não enviados permanecem ✅

---

## 🔗 Dependências de Stories Anteriores

**Story 11.1 (ObjetivoAprendizagem):**
- ✅ Model `ObjetivoAprendizagem` criado
- ✅ Campos: `codigo`, `descricao`, `nivel_cognitivo`, `tipo_fonte`, `turma_id`, `criterios_evidencia`, `area_conhecimento`
- ✅ Enum `NivelCognitivo`: LEMBRAR, ENTENDER, APLICAR, ANALISAR, AVALIAR, CRIAR
- ✅ Índices: `tipo_fonte`, `turma_id`

**Story 11.2 (Turma com curriculo_tipo):**
- ✅ `Turma.curriculo_tipo` (BNCC | CUSTOM)
- ✅ `Turma.contexto_pedagogico` (JSONB)
- ✅ Validação: contexto obrigatório se CUSTOM

**Story 11.3 (Planejamento com objetivos):**
- ✅ `PlanejamentoObjetivo` (relação N:N)
- ✅ Planejamento aceita `objetivos[]`
- ✅ Validação: mínimo 3 objetivos

**Impacto para Story 11.4:**
- Model já existe → apenas implementar CRUD endpoints
- Verificar uso em `PlanejamentoObjetivo` antes de deletar

---

## 📁 Estrutura de Arquivos (a criar)

```
ressoa-backend/
├── src/modules/objetivos/
│   ├── objetivos.module.ts (novo)
│   ├── objetivos.controller.ts (novo)
│   ├── objetivos.service.ts (novo)
│   ├── objetivos.service.spec.ts (novo)
│   ├── dto/
│   │   ├── create-objetivo.dto.ts (novo)
│   │   ├── update-objetivo.dto.ts (novo)
│   │   └── index.ts
│   └── validators/
│       └── is-criterios-evidencia-valid.validator.ts (novo)
└── test/
    └── turmas-objetivos.e2e-spec.ts (novo)
```

---

## 🚀 Próximos Passos

### Implementação (Story 11.4)
1. Gerar resource NestJS: `nest g resource modules/objetivos --no-spec`
2. Criar DTOs com validações completas (class-validator)
3. Implementar service com lógica de negócio + RBAC
4. Implementar controller com guards + nested routes
5. Criar custom validator para `criterios_evidencia`
6. Escrever 20+ testes unitários (coverage ≥ 85%)
7. Escrever 12 testes E2E
8. Adicionar Swagger/OpenAPI docs
9. Executar code review
10. Marcar story como `done`

### Stories Seguintes (Epic 11)

**Story 11.5 (Frontend - Cadastro Turma):**
- Form criação turma custom com `contexto_pedagogico`

**Story 11.6 (Frontend - Gestão Objetivos):**
- CRUD frontend para objetivos customizados
- Form wizard com Taxonomia de Bloom

**Story 11.7 (Backend - Prompts IA):**
- Adaptar pipeline IA para objetivos genéricos
- Context dinâmico: BNCC vs CUSTOM

**Story 11.8 (Frontend - Dashboard Cobertura):**
- Dashboard adaptado para BNCC ou objetivos custom

**Story 11.10 (Testing E2E Qualidade):**
- Fluxo completo: turma custom → planejamento → aula → análise IA
- Validar ≥ 80% precisão IA

---

## 📝 Exemplo de Payload (Referência)

### POST /turmas/:turma_id/objetivos

```json
{
  "codigo": "PM-MAT-01",
  "descricao": "Resolver problemas de regra de três simples e composta aplicados a questões da prova da Polícia Militar de São Paulo, identificando grandezas proporcionais e validando resultados",
  "nivel_cognitivo": "APLICAR",
  "area_conhecimento": "Matemática - Raciocínio Lógico Quantitativo",
  "criterios_evidencia": [
    "Identifica corretamente grandezas diretamente e inversamente proporcionais em contextos de provas PM",
    "Monta a proporção correta (a/b = c/d) aplicando produto dos meios e extremos",
    "Resolve a equação resultante e valida o resultado com o contexto do problema enunciado"
  ]
}
```

### Response 201 Created

```json
{
  "id": "uuid-objetivo",
  "codigo": "PM-MAT-01",
  "descricao": "Resolver problemas de regra de três simples e composta aplicados a questões da prova da Polícia Militar de São Paulo, identificando grandezas proporcionais e validando resultados",
  "nivel_cognitivo": "APLICAR",
  "tipo_fonte": "CUSTOM",
  "area_conhecimento": "Matemática - Raciocínio Lógico Quantitativo",
  "turma_id": "uuid-turma",
  "habilidade_bncc_id": null,
  "criterios_evidencia": [
    "Identifica corretamente grandezas diretamente e inversamente proporcionais em contextos de provas PM",
    "Monta a proporção correta (a/b = c/d) aplicando produto dos meios e extremos",
    "Resolve a equação resultante e valida o resultado com o contexto do problema enunciado"
  ],
  "created_at": "2026-02-13T10:00:00Z",
  "updated_at": "2026-02-13T10:00:00Z"
}
```

---

## ✅ Checklist de Qualidade

- [x] Story com user story statement clara (As a, I want, So that)
- [x] 10 Acceptance Criteria detalhados com exemplos HTTP
- [x] Tasks quebrados em 10 tarefas com subtasks granulares
- [x] Dev Notes completo: arquitetura, RBAC, validações, performance
- [x] Regras de negócio documentadas (9 RNs críticas)
- [x] Testes especificados: 20+ unitários + 12 E2E
- [x] Estrutura de arquivos definida
- [x] Dependências de stories anteriores mapeadas
- [x] Próximos passos documentados
- [x] Exemplo de payload completo
- [x] Referências técnicas (NestJS, class-validator, Prisma)
- [x] Sprint status atualizado: `ready-for-dev`

---

## 🎓 Highlights Técnicos

**1. Nested Routes Pattern:**
- `/turmas/:turma_id/objetivos` garante isolamento por turma
- Validação de turma_id em cada request (RBAC + multi-tenancy)

**2. Validações Pedagógicas Fortes:**
- Descrição 20-500 chars (evitar genéricos)
- 1-5 critérios de evidência (qualidade pedagógica)
- Taxonomia de Bloom obrigatória (nível cognitivo)

**3. Proteção de Integridade:**
- Objetivo em uso não pode ser deletado (409 Conflict)
- Mensagem lista planejamentos afetados + sugestão

**4. RBAC Multi-Layer:**
- Guards (roles) + Service (ownership) + Database (multi-tenancy)
- Professor só acessa turmas próprias
- Coordenador/Diretor acessa toda escola

**5. Hard Delete com Proteção:**
- Remoção física (não soft delete)
- Bloqueio se em uso via consulta `PlanejamentoObjetivo`

---

**Documento criado:** 2026-02-13
**Workflow:** `/bmad:bmm:workflows:create-story`
**Agent:** Claude Sonnet 4.5
**Status:** Story ready for implementation ✅
