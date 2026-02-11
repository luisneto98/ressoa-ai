# Story 0.2: Initialize Backend Project with Core Dependencies

Status: done

---

## Story

As a **desenvolvedor**,
I want **um projeto backend NestJS configurado com Prisma, Bull queue e Redis**,
So that **posso implementar APIs REST com processamento assíncrono e acesso ao banco de dados**.

---

## Acceptance Criteria

**Given** o NestJS CLI está instalado globalmente (`npm i -g @nestjs/cli`)
**When** executo `nest new ressoa-backend --strict`
**Then** o projeto NestJS é criado com TypeScript strict mode habilitado

**Given** o projeto NestJS foi criado
**When** instalo dependências do Prisma:
- `npm install prisma --save-dev`
- `npm install @prisma/client`
- `npx prisma init`
**Then** o diretório `prisma/` é criado com `schema.prisma` e `.env` tem `DATABASE_URL`

**Given** Prisma está inicializado
**When** instalo dependências do Bull + Redis:
- `npm install @nestjs/bull bull`
- `npm install @nestjs/redis redis`
**Then** as dependências estão em `package.json` e prontas para uso

**Given** as dependências core estão instaladas
**When** instalo dependências adicionais:
- Auth: `npm install @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt`
- Validation: `npm install class-validator class-transformer`
- Types: `npm install -D @types/passport-jwt @types/bcrypt`
**Then** todas dependências essenciais estão instaladas

**Given** todas dependências estão instaladas
**When** crio estrutura modular de pastas:
```
src/
├── modules/         # feature modules (auth, aulas, planejamento, etc.)
├── common/          # shared code (guards, interceptors, pipes, decorators)
├── config/          # configuration (env validation)
├── prisma/          # Prisma service
├── app.module.ts
└── main.ts
```
**Then** a estrutura modular está pronta para desenvolvimento

**Given** a estrutura está criada
**When** configuro `main.ts` com:
- Global prefix: `app.setGlobalPrefix('api/v1')`
- CORS: `app.enableCors({ origin: process.env.CORS_ORIGIN })`
- Global pipes: `app.useGlobalPipes(new ValidationPipe())`
**Then** a configuração global está aplicada

**Given** todas configurações estão completas
**When** executo `npm run start:dev`
**Then** o servidor inicia em `http://localhost:3000` sem erros

**And** o endpoint `GET /api/v1` retorna resposta padrão do NestJS

---

## Tasks / Subtasks

- [x] Task 1: Install NestJS CLI and Create Project (AC: 1)
  - [x] Instalar NestJS CLI globalmente: `npm i -g @nestjs/cli`
  - [x] Criar projeto com TypeScript strict: `nest new ressoa-backend --strict`
  - [x] Selecionar npm como package manager
  - [x] Validar que `npm run start` inicia sem erros

- [x] Task 2: Setup Prisma ORM (AC: 2)
  - [x] Instalar Prisma: `npm install prisma --save-dev`
  - [x] Instalar Prisma Client: `npm install @prisma/client`
  - [x] Inicializar Prisma: `npx prisma init`
  - [x] Validar criação de `prisma/schema.prisma` e `.env`
  - [x] Configurar DATABASE_URL no `.env` (placeholder PostgreSQL)

- [x] Task 3: Install Bull Queue + Redis (AC: 3)
  - [x] Instalar Bull: `npm install @nestjs/bull bull`
  - [x] Instalar Redis client: ioredis (via Bull dependency; `@nestjs/redis` não existe mais no npm)
  - [x] Validar dependências em `package.json`

- [x] Task 4: Install Auth, Validation & Security Dependencies (AC: 4)
  - [x] Auth stack: `npm install @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt`
  - [x] Validation: `npm install class-validator class-transformer`
  - [x] Types: `npm install -D @types/passport-jwt @types/bcrypt`
  - [x] Swagger docs: `npm install @nestjs/swagger`
  - [x] Rate limiting: `npm install @nestjs/throttler`
  - [x] Validar todas dependências instaladas

- [x] Task 5: Create Modular Folder Structure (AC: 5)
  - [x] Criar diretórios: `modules/`, `common/`, `config/`, `prisma/`
  - [x] Criar subdiretórios em `common/`: `guards/`, `interceptors/`, `pipes/`, `decorators/`
  - [x] Criar arquivo `.env.example` com template de variáveis
  - [x] Validar estrutura contra padrão documentado (ver Dev Notes)

- [x] Task 6: Configure main.ts with Global Settings (AC: 6)
  - [x] Configurar global prefix: `app.setGlobalPrefix('api/v1')`
  - [x] Habilitar CORS: `app.enableCors({ origin: process.env.CORS_ORIGIN || '*' })`
  - [x] Aplicar global validation pipe: `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))`
  - [x] Configurar Swagger: `SwaggerModule.setup('api/docs', app, document)`

- [x] Task 7: Create Health Check Endpoint (AC: 7, 8)
  - [x] Criar `AppController` com endpoint `GET /` retornando `{ message: 'Ressoa AI API - v1' }`
  - [x] Validar que `npm run start:dev` inicia servidor em `http://localhost:3000`
  - [x] Testar endpoint: `curl http://localhost:3000/api/v1` retorna JSON

- [x] Task 8: Documentation & Cleanup (Meta)
  - [x] Criar `README.md` no projeto backend com instruções de setup
  - [x] Adicionar `.env.example` com variáveis necessárias
  - [x] Validar que `npm run build` compila sem erros
  - [x] Validar que `npm run test` executa testes padrão do NestJS

---

## Dev Notes

### 🎯 CRITICAL CONTEXT FOR IMPLEMENTATION

**Product Name:** Ressoa AI
**Backend Role:** REST API para frontend React + Workers assíncronos (STT, LLM analysis)

Esta é a **SEGUNDA story do projeto** e **PRIMEIRA story backend**. Você está criando a fundação do servidor que vai processar áudios de aula, transcrever, analisar pedagogicamente e gerar relatórios. As próximas 42 histórias dependem desta base.

**Mantenha consistência com Story 0.1:**
- ✅ Use **npm** como package manager (NÃO yarn/pnpm)
- ✅ Use **TypeScript strict mode** em todo o projeto
- ✅ Crie TODOS os diretórios imediatamente (mesmo vazios) para evitar erros futuros
- ✅ Documente tudo no README.md

---

### Previous Story Intelligence (Story 0.1 Learnings)

**Lições da Story 0.1 (Frontend Setup):**
1. **Latest versions may differ from specs:** Frontend usou React 19.2.0 (spec: 18+), Tailwind CSS 4.x (spec: 3+). ADAPTE configuração se necessário, mantendo compatibilidade.
2. **Create all directories upfront:** Frontend criou estrutura completa de pastas logo no início - faça o mesmo no backend (`modules/`, `common/`, etc.) mesmo que vazios.
3. **Package manager consistency:** Frontend usou npm - VOCÊ DEVE usar npm também no backend.
4. **README is essential:** Frontend criou README detalhado - backend precisa do mesmo.
5. **Strict TypeScript:** Frontend usou `tsconfig.json` strict - backend DEVE usar `--strict` flag no `nest new`.

---

### Technical Requirements

#### Backend Tech Stack (Architecture Decision #11)

- **Framework:** NestJS (latest stable, CLI-based setup)
- **TypeScript:** Version 5+ with **strict mode enabled** (`--strict` flag)
- **Package Manager:** npm (consistent with frontend)
- **Node.js:** 18+ LTS required
- **Module System:** ES modules (NestJS default)

**Starter Command:**
```bash
npm i -g @nestjs/cli
nest new ressoa-backend --strict
```

**Selecionar npm quando perguntado pelo package manager!**

---

### Database & ORM Configuration (Architecture Decision #12)

#### PostgreSQL Setup

- **Version:** PostgreSQL 14+ (JSON fields, full-text search, ACID)
- **Connection:** Via `DATABASE_URL` environment variable
- **Multi-Tenancy:** Row-Level Security (RLS) + `tenant_id` column (Story 1.3)

#### Prisma ORM

**Installation:**
```bash
npm install prisma --save-dev
npm install @prisma/client
npx prisma init
```

**Initial schema.prisma Configuration:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Models will be added in Story 0.4 (BNCC seeding) and beyond
```

**Migration Strategy:**
- Use Prisma Migrate for version control
- Additive migrations (ADD column first, then set NOT NULL later)
- Idempotent seed scripts (upsert pattern)

**.env Template:**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ressoa_db?schema=public"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# JWT
JWT_SECRET="change-me-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="change-me-in-production"
JWT_REFRESH_EXPIRES_IN="7d"

# CORS
CORS_ORIGIN="http://localhost:5173"
```

---

### Queue System Configuration (Architecture Decision #13)

#### Bull Queue + Redis

**Installation:**
```bash
npm install @nestjs/bull bull
npm install @nestjs/redis redis
```

**Why Bull?**
- Redis-based job queue (reliable, persistent)
- Horizontal scaling (multiple workers)
- Retry logic with exponential backoff (3x retries)
- Priority queues (P1 pilots > P2 regular > P3 reprocessing)
- Bull Dashboard for monitoring (future story)

**Configuration Pattern (future stories):**
```typescript
// In app.module.ts (will be added in Story 4.3 - Transcription Worker)
BullModule.forRoot({
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
  },
}),
```

---

### Security Dependencies (Architecture Decisions #14, #15)

#### Authentication Stack

**Installation:**
```bash
npm install @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm install -D @types/passport-jwt @types/bcrypt
```

**Components:**
- **@nestjs/config:** Environment variable management + validation
- **@nestjs/jwt:** JWT token generation/validation
- **@nestjs/passport:** Authentication middleware
- **passport-jwt:** JWT strategy
- **bcrypt:** Password hashing (10 salt rounds, ~150ms)

**JWT Token Lifecycle (Story 1.1):**
- Access Token: 15min lifetime
- Refresh Token: 7 days in Redis

**Rate Limiting:**
```bash
npm install @nestjs/throttler
```

---

### Validation & DTOs (Architecture Decision #16)

**Installation:**
```bash
npm install class-validator class-transformer
```

**Usage Pattern:**
```typescript
// DTOs use class-validator decorators
export class CreateAulaDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsEnum(TipoMidia)
  tipo: TipoMidia;
}
```

**Global Validation Pipe (in main.ts):**
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,    // Strip unknown properties
  transform: true,    // Transform payloads to DTO instances
  forbidNonWhitelisted: true, // Throw error on unknown properties
}));
```

---

### Swagger/OpenAPI Documentation (Architecture Decision #17)

**Installation:**
```bash
npm install @nestjs/swagger
```

**Basic Setup (in main.ts):**
```typescript
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Ressoa AI API')
  .setDescription('Inteligência de Aula, Análise e Previsão de Conteúdo')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

**Access Swagger UI:** `http://localhost:3000/api/docs`

---

### Folder Structure Standards (Architecture Decision #18)

```
ressoa-backend/
├── src/
│   ├── modules/              # Feature modules (domain-driven)
│   │   ├── auth/             # Authentication (Story 1.1)
│   │   ├── usuarios/         # User management (Story 1.6)
│   │   ├── escolas/          # School management (Story 1.6)
│   │   ├── turmas/           # Class management (Story 2.1)
│   │   ├── planejamento/     # Planejamento Bimestral (Story 2.1)
│   │   ├── aulas/            # Aula CRUD (Story 3.1)
│   │   ├── upload/           # TUS upload (Story 3.2)
│   │   ├── transcricao/      # STT service (Story 4.1-4.3)
│   │   ├── analise/          # LLM analysis (Story 5.1-5.5)
│   │   ├── relatorios/       # Reports (Story 6.1-6.4)
│   │   └── dashboards/       # Dashboards (Story 7.x)
│   ├── common/               # Shared code across modules
│   │   ├── guards/           # Auth guards (JwtGuard, RolesGuard)
│   │   ├── interceptors/     # Logging, Transform, Error handling
│   │   ├── pipes/            # Custom validation pipes
│   │   └── decorators/       # Custom decorators (@CurrentUser, @Roles)
│   ├── config/               # Environment configuration
│   │   └── env.ts            # Zod validation schema
│   ├── prisma/               # Prisma ORM service
│   │   └── prisma.service.ts # Injectable Prisma client
│   ├── app.module.ts         # Root module
│   └── main.ts               # Entry point (bootstrap)
├── prisma/
│   ├── schema.prisma         # Database schema (32 entities)
│   ├── migrations/           # Versioned migrations
│   └── seed.ts               # BNCC seeding script (Story 0.4)
├── test/                     # E2E tests
├── .env                      # Local environment (NOT committed)
├── .env.example              # Template (committed)
├── nest-cli.json             # NestJS CLI config
├── tsconfig.json             # TypeScript config
└── package.json
```

**CRITICAL:** Create ALL directories immediately (even if empty) to prevent import errors in future stories.

---

### API Standards (Architecture Decision #19)

#### REST API Conventions

- **Base Path:** `/api/v1/` (versioned)
- **HTTP Methods:** GET (read), POST (create), PATCH (update), DELETE (delete)
- **Response Format:** JSON with consistent structure
- **Error Handling:** NestJS exception filters (400, 401, 403, 404, 500)

**Example Endpoint Structure:**
```
POST   /api/v1/aulas              # Create aula
GET    /api/v1/aulas              # List aulas
GET    /api/v1/aulas/:id          # Get single aula
PATCH  /api/v1/aulas/:id          # Update aula
DELETE /api/v1/aulas/:id          # Delete aula
```

**Response Examples:**
```typescript
// Success (200/201)
{
  "data": { ... },
  "message": "Aula criada com sucesso"
}

// Error (400/404/500)
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

---

### main.ts Configuration

**Complete Setup:**
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Global validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Ressoa AI API')
    .setDescription('Inteligência de Aula, Análise e Previsão de Conteúdo')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Start server
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Ressoa AI Backend running on http://localhost:${port}/api/v1`);
}
bootstrap();
```

---

### Environment Configuration (Architecture Decision #20)

#### ConfigModule Setup

**Create `src/config/env.ts`:**
```typescript
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
});

export type Env = z.infer<typeof envSchema>;
```

**In app.module.ts:**
```typescript
import { ConfigModule } from '@nestjs/config';
import { envSchema } from './config/env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
    }),
    // ... other modules
  ],
})
export class AppModule {}
```

---

### Architecture Compliance

#### Prisma Service Pattern

**Create `src/prisma/prisma.service.ts`:**
```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

**Register in app.module.ts:**
```typescript
import { PrismaService } from './prisma/prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
```

---

### Testing Requirements

#### Validation Checklist

- [ ] **Build Test:** `npm run build` succeeds without TypeScript errors
- [ ] **Dev Server:** `npm run start:dev` starts and serves at `http://localhost:3000`
- [ ] **Hot Reload:** Edit `app.controller.ts` and see instant recompilation
- [ ] **TypeScript Strict:** `npx tsc --noEmit` passes without errors
- [ ] **Global Prefix:** `curl http://localhost:3000/api/v1` returns JSON (NOT 404)
- [ ] **CORS:** Browser request from `http://localhost:5173` succeeds (future frontend)
- [ ] **Prisma Init:** `prisma/schema.prisma` exists with valid PostgreSQL datasource
- [ ] **Dependencies Installed:** Check `package.json` for Prisma, Bull, Redis, JWT, etc.
- [ ] **Folder Structure:** All directories (`modules/`, `common/`, `config/`, `prisma/`) exist
- [ ] **Swagger Docs:** `http://localhost:3000/api/docs` renders Swagger UI (if configured)

#### Manual Testing Steps

1. Run `npm run start:dev` and wait for "Application is running on http://localhost:3000"
2. Test API endpoint: `curl http://localhost:3000/api/v1` → Should return JSON with message
3. Verify global prefix: `curl http://localhost:3000/` → Should return 404 (correct behavior)
4. Check Prisma: `npx prisma studio` should open (even if no data yet)
5. Check TypeScript: `npx tsc --noEmit` should pass with 0 errors
6. Check build: `npm run build` should create `dist/` folder
7. Check Swagger: Open `http://localhost:3000/api/docs` in browser

---

### Project Context Reference

**Consistency Guidelines (established in Story 0.1):**
- Use `npm` for all package management (NOT yarn or pnpm)
- Use TypeScript strict mode (NO `any` types without justification)
- Create all directories upfront (prevent future import errors)
- Document everything in README.md
- Use environment variables for all configuration (NO hardcoded values)

**Backend-Specific Guidelines:**
- Follow NestJS modular architecture (one module per domain)
- Use Prisma for all database queries (NO raw SQL unless absolutely necessary)
- Use class-validator DTOs for all API inputs
- Use Swagger decorators for API documentation
- Use ConfigService for environment variables (NOT process.env directly)

---

### References

- [Source: architecture.md - Decisão #11 "Backend Stack"]
- [Source: architecture.md - Decisão #12 "Database & ORM"]
- [Source: architecture.md - Decisão #13 "Queue System"]
- [Source: architecture.md - Decisão #14 "Authentication"]
- [Source: architecture.md - Decisão #15 "Security"]
- [Source: architecture.md - Decisão #16 "Validation"]
- [Source: architecture.md - Decisão #17 "API Documentation"]
- [Source: architecture.md - Decisão #18 "Folder Structure"]
- [Source: architecture.md - Decisão #19 "REST API Standards"]
- [Source: story 0.1 - Learnings: npm consistency, TypeScript strict, upfront directory creation]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

1. **Supertest import fix:** NestJS scaffold gerou `import * as request from 'supertest'` que causa TS2349 com tipos modernos. Fix: usar `import request from 'supertest'` (default import).
2. **Prisma 7 breaking changes:** Prisma 7.3.0 gerou `prisma-client` provider (ESM) com output customizado. Incompatível com NestJS CommonJS. Fix: usar `prisma-client-js` provider que gera em `node_modules/@prisma/client`.
3. **Prisma 7 datasource url:** `url = env("DATABASE_URL")` não é mais suportado em schema.prisma no Prisma 7. URL agora configurada via `prisma.config.ts`.
4. **`@nestjs/redis` não existe:** Pacote `@nestjs/redis` removido do npm. Redis client `ioredis` já incluído como dependência do Bull.
5. **PrismaClient constructor:** Prisma 7 com `prisma-client-js` não aceita `datasourceUrl` no construtor. URL vem do `prisma.config.ts` + dotenv.
6. **E2E tests com PrismaService:** Sem DB rodando, e2e tests falham no PrismaService.$connect(). Fix: override provider com mock no TestingModule.

### Completion Notes List

- Projeto NestJS criado com TypeScript strict mode (NestJS CLI v11.0.10)
- Prisma 7.3.0 configurado com provider `prisma-client-js` (adaptado de `prisma-client` ESM para compatibilidade com NestJS CommonJS)
- Bull queue + ioredis instalados (@nestjs/bull ^11.0.4, bull ^4.16.5)
- Stack completa de auth (JWT, Passport, bcrypt), validation (class-validator/transformer), Swagger, throttler instalada
- Estrutura modular com 11 módulos de domínio + 4 subdiretórios common criada com .gitkeep
- main.ts configurado com global prefix `/api/v1`, CORS, ValidationPipe (whitelist+transform+forbidNonWhitelisted), Swagger docs
- ConfigModule global com validação zod via `src/config/env.ts`
- PrismaModule global com PrismaService injetável
- Health check endpoint: `GET /api/v1` → `{ message: 'Ressoa AI API - v1' }`
- Testes: 1 unit test + 2 e2e tests passando
- Build: `npm run build` + `npx tsc --noEmit` sem erros
- README.md e .env.example criados

### Senior Developer Review (AI)

**Reviewer:** Luisneto98 (via Claude Opus 4.6 adversarial code-review)
**Date:** 2026-02-10
**Outcome:** Approved with fixes applied

**Issues Found:** 3 HIGH, 4 MEDIUM, 2 LOW
**Issues Fixed:** 7 (all HIGH + all MEDIUM)

**Fixes Applied:**
1. `tsconfig.json` - Adicionado `"strict": true` (substituindo flags individuais incompletas). Habilita `strictFunctionTypes`, `strictPropertyInitialization`, `alwaysStrict`, `useUnknownInCatchVariables`.
2. `eslint.config.mjs` - `@typescript-eslint/no-explicit-any` alterado de `'off'` para `'warn'` (alinhado com architecture "NO any types").
3. `src/main.ts` - Substituído `process.env` por `ConfigService` via DI (alinhado com Architecture Decision #20).
4. `.gitignore` - Expandido de 3 para 15+ entradas (adicionado `dist/`, `coverage/`, `*.log`, `*.tsbuildinfo`, IDE, OS).
5. `.env.example` - Secrets JWT agora vazios com comentário "(MUST be at least 32 characters)" em vez de valores placeholder.
6. `test/app.e2e-spec.ts` - Adicionado fallback env vars para CI (DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET).
7. `src/config/env.ts` - `DATABASE_URL` alterado de `z.string()` para `z.string().url()` (alinhado com architecture spec).

**Remaining (LOW - not fixed):**
- `package.json` sem `description` e `author`
- Repositório git não inicializado (`.gitignore`/`.gitkeep` existem sem git)

**Verification:** `tsc --noEmit` OK, `npm run build` OK, 1 unit test OK, 2 e2e tests OK.

### Change Log

- 2026-02-10: Story 0.2 implementada - Backend NestJS inicializado com todas dependências core, estrutura modular, configuração global e health check endpoint
- 2026-02-10: Code review adversarial - 7 issues corrigidos (strict mode, ESLint, ConfigService, .gitignore, .env.example, e2e env vars, DATABASE_URL validation)

### File List

**Novos (criados pelo projeto):**
- `ressoa-backend/` (diretório raiz do backend)
- `ressoa-backend/package.json`
- `ressoa-backend/tsconfig.json`
- `ressoa-backend/tsconfig.build.json`
- `ressoa-backend/nest-cli.json`
- `ressoa-backend/eslint.config.mjs`
- `ressoa-backend/.prettierrc`
- `ressoa-backend/.env`
- `ressoa-backend/.env.example`
- `ressoa-backend/.gitignore`
- `ressoa-backend/README.md`
- `ressoa-backend/prisma/schema.prisma`
- `ressoa-backend/prisma.config.ts`
- `ressoa-backend/src/main.ts`
- `ressoa-backend/src/app.module.ts`
- `ressoa-backend/src/app.controller.ts`
- `ressoa-backend/src/app.service.ts`
- `ressoa-backend/src/app.controller.spec.ts`
- `ressoa-backend/src/config/env.ts`
- `ressoa-backend/src/prisma/prisma.service.ts`
- `ressoa-backend/src/prisma/prisma.module.ts`
- `ressoa-backend/src/modules/` (11 subdirs: auth, usuarios, escolas, turmas, planejamento, aulas, upload, transcricao, analise, relatorios, dashboards)
- `ressoa-backend/src/common/` (4 subdirs: guards, interceptors, pipes, decorators)
- `ressoa-backend/test/app.e2e-spec.ts`
- `ressoa-backend/test/jest-e2e.json`
