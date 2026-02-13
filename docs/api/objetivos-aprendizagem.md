# API: Objetivos de Aprendizagem Customizados

**Versão:** 1.0.0
**Base URL:** `/api/v1/turmas/:turma_id/objetivos`
**Autenticação:** JWT Bearer Token
**Epic:** 11 - Suporte a Cursos Customizados

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Endpoints](#endpoints)
3. [Schemas](#schemas)
4. [Exemplos de Uso](#exemplos-de-uso)
5. [Regras de Negócio](#regras-de-negócio)
6. [Erros Comuns](#erros-comuns)

---

## Visão Geral

A API de **Objetivos de Aprendizagem** permite criar, listar, atualizar e deletar objetivos customizados para turmas com `curriculo_tipo = CUSTOM`.

### Características

- ✅ CRUD completo de objetivos
- ✅ Validação de unicidade de código por turma
- ✅ RBAC: Professor só gerencia objetivos das próprias turmas
- ✅ Multi-tenancy: Isolamento por `escola_id`
- ✅ Soft delete: Objetivos deletados marcados com `deleted_at`

---

## Endpoints

### 1. Listar Objetivos de uma Turma

```http
GET /api/v1/turmas/:turma_id/objetivos
```

**Parâmetros de Caminho:**
- `turma_id` (string, UUID) - ID da turma

**Query Parameters:**
- `includeDeleted` (boolean, opcional) - Incluir objetivos deletados (default: false)

**Resposta 200 OK:**

```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "turma_id": "turma-uuid",
    "codigo_objetivo": "PM-MAT-01",
    "descricao": "Resolver questões de raciocínio lógico aplicando silogismos",
    "nivel_bloom": "APLICAR",
    "criterios_evidencia": "Uso correto de silogismos (se...então) em exemplos práticos",
    "ordem": 1,
    "created_at": "2026-02-13T10:00:00Z",
    "updated_at": "2026-02-13T10:00:00Z",
    "deleted_at": null
  },
  {
    "id": "223e4567-e89b-12d3-a456-426614174001",
    "turma_id": "turma-uuid",
    "codigo_objetivo": "PM-LOG-01",
    "descricao": "Analisar sequências lógicas e padrões numéricos",
    "nivel_bloom": "ANALISAR",
    "criterios_evidencia": "Identificação de padrões e cálculo do próximo elemento",
    "ordem": 2,
    "created_at": "2026-02-13T10:05:00Z",
    "updated_at": "2026-02-13T10:05:00Z",
    "deleted_at": null
  }
]
```

**Erros:**
- `404 Not Found` - Turma não existe ou não pertence ao professor
- `400 Bad Request` - Turma não é CUSTOM (objetivos só permitidos para turmas CUSTOM)

---

### 2. Buscar Objetivo por ID

```http
GET /api/v1/turmas/:turma_id/objetivos/:objetivo_id
```

**Parâmetros de Caminho:**
- `turma_id` (string, UUID) - ID da turma
- `objetivo_id` (string, UUID) - ID do objetivo

**Resposta 200 OK:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "turma_id": "turma-uuid",
  "codigo_objetivo": "PM-MAT-01",
  "descricao": "Resolver questões de raciocínio lógico aplicando silogismos",
  "nivel_bloom": "APLICAR",
  "criterios_evidencia": "Uso correto de silogismos (se...então) em exemplos práticos",
  "ordem": 1,
  "created_at": "2026-02-13T10:00:00Z",
  "updated_at": "2026-02-13T10:00:00Z",
  "deleted_at": null
}
```

**Erros:**
- `404 Not Found` - Objetivo não existe ou foi deletado

---

### 3. Criar Novo Objetivo

```http
POST /api/v1/turmas/:turma_id/objetivos
```

**Parâmetros de Caminho:**
- `turma_id` (string, UUID) - ID da turma CUSTOM

**Request Body:**

```json
{
  "codigo_objetivo": "PM-MAT-01",
  "descricao": "Resolver questões de raciocínio lógico aplicando silogismos",
  "nivel_bloom": "APLICAR",
  "criterios_evidencia": "Uso correto de silogismos (se...então) em exemplos práticos",
  "ordem": 1
}
```

**Validações:**
- `codigo_objetivo`: 3-20 caracteres, único por turma, apenas letras, números e hífens
- `descricao`: mínimo 20 caracteres
- `nivel_bloom`: enum válido (LEMBRAR, ENTENDER, APLICAR, ANALISAR, AVALIAR, CRIAR)
- `criterios_evidencia`: mínimo 10 caracteres
- `ordem`: opcional, default é próximo número disponível

**Resposta 201 Created:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "turma_id": "turma-uuid",
  "codigo_objetivo": "PM-MAT-01",
  "descricao": "Resolver questões de raciocínio lógico aplicando silogismos",
  "nivel_bloom": "APLICAR",
  "criterios_evidencia": "Uso correto de silogismos (se...então) em exemplos práticos",
  "ordem": 1,
  "created_at": "2026-02-13T10:00:00Z",
  "updated_at": "2026-02-13T10:00:00Z",
  "deleted_at": null
}
```

**Erros:**
- `400 Bad Request` - Turma não é CUSTOM
- `409 Conflict` - Código objetivo já existe na turma
- `400 Bad Request` - Validação falhou (descrição curta, critérios vazios, etc.)

---

### 4. Atualizar Objetivo (Parcial)

```http
PATCH /api/v1/turmas/:turma_id/objetivos/:objetivo_id
```

**Request Body (todos campos opcionais):**

```json
{
  "descricao": "Resolver questões de raciocínio lógico aplicando silogismos e inferências",
  "criterios_evidencia": "Uso correto de silogismos e identificação de falácias lógicas",
  "ordem": 2
}
```

**Resposta 200 OK:**

Retorna o objetivo atualizado (mesmo schema do GET).

**Erros:**
- `404 Not Found` - Objetivo não existe
- `409 Conflict` - Tentativa de mudar `codigo_objetivo` para um já existente
- `400 Bad Request` - Validação falhou

---

### 5. Deletar Objetivo (Soft Delete)

```http
DELETE /api/v1/turmas/:turma_id/objetivos/:objetivo_id
```

**Resposta 200 OK:**

```json
{
  "message": "Objetivo deletado com sucesso",
  "id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Regra de Negócio:**
- ⚠️ **Delete bloqueado** se objetivo está vinculado a algum planejamento ativo
- Neste caso, retorna `409 Conflict`:

```json
{
  "statusCode": 409,
  "message": "Objetivo não pode ser deletado pois está em uso em 2 planejamento(s)",
  "planejamentos": ["Planejamento Bimestre 1", "Planejamento Bimestre 2"]
}
```

**Erros:**
- `404 Not Found` - Objetivo não existe ou já foi deletado
- `409 Conflict` - Objetivo em uso (ver acima)

---

## Schemas

### ObjetivoAprendizagem

```typescript
interface ObjetivoAprendizagem {
  id: string;                // UUID
  turma_id: string;          // UUID (FK to Turma)
  codigo_objetivo: string;   // 3-20 chars, unique per turma
  descricao: string;         // Min 20 chars
  nivel_bloom: NivelBloom;   // Enum
  criterios_evidencia: string; // Min 10 chars
  ordem: number;             // Display order (1, 2, 3...)
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}
```

### NivelBloom Enum

```typescript
enum NivelBloom {
  LEMBRAR  = 'LEMBRAR',   // Recall facts
  ENTENDER = 'ENTENDER',  // Understand concepts
  APLICAR  = 'APLICAR',   // Apply knowledge
  ANALISAR = 'ANALISAR',  // Analyze information
  AVALIAR  = 'AVALIAR',   // Evaluate/judge
  CRIAR    = 'CRIAR'      // Create new work
}
```

---

## Exemplos de Uso

### Exemplo 1: Criar 5 Objetivos para Preparatório PM

```bash
# Objetivo 1
curl -X POST https://api.ressoa.ai/api/v1/turmas/turma-uuid/objetivos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "codigo_objetivo": "PM-MAT-01",
    "descricao": "Resolver questões de raciocínio lógico aplicando silogismos",
    "nivel_bloom": "APLICAR",
    "criterios_evidencia": "Uso correto de silogismos (se...então) em exemplos práticos"
  }'

# Objetivo 2
curl -X POST https://api.ressoa.ai/api/v1/turmas/turma-uuid/objetivos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "codigo_objetivo": "PM-LOG-01",
    "descricao": "Analisar sequências lógicas e padrões numéricos",
    "nivel_bloom": "ANALISAR",
    "criterios_evidencia": "Identificação de padrões e cálculo do próximo elemento"
  }'

# ... (3 mais)
```

### Exemplo 2: Atualizar Critérios de Evidência

```bash
curl -X PATCH https://api.ressoa.ai/api/v1/turmas/turma-uuid/objetivos/objetivo-uuid \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "criterios_evidencia": "Uso correto de silogismos e identificação de falácias lógicas"
  }'
```

### Exemplo 3: Deletar Objetivo (com proteção)

```bash
# Tentativa de deletar objetivo em uso
curl -X DELETE https://api.ressoa.ai/api/v1/turmas/turma-uuid/objetivos/objetivo-uuid \
  -H "Authorization: Bearer $TOKEN"

# Resposta: 409 Conflict
# {
#   "statusCode": 409,
#   "message": "Objetivo não pode ser deletado pois está em uso em 1 planejamento(s)"
# }
```

---

## Regras de Negócio

### 1. Turmas BNCC vs CUSTOM

| Regra | BNCC | CUSTOM |
|-------|------|--------|
| Pode criar objetivos customizados? | ❌ Não | ✅ Sim |
| Usa habilidades BNCC? | ✅ Sim | ❌ Não |
| Contexto pedagógico obrigatório? | ❌ Não | ✅ Sim |

**Validação:**
```http
POST /api/v1/turmas/:turma_id/objetivos
# Se turma.curriculo_tipo === 'BNCC':
# → 400 Bad Request: "Objetivos customizados só podem ser criados para turmas CUSTOM"
```

### 2. Unicidade de Código

- `codigo_objetivo` deve ser **único por turma** (case-insensitive)
- Permite reutilizar o mesmo código em **turmas diferentes**

**Exemplo:**
- Turma A: `PM-MAT-01` ✅
- Turma A: `PM-MAT-01` ❌ (duplicado)
- Turma B: `PM-MAT-01` ✅ (turma diferente)

### 3. Proteção contra Delete

Objetivo **NÃO** pode ser deletado se:
- Está vinculado a algum `Planejamento` (via `PlanejamentoObjetivo`)

**Solução:** Remover objetivo do planejamento primeiro.

### 4. Soft Delete

- DELETE marca `deleted_at = NOW()`
- Queries padrão **excluem** objetivos deletados (`WHERE deleted_at IS NULL`)
- GET com `?includeDeleted=true` mostra todos

### 5. RBAC (Role-Based Access Control)

| Role | Permissões |
|------|------------|
| **PROFESSOR** | CRUD nos objetivos das **próprias turmas** |
| **COORDENADOR** | Read-only de objetivos da escola |
| **DIRETOR** | Read-only de objetivos da escola |

**Multi-tenancy:** Todas queries incluem `WHERE turma.escola_id = :escolaId`

### 6. Ordem de Exibição

- Campo `ordem` define sequência de exibição no frontend
- Auto-incrementado se omitido no POST
- Pode ser reordenado via PATCH

---

## Erros Comuns

### Erro 400: Descrição muito curta

```json
{
  "statusCode": 400,
  "message": ["descricao must be longer than or equal to 20 characters"],
  "error": "Bad Request"
}
```

**Solução:** Descrição deve ter **mínimo 20 caracteres**.

---

### Erro 400: Turma não é CUSTOM

```json
{
  "statusCode": 400,
  "message": "Objetivos customizados só podem ser criados para turmas com curriculo_tipo = CUSTOM",
  "error": "Bad Request"
}
```

**Solução:** Verificar que `turma.curriculo_tipo === 'CUSTOM'`.

---

### Erro 409: Código duplicado

```json
{
  "statusCode": 409,
  "message": "Código objetivo 'PM-MAT-01' já existe nesta turma",
  "error": "Conflict"
}
```

**Solução:** Escolher outro código ou editar o objetivo existente.

---

### Erro 409: Objetivo em uso (delete bloqueado)

```json
{
  "statusCode": 409,
  "message": "Objetivo não pode ser deletado pois está em uso em 2 planejamento(s)",
  "planejamentos": ["Planejamento Bimestre 1", "Planejamento Bimestre 2"]
}
```

**Solução:**
1. Remover objetivo dos planejamentos listados
2. Depois tentar deletar novamente

---

### Erro 404: Turma não encontrada

```json
{
  "statusCode": 404,
  "message": "Turma não encontrada ou não pertence ao professor",
  "error": "Not Found"
}
```

**Causas possíveis:**
- Turma não existe
- Turma pertence a outro professor (RBAC)
- Turma pertence a outra escola (multi-tenancy)

---

## Swagger / OpenAPI

A documentação interativa completa está disponível em:

```
https://api.ressoa.ai/api/docs
```

### Endpoints:
- `POST   /api/v1/turmas/:turma_id/objetivos`
- `GET    /api/v1/turmas/:turma_id/objetivos`
- `GET    /api/v1/turmas/:turma_id/objetivos/:id`
- `PATCH  /api/v1/turmas/:turma_id/objetivos/:id`
- `DELETE /api/v1/turmas/:turma_id/objetivos/:id`

---

**Versão:** 1.0.0 (Epic 11)
**Última atualização:** 2026-02-13
**Referência:** Story 11.4 - Backend CRUD de Objetivos Customizados
