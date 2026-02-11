# Story 1.4: Role-Based Access Control (RBAC Guards)

Status: done

---

## Story

As a **desenvolvedor**,
I want **guards e decorators para controlar acesso por role (Professor/Coordenador/Diretor)**,
So that **endpoints sensíveis são protegidos e cada role só acessa o que é permitido**.

---

## Acceptance Criteria

**Given** o schema Prisma tem enum `RoleUsuario` com valores: `PROFESSOR`, `COORDENADOR`, `DIRETOR`
**When** crio decorator `@Roles(...roles: RoleUsuario[])`:
```typescript
export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleUsuario[]) => SetMetadata(ROLES_KEY, roles);
```
**Then** o decorator pode ser usado em controllers

**Given** o decorator está criado
**When** crio `RolesGuard` que implementa `CanActivate`:
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleUsuario[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // Sem restrição de role
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}
```
**Then** o guard valida roles baseado em metadata

**Given** o guard está implementado
**When** aplico o guard globalmente no `AppModule`:
```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard, // Todas rotas protegidas por padrão
  },
  {
    provide: APP_GUARD,
    useClass: RolesGuard, // Validação de roles após auth
  },
]
```
**Then** todas rotas estão protegidas por autenticação e roles

**Given** os guards estão ativos
**When** marco rotas públicas com decorator `@Public()`:
```typescript
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Em JwtAuthGuard, adicionar:
canActivate(context: ExecutionContext) {
  const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
    context.getHandler(),
    context.getClass(),
  ]);
  if (isPublic) return true;
  return super.canActivate(context);
}
```
**Then** rotas públicas (login, refresh) não exigem auth

**Given** toda infraestrutura RBAC está pronta
**When** testo proteção por roles:
1. Login como Professor → token com `role: PROFESSOR`
2. Acesso endpoint `@Roles(Role.PROFESSOR)` → **200 OK**
3. Acesso endpoint `@Roles(Role.COORDENADOR)` → **403 Forbidden**
4. Login como Coordenador → token com `role: COORDENADOR`
5. Acesso endpoint `@Roles(Role.COORDENADOR, Role.DIRETOR)` → **200 OK**
6. Acesso endpoint `@Roles(Role.PROFESSOR)` → **403 Forbidden**
**Then** proteção por roles está funcional

---

## Tasks / Subtasks

- [x] Task 1: Create @Roles Decorator (AC: Roles decorator)
  - [x] Create `src/common/decorators/roles.decorator.ts`
  - [x] Define ROLES_KEY constant
  - [x] Implement Roles decorator using SetMetadata
  - [x] Export RoleUsuario enum from Prisma client
  - [x] Add JSDoc documentation

- [x] Task 2: Create RolesGuard (AC: RolesGuard implementation)
  - [x] Create `src/common/guards/roles.guard.ts`
  - [x] Inject Reflector in constructor
  - [x] Implement canActivate() method
  - [x] Use getAllAndOverride() to get required roles from metadata
  - [x] Return true if no roles required (no restriction)
  - [x] Extract user from request (populated by JwtAuthGuard)
  - [x] Return false if user or user.role is missing
  - [x] Return true if user.role is in requiredRoles array
  - [x] Add unit tests for RolesGuard

- [x] Task 3: Create @Public Decorator (AC: Public decorator)
  - [x] Create `src/common/decorators/public.decorator.ts`
  - [x] Define IS_PUBLIC_KEY constant
  - [x] Implement Public decorator using SetMetadata
  - [x] Add JSDoc documentation

- [x] Task 4: Modify JwtAuthGuard to Support @Public (AC: Public routes)
  - [x] Inject Reflector in JwtAuthGuard constructor
  - [x] Override canActivate() method
  - [x] Check for IS_PUBLIC_KEY metadata using getAllAndOverride()
  - [x] Return true immediately if route is public
  - [x] Call super.canActivate() for protected routes
  - [x] Add unit tests for @Public behavior

- [x] Task 5: Register Guards Globally in AppModule (AC: Global registration)
  - [x] Add JwtAuthGuard as global guard with APP_GUARD token
  - [x] Add RolesGuard as global guard with APP_GUARD token
  - [x] Verify execution order: JWT first, then Roles
  - [x] Document guard execution order in comments

- [x] Task 6: Update Auth Endpoints with @Public Decorator (Meta)
  - [x] Add @Public() to POST /auth/login
  - [x] Add @Public() to POST /auth/refresh
  - [x] Verify POST /auth/logout is protected (no @Public)
  - [x] Verify GET /auth/me is protected (no @Public)

- [x] Task 7: Write E2E Tests for RBAC (AC: Test role protection)
  - [x] Test: Professor can access professor-only endpoints
  - [x] Test: Professor cannot access coordenador-only endpoints (403)
  - [x] Test: Coordenador can access coordenador/diretor endpoints
  - [x] Test: Coordenador cannot access professor-only endpoints (403)
  - [x] Test: Public endpoints work without authentication
  - [x] Test: Protected endpoints without @Roles work for any authenticated user
  - [x] Test: Multi-role endpoints work correctly (@Roles(PROFESSOR, COORDENADOR))

- [x] Task 8: Create Example Protected Endpoints (Optional - for testing)
  - [x] Create test endpoint: GET /test/professor-only with @Roles(PROFESSOR)
  - [x] Create test endpoint: GET /test/coordenador-only with @Roles(COORDENADOR)
  - [x] Create test endpoint: GET /test/admin with @Roles(COORDENADOR, DIRETOR)
  - [x] Document that these are test endpoints (remove in production)

---

## Dev Notes

### 🎯 CRITICAL CONTEXT FOR IMPLEMENTATION

**Product Name:** Ressoa AI
**Story Scope:** Role-Based Access Control usando NestJS guards e decorators

Esta é a **QUARTA story do Epic 1** e a **OITAVA story do projeto**. Você está implementando RBAC (Role-Based Access Control) - a camada de autorização que controla o que cada tipo de usuário pode fazer no sistema.

**Dependências:**
- ✅ Story 1.1: JWT payload já tem `role` no token
- ✅ Story 1.1: JwtAuthGuard já existe e popula `request.user`
- ✅ Story 1.2: Login retorna user.role (PROFESSOR, COORDENADOR, DIRETOR)
- ✅ Story 1.3: TenantInterceptor já configurado

**O QUE JÁ EXISTE (NÃO RECRIAR):**
- ✅ `src/modules/auth/guards/jwt-auth.guard.ts` - JWT authentication guard
- ✅ JWT payload: `{ sub, email, escolaId, role }` (Story 1.1)
- ✅ Request.user: `{ userId, email, escolaId, role }` (populado por JwtAuthGuard)
- ✅ RoleUsuario enum: `PROFESSOR`, `COORDENADOR`, `DIRETOR` (Prisma schema)

**O QUE VOCÊ VAI CRIAR (Story 1.4):**
- ❌ @Roles decorator (SetMetadata)
- ❌ RolesGuard (CanActivate)
- ❌ @Public decorator (SetMetadata)
- ❌ Modified JwtAuthGuard (suporta @Public)
- ❌ Global guards registration (APP_GUARD)
- ❌ E2E tests para RBAC

---

### Previous Story Intelligence (Stories 1.1, 1.2, 1.3 Learnings)

**Lições da Story 1.3 (Multi-Tenancy):**

1. **PrismaPg Adapter Limitation:** Prisma v7 com PrismaPg adapter NÃO suporta `$use()` middleware
   - MVP: Rely on PostgreSQL RLS for database security
   - Future enhancement: Migrate to Prisma Accelerate

2. **Defense in Depth:** Multi-tenancy usa 4 camadas (JWT, API, App, DB)
   - RBAC segue o mesmo padrão: autenticação + autorização

3. **Guard Execution Order Matters:**
   - Guards executam na ordem de registro
   - JwtAuthGuard DEVE vir antes de RolesGuard
   - JwtAuthGuard popula request.user → RolesGuard usa request.user.role

**Lições da Story 1.2 (Login Endpoints):**

1. **JWT Payload já tem role:**
   ```typescript
   {
     sub: user.id,
     email: user.email,
     escolaId: user.escola_id,
     role: user.perfil_usuario.role // ← PROFESSOR, COORDENADOR, ou DIRETOR
   }
   ```

2. **Request.user já populado:**
   ```typescript
   request.user = {
     userId: payload.sub,
     email: payload.email,
     escolaId: payload.escolaId,
     role: payload.role // ← USE ESTE!
   }
   ```

**Lições da Story 1.1 (Auth Infrastructure):**

1. **JwtAuthGuard Pattern:**
   ```typescript
   @Injectable()
   export class JwtAuthGuard extends AuthGuard('jwt') {}
   ```

2. **Para sobrescrever canActivate():**
   ```typescript
   @Injectable()
   export class JwtAuthGuard extends AuthGuard('jwt') {
     constructor(private reflector: Reflector) {
       super();
     }

     canActivate(context: ExecutionContext) {
       // Custom logic here
       return super.canActivate(context);
     }
   }
   ```

---

### Technical Requirements

#### @Roles Decorator Implementation

**Decorator Pattern:**
```typescript
import { SetMetadata } from '@nestjs/common';
import { RoleUsuario } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator para proteger endpoints por role
 * @param roles - Lista de roles permitidas
 * @example
 * @Roles(RoleUsuario.PROFESSOR)
 * @Get('minhas-aulas')
 * getMinhasAulas() { ... }
 */
export const Roles = (...roles: RoleUsuario[]) => SetMetadata(ROLES_KEY, roles);
```

**Usage Examples:**
```typescript
// Apenas professores
@Roles(RoleUsuario.PROFESSOR)
@Get('minhas-aulas')
getMinhasAulas(@CurrentUser() user) {
  return this.aulasService.findByProfessor(user.userId);
}

// Coordenadores e Diretores
@Roles(RoleUsuario.COORDENADOR, RoleUsuario.DIRETOR)
@Get('metricas-escola')
getMetricas(@CurrentUser() user) {
  return this.metricsService.getEscolaMetrics(user.escolaId);
}

// Todos autenticados (sem @Roles)
@Get('meu-perfil')
getPerfil(@CurrentUser() user) {
  return this.usuariosService.findById(user.userId);
}
```

---

#### RolesGuard Implementation

**Guard Pattern:**
```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleUsuario } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obter roles requeridas do metadata (do decorator @Roles)
    const requiredRoles = this.reflector.getAllAndOverride<RoleUsuario[]>(
      ROLES_KEY,
      [
        context.getHandler(), // Method level
        context.getClass(),   // Controller level
      ],
    );

    // Se não tem @Roles decorator, permite acesso (sem restrição)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Obter usuário do request (populado por JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Se não tem usuário ou role, nega acesso
    if (!user || !user.role) {
      return false;
    }

    // Verifica se role do usuário está na lista de roles permitidas
    return requiredRoles.includes(user.role as RoleUsuario);
  }
}
```

**CRITICAL:** RolesGuard assume que JwtAuthGuard já executou e populou `request.user`. Por isso, JwtAuthGuard DEVE ser registrado ANTES de RolesGuard.

---

#### @Public Decorator Implementation

**Decorator Pattern:**
```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator para marcar rotas como públicas (sem autenticação)
 * @example
 * @Public()
 * @Post('login')
 * login(@Body() loginDto: LoginDto) { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

**Modified JwtAuthGuard:**
```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Verificar se rota é pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true; // Bypass JWT validation
    }

    // Executar validação JWT normal
    return super.canActivate(context);
  }
}
```

---

#### Global Guards Registration

**AppModule Configuration:**
```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';

@Module({
  imports: [/* ... */],
  providers: [
    // Global Authentication (executa primeiro)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global Authorization (executa depois)
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // Global Tenant Context (executa após guards)
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule {}
```

**Execution Order:**
```
1. JwtAuthGuard validates JWT → populates request.user
   ↓
2. RolesGuard checks @Roles metadata → validates user.role
   ↓
3. TenantInterceptor extracts escolaId → injects context
   ↓
4. Controller handler executes
```

---

### Architecture Compliance

#### RBAC Strategy (Architecture Decision #15)

**Roles Hierarchy:**
```
DIRETOR (highest privileges)
  ↓ can do everything COORDENADOR can do
COORDENADOR
  ↓ can do everything PROFESSOR can do
PROFESSOR (basic privileges)
```

**NOTA MVP:** Nesta story, não implementamos hierarquia. Cada endpoint explicitamente lista roles permitidas. Hierarquia pode ser adicionada em story futura.

**Permission Matrix (MVP):**

| Resource | PROFESSOR | COORDENADOR | DIRETOR |
|----------|-----------|-------------|---------|
| Minhas aulas | ✅ | ✅ | ✅ |
| Criar planejamento | ✅ | ✅ | ✅ |
| Ver aulas de outros professores | ❌ | ✅ | ✅ |
| Métricas de escola | ❌ | ✅ | ✅ |
| Dashboard agregado | ❌ | ❌ | ✅ |

**Implementation Examples:**
```typescript
// Professor: Minhas aulas (sem @Roles = qualquer autenticado)
@Get('aulas/minhas')
getMinhasAulas(@CurrentUser() user) { ... }

// Coordenador/Diretor: Ver todas aulas da escola
@Roles(RoleUsuario.COORDENADOR, RoleUsuario.DIRETOR)
@Get('aulas')
getAllAulas(@CurrentUser() user) { ... }

// Diretor: Dashboard agregado
@Roles(RoleUsuario.DIRETOR)
@Get('dashboard/agregado')
getDashboard(@CurrentUser() user) { ... }
```

---

### Testing Requirements

#### Unit Tests for RolesGuard

**Test Suite:** `src/common/guards/roles.guard.spec.ts`

```typescript
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RoleUsuario } from '@prisma/client';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow access if no roles required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockContext({ role: RoleUsuario.PROFESSOR });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should allow access if user has required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleUsuario.PROFESSOR]);

    const context = createMockContext({ role: RoleUsuario.PROFESSOR });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should deny access if user does not have required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleUsuario.COORDENADOR]);

    const context = createMockContext({ role: RoleUsuario.PROFESSOR });
    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should allow access if user has one of multiple required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      RoleUsuario.COORDENADOR,
      RoleUsuario.DIRETOR,
    ]);

    const context = createMockContext({ role: RoleUsuario.COORDENADOR });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should deny access if user is null', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleUsuario.PROFESSOR]);

    const context = createMockContext(null);
    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should deny access if user.role is missing', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleUsuario.PROFESSOR]);

    const context = createMockContext({ userId: '123' }); // no role
    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });
});

function createMockContext(user: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
}
```

---

#### E2E Tests for RBAC

**Test Suite:** `test/rbac.e2e-spec.ts`

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';

describe('RBAC E2E', () => {
  let app: INestApplication;
  let professorToken: string;
  let coordenadorToken: string;
  let diretorToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // Login as Professor
    const profLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'professor@escola.com', senha: 'SenhaSegura123!' });
    professorToken = profLogin.body.accessToken;

    // Login as Coordenador
    const coordLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'coordenador@escola.com', senha: 'SenhaSegura123!' });
    coordenadorToken = coordLogin.body.accessToken;

    // Login as Diretor
    const dirLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'diretor@escola.com', senha: 'SenhaSegura123!' });
    diretorToken = dirLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Professor-only endpoint', () => {
    it('should allow access for professor', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/test/professor-only')
        .set('Authorization', `Bearer ${professorToken}`);

      expect(response.status).toBe(200);
    });

    it('should deny access for coordenador', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/test/professor-only')
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(response.status).toBe(403); // Forbidden
    });

    it('should deny access without token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/test/professor-only');

      expect(response.status).toBe(401); // Unauthorized
    });
  });

  describe('Coordenador-only endpoint', () => {
    it('should allow access for coordenador', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/test/coordenador-only')
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(response.status).toBe(200);
    });

    it('should allow access for diretor', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/test/coordenador-only')
        .set('Authorization', `Bearer ${diretorToken}`);

      expect(response.status).toBe(200);
    });

    it('should deny access for professor', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/test/coordenador-only')
        .set('Authorization', `Bearer ${professorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Multi-role endpoint', () => {
    it('should allow access for coordenador', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/test/admin') // @Roles(COORDENADOR, DIRETOR)
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(response.status).toBe(200);
    });

    it('should allow access for diretor', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/test/admin')
        .set('Authorization', `Bearer ${diretorToken}`);

      expect(response.status).toBe(200);
    });

    it('should deny access for professor', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/test/admin')
        .set('Authorization', `Bearer ${professorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Public endpoints', () => {
    it('should allow login without token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'professor@escola.com', senha: 'SenhaSegura123!' });

      expect(response.status).toBe(200);
    });

    it('should allow refresh without token', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'professor@escola.com', senha: 'SenhaSegura123!' });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: loginRes.body.refreshToken });

      expect(response.status).toBe(200);
    });
  });

  describe('Protected endpoints without @Roles', () => {
    it('should allow any authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${professorToken}`);

      expect(response.status).toBe(200);
    });
  });
});
```

---

### File Structure Requirements

**Files to CREATE:**
```
src/common/decorators/
├── roles.decorator.ts              # CRIAR
└── public.decorator.ts             # CRIAR

src/common/guards/
├── roles.guard.ts                  # CRIAR
└── roles.guard.spec.ts             # CRIAR (unit tests)

test/
└── rbac.e2e-spec.ts               # CRIAR

src/modules/test/                   # CRIAR (test endpoints apenas)
├── test.controller.ts              # CRIAR (endpoints de teste para RBAC)
└── test.module.ts                  # CRIAR
```

**Files to MODIFY:**
```
src/modules/auth/guards/jwt-auth.guard.ts  # MODIFICAR (add @Public support)
src/app.module.ts                          # MODIFICAR (register global guards)
src/modules/auth/auth.controller.ts       # MODIFICAR (add @Public to login/refresh)
```

---

### Project Context Reference

**Consistency com Stories Anteriores:**
- Use JWT payload role já existente (Story 1.1)
- Use JwtAuthGuard já existente (Story 1.1)
- Use RoleUsuario enum do Prisma (Story 1.1)
- Follow NestJS guard patterns (global registration)
- Use TypeScript strict mode (todas stories)

**Security Best Practices:**
- Always check @Public before authentication
- Always validate user.role exists before checking
- Use metadata for declarative security (@Roles)
- Register guards in correct order (JWT → Roles)
- Test all role combinations

**Testing Standards:**
- Unit tests para RolesGuard (6+ test cases)
- E2E tests cobrindo todas role combinations
- Test public endpoints bypass guards
- Test protected endpoints require auth + role

---

### References

- [Source: epics.md - Epic 1, Story 1.4]
- [Source: story 1.1 - JWT with role in payload]
- [Source: story 1.2 - Login returns user.role]
- [Source: story 1.3 - Guard execution order]
- [Source: architecture.md - Decisão #15 "RBAC Strategy"]
- [Source: prd.md - FR38-FR45: Role-based permissions]

---

## Dev Agent Record

### Agent Model Used

**Model:** Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)
**Date:** 2026-02-11
**Implementation Approach:** Red-Green-Refactor TDD cycle for all components

### Debug Log References

No critical bugs encountered during implementation. All tests passed on first execution after implementation.

### Implementation Plan

**RBAC Implementation Strategy:**
1. Created @Roles decorator with ROLES_KEY metadata
2. Implemented RolesGuard with Reflector for metadata extraction
3. Created @Public decorator for marking public routes
4. Modified JwtAuthGuard to support @Public bypass
5. Registered guards globally in correct execution order (JWT → Roles)
6. Applied @Public to login and refresh endpoints
7. Created test endpoints for RBAC validation
8. Comprehensive E2E test suite (25 test cases)

**Guard Execution Flow:**
```
Request → JwtAuthGuard (auth) → RolesGuard (authz) → ThrottlerGuard (rate limit) → TenantInterceptor (context) → Controller
```

### Completion Notes List

✅ **Task 1:** @Roles decorator created with comprehensive JSDoc documentation (3 unit tests passing)

✅ **Task 2:** RolesGuard implemented with full validation logic (11 unit tests passing):
- No roles required: Allow access
- Single role: Validate exact match
- Multiple roles: Allow if user has any required role
- Missing user/role: Deny access

✅ **Task 3:** @Public decorator created with JSDoc examples (2 unit tests passing)

✅ **Task 4:** JwtAuthGuard modified to support @Public decorator (4 unit tests passing):
- Public routes bypass JWT validation
- Protected routes execute normal JWT validation
- Checks both method and class-level decorators

✅ **Task 5:** Guards registered globally in AppModule:
- Execution order: JwtAuthGuard → RolesGuard → ThrottlerGuard
- Comprehensive comments documenting execution flow
- TenantInterceptor runs after guards (as expected)

✅ **Task 6:** Auth endpoints updated with @Public decorator:
- login: @Public() added ✅
- refresh: @Public() added ✅
- logout: Protected (requires JWT) ✅
- me: Protected (requires JWT) ✅

✅ **Task 7:** E2E test suite created (25/25 tests passing):
- Professor-only endpoints: 5 tests
- Coordenador-only endpoints: 4 tests
- Multi-role endpoints: 4 tests
- Authenticated endpoints (no @Roles): 4 tests
- Public endpoints: 2 tests
- Protected auth endpoints: 4 tests
- Guard execution order validation: 2 tests

✅ **Task 8:** Test endpoints created for RBAC validation:
- GET /test/professor-only (PROFESSOR only)
- GET /test/coordenador-only (COORDENADOR only)
- GET /test/admin (COORDENADOR, DIRETOR)
- GET /test/authenticated (any authenticated user)

**Test Results:**
- Unit tests: 20/20 passing (decorators + guards)
- E2E tests (RBAC): 25/25 passing ✅
- All acceptance criteria satisfied ✅

**Architecture Compliance:**
- ✅ Follows NestJS guard patterns (global registration)
- ✅ Uses metadata for declarative security (@Roles)
- ✅ Correct execution order (auth → authz)
- ✅ Multi-tenancy security maintained (escola_id filtering)
- ✅ Defense-in-depth: Guards + TenantInterceptor + Database RLS

### File List

**Created Files:**
- `ressoa-backend/src/common/decorators/roles.decorator.ts` - @Roles decorator with ROLES_KEY
- `ressoa-backend/src/common/decorators/roles.decorator.spec.ts` - Unit tests for @Roles
- `ressoa-backend/src/common/decorators/public.decorator.ts` - @Public decorator with IS_PUBLIC_KEY
- `ressoa-backend/src/common/decorators/public.decorator.spec.ts` - Unit tests for @Public
- `ressoa-backend/src/common/guards/roles.guard.ts` - RolesGuard implementation
- `ressoa-backend/src/common/guards/roles.guard.spec.ts` - Unit tests for RolesGuard (11 tests)
- `ressoa-backend/src/modules/auth/guards/jwt-auth.guard.spec.ts` - Unit tests for JwtAuthGuard
- `ressoa-backend/src/modules/test/test.controller.ts` - Test endpoints for RBAC validation
- `ressoa-backend/src/modules/test/test.module.ts` - Test module
- `ressoa-backend/test/rbac.e2e-spec.ts` - E2E test suite (25 tests)

**Modified Files:**
- `ressoa-backend/src/modules/auth/guards/jwt-auth.guard.ts` - Added @Public support
- `ressoa-backend/src/app.module.ts` - Registered global guards (JWT, Roles, Throttler)
- `ressoa-backend/src/modules/auth/auth.controller.ts` - Added @Public to login and refresh

---

## Code Review (2026-02-11)

**Reviewer:** Claude Sonnet 4.5 (Adversarial Code Review Agent)
**Date:** 2026-02-11
**Issues Found:** 8 (3 High, 3 Medium, 2 Low)
**Issues Fixed:** 8/8 ✅

### Issues Found and Fixed

#### HIGH Issues (All Fixed ✅)

1. **TestModule exposed in production** - `app.module.ts:33`
   - **Problem:** TestModule imported unconditionally
   - **Impact:** Test endpoints accessible in production
   - **Fix:** Conditional import: `...(process.env.NODE_ENV !== 'production' ? [TestModule] : [])`

2. **Missing role enum validation** - `roles.guard.ts:64`
   - **Problem:** Type assertion without validating role is valid enum
   - **Impact:** Invalid roles could bypass security
   - **Fix:** Added validation: `Object.values(RoleUsuario).includes(user.role)`

3. **No audit logging for authorization failures** - `roles.guard.ts:60, 64`
   - **Problem:** Failed authorization attempts not logged
   - **Impact:** Impossible to audit security events
   - **Fix:** Added Logger with warn() for all authorization failures

#### MEDIUM Issues (All Fixed ✅)

4. **E2E tests assume seed data** - `rbac.e2e-spec.ts:48-72`
   - **Problem:** Tests fail if seed data missing
   - **Impact:** Test reliability depends on external state
   - **Fix:** Added programmatic user creation in beforeAll() with cleanup in afterAll()

5. **Decorator tests don't validate metadata** - `roles.decorator.spec.ts, public.decorator.spec.ts`
   - **Problem:** Tests only check decorator exists, not metadata values
   - **Impact:** Shallow test coverage
   - **Fix:** Added Reflector-based tests to verify metadata is correctly set

6. **Test endpoints no runtime safeguard** - `test.controller.ts:13-14`
   - **Problem:** Only warning comment, no runtime check
   - **Impact:** Depends on manual discipline
   - **Fix:** Added constructor check: throws error if NODE_ENV === 'production'

#### LOW Issues (All Fixed ✅)

7. **Unnecessary type assertion** - `roles.guard.ts:64, current-user.decorator.ts:7`
   - **Problem:** AuthenticatedUser.role typed as string, not RoleUsuario
   - **Impact:** Reduced type safety
   - **Fix:** Changed interface to `role: RoleUsuario`, removed type casts

8. **Redundant @UseGuards** - `auth.controller.ts:107, 200`
   - **Problem:** Explicit @UseGuards when guard is already global
   - **Impact:** Code verbosity and confusion
   - **Fix:** Removed @UseGuards and unused import

### Files Modified by Code Review

**Security Improvements:**
- `ressoa-backend/src/app.module.ts` - Conditional TestModule import
- `ressoa-backend/src/common/guards/roles.guard.ts` - Audit logging + role validation
- `ressoa-backend/src/modules/test/test.controller.ts` - Production safeguard

**Type Safety Improvements:**
- `ressoa-backend/src/modules/auth/decorators/current-user.decorator.ts` - Strong typing for role

**Test Quality Improvements:**
- `ressoa-backend/test/rbac.e2e-spec.ts` - Programmatic test data setup/teardown
- `ressoa-backend/src/common/decorators/roles.decorator.spec.ts` - Deep metadata validation
- `ressoa-backend/src/common/decorators/public.decorator.spec.ts` - Deep metadata validation

**Code Quality Improvements:**
- `ressoa-backend/src/modules/auth/auth.controller.ts` - Removed redundant decorators/imports

### Security Compliance

✅ **Multi-tenancy:** All queries enforce escola_id filtering
✅ **RBAC:** Role validation with enum check
✅ **Audit Logging:** Authorization failures logged for security monitoring
✅ **Production Safety:** Test endpoints blocked in production

### Final Status

**Story Status:** ✅ **DONE**
- All acceptance criteria met
- All tasks completed
- All HIGH and MEDIUM issues fixed
- Code quality improved
- Security hardening applied
