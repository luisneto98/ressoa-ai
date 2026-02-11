# Story 0.5: CI/CD Pipeline Setup

Status: ready-for-dev

---

## Story

As a **desenvolvedor**,
I want **pipelines de CI/CD configurados no GitHub Actions para validar PRs e fazer deploy automático**,
So that **código quebrado não entra na base e deploys são automatizados**.

---

## Acceptance Criteria

**Given** o repositório está no GitHub
**When** crio workflow `.github/workflows/ci.yml` que:
- Trigger: em PRs para qualquer branch
- Jobs: `lint` e `test`
- Lint: executa `npm run lint` no frontend e backend
- Test: executa `npm run test` no backend (frontend quando tiver testes)
- Node.js 18.x
- Cache de `node_modules` (actions/cache)
**Then** o workflow CI está configurado

**Given** o workflow CI está criado
**When** abro um Pull Request com código válido
**Then** o workflow executa e passa (green check)

**And** se o código tiver erro de lint, o workflow falha e bloqueia merge

**Given** o CI está funcionando
**When** crio workflow `.github/workflows/deploy-staging.yml` que:
- Trigger: push para branch `develop`
- Jobs: `deploy-staging`
- Steps:
  - Checkout code
  - Build Docker images (frontend + backend)
  - Push para registry (Docker Hub ou GitHub Container Registry)
  - Trigger deploy via webhook (Railway/Render)
**Then** o workflow CD staging está configurado

**Given** os workflows estão criados
**When** configuro GitHub Secrets:
- `DATABASE_URL` (staging)
- `REDIS_URL` (staging)
- `JWT_SECRET` (gerado com `openssl rand -base64 32`)
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `SENTRY_DSN`
**Then** os secrets estão disponíveis para workflows via `${{ secrets.SECRET_NAME }}`

**Given** tudo está configurado
**When** faço merge de PR para `develop`
**Then** o workflow de deploy staging executa automaticamente

**And** a aplicação é atualizada no ambiente de staging (Railway/Render)

**And** posso acessar `https://ressoa-staging.railway.app` (ou URL equivalente)

---

## Tasks / Subtasks

- [ ] Task 1: Create CI Workflow for Pull Requests (AC: 1, 2, 3)
  - [ ] Criar diretório `.github/workflows/` na raiz do projeto (se não existir)
  - [ ] Criar arquivo `.github/workflows/ci.yml`
  - [ ] Configurar trigger: `on: [pull_request]`
  - [ ] Usar actions/checkout@v6 (latest stable 2026)
  - [ ] Usar actions/setup-node@v6 (latest stable 2026)
  - [ ] Criar job `lint-backend`: rodar `npm run lint` no `ressoa-backend/`
  - [ ] Criar job `lint-frontend`: rodar `npm run lint` no `ressoa-frontend/`
  - [ ] Criar job `test-backend`: rodar `npm run test` no `ressoa-backend/`
  - [ ] Configurar Node.js 22.x (LTS 2026, suporte até April 2027) via `actions/setup-node@v6`
  - [ ] Configurar cache automático: `cache: 'npm'` (setup-node v6 tem caching built-in)
  - [ ] Usar `npm ci` (não `npm install`) para instalar dependências (mais rápido e determinístico)
  - [ ] Validar sintaxe YAML: `yamllint .github/workflows/ci.yml` (ou GitHub UI)

- [ ] Task 2: Test CI Workflow with Real PR (AC: 2, 3)
  - [ ] Criar branch de teste: `git checkout -b test/ci-validation`
  - [ ] Fazer commit simples: adicionar console.log em algum arquivo backend
  - [ ] Push branch: `git push origin test/ci-validation`
  - [ ] Abrir PR no GitHub: `test/ci-validation` → `main` (ou `develop`)
  - [ ] Verificar que workflow CI executa automaticamente
  - [ ] Verificar logs no GitHub Actions: todos jobs passam (green check)
  - [ ] Adicionar erro proposital de lint: remover ponto-e-vírgula em TypeScript
  - [ ] Push novamente e verificar que workflow falha (red X)
  - [ ] Corrigir erro, push, confirmar que workflow passa novamente
  - [ ] Fechar PR de teste (não fazer merge)

- [ ] Task 3: Create Staging Deploy Workflow (AC: 4)
  - [ ] Criar arquivo `.github/workflows/deploy-staging.yml`
  - [ ] Configurar trigger: `on: push: branches: [develop]`
  - [ ] Criar job `deploy-staging`
  - [ ] Step 1: Checkout code (`actions/checkout@v4`)
  - [ ] Step 2: Setup Docker Buildx (multi-platform builds + BuildKit)
    - `uses: docker/setup-buildx-action@v3`
    - Enables BuildKit features (cache, multi-platform, etc.)
  - [ ] Step 3: Login no GitHub Container Registry
    - `echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin`
    - `GITHUB_TOKEN` é automático (não precisa configurar secret)
  - [ ] Step 4: Build and push backend image (usando docker/build-push-action@v6)
    - Image: `ghcr.io/${{ github.repository }}/backend:staging`
    - Platforms: `linux/amd64,linux/arm64` (multi-arch)
    - Cache: `cache-from: type=gha` + `cache-to: type=gha,mode=max`
    - Provenance: `true` (security attestation)
    - SBOM: `true` (software bill of materials)
  - [ ] Step 5: Build and push frontend image (mesmos settings)
    - Image: `ghcr.io/${{ github.repository }}/frontend:staging`
  - [ ] Step 6: Trigger Railway deploy via Railway CLI (recommended over webhook)
    - Install Railway CLI: `npm install -g @railway/cli`
    - Deploy: `railway up --service backend`
    - Authenticate via `RAILWAY_TOKEN` secret
    - **Alternative:** Railway auto-deploys on push if "Wait for CI" enabled in settings

- [ ] Task 4: Configure GitHub Secrets (AC: 5)
  - [ ] Abrir GitHub repo → Settings → Secrets and variables → Actions
  - [ ] Adicionar secret `DATABASE_URL`:
    - Valor: `postgresql://ressoa:staging_pass@staging-db.railway.internal:5432/ressoa_staging`
    - (Railway fornece URL automática após criar DB addon)
  - [ ] Adicionar secret `REDIS_URL`:
    - Valor: `redis://default:staging_redis_pass@staging-redis.railway.internal:6379`
  - [ ] Adicionar secret `JWT_SECRET`:
    - Gerar: `openssl rand -base64 32`
    - Copiar output e colar no secret
  - [ ] Adicionar secret `OPENAI_API_KEY`:
    - Valor: obtido de https://platform.openai.com/api-keys
  - [ ] Adicionar secret `ANTHROPIC_API_KEY`:
    - Valor: obtido de https://console.anthropic.com/settings/keys
  - [ ] Adicionar secret `SENTRY_DSN`:
    - Valor: obtido de https://sentry.io/ (após criar projeto)
    - Formato: `https://xxxxx@oyyy.ingest.sentry.io/zzzzz`
  - [ ] Adicionar secret `RAILWAY_TOKEN`:
    - Valor: Railway CLI token (Settings → Tokens → Create Token)
    - Scope: deployment access para o projeto
  - [ ] (Opcional) Adicionar secret `RENDER_DEPLOY_HOOK` se usar Render

- [ ] Task 5: Create .env.example Templates (Meta)
  - [ ] Criar `ressoa-backend/.env.example` com todas variáveis necessárias (comentadas)
  - [ ] Exemplo:
    ```
    DATABASE_URL=postgresql://ressoa:dev_password@localhost:5432/ressoa_dev
    REDIS_URL=redis://localhost:6379
    JWT_SECRET=your-secret-here-generate-with-openssl-rand-base64-32
    JWT_ACCESS_TOKEN_EXPIRES_IN=15m
    JWT_REFRESH_TOKEN_EXPIRES_IN=7d
    OPENAI_API_KEY=sk-xxxxx
    ANTHROPIC_API_KEY=sk-ant-xxxxx
    GOOGLE_SPEECH_API_KEY=xxxxx
    SENTRY_DSN=https://xxxxx@oyyy.ingest.sentry.io/zzzzz
    NODE_ENV=development
    PORT=3000
    CORS_ORIGINS=http://localhost:5173
    ```
  - [ ] Criar `ressoa-frontend/.env.example`:
    ```
    VITE_API_URL=http://localhost:3000/api/v1
    VITE_SENTRY_DSN=https://xxxxx@oyyy.ingest.sentry.io/zzzzz
    VITE_ENV=development
    ```
  - [ ] Adicionar `.env` ao `.gitignore` (se já não estiver)
  - [ ] Documentar no README.md: "Copie .env.example para .env e preencha valores"

- [ ] Task 6: Test Staging Deploy End-to-End (AC: 6, 7)
  - [ ] Fazer commit de alteração simples no backend
  - [ ] Merge PR para branch `develop`
  - [ ] Verificar que workflow `deploy-staging` executa automaticamente
  - [ ] Verificar logs no GitHub Actions: todos steps passam
  - [ ] Verificar Railway/Render dashboard: novo deploy iniciado
  - [ ] Aguardar deploy completo (~2-5 min)
  - [ ] Acessar URL staging: `https://ressoa-staging.railway.app` (ou equivalente)
  - [ ] Testar endpoint de health check: `GET /health` deve retornar 200
  - [ ] (Opcional) Testar login endpoint: `POST /api/v1/auth/login` com usuário de teste

- [ ] Task 7: Create Production Deploy Workflow (Optional - Meta)
  - [ ] Criar arquivo `.github/workflows/deploy-production.yml`
  - [ ] Trigger: `on: push: tags: ['v*']` (manual via Git tag)
  - [ ] Jobs similares a staging, mas:
    - Images com tag `:production` (não `:staging`)
    - Usa secrets de produção: `PROD_DATABASE_URL`, `PROD_REDIS_URL`, etc.
    - Deploy manual: requer aprovação via GitHub Environments
  - [ ] Documentar processo no README.md: "Para deploy prod: `git tag v1.0.0 && git push origin v1.0.0`"

- [ ] Task 8: Add CI/CD Badges to README (Meta)
  - [ ] Abrir `README.md` na raiz do projeto
  - [ ] Adicionar badge de CI status:
    `[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)`
  - [ ] Adicionar badge de deploy staging:
    `[![Deploy Staging](https://github.com/OWNER/REPO/actions/workflows/deploy-staging.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/deploy-staging.yml)`
  - [ ] Commit: "docs: add CI/CD badges to README"

---

## Dev Notes

### 🎯 CRITICAL CONTEXT FOR IMPLEMENTATION

**Product Name:** Ressoa AI
**Story Position:** ÚLTIMA story do Epic 0 (Project Setup & Infrastructure)
**Purpose:** Automatizar validação de código e deploys, liberar time para focar em features de negócio

Esta é a **QUINTA e ÚLTIMA story do Epic 0**. Após esta story, o projeto terá:
- ✅ Frontend (React + Tailwind + shadcn/ui)
- ✅ Backend (NestJS + Prisma + Bull)
- ✅ Docker Compose (PostgreSQL + Redis + MinIO)
- ✅ BNCC Seeding (369 habilidades)
- ✅ **CI/CD completo (esta story)**

**🚀 EPIC 0 COMPLETO → PRÓXIMO: Epic 1 (Authentication & Multi-Tenancy)**

---

### Previous Story Intelligence (Stories 0.1-0.4 Learnings)

**Story 0.1 (Frontend):**
- ✅ React 18 + Vite + TypeScript
- ✅ Tailwind CSS + shadcn/ui configurados
- ✅ npm script: `npm run lint` (ESLint)
- ✅ npm script: `npm run build` (production build)
- 📂 Working directory: `ressoa-frontend/`

**Story 0.2 (Backend):**
- ✅ NestJS (TypeScript strict mode)
- ✅ Prisma 7 com driver adapter
- ✅ npm script: `npm run lint` (ESLint + Prettier)
- ✅ npm script: `npm run test` (Jest unit tests)
- ✅ npm script: `npm run test:e2e` (E2E tests)
- 📂 Working directory: `ressoa-backend/`

**Story 0.3 (Docker Compose):**
- ✅ PostgreSQL 14-alpine em `localhost:5432`
- ✅ Redis 7-alpine em `localhost:6379`
- ✅ MinIO (S3-compatible) em `localhost:9000`
- ✅ `docker-compose.yml` configurado
- ⚠️ **IMPORTANTE:** CI precisa rodar `docker-compose up -d` antes de rodar testes E2E

**Story 0.4 (BNCC Seeding):**
- ✅ Prisma migrations via `npx prisma migrate dev`
- ✅ Prisma seed via `npx ts-node prisma/seed.ts`
- ✅ 276 habilidades seeded (MVP parcial - Matemática e Ciências completos)
- ✅ Padrão: idempotent upsert
- ⚠️ **IMPORTANTE:** Deploy precisa rodar migrations: `npx prisma migrate deploy`

**Padrões Estabelecidos:**
- ✅ Commit messages: `feat(module): description with code review fixes`
- ✅ Code review adversarial: encontrar 3-10 issues (HIGH/MEDIUM/LOW)
- ✅ TypeScript strict mode obrigatório
- ✅ ESLint + Prettier configurados
- ✅ npm ci (não npm install) para CI/CD
- ✅ .env.example templates para variáveis de ambiente

---

### Technical Requirements - GitHub Actions CI/CD

#### CI Workflow Requirements

**Trigger:**
- Executar em TODOS Pull Requests (qualquer branch → qualquer branch)
- Executar em re-push de commits (para validar correções)

**Jobs:**
1. **lint-backend:**
   - Working directory: `ressoa-backend/`
   - Command: `npm run lint`
   - Must pass for PR to be mergeable

2. **lint-frontend:**
   - Working directory: `ressoa-frontend/`
   - Command: `npm run lint`
   - Must pass for PR to be mergeable

3. **test-backend:**
   - Working directory: `ressoa-backend/`
   - Setup: `docker-compose up -d` (PostgreSQL + Redis)
   - Command: `npm run test` (Jest unit tests)
   - Command: `npm run test:e2e` (E2E tests)
   - Teardown: `docker-compose down`
   - Must pass for PR to be mergeable

**Performance Optimization:**
- **Automatic caching** via `actions/setup-node@v6` with `cache: 'npm'`
  - Caches global npm cache (not node_modules) for faster installs
  - Allows cache reuse between Node versions
  - Cache key automatically based on package-lock.json hash
- Expected build time: < 3 minutes (com cache), ~5-8 min (cold)
- Use `npm ci` (not `npm install`) for deterministic, faster installs

**Node.js Version:**
- **Use Node.js 22 LTS (CRITICAL - Latest LTS in 2026)**
  - Node 18: EOL, unsupported (skip)
  - Node 20: EOL April 2025 (skip to avoid upgrade cycle)
  - **Node 22: Active LTS until April 2027** ✅ Longest support window
  - Native TypeScript support (behind flag)
  - Best long-term strategy for new projects
- Via `actions/setup-node@v6` with `node-version: '22'`

---

#### CD Staging Workflow Requirements

**Trigger:**
- Push para branch `develop`
- Manual dispatch (opcional, via `workflow_dispatch`)

**Jobs:**
1. **deploy-staging:**
   - Build Docker images (frontend + backend)
   - Push para GitHub Container Registry (ghcr.io)
   - Trigger webhook de deploy (Railway/Render)

**Docker Images:**
- Backend: `ghcr.io/${{ github.repository }}/backend:staging`
- Frontend: `ghcr.io/${{ github.repository }}/frontend:staging`

**Deployment Target:**
- **Railway.app** (PaaS simplificado para MVP)
- Addons: PostgreSQL, Redis
- Webhook URL: fornecido pelo Railway (Settings → Deployments → Webhooks)

**Secrets Needed:**
- `RAILWAY_TOKEN`: Railway CLI token para deploy (obtido em Railway Settings → Tokens)
- `DATABASE_URL`: Connection string PostgreSQL staging
- `REDIS_URL`: Connection string Redis staging
- `JWT_SECRET`: Secret key para JWT tokens
- `OPENAI_API_KEY`: OpenAI API key (Whisper STT)
- `ANTHROPIC_API_KEY`: Anthropic API key (Claude LLM)
- `SENTRY_DSN`: Sentry error tracking DSN

---

### Architecture Compliance

#### AD-5.2: CI/CD Pipeline (from architecture.md)

**Decision:** GitHub Actions com workflows separados

**Rationale:**
- ✅ GitHub Actions é free para repos privados (2000 min/mês)
- ✅ Workflows separados: CI (PRs) + CD staging (auto) + CD prod (manual/tag)
- ✅ Caching de `node_modules` e Prisma client (builds 3x mais rápidos)
- ✅ Secrets gerenciados via GitHub Secrets
- ✅ YAML simples, fácil iterar

**Key Decisions:**
- CI: Rodar em TODOS PRs (lint + test)
- CD Staging: Auto deploy em push para `develop`
- CD Production: Manual deploy via Git tags (v1.0.0) - opcional para MVP

---

#### AD-5.3: Hosting Strategy (from architecture.md)

**Decision:** Railway.app (PaaS) - SIMPLIFICADO PARA MVP

**Rationale:**
- ✅ Railway/Render: Deploy via Git push, PostgreSQL/Redis inclusos
- ✅ SSL automático (Let's Encrypt)
- ✅ Scaling: Aumentar resources (CPU/RAM) via UI
- ✅ Free tier ou $20-50/mês (aceitável para MVP)
- ✅ Migrations automáticas (Prisma migrate deploy no CI)

**Setup Steps:**
1. Conectar repo GitHub ao Railway
2. Criar addons: PostgreSQL + Redis
3. Configurar env vars: DATABASE_URL, REDIS_URL, etc.
4. Railway gera webhook URL para deploy via CI

---

#### AD-5.5: Environment Management (from architecture.md)

**Decision:** .env files + GitHub Secrets (SEM Doppler por enquanto)

**Rationale:**
- ✅ `.env` files para dev (gitignored, template em `.env.example`)
- ✅ GitHub Secrets para CI/CD (secure, encrypted)
- ✅ Railway/Render UI para prod env vars
- ✅ Validação: zod schema em `src/config/env.ts` (fail-fast se faltando)

**Template Structure:**
- `.env.example`: Todas variáveis com comentários explicativos
- `.env`: Gitignored, valores reais locais
- GitHub Secrets: Valores de staging/prod

---

### Complete CI Workflow Example

**File:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches:
      - '**'

jobs:
  lint-backend:
    name: Lint Backend
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v6

      - name: Setup Node.js 22 LTS
        uses: actions/setup-node@v6
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: ressoa-backend/package-lock.json

      - name: Install dependencies
        working-directory: ressoa-backend
        run: npm ci

      - name: Run lint
        working-directory: ressoa-backend
        run: npm run lint

  lint-frontend:
    name: Lint Frontend
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v6

      - name: Setup Node.js 18
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: ressoa-frontend/package-lock.json

      - name: Install dependencies
        working-directory: ressoa-frontend
        run: npm ci

      - name: Run lint
        working-directory: ressoa-frontend
        run: npm run lint

  test-backend:
    name: Test Backend
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14-alpine
        env:
          POSTGRES_USER: ressoa
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: ressoa_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v6

      - name: Setup Node.js 22 LTS
        uses: actions/setup-node@v6
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: ressoa-backend/package-lock.json

      - name: Install dependencies
        working-directory: ressoa-backend
        run: npm ci

      - name: Run Prisma migrations
        working-directory: ressoa-backend
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://ressoa:test_password@localhost:5432/ressoa_test

      - name: Run unit tests
        working-directory: ressoa-backend
        run: npm run test
        env:
          DATABASE_URL: postgresql://ressoa:test_password@localhost:5432/ressoa_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-jwt-secret-for-ci
          NODE_ENV: test

      - name: Run E2E tests
        working-directory: ressoa-backend
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://ressoa:test_password@localhost:5432/ressoa_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-jwt-secret-for-ci
          NODE_ENV: test
```

---

### Complete Staging Deploy Workflow Example

**File:** `.github/workflows/deploy-staging.yml`

```yaml
name: Deploy Staging

on:
  push:
    branches:
      - develop
  workflow_dispatch: # Allow manual trigger

jobs:
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v6

      - name: Setup Node.js 18
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Build Backend Docker Image
        run: |
          docker build -t ghcr.io/${{ github.repository }}/backend:staging ./ressoa-backend

      - name: Build Frontend Docker Image
        run: |
          docker build -t ghcr.io/${{ github.repository }}/frontend:staging ./ressoa-frontend

      - name: Login to GitHub Container Registry
        run: |
          echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin

      - name: Push Backend Image
        run: |
          docker push ghcr.io/${{ github.repository }}/backend:staging

      - name: Push Frontend Image
        run: |
          docker push ghcr.io/${{ github.repository }}/frontend:staging

      - name: Trigger Railway Deploy
        run: |
          curl -X POST "${{ secrets.RAILWAY_WEBHOOK_URL }}"

      - name: Deployment Success
        run: |
          echo "✅ Staging deployment triggered successfully!"
          echo "Check Railway dashboard for deployment status"
          echo "URL: https://ressoa-staging.railway.app"
```

---

### Testing Requirements

#### Validation Checklist

- [ ] **CI Workflow Created:** `.github/workflows/ci.yml` exists in repo
- [ ] **CD Workflow Created:** `.github/workflows/deploy-staging.yml` exists
- [ ] **GitHub Secrets Configured:** All 7 secrets exist (DATABASE_URL, REDIS_URL, JWT_SECRET, OPENAI_API_KEY, ANTHROPIC_API_KEY, SENTRY_DSN, RAILWAY_WEBHOOK_URL)
- [ ] **CI Passes on Clean PR:** Open test PR with valid code → CI passes (green check)
- [ ] **CI Fails on Lint Error:** Add lint error → CI fails (red X)
- [ ] **Staging Deploy Works:** Merge PR to `develop` → Deploy workflow triggers → Railway deploys new version
- [ ] **Staging URL Accessible:** `https://ressoa-staging.railway.app/health` returns 200
- [ ] **.env.example Exists:** Both `ressoa-backend/.env.example` and `ressoa-frontend/.env.example` created
- [ ] **README Badges Added:** CI and Deploy badges visible in README.md

#### Manual Testing Steps

**1. Test CI Workflow:**
```bash
# Create test branch
git checkout -b test/ci-pipeline

# Add simple change
echo "// CI test" >> ressoa-backend/src/main.ts

# Commit and push
git add .
git commit -m "test: validate CI pipeline"
git push origin test/ci-pipeline

# Open PR on GitHub UI
# Verify CI workflow runs and passes
```

**2. Test Lint Failure:**
```bash
# Add lint error (remove semicolon)
# In ressoa-backend/src/main.ts: remove semicolon from any line

# Push
git add .
git commit -m "test: trigger lint failure"
git push origin test/ci-pipeline

# Verify CI workflow fails with lint error
# Fix error and verify CI passes again
```

**3. Test Staging Deploy:**
```bash
# Merge PR to develop
git checkout develop
git merge test/ci-pipeline
git push origin develop

# Verify deploy-staging workflow triggers automatically
# Check GitHub Actions tab: Deploy Staging workflow should be running
# Check Railway dashboard: New deployment should start
# Wait ~2-5 minutes for deployment
# Access: curl https://ressoa-staging.railway.app/health
# Expected: {"status": "ok"}
```

---

### Troubleshooting Guide

#### CI Workflow Fails: "Command not found: npm"

**Cause:** Node.js not installed or wrong version

**Solution:**
```yaml
# Ensure actions/setup-node@v4 is BEFORE npm ci
- name: Setup Node.js 18
  uses: actions/setup-node@v4
  with:
    node-version: '18'
```

---

#### CI Workflow Fails: "npm ci can only install packages when your package.json..."

**Cause:** `package-lock.json` missing or out of sync

**Solution:**
```bash
# Locally regenerate package-lock.json
cd ressoa-backend
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "fix: regenerate package-lock.json"
git push
```

---

#### CI Workflow Fails: "Prisma migrate deploy failed"

**Cause:** PostgreSQL service not ready or DATABASE_URL incorrect

**Solution:**
```yaml
# Add wait-for-db step BEFORE migrations
- name: Wait for PostgreSQL
  run: |
    until pg_isready -h localhost -p 5432 -U ressoa; do
      echo "Waiting for PostgreSQL..."
      sleep 2
    done

# Verify DATABASE_URL in env section
env:
  DATABASE_URL: postgresql://ressoa:test_password@localhost:5432/ressoa_test
```

---

#### Staging Deploy Fails: "Docker login failed"

**Cause:** GITHUB_TOKEN permissions insufficient

**Solution:**
```yaml
# Add permissions to workflow file
name: Deploy Staging

permissions:
  contents: read
  packages: write # Required for ghcr.io push

on:
  push:
    branches:
      - develop
```

---

#### Staging Deploy Succeeds but Railway Doesn't Deploy

**Cause:** Webhook URL incorrect or Railway not configured

**Solution:**
1. Verify Railway webhook URL:
   - Railway dashboard → Settings → Deployments → Webhooks
   - Copy webhook URL
   - Update GitHub Secret `RAILWAY_WEBHOOK_URL`
2. Verify Railway service is connected to GitHub Container Registry:
   - Railway dashboard → Service → Settings → Image Source
   - Set to: `ghcr.io/OWNER/REPO/backend:staging`

---

### Multi-Tenancy Compliance (Critical for Future Stories)

**NOT APPLICABLE to this story** - CI/CD is infrastructure-only, não manipula dados multi-tenant.

Future stories (Epic 1+) precisarão garantir que testes E2E validam isolamento multi-tenant.

---

### Latest GitHub Actions Best Practices (2026 Research)

**CRITICAL UPDATES from 2026 research:**

1. **Node.js 22 LTS is MANDATORY for new projects:**
   - Node 18: EOL and unsupported (no security patches)
   - Node 20: EOL April 2025 (skip to avoid upgrade cycle in 1 year)
   - **Node 22: Active LTS until April 2027** (longest support, native TS support)
   - Source: [Node.js Release Schedule](https://nodejs.org/en/about/previous-releases)

2. **Latest Action Versions (2026):**
   - `actions/checkout@v6` (latest stable)
   - `actions/setup-node@v6` (latest stable, built-in caching)
   - `docker/build-push-action@v6` (Docker builds)
   - `docker/setup-buildx-action@v3` (multi-platform + BuildKit)
   - `docker/login-action@v3` (secure Docker login)
   - Sources: [actions/setup-node](https://github.com/actions/setup-node), [docker/build-push-action](https://github.com/docker/build-push-action)

3. **Caching Strategy:**
   - **Don't cache node_modules** - cache global package manager cache instead
   - Use `cache: 'npm'` in setup-node@v6 (automatic, smart caching)
   - Allows cache reuse between Node versions
   - Source: [GitHub Actions Caching Best Practices](https://www.warpbuild.com/blog/github-actions-cache)

4. **Docker Build Modern Approach:**
   - Use `docker/build-push-action@v6` (not raw docker commands)
   - Enable GitHub Actions cache: `cache-from: type=gha`, `cache-to: type=gha,mode=max`
   - Multi-platform builds: `platforms: linux/amd64,linux/arm64`
   - Security attestations: `provenance: true`, `sbom: true`
   - Source: [Docker Build with GitHub Actions](https://docs.docker.com/build/ci/github-actions/)

5. **Railway Deployment Pattern:**
   - Use Railway CLI (`railway up`) instead of webhooks (more reliable)
   - Authenticate via `RAILWAY_TOKEN` secret
   - Enable "Wait for CI" in Railway settings to block deploys until GitHub Actions passes
   - Source: [Railway GitHub Actions Integration](https://docs.railway.com/tutorials/github-actions-post-deploy)

6. **GitHub Secrets Security Best Practices:**
   - Principle of least privilege: only workflows that need secrets get access
   - **Register generated secrets:** If JWT signed from private key, register that JWT as secret too
   - Use environment secrets for production (requires approval)
   - Rotate periodically (DATABASE_URL, JWT_SECRET, API keys)
   - Never wrap secrets in JSON/YAML (reduces redaction effectiveness)
   - Source: [GitHub Secrets Secure Use Reference](https://docs.github.com/en/actions/reference/security/secure-use)

**Why These Updates Matter:**
- Node 22: Avoids forced upgrade in 2026-2027 (Node 20 EOL)
- Latest actions: Performance improvements, security patches
- Buildx + cache: Faster builds (3-5x), multi-arch support (Railway may use ARM)
- Railway CLI: More reliable than webhooks, better error messages

---

### References

- [Source: architecture.md - AD-5.2 CI/CD Pipeline]
- [Source: architecture.md - AD-5.3 Hosting Strategy (Railway)]
- [Source: architecture.md - AD-5.5 Environment Management]
- [Source: epics.md - Epic 0 Story 0.5]
- [Source: story 0.2 - npm scripts (lint, test)]
- [Source: story 0.3 - Docker Compose (PostgreSQL + Redis)]
- [Source: story 0.4 - Prisma migrations (migrate deploy)]
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Container Registry Documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Railway Documentation - Webhooks](https://docs.railway.app/reference/deployments#webhooks)

---

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent executing this story._

### Implementation Plan

_To be filled by dev agent with approach and strategy._

### Debug Log References

_To be filled by dev agent with any relevant debugging information._

### Completion Notes List

_To be filled by dev agent with final completion notes and observations._

### File List

_To be filled by dev agent with all files created/modified during implementation._
