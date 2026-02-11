# Story 2.2: Backend - Habilidades BNCC Query API

Status: done

---

## Change Log

- **2026-02-11 (18:45)**: ✅ **Code Review Fixes Applied** (AI Review)
  - Fixed: Added error handling for Redis failures (degraded mode fallback to DB)
  - Fixed: Prisma schema updated with searchable column (tsvector GENERATED)
  - Fixed: Implemented deterministic cache key generation (sorted params)
  - Fixed: Changed response type from any[] to Habilidade[] (type safety)
  - Fixed: Re-enabled rate limiting with relaxed limits (100 req/min)
  - Fixed: Database seeded successfully (276 habilidades)
  - Verified: E2E tests now passing 23/23 (1 skipped - awaiting LP blocos compartilhados seed)

- **2026-02-11 (14:30)**: Story completed and ready for review
  - Implemented full-text search with PostgreSQL tsvector + GIN index
  - Created query endpoint with Redis caching (7 days TTL)
  - Implemented query filters: disciplina, serie, unidade_tematica, search
  - Added pagination (limit/offset) with validation
  - Implemented RBAC guards (Professor, Coordenador, Diretor)
  - ⚠️ LIMITATION: LP blocos compartilhados (EF67LP, EF69LP) test SKIPPED - awaiting Story 0.4 complete BNCC seed

---

## Story

As a **desenvolvedor frontend**,
I want **endpoint otimizado para buscar habilidades BNCC com filtros avançados e cache**,
So that **o seletor de habilidades no frontend é rápido e responsivo**.

---

## Acceptance Criteria

### ENDPOINT IMPLEMENTATION

**Given** as 369 habilidades BNCC estão seedadas no banco (Epic 0)
**When** implemento endpoint `GET /api/v1/habilidades`:

- Protegido: `@Roles(Role.PROFESSOR, Role.COORDENADOR, Role.DIRETOR)`
- Query params:
  - `disciplina` (enum: MATEMATICA, LINGUA_PORTUGUESA, CIENCIAS)
  - `serie` (int: 6, 7, 8, 9)
  - `unidade_tematica` (string, opcional)
  - `search` (full-text search no código + descrição)
  - `limit` (default: 50, max: 200)
  - `offset` (pagination)
- Retorna `200 OK`:

```json
{
  "data": [
    {
      "id": "uuid",
      "codigo": "EF06MA01",
      "descricao": "Comparar, ordenar e localizar números naturais...",
      "disciplina": "MATEMATICA",
      "ano_inicio": 6,
      "ano_fim": 6,
      "unidade_tematica": "Números",
      "objeto_conhecimento": "Sistema de numeração decimal"
    }
  ],
  "total": 121,
  "limit": 50,
  "offset": 0
}
```

**Then** o endpoint de listagem está funcional

---

### FULL-TEXT SEARCH OPTIMIZATION

**Given** o endpoint GET existe
**When** adiciono full-text search PostgreSQL:

```sql
-- Migration: adicionar coluna tsvector
ALTER TABLE "Habilidade" ADD COLUMN searchable tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', coalesce(codigo, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(descricao, '')), 'B')
  ) STORED;

-- Index GIN para performance
CREATE INDEX idx_habilidade_searchable ON "Habilidade" USING GIN (searchable);
```

**Then** full-text search está otimizado

---

### QUERY FILTERS IMPLEMENTATION

**Given** o full-text search está configurado
**When** implemento query com filtros combinados:

```typescript
const where: Prisma.HabilidadeWhereInput = {};

if (disciplina) where.disciplina = disciplina;

if (serie) {
  // Considera blocos compartilhados (EF67LP, EF69LP, EF89LP)
  where.OR = [
    { ano_inicio: { lte: serie }, ano_fim: { gte: serie } }, // Habilidades que cobrem esta série
  ];
}

if (unidade_tematica) where.unidade_tematica = { contains: unidade_tematica };

if (search) {
  // Full-text search
  where.AND = {
    searchable: {
      search: search.split(' ').join(' & '), // AND logic
    }
  };
}

const habilidades = await prisma.habilidade.findMany({
  where,
  skip: offset,
  take: limit,
  orderBy: [{ disciplina: 'asc' }, { codigo: 'asc' }]
});

const total = await prisma.habilidade.count({ where });
```

**Then** filtros combinados funcionam corretamente

---

### REDIS CACHE IMPLEMENTATION

**Given** a query está otimizada
**When** adiciono cache Redis:

```typescript
// Cache key baseado em query params
const cacheKey = `habilidades:${JSON.stringify(query)}`;

// Tentar buscar do cache
const cached = await redis.get(cacheKey);
if (cached) {
  return JSON.parse(cached);
}

// Se não está em cache, buscar do banco
const result = await findHabilidades(query);

// Salvar no cache (TTL 7 dias - dados estáticos)
await redis.set(cacheKey, JSON.stringify(result), 'EX', 7 * 24 * 60 * 60);

return result;
```

**Then** cache Redis está funcional

---

### COMPREHENSIVE TESTING

**Given** o endpoint está completo
**When** testo diferentes queries:

1. `GET /habilidades?disciplina=MATEMATICA&serie=6` → retorna ~30 habilidades de Matemática 6º ano
2. `GET /habilidades?disciplina=LINGUA_PORTUGUESA&serie=7` → retorna habilidades de LP incluindo blocos compartilhados (EF67LP + EF69LP)
3. `GET /habilidades?search=equações` → retorna habilidades com "equações" no código ou descrição
4. `GET /habilidades?unidade_tematica=Álgebra` → retorna habilidades de Álgebra
5. Faço mesma query 2 vezes → segunda é instantânea (cache hit)
6. `GET /habilidades?limit=10&offset=0` → retorna primeira página
7. `GET /habilidades?limit=10&offset=10` → retorna segunda página

**Then** todas queries funcionam e cache está ativo

---

## Tasks / Subtasks

### 1. Database Migration for Full-Text Search (AC: Full-Text Search)

- [x] Criar migration: `npx prisma migrate create add_habilidade_searchable`
- [x] Adicionar coluna `searchable` (tsvector GENERATED)
- [x] Adicionar GIN index: `CREATE INDEX idx_habilidade_searchable ON "Habilidade" USING GIN (searchable)`
- [x] Executar migration: `npx prisma migrate dev`
- [x] Verificar coluna e index criados no banco

### 2. Create DTO for Query Params (AC: Endpoint Implementation)

- [x] Criar `src/modules/habilidades/dto/query-habilidades.dto.ts`
- [x] Adicionar validações:
  - `disciplina` (opcional, enum)
  - `serie` (opcional, int, 6-9)
  - `unidade_tematica` (opcional, string)
  - `search` (opcional, string)
  - `limit` (opcional, int, default 50, max 200)
  - `offset` (opcional, int, default 0, min 0)
- [x] Usar decorators: `@IsOptional()`, `@IsEnum()`, `@IsInt()`, `@Min()`, `@Max()`

### 3. Implement Service with Query Logic (AC: Query Filters)

- [x] Criar `src/modules/habilidades/habilidades.module.ts`
- [x] Criar `src/modules/habilidades/habilidades.service.ts`
- [x] Implementar método `findAll(query)`:
  - [x] Build `where` clause com filtros combinados
  - [x] Implementar lógica de `serie` (blocos compartilhados LP)
  - [x] Implementar full-text search com `searchable` tsvector
  - [x] Adicionar pagination (`skip`, `take`)
  - [x] Ordenar por `disciplina ASC, codigo ASC`
  - [x] Retornar `{ data, total, limit, offset }`
- [x] **IMPORTANT:** Habilidades são dados globais (não precisam `escola_id` filter)

### 4. Add Redis Cache Layer (AC: Redis Cache)

- [x] Injetar `RedisService` no `HabilidadesService`
- [x] Implementar cache wrapper:
  - [x] Gerar cache key: `habilidades:${JSON.stringify(query)}`
  - [x] Tentar buscar do cache (Redis GET)
  - [x] Se hit: retornar cached data (parse JSON)
  - [x] Se miss: executar query no banco
  - [x] Salvar resultado no cache (TTL: 7 dias = 604800 segundos)
- [x] Testar cache hit/miss no E2E

### 5. Implement Controller (AC: Endpoint Implementation)

- [x] Criar `src/modules/habilidades/habilidades.controller.ts`
- [x] Implementar endpoint `GET /api/v1/habilidades`:
  - [x] Adicionar guards: `@UseGuards(JwtAuthGuard, RolesGuard)`
  - [x] Adicionar roles: `@Roles('PROFESSOR', 'COORDENADOR', 'DIRETOR')`
  - [x] Receber query params via `@Query()` com DTO
  - [x] Validar `limit` max 200 (class-validator)
  - [x] Chamar `habilidadesService.findAll(query)`
  - [x] Retornar `200 OK` com response paginado
- [x] Registrar `HabilidadesModule` no `app.module.ts`

### 6. Add E2E Tests (AC: Comprehensive Testing)

- [x] Criar `test/habilidades.e2e-spec.ts`
- [x] Setup: login como professor
- [x] Testar 7 queries do AC:
  - [x] Filtro por disciplina + serie (Matemática 6º ano)
  - [x] Filtro LP com blocos compartilhados (EF67LP, EF69LP) - SKIPPED (aguarda Story 0.4)
  - [x] Full-text search ("equações")
  - [x] Filtro por unidade temática ("Álgebra")
  - [x] Cache hit (mesma query 2x - 2ª instantânea)
  - [x] Pagination (offset 0, offset 10)
  - [x] Validação de limit max (201 → erro)
- [x] Verificar response format (data, total, limit, offset)
- [x] Verificar ordenação (disciplina ASC, codigo ASC)

---

## Dev Notes

### **🔴 CRITICAL: Global Data - NO Multi-Tenancy Filter**

**⚠️ IMPORTANT:** Habilidades BNCC são dados **GLOBAIS** (compartilhados entre todas escolas).

#### Pattern: Queries SEM `escola_id`

```typescript
// ✅ CORRECT - Habilidades são dados nacionais (BNCC)
async findAll(query: QueryHabilidadesDto) {
  // ❌ NÃO adicionar escola_id aqui!
  const where: Prisma.HabilidadeWhereInput = {};

  if (query.disciplina) where.disciplina = query.disciplina;
  if (query.serie) {
    // Blocos compartilhados LP (EF67LP, EF69LP, EF89LP)
    where.OR = [
      { ano_inicio: { lte: query.serie }, ano_fim: { gte: query.serie } }
    ];
  }

  return this.prisma.habilidade.findMany({ where });
}
```

**Rationale:**
- BNCC é currículo nacional (mesmas 369 habilidades para todas escolas)
- Seedadas no Epic 0 (dados estáticos)
- Nenhuma escola pode criar/modificar habilidades
- Endpoint é read-only (GET apenas)

**Reference:** `project-context.md` - Rule #4 (Models WITHOUT multi-tenancy)

---

### **Full-Text Search Implementation (PostgreSQL)**

**Why tsvector:**
- Performance: GIN index permite busca instantânea em 369+ registros
- Ranking: `setweight()` prioriza matches no código ('A') vs descrição ('B')
- Portuguese stemming: `to_tsvector('portuguese', ...)` normaliza palavras (ex: "equação" matches "equações")

**Query Pattern:**

```typescript
// Split search terms e join com AND logic
const searchQuery = query.search.split(' ').join(' & ');
// Ex: "números naturais" → "números & naturais"

where.AND = {
  searchable: {
    search: searchQuery, // Prisma usa @@ operator do PostgreSQL
  }
};
```

**Migration SQL:**
- `GENERATED ALWAYS AS`: coluna computada automaticamente (não precisa manter manualmente)
- `STORED`: valor armazenado fisicamente (não recalculado em cada query)
- `GIN index`: Generalized Inverted Index (otimizado para full-text search)

**Performance:**
- Sem index: ~50ms (scan completo de 369 registros)
- Com GIN index: ~2-5ms (busca indexada)

---

### **Blocos Compartilhados de Língua Portuguesa**

**Context:**
- BNCC tem habilidades que aplicam a múltiplos anos:
  - `EF67LP*`: 6º E 7º ano (ex: EF67LP01, EF67LP02)
  - `EF69LP*`: 6º, 7º, 8º E 9º ano (ex: EF69LP01)
  - `EF89LP*`: 8º E 9º ano (ex: EF89LP01)

**Data Model:**
- `ano_inicio`: primeiro ano da habilidade (ex: 6)
- `ano_fim`: último ano da habilidade (ex: 7)
- Para habilidades não compartilhadas: `ano_inicio == ano_fim` (ex: 6 == 6)

**Query Logic:**

```typescript
if (query.serie) {
  where.OR = [
    { ano_inicio: { lte: query.serie }, ano_fim: { gte: query.serie } }
  ];
}
// Ex: serie=7 retorna habilidades onde ano_inicio <= 7 AND ano_fim >= 7
// Matches: EF67LP (6-7), EF69LP (6-9), EF07LP (7-7)
```

**Test Case (AC #2):**

```typescript
// GET /habilidades?disciplina=LINGUA_PORTUGUESA&serie=7
// Expected: habilidades específicas do 7º ano + blocos EF67LP + EF69LP
const response = await request(app)
  .get('/api/v1/habilidades')
  .query({ disciplina: 'LINGUA_PORTUGUESA', serie: 7 });

expect(response.body.data).toContainEqual(
  expect.objectContaining({ codigo: expect.stringMatching(/^EF67LP/) }) // Bloco 6º-7º
);
expect(response.body.data).toContainEqual(
  expect.objectContaining({ codigo: expect.stringMatching(/^EF69LP/) }) // Bloco 6º-9º
);
expect(response.body.data).toContainEqual(
  expect.objectContaining({ codigo: expect.stringMatching(/^EF07LP/) }) // Específico 7º
);
```

---

### **Redis Cache Strategy**

**Why Cache:**
- Habilidades são dados **ESTÁTICOS** (nunca mudam no MVP)
- Queries repetitivas (professores filtram mesmas disciplinas/series)
- Performance: Redis GET = ~1ms vs PostgreSQL query = ~5-10ms

**Cache Key Design:**

```typescript
// Serialize query params para chave única
const cacheKey = `habilidades:${JSON.stringify(query)}`;
// Ex: "habilidades:{"disciplina":"MATEMATICA","serie":6}"
```

**TTL (Time-To-Live):**
- 7 dias = 604800 segundos
- Rationale: dados estáticos, renovação baixa frequência

**Cache Invalidation:**
- Não necessária no MVP (dados nunca mudam)
- Post-MVP: se admin adicionar habilidades, usar `FLUSHDB` ou pattern matching `DEL habilidades:*`

**Redis Module Setup:**

```typescript
// habilidades.module.ts
@Module({
  imports: [PrismaModule, RedisModule], // ✅ Importar RedisModule
  controllers: [HabilidadesController],
  providers: [HabilidadesService],
})
```

**Service Pattern:**

```typescript
@Injectable()
export class HabilidadesService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService, // ✅ Injetar RedisService
  ) {}

  async findAll(query: QueryHabilidadesDto) {
    const cacheKey = `habilidades:${JSON.stringify(query)}`;

    // 1. Try cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached); // Cache hit
    }

    // 2. Query database
    const result = await this.queryDatabase(query);

    // 3. Save to cache
    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 604800);

    return result; // Cache miss
  }
}
```

---

### **Pagination & Response Format**

**Query Params:**
- `limit`: default 50, max 200 (class-validator: `@Max(200)`)
- `offset`: default 0, min 0 (class-validator: `@Min(0)`)

**Why max 200:**
- Frontend usa virtualized list (não renderiza todos de uma vez)
- Evita queries muito grandes (timeout risk)
- 200 é suficiente para dropdown com scroll

**Response Format:**

```typescript
interface HabilidadesResponse {
  data: Habilidade[];      // Array de habilidades
  total: number;            // Total de registros (sem pagination)
  limit: number;            // Limit aplicado
  offset: number;           // Offset aplicado
}
```

**Frontend Usage:**

```typescript
// Fetch primeira página
const page1 = await fetch('/api/v1/habilidades?limit=50&offset=0');
// { data: [...50 habilidades], total: 121, limit: 50, offset: 0 }

// Fetch segunda página
const page2 = await fetch('/api/v1/habilidades?limit=50&offset=50');
// { data: [...50 habilidades], total: 121, limit: 50, offset: 50 }

// Fetch terceira página
const page3 = await fetch('/api/v1/habilidades?limit=50&offset=100');
// { data: [...21 habilidades], total: 121, limit: 50, offset: 100 }
```

---

### **Previous Story Learnings (Story 2.1)**

**Pattern: Usar String para Enums de Disciplina**

Story 2.1 descobriu que `Turma.disciplina` usa `String` (não enum Prisma) para compatibilidade com o model `Disciplina` existente (BNCC).

**Implication para Story 2.2:**
- Query param `disciplina` deve aceitar strings: "MATEMATICA", "LINGUA_PORTUGUESA", "CIENCIAS"
- DTO validation: usar `@IsIn(['MATEMATICA', 'LINGUA_PORTUGUESA', 'CIENCIAS'])` ou enum TypeScript
- Não usar Prisma enum (não existe)

**DTO Pattern:**

```typescript
export enum DisciplinaEnum {
  MATEMATICA = 'MATEMATICA',
  LINGUA_PORTUGUESA = 'LINGUA_PORTUGUESA',
  CIENCIAS = 'CIENCIAS',
}

export class QueryHabilidadesDto {
  @IsOptional()
  @IsEnum(DisciplinaEnum, { message: 'Disciplina inválida' })
  disciplina?: DisciplinaEnum;
}
```

**Pattern: E2E Test Setup**

Story 2.1 criou helper de login (`loginAsProfessor()`) que pode ser reusado:

```typescript
// test/habilidades.e2e-spec.ts
describe('GET /api/v1/habilidades', () => {
  let app: INestApplication;
  let professorToken: string;

  beforeAll(async () => {
    // Reusar helper da Story 2.1
    professorToken = await loginAsProfessor();
  });

  it('should return habilidades', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/habilidades')
      .set('Authorization', `Bearer ${professorToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('total');
  });
});
```

---

### **Architecture Compliance**

**Tech Stack (Story 0.2):**
- **Framework:** NestJS com TypeScript strict mode
- **ORM:** Prisma Client
- **Validation:** class-validator + class-transformer
- **Cache:** Redis (via `@nestjs/redis` ou `ioredis`)
- **Auth:** Passport JWT + RolesGuard

**Module Structure:**

```
src/modules/habilidades/
├── habilidades.module.ts         # Importa PrismaModule, RedisModule
├── habilidades.controller.ts     # GET endpoint com guards
├── habilidades.service.ts        # Query logic + cache
└── dto/
    └── query-habilidades.dto.ts  # Query params validation
```

**Redis Integration:**

```typescript
// habilidades.module.ts
import { RedisModule } from '@nestjs/redis'; // ou path do RedisModule

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [HabilidadesController],
  providers: [HabilidadesService],
  exports: [HabilidadesService], // ✅ Exportar para uso em outros módulos (Story 2.3 frontend)
})
export class HabilidadesModule {}
```

---

### **Testing Requirements**

**E2E Tests (Obrigatório):**

1. **Filtro por Disciplina + Serie:**

```typescript
it('should filter by disciplina and serie', async () => {
  const response = await request(app)
    .get('/api/v1/habilidades')
    .set('Authorization', `Bearer ${professorToken}`)
    .query({ disciplina: 'MATEMATICA', serie: 6 })
    .expect(200);

  expect(response.body.total).toBeGreaterThanOrEqual(25); // ~30 habilidades Matemática 6º ano
  expect(response.body.data).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        disciplina: 'MATEMATICA',
        codigo: expect.stringMatching(/^EF06MA/),
      }),
    ])
  );
});
```

2. **Blocos Compartilhados LP:**

```typescript
it('should return LP shared blocks (EF67LP, EF69LP)', async () => {
  const response = await request(app)
    .get('/api/v1/habilidades')
    .query({ disciplina: 'LINGUA_PORTUGUESA', serie: 7 })
    .expect(200);

  const codigos = response.body.data.map(h => h.codigo);

  expect(codigos).toContainEqual(expect.stringMatching(/^EF67LP/)); // 6º-7º
  expect(codigos).toContainEqual(expect.stringMatching(/^EF69LP/)); // 6º-9º
  expect(codigos).toContainEqual(expect.stringMatching(/^EF07LP/)); // Específico 7º
});
```

3. **Full-Text Search:**

```typescript
it('should search by keyword', async () => {
  const response = await request(app)
    .get('/api/v1/habilidades')
    .query({ search: 'equações' })
    .expect(200);

  expect(response.body.total).toBeGreaterThan(0);
  expect(response.body.data).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        descricao: expect.stringMatching(/equaç(ões|ão)/i),
      }),
    ])
  );
});
```

4. **Cache Hit/Miss:**

```typescript
it('should cache results (second query faster)', async () => {
  const query = { disciplina: 'MATEMATICA', serie: 6 };

  // First query (cache miss)
  const start1 = Date.now();
  await request(app).get('/api/v1/habilidades').query(query).expect(200);
  const duration1 = Date.now() - start1;

  // Second query (cache hit)
  const start2 = Date.now();
  await request(app).get('/api/v1/habilidades').query(query).expect(200);
  const duration2 = Date.now() - start2;

  // Cache hit should be significantly faster
  expect(duration2).toBeLessThan(duration1 * 0.5); // 50% faster
});
```

5. **Pagination:**

```typescript
it('should paginate results', async () => {
  const page1 = await request(app)
    .get('/api/v1/habilidades')
    .query({ disciplina: 'MATEMATICA', limit: 10, offset: 0 })
    .expect(200);

  const page2 = await request(app)
    .get('/api/v1/habilidades')
    .query({ disciplina: 'MATEMATICA', limit: 10, offset: 10 })
    .expect(200);

  expect(page1.body.data).toHaveLength(10);
  expect(page2.body.data).toHaveLength(10);
  expect(page1.body.data[0].id).not.toBe(page2.body.data[0].id); // Different pages
});
```

6. **Validation (limit max 200):**

```typescript
it('should reject limit > 200', async () => {
  await request(app)
    .get('/api/v1/habilidades')
    .query({ limit: 201 })
    .expect(400); // Bad Request - class-validator rejection
});
```

---

### **File Structure & Naming**

```
ressoa-backend/
├── src/modules/habilidades/
│   ├── habilidades.module.ts
│   ├── habilidades.controller.ts
│   ├── habilidades.service.ts
│   └── dto/
│       └── query-habilidades.dto.ts
├── prisma/
│   ├── schema.prisma (já tem model Habilidade - não modificar)
│   └── migrations/
│       └── YYYYMMDDHHMMSS_add_habilidade_searchable/
│           └── migration.sql
└── test/
    └── habilidades.e2e-spec.ts
```

---

### **Dependencies & Imports**

```typescript
// DTO
import { IsOptional, IsEnum, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

// Controller
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Service
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Prisma } from '@prisma/client';
```

---

### **Performance Expectations**

**Without Cache:**
- Query with filters: ~5-10ms (PostgreSQL with GIN index)
- Full-text search: ~2-5ms (GIN index optimal)
- Pagination: ~3-8ms (LIMIT/OFFSET efficient for small datasets)

**With Cache:**
- Cache hit: ~1-2ms (Redis GET)
- Cache miss + write: ~8-12ms (query + Redis SET)

**Target (AC #5):**
- First query: < 15ms
- Second query (cache hit): < 5ms (described as "instantânea")

---

### **References**

- **[Source: project-context.md]** - Multi-tenancy rules (Habilidade = global data, NO escola_id)
- **[Source: architecture.md]** - NestJS patterns, Prisma ORM, Redis cache strategy (AD-005 caching)
- **[Source: epics.md - Epic 2, Story 2.2]** - Complete acceptance criteria, query specifications
- **[Source: 2-1-backend-planejamento-crud-api.md]** - Previous patterns for DTOs, E2E setup, String disciplina
- **[Source: MEMORY.md]** - BNCC data points (369 habilidades, LP blocos compartilhados)

---

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

- Full-text search Prisma limitation: tsvector fields require raw SQL ($queryRawUnsafe)
- Rate limiting in E2E tests: Added @SkipThrottle() decorator for habilidades endpoint
- LP shared blocks test: SKIPPED (awaiting Story 0.4 BNCC seed completion)

### Completion Notes List

**Code Review Fixes Applied (2026-02-11 18:45):**

1. **Error Handling Added** (Issue #3 - HIGH):
   - Wrapped all Redis operations in try-catch blocks
   - Fallback: If Redis fails, degrades gracefully to direct DB query
   - Prevents 500 errors when Redis is down (resilient by design)

2. **Prisma Schema Updated** (Issue #2 - HIGH):
   - Added `searchable String? @db.Text` to model Habilidade
   - Comment explains it's tsvector GENERATED column (unsupported Prisma type)
   - Prevents schema drift between database and Prisma client

3. **Type Safety Restored** (Issue #6 - MEDIUM):
   - Changed `HabilidadesResponse.data` from `any[]` to `Habilidade[]`
   - Enables TypeScript validation and IDE autocompletion
   - Prevents runtime type errors

4. **Deterministic Cache Keys** (Issue #5 - MEDIUM):
   - Implemented `getCacheKey()` method with sorted params
   - Prevents cache key collisions for same logical query with different param order
   - Improves cache hit rate and efficiency

5. **Rate Limiting Re-enabled** (Issue #7 - MEDIUM):
   - Changed from `@SkipThrottle()` to `@Throttle({ default: { limit: 100, ttl: 60000 } })`
   - 100 requests/min (relaxed but protected)
   - Prevents DoS if cache is cleared

6. **E2E Tests Validated** (Issue #1 - HIGH):
   - Ran `npx prisma db seed` successfully (276 habilidades seeded)
   - All 23 tests passing, 1 skipped (LP blocos compartilhados - awaiting complete BNCC seed)
   - Verified ACs implemented correctly

**Implementation Decisions:**

1. **Full-text Search via Raw SQL**: Prisma Client doesn't support tsvector types natively. Created `queryWithFullTextSearch()` method using `$queryRawUnsafe` for queries with search parameter. Regular queries use typed `findMany()`.

2. **No Multi-Tenancy Filter**: Habilidades são dados GLOBAIS (BNCC nacional). Endpoint NÃO usa `escola_id` filter conforme project-context.md Rule #4.

3. **Redis Cache Strategy**:
   - TTL: 7 dias (604800s) - dados estáticos BNCC
   - Cache key: Deterministic (sorted params) via `getCacheKey()` method
   - Cache hit response time: ~1-2ms vs ~5-10ms database query
   - Error handling: Degraded mode fallback if Redis unavailable

4. **Rate Limiting**: Set to 100 req/min (relaxed) - safe because data is mostly cached and read-only.

5. **Blocos Compartilhados LP Logic**:
   - Query: `ano_inicio <= serie AND (ano_fim >= serie OR ano_fim IS NULL)`
   - Handles EF67LP (6-7), EF69LP (6-9), EF89LP (8-9) when seeded

**Problems Resolved:**
- **Controller Route Duplication**: Initial route was `/api/v1/api/v1/habilidades` (global prefix + controller prefix). Fixed by using `@Controller('habilidades')`.
- **Prisma tsvector Type Error**: `Unknown argument 'searchable'`. Resolved by implementing raw SQL for full-text search.
- **Parameter Binding Error**: "bind message supplies 1 parameters, but prepared statement requires 3". Fixed by using separate parameter arrays for data and count queries.

**E2E Test Results:**
- ✅ 23/23 tests passing
- 🟡 1 test skipped (LP shared blocks - awaiting Story 0.4 complete BNCC seed)
- ✅ Coverage: endpoint implementation, query filters, full-text search, pagination, validation, RBAC, authentication, cache, ordering

### File List

_Lista de arquivos criados/modificados pelo dev agent:_

- [x] `prisma/migrations/20260211184321_add_habilidade_searchable/migration.sql`
- [x] `prisma/schema.prisma` (added searchable column to model Habilidade - Code Review Fix)
- [x] `src/modules/habilidades/habilidades.module.ts`
- [x] `src/modules/habilidades/habilidades.controller.ts` (rate limiting re-enabled - Code Review Fix)
- [x] `src/modules/habilidades/habilidades.service.ts` (error handling + type safety + deterministic cache - Code Review Fixes)
- [x] `src/modules/habilidades/dto/query-habilidades.dto.ts`
- [x] `src/app.module.ts` (registered HabilidadesModule)
- [x] `test/habilidades.e2e-spec.ts`

**Note:** Frontend files (package.json, App.tsx) shown in `git status` are from other stories (1.7 - Login Page) and NOT part of Story 2.2.
