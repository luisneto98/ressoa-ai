---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - 'prd.md'
  - 'modelo-de-dados-entidades-2026-02-08.md'
  - 'ux-design-specification.md'
  - 'external-integrations-api-contracts-2026-08-08.md'
  - 'estrategia-prompts-ia-2026-02-08.md'
workflowType: 'architecture'
project_name: 'professor-analytics'
user_name: 'Luisneto98'
date: '2026-02-09'
techStack:
  frontend: 'React + Tailwind + shadcn/ui'
  backend: 'NestJS (TypeScript)'
  orm: 'Prisma'
  database: 'PostgreSQL 14+'
  cache: 'Redis'
  queue: 'Bull (Redis-based)'
  storage: 'S3/MinIO'
starters:
  frontend: 'npm create vite@latest -- --template react-ts'
  backend: 'nest new project-name --strict'
---

# Architecture Decision Document - Ressoa AI (Professor Analytics)

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements Summary:**

O sistema possui **50 requisitos funcionais** organizados em 8 categorias principais:

1. **Gestão de Planejamento (FR1-FR5):** Cadastro de planejamento bimestral, vinculação com habilidades BNCC, sugestão automática de habilidades (post-MVP)

2. **Captura de Aulas (FR6-FR11):** Upload de áudio/transcrição/texto manual, múltiplos formatos (mp3, wav, m4a, webm), associação a turma/data, visualização de status de processamento

3. **Processamento de Transcrição (FR12-FR16):** Transcrição automática via STT multi-provider (Whisper + Google fallback), processamento assíncrono (batch), notificações de conclusão

4. **Análise Pedagógica (FR17-FR22):** Pipeline de 5 prompts especializados (Cobertura BNCC → Qualitativa → Relatório → Exercícios → Alertas), detecção de gaps, evidências literais da transcrição

5. **Outputs para Professor (FR23-FR30):** Relatório editável com workflow de aprovação, exercícios contextuais, sugestões para próxima aula, visualização de % cobertura curricular

6. **Dashboard e Métricas (FR31-FR37):** Métricas de cobertura por professor/turma, identificação de atraso curricular, CoberturaBimestral como métrica materializada, coordenador SEM acesso a transcrições

7. **Gestão de Usuários (FR38-FR45):** Multi-tenancy por escola, RBAC granular (Professor/Coordenador/Dono), isolamento completo de dados, login com email/senha

8. **Administração Interna (FR46-FR50):** Monitoramento de taxa de erro STT, tempo de processamento, custos de API por escola, identificação de prompts com baixa taxa de aprovação

**Non-Functional Requirements (NFRs) - Arquiteturalmente Críticos:**

| Categoria | Requisito | Meta | Implicação Arquitetural |
|-----------|-----------|------|------------------------|
| **Performance** | Transcrição de aula (50min) | < 5 minutos | Processamento assíncrono obrigatório (Bull queue) |
| **Performance** | Análise pedagógica | < 60 segundos | Pipeline de LLM otimizado, processamento serial |
| **Performance** | Dashboard de cobertura | < 2 segundos | Materialized view (PostgreSQL) + cache (Redis) |
| **Segurança** | Multi-tenancy | Isolamento completo | Row-level security (Prisma + PostgreSQL RLS) |
| **Segurança** | LGPD compliance | Consentimento, exclusão | Soft delete, audit trail, TTL para transcrições |
| **Segurança** | Criptografia | TLS 1.2+, AES-256 | HTTPS obrigatório, sensitive data encrypted at rest |
| **Escalabilidade** | Piloto → Growth | 3 escolas → 100 escolas | Horizontal scaling (workers), connection pooling |
| **Escalabilidade** | Pico de uso | Segunda manhã | Queue prioritization, rate limiting |
| **Viabilidade** | Custo IA por aula | < R$0,75 | Batch processing, caching, multi-provider fallback |
| **Confiabilidade** | Uptime | 99% (seg-sex 7h-19h) | Health checks, graceful degradation |
| **Integração** | Multi-provider STT/LLM | Failover automático | Service abstraction layer, timeout handling |

**Scale & Complexity Assessment:**

- **Primary domain:** Full-stack SaaS B2B (EdTech + AI Analytics)
- **Complexity level:** 🔴 **HIGH** (Enterprise)
  - 32 entidades com relacionamentos complexos (4 domínios)
  - Multi-tenancy com isolamento completo
  - Pipeline de IA serial com 5 estágios
  - Multi-provider com fallback (Whisper/Google, Claude/GPT/Gemini)
  - Upload resumível (arquivos grandes, conexões instáveis)
  - RBAC granular com 3 perfis radicalmente diferentes
  - Workflow de 9 estados (Aula lifecycle)
  - Feedback loop + A/B testing de prompts
  - Compliance LGPD + BNCC

- **Estimated architectural components:** 12-15 componentes principais
  - React Frontend (web responsivo)
  - NestJS API Gateway
  - Auth Service (JWT + RBAC)
  - Upload Service (resumível, S3/MinIO)
  - STT Service (multi-provider: Whisper/Google)
  - LLM Orchestrator (5 prompts pipeline)
  - Job Queue (Bull + Redis)
  - Workers (processamento assíncrono)
  - PostgreSQL Database
  - Redis Cache
  - Observability (logs, metrics, costs)
  - Feedback System

- **Data volume (per school/year):**
  - ~9.600 aulas processadas
  - ~135.000 registros de dados
  - ~301 MB estruturados (sem áudio)
  - ~240 GB áudios (se armazenados - decisão: deletar após transcrição)

- **User scale (MVP → Growth):**
  - Piloto: 3 escolas, ~100 professores, ~800 horas/mês
  - 12 meses: 15-20 escolas, ~600 professores, ~12.000 horas/mês
  - Futuro: 100 escolas, ~3.000 professores, ~80.000 horas/mês

### Technical Constraints & Dependencies

**Hard Constraints:**

1. **BNCC como Unidade Atômica:** 369 habilidades mapeadas (Matemática: 121, Ciências: 63, Língua Portuguesa: ~185 com blocos compartilhados EF67LP, EF69LP, EF89LP) - **não negociável**, é o padrão nacional

2. **Língua Portuguesa Blocos Compartilhados:** Relacionamento N:N entre Habilidade e Anos (EF67LP aplica a 6º E 7º, EF69LP a 6º-9º) - **complexidade de modelagem obrigatória**

3. **Professor Controla Privacidade:** Workflow de aprovação obrigatório. Coordenador NUNCA vê transcrição bruta, apenas relatórios aprovados - **requisito de negócio crítico**

4. **Upload Resumível:** Arquivos de 25-50MB em conexões 3G/4G instáveis de escolas - **falha = perda de adoção**

5. **Multi-Provider Fallback:** Vendor lock-in é risco de negócio. Service abstraction layer obrigatória desde MVP - **custo de falha = R$1.200/mês por escola**

6. **Custo < 40% Receita:** Meta de R$1.828/mês por escola (30.5%) - **viabilidade financeira depende disso**

**External Dependencies:**

| Dependência | Provider | Criticidade | Fallback |
|-------------|----------|-------------|----------|
| STT (Primário) | OpenAI Whisper | CRÍTICA | Google Speech-to-Text |
| STT (Fallback) | Google Speech | ALTA | Azure Speech (futuro) |
| LLM Análise | Anthropic Claude 4.6 | CRÍTICA | Gemini 1.5 Pro |
| LLM Exercícios | OpenAI GPT-4.6 mini | ALTA | Claude Haiku 4.5 |
| LLM Fallback | Google Gemini 1.5 Pro | MÉDIA | - |
| Object Storage | AWS S3 ou MinIO | ALTA | Local filesystem (dev) |
| Email | SendGrid/SES | MÉDIA | Queue para retry |

**Rate Limits (100 escolas = 80k horas/mês):**

- **Whisper:** 50 RPM → **GARGALO** (precisa 2 contas ou migrar Google)
- **Claude Sonnet:** 400k TPM → **GARGALO** (precisa 2 contas ou janela 18h)
- **GPT-4.6 mini:** 2M TPM → ✅ Suficiente
- **Bull Queue:** Sem limite (Redis-based)

**Mitigation:** Queue management com priorização (pilotos = P1, regulares = P2, reprocessamento = P3)

### Cross-Cutting Concerns Identified

**1. Authentication & Authorization**
- JWT-based auth (NestJS Guards)
- RBAC multi-tenant (Prisma middleware + PostgreSQL RLS)
- Roles: Professor, Coordenador, Diretor, Admin
- Permissions: Granular por recurso (aulas, relatórios, dashboards)
- Session management: Redis

**2. Multi-Tenancy & Data Isolation**
- Strategy: Row-level security (PostgreSQL RLS policies)
- Prisma middleware para injeção automática de `escola_id` em queries
- Unique constraints: (email, escola_id) para isolamento
- Test strategy: Garantir vazamento zero entre escolas

**3. Async Processing Pipeline**
- Bull queue (Redis-based) para jobs de longa duração
- Workers escaláveis horizontalmente
- Job lifecycle: created → active → completed/failed
- Retry strategy: 3x com backoff exponencial
- Priority queue: P1 (pilotos) > P2 (regular) > P3 (reprocessamento)

**4. Error Handling & Resilience**
- Service abstraction layer (STT, LLM)
- Automatic failover: Whisper → Google, Claude → Gemini
- Circuit breaker pattern (NestJS interceptors)
- Graceful degradation: Modo limitado se provider falha
- Dead letter queue para jobs com falha permanente

**5. Observability & Monitoring**
- Structured logging (Winston/Pino)
- Metrics: Prometheus + Grafana
- Traces: OpenTelemetry (opcional)
- Cost tracking: Logs de API calls (STT/LLM) com custo por escola
- Alerts: Error rate > 5%, Queue backlog > 12h, Cost spike > 20%

**6. Caching Strategy**
- Redis para:
  - CoberturaBimestral (recalculada após cada aula)
  - Habilidades BNCC (estático, TTL 7 dias)
  - Session data (JWT payload cache)
  - Rate limiting counters
- Cache invalidation: Event-driven (aula aprovada → invalidate cobertura)

**7. Upload Resumível (TUS Protocol)**
- Padrão TUS (Resumable Upload Protocol)
- Chunks de 5MB
- Metadata: escola_id, professor_id, turma_id, data
- Storage: S3 multipart upload ou MinIO
- Cleanup: Uploads abandonados após 24h

**8. Feedback Loop & Quality**
- Implicit feedback: Diffs (gerado vs aprovado), tempo de revisão, taxa de aprovação
- Explicit feedback: Thumbs up/down, NPS trimestral
- A/B testing: Versionamento de prompts em DB, split 50/50
- Metrics: >80% aprovação, <5min revisão, >30 NPS

**9. Compliance & Audit**
- LGPD: Consentimento (termo de uso), portabilidade (export), exclusão (soft delete)
- Audit trail: Timestamps (created_at, updated_at) em todas entidades
- Sensitive data: Transcrições deletadas após análise (7 dias TTL)
- Access logs: Quem acessou dados de qual escola, quando

**10. Database Performance**
- Connection pooling: Prisma (max 10 connections/worker)
- Indexes estratégicos:
  - `aula(planejamento_id, status_processamento, data)`
  - `cobertura_aula(aula_id, habilidade_id, nivel_cobertura)`
  - `habilidade` full-text search (PostgreSQL `to_tsvector`)
- Materialized view: `cobertura_bimestral` (refresh após aula aprovada)
- Partitioning: `aula`, `transcricao`, `analise` por ano_letivo (PostgreSQL 11+)

### Technology Stack (Confirmed)

**Frontend:**
- React 18+ (Vite)
- Tailwind CSS + shadcn/ui (Design System)
- React Query (data fetching)
- React Router v6
- Zustand (state management)

**Backend:**
- NestJS (TypeScript, modular architecture)
- Prisma ORM (type-safe queries)
- PostgreSQL 14+ (JSON, full-text, materialized views)
- Redis (cache + session)
- Bull (job queue, Redis-based)

**External Services:**
- STT: OpenAI Whisper (primário), Google Speech (fallback)
- LLM: Claude 4.6 Sonnet (análise), GPT-4.6 mini (exercícios), Gemini 1.5 Pro (fallback)
- Storage: AWS S3 ou MinIO
- Email: SendGrid ou AWS SES

**DevOps:**
- Docker + Docker Compose (dev/prod)
- PostgreSQL + Redis containers
- Bull dashboard (monitoring)
- Prisma Studio (DB GUI)

---

## Starter Template Evaluation

### Primary Technology Domain

**Full-stack SaaS B2B** (EdTech + AI Analytics) - Arquitetura separada frontend/backend

Baseado na análise de requisitos, o projeto requer:
- Frontend web responsivo (React SPA)
- Backend API com processamento assíncrono (NestJS)
- Separação clara entre camadas (deployment independente)

### Technical Preferences (Confirmed)

**Frontend Stack:**
- React 18+ (UI library)
- Vite (build tool)
- Tailwind CSS + shadcn/ui (styling + component library)
- TypeScript (type safety)

**Backend Stack:**
- NestJS (framework)
- Prisma (ORM)
- PostgreSQL 14+ (database)
- Bull + Redis (job queue + cache)

### Starter Options Considered

#### **Frontend: React + Vite + TypeScript**

**Option 1: Official Vite Starter (SELECTED)**
- Command: `npm create vite@latest`
- Template: `react-ts`
- Status: ✅ Official, actively maintained
- Last verified: 2026-02-09

**Analysis:**
- ✅ Official Vite starter - garantia de suporte
- ✅ React 18+ with TypeScript pre-configured
- ✅ Fast HMR (Hot Module Replacement)
- ✅ Production-ready build optimization
- ✅ Minimal, não-opinativo (permite customização total)
- ⚠️ Precisa configuração adicional para Tailwind + shadcn/ui

**Alternatives Considered:**
- `create-react-app`: ❌ Deprecated, não recomendado em 2026
- Custom Vite template com Tailwind: ⚠️ Menos mantido que oficial

**Rationale for Selection:**
Starter oficial da Vite é a base mais sólida. Configuração de Tailwind + shadcn/ui é bem documentada e processo one-time.

---

#### **Backend: NestJS**

**Option 1: Official NestJS CLI (SELECTED)**
- Command: `nest new project-name`
- Flags: `--strict` (TypeScript strict mode)
- Status: ✅ Official, actively maintained
- Last verified: 2026-02-09

**Analysis:**
- ✅ Official NestJS starter - garantia de suporte
- ✅ TypeScript configurado com strict mode
- ✅ Modular architecture out-of-the-box
- ✅ Testing setup (Jest) incluído
- ✅ ESLint + Prettier pre-configured
- ✅ Development/Production scripts prontos

**Alternatives Considered:**
- NestJS templates (REST API, GraphQL, Microservices): ⚠️ REST já vem por padrão
- Boilerplates de terceiros: ❌ Menos mantidos, complexidade desnecessária

**Rationale for Selection:**
CLI oficial é a escolha mais conservadora e suportada. Permite adicionar features (Prisma, Bull) de forma incremental.

---

### Selected Starters

#### **Frontend Initialization**

**Command:**
```bash
npm create vite@latest ressoa-frontend -- --template react-ts
cd ressoa-frontend
npm install
```

**Post-Initialization Setup (Tailwind + shadcn/ui):**

1. Install Tailwind CSS:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

2. Configure TypeScript paths (`tsconfig.json` and `tsconfig.app.json`):
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

3. Configure Vite (`vite.config.ts`):
```typescript
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

4. Initialize shadcn/ui:
```bash
npx shadcn@latest init
```

**What This Provides:**
- ✅ React 18+ with TypeScript
- ✅ Vite build system (fast HMR, optimized builds)
- ✅ Tailwind CSS configured
- ✅ shadcn/ui component library ready
- ✅ Path aliases (`@/components`, `@/lib`)
- ✅ ESLint configured

---

#### **Backend Initialization**

**Command:**
```bash
npm i -g @nestjs/cli
nest new ressoa-backend --strict
cd ressoa-backend
```

**Package Manager Selection:**
Durante `nest new`, escolher: **npm**

**Post-Initialization Setup (Prisma + Bull):**

1. Install Prisma:
```bash
npm install prisma --save-dev
npm install @prisma/client
npx prisma init
```

2. Install Bull + Redis:
```bash
npm install @nestjs/bull bull
npm install @nestjs/redis redis
```

3. Install additional dependencies:
```bash
npm install @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt
npm install class-validator class-transformer
```

**What This Provides:**
- ✅ NestJS framework with TypeScript strict mode
- ✅ Modular architecture (Controllers, Services, Modules)
- ✅ Dependency Injection container
- ✅ Testing setup (Jest + Supertest)
- ✅ ESLint + Prettier
- ✅ Development/Production scripts
- ✅ Request validation pipes
- ✅ Exception filters

---

### Architectural Decisions Provided by Starters

#### **Frontend (Vite + React + TypeScript)**

**Language & Runtime:**
- TypeScript 5+ with strict mode
- React 18+ with JSX transform
- ES2020+ target

**Styling Solution:**
- Tailwind CSS 3+ (utility-first)
- shadcn/ui components (Radix UI + Tailwind)
- PostCSS for CSS processing

**Build Tooling:**
- Vite (esbuild-based, fast builds)
- Tree-shaking automático
- Code splitting out-of-the-box
- Asset optimization (images, fonts)

**Code Organization:**
```
src/
├── components/       # React components
│   └── ui/          # shadcn/ui components
├── lib/             # Utilities
├── hooks/           # Custom React hooks
├── pages/           # Route pages (ou views/)
├── App.tsx
└── main.tsx
```

**Development Experience:**
- Hot Module Replacement (HMR) < 100ms
- TypeScript error checking
- ESLint real-time feedback

---

#### **Backend (NestJS)**

**Language & Runtime:**
- TypeScript 5+ with strict mode
- Node.js 18+ LTS
- ES2021+ target

**Build Tooling:**
- SWC (fast TypeScript compiler)
- Source maps for debugging
- Production optimizations

**Testing Framework:**
- Jest (unit tests)
- Supertest (e2e tests)
- Test coverage reports

**Code Organization:**
```
src/
├── modules/         # Feature modules
│   ├── auth/
│   ├── aulas/
│   ├── planejamento/
│   └── ...
├── common/          # Shared code
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── decorators/
├── config/          # Configuration
├── prisma/          # Prisma schema + migrations
├── app.module.ts
└── main.ts
```

**Development Experience:**
- Auto-reload on file changes
- TypeScript error checking
- Debug configuration (VS Code)
- API documentation (Swagger optional)

---

### Implementation Notes

**Frontend Project Initialization:**
1. Run: `npm create vite@latest ressoa-frontend -- --template react-ts`
2. Setup Tailwind + shadcn/ui (one-time, ~5 min)
3. Install additional dependencies (React Query, React Router, Zustand)
4. Configure environment variables (`.env.local`)

**Backend Project Initialization:**
1. Install NestJS CLI globally: `npm i -g @nestjs/cli`
2. Run: `nest new ressoa-backend --strict`
3. Setup Prisma (schema + migrations)
4. Setup Bull (job queue configuration)
5. Configure environment variables (`.env`)

**Repository Structure:**
```
professor-analytics/
├── frontend/           # React + Vite
├── backend/            # NestJS
├── docker-compose.yml  # PostgreSQL + Redis (dev)
└── README.md
```

**Note:** Project initialization using these commands should be the **first implementation story** (US-000 ou setup task).

---

**Fontes consultadas:**
- [Vite Official Guide](https://vite.dev/guide/)
- [NestJS CLI Documentation](https://docs.nestjs.com/cli/overview)
- [shadcn/ui Vite Installation](https://ui.shadcn.com/docs/installation/vite)

---

## Core Architectural Decisions

_This section documents critical architectural decisions made through collaborative review. Each decision includes context, alternatives considered, and rationale._

---

## Decision Category 1: Authentication & Security 🔐

### AD-1.1: Authentication Strategy

**Decision:** NestJS Passport + JWT Strategy

**Context:**
- Multi-tenant B2B application with role-based access
- Need for stateless authentication (API backend, React SPA frontend)
- 3 user roles: Professor, Coordenador, Diretor
- Session needs: 15 min access token, extended sessions via refresh tokens

**Alternatives Considered:**
- **A) NestJS Passport + JWT:** NestJS-native, mature ecosystem, Passport strategies bem suportadas
- **B) Auth0/Clerk (SaaS):** Terceirizado, rápido para MVP, mas custo adicional (~$50/mês) e vendor lock-in
- **C) Session-based (Express session):** Stateful, requer sticky sessions, menos escalável

**Rationale:**
- ✅ Passport é padrão de facto em NestJS (docs oficiais, Guards nativos)
- ✅ JWT stateless permite escalar workers horizontalmente sem session store complexo
- ✅ Controle total sobre claims (escola_id, role, permissions)
- ✅ Facilita multi-tenancy (escola_id no token)
- ⚠️ Exige cuidado com secret rotation e refresh token revocation

**Implementation Notes:**
- `@nestjs/passport` + `passport-jwt`
- Strategy: `JwtStrategy` com validação de payload
- Guards: `JwtAuthGuard`, `RolesGuard`
- Decorators: `@CurrentUser()`, `@Roles()`

---

### AD-1.2: Password Hashing

**Decision:** bcrypt com 10 salt rounds

**Context:**
- Armazenamento de senhas de professores/coordenadores/diretores
- LGPD requer proteção adequada de dados sensíveis
- Trade-off entre segurança e performance (hashing acontece no login)

**Alternatives Considered:**
- **A) bcrypt (10 rounds):** Padrão maduro, ~100-200ms por hash, bom equilíbrio
- **B) argon2:** Mais moderno, resistente a GPUs, mas menos suporte em NestJS
- **C) scrypt:** Nativo Node.js, mas menos adotado

**Rationale:**
- ✅ bcrypt é padrão ouro há 20+ anos (battle-tested)
- ✅ 10 rounds = ~150ms no hardware moderno (imperceptível no login)
- ✅ Biblioteca `bcrypt` em npm com 5M+ downloads/semana
- ✅ NestJS community familiarizada
- ⚠️ argon2 é tecnicamente superior, mas bcrypt é "suficientemente seguro" para MVP

**Implementation Notes:**
- `npm install bcrypt @types/bcrypt`
- `AuthService.hashPassword(plainText)` e `AuthService.comparePassword(plainText, hash)`
- **Nunca** logar ou retornar senhas em plaintext (nem em errors)

---

### AD-1.3: Refresh Token Strategy

**Decision:** Access Token (15min) + Refresh Token (7 dias) armazenado em Redis

**Context:**
- UX: Professores não devem fazer login a cada 15 minutos
- Segurança: Access tokens curtos limitam janela de exploração se vazados
- Revogação: Capacidade de invalidar sessões (logout, mudança de senha)

**Alternatives Considered:**
- **A) Redis-backed Refresh Tokens (7 dias):** Revogável, fast lookup, expira automaticamente
- **B) Refresh Token em DB (PostgreSQL):** Mais lento, mas persistente entre restarts
- **C) Sliding sessions (extend token on activity):** Mais simples, mas menos controle

**Rationale:**
- ✅ Redis TTL = 7 dias (expira automaticamente, zero manutenção)
- ✅ Revogação instantânea: `redis.del(refreshToken)` no logout
- ✅ Performance: < 1ms lookup, não impacta PostgreSQL
- ✅ Padrão comum em auth moderno (OAuth 2.0 refresh tokens)
- ⚠️ Redis é stateful (precisa backup, mas não crítico para refresh tokens)

**Implementation Notes:**
- Key pattern: `refresh_token:{userId}:{tokenId}`
- Payload no Redis: `{ userId, escolaId, role, issuedAt }`
- Rotation: Gerar novo refresh token a cada uso (prevent token replay)
- Revogação: Endpoint `POST /auth/logout` deleta token do Redis

---

### AD-1.4: CORS Configuration

**Decision:** CORS restrito por ambiente (configurável via `.env`)

**Context:**
- Frontend hospedado em domínio diferente do backend (SPA arquitetura)
- Desenvolvimento: localhost:5173 (Vite) → localhost:3000 (NestJS)
- Produção: app.ressoaai.com → api.ressoaai.com
- Segurança: Prevenir CSRF e requests não-autorizados

**Alternatives Considered:**
- **A) CORS restrito via .env:** `CORS_ORIGIN=https://app.ressoaai.com` (strict, configurável)
- **B) CORS aberto (*):** ❌ Vulnerável a CSRF, não recomendado
- **C) Proxy reverso (Nginx):** CORS gerenciado no proxy, mas adiciona complexidade

**Rationale:**
- ✅ `.env` permite diferentes configs por ambiente sem rebuild
- ✅ NestJS tem suporte nativo (`app.enableCors({ origin: process.env.CORS_ORIGIN })`)
- ✅ Segurança: Only allow known origins
- ✅ Flexível: Pode adicionar múltiplos origins (app + admin) via array
- ⚠️ Requer discipline: NUNCA commitar `.env` com secrets

**Implementation Notes:**
```typescript
// main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN.split(','), // 'https://app.ressoaai.com,https://admin.ressoaai.com'
  credentials: true, // Allow cookies (refresh tokens se usar httpOnly)
});
```

---

### AD-1.5: Rate Limiting

**Decision:** @nestjs/throttler com Redis storage

**Context:**
- Proteção contra brute-force (login endpoint)
- Prevenção de abuso de API (especialmente endpoints de upload e LLM)
- Fair usage entre escolas (multi-tenancy)

**Alternatives Considered:**
- **A) @nestjs/throttler + Redis storage:** NestJS-native, distributed rate limiting
- **B) Express rate-limit:** Menos integrado com NestJS Guards
- **C) Nginx rate limiting:** Funciona, mas não granular por rota/role

**Rationale:**
- ✅ `@nestjs/throttler` é oficial, integra com Guards e Decorators
- ✅ Redis storage = rate limit compartilhado entre múltiplos workers (horizontal scale)
- ✅ Configurável por rota: `/auth/login` mais restrito que `/aulas`
- ✅ Pode customizar por escola (detectar abuso de tenants específicos)
- ⚠️ Requer Redis (mas já usamos para cache e refresh tokens)

**Implementation Notes:**
```typescript
// app.module.ts
ThrottlerModule.forRoot({
  ttl: 60, // 60 segundos
  limit: 10, // 10 requests por minuto (padrão)
  storage: new ThrottlerStorageRedisService(redisClient),
});

// Decorators personalizados:
@Throttle(5, 60) // Login: 5 tentativas/min
@Post('auth/login')

@Throttle(3, 3600) // Upload: 3 uploads/hora por usuário
@Post('aulas/upload')
```

---

## Decision Category 2: API & Communication 🌐

### AD-2.1: API Architecture Style

**Decision:** REST API (não GraphQL)

**Context:**
- Backend expõe recursos CRUD (Aulas, Turmas, Planejamentos, Relatórios)
- Frontend precisa buscar dados agregados (dashboards) e fazer uploads
- Equipe tem experiência com REST, GraphQL adiciona complexidade

**Alternatives Considered:**
- **A) REST API:** Padrão HTTP, cacheable, stateless, NestJS Controllers
- **B) GraphQL:** Flexível, evita over-fetching, mas complexidade (schema, resolvers)
- **C) tRPC:** Type-safe end-to-end, mas menos maduro, menor ecossistema

**Rationale:**
- ✅ REST é suficiente: Não há necessidade de queries complexas aninhadas
- ✅ NestJS Controllers mapeiam naturalmente para REST endpoints
- ✅ Cacheable: HTTP caching headers (`ETag`, `Cache-Control`) funcionam out-of-the-box
- ✅ Tooling: Swagger docs automáticos, Postman, curl
- ✅ Team familiarity: Menor curva de aprendizado
- ⚠️ Over-fetching pode acontecer, mas endpoints podem ser otimizados (query params, DTOs)

**Implementation Notes:**
- Endpoints RESTful: `GET /api/v1/aulas`, `POST /api/v1/aulas`, `PATCH /api/v1/aulas/:id`
- Query params para filtros: `/aulas?turmaId=123&status=aprovada&data_gte=2026-01-01`
- Nested resources onde faz sentido: `/planejamentos/:id/habilidades`

---

### AD-2.2: API Versioning Strategy

**Decision:** URI Versioning (`/api/v1/...`)

**Context:**
- API precisa evoluir sem quebrar clientes existentes
- Escolas podem estar em versões diferentes do frontend (rollout gradual)
- Breaking changes futuros (ex: mudança no formato de Relatório)

**Alternatives Considered:**
- **A) URI Versioning (`/api/v1/`):** Explícito, fácil de routear, visível em logs
- **B) Header Versioning (`Accept: application/vnd.ressoa.v1+json`):** Mais "RESTful", mas menos óbvio
- **C) Query Param (`/api/aulas?version=1`):** Menos comum, poluição de query string

**Rationale:**
- ✅ URI versioning é padrão de facto (Stripe, GitHub, Twitter APIs)
- ✅ Explícito: Fácil ver versão em logs, Swagger, Postman
- ✅ NestJS suporta nativamente: Global prefix + versioned controllers
- ✅ Proxies e CDNs podem cachear por versão
- ⚠️ Requer manter múltiplas versões simultaneamente (mas isso é inevitável)

**Implementation Notes:**
```typescript
// main.ts
app.setGlobalPrefix('api/v1');

// Futuras versões:
@Controller({ path: 'aulas', version: '2' }) // /api/v2/aulas
```

---

### AD-2.3: Request Validation

**Decision:** class-validator + class-transformer em DTOs

**Context:**
- Validação de input é crítica (uploads, criação de planejamento, login)
- TypeScript types não existem em runtime (não previnem dados inválidos)
- Erros de validação devem retornar mensagens claras (400 Bad Request)

**Alternatives Considered:**
- **A) class-validator + class-transformer:** NestJS-native, decorators, auto-transform
- **B) Joi:** Schema-based, maduro, mas separado de DTOs TypeScript
- **C) zod:** Type-safe, moderno, mas menos integrado com NestJS

**Rationale:**
- ✅ class-validator é padrão em NestJS (docs oficiais recomendam)
- ✅ DTOs com decorators são auto-documentados: `@IsEmail()`, `@IsEnum(Role)`
- ✅ class-transformer converte plain objects para class instances (útil para nested objects)
- ✅ ValidationPipe global: `app.useGlobalPipes(new ValidationPipe())`
- ✅ Swagger/OpenAPI gera schema automaticamente a partir dos decorators
- ⚠️ Pode ser verboso para DTOs complexos, mas é explícito

**Implementation Notes:**
```typescript
// create-aula.dto.ts
export class CreateAulaDto {
  @IsUUID()
  turmaId: string;

  @IsDateString()
  data: string;

  @IsEnum(TipoAula)
  tipo: TipoAula;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
```

---

### AD-2.4: API Documentation

**Decision:** Swagger/OpenAPI automático via @nestjs/swagger

**Context:**
- Frontend precisa consumir API (React Query client)
- Documentação manual fica desatualizada rapidamente
- Testes de API precisam saber contratos (tipos, status codes)

**Alternatives Considered:**
- **A) @nestjs/swagger (OpenAPI):** Auto-gerado, UI interativo, spec exportável
- **B) Documentação manual (Markdown):** Flexível, mas desatualiza
- **C) Postman Collections:** Útil, mas não integrado com código

**Rationale:**
- ✅ `@nestjs/swagger` gera spec OpenAPI 3.0 a partir de decorators (`@ApiProperty`, `@ApiResponse`)
- ✅ Swagger UI disponível em `/api/docs` (interativo, testável)
- ✅ Frontend pode gerar types automaticamente (openapi-generator-cli)
- ✅ Spec JSON exportável para Postman, testes automatizados
- ✅ Decorators melhoram DTOs: `@ApiProperty({ description: 'ID da turma', example: 'uuid' })`
- ⚠️ Requer discipline: Adicionar decorators ao criar novos endpoints

**Implementation Notes:**
```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('Ressoa AI API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

---

### AD-2.5: Error Handling

**Decision:** NestJS Exception Filters (padrão HTTP exceptions)

**Context:**
- Erros devem retornar JSON consistente (não HTML 500 pages)
- Erros internos (DB, LLM API) não devem vazar stack traces para cliente
- Erros de validação, autenticação, autorização precisam status codes corretos

**Alternatives Considered:**
- **A) NestJS Exception Filters:** Built-in, customizável, baseado em HTTP exceptions
- **B) Express error middleware:** Funciona, mas menos integrado com NestJS patterns
- **C) Try-catch manual em cada Controller:** ❌ Boilerplate, inconsistente

**Rationale:**
- ✅ NestJS tem exceptions prontas: `BadRequestException`, `UnauthorizedException`, `NotFoundException`
- ✅ Global Exception Filter captura todos erros não tratados (fail-safe)
- ✅ Custom filters para erros específicos (ex: Prisma errors → HTTP 4xx/5xx)
- ✅ JSON response consistente: `{ statusCode, message, timestamp, path }`
- ✅ Logging automático de erros 5xx (integração com Winston/Pino)
- ⚠️ Cuidado com stack traces em produção (usar filter para sanitizar)

**Implementation Notes:**
```typescript
// http-exception.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : 500;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: this.getErrorMessage(exception),
    });
  }
}
```

---

## Decision Category 3: Frontend Architecture ⚛️

### AD-3.1: State Management

**Decision:** Zustand com stores separadas por domínio

**Context:**
- React SPA precisa gerenciar estado global (auth, aulas, UI)
- Estado de servidor (API data) vs estado de cliente (UI, forms)
- Evitar prop drilling e re-renders desnecessários

**Alternatives Considered:**
- **A) Zustand (stores por domínio):** Leve, sem boilerplate, DevTools, middleware persist
- **B) React Query + Context API:** Separação server/client state, mas Context pode causar re-renders
- **C) Redux Toolkit:** Maduro, mas verboso (actions, reducers, slices)

**Rationale:**
- ✅ Zustand é minimal (3kb), zero boilerplate comparado a Redux
- ✅ TypeScript-first: Stores são type-safe sem esforço
- ✅ DevTools para debugging (Redux DevTools compatível)
- ✅ Middleware para persist (localStorage): `useAuthStore` sobrevive refresh
- ✅ Hooks simples: `const { user, login, logout } = useAuthStore()`
- ✅ React Query gerencia server state (cache, invalidation), Zustand gerencia client state
- ⚠️ Menos opinativo que Redux (precisa estabelecer padrões de stores)

**Implementation Notes:**
```typescript
// stores/auth.store.ts
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}));

// stores/aula.store.ts
export const useAulaStore = create<AulaState>((set) => ({
  uploadProgress: {},
  setUploadProgress: (id, progress) => set((state) => ({
    uploadProgress: { ...state.uploadProgress, [id]: progress }
  })),
}));
```

**Stores planejadas:**
- `useAuthStore`: Usuário, token, perfil, logout
- `useAulaStore`: Upload state, análises em progresso
- `useCurriculoStore`: BNCC cache (habilidades), turmas favoritas
- `useUIStore`: Modals, toasts, loading global

---

### AD-3.2: API Client

**Decision:** React Query + axios com interceptors

**Context:**
- Frontend precisa fazer requests ao backend (CRUD, uploads, dashboards)
- Caching de listas (aulas, turmas) para evitar refetch desnecessários
- Retry automático em caso de falha de rede
- Token JWT precisa ser injetado em todos requests

**Alternatives Considered:**
- **A) React Query + axios:** Cache, retry, invalidation + axios interceptors para auth
- **B) TanStack Query + fetch nativo:** Sem dependência axios, mas fetch tem menos features
- **C) SWR + axios:** Similar a React Query, mas menos features (mutations)

**Rationale:**
- ✅ React Query é padrão ouro para server state (cache, background refetch, optimistic updates)
- ✅ axios tem interceptors robustos: Inject token, refresh token on 401, global error handling
- ✅ axios tem progress events (crítico para upload de áudio)
- ✅ React Query mutations para POST/PATCH/DELETE com invalidation automática
- ✅ DevTools para debugging de cache
- ⚠️ Dois conceitos (axios + React Query), mas separação de responsabilidades é clara

**Implementation Notes:**
```typescript
// api/axios.ts
const apiClient = axios.create({ baseURL: '/api/v1' });

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Refresh token logic
      const newToken = await refreshToken();
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(error.config);
    }
    return Promise.reject(error);
  }
);

// hooks/useAulas.ts
export const useAulas = (turmaId: string) => {
  return useQuery({
    queryKey: ['aulas', turmaId],
    queryFn: () => apiClient.get(`/aulas?turmaId=${turmaId}`).then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
};
```

---

### AD-3.3: Form Handling

**Decision:** React Hook Form + zod

**Context:**
- Formulários complexos (Plano de Aula: múltiplas habilidades, Turma: validações)
- Validação client-side antes de enviar ao backend
- Performance: Minimizar re-renders em formulários grandes
- Type-safety: Validação deve estar sincronizada com TypeScript types

**Alternatives Considered:**
- **A) React Hook Form + zod:** Uncontrolled, performance, validação type-safe
- **B) Formik + yup:** Maduro, mas mais re-renders (controlled), menos TypeScript-friendly
- **C) Formulários nativos (useState):** ❌ Boilerplate, sem validação integrada

**Rationale:**
- ✅ React Hook Form é uncontrolled (menos re-renders, melhor performance)
- ✅ zod é type-safe: Schema define TypeScript type automaticamente
- ✅ shadcn/ui forms são baseados em React Hook Form (integração perfeita)
- ✅ Error messages customizáveis em português
- ✅ Validação pode ser compartilhada com backend (se backend usar zod também)
- ⚠️ Curva de aprendizado inicial (controlled vs uncontrolled), mas docs são excelentes

**Implementation Notes:**
```typescript
// schemas/planejamento.schema.ts
const planejamentoSchema = z.object({
  bimestre: z.enum(['1', '2', '3', '4']),
  ano_letivo: z.number().int().min(2024),
  habilidades: z.array(z.string().uuid()).min(1, 'Selecione ao menos uma habilidade'),
});

type PlanejamentoFormData = z.infer<typeof planejamentoSchema>;

// components/PlanejamentoForm.tsx
const form = useForm<PlanejamentoFormData>({
  resolver: zodResolver(planejamentoSchema),
  defaultValues: { bimestre: '1', ano_letivo: 2026, habilidades: [] },
});

const onSubmit = form.handleSubmit((data) => {
  createPlanejamentoMutation.mutate(data);
});
```

---

### AD-3.4: Error Boundaries

**Decision:** react-error-boundary + toast notifications

**Context:**
- Erros React (runtime, rendering) não devem quebrar toda a app
- Erros de API (401, 500) devem ser mostrados ao usuário (toast)
- Erros críticos (upload, análise) precisam fallback específico

**Alternatives Considered:**
- **A) react-error-boundary + toasts:** Granular, UX clara, não quebra app
- **B) Error Boundary única no root:** Simples, mas pior UX (fallback genérico)
- **C) Try-catch manual:** ❌ Não captura erros de rendering

**Rationale:**
- ✅ `react-error-boundary` é biblioteca padrão (mantida por React Training)
- ✅ Boundaries granulares: Boundary na rota de Upload, na Análise, no Dashboard
- ✅ Toasts (shadcn/ui toast) para erros não-críticos (API 500, validação)
- ✅ Fallback UI customizado por contexto: "Erro no upload, tente novamente" vs "Erro no dashboard"
- ✅ Integração com Sentry: `onError` callback envia erro para monitoring
- ⚠️ Requer setup em múltiplos níveis, mas melhora muito a UX

**Implementation Notes:**
```typescript
// App.tsx (boundary global)
<ErrorBoundary
  FallbackComponent={ErrorFallback}
  onError={(error) => Sentry.captureException(error)}
>
  <RouterProvider />
</ErrorBoundary>

// pages/UploadPage.tsx (boundary específica)
<ErrorBoundary
  FallbackComponent={UploadErrorFallback}
  onReset={() => navigate('/aulas')}
>
  <UploadForm />
</ErrorBoundary>

// API errors via React Query
const mutation = useMutation({
  onError: (error) => {
    toast.error(error.response?.data?.message || 'Erro ao salvar');
  },
});
```

---

### AD-3.5: Loading States

**Decision:** React Query isLoading + Suspense seletivo

**Context:**
- Upload de áudio mostra progresso (0% → 100%)
- Dashboards carregam dados agregados (skeleton screens)
- Code-splitting de rotas (lazy loading) precisa fallback
- UX: Loading states devem ser contextuais, não bloqueantes

**Alternatives Considered:**
- **A) React Query isLoading + Suspense:** Declarativo, cada query tem loading, Suspense para code-split
- **B) Estado manual (useState):** Controle total, mas boilerplate e inconsistência
- **C) Loading spinner global:** ❌ Má UX, bloqueia toda a interface

**Rationale:**
- ✅ React Query gerencia loading states automaticamente (`isLoading`, `isFetching`, `isRefetching`)
- ✅ Suspense para code-splitting: `const DashboardPage = lazy(() => import('./pages/Dashboard'))`
- ✅ shadcn/ui skeleton screens para listas e dashboards (melhor que spinners)
- ✅ Upload progress bar dedicado (TUS client tem progress events)
- ✅ Declarativo: Componente só renderiza quando data está pronto
- ⚠️ Suspense para data fetching ainda estabilizando (React 19), mas para code-split é estável

**Implementation Notes:**
```typescript
// hooks/useAulas.ts
export const useAulas = (turmaId: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ['aulas', turmaId],
    queryFn: fetchAulas,
  });

  if (isLoading) return <AulasSkeleton />; // shadcn/ui skeleton
  return <AulasList aulas={data} />;
};

// App.tsx (code-splitting)
const DashboardPage = lazy(() => import('./pages/Dashboard'));

<Suspense fallback={<PageLoadingSpinner />}>
  <Routes>
    <Route path="/dashboard" element={<DashboardPage />} />
  </Routes>
</Suspense>

// components/UploadProgress.tsx
const { progress } = useAulaStore();
<Progress value={progress} /> // shadcn/ui progress bar
```

---

## Decision Category 4: Data Architecture 🗄️

### AD-4.1: Database Migrations

**Decision:** Prisma Migrate com migrations versionadas

**Context:**
- Schema PostgreSQL evolui com o produto (novas entidades, colunas, indexes)
- Múltiplos ambientes (dev, staging, prod) precisam aplicar migrations
- Migrations devem ser reproduzíveis e versionadas (Git)

**Alternatives Considered:**
- **A) Prisma Migrate:** Integrado com Prisma ORM, migrations versionadas, type-safe
- **B) TypeORM migrations:** Up/Down scripts, mas não integrado com Prisma
- **C) SQL scripts manuais:** ❌ Propenso a erros, não versionado

**Rationale:**
- ✅ Prisma Migrate gera migrations a partir do schema (`schema.prisma`)
- ✅ Migrations em SQL (pasta `prisma/migrations/`) versionadas no Git
- ✅ `prisma migrate dev` para desenvolvimento (cria migration + aplica)
- ✅ `prisma migrate deploy` para produção (apenas aplica migrations pendentes)
- ✅ Type-safety: Prisma Client regenerado automaticamente após migration
- ⚠️ Rollback não é automático (precisa criar migration reversa manualmente)

**Implementation Notes:**
```bash
# Desenvolvimento: Criar nova migration
npx prisma migrate dev --name add-analise-qualitativa

# Produção: Aplicar migrations pendentes
npx prisma migrate deploy

# Reset database (apenas dev)
npx prisma migrate reset # Apaga DB, reaplica todas migrations + seed
```

**Migration Strategy:**
- Migrations sempre para frente (additive): Adicionar colunas como nullable primeiro, popular dados, tornar NOT NULL em migration seguinte
- Nunca editar migrations já aplicadas em produção
- Usar `prisma migrate diff` para ver diferenças entre schema e DB

---

### AD-4.2: BNCC Data Seeding

**Decision:** Seed script Prisma + JSON source files

**Context:**
- 369 habilidades BNCC precisam estar no banco (atomics de análise)
- Dados são estáticos (BNCC oficial) mas podem ter correções
- Seed deve ser reproduzível (CI, novos desenvolvedores, testes)

**Alternatives Considered:**
- **A) Seed scripts + JSON source files:** Versionado, idempotente, type-safe
- **B) SQL dump inicial:** Rápido, mas difícil manter/atualizar
- **C) Migration com INSERT manual:** ❌ Migrations não devem ter seed data

**Rationale:**
- ✅ JSON files em `prisma/seeds/bncc/matematica-6ano.json` são versionados e legíveis
- ✅ Script TypeScript `prisma/seed.ts` é type-safe (usa Prisma Client)
- ✅ Idempotente: Verifica existência antes de inserir (`upsert`)
- ✅ Executa automaticamente em `prisma migrate reset` ou `npm run seed`
- ✅ Fácil atualizar: Editar JSON + rodar seed = atualizado
- ⚠️ Seed pode ser lento (369 habilidades + relacionamentos), mas é one-time por ambiente

**Implementation Notes:**
```typescript
// prisma/seed.ts
async function seedBNCC() {
  const matematica6ano = JSON.parse(
    fs.readFileSync('./seeds/bncc/matematica-6ano.json', 'utf-8')
  );

  for (const habilidade of matematica6ano) {
    await prisma.habilidade.upsert({
      where: { codigo: habilidade.codigo },
      update: habilidade,
      create: habilidade,
    });
  }
}

// package.json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

**JSON Structure (exemplo):**
```json
{
  "codigo": "EF06MA01",
  "descricao": "Comparar, ordenar e localizar números naturais...",
  "disciplina": "MATEMATICA",
  "ano_inicio": 6,
  "ano_fim": 6,
  "unidade_tematica": "Números",
  "objeto_conhecimento": "Sistema de numeração decimal"
}
```

---

### AD-4.3: Backup Strategy

**Decision:** pg_dump diário + S3 com retenção (7d/4w/12m)

**Context:**
- Dados críticos: Planejamentos, aulas, análises, relatórios aprovados
- Compliance LGPD: Capacidade de restaurar dados deletados (soft delete + backup)
- Disaster recovery: Poder recuperar de falha de hardware/cloud

**Alternatives Considered:**
- **A) pg_dump + S3 com retenção:** Padrão indústria, recuperação confiável
- **B) Managed DB backup (RDS):** Zero config, mas vendor lock-in e custo
- **C) Continuous archiving (WAL):** Point-in-time recovery, mas complexo para MVP

**Rationale:**
- ✅ `pg_dump` é ferramenta oficial PostgreSQL (battle-tested)
- ✅ Retenção granular: 7 dias diários, 4 semanas semanais, 12 meses mensais
- ✅ S3 é durável (99.999999999%) e barato (~$0.023/GB/mês)
- ✅ Cron job simples ou CI scheduler (GitHub Actions scheduled)
- ✅ Encrypted at rest (S3 SSE-S3 ou SSE-KMS)
- ⚠️ Requer configuração de infra, mas é one-time setup

**Implementation Notes:**
```bash
# Backup script (backup.sh)
#!/bin/bash
DATE=$(date +%Y-%m-%d-%H%M%S)
BACKUP_FILE="backup-$DATE.sql.gz"

pg_dump $DATABASE_URL | gzip > $BACKUP_FILE

aws s3 cp $BACKUP_FILE s3://ressoa-backups/postgres/daily/$BACKUP_FILE

# Cleanup: Delete backups older than retention policy
# (implementar usando aws s3 lifecycle rules ou script)
```

**Cron schedule:**
- Diário: 3h AM (baixo uso)
- Semanal: Domingo 3h AM
- Mensal: Primeiro dia do mês 3h AM

---

### AD-4.4: Multi-Tenancy Isolation

**Decision:** PostgreSQL Row-Level Security (RLS) + tenant_id (escola_id)

**Context:**
- Multi-tenancy: Dados de escolas diferentes no mesmo DB
- Isolamento crítico: Escola A NUNCA pode ver dados de Escola B
- Performance: Uma query por tenant (não schemas separados)

**Alternatives Considered:**
- **A) RLS + escola_id:** Isolamento em data layer, performance, escalável
- **B) Schema por tenant:** Isolamento total, mas não escala (limite de schemas)
- **C) Database por tenant:** Máximo isolamento, mas custo e complexidade proibitivos

**Rationale:**
- ✅ RLS é nativo PostgreSQL (segurança em DB layer, não apenas application layer)
- ✅ `escola_id` em todas tabelas multi-tenant (Aula, Planejamento, Turma, etc.)
- ✅ Prisma middleware injeta `escola_id` automaticamente em queries
- ✅ Connection pool com `SET app.current_tenant_id = X` antes de queries
- ✅ Escalável: 100+ escolas no mesmo DB sem degradação
- ⚠️ Requer discipline: TODA query deve filtrar por escola_id (Prisma middleware ajuda)

**Implementation Notes:**
```sql
-- RLS policy (PostgreSQL)
ALTER TABLE aula ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON aula
  USING (escola_id = current_setting('app.current_tenant_id')::uuid);
```

```typescript
// Prisma middleware (backend)
prisma.$use(async (params, next) => {
  const escolaId = getCurrentTenantId(); // From JWT or context

  if (['Aula', 'Planejamento', 'Turma'].includes(params.model)) {
    if (params.action === 'findMany' || params.action === 'findFirst') {
      params.args.where = { ...params.args.where, escola_id: escolaId };
    }
  }

  return next(params);
});
```

---

### AD-4.5: Materialized Views Refresh

**Decision:** Refresh incremental via Bull jobs (CONCURRENTLY)

**Context:**
- `CoberturaBimestral` é métrica agregada (% cobertura por turma/bimestre)
- Cálculo é custoso (JOIN entre Aula, CoberturaAula, Habilidade, Planejamento)
- Dashboards precisam carregar < 2s (NFR)
- Dados podem estar desatualizados até 24h (aceitável para analytics)

**Alternatives Considered:**
- **A) Refresh via Bull jobs (CONCURRENTLY):** Não bloqueia leituras, flexível
- **B) Triggers PostgreSQL:** Sempre atualizado, mas performance hit em writes
- **C) Computed on-demand:** ❌ Muito lento para dashboards

**Rationale:**
- ✅ `REFRESH MATERIALIZED VIEW CONCURRENTLY` não bloqueia leituras (queries continuam retornando dados antigos)
- ✅ Agendamento via Bull: Job diário (3h AM) + trigger manual após aprovação de aula
- ✅ Índices na materialized view (`escola_id, turma_id, bimestre`) para queries rápidas
- ✅ Trade-off aceitável: Dados até 24h desatualizados vs performance
- ⚠️ Requer índice UNIQUE na view para `CONCURRENTLY` funcionar

**Implementation Notes:**
```sql
-- Materialized view
CREATE MATERIALIZED VIEW cobertura_bimestral AS
SELECT
  p.escola_id,
  p.turma_id,
  p.bimestre,
  p.ano_letivo,
  COUNT(DISTINCT h.id) AS habilidades_planejadas,
  COUNT(DISTINCT CASE WHEN ca.nivel_cobertura IN ('COMPLETA', 'PARCIAL') THEN h.id END) AS habilidades_cobertas,
  ROUND(COUNT(DISTINCT CASE WHEN ca.nivel_cobertura IN ('COMPLETA', 'PARCIAL') THEN h.id END) * 100.0 / COUNT(DISTINCT h.id), 2) AS percentual_cobertura
FROM planejamento p
JOIN planejamento_habilidade ph ON p.id = ph.planejamento_id
JOIN habilidade h ON ph.habilidade_id = h.id
LEFT JOIN aula a ON a.planejamento_id = p.id AND a.status_processamento = 'aprovada'
LEFT JOIN cobertura_aula ca ON ca.aula_id = a.id AND ca.habilidade_id = h.id
GROUP BY p.escola_id, p.turma_id, p.bimestre, p.ano_letivo;

CREATE UNIQUE INDEX idx_cobertura_bimestral ON cobertura_bimestral (escola_id, turma_id, bimestre, ano_letivo);
```

```typescript
// Bull job (backend)
@Process('refresh-cobertura')
async handleRefreshCobertura(job: Job) {
  await this.prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY cobertura_bimestral`;
}

// Trigger após aprovação
async aprovarAula(aulaId: string) {
  await this.prisma.aula.update({ where: { id: aulaId }, data: { status: 'aprovada' } });
  await this.queueService.add('refresh-cobertura', {}); // Trigger refresh
}
```

---

## Decision Category 5: Infrastructure & Deployment 🚀

### AD-5.1: Containerization

**Decision:** Docker + Docker Compose para dev/staging

**Context:**
- Paridade dev/prod (PostgreSQL, Redis, app versions)
- Onboarding de novos desenvolvedores (setup < 5 min)
- Deployment consistente (mesma imagem em staging/prod)

**Alternatives Considered:**
- **A) Docker + Docker Compose:** Paridade, portável, fácil onboarding
- **B) Deployment nativo:** Mais simples, mas dependências manuais e difícil reproduzir

**Rationale:**
- ✅ Docker elimina "works on my machine" (versões iguais de PostgreSQL, Redis, Node.js)
- ✅ `docker-compose.yml` orquestra: backend, postgres, redis, minio (dev)
- ✅ Multi-stage Dockerfile: Build stage + production stage (imagem menor)
- ✅ Prod: Imagens separadas (frontend estático, backend API) para deploy independente
- ✅ Onboarding: `git clone && docker-compose up` = ambiente pronto
- ⚠️ Overhead de aprendizado Docker, mas é padrão da indústria

**Implementation Notes:**
```dockerfile
# backend/Dockerfile (multi-stage)
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
CMD ["node", "dist/main.js"]
```

```yaml
# docker-compose.yml (dev)
services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: ressoa_dev
      POSTGRES_PASSWORD: dev_password
    volumes:
      - pg_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
```

---

### AD-5.2: CI/CD Pipeline

**Decision:** GitHub Actions com workflows separados

**Context:**
- CI: Rodar testes e linting em PRs (evitar merge de código quebrado)
- CD: Deploy automático para staging (branch `develop`), manual para prod (`main`)
- Caching de dependências para builds rápidos (< 3 min)

**Alternatives Considered:**
- **A) GitHub Actions:** Free tier (2000 min/mês), integração nativa GitHub
- **B) GitLab CI / Jenkins:** Mais controle, mas self-hosted e complexidade

**Rationale:**
- ✅ GitHub Actions é free para repos privados (2000 min/mês suficiente para MVP)
- ✅ Workflows separados: CI (PRs) + CD staging (auto) + CD prod (manual/tag)
- ✅ Caching de `node_modules` e Prisma client (builds 3x mais rápidos)
- ✅ Secrets gerenciados via GitHub Secrets (DATABASE_URL, API keys)
- ✅ YAML simples, fácil iterar
- ⚠️ Lock-in GitHub, mas YAML é portável para outras CIs

**Implementation Notes:**
```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test

# .github/workflows/deploy-staging.yml
name: Deploy Staging
on:
  push:
    branches: [develop]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: docker build -t ressoa-backend .
      - run: docker push ressoa-backend:staging
      # Deploy to Railway/Render via webhook
```

---

### AD-5.3: Hosting Strategy (MVP)

**Decision:** Railway.app ou Render.com (PaaS) - SIMPLIFICADO PARA MVP

**Context:**
- MVP precisa deployment rápido, zero DevOps
- Estimativa: 5-10 escolas, ~800 horas processadas/mês
- Budget: $20-50/mês é aceitável para validação

**Alternatives Considered:**
- **A) Railway/Render (PaaS):** Zero DevOps, SSL auto, escalável
- **B) VPS (DigitalOcean):** Custo fixo ($12/mês), mas DevOps manual

**Rationale:**
- ✅ Railway/Render: Deploy via Git push, PostgreSQL/Redis inclusos
- ✅ SSL automático (Let's Encrypt), domínios custom
- ✅ Scaling: Basta aumentar resources (CPU/RAM) conforme escolas crescem
- ✅ Free tier ou $20-50/mês (aceitável para MVP)
- ✅ Migrations automáticas (Prisma migrate deploy no CI)
- ⚠️ Custo aumenta com escala (migrar para VPS após 20+ escolas)

**Implementation Notes:**
- Railway.app: Conectar repo GitHub, configurar build command, env vars
- PostgreSQL addon (Railway): Automático, backup incluído
- Redis addon (Railway): Automático
- Frontend: Build estático (`npm run build`) servido via Vercel ou Cloudflare Pages

---

### AD-5.4: Monitoring & Logging - SIMPLIFICADO PARA MVP

**Decision:** Sentry (errors) + Pino logger básico (SEM Grafana por enquanto)

**Context:**
- MVP precisa saber se há erros críticos (500, crashes)
- Logs estruturados para debugging (não console.log caótico)
- Orçamento: Minimizar custos iniciais

**Alternatives Considered:**
- **A) Sentry + Pino:** Erros rastreados, logs estruturados, free tier generoso
- **B) ELK Stack:** ❌ Overkill para MVP, pesado e caro

**Rationale:**
- ✅ Sentry free tier: 5k eventos/mês (suficiente para MVP com 5-10 escolas)
- ✅ Pino: Logger estruturado JSON, rápido, integra com NestJS
- ✅ Sentry captura errors frontend (React) e backend (NestJS)
- ✅ Alertas: Email quando error rate > threshold
- ⚠️ SEM Grafana Cloud por enquanto (adicionar após 20+ escolas)

**Implementation Notes:**
```typescript
// backend/main.ts
import * as Sentry from '@sentry/node';

Sentry.init({ dsn: process.env.SENTRY_DSN });

// backend/logger
import pino from 'pino';
export const logger = pino({ level: 'info' });

// frontend
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [new Sentry.BrowserTracing()],
});
```

**Adicionado futuramente (pós-MVP):**
- Grafana Cloud para métricas (API latency, queue backlog)
- Cost tracking dashboard (LLM/STT spend por escola)

---

### AD-5.5: Environment Management - SIMPLIFICADO PARA MVP

**Decision:** .env files + GitHub Secrets (SEM Doppler por enquanto)

**Context:**
- Variáveis de ambiente: DATABASE_URL, JWT_SECRET, API keys (OpenAI, Anthropic)
- Dev: Local .env files
- CI/CD: GitHub Secrets
- Prod: Railway/Render env vars UI

**Alternatives Considered:**
- **A) .env + GitHub Secrets:** Simples, free, suficiente para MVP
- **B) Doppler/Vault:** Melhor para secrets rotation, mas custo adicional

**Rationale:**
- ✅ `.env` files para dev (gitignored, template em `.env.example`)
- ✅ GitHub Secrets para CI/CD (secure, encrypted)
- ✅ Railway/Render UI para prod env vars (fácil editar, restart app)
- ✅ Validação: zod schema em `src/config/env.ts` (fail-fast se env var faltando)
- ⚠️ SEM Doppler por enquanto (adicionar se múltiplos ambientes ficarem complexos)

**Implementation Notes:**
```typescript
// backend/src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  OPENAI_API_KEY: z.string(),
  ANTHROPIC_API_KEY: z.string(),
});

export const env = envSchema.parse(process.env);
```

```bash
# .env.example (template versionado)
DATABASE_URL=postgresql://user:password@localhost:5432/ressoa_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-here-min-32-chars
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Summary of Architectural Decisions

**Total: 25 decisões documentadas**

| Categoria | Decisões | Status |
|-----------|----------|--------|
| **Auth & Security** | 5 | ✅ COMPLETA |
| **API & Communication** | 5 | ✅ COMPLETA |
| **Frontend Architecture** | 5 | ✅ COMPLETA |
| **Data Architecture** | 5 | ✅ COMPLETA |
| **Infrastructure & Deployment** | 5 | ✅ COMPLETA (simplificada para MVP) |

**Próximo passo:** Step 5 - Implementation Patterns (patterns de código, folder structure, convenções)

---
