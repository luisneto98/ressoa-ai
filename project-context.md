# Project Context - Ressoa AI (Professor Analytics)

**Last Updated:** 2026-02-11
**Project:** Multi-tenant SaaS EdTech Platform
**Tech Stack:** React + NestJS + PostgreSQL + Redis

---

## 🔴 CRITICAL RULES - AI Agents MUST Follow

### **Multi-Tenancy Security (Story 1.3)**

⚠️ **BLOCKING REQUIREMENT:** Every database query MUST enforce tenant isolation.

#### **Rule #1: ALWAYS Add `escola_id` to WHERE Clauses**

**Background:**
- Prisma middleware is NOT available (PrismaPg adapter limitation)
- Multi-tenancy relies on **manual `escola_id` injection** in ALL queries
- Forgetting `escola_id` = **CRITICAL SECURITY VULNERABILITY** (cross-tenant data leak)

**✅ CORRECT Pattern:**

```typescript
// Protected endpoints (with TenantInterceptor context)
const escolaId = this.prisma.getEscolaIdOrThrow();
const user = await this.prisma.usuario.findUnique({
  where: {
    id: userId,
    escola_id: escolaId, // ✅ REQUIRED!
  },
});

// Public endpoints (login, refresh - use data from validated source)
const user = await this.prisma.usuario.findUnique({
  where: {
    id: parsed.userId,
    escola_id: parsed.escolaId, // ✅ REQUIRED! From validated token/payload
  },
});
```

**❌ FORBIDDEN Pattern:**

```typescript
// ❌ NEVER do this - cross-tenant data leak!
const user = await this.prisma.usuario.findUnique({
  where: { id: userId }, // Missing escola_id!
});
```

#### **Rule #2: Use Context Helpers for Protected Endpoints**

**When:** Endpoint uses `@UseGuards(JwtAuthGuard)` (authenticated requests)

**How:** Use `PrismaService.getEscolaIdOrThrow()` to get tenant context:

```typescript
@UseGuards(JwtAuthGuard)
async getProfile(@CurrentUser() user: AuthenticatedUser) {
  const escolaId = this.prisma.getEscolaIdOrThrow(); // ✅ From TenantInterceptor

  return this.prisma.usuario.findUnique({
    where: {
      id: user.userId,
      escola_id: escolaId, // ✅ Enforces tenant isolation
    },
  });
}
```

#### **Rule #3: Public Endpoints - Validate Source Before Using**

**When:** Public endpoints (login, refresh, password recovery)

**How:** Extract `escola_id` from validated source (JWT payload, Redis token data):

```typescript
// Example: Refresh token validation
const tokenData = await this.redisService.get(`refresh_token:${token}`);
const parsed = JSON.parse(tokenData) as { userId: string; escolaId: string };

// ✅ Use escolaId from validated Redis data
const user = await this.prisma.usuario.findUnique({
  where: {
    id: parsed.userId,
    escola_id: parsed.escolaId, // ✅ From validated source
  },
});
```

#### **Rule #4: Multi-Tenant Models - Complete List**

**Models requiring `escola_id` filtering:**

- ✅ `usuario` (implemented Story 1.3)
- ⏳ `turma` (future)
- ⏳ `planejamento` (future)
- ⏳ `aula` (future)
- ⏳ `relatorio` (future)
- ⏳ `exercicio` (future)
- ⏳ `cobertura_bimestral` (future)

**Models WITHOUT multi-tenancy (global data):**

- ✅ `escola` (tenant entity itself)
- ✅ `habilidade` (BNCC national curriculum - shared across all schools)
- ✅ `disciplina` (BNCC disciplines)
- ✅ `ano_escolar` (BNCC school years)

#### **Rule #5: Code Review Checklist**

Before marking any story as "done", verify:

- [ ] ALL Prisma queries include `escola_id` in WHERE clause (for multi-tenant models)
- [ ] Protected endpoints use `this.prisma.getEscolaIdOrThrow()`
- [ ] Public endpoints validate `escola_id` from trusted source (JWT, Redis)
- [ ] E2E tests verify cross-tenant access is blocked
- [ ] No queries bypass TenantInterceptor context

---

## 🔐 Authentication & Authorization

### **JWT Payload Structure (Story 1.1)**

```typescript
interface JwtPayload {
  sub: string;        // user.id
  email: string;      // user.email
  escolaId: string;   // user.escola_id (CRITICAL for multi-tenancy!)
  role: 'PROFESSOR' | 'COORDENADOR' | 'DIRETOR';
}
```

**CRITICAL:** JWT payload ALWAYS contains `escolaId` (validated in Story 1.1).

### **Request Lifecycle**

```
1. Client sends JWT → JwtAuthGuard validates
2. JwtAuthGuard populates request.user = { userId, email, escolaId, role }
3. TenantInterceptor extracts escolaId from request.user
4. TenantInterceptor injects escolaId into AsyncLocalStorage context
5. Controller/Service uses this.prisma.getEscolaIdOrThrow()
6. Prisma query includes escola_id in WHERE clause
7. PostgreSQL RLS (passive backup defense layer)
```

### **RBAC Roles (Story 1.4)**

- **PROFESSOR:** See only their own data (turmas, aulas, relatórios)
- **COORDENADOR:** See all teachers' metrics (NO raw transcriptions)
- **DIRETOR:** See aggregated school metrics only

---

## 🗄️ Database Patterns

### **Row-Level Security (RLS) - Passive for MVP**

**Status:** RLS policies configured but NOT actively enforced.

**Why:** PrismaPg adapter doesn't support setting `app.current_tenant_id` session variable.

**Defense-in-Depth:**
1. **Primary:** Application-level (TenantInterceptor + manual `escola_id` injection)
2. **Backup:** PostgreSQL RLS policies (configured, can be activated post-MVP)

**Future Activation:** Migrate to Prisma Accelerate or standard client to enable middleware.

### **Soft Deletes (LGPD Compliance)**

**Pattern:** Use `deleted_at` timestamp for soft deletes.

```typescript
// Soft delete
await prisma.aula.update({
  where: { id: aulaId, escola_id: escolaId }, // ✅ escola_id required!
  data: { deleted_at: new Date() },
});

// Queries exclude soft-deleted by default
const aulas = await prisma.aula.findMany({
  where: {
    escola_id: escolaId,
    deleted_at: null, // ✅ Exclude soft-deleted
  },
});
```

---

## 🧪 Testing Standards

### **E2E Tests - Multi-Tenancy Validation**

**REQUIRED for every new endpoint:**

```typescript
it('should enforce tenant isolation', async () => {
  // Create 2 users in different schools
  const escola1 = await createTestSchool('Escola A');
  const escola2 = await createTestSchool('Escola B');

  const user1Token = await loginUser(escola1.userId);
  const user2Token = await loginUser(escola2.userId);

  // User 1 should NOT access User 2's data
  const response = await request(app.getHttpServer())
    .get(`/api/v1/resource/${escola2.resourceId}`)
    .set('Authorization', `Bearer ${user1Token}`);

  expect(response.status).toBe(404); // ✅ Blocked by escola_id filter
});
```

### **Unit Tests - Mock Context**

```typescript
// Mock TenantInterceptor context in unit tests
jest.spyOn(prisma, 'getEscolaIdOrThrow').mockReturnValue('escola-test-123');
```

---

## 📦 Code Organization

### **Module Structure**

```
src/
├── common/
│   ├── context/           # ContextService (AsyncLocalStorage)
│   ├── interceptors/      # TenantInterceptor (global)
│   └── guards/            # JwtAuthGuard, RolesGuard
├── modules/
│   ├── auth/              # Login, logout, refresh, RBAC
│   ├── usuarios/          # User management (Story 1.6)
│   ├── planejamento/      # Planejamento CRUD (Epic 2)
│   ├── aulas/             # Aula capture & upload (Epic 3)
│   ├── transcricao/       # STT processing (Epic 4)
│   ├── analise/           # LLM pipeline (Epic 5)
│   └── dashboards/        # Metrics & coverage (Epic 7)
├── prisma/
│   ├── prisma.service.ts  # Helper: getEscolaIdOrThrow()
│   └── schema.prisma      # Data model (32 entities)
└── config/
    └── env.ts             # Environment validation (zod)
```

---

## 🚨 Common Pitfalls to Avoid

### **1. Forgetting `escola_id` in Queries**

**❌ WRONG:**
```typescript
const user = await prisma.usuario.findUnique({ where: { id } });
```

**✅ CORRECT:**
```typescript
const escolaId = this.prisma.getEscolaIdOrThrow();
const user = await prisma.usuario.findUnique({
  where: { id, escola_id: escolaId },
});
```

### **2. Using `escola_id` from Untrusted Source**

**❌ WRONG:**
```typescript
// User can manipulate request body!
const escolaId = body.escolaId;
```

**✅ CORRECT:**
```typescript
// Always use validated context or JWT payload
const escolaId = this.prisma.getEscolaIdOrThrow();
```

### **3. Querying Global Models Without Filter**

**✅ CORRECT (global data - no escola_id needed):**
```typescript
// BNCC habilidades are shared across all schools
const habilidades = await prisma.habilidade.findMany({
  where: { disciplina: 'MATEMATICA', ano: '6' },
});
```

### **4. Skipping E2E Tests for "Simple" Endpoints**

**❌ WRONG:** "This endpoint is simple, no need to test tenant isolation."

**✅ CORRECT:** EVERY endpoint with multi-tenant data MUST have E2E test.

---

## 📚 Reference Documents

- **PRD:** `_bmad-output/planning-artifacts/prd.md`
- **Architecture:** `_bmad-output/planning-artifacts/architecture.md`
- **UX Design:** `_bmad-output/planning-artifacts/ux-design-specification.md`
- **Data Model:** `_bmad-output/planning-artifacts/modelo-de-dados-entidades-2026-02-08.md`
- **AI Strategy:** `_bmad-output/planning-artifacts/estrategia-prompts-ia-2026-02-08.md`
- **Epics:** `_bmad-output/planning-artifacts/epics.md`
- **Sprint Status:** `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

## 🎯 Quick Reference Commands

```bash
# Run backend unit tests
cd ressoa-backend && npm test

# Run E2E tests
cd ressoa-backend && npm run test:e2e

# Start development environment
docker-compose up -d

# Apply Prisma migrations
cd ressoa-backend && npx prisma migrate dev

# Seed BNCC data
cd ressoa-backend && npx prisma db seed

# Check code style
cd ressoa-backend && npm run lint
cd ressoa-frontend && npm run lint
```

---

**⚠️ This document is CRITICAL for AI agents implementing new features. Violating multi-tenancy rules = SECURITY VULNERABILITY.**

**Last Security Review:** 2026-02-11 (Story 1.3 Code Review - 3 critical vulnerabilities fixed)
