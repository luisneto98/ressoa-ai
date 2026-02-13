---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics']
inputDocuments:
  - 'prd.md'
  - 'architecture.md'
  - 'ux-design-specification.md'
  - 'business-rules-pedagogical-analysis.md'
  - 'external-integrations-api-contracts-2026-02-08.md'
  - 'estrategia-prompts-ia-2026-02-08.md'
---

# professor-analytics - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for professor-analytics, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

**Gestão de Planejamento (FR1-FR5):**
- FR1: Professor pode cadastrar planejamento bimestral para suas turmas
- FR2: Professor pode vincular habilidades BNCC ao planejamento
- FR3: Professor pode visualizar lista de habilidades BNCC filtradas por série e disciplina
- FR4: Professor pode editar ou excluir planejamentos existentes
- FR5: Sistema sugere habilidades BNCC baseado no conteúdo digitado (post-MVP)

**Captura de Aulas (FR6-FR11):**
- FR6: Professor pode fazer upload de arquivo de áudio da aula
- FR7: Professor pode fazer upload de transcrição pronta (texto)
- FR8: Professor pode digitar resumo manual da aula
- FR9: Professor pode associar upload a uma turma e data específica
- FR10: Sistema aceita múltiplos formatos de áudio (mp3, wav, m4a, webm)
- FR11: Professor pode visualizar status de processamento de suas aulas

**Processamento de Transcrição (FR12-FR16):**
- FR12: Sistema transcreve áudio automaticamente via STT
- FR13: Sistema usa provider alternativo quando primário falha
- FR14: Sistema processa transcrições em batch (assíncrono)
- FR15: Sistema notifica professor quando transcrição está pronta
- FR16: Sistema armazena transcrição temporariamente até análise completa

**Análise Pedagógica (FR17-FR22):**
- FR17: Sistema analisa cobertura de habilidades BNCC na transcrição
- FR18: Sistema gera análise qualitativa do conteúdo da aula
- FR19: Sistema identifica evidências literais do conteúdo (não parafraseia)
- FR20: Sistema cruza conteúdo da aula com planejamento bimestral
- FR21: Sistema detecta gaps entre planejamento e execução
- FR22: Sistema gera alertas de turmas atrasadas (post-MVP)

**Outputs para Professor (FR23-FR30):**
- FR23: Sistema gera relatório automático da aula
- FR24: Professor pode editar relatório gerado antes de aprovar
- FR25: Professor pode aprovar ou rejeitar relatório
- FR26: Sistema gera exercícios contextuais baseados no conteúdo real
- FR27: Professor pode editar exercícios gerados
- FR28: Sistema gera sugestões para próxima aula
- FR29: Professor pode visualizar % de cobertura curricular própria
- FR30: Professor pode exportar relatórios aprovados (post-MVP)

**Dashboard e Métricas (FR31-FR37):**
- FR31: Coordenador pode visualizar métricas de cobertura por professor
- FR32: Coordenador pode visualizar métricas de cobertura por turma
- FR33: Coordenador pode identificar turmas com atraso curricular
- FR34: Dono pode visualizar métricas agregadas da escola
- FR35: Dono pode visualizar % de cobertura curricular geral
- FR36: Sistema calcula cobertura bimestral como métrica materializada
- FR37: Coordenador NÃO pode acessar transcrições brutas

**Gestão de Usuários e Permissões (FR38-FR45):**
- FR38: Administrador pode cadastrar escolas (tenants)
- FR39: Administrador pode cadastrar usuários por escola
- FR40: Sistema isola dados completamente entre escolas
- FR41: Professor vê apenas seus próprios dados
- FR42: Coordenador vê métricas (sem transcrições) de todos professores
- FR43: Dono vê apenas dados agregados da escola
- FR44: Usuário pode fazer login com email/senha
- FR45: Usuário pode recuperar senha

**Administração do Sistema (FR46-FR50):**
- FR46: Admin interno pode monitorar taxa de erro de STT
- FR47: Admin interno pode monitorar tempo de processamento
- FR48: Admin interno pode monitorar fila de análises pendentes
- FR49: Admin interno pode monitorar custos de API por escola
- FR50: Admin interno pode identificar prompts com baixa taxa de aprovação

### NonFunctional Requirements

**Performance:**
- NFR-PERF-01: Transcrição de aula (50min) < 5 minutos
- NFR-PERF-02: Análise pedagógica < 60 segundos
- NFR-PERF-03: Geração relatório + exercícios < 40 segundos
- NFR-PERF-04: Dashboard de cobertura < 2 segundos
- NFR-PERF-05: Upload de áudio (100MB) < 30 segundos

**Segurança:**
- NFR-SEC-01: Criptografia em trânsito TLS 1.2+ para todas as conexões
- NFR-SEC-02: Criptografia em repouso AES-256 para dados sensíveis
- NFR-SEC-03: Isolamento multi-tenant via Row-level security ou schema separation
- NFR-SEC-04: Retenção de transcrição: deletar após análise completa (máx 7 dias)
- NFR-SEC-05: Retenção de áudio: não armazenar permanentemente
- NFR-SEC-06: Autenticação: senhas com hash bcrypt, sessões com JWT
- NFR-SEC-07: Logs de acesso: auditoria de acessos a dados sensíveis
- NFR-SEC-08: Compliance LGPD: consentimento, portabilidade, exclusão

**Escalabilidade:**
- NFR-SCALE-01: Piloto (3 meses): 2-3 escolas, ~100 professores
- NFR-SCALE-02: Growth (12 meses): 15-20 escolas, ~600 professores
- NFR-SCALE-03: Pico de uso: Segunda-feira manhã (uploads do fim de semana)
- NFR-SCALE-04: Processamento batch: Fila distribuída, sem limite de tamanho
- NFR-SCALE-05: Custo por aula: < R$0,75 mesmo em escala

**Acessibilidade:**
- NFR-ACCESS-01: Contraste WCAG 2.1 AA mínimo (WCAG AAA preferencial: 14.8:1)
- NFR-ACCESS-02: Navegação por teclado para todas as ações principais
- NFR-ACCESS-03: Tamanho de fonte mínimo 16px, ajustável pelo usuário
- NFR-ACCESS-04: Responsividade mobile-friendly para upload de áudio
- NFR-ACCESS-05: Mensagens de erro claras e acionáveis
- NFR-ACCESS-06: Touch targets mínimo 44x44px (mobile)

**Integração:**
- NFR-INTEG-01: Multi-provider STT: Failover automático Whisper → Google
- NFR-INTEG-02: Multi-provider LLM: Abstração para Claude/GPT/Gemini
- NFR-INTEG-03: Timeout de APIs externas: 30 segundos com retry automático
- NFR-INTEG-04: Rate limiting: respeitar limites de cada provider
- NFR-INTEG-05: Fallback gracioso: notificar usuário se todos providers falharem

**Confiabilidade:**
- NFR-RELIAB-01: Uptime 99% durante horário comercial (seg-sex 7h-19h)
- NFR-RELIAB-02: Backup diário, retenção 30 dias (7d/4w/12m)
- NFR-RELIAB-03: Recovery: RTO < 4 horas, RPO < 24 horas
- NFR-RELIAB-04: Fila de processamento: persistente, sobrevive a restart
- NFR-RELIAB-05: Notificações de erro: alertar admin se > 5% de falhas em 1 hora

### Additional Requirements

**Architecture Requirements:**

1. **Starter Template (Epic 1 Story 1 - Setup):**
   - Frontend: `npm create vite@latest ressoa-frontend -- --template react-ts`
   - Backend: `nest new ressoa-backend --strict`
   - Post-setup: Tailwind + shadcn/ui (frontend), Prisma + Bull (backend)

2. **Tech Stack Decisions (25 Architectural Decisions):**
   - **Frontend:** React 18 + Vite + TypeScript, Zustand (state), React Query + axios (API), React Hook Form + zod (forms), shadcn/ui
   - **Backend:** NestJS + TypeScript strict, Passport JWT + bcrypt, REST API (/api/v1/), Swagger docs, class-validator DTOs
   - **Data:** Prisma ORM + PostgreSQL 14+, Prisma Migrate, RLS (Row-Level Security) + tenant_id para multi-tenancy
   - **Async:** Bull queue (Redis-based), Workers escaláveis, Retry 3x exponential backoff
   - **Caching:** Redis para sessions, CoberturaBimestral, rate limiting
   - **Upload:** TUS Protocol (resumível), chunks 5MB, S3/MinIO storage
   - **Security:** JWT (access 15min + refresh 7d Redis), CORS restrito (.env), @nestjs/throttler rate limiting
   - **Monitoring MVP:** Sentry (errors), Pino (logs estruturados) - SEM Grafana/Doppler por enquanto
   - **Infra MVP:** Docker Compose (dev), GitHub Actions (CI/CD), Railway/Render (hosting), .env + GitHub Secrets
   - **Database:** pg_dump diário + S3 (retenção 7d/4w/12m), Materialized views refresh via Bull (CONCURRENTLY)

3. **Infrastructure Requirements:**
   - Docker + Docker Compose para paridade dev/prod
   - GitHub Actions CI/CD (workflows separados: CI para PRs, CD staging auto, CD prod manual)
   - Railway.app ou Render.com (PaaS) - zero DevOps para MVP
   - Sentry para error tracking (free tier 5k eventos/mês)
   - Pino logger estruturado (JSON logs)

4. **Data Model Requirements:**
   - BNCC Seeding: 369 habilidades via JSON source files + Prisma seed script (idempotente)
   - Multi-Tenancy: PostgreSQL RLS + escola_id em todas tabelas + Prisma middleware
   - Materialized View: `cobertura_bimestral` com refresh via Bull jobs (CONCURRENTLY)
   - Backup Strategy: pg_dump diário + S3 com retenção (7d/4w/12m)

**UX Design Requirements:**

1. **Design System:**
   - Tailwind CSS + shadcn/ui (customizável, acessível)
   - Colors: Deep Navy (#0A2647), Tech Blue (#2563EB), Cyan AI (#06B6D4), Focus Orange (#F97316), Ghost White (#F8FAFC)
   - Typography: Montserrat (headers) + Inter (body)
   - Breakpoints: Mobile (<640px), Tablet (640-1024px), Desktop (>1024px)

2. **Accessibility (WCAG AAA):**
   - Contraste 14.8:1 (AAA-compliant)
   - Touch targets 44x44px mínimo (mobile)
   - Radix UI (ARIA nativo via shadcn/ui)
   - Keyboard navigation completa

3. **Upload Pattern (Dropbox-style):**
   - Drag-and-drop com preview visual
   - Upload resumível (TUS Protocol) - conexões 3G/4G instáveis
   - Chunks de 5MB
   - Progress bar visual: "Enviando 45% → Transcrevendo → Analisando"
   - Validação de formato ANTES de enviar
   - Alternativas se upload falhar: digitar resumo manual, importar Read.ai

4. **Responsividade Real (Mobile-First):**
   - Mobile: foco em ações rápidas (aprovar relatório, ver progresso, upload)
   - Desktop: análises profundas (editar relatório, comparar habilidades, dashboard completo)
   - Não é adaptativo passivo - é otimizado por contexto

5. **Core Experience Principles:**
   - Transparência Radical: IA mostra evidências literais da transcrição
   - Confiança pela Qualidade: >90% relatórios utilizáveis sem edição significativa
   - Resiliência por Design: Failover multi-provider, recuperação graciosa de erros
   - Contexto Adaptativo: Interface muda por role (Professor/Coordenador/Diretor)
   - Esforço Zero: Upload em 3 cliques, aprovação em 1 clique

**Business Rules Requirements:**

1. **Planejamento Rules:**
   - RN-PLAN-01: Planejamento não validado gera flag visível para coordenação (não bloqueia professor)
   - RN-PLAN-02: Pesos não informados = distribuição igual entre tópicos
   - RN-PLAN-03: Aulas previstas não informadas = estimativa automática
   - RN-PLAN-04: Nível 1 (bimestral) é suficiente, Nível 2 (por aula) refina mas não é obrigatório

2. **Cobertura Curricular Rules:**
   - RN-COV-01: Fórmula de cobertura com classificação (COMPLETE, PARTIAL, MENTIONED, NOT_COVERED)
   - RN-COV-02: Classificação é cumulativa ao longo do bimestre (reclassificação permitida)
   - RN-COV-03: IA deve fornecer justificativa textual citando trechos da transcrição

3. **Alertas Rules:**
   - RN-ALERT-01: Alertas CRITICAL para coordenadores são consolidados semanalmente (não real-time)
   - RN-ALERT-02: Professor recebe INFO/WARNING no relatório, CRITICAL em notificação separada
   - RN-ALERT-03: Coordenador NÃO recebe transcrições brutas com alertas

4. **Gaming Prevention Rules:**
   - RN-GAME-01: Flags de gaming visíveis apenas para coordenação (não para professor)
   - RN-GAME-02: Sistema nunca acusa explicitamente de manipulação (linguagem neutra)
   - RN-GAME-03: Requer padrão recorrente (mín 3 em 4 semanas) para escalar

5. **Sugestões Rules:**
   - RN-SUG-01: Reforço (P0) tem prioridade sobre avanço de conteúdo novo
   - RN-SUG-02: Máximo 3 sugestões por relatório (evitar sobrecarga)
   - RN-SUG-03: Sugestões NUNCA prescrevem metodologia (preserva autonomia pedagógica)

**External Integrations Requirements:**

1. **STT Multi-Provider:**
   - Primário: OpenAI Whisper large-v3 ($0.36/hora, qualidade ⭐⭐⭐⭐⭐)
   - Fallback: Google Speech-to-Text enhanced ($1.44/hora)
   - Failover automático: Whisper falha → Google
   - Custo alvo: <24% da receita (Whisper como primário)

2. **LLM Multi-Provider:**
   - Análise pedagógica principal: Claude 4.6 Sonnet (~$0.10/aula)
   - Geração de exercícios: GPT-4.6 mini (~$0.02/aula, custo 20x menor)
   - Fallback universal: Gemini 1.5 Pro (custo intermediário)
   - Custo alvo total IA: <R$0,75/aula (<40% da receita R$1.200/escola/mês)

3. **Provider Abstraction Layer:**
   - Service abstraction para STT (Whisper/Google) e LLM (Claude/GPT/Gemini)
   - Anti vendor lock-in desde MVP
   - Timeout 30s com retry automático
   - Rate limiting awareness por provider

**AI Prompt Strategy Requirements:**

1. **Pipeline Serial de 5 Prompts:**
   - Prompt 1: Análise de Cobertura Curricular (BNCC matching)
   - Prompt 2: Análise Pedagógica Qualitativa (Bloom, metodologias)
   - Prompt 3: Geração de Relatório (usa outputs 1+2)
   - Prompt 4: Geração de Exercícios Contextuais
   - Prompt 5: Detecção de Alertas

2. **Quality Targets:**
   - >90% relatórios utilizáveis sem edição significativa
   - >80% taxa de aprovação
   - <5min tempo de revisão
   - >30 NPS
   - >70% uso contínuo após 30 dias

3. **Pedagogical Foundations:**
   - Taxonomia de Bloom: análise de níveis cognitivos por série
   - Adequação cognitiva: linguagem apropriada por ano escolar
   - Metodologias: expositiva, investigativa, colaborativa, prática

4. **Feedback Loop:**
   - Implicit: Diffs (gerado vs aprovado), tempo de aprovação
   - Explicit: NPS in-context, surveys trimestrais
   - A/B testing: versionamento de prompts, split 50/50
   - Continuous improvement: prompts evoluem com feedback

### FR Coverage Map

**Epic 0: Project Setup & Infrastructure Foundation**
- Architecture Requirements: Starter templates (Vite + NestJS), Docker Compose, BNCC seeding (369 habilidades), CI/CD (GitHub Actions)

**Epic 1: Authentication & Multi-Tenant User Management**
- FR38: Administrador pode cadastrar escolas (tenants)
- FR39: Administrador pode cadastrar usuários por escola
- FR40: Sistema isola dados completamente entre escolas
- FR41: Professor vê apenas seus próprios dados
- FR42: Coordenador vê métricas (sem transcrições) de todos professores
- FR43: Dono vê apenas dados agregados da escola
- FR44: Usuário pode fazer login com email/senha
- FR45: Usuário pode recuperar senha

**Epic 2: Planejamento Bimestral**
- FR1: Professor pode cadastrar planejamento bimestral para suas turmas
- FR2: Professor pode vincular habilidades BNCC ao planejamento
- FR3: Professor pode visualizar lista de habilidades BNCC filtradas por série e disciplina
- FR4: Professor pode editar ou excluir planejamentos existentes
- ~~FR5: Sistema sugere habilidades BNCC baseado no conteúdo digitado~~ (POST-MVP)

**Epic 3: Upload & Captura de Aulas**
- FR6: Professor pode fazer upload de arquivo de áudio da aula
- FR7: Professor pode fazer upload de transcrição pronta (texto)
- FR8: Professor pode digitar resumo manual da aula
- FR9: Professor pode associar upload a uma turma e data específica
- FR10: Sistema aceita múltiplos formatos de áudio (mp3, wav, m4a, webm)
- FR11: Professor pode visualizar status de processamento de suas aulas

**Epic 4: Transcrição Automática (STT)**
- FR12: Sistema transcreve áudio automaticamente via STT
- FR13: Sistema usa provider alternativo quando primário falha
- FR14: Sistema processa transcrições em batch (assíncrono)
- FR15: Sistema notifica professor quando transcrição está pronta
- FR16: Sistema armazena transcrição temporariamente até análise completa

**Epic 5: Análise Pedagógica por IA**
- FR17: Sistema analisa cobertura de habilidades BNCC na transcrição
- FR18: Sistema gera análise qualitativa do conteúdo da aula
- FR19: Sistema identifica evidências literais do conteúdo (não parafraseia)
- FR20: Sistema cruza conteúdo da aula com planejamento bimestral
- FR21: Sistema detecta gaps entre planejamento e execução
- ~~FR22: Sistema gera alertas de turmas atrasadas~~ (POST-MVP)

**Epic 6: Relatórios & Exercícios para Professor**
- FR23: Sistema gera relatório automático da aula
- FR24: Professor pode editar relatório gerado antes de aprovar
- FR25: Professor pode aprovar ou rejeitar relatório
- FR26: Sistema gera exercícios contextuais baseados no conteúdo real
- FR27: Professor pode editar exercícios gerados
- FR28: Sistema gera sugestões para próxima aula
- FR29: Professor pode visualizar % de cobertura curricular própria
- ~~FR30: Professor pode exportar relatórios aprovados~~ (POST-MVP)

**Epic 7: Dashboard de Gestão (Coordenador & Diretor)**
- FR31: Coordenador pode visualizar métricas de cobertura por professor
- FR32: Coordenador pode visualizar métricas de cobertura por turma
- FR33: Coordenador pode identificar turmas com atraso curricular
- FR34: Dono pode visualizar métricas agregadas da escola
- FR35: Dono pode visualizar % de cobertura curricular geral
- FR36: Sistema calcula cobertura bimestral como métrica materializada
- FR37: Coordenador NÃO pode acessar transcrições brutas

**Epic 8: Administração & Monitoramento Interno**
- FR46: Admin interno pode monitorar taxa de erro de STT
- FR47: Admin interno pode monitorar tempo de processamento
- FR48: Admin interno pode monitorar fila de análises pendentes
- FR49: Admin interno pode monitorar custos de API por escola
- FR50: Admin interno pode identificar prompts com baixa taxa de aprovação

**Summary:**
- **Total FRs in MVP:** 47 FRs
- **Post-MVP FRs:** FR5, FR22, FR30 (3 FRs)
- **Coverage:** 100% of MVP scope

## Epic List

### Epic 0: Project Setup & Infrastructure Foundation

**Goal:** Estabelecer base técnica completa (repositórios, CI/CD, database, seeding BNCC) para todos os épicos seguintes funcionarem. Time de desenvolvimento tem ambiente de trabalho pronto para implementar features de negócio.

**User Outcome:** Desenvolvedores podem começar a implementar features de valor imediatamente, sem se preocupar com setup de infra.

**FRs covered:** (Implicit - Architecture requirements)

**Key Deliverables:**
- Frontend repo: Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui configurado
- Backend repo: NestJS (strict mode) + Prisma + Bull queue + Redis
- Docker Compose: PostgreSQL 14+ + Redis 7 + MinIO (S3-compatible storage)
- Database schema: Prisma migrations + 32 entidades (4 domínios)
- BNCC Seeding: 369 habilidades (Matemática: 121, LP: ~185, Ciências: 63) via JSON + seed script idempotente
- CI/CD: GitHub Actions (lint + test em PRs)
- Environment management: .env templates + .env.example

**Technical Notes:**
- Starter commands: `npm create vite@latest ressoa-frontend -- --template react-ts` + `nest new ressoa-backend --strict`
- Multi-tenancy setup: PostgreSQL RLS policies + escola_id em todas tabelas
- Materialized view: `cobertura_bimestral` (usado no Epic 7)

---

### Epic 1: Authentication & Multi-Tenant User Management

**Goal:** Usuários de múltiplas escolas podem fazer login de forma segura, com isolamento completo de dados entre tenants e permissões granulares por role.

**User Outcome:** Professor, Coordenador e Diretor autenticam com email/senha, acessam apenas dados de sua escola, e sistema garante privacidade entre escolas.

**FRs covered:** FR38, FR39, FR40, FR41, FR42, FR43, FR44, FR45

**Key Deliverables:**
- Login/Logout com JWT (access token 15min + refresh token 7d armazenado em Redis)
- Password hashing com bcrypt (10 salt rounds)
- Multi-tenancy isolation via PostgreSQL RLS + Prisma middleware (escola_id injetado automaticamente)
- RBAC com 3 roles: Professor (CRUD próprio), Coordenador (view métricas agregadas, SEM transcrições), Diretor (view dados consolidados)
- Password recovery flow (email com token temporário)
- Admin CRUD de escolas e usuários (internal tool)
- Rate limiting: @nestjs/throttler com Redis storage (5 tentativas login/min)

**Technical Notes:**
- NestJS Passport + JWT Strategy
- CORS restrito via .env (origens configuráveis por ambiente)
- Refresh token rotation (gerar novo a cada uso, prevenir replay attacks)
- Session management: Redis TTL = 7 dias (auto-expire)

**NFRs addressed:**
- NFR-SEC-01: TLS 1.2+ (HTTPS obrigatório)
- NFR-SEC-03: Multi-tenant isolation (RLS)
- NFR-SEC-06: bcrypt + JWT
- NFR-SEC-08: LGPD compliance (consentimento, soft delete, audit trail)

---

### Epic 2: Planejamento Bimestral

**Goal:** Professor cadastra planejamento do bimestre, vinculando habilidades BNCC por turma, criando base para futuras análises de cobertura curricular.

**User Outcome:** Professor define expectativas curriculares (habilidades que planeja ensinar), e pode consultar/editar planejamentos a qualquer momento.

**FRs covered:** FR1, FR2, FR3, FR4

**Key Deliverables:**
- CRUD de planejamentos (bimestre 1-4, ano letivo, turma, disciplina)
- Seletor de habilidades BNCC com filtros multi-nível:
  - Por disciplina (Matemática, LP, Ciências)
  - Por série (6º-9º ano)
  - Por unidade temática (ex: Álgebra, Geometria)
  - Busca/autocomplete ("equações" → mostra EF07MA18, EF07MA17...)
- Validações de negócio:
  - RN-PLAN-01: Planejamento não validado gera flag visível para coordenação (não bloqueia professor)
  - RN-PLAN-02: Pesos não informados = distribuição igual entre habilidades
  - RN-PLAN-03: Aulas previstas não informadas = estimativa automática baseada em carga horária
  - RN-PLAN-04: Nível 1 (bimestral) é suficiente, Nível 2 (objetivos por aula) é opcional
- UI: Form wizard multi-step (shadcn/ui), drag-and-drop de habilidades, visualização de planejamento anterior (copiar do bimestre passado)

**Technical Notes:**
- Relacionamento N:N: `Planejamento` ↔ `PlanejamentoHabilidade` ↔ `Habilidade`
- Língua Portuguesa: Blocos compartilhados (EF67LP aplica a 6º E 7º ano) - relacionamento N:N também entre Habilidade ↔ Ano
- Prisma queries com `include` para pré-carregar habilidades
- Cache Redis: Lista de habilidades (TTL 7 dias, estático)

**NFRs addressed:**
- NFR-ACCESS-02: Navegação por teclado (form acessível)
- NFR-ACCESS-04: Mobile-friendly (professor pode consultar planejamento no celular)

---

### Epic 3: Upload & Captura de Aulas

**Goal:** Professor captura conteúdo de aulas de múltiplas formas (áudio, transcrição pronta, texto manual) com interface confiável, resumível e adaptada a conexões instáveis.

**User Outcome:** Professor faz upload sem fricção, usando o método que preferir, e sistema garante que upload não falha mesmo em conexões 3G/4G ruins.

**FRs covered:** FR6, FR7, FR8, FR9, FR10, FR11

**Key Deliverables:**
- Upload de áudio via TUS Protocol (resumível, chunks 5MB):
  - Drag-and-drop com preview do arquivo
  - Progress bar visual: "Enviando 45% → Aguardando transcrição"
  - Validação de formato ANTES de enviar (mp3, wav, m4a, webm)
  - Tamanho máximo: 2GB (aula de 50min ≈ 25-50MB comprimido)
- Upload de transcrição pronta (texto):
  - Textarea com contador de caracteres
  - Preview antes de confirmar
- Digitação manual de resumo:
  - Form simples (3-5 parágrafos)
  - Flag "RESUMO_MANUAL" (confiança menor)
- Associação obrigatória: turma + data da aula
- Status de processamento:
  - Estados: CRIADA → UPLOAD_PROGRESSO → AGUARDANDO_TRANSCRICAO → TRANSCRITA → ANALISANDO → COMPLETA
  - Polling frontend (React Query com refetchInterval) ou WebSocket (opcional)
- Integrações futuras (post-MVP): Import de Read.ai, Zoom, Google Meet (OAuth)

**Technical Notes:**
- Backend: TUS server (tus-node-server ou implementação custom com NestJS)
- Storage: S3 multipart upload (dev: MinIO local, prod: AWS S3 ou Cloudflare R2)
- Cleanup: Uploads abandonados após 24h (Bull job scheduled)
- Bull queue: Job `process-aula` criado após upload completo

**NFRs addressed:**
- NFR-PERF-05: Upload 100MB < 30s (limitado por conexão do usuário)
- NFR-ACCESS-04: Mobile-friendly (upload via celular, touch targets 44px)
- NFR-RELIAB-04: Fila persistente (Bull + Redis, sobrevive restart)

---

### Epic 4: Transcrição Automática (STT)

**Goal:** Áudios são convertidos em texto de forma confiável, rápida e com custo otimizado, usando múltiplos providers para garantir resiliência.

**User Outcome:** Professor recebe transcrição automaticamente em ~5 minutos, sem precisar fazer nada manualmente, e sistema nunca falha completamente (failover automático).

**FRs covered:** FR12, FR13, FR14, FR15, FR16

**Key Deliverables:**
- STT Multi-Provider com failover automático:
  - **Primário:** OpenAI Whisper large-v3 ($0.36/hora, qualidade ⭐⭐⭐⭐⭐, português nativo)
  - **Fallback:** Google Speech-to-Text enhanced ($1.44/hora)
  - Lógica: Whisper falha (timeout, rate limit, erro 5xx) → retry 1x → Google
- Service abstraction layer (`STTService` com interface comum):
  - `transcribe(audioFile, language): Promise<Transcription>`
  - Configuração via .env: `STT_PRIMARY_PROVIDER=whisper`, `STT_FALLBACK_PROVIDER=google`
- Batch processing assíncrono:
  - Bull queue: Job `transcribe-aula` com retry 3x (exponential backoff)
  - Workers escaláveis (horizontal scaling, múltiplas instâncias)
  - Priority queue: P1 (pilotos) > P2 (regular) > P3 (reprocessamento)
- Notificações quando transcrição pronta:
  - In-app notification (badge "Nova transcrição pronta")
  - Email opcional (configurável por usuário)
- Retenção temporária:
  - Transcrição armazenada por 7 dias (TTL)
  - Deletar automaticamente após análise completa (Epic 5) + 24h buffer
  - Áudio deletado IMEDIATAMENTE após transcrição (não armazenar permanentemente)

**Technical Notes:**
- OpenAI Whisper API: `POST https://api.openai.com/v1/audio/transcriptions`
- Google Speech-to-Text: `POST https://speech.googleapis.com/v1/speech:recognize`
- Rate limiting awareness: Whisper = 50 RPM (gargalo em escala), Google = 1000 RPM
- Cost tracking: Log cada chamada com `{ escola_id, provider, duration, cost }`

**NFRs addressed:**
- NFR-PERF-01: Transcrição 50min < 5 minutos (Whisper processa em ~2-3min, Google em ~1-2min)
- NFR-INTEG-01: Failover automático Whisper → Google
- NFR-INTEG-03: Timeout 30s com retry
- NFR-SCALE-05: Custo <R$0,75/aula (Whisper = R$1,80, Google = R$7,20 - média R$2,40 com 80% Whisper)

---

### Epic 5: Análise Pedagógica por IA

**Goal:** Sistema cruza transcrição com planejamento e BNCC, gerando análise pedagógica profunda (cobertura curricular, gaps, evidências literais) usando pipeline de 5 prompts especializados.

**User Outcome:** Professor recebe insights objetivos sobre o que foi coberto e onde há lacunas, com evidências textuais transparentes ("aqui está O QUE você disse que justifica esta classificação").

**FRs covered:** FR17, FR18, FR19, FR20, FR21

**Key Deliverables:**
- **Pipeline serial de 5 prompts especializados:**
  1. **Prompt 1 - Análise de Cobertura Curricular:** Cruza transcrição com habilidades BNCC do planejamento, classifica cada habilidade (COMPLETE, PARTIAL, MENTIONED, NOT_COVERED), extrai evidências literais
  2. **Prompt 2 - Análise Pedagógica Qualitativa:** Identifica níveis de Bloom, metodologias usadas, adequação cognitiva por série, sinais de engajamento/dificuldade
  3. **Prompt 3 - Geração de Relatório:** Usa outputs 1+2 para gerar relatório narrativo estruturado (formato configurável)
  4. **Prompt 4 - Geração de Exercícios Contextuais:** Cria 3-5 exercícios baseados no conteúdo REAL da aula (não genéricos), adequados à série
  5. **Prompt 5 - Detecção de Alertas:** Identifica gaps críticos, turmas atrasadas, sinais de dificuldade (INFO, WARNING, CRITICAL)
- LLM Multi-Provider:
  - **Análise (Prompts 1-3):** Claude 4.6 Sonnet (~$0.10/aula, contexto 200k, raciocínio pedagógico superior)
  - **Exercícios (Prompt 4):** GPT-4.6 mini (~$0.02/aula, custo 20x menor, tarefa mais simples)
  - **Fallback:** Gemini 1.5 Pro (custo intermediário, contexto 2M)
- Cruzamento com planejamento:
  - Query Prisma: `planejamento.habilidades` (pré-carregar todas habilidades vinculadas)
  - Comparar transcrição vs expectativa (o que foi planejado vs o que foi executado)
- Detecção de gaps:
  - RN-COV-01: Fórmula de cobertura com pesos (COMPLETE=100%, PARTIAL=50%, MENTIONED=25%, NOT_COVERED=0%)
  - RN-COV-02: Classificação cumulativa ao longo do bimestre (habilidade pode ser reclassificada em aulas futuras)
  - RN-COV-03: IA DEVE fornecer justificativa textual citando trechos da transcrição
- Evidências literais:
  - Armazenar trechos exatos da transcrição (JSON: `{ habilidade_id, nivel_cobertura, evidencia_texto, timestamp? }`)
  - UI: Clicar em "EF07MA18 - Coberta" → mostra trecho correspondente da transcrição em highlight

**Technical Notes:**
- Service abstraction: `LLMService` com providers (Claude, GPT, Gemini)
- Prompt versionamento: Armazenar versão do prompt no DB (`analise.prompt_version = "v1.2.3"`)
- A/B testing: Split 50/50 de versões de prompts para melhoria contínua
- Bull queue: Job `analyze-aula` (dependente de `transcribe-aula`)
- Cost optimization: Caching de análises repetidas (improvável, mas possível)

**NFRs addressed:**
- NFR-PERF-02: Análise pedagógica < 60s (pipeline serial, ~10-15s por prompt)
- NFR-PERF-03: Relatório + exercícios < 40s (Prompt 3+4 em paralelo)
- NFR-INTEG-02: Multi-provider LLM (Claude/GPT/Gemini)
- NFR-SCALE-05: Custo <R$0,75/aula (Claude ~$0.10 + GPT mini ~$0.02 = ~$0.12 ≈ R$0,60)

**Business Rules:**
- RN-COV-01, RN-COV-02, RN-COV-03 (cobertura)
- RN-QUAL-01, RN-QUAL-02 (qualidade de relatórios)
- RN-ENG-01, RN-ENG-02 (engajamento - opcional no MVP)

---

### Epic 6: Relatórios & Exercícios para Professor

**Goal:** Professor visualiza relatório pedagógico gerado pela IA, pode editar/aprovar, recebe exercícios contextuais e sugestões para próxima aula, economizando 2-3h/semana.

**User Outcome:** Professor tem controle editorial completo (workflow de aprovação), relatório só fica visível para coordenação APÓS aprovação, e recebe outputs acionáveis (exercícios + sugestões).

**FRs covered:** FR23, FR24, FR25, FR26, FR27, FR28, FR29

**Key Deliverables:**
- **Visualização de relatório:**
  - Layout: Sidebar com transcrição completa (transparência) + Main area com relatório gerado
  - Highlights clicáveis: Clicar em habilidade no relatório → trecho correspondente na transcrição fica amarelo
  - Score de confiança: "Confiança: 92%" (baseado em qualidade da transcrição + completude da análise)
- **Editor inline:**
  - Rich text editor (TipTap ou Quill.js integrado com shadcn/ui)
  - Diff visual: Texto gerado pela IA em uma cor, edições do professor em outra
  - Undo/redo
  - Auto-save (salvar rascunho a cada 30s)
- **Workflow de aprovação:**
  - Estados: RASCUNHO → EM_REVISAO → APROVADO / REJEITADO
  - Botões: "Aprovar" (1 clique), "Rejeitar e Editar", "Salvar Rascunho"
  - Badge visual: "Privado até você aprovar" (tranquiliza professor sobre privacidade)
  - Apenas relatórios APROVADOS ficam visíveis para coordenação (FR37)
- **Exercícios contextuais:**
  - 3-5 exercícios gerados do conteúdo REAL da aula (não genéricos)
  - Editáveis (professor pode ajustar enunciado, gabarito)
  - Adequação por série (Bloom Taxonomy)
  - Exportação: PDF ou copiar/colar (post-MVP: integração Classroom/Moodle)
- **Sugestões para próxima aula:**
  - Priorização: P0 (reforço) > P1 (avanço) > P2 (complementar)
  - Máximo 3 sugestões (RN-SUG-02: evitar sobrecarga)
  - Linguagem neutra: "Considere reforçar X" (não prescreve metodologia - RN-SUG-03)
  - Baseado em gaps detectados (RN-SUG-01)
- **Dashboard pessoal:**
  - % cobertura curricular por turma/bimestre (gráficos de pizza, progress bars)
  - Habilidades cobertas vs planejadas (lista com status: ✅ Coberta, ⚠️ Parcial, ❌ Não coberta)
  - Evolução ao longo do tempo (gráfico de linha)

**Technical Notes:**
- React Hook Form + zod para formulários
- React Query para fetching/mutation de relatórios
- Zustand store: `useAulaStore` (estado de edição, upload progress)
- shadcn/ui: Dialog (modal de aprovação), Toast (feedback de ações), Badge, Progress
- Materialized view (próximo épico): `cobertura_bimestral` para dashboard

**NFRs addressed:**
- NFR-ACCESS-01: WCAG AAA (contraste 14.8:1, keyboard nav)
- NFR-ACCESS-02: Navegação por teclado (atalhos: Ctrl+Enter = aprovar)
- NFR-ACCESS-05: Mensagens claras ("Relatório aprovado! Agora está visível para coordenação")

**Business Rules:**
- RN-SUG-01 a RN-SUG-05 (sugestões)
- RN-QUAL-01, RN-QUAL-02 (qualidade)

---

### Epic 7: Dashboard de Gestão (Coordenador & Diretor)

**Goal:** Coordenador visualiza métricas agregadas de cobertura curricular (SEM acesso a transcrições brutas), e Diretor vê visão executiva consolidada da escola.

**User Outcome:** Gestão tem dados objetivos para conversas pedagógicas e tomada de decisão estratégica, sem microgerenciar professores ou invadir privacidade.

**FRs covered:** FR31, FR32, FR33, FR34, FR35, FR36, FR37

**Key Deliverables:**
- **Dashboard Coordenador:**
  - Métricas por professor: % cobertura curricular, aulas registradas, taxa de aprovação de relatórios
  - Métricas por turma: % cobertura por disciplina, habilidades atrasadas, comparação com planejamento
  - Alertas de atraso curricular: Turmas <60% cobertura (manual no MVP, automático post-MVP)
  - Filtros: Por professor, turma, disciplina, bimestre, ano letivo
  - **Permissões críticas:** Coordenador vê apenas relatórios APROVADOS, NUNCA transcrições brutas (FR37)
  - UI: Heat map (cobertura por turma), tabelas ordenáveis, gráficos de barra (Recharts)
- **Dashboard Diretor:**
  - Visão executiva consolidada: % cobertura geral da escola, aulas registradas totais, professores ativos
  - Métricas agregadas: Não vê detalhes por professor (apenas totais)
  - Exportação: Relatório mensal em PDF (post-MVP)
- **Materialized View:**
  - `cobertura_bimestral`: View materializada calculando % cobertura por turma/bimestre/disciplina
  - Refresh strategy: Bull job diário (3h AM) + trigger manual após aprovação de aula
  - Query: `SELECT * FROM cobertura_bimestral WHERE escola_id = ? AND bimestre = ?` (< 2s)
- **Visualizações:**
  - Progress bars (% cobertura por turma)
  - Heat maps (cobertura por habilidade, cor = intensidade)
  - Gráficos de linha (evolução ao longo do bimestre)
  - Tabelas ordenáveis (shadcn/ui Table + TanStack Table)

**Technical Notes:**
- PostgreSQL Materialized View: `CREATE MATERIALIZED VIEW cobertura_bimestral AS SELECT ...`
- Refresh: `REFRESH MATERIALIZED VIEW CONCURRENTLY cobertura_bimestral` (não bloqueia leituras)
- Index: `CREATE UNIQUE INDEX idx_cobertura_bimestral ON cobertura_bimestral (escola_id, turma_id, bimestre, ano_letivo)`
- Redis cache: Dashboard metrics (TTL 15min)
- Recharts para gráficos (responsive, acessível)

**NFRs addressed:**
- NFR-PERF-04: Dashboard < 2s (materialized view + Redis cache)
- NFR-SEC-03: Multi-tenant isolation (coordenador vê apenas sua escola)
- NFR-SEC-07: Logs de acesso (audit trail de quem viu quais métricas)

**Business Rules:**
- RN-ALERT-01: Alertas CRITICAL consolidados semanalmente (não real-time)
- RN-ALERT-03: Coordenador NÃO recebe transcrições brutas

---

### Epic 8: Administração & Monitoramento Interno

**Goal:** Time interno monitora saúde operacional do sistema (erros, filas, custos de API por escola, taxa de aprovação de prompts) para garantir qualidade e viabilidade financeira.

**User Outcome:** Time detecta problemas proativamente (STT falhando, custos disparando, prompts com baixa aprovação) e garante que custos de IA fiquem <40% da receita.

**FRs covered:** FR46, FR47, FR48, FR49, FR50

**Key Deliverables:**
- **Dashboard operacional interno:**
  - Taxa de erro STT por provider (Whisper vs Google)
  - Tempo médio de processamento (transcrição + análise)
  - Fila de análises pendentes (Bull queue metrics)
  - Custos de API por escola (STT + LLM, ranking por consumo)
  - Taxa de aprovação de relatórios por professor/escola
  - Taxa de aprovação por versão de prompt (A/B testing)
- **Sentry para error tracking:**
  - Frontend: Captura erros React (error boundaries)
  - Backend: Captura exceções NestJS (exception filters)
  - Alertas: Email/Slack quando error rate >5%
  - Free tier: 5k eventos/mês (suficiente para MVP com 5-10 escolas)
- **Pino logger estruturado:**
  - JSON logs: `{ timestamp, level, message, context: { escola_id, user_id, ... } }`
  - Log de chamadas de API: `{ provider, model, tokens_input, tokens_output, cost, duration }`
  - Níveis: error, warn, info, debug
- **Bull dashboard:**
  - UI builtin: `bull-board` (visualização de jobs, retry, remove)
  - Métricas: Jobs completed, failed, active, waiting, delayed
  - Retry manual: Admin pode forçar retry de job falhado
- **Cost tracking:**
  - Tabela: `api_call_log` (id, escola_id, provider, model, tokens, cost, timestamp)
  - Query: `SELECT escola_id, SUM(cost) FROM api_call_log WHERE timestamp > '2026-02-01' GROUP BY escola_id`
  - Alert: Email se escola ultrapassar R$100/mês (2x do esperado)
- **Prompt quality tracking:**
  - Taxa de aprovação por versão de prompt: `SELECT prompt_version, COUNT(*) AS total, SUM(CASE WHEN status='APROVADO' THEN 1 ELSE 0 END) AS aprovados`
  - A/B testing: Comparar taxa de aprovação entre versões (ex: v1.2.0 vs v1.3.0)
  - Identificar prompts com <80% aprovação → revisar

**Technical Notes:**
- Sentry SDK: `@sentry/node` (backend) + `@sentry/react` (frontend)
- Pino: `import pino from 'pino'`, `logger.info({ escola_id, ... }, 'Message')`
- Bull Board: `@bull-board/express` + `@bull-board/api`
- Cost tracking: Bull job `log-api-cost` após cada chamada STT/LLM

**NFRs addressed:**
- NFR-RELIAB-05: Alertar admin se >5% falhas em 1h
- NFR-SCALE-05: Custo <R$0,75/aula monitored in real-time

**Business Rules:**
- RN-QUAL-02: Taxa de aprovação <60% por 2 semanas → alerta interno
- RN-GAME-03: Flags de gaming (padrão recorrente 3/4 semanas)

---

## Epic 0: Project Setup & Infrastructure Foundation

**Goal:** Estabelecer base técnica completa (repositórios, CI/CD, database, seeding BNCC) para todos os épicos seguintes funcionarem. Time de desenvolvimento tem ambiente de trabalho pronto para implementar features de negócio.

### Story 0.1: Initialize Frontend Project with Design System

As a **desenvolvedor**,
I want **um projeto frontend configurado com React 18, TypeScript, Tailwind CSS e shadcn/ui**,
So that **posso começar a implementar features de negócio imediatamente sem me preocupar com setup inicial**.

**Acceptance Criteria:**

**Given** o repositório frontend não existe
**When** executo o comando `npm create vite@latest ressoa-frontend -- --template react-ts`
**Then** o projeto React 18 + TypeScript é criado com estrutura padrão Vite

**Given** o projeto Vite foi criado
**When** executo os passos de configuração do Tailwind CSS:
- `npm install -D tailwindcss postcss autoprefixer`
- `npx tailwindcss init -p`
- Configuro `tailwind.config.js` com paths corretos
- Adiciono diretivas Tailwind no `index.css`
**Then** Tailwind CSS está funcional e classes utilitárias funcionam nos componentes

**Given** Tailwind CSS está configurado
**When** executo os passos de configuração do shadcn/ui:
- Configuro path aliases em `tsconfig.json` e `tsconfig.app.json` (`@/*`)
- Configuro `vite.config.ts` com path resolution
- Executo `npx shadcn@latest init`
- Seleciono theme: Default, CSS variables: Yes, Color: Deep Navy (#0A2647)
**Then** shadcn/ui está instalado e componentes podem ser adicionados via CLI

**Given** shadcn/ui está configurado
**When** adiciono componentes base essenciais:
- `npx shadcn@latest add button`
- `npx shadcn@latest add input`
- `npx shadcn@latest add toast`
**Then** os componentes estão em `src/components/ui/` e podem ser importados

**Given** a estrutura básica está pronta
**When** crio estrutura de pastas:
```
src/
├── components/
│   └── ui/          # shadcn/ui components
├── lib/             # utils
├── hooks/           # custom hooks
├── pages/           # route pages
├── App.tsx
└── main.tsx
```
**Then** a estrutura está pronta para desenvolvimento

**Given** todas configurações estão completas
**When** executo `npm run dev`
**Then** o servidor de desenvolvimento inicia em `http://localhost:5173` sem erros

**And** uma página inicial simples renderiza com título "Ressoa AI" usando tipografia Montserrat (headers) e componentes shadcn/ui

---

### Story 0.2: Initialize Backend Project with Core Dependencies

As a **desenvolvedor**,
I want **um projeto backend NestJS configurado com Prisma, Bull queue e Redis**,
So that **posso implementar APIs REST com processamento assíncrono e acesso ao banco de dados**.

**Acceptance Criteria:**

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

### Story 0.3: Setup Development Environment with Docker Compose

As a **desenvolvedor**,
I want **um ambiente de desenvolvimento local com PostgreSQL, Redis e MinIO via Docker Compose**,
So that **posso desenvolver localmente sem instalar dependências no meu sistema operacional**.

**Acceptance Criteria:**

**Given** Docker e Docker Compose estão instalados no sistema
**When** crio arquivo `docker-compose.yml` na raiz do projeto com serviços:
- **postgres:** PostgreSQL 14-alpine, porta 5432, volume persistente
- **redis:** Redis 7-alpine, porta 6379
- **minio:** MinIO (S3-compatible), portas 9000 (API) e 9001 (Console)
**Then** o arquivo está válido e pode ser executado

**Given** o `docker-compose.yml` está criado
**When** adiciono configurações de ambiente:
- PostgreSQL: `POSTGRES_DB=ressoa_dev`, `POSTGRES_USER=ressoa`, `POSTGRES_PASSWORD=dev_password`
- MinIO: `MINIO_ROOT_USER=minioadmin`, `MINIO_ROOT_PASSWORD=minioadmin`
**Then** as variáveis de ambiente estão configuradas

**Given** as configurações estão definidas
**When** crio arquivo `.env.example` na raiz com template:
```
DATABASE_URL=postgresql://ressoa:dev_password@localhost:5432/ressoa_dev
REDIS_URL=redis://localhost:6379
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
JWT_SECRET=your-secret-here-min-32-chars
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
CORS_ORIGIN=http://localhost:5173
```
**Then** o template está disponível para desenvolvedores copiarem para `.env`

**Given** o Docker Compose e `.env.example` estão prontos
**When** crio scripts no `package.json` do backend:
- `"docker:up": "docker-compose up -d"`
- `"docker:down": "docker-compose down"`
- `"docker:logs": "docker-compose logs -f"`
**Then** os scripts facilitam gerenciamento do ambiente

**Given** todos arquivos estão configurados
**When** executo `npm run docker:up`
**Then** os 3 containers (postgres, redis, minio) iniciam sem erros

**And** posso conectar ao PostgreSQL via `psql -h localhost -U ressoa -d ressoa_dev`

**And** posso conectar ao Redis via `redis-cli`

**And** posso acessar MinIO Console em `http://localhost:9001`

---

### Story 0.4: BNCC Curriculum Data Seeding

As a **desenvolvedor**,
I want **as entidades do currículo BNCC criadas e populadas com 369 habilidades**,
So that **todas as features podem referenciar habilidades do currículo nacional brasileiro**.

**Acceptance Criteria:**

**Given** Prisma está inicializado
**When** defino o schema Prisma INICIAL em `prisma/schema.prisma` com APENAS entidades de currículo:
```prisma
// Domínio Currículo - BNCC (Base Nacional Comum Curricular)
model Disciplina {
  id          String   @id @default(uuid())
  codigo      String   @unique // "MATEMATICA", "LINGUA_PORTUGUESA", "CIENCIAS"
  nome        String   // "Matemática", "Língua Portuguesa", "Ciências"
  created_at  DateTime @default(now())
}

model Ano {
  id          String   @id @default(uuid())
  codigo      String   @unique // "6_ANO", "7_ANO", "8_ANO", "9_ANO"
  nome        String   // "6º Ano", "7º Ano", etc.
  ordem       Int      // 6, 7, 8, 9
  created_at  DateTime @default(now())
}

model Habilidade {
  id                   String   @id @default(uuid())
  codigo               String   @unique // "EF06MA01", "EF67LP03", etc.
  descricao            String   @db.Text
  disciplina           String   // "MATEMATICA", "LINGUA_PORTUGUESA", "CIENCIAS"
  ano_inicio           Int      // 6, 7, 8, 9
  ano_fim              Int?     // Para blocos compartilhados (EF67LP = 6-7, EF69LP = 6-9)
  unidade_tematica     String?  // "Números", "Álgebra", etc.
  objeto_conhecimento  String?  @db.Text
  created_at           DateTime @default(now())

  @@index([disciplina, ano_inicio])
  @@index([codigo])
}

model HabilidadeAno {
  id             String   @id @default(uuid())
  habilidade_id  String
  habilidade     Habilidade @relation(fields: [habilidade_id], references: [id], onDelete: Cascade)
  ano_id         String
  ano            Ano @relation(fields: [ano_id], references: [id], onDelete: Cascade)

  @@unique([habilidade_id, ano_id])
}
```
**Then** o schema define as 4 entidades de currículo necessárias para BNCC

**Given** o schema está definido
**When** executo `npx prisma migrate dev --name create_bncc_tables`
**Then** a migration é criada em `prisma/migrations/` e aplicada ao banco

**And** o Prisma Client é gerado automaticamente em `node_modules/@prisma/client`

**Given** as migrations estão aplicadas
**When** crio arquivos JSON com dados BNCC em `prisma/seeds/bncc/`:
- `matematica-6ano.json` (30 habilidades)
- `matematica-7ano.json` (30 habilidades)
- `matematica-8ano.json` (31 habilidades)
- `matematica-9ano.json` (30 habilidades)
- `ciencias-6ano.json` (~16 habilidades)
- `ciencias-7ano.json` (~16 habilidades)
- `ciencias-8ano.json` (~16 habilidades)
- `ciencias-9ano.json` (~15 habilidades)
- `lingua-portuguesa-6-9ano.json` (~185 habilidades, incluindo blocos compartilhados EF67LP, EF69LP, EF89LP)
**Then** os arquivos JSON contêm os 369 habilidades estruturadas com: `codigo`, `descricao`, `disciplina`, `ano_inicio`, `ano_fim`, `unidade_tematica`, `objeto_conhecimento`

**Given** os arquivos JSON estão prontos
**When** crio script `prisma/seed.ts` que:
- Lê todos arquivos JSON de `prisma/seeds/bncc/`
- Para cada habilidade, executa `prisma.habilidade.upsert({ where: { codigo }, update: {...}, create: {...} })`
- Cria relacionamentos N:N com Anos (via HabilidadeAno)
- É idempotente (pode ser executado múltiplas vezes sem duplicar dados)
**Then** o seed script está funcional

**Given** o seed script está criado
**When** adiciono no `package.json`:
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```
**Then** o Prisma reconhece o seed script

**Given** tudo está configurado
**When** executo `npx prisma migrate reset` (dropa DB, reaplica migrations, roda seed)
**Then** o banco é populado com 369 habilidades BNCC

**And** posso consultar `SELECT COUNT(*) FROM Habilidade` e retorna 369

**And** posso consultar habilidades por disciplina: `SELECT * FROM Habilidade WHERE disciplina = 'MATEMATICA'` retorna 121

---

### Story 0.5: CI/CD Pipeline Setup

As a **desenvolvedor**,
I want **pipelines de CI/CD configurados no GitHub Actions para validar PRs e fazer deploy automático**,
So that **código quebrado não entra na base e deploys são automatizados**.

**Acceptance Criteria:**

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

**Epic 0 COMPLETO!** ✅

**Resumo:**
- 5 stories criadas
- Setup completo: Frontend (React + Tailwind + shadcn/ui) + Backend (NestJS + Prisma + Bull) + Docker + Database (32 entidades + 369 habilidades BNCC) + CI/CD
- Base técnica pronta para Epic 1

---

## Epic 1: Authentication & Multi-Tenant User Management

**Goal:** Usuários de múltiplas escolas podem fazer login de forma segura, com isolamento completo de dados entre tenants e permissões granulares por role (Professor/Coordenador/Diretor).

### Story 1.1: Backend Auth Foundation (Passport + JWT + Refresh Tokens)

As a **desenvolvedor**,
I want **uma infraestrutura de autenticação com Passport, JWT e refresh tokens no Redis**,
So that **posso implementar login seguro com tokens de curta duração e renovação automática**.

**Acceptance Criteria:**

**DATABASE SETUP:**

**Given** preciso armazenar dados de autenticação e multi-tenancy
**When** crio migration Prisma com 3 entidades de autenticação:
```prisma
// schema.prisma

enum RoleUsuario {
  PROFESSOR
  COORDENADOR
  DIRETOR
}

model Escola {
  id         String   @id @default(uuid())
  nome       String
  cnpj       String?  @unique
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  // Relations
  usuarios   Usuario[]

  @@map("escola")
}

model Usuario {
  id          String   @id @default(uuid())
  nome        String
  email       String   @unique
  senha_hash  String
  escola_id   String
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  // Relations
  escola          Escola         @relation(fields: [escola_id], references: [id], onDelete: Cascade)
  perfil_usuario  PerfilUsuario?

  @@index([escola_id])
  @@index([email])
  @@map("usuario")
}

model PerfilUsuario {
  id         String       @id @default(uuid())
  usuario_id String       @unique
  role       RoleUsuario  @default(PROFESSOR)
  created_at DateTime     @default(now())
  updated_at DateTime     @updatedAt

  // Relations
  usuario    Usuario      @relation(fields: [usuario_id], references: [id], onDelete: Cascade)

  @@index([usuario_id])
  @@map("perfil_usuario")
}
```
**Then** executo `npx prisma migrate dev --name create_auth_tables`

**And** o banco de dados possui 3 tabelas: `escola`, `usuario`, `perfil_usuario`

**And** multi-tenancy está garantido via `escola_id` em `Usuario`

**AUTH MODULE SETUP:**

**Given** as dependências de auth estão instaladas (`@nestjs/passport`, `passport-jwt`, `@nestjs/jwt`, `bcrypt`)
**When** crio módulo `AuthModule` em `src/modules/auth/`
**Then** o módulo está estruturado com: `auth.controller.ts`, `auth.service.ts`, `auth.module.ts`, `jwt.strategy.ts`

**Given** o módulo está criado
**When** configuro `JwtModule` no `AuthModule` com:
- Secret: `process.env.JWT_SECRET` (min 32 chars)
- Access token expiration: `'15m'`
**Then** o JwtModule está registrado e pode gerar tokens

**Given** o JwtModule está configurado
**When** crio `JwtStrategy` que estende `PassportStrategy`:
- Extrai token do header `Authorization: Bearer <token>`
- Valida assinatura usando `JWT_SECRET`
- Retorna payload: `{ userId, escolaId, role, email }`
**Then** a estratégia JWT está funcional

**Given** a estratégia JWT está criada
**When** crio `AuthService` com método `hashPassword(plainPassword: string): Promise<string>`:
- Usa `bcrypt.hash(plainPassword, 10)` (10 salt rounds)
- Retorna hash seguro
**Then** senhas podem ser hasheadas

**Given** o método de hash existe
**When** crio método `comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean>`:
- Usa `bcrypt.compare(plainPassword, hashedPassword)`
- Retorna `true` se match, `false` caso contrário
**Then** senhas podem ser validadas

**Given** os métodos de senha existem
**When** crio método `generateTokens(user: Usuario): Promise<{ accessToken: string, refreshToken: string }>`:
- Access token: JWT com payload `{ sub: user.id, escolaId: user.escola_id, role: user.perfil_usuario.role, email: user.email }`, expira em 15min
- Refresh token: UUID v4, armazenado no Redis com key `refresh_token:${user.id}:${tokenId}`, TTL 7 dias
- Retorna ambos tokens
**Then** tokens podem ser gerados

**Given** o método generateTokens existe
**When** crio método `validateRefreshToken(refreshToken: string): Promise<Usuario | null>`:
- Busca token no Redis
- Se existe, retorna usuário associado
- Se não existe ou expirou, retorna `null`
**Then** refresh tokens podem ser validados

**Given** todos métodos estão implementados
**When** crio `JwtAuthGuard` que estende `AuthGuard('jwt')`:
- Protege rotas com `@UseGuards(JwtAuthGuard)`
- Injeta usuário autenticado no request: `request.user`
**Then** o guard está funcional

**Given** o guard está criado
**When** crio decorator `@CurrentUser()` para extrair `request.user`:
```typescript
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```
**Then** o decorator facilita acesso ao usuário autenticado

**Given** toda infraestrutura está pronta
**When** executo testes unitários do `AuthService`:
- `hashPassword` gera hashes diferentes para mesma senha (salt aleatório)
- `comparePassword` valida senha correta
- `comparePassword` rejeita senha incorreta
- `generateTokens` retorna access token válido (pode ser decoded)
- `generateTokens` armazena refresh token no Redis com TTL correto
**Then** todos testes passam

---

### Story 1.2: Login & Logout Endpoints

As a **usuário (Professor/Coordenador/Diretor)**,
I want **endpoints de login, logout e refresh de tokens**,
So that **posso autenticar com email/senha e manter sessão ativa por 7 dias**.

**Acceptance Criteria:**

**Given** a infraestrutura de auth (Story 1.1) está implementada
**When** crio DTO `LoginDto`:
```typescript
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  senha: string;
}
```
**Then** o DTO valida email e senha (min 8 chars)

**Given** o DTO está criado
**When** implemento endpoint `POST /api/v1/auth/login`:
- Recebe `LoginDto` no body
- Busca usuário por email: `prisma.usuario.findFirst({ where: { email }, include: { perfil_usuario: true, escola: true } })`
- Se usuário não existe, retorna `401 Unauthorized: "Credenciais inválidas"`
- Se usuário existe, valida senha com `authService.comparePassword()`
- Se senha incorreta, retorna `401 Unauthorized: "Credenciais inválidas"`
- Se senha correta, gera tokens com `authService.generateTokens(user)`
- Retorna `200 OK`:
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000",
  "user": {
    "id": "uuid",
    "email": "professor@escola.com",
    "nome": "João Silva",
    "role": "PROFESSOR",
    "escola": { "id": "uuid", "nome": "Escola ABC" }
  }
}
```
**Then** o endpoint de login está funcional

**Given** o endpoint de login existe
**When** implemento endpoint `POST /api/v1/auth/logout`:
- Protegido com `@UseGuards(JwtAuthGuard)`
- Recebe `refreshToken` no body
- Deleta token do Redis: `redis.del(refreshToken)`
- Retorna `200 OK: { message: "Logout realizado com sucesso" }`
**Then** o endpoint de logout invalida refresh token

**Given** o endpoint de logout existe
**When** implemento endpoint `POST /api/v1/auth/refresh`:
- Recebe `refreshToken` no body
- Valida token com `authService.validateRefreshToken(refreshToken)`
- Se inválido, retorna `401 Unauthorized: "Refresh token inválido ou expirado"`
- Se válido, busca usuário atualizado no banco
- Gera NOVOS tokens (token rotation): `authService.generateTokens(user)`
- Deleta refresh token antigo do Redis
- Retorna novos tokens (mesmo formato do login)
**Then** o endpoint de refresh renova tokens com rotation

**Given** todos endpoints estão implementados
**When** adiciono rate limiting no endpoint de login:
```typescript
@Throttle(5, 60) // 5 tentativas por minuto
@Post('login')
```
**Then** proteção contra brute-force está ativa

**Given** todos endpoints estão prontos
**When** testo fluxo completo:
1. POST /auth/login com credenciais válidas → retorna tokens
2. GET /api/v1/usuarios/me (protegido) com access token → retorna usuário
3. Aguardo 15min (access token expira)
4. GET /api/v1/usuarios/me sem refresh → retorna `401`
5. POST /auth/refresh com refresh token → retorna novos tokens
6. GET /api/v1/usuarios/me com novo access token → retorna usuário
7. POST /auth/logout com refresh token → invalida sessão
8. POST /auth/refresh com mesmo token → retorna `401`
**Then** o fluxo de autenticação completo funciona

---

### Story 1.3: Multi-Tenancy Isolation (PostgreSQL RLS + Prisma Middleware)

As a **desenvolvedor**,
I want **isolamento completo de dados entre escolas usando Row-Level Security**,
So that **Escola A nunca pode acessar dados de Escola B, mesmo em caso de bug no código**.

**Acceptance Criteria:**

**Given** o schema Prisma tem `escola_id` em todas tabelas multi-tenant (Usuario, Turma, Planejamento, Aula, etc.)
**When** crio migration para adicionar RLS policies no PostgreSQL:
```sql
-- Habilitar RLS em tabelas multi-tenant
ALTER TABLE "Usuario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Turma" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Planejamento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Aula" ENABLE ROW LEVEL SECURITY;
-- ... (todas tabelas com escola_id)

-- Policy: apenas dados da escola do usuário
CREATE POLICY tenant_isolation_policy ON "Usuario"
  USING (escola_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_policy ON "Turma"
  USING (escola_id = current_setting('app.current_tenant_id')::uuid);

-- ... (repetir para todas tabelas)
```
**Then** as policies RLS estão criadas

**Given** as RLS policies existem
**When** crio `PrismaService` (se não existe) que estende `PrismaClient`:
```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```
**Then** o PrismaService está disponível para injeção

**Given** o PrismaService existe
**When** adiciono middleware Prisma para injetar `escola_id` automaticamente:
```typescript
prisma.$use(async (params, next) => {
  // Obter escola_id do contexto (AsyncLocalStorage ou request)
  const escolaId = getCurrentEscolaId();

  // Lista de models multi-tenant
  const multiTenantModels = ['Usuario', 'Turma', 'Planejamento', 'Aula', 'Transcricao', 'Analise', 'Relatorio'];

  if (multiTenantModels.includes(params.model)) {
    // Queries: adicionar escola_id ao where
    if (['findMany', 'findFirst', 'findUnique', 'count'].includes(params.action)) {
      params.args.where = { ...params.args.where, escola_id: escolaId };
    }

    // Mutations: adicionar escola_id ao data
    if (['create', 'update', 'upsert'].includes(params.action)) {
      params.args.data = { ...params.args.data, escola_id: escolaId };
    }
  }

  return next(params);
});
```
**Then** o middleware injeta `escola_id` automaticamente

**Given** o middleware está implementado
**When** crio `AsyncLocalStorage` para armazenar contexto da request:
```typescript
// context.service.ts
export class ContextService {
  private als = new AsyncLocalStorage<{ escolaId: string }>();

  run(escolaId: string, callback: () => void) {
    this.als.run({ escolaId }, callback);
  }

  getEscolaId(): string | undefined {
    return this.als.getStore()?.escolaId;
  }
}
```
**Then** o contexto pode ser acessado em qualquer lugar do código

**Given** o ContextService existe
**When** crio interceptor NestJS para injetar contexto:
```typescript
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private contextService: ContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const escolaId = request.user?.escolaId; // Do JWT payload

    if (!escolaId) {
      throw new UnauthorizedException('Escola ID não encontrado no token');
    }

    return from(
      new Promise((resolve) => {
        this.contextService.run(escolaId, () => {
          resolve(next.handle().toPromise());
        });
      })
    );
  }
}
```
**Then** o interceptor injeta `escola_id` em todas requests autenticadas

**Given** toda infraestrutura está pronta
**When** testo isolamento:
1. Crio 2 escolas no banco: Escola A e Escola B
2. Crio 2 usuários: User A (Escola A) e User B (Escola B)
3. Faço login como User A → recebo token com `escolaId: A`
4. Crio planejamento com User A → `escola_id: A`
5. Consulto planejamentos com User A → retorna apenas planejamentos de Escola A
6. Faço login como User B → recebo token com `escolaId: B`
7. Consulto planejamentos com User B → retorna vazio (não vê planejamentos de Escola A)
8. Tento fazer query direta no banco sem `escola_id` (bypass do middleware) → RLS bloqueia
**Then** o isolamento multi-tenant está completo e funcional

---

### Story 1.4: Role-Based Access Control (RBAC Guards)

As a **desenvolvedor**,
I want **guards e decorators para controlar acesso por role (Professor/Coordenador/Diretor)**,
So that **endpoints sensíveis são protegidos e cada role só acessa o que é permitido**.

**Acceptance Criteria:**

**Given** o schema Prisma tem enum `Role` com valores: `PROFESSOR`, `COORDENADOR`, `DIRETOR`, `ADMIN`
**When** crio decorator `@Roles(...roles: Role[])`:
```typescript
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```
**Then** o decorator pode ser usado em controllers

**Given** o decorator está criado
**When** crio `RolesGuard` que implementa `CanActivate`:
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
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
**Then** rotas públicas (login, password recovery) não exigem auth

**Given** toda infraestrutura RBAC está pronta
**When** crio endpoints de exemplo com proteção de roles:
```typescript
// Apenas professores
@Roles(Role.PROFESSOR)
@Get('minhas-aulas')
getMinhasAulas(@CurrentUser() user) { ... }

// Coordenadores e Diretores
@Roles(Role.COORDENADOR, Role.DIRETOR)
@Get('metricas')
getMetricas(@CurrentUser() user) { ... }

// Apenas diretores
@Roles(Role.DIRETOR)
@Get('dashboard-executivo')
getDashboardExecutivo(@CurrentUser() user) { ... }

// Público (sem @Roles)
@Public()
@Post('login')
login(@Body() loginDto: LoginDto) { ... }
```
**Then** os endpoints respeitam restrições de role

**Given** os endpoints estão protegidos
**When** testo acesso com diferentes roles:
1. Login como PROFESSOR → GET /minhas-aulas retorna `200`
2. Login como PROFESSOR → GET /metricas retorna `403 Forbidden`
3. Login como COORDENADOR → GET /metricas retorna `200`
4. Login como COORDENADOR → GET /dashboard-executivo retorna `403`
5. Login como DIRETOR → GET /dashboard-executivo retorna `200`
6. Acesso sem token → GET /minhas-aulas retorna `401 Unauthorized`
**Then** o RBAC funciona corretamente para todos roles

---

### Story 1.5: Password Recovery Flow

As a **usuário (Professor/Coordenador/Diretor)**,
I want **recuperar minha senha via email quando esquecer**,
So that **não fico bloqueado fora do sistema e posso redefinir minha senha de forma segura**.

**Acceptance Criteria:**

**Given** o serviço de email está configurado (SendGrid ou AWS SES via .env: `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM`)
**When** crio `EmailService` para enviar emails:
```typescript
@Injectable()
export class EmailService {
  async sendPasswordResetEmail(email: string, resetToken: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    // Enviar email via SendGrid/SES
    // Template básico: "Clique aqui para redefinir sua senha: {resetUrl}"
  }
}
```
**Then** o serviço pode enviar emails de recuperação

**Given** o EmailService existe
**When** implemento endpoint `POST /api/v1/auth/forgot-password`:
- Público (`@Public()`)
- Recebe `{ email: string }` no body
- Busca usuário por email
- Se usuário não existe, retorna `200 OK` (não revelar se email existe - segurança)
- Se usuário existe:
  - Gera token aleatório: `crypto.randomBytes(32).toString('hex')`
  - Armazena token no Redis: `reset_password:${token}`, value: `userId`, TTL: 1 hora
  - Envia email com link de reset
  - Retorna `200 OK: { message: "Se o email existir, você receberá instruções" }`
**Then** o endpoint de forgot password está funcional

**Given** o endpoint forgot-password existe
**When** crio DTO `ResetPasswordDto`:
```typescript
export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Senha deve conter maiúscula, minúscula e número',
  })
  novaSenha: string;
}
```
**Then** o DTO valida token e senha forte

**Given** o DTO está criado
**When** implemento endpoint `POST /api/v1/auth/reset-password`:
- Público (`@Public()`)
- Recebe `ResetPasswordDto` no body
- Busca token no Redis: `redis.get(`reset_password:${token}`)`
- Se token não existe ou expirou, retorna `400 Bad Request: "Token inválido ou expirado"`
- Se token válido:
  - Busca usuário por ID (do Redis value)
  - Hasheia nova senha: `authService.hashPassword(novaSenha)`
  - Atualiza senha no banco: `prisma.usuario.update({ where: { id: userId }, data: { senha: hashedPassword } })`
  - Deleta token do Redis
  - Invalida todos refresh tokens do usuário (logout forçado): `redis.del(`refresh_token:${userId}:*`)`
  - Retorna `200 OK: { message: "Senha redefinida com sucesso" }`
**Then** o endpoint de reset password está funcional

**Given** ambos endpoints estão implementados
**When** testo fluxo completo:
1. POST /auth/forgot-password com email válido → retorna `200`, email é enviado
2. Abro email, copio token do link
3. POST /auth/reset-password com token + nova senha → retorna `200`
4. Tento fazer login com senha antiga → retorna `401`
5. Faço login com senha nova → retorna `200` com tokens
6. Tento usar token de reset novamente → retorna `400` (já foi usado)
7. Aguardo 1h01min e tento usar token (se não tivesse usado) → retorna `400` (expirado)
**Then** o fluxo de recuperação de senha funciona completamente

---

### Story 1.6: Admin User & School Management (Internal Tool)

As a **admin interno do sistema**,
I want **endpoints para criar escolas e usuários administrativamente**,
So that **posso fazer onboarding de novas escolas e seus usuários iniciais**.

**Acceptance Criteria:**

**Given** o role `ADMIN` existe no enum `Role`
**When** crio DTO `CreateEscolaDto`:
```typescript
export class CreateEscolaDto {
  @IsString()
  nome: string;

  @IsString()
  cnpj: string;

  @IsEmail()
  email_contato: string;

  @IsOptional()
  @IsString()
  telefone?: string;
}
```
**Then** o DTO valida dados da escola

**Given** o DTO está criado
**When** implemento endpoint `POST /api/v1/admin/schools`:
- Protegido: `@Roles(Role.ADMIN)`
- Recebe `CreateEscolaDto`
- Valida CNPJ único (não pode duplicar)
- Cria escola no banco: `prisma.escola.create({ data: { ...dto } })`
- Retorna `201 Created` com escola criada
**Then** o endpoint de criação de escola está funcional

**Given** o endpoint de escola existe
**When** crio DTO `CreateUsuarioDto`:
```typescript
export class CreateUsuarioDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  senha: string;

  @IsString()
  nome: string;

  @IsUUID()
  escola_id: string;

  @IsEnum(Role)
  role: Role;
}
```
**Then** o DTO valida dados do usuário

**Given** o DTO está criado
**When** implemento endpoint `POST /api/v1/admin/users`:
- Protegido: `@Roles(Role.ADMIN)`
- Recebe `CreateUsuarioDto`
- Valida que `escola_id` existe
- Valida que email é único dentro da escola (constraint: `@@unique([email, escola_id])`)
- Hasheia senha: `authService.hashPassword(senha)`
- Cria usuário no banco: `prisma.usuario.create({ data: { ...dto, senha: hashedPassword } })`
- Cria perfil de usuário: `prisma.perfilUsuario.create({ data: { usuario_id, role } })`
- Retorna `201 Created` com usuário criado (SEM senha no response)
**Then** o endpoint de criação de usuário está funcional

**Given** ambos endpoints estão implementados
**When** crio seed script para admin inicial:
```typescript
// prisma/seed.ts (adicionar ao seed existente)
async function seedAdmin() {
  const adminEmail = 'admin@ressoaai.com';
  const adminExists = await prisma.usuario.findFirst({ where: { email: adminEmail } });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    await prisma.usuario.create({
      data: {
        email: adminEmail,
        senha: hashedPassword,
        nome: 'Admin Sistema',
        escola_id: null, // Admin não pertence a escola
        perfil_usuario: {
          create: { role: 'ADMIN' }
        }
      }
    });
  }
}
```
**Then** um usuário admin é criado no seed

**Given** o admin existe no banco
**When** crio seed script para escola e usuários demo:
```typescript
async function seedDemoSchool() {
  // Criar escola demo
  const escola = await prisma.escola.upsert({
    where: { cnpj: '12.345.678/0001-90' },
    update: {},
    create: {
      nome: 'Escola Demo ABC',
      cnpj: '12.345.678/0001-90',
      email_contato: 'contato@escolademo.com'
    }
  });

  // Criar 3 usuários: Professor, Coordenador, Diretor
  const usuarios = [
    { email: 'professor@escolademo.com', nome: 'João Professor', role: 'PROFESSOR' },
    { email: 'coordenador@escolademo.com', nome: 'Marcia Coordenadora', role: 'COORDENADOR' },
    { email: 'diretor@escolademo.com', nome: 'Ricardo Diretor', role: 'DIRETOR' },
  ];

  for (const userData of usuarios) {
    const hashedPassword = await bcrypt.hash('Demo@123', 10);
    await prisma.usuario.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        senha: hashedPassword,
        nome: userData.nome,
        escola_id: escola.id,
        perfil_usuario: {
          create: { role: userData.role }
        }
      }
    });
  }
}
```
**Then** escola demo com 3 usuários é criada no seed

**Given** todos endpoints e seeds estão prontos
**When** testo fluxo admin:
1. Faço login como admin@ressoaai.com → recebo token
2. POST /admin/schools com dados da escola → retorna `201` com escola criada
3. POST /admin/users com dados do professor → retorna `201` com usuário criado
4. Faço login como o professor criado → retorna `200` com tokens
5. Tento acessar POST /admin/schools como professor → retorna `403 Forbidden`
**Then** o fluxo administrativo funciona e está protegido

---

### Story 1.7: Frontend Login Page

As a **usuário (Professor/Coordenador/Diretor)**,
I want **uma página de login intuitiva e acessível**,
So that **posso acessar o sistema de forma rápida e segura pelo navegador**.

**Acceptance Criteria:**

**Given** o shadcn/ui está configurado no frontend (Epic 0)
**When** crio página `/login` em `src/pages/LoginPage.tsx`:
- Layout centralizado (card no centro da tela)
- Background: gradiente Deep Navy (#0A2647) → Tech Blue (#2563EB)
- Logo "Ressoa AI" no topo
- Tagline: "Inteligência de Aula, Análise e Previsão de Conteúdo"
**Then** o layout da página está estruturado

**Given** o layout está pronto
**When** adiciono formulário de login usando React Hook Form + zod:
```typescript
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const form = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
});
```
**Then** o formulário tem validação tipada

**Given** o formulário está configurado
**When** adiciono campos usando shadcn/ui components:
- Email: `<Input type="email" placeholder="professor@escola.com" />`
- Senha: `<Input type="password" placeholder="••••••••" />`
- Botão: `<Button type="submit">Entrar</Button>`
- Link: "Esqueceu sua senha?" → `/forgot-password`
**Then** os campos estão renderizados com design system

**Given** os campos estão prontos
**When** crio Zustand store para autenticação:
```typescript
// stores/auth.store.ts
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (tokens: Tokens, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      login: (tokens, user) => set({ ...tokens, user }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'auth-storage' }
  )
);
```
**Then** o estado de autenticação persiste no localStorage

**Given** o store está criado
**When** crio axios client configurado:
```typescript
// api/axios.ts
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
});

// Interceptor: injetar token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: refresh token automático em 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { refreshToken } = useAuthStore.getState();
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken });
          useAuthStore.getState().login(data, data.user);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);
```
**Then** o client axios tem auth automático e refresh de tokens

**Given** o client está configurado
**When** implemento função de submit do formulário:
```typescript
const onSubmit = async (data: LoginFormData) => {
  try {
    const response = await apiClient.post('/auth/login', data);
    const { accessToken, refreshToken, user } = response.data;

    // Salvar no store (persiste no localStorage)
    useAuthStore.getState().login({ accessToken, refreshToken }, user);

    // Redirect baseado em role
    if (user.role === 'PROFESSOR') {
      navigate('/minhas-aulas');
    } else if (user.role === 'COORDENADOR') {
      navigate('/dashboard-coordenador');
    } else if (user.role === 'DIRETOR') {
      navigate('/dashboard-diretor');
    }

    toast.success(`Bem-vindo, ${user.nome}!`);
  } catch (error) {
    if (error.response?.status === 401) {
      toast.error('Email ou senha incorretos');
    } else {
      toast.error('Erro ao fazer login. Tente novamente.');
    }
  }
};
```
**Then** o submit faz login, salva tokens e redireciona

**Given** tudo está implementado
**When** adiciono proteção de rotas em `App.tsx`:
```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuthStore();

  if (!user || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Rotas:
<Route path="/login" element={<LoginPage />} />
<Route path="/minhas-aulas" element={<ProtectedRoute><MinhasAulasPage /></ProtectedRoute>} />
```
**Then** rotas privadas exigem autenticação

**Given** toda página está completa
**When** testo a página de login:
1. Acesso `/login` sem autenticação → página renderiza
2. Tento submeter form vazio → validação mostra erros
3. Digite email inválido → erro "Email inválido"
4. Digite senha com <8 chars → erro "Senha deve ter no mínimo 8 caracteres"
5. Digite credenciais válidas → login bem-sucedido, redirecionado para dashboard
6. Verifico localStorage → tokens estão salvos
7. Recarrego página → continuo logado (tokens no localStorage)
8. Tento acessar rota protegida sem login → redirecionado para `/login`
9. Faço logout → tokens removidos, redirecionado para `/login`
**Then** a página de login está completamente funcional

**And** a página é responsiva (mobile + desktop)

**And** a página é acessível (WCAG AA: contraste, keyboard nav, ARIA labels)

---

**Epic 1 COMPLETO!** ✅

**Resumo:**
- 7 stories criadas
- Auth completo: Passport + JWT + Refresh Tokens (Redis) + Multi-tenancy (RLS) + RBAC (3 roles) + Password Recovery + Admin Management + Frontend Login
- Isolamento de dados entre escolas garantido
- Base de autenticação pronta para Epic 2

---

## Epic 2: Planejamento Bimestral

**Goal:** Professor cadastra planejamento do bimestre, vinculando habilidades BNCC por turma, criando base para futuras análises de cobertura curricular.

### Story 2.1: Backend - Planejamento CRUD API

As a **desenvolvedor**,
I want **endpoints REST para CRUD de planejamentos vinculados a habilidades BNCC**,
So that **professores podem gerenciar seus planejamentos bimestrais via API**.

**Acceptance Criteria:**

**DATABASE SETUP:**

**Given** preciso armazenar planejamentos bimestrais vinculados a habilidades BNCC
**When** crio migration Prisma com 3 entidades de planejamento:
```prisma
// schema.prisma

enum Disciplina {
  MATEMATICA
  LINGUA_PORTUGUESA
  CIENCIAS
}

enum Serie {
  SEXTO_ANO
  SETIMO_ANO
  OITAVO_ANO
  NONO_ANO
}

model Turma {
  id            String      @id @default(uuid())
  nome          String      // ex: "6A", "7B"
  disciplina    Disciplina
  serie         Serie
  ano_letivo    Int
  escola_id     String
  professor_id  String
  created_at    DateTime    @default(now())
  updated_at    DateTime    @updatedAt

  // Relations
  escola        Escola      @relation(fields: [escola_id], references: [id], onDelete: Cascade)
  professor     Usuario     @relation(fields: [professor_id], references: [id], onDelete: Cascade)
  planejamentos Planejamento[]

  @@index([escola_id])
  @@index([professor_id])
  @@index([ano_letivo, disciplina])
  @@map("turma")
}

model Planejamento {
  id                     String   @id @default(uuid())
  turma_id               String
  bimestre               Int      // 1-4
  ano_letivo             Int
  escola_id              String
  professor_id           String
  validado_coordenacao   Boolean  @default(false)
  created_at             DateTime @default(now())
  updated_at             DateTime @updatedAt

  // Relations
  escola                 Escola   @relation(fields: [escola_id], references: [id], onDelete: Cascade)
  professor              Usuario  @relation(fields: [professor_id], references: [id], onDelete: Cascade)
  turma                  Turma    @relation(fields: [turma_id], references: [id], onDelete: Cascade)
  habilidades            PlanejamentoHabilidade[]

  @@unique([turma_id, bimestre, ano_letivo]) // RN-PLAN-04: Sem duplicatas
  @@index([escola_id])
  @@index([professor_id])
  @@index([turma_id])
  @@index([ano_letivo, bimestre])
  @@map("planejamento")
}

model PlanejamentoHabilidade {
  id                String        @id @default(uuid())
  planejamento_id   String
  habilidade_id     String
  peso              Float         @default(1.0) // RN-PLAN-02: Peso padrão 1.0
  aulas_previstas   Int?          // RN-PLAN-03: Opcional, estimado se não fornecido
  created_at        DateTime      @default(now())

  // Relations
  planejamento      Planejamento  @relation(fields: [planejamento_id], references: [id], onDelete: Cascade)
  habilidade        Habilidade    @relation(fields: [habilidade_id], references: [id], onDelete: Cascade)

  @@unique([planejamento_id, habilidade_id]) // N:N sem duplicatas
  @@index([planejamento_id])
  @@index([habilidade_id])
  @@map("planejamento_habilidade")
}
```
**Then** executo `npx prisma migrate dev --name create_planejamento_tables`

**And** o banco de dados possui 3 novas tabelas: `turma`, `planejamento`, `planejamento_habilidade`

**And** relacionamento N:N entre Planejamento e Habilidade está funcional

**And** multi-tenancy está garantido via `escola_id` em Planejamento

**API IMPLEMENTATION:**

**Given** as tabelas existem
**When** crio DTOs para planejamento:
```typescript
export class CreatePlanejamentoDto {
  @IsUUID()
  turma_id: string;

  @IsInt()
  @Min(1)
  @Max(4)
  bimestre: number;

  @IsInt()
  @Min(2024)
  ano_letivo: number;

  @IsArray()
  @ArrayMinSize(1, { message: 'Selecione ao menos uma habilidade' })
  habilidades: Array<{
    habilidade_id: string;
    peso?: number; // Opcional - RN-PLAN-02
    aulas_previstas?: number; // Opcional - RN-PLAN-03
  }>;
}

export class UpdatePlanejamentoDto extends PartialType(CreatePlanejamentoDto) {}
```
**Then** os DTOs validam dados de entrada

**Given** os DTOs estão criados
**When** implemento endpoint `POST /api/v1/planejamentos`:
- Protegido: `@Roles(Role.PROFESSOR)`
- Recebe `CreatePlanejamentoDto`
- Validações:
  - Turma pertence ao professor (`turma.professor_id === user.id`)
  - Turma pertence à escola do professor (`turma.escola_id === user.escolaId`)
  - Não existe planejamento duplicado (mesma turma + bimestre + ano_letivo)
- Aplica regras de negócio:
  - RN-PLAN-02: Se peso não informado, distribui igualmente: `peso = 1 / total_habilidades`
  - RN-PLAN-03: Se aulas_previstas não informado, estima baseado em carga horária
- Cria planejamento: `prisma.planejamento.create({ data: { ..., professor_id: user.id } })`
- Cria relacionamentos: `prisma.planejamentoHabilidade.createMany({ data: habilidades })`
- Flag inicial: `validado_coordenacao = false` (RN-PLAN-01)
- Retorna `201 Created` com planejamento completo (incluindo habilidades)
**Then** o endpoint de criação está funcional

**Given** o endpoint POST existe
**When** implemento endpoint `GET /api/v1/planejamentos`:
- Protegido: `@Roles(Role.PROFESSOR, Role.COORDENADOR, Role.DIRETOR)`
- Filtros query params:
  - `turma_id` (opcional)
  - `bimestre` (opcional)
  - `ano_letivo` (opcional)
  - `validado` (boolean, opcional)
- Professor: retorna apenas seus planejamentos
- Coordenador/Diretor: retorna todos da escola
- Include: `turma`, `habilidades.habilidade` (pré-carrega dados completos)
- Ordenação: por `ano_letivo DESC, bimestre DESC, turma.nome ASC`
- Retorna `200 OK` com array de planejamentos
**Then** o endpoint de listagem está funcional

**Given** o endpoint GET existe
**When** implemento endpoint `GET /api/v1/planejamentos/:id`:
- Protegido: `@Roles(Role.PROFESSOR, Role.COORDENADOR, Role.DIRETOR)`
- Valida que planejamento pertence à escola do usuário
- Professor: só pode ver seus próprios
- Include completo: `turma`, `habilidades.habilidade`, `professor.perfil_usuario`
- Retorna `200 OK` com planejamento completo
- Retorna `404` se não encontrado ou sem permissão
**Then** o endpoint de detalhes está funcional

**Given** o endpoint GET by ID existe
**When** implemento endpoint `PATCH /api/v1/planejamentos/:id`:
- Protegido: `@Roles(Role.PROFESSOR)`
- Recebe `UpdatePlanejamentoDto` (partial)
- Valida que planejamento pertence ao professor
- Se `habilidades` está no body, substitui todas relações:
  - Deleta relações antigas: `prisma.planejamentoHabilidade.deleteMany({ where: { planejamento_id } })`
  - Cria novas relações: `prisma.planejamentoHabilidade.createMany({ data: habilidades })`
- Aplica regras RN-PLAN-02 e RN-PLAN-03
- Atualiza planejamento: `prisma.planejamento.update({ where: { id }, data: { ... } })`
- Retorna `200 OK` com planejamento atualizado
**Then** o endpoint de atualização está funcional

**Given** o endpoint PATCH existe
**When** implemento endpoint `DELETE /api/v1/planejamentos/:id`:
- Protegido: `@Roles(Role.PROFESSOR)`
- Valida que planejamento pertence ao professor
- Valida que não há aulas vinculadas ao planejamento (proteção de integridade)
- Se há aulas, retorna `400 Bad Request: "Não é possível excluir planejamento com aulas vinculadas"`
- Se não há aulas, soft delete: `prisma.planejamento.update({ where: { id }, data: { deleted_at: new Date() } })`
- Retorna `204 No Content`
**Then** o endpoint de exclusão está funcional

**Given** todos endpoints estão implementados
**When** testo fluxo completo:
1. Login como professor → recebo token
2. GET /planejamentos → retorna array vazio
3. POST /planejamentos com dados válidos → retorna `201` com planejamento
4. GET /planejamentos → retorna array com 1 planejamento
5. GET /planejamentos/:id → retorna planejamento completo
6. PATCH /planejamentos/:id alterando habilidades → retorna `200` atualizado
7. Tento DELETE com aulas vinculadas → retorna `400`
8. DELETE sem aulas → retorna `204`
9. GET /planejamentos/:id (deletado) → retorna `404`
**Then** o CRUD completo funciona

---

### Story 2.2: Backend - Habilidades BNCC Query API

As a **desenvolvedor frontend**,
I want **endpoint otimizado para buscar habilidades BNCC com filtros avançados e cache**,
So that **o seletor de habilidades no frontend é rápido e responsivo**.

**Acceptance Criteria:**

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

**Given** o endpoint está completo
**When** testo diferentes queries:
1. GET /habilidades?disciplina=MATEMATICA&serie=6 → retorna ~30 habilidades de Matemática 6º ano
2. GET /habilidades?disciplina=LINGUA_PORTUGUESA&serie=7 → retorna habilidades de LP incluindo blocos compartilhados (EF67LP + EF69LP)
3. GET /habilidades?search=equações → retorna habilidades com "equações" no código ou descrição
4. GET /habilidades?unidade_tematica=Álgebra → retorna habilidades de Álgebra
5. Faço mesma query 2 vezes → segunda é instantânea (cache hit)
6. GET /habilidades?limit=10&offset=0 → retorna primeira página
7. GET /habilidades?limit=10&offset=10 → retorna segunda página
**Then** todas queries funcionam e cache está ativo

---

### Story 2.3: Frontend - Cadastro de Planejamento (Form Wizard)

As a **professor**,
I want **cadastrar meu planejamento bimestral selecionando habilidades BNCC de forma intuitiva**,
So that **posso definir o que planejo ensinar no bimestre e o sistema usar isso nas análises futuras**.

**Acceptance Criteria:**

**Given** o endpoint POST /planejamentos está funcional (Story 2.1)
**When** crio página `/planejamentos/novo` com form wizard de 3 etapas:
- Step 1: Dados gerais (Turma, Bimestre, Ano letivo)
- Step 2: Seleção de habilidades BNCC
- Step 3: Revisão e confirmação
**Then** a estrutura do wizard está criada

**Given** a estrutura está pronta
**When** implemento Step 1 - Dados gerais:
- Campo: Turma (select com turmas do professor)
  - Fetch: `GET /api/v1/turmas?professor_id=me`
  - Exibe: nome da turma + disciplina + série
- Campo: Bimestre (radio buttons: 1, 2, 3, 4)
- Campo: Ano letivo (number input, default: ano atual)
- Validação: todos campos obrigatórios
- Botão: "Próximo" → avança para Step 2
**Then** Step 1 captura dados gerais

**Given** Step 1 está implementado
**When** implemento Step 2 - Seleção de habilidades:
- Filtros no topo:
  - Disciplina (auto-preenchido pela turma, readonly)
  - Série (auto-preenchido pela turma, readonly)
  - Unidade Temática (select com opções únicas do resultado)
  - Busca (input text com debounce 300ms)
- Lista de habilidades (virtualized list para performance):
  - Checkbox: selecionar/desselecionar
  - Código BNCC (ex: EF06MA01)
  - Descrição (truncada, tooltip com texto completo)
  - Badge: Unidade Temática
- Painel lateral: Habilidades selecionadas (N habilidades)
  - Drag-and-drop para reordenar (opcional - peso automático)
  - Botão "Remover" em cada
- Validação: mínimo 1 habilidade selecionada
- Botões: "Voltar" (Step 1), "Próximo" (Step 3)
**Then** Step 2 permite seleção intuitiva de habilidades

**Given** Step 2 está implementado
**When** implemento Step 3 - Revisão:
- Resumo dos dados:
  - Turma: {nome} - {disciplina} - {série}º ano
  - Bimestre: {1-4}
  - Ano letivo: {2026}
  - Habilidades selecionadas: {N} habilidades
- Lista de habilidades selecionadas (read-only):
  - Código + Descrição
  - Peso calculado automaticamente (RN-PLAN-02: 1/N)
- Botões: "Voltar" (Step 2), "Salvar Planejamento" (submit)
**Then** Step 3 mostra revisão completa

**Given** todos steps estão implementados
**When** implemento lógica de submit:
```typescript
const onSubmit = async () => {
  try {
    const payload = {
      turma_id: formData.turma_id,
      bimestre: formData.bimestre,
      ano_letivo: formData.ano_letivo,
      habilidades: selectedHabilidades.map(h => ({
        habilidade_id: h.id,
        // peso e aulas_previstas omitidos - backend calcula automaticamente
      }))
    };

    await apiClient.post('/planejamentos', payload);

    toast.success('Planejamento criado com sucesso!');
    navigate('/planejamentos');
  } catch (error) {
    toast.error('Erro ao salvar planejamento. Tente novamente.');
  }
};
```
**Then** o submit cria planejamento via API

**Given** o wizard está completo
**When** adiciono validação de duplicata no frontend:
- Antes do Step 3, verificar se já existe planejamento:
  - `GET /planejamentos?turma_id={x}&bimestre={y}&ano_letivo={z}`
  - Se existe, mostrar warning: "Já existe planejamento para esta turma neste bimestre. Deseja substituir?"
  - Opções: "Cancelar" ou "Editar existente" (redirect para edição)
**Then** previne criação de duplicatas

**Given** tudo está implementado
**When** testo o fluxo completo:
1. Acesso `/planejamentos/novo` → wizard renderiza em Step 1
2. Seleciono turma, bimestre, ano → clico "Próximo"
3. Wizard avança para Step 2
4. Vejo lista de habilidades filtradas por disciplina/série da turma
5. Uso busca "equações" → lista filtra em tempo real
6. Seleciono 5 habilidades → painel lateral mostra "5 selecionadas"
7. Clico "Próximo" → wizard avança para Step 3
8. Vejo resumo completo → clico "Salvar"
9. Planejamento é criado → redirecionado para `/planejamentos`
10. Toast "Planejamento criado com sucesso!" aparece
**Then** o fluxo de cadastro funciona end-to-end

**And** o wizard é responsivo (funciona em mobile e desktop)

**And** o wizard é acessível (keyboard navigation, ARIA labels)

---

### Story 2.4: Frontend - Listagem e Edição de Planejamentos

As a **professor**,
I want **visualizar, editar e excluir meus planejamentos cadastrados**,
So that **posso gerenciar minhas expectativas curriculares ao longo do ano letivo**.

**Acceptance Criteria:**

**Given** o endpoint GET /planejamentos está funcional (Story 2.1)
**When** crio página `/planejamentos` com listagem:
- Filtros no topo:
  - Turma (select: "Todas" ou selecionar específica)
  - Bimestre (select: "Todos" ou 1-4)
  - Ano letivo (select: últimos 3 anos)
  - Botão: "Novo Planejamento" → `/planejamentos/novo`
- Tabela responsiva (shadcn/ui Table):
  - Colunas: Turma, Bimestre, Ano, Habilidades (count), Status, Ações
  - Mobile: colapsa em cards verticais
- Ordenação: ano letivo DESC, bimestre DESC, turma nome ASC
- Empty state: "Nenhum planejamento cadastrado. Crie seu primeiro!"
**Then** a listagem está estruturada

**Given** a estrutura está pronta
**When** implemento coluna "Status":
- Badge visual:
  - ✅ "Validado" (verde) se `validado_coordenacao === true`
  - ⚠️ "Aguardando validação" (laranja) se `validado_coordenacao === false`
- Tooltip explica: "Planejamento validado pela coordenação" ou "Aguardando validação da coordenação (não bloqueia uso)"
- RN-PLAN-01: Status não-validado é apenas informativo, não bloqueia
**Then** status de validação é visível

**Given** a coluna Status existe
**When** implemento coluna "Ações":
- Botão: "Visualizar" (ícone olho) → abre modal com detalhes
- Botão: "Editar" (ícone lápis) → `/planejamentos/:id/editar`
- Botão: "Excluir" (ícone lixeira) → abre dialog de confirmação
- Botão: "Copiar" (ícone copy) → abre dialog para copiar para outro bimestre
**Then** ações estão disponíveis

**Given** as ações estão implementadas
**When** implemento modal "Visualizar":
- Dialog (shadcn/ui) com detalhes completos:
  - Turma: {nome} - {disciplina} - {série}º ano
  - Bimestre: {1-4}
  - Ano letivo: {2026}
  - Status: Badge validado/não-validado
  - Habilidades (lista expandida):
    - Código + Descrição
    - Peso (se diferente do padrão)
    - Aulas previstas (se informado)
- Botão: "Fechar"
**Then** modal de visualização mostra todos detalhes

**Given** o modal de visualização existe
**When** implemento página de edição `/planejamentos/:id/editar`:
- Reutiliza wizard de criação (Story 2.3)
- Pré-preenche dados existentes:
  - Step 1: turma, bimestre, ano (turma readonly - não pode mudar)
  - Step 2: habilidades selecionadas pré-marcadas
- Submit chama `PATCH /planejamentos/:id` ao invés de POST
- Validações iguais ao cadastro
**Then** edição reutiliza wizard e funciona

**Given** a edição existe
**When** implemento dialog "Excluir":
- AlertDialog (shadcn/ui) com confirmação:
  - Título: "Excluir planejamento?"
  - Descrição: "Esta ação não pode ser desfeita. Tem certeza?"
  - Se há aulas vinculadas: Adiciona warning: "⚠️ Há {N} aulas vinculadas a este planejamento. Elas serão desvinculadas."
  - Botões: "Cancelar", "Excluir" (variant destructive)
- Ao confirmar, chama `DELETE /planejamentos/:id`
- Se erro 400 (aulas vinculadas), mostra mensagem específica
- Se sucesso, remove da lista + toast "Planejamento excluído"
**Then** exclusão tem confirmação e tratamento de erros

**Given** a exclusão existe
**When** implemento dialog "Copiar para outro bimestre":
- Dialog com form:
  - Campo: Bimestre destino (select 1-4, excluindo bimestre atual)
  - Campo: Ano letivo destino (number, default: ano atual)
  - Checkbox: "Manter mesmas habilidades" (checked por padrão)
  - Botão: "Copiar"
- Lógica:
  1. Busca planejamento atual completo
  2. Cria novo planejamento com dados copiados + bimestre/ano destino
  3. Se "manter habilidades" = true, copia todas relações
  4. Chama `POST /planejamentos` com dados copiados
- Toast: "Planejamento copiado com sucesso!"
- Atualiza listagem automaticamente
**Then** cópia para outro bimestre facilita reutilização

**Given** todas funcionalidades estão implementadas
**When** testo o fluxo completo:
1. Acesso `/planejamentos` → vejo lista vazia
2. Clico "Novo Planejamento" → crio primeiro planejamento
3. Retorno para `/planejamentos` → vejo planejamento na lista
4. Status mostra "⚠️ Aguardando validação" (badge laranja)
5. Clico "Visualizar" → modal mostra todos detalhes
6. Clico "Editar" → wizard abre pré-preenchido
7. Adiciono mais 2 habilidades → salvo
8. Retorno para lista → vejo planejamento atualizado
9. Clico "Copiar" → copio para bimestre 2
10. Lista agora tem 2 planejamentos
11. Filtro por bimestre 1 → vejo apenas primeiro
12. Limpo filtros → vejo ambos
13. Clico "Excluir" no segundo → confirmo → planejamento removido
14. Lista volta a ter 1 planejamento
**Then** o fluxo de gerenciamento completo funciona

**And** a tabela é responsiva (mobile mostra cards, desktop mostra tabela)

**And** a página é acessível (keyboard navigation, screen reader friendly)

---

**Epic 2 COMPLETO!** ✅

**Resumo:**
- 4 stories criadas
- Planejamento CRUD completo: Backend API (CRUD + Habilidades query com cache) + Frontend (Wizard multi-step + Listagem/Edição)
- Validações de negócio (RN-PLAN-01 a RN-PLAN-04) implementadas
- Base para análises de cobertura curricular pronta (Epic 5)

---

## Epic 3: Upload & Captura de Aulas

**Goal:** Professor captura conteúdo de aulas de múltiplas formas (áudio, transcrição pronta, texto manual) com interface confiável, resumível e adaptada a conexões instáveis.

### Story 3.1: Backend - Aula Entity & Basic CRUD

As a **desenvolvedor**,
I want **a entidade Aula com lifecycle de estados e CRUD básico**,
So that **posso gerenciar aulas e rastrear seu processamento através dos estados**.

**Acceptance Criteria:**

**Given** o schema Prisma precisa da entidade Aula
**When** crio a entidade no schema:
```prisma
model Aula {
  id                   String   @id @default(uuid())
  escola_id            String
  professor_id         String
  turma_id             String
  planejamento_id      String?
  data                 DateTime
  tipo_entrada         TipoEntrada // AUDIO, TRANSCRICAO, MANUAL
  status_processamento StatusProcessamento @default(CRIADA)
  arquivo_url          String?  // S3/MinIO URL
  arquivo_tamanho      Int?     // bytes
  transcricao_id       String?  // FK para Transcricao
  analise_id           String?  // FK para Analise
  created_at           DateTime @default(now())
  updated_at           DateTime @updatedAt
  deleted_at           DateTime?

  escola        Escola        @relation(fields: [escola_id], references: [id])
  professor     Usuario       @relation(fields: [professor_id], references: [id])
  turma         Turma         @relation(fields: [turma_id], references: [id])
  planejamento  Planejamento? @relation(fields: [planejamento_id], references: [id])
  transcricao   Transcricao?  @relation(fields: [transcricao_id], references: [id])
  analise       Analise?      @relation(fields: [analise_id], references: [id])

  @@index([escola_id, professor_id, data])
  @@index([status_processamento])
  @@index([turma_id, data])
}

enum TipoEntrada {
  AUDIO
  TRANSCRICAO
  MANUAL
}

enum StatusProcessamento {
  CRIADA
  UPLOAD_PROGRESSO
  AGUARDANDO_TRANSCRICAO
  TRANSCRITA
  ANALISANDO
  ANALISADA
  APROVADA
  REJEITADA
  ERRO
}
```
**Then** a entidade Aula está modelada corretamente

**Given** a entidade está no schema
**When** crio migration: `npx prisma migrate dev --name add-aula`
**Then** a tabela Aula é criada no banco com índices

**Given** a tabela existe
**When** crio DTOs para Aula:
```typescript
export class CreateAulaDto {
  @IsUUID()
  turma_id: string;

  @IsDateString()
  data: string; // ISO 8601

  @IsOptional()
  @IsUUID()
  planejamento_id?: string;

  @IsEnum(TipoEntrada)
  tipo_entrada: TipoEntrada;
}

export class UpdateAulaDto extends PartialType(CreateAulaDto) {
  @IsOptional()
  @IsEnum(StatusProcessamento)
  status_processamento?: StatusProcessamento;
}
```
**Then** os DTOs validam dados de entrada

**Given** os DTOs estão criados
**When** implemento endpoint `POST /api/v1/aulas`:
- Protegido: `@Roles(Role.PROFESSOR)`
- Recebe `CreateAulaDto`
- Validações:
  - Turma pertence ao professor
  - Data não está no futuro
  - Planejamento (se informado) pertence à turma
- Cria aula: `prisma.aula.create({ data: { ..., professor_id: user.id, escola_id: user.escolaId, status_processamento: 'CRIADA' } })`
- Retorna `201 Created` com aula criada
**Then** o endpoint de criação está funcional

**Given** o endpoint POST existe
**When** implemento endpoint `GET /api/v1/aulas`:
- Protegido: `@Roles(Role.PROFESSOR)`
- Filtros query params:
  - `turma_id` (opcional)
  - `data_inicio`, `data_fim` (range de datas)
  - `status_processamento` (opcional)
- Professor: retorna apenas suas aulas
- Include: `turma`, `planejamento` (pré-carrega)
- Ordenação: `data DESC, created_at DESC`
- Retorna `200 OK` com array de aulas
**Then** o endpoint de listagem está funcional

**Given** o endpoint GET existe
**When** implemento endpoint `GET /api/v1/aulas/:id`:
- Protegido: `@Roles(Role.PROFESSOR)`
- Valida que aula pertence ao professor
- Include completo: `turma`, `planejamento`, `transcricao`, `analise`
- Retorna `200 OK` com aula completa
- Retorna `404` se não encontrado ou sem permissão
**Then** o endpoint de detalhes está funcional

**Given** o endpoint GET by ID existe
**When** implemento endpoint `PATCH /api/v1/aulas/:id`:
- Protegido: `@Roles(Role.PROFESSOR)`
- Recebe `UpdateAulaDto` (partial)
- Valida que aula pertence ao professor
- Permite atualizar: `planejamento_id`, `status_processamento` (apenas certos estados)
- Transições de estado validadas:
  - Professor pode: CRIADA → AGUARDANDO_TRANSCRICAO (após upload completo)
  - Professor pode: ANALISADA → APROVADA / REJEITADA
  - Sistema (workers) pode: outros estados
- Retorna `200 OK` com aula atualizada
**Then** o endpoint de atualização está funcional

**Given** todos endpoints estão implementados
**When** testo fluxo CRUD:
1. Login como professor → recebo token
2. GET /aulas → retorna array vazio
3. POST /aulas com dados válidos → retorna `201` com aula (status: CRIADA)
4. GET /aulas → retorna array com 1 aula
5. GET /aulas/:id → retorna aula completa
6. PATCH /aulas/:id alterando planejamento → retorna `200` atualizado
7. Filtro GET /aulas?status_processamento=CRIADA → retorna apenas aulas criadas
8. Filtro GET /aulas?data_inicio=2026-02-01&data_fim=2026-02-28 → retorna aulas de fevereiro
**Then** o CRUD básico funciona

---

### Story 3.2: Backend - TUS Upload Server (Resumable Upload)

As a **desenvolvedor**,
I want **servidor TUS configurado para uploads resumíveis de arquivos grandes**,
So that **professores podem fazer upload de áudios de 50min (~25-50MB) mesmo com conexões instáveis**.

**Acceptance Criteria:**

**Given** as dependências TUS estão instaladas: `npm install @tus/server @tus/s3-store`
**When** crio `TusModule` em `src/modules/tus/`:
- `tus.controller.ts`: expõe endpoints TUS
- `tus.service.ts`: configuração do servidor TUS
- `tus.module.ts`: registra providers
**Then** o módulo TUS está estruturado

**Given** o módulo está criado
**When** configuro `TusService` com storage S3/MinIO:
```typescript
import { Server } from '@tus/server';
import { S3Store } from '@tus/s3-store';
import { S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class TusService {
  private server: Server;

  constructor() {
    const s3Client = new S3Client({
      region: process.env.S3_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT, // MinIO local ou AWS
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
      },
      forcePathStyle: true, // Required for MinIO
    });

    const store = new S3Store({
      s3Client,
      bucket: process.env.S3_BUCKET || 'ressoa-uploads',
      partSize: 5 * 1024 * 1024, // 5MB chunks
    });

    this.server = new Server({
      path: '/api/v1/uploads',
      datastore: store,
      maxSize: 2 * 1024 * 1024 * 1024, // 2GB max
      namingFunction: (req) => {
        // Gerar nome único: {escola_id}/{professor_id}/{uuid}.{ext}
        const metadata = req.upload?.metadata || {};
        const escolaId = metadata.escola_id || 'unknown';
        const professorId = metadata.professor_id || 'unknown';
        const uuid = crypto.randomUUID();
        const ext = metadata.filetype?.split('/')[1] || 'bin';
        return `${escolaId}/${professorId}/${uuid}.${ext}`;
      },
      onUploadCreate: async (req, res, upload) => {
        // Validar metadata obrigatória
        const { escola_id, professor_id, turma_id, data, aula_id } = upload.metadata || {};
        if (!escola_id || !professor_id || !turma_id || !data || !aula_id) {
          throw new Error('Metadata obrigatória faltando');
        }

        // Atualizar status da aula: CRIADA → UPLOAD_PROGRESSO
        await prisma.aula.update({
          where: { id: aula_id },
          data: { status_processamento: 'UPLOAD_PROGRESSO' }
        });
      },
      onUploadFinish: async (req, res, upload) => {
        // Upload completo - atualizar aula
        const { aula_id } = upload.metadata || {};
        const fileUrl = `s3://${process.env.S3_BUCKET}/${upload.id}`;

        await prisma.aula.update({
          where: { id: aula_id },
          data: {
            status_processamento: 'AGUARDANDO_TRANSCRICAO',
            arquivo_url: fileUrl,
            arquivo_tamanho: upload.size,
          }
        });

        // Enfileirar job de transcrição (Epic 4)
        await bullQueue.add('transcribe-aula', { aulaId: aula_id });
      },
    });
  }

  getServer(): Server {
    return this.server;
  }
}
```
**Then** o TUS server está configurado com S3/MinIO

**Given** o service está configurado
**When** crio `TusController` que expõe TUS endpoints:
```typescript
@Controller('uploads')
export class TusController {
  constructor(private tusService: TusService) {}

  @All('*')
  async handleTus(@Req() req, @Res() res) {
    const server = this.tusService.getServer();
    return server.handle(req, res);
  }
}
```
**Then** os endpoints TUS estão expostos em `/api/v1/uploads`

**Given** o controller está criado
**When** adiciono middleware de autenticação no TUS:
```typescript
this.server = new Server({
  // ... config anterior
  onIncomingRequest: async (req, res) => {
    // Extrair token JWT do header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized');
    }

    const token = authHeader.substring(7);
    try {
      const payload = await jwtService.verify(token);
      req.user = payload; // Injetar usuário na request
    } catch (error) {
      throw new Error('Invalid token');
    }
  },
});
```
**Then** TUS endpoints exigem autenticação JWT

**Given** o TUS server está completo
**When** implemento cleanup de uploads abandonados:
- Bull scheduled job: roda diariamente às 3h AM
- Query: uploads com `upload_expires < NOW()` (TUS metadata)
- Deleta arquivos do S3: `s3.deleteObject()`
- Deleta metadata do TUS store
- Atualiza aulas órfãs: `status_processamento = 'ERRO'`
**Then** uploads abandonados são limpos automaticamente

**Given** tudo está implementado
**When** testo upload resumível:
1. Cliente inicia upload: `POST /uploads` com metadata (aula_id, escola_id, etc.)
2. TUS retorna `201` com `Location: /uploads/{upload-id}`
3. Aula atualizada: status → UPLOAD_PROGRESSO
4. Cliente envia chunks: `PATCH /uploads/{upload-id}` com offset
5. Progresso: 20%, 40%, 60%... (TUS `Upload-Offset` header)
6. Simulo queda de conexão após 60%
7. Cliente reconecta: `HEAD /uploads/{upload-id}` → retorna offset atual (60%)
8. Cliente resume: `PATCH` a partir de 60%
9. Upload completa: 100%
10. TUS chama `onUploadFinish`
11. Aula atualizada: status → AGUARDANDO_TRANSCRICAO, arquivo_url preenchido
12. Job de transcrição enfileirado
**Then** upload resumível funciona completamente

---

### Story 3.3: Backend - Multiple Input Methods (Áudio / Texto / Manual)

As a **professor**,
I want **múltiplas formas de adicionar conteúdo de aula (áudio, transcrição, resumo manual)**,
So that **posso usar o método mais conveniente dependendo da situação**.

**Acceptance Criteria:**

**Given** o endpoint POST /aulas (Story 3.1) e TUS server (Story 3.2) existem
**When** crio endpoint `POST /api/v1/aulas/upload-transcricao`:
- Protegido: `@Roles(Role.PROFESSOR)`
- Recebe:
```typescript
{
  turma_id: "uuid",
  data: "2026-02-10",
  planejamento_id: "uuid",
  transcricao_texto: "Texto completo da transcrição..." // Max 50k chars
}
```
- Validações:
  - Turma pertence ao professor
  - Texto não vazio (min 100 chars)
  - Max 50k caracteres
- Cria aula: `tipo_entrada = TRANSCRICAO`, `status_processamento = TRANSCRITA`
- Cria transcricao: `prisma.transcricao.create({ data: { texto, provider: 'MANUAL', duracao_segundos: null } })`
- Vincula: `aula.transcricao_id = transcricao.id`
- Enfileira job de análise (Epic 5): `bullQueue.add('analyze-aula', { aulaId })`
- Retorna `201 Created` com aula + transcricao
**Then** o endpoint de upload de transcrição está funcional

**Given** o endpoint de transcrição existe
**When** crio endpoint `POST /api/v1/aulas/entrada-manual`:
- Protegido: `@Roles(Role.PROFESSOR)`
- Recebe:
```typescript
{
  turma_id: "uuid",
  data: "2026-02-10",
  planejamento_id: "uuid",
  resumo: "Resumo de 3-5 parágrafos da aula..." // Min 200, Max 5k chars
}
```
- Validações:
  - Turma pertence ao professor
  - Resumo entre 200-5000 chars
- Cria aula: `tipo_entrada = MANUAL`, `status_processamento = TRANSCRITA`
- Cria transcricao com flag: `prisma.transcricao.create({ data: { texto: resumo, provider: 'MANUAL', confianca: 0.5 } })` (confiança menor)
- Vincula: `aula.transcricao_id = transcricao.id`
- Enfileira job de análise
- Retorna `201 Created` com aula + transcricao
**Then** o endpoint de entrada manual está funcional

**Given** os endpoints alternativos existem
**When** implemento validação de formatos de áudio no TUS:
```typescript
onUploadCreate: async (req, res, upload) => {
  const { filetype } = upload.metadata || {};
  const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/webm'];

  if (!filetype || !allowedTypes.includes(filetype)) {
    throw new Error(`Formato não suportado. Use: mp3, wav, m4a, webm`);
  }

  // Validação adicional: arquivo não vazio
  if (upload.size === 0) {
    throw new Error('Arquivo vazio');
  }

  // Validação: tamanho máximo 2GB
  if (upload.size > 2 * 1024 * 1024 * 1024) {
    throw new Error('Arquivo maior que 2GB');
  }
}
```
**Then** apenas formatos permitidos podem ser uploaded

**Given** todas validações estão implementadas
**When** testo os 3 métodos de entrada:

**Método 1 - Upload de Áudio (TUS):**
1. POST /aulas → cria aula (status: CRIADA)
2. POST /uploads com metadata (aula_id, formato: mp3)
3. PATCH /uploads com chunks → progresso 0-100%
4. Upload completa → aula status: AGUARDANDO_TRANSCRICAO
5. Job transcribe-aula enfileirado

**Método 2 - Upload de Transcrição:**
1. POST /aulas/upload-transcricao com texto completo
2. Aula criada (status: TRANSCRITA)
3. Transcricao criada (provider: MANUAL)
4. Job analyze-aula enfileirado

**Método 3 - Entrada Manual:**
1. POST /aulas/entrada-manual com resumo
2. Aula criada (status: TRANSCRITA, tipo_entrada: MANUAL)
3. Transcricao criada com flag confianca: 0.5
4. Job analyze-aula enfileirado

**Then** os 3 métodos funcionam e têm workflows ligeiramente diferentes

**And** validações impedem uploads inválidos (formato errado, vazio, muito grande)

---

### Story 3.4: Frontend - Upload Page with Drag-and-Drop

As a **professor**,
I want **página de upload intuitiva com drag-and-drop e alternativas de entrada**,
So that **posso adicionar aulas de forma rápida independente de como capturei o conteúdo**.

**Acceptance Criteria:**

**Given** o TUS server (Story 3.2) e endpoints alternativos (Story 3.3) existem
**When** crio página `/aulas/upload` com tabs:
- Tab 1: "Upload de Áudio" (default)
- Tab 2: "Colar Transcrição"
- Tab 3: "Resumo Manual"
**Then** a estrutura de tabs está criada (shadcn/ui Tabs)

**Given** as tabs estão criadas
**When** implemento Tab 1 - Upload de Áudio:
- Form fields (React Hook Form):
  - Turma (select, obrigatório)
  - Data da aula (date picker, obrigatório, max: hoje)
  - Planejamento (select, opcional, filtrado por turma)
- Drag-and-drop zone:
  - Área visual: "Arraste áudio aqui ou clique para selecionar"
  - Aceita: .mp3, .wav, .m4a, .webm
  - Preview após seleção: nome do arquivo, tamanho, ícone de áudio
  - Validação client-side: formato, tamanho <2GB
  - Botão "Remover" para deselecionar
- Botão "Iniciar Upload" (disabled até form válido + arquivo selecionado)
**Then** o form de upload de áudio está completo

**Given** o form está completo
**When** instalo TUS client: `npm install tus-js-client`
**Then** a dependência está disponível

**Given** o TUS client está instalado
**When** implemento lógica de upload:
```typescript
import * as tus from 'tus-js-client';

const handleUpload = async (formData: UploadFormData, file: File) => {
  try {
    // 1. Criar aula no backend
    const { data: aula } = await apiClient.post('/aulas', {
      turma_id: formData.turma_id,
      data: formData.data,
      planejamento_id: formData.planejamento_id,
      tipo_entrada: 'AUDIO',
    });

    // 2. Iniciar upload TUS
    const upload = new tus.Upload(file, {
      endpoint: `${import.meta.env.VITE_API_URL}/uploads`,
      metadata: {
        filename: file.name,
        filetype: file.type,
        aula_id: aula.id,
        escola_id: useAuthStore.getState().user.escolaId,
        professor_id: useAuthStore.getState().user.id,
        turma_id: formData.turma_id,
        data: formData.data,
      },
      headers: {
        Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
      },
      chunkSize: 5 * 1024 * 1024, // 5MB chunks
      retryDelays: [0, 1000, 3000, 5000], // Retry com backoff
      onError: (error) => {
        toast.error(`Erro no upload: ${error.message}`);
        setUploadStatus('error');
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
        setUploadProgress(percentage);
      },
      onSuccess: () => {
        toast.success('Upload concluído! Transcrição em andamento...');
        setUploadStatus('success');
        // Redirect para listagem
        navigate('/minhas-aulas');
      },
    });

    // Iniciar upload
    upload.start();

    // Salvar upload no state (para pause/resume se necessário)
    setCurrentUpload(upload);
  } catch (error) {
    toast.error('Erro ao criar aula. Tente novamente.');
  }
};
```
**Then** o upload TUS funciona com retry automático

**Given** a lógica de upload existe
**When** implemento progress bar visual:
- shadcn/ui Progress component
- Label: "Enviando: 45%"
- Estimativa de tempo: "~2 minutos restantes" (baseado em velocidade)
- Estados:
  - uploading: Progress bar azul animado
  - success: Check verde + "Upload concluído!"
  - error: X vermelho + "Erro no upload. Tente novamente."
- Botão "Cancelar" durante upload (chama `upload.abort()`)
**Then** feedback visual de progresso está completo

**Given** Tab 1 está completo
**When** implemento Tab 2 - Colar Transcrição:
- Form fields: Turma, Data, Planejamento (iguais)
- Textarea grande: placeholder "Cole aqui a transcrição completa da aula..."
- Contador de caracteres: "{N} / 50.000"
- Validação: min 100 chars, max 50k chars
- Botão "Salvar Transcrição"
- Submit chama: `POST /aulas/upload-transcricao`
**Then** Tab 2 permite colar transcrição pronta

**Given** Tab 2 está completo
**When** implemento Tab 3 - Resumo Manual:
- Form fields: Turma, Data, Planejamento (iguais)
- Textarea médio: placeholder "Descreva em 3-5 parágrafos o que foi ensinado..."
- Contador: "{N} / 5.000"
- Validação: min 200 chars, max 5k chars
- Info tooltip: "⚠️ Resumo manual tem confiança menor na análise. Use transcrição completa quando possível."
- Botão "Salvar Resumo"
- Submit chama: `POST /aulas/entrada-manual`
**Then** Tab 3 permite entrada manual de resumo

**Given** todas tabs estão implementadas
**When** testo a página completa:

**Tab 1 - Upload Áudio:**
1. Acesso `/aulas/upload` → Tab "Upload de Áudio" ativa
2. Seleciono turma, data, planejamento
3. Arrasto arquivo .mp3 (30MB) para drop zone → preview aparece
4. Clico "Iniciar Upload" → progress bar inicia 0%
5. Progresso: 20%, 40%, 60%...
6. Simulo queda de internet por 5s → TUS retenta automaticamente
7. Upload resume e completa 100%
8. Toast "Upload concluído!" → redirecionado para `/minhas-aulas`

**Tab 2 - Transcrição:**
1. Mudo para Tab "Colar Transcrição"
2. Seleciono turma, data
3. Colo transcrição (2000 chars) → contador atualiza
4. Clico "Salvar" → aula criada, toast sucesso, redirect

**Tab 3 - Manual:**
1. Mudo para Tab "Resumo Manual"
2. Seleciono turma, data
3. Digito resumo (500 chars) → contador atualiza
4. Tooltip mostra warning sobre confiança menor
5. Clico "Salvar" → aula criada, toast sucesso, redirect

**Then** todos os 3 métodos funcionam end-to-end

**And** a página é responsiva (mobile: upload via celular, desktop: drag-and-drop)

**And** a página é acessível (keyboard navigation, ARIA labels)

---

### Story 3.5: Frontend - Aulas List with Status Tracking

As a **professor**,
I want **visualizar minhas aulas com status de processamento em tempo real**,
So that **sei quando a transcrição e análise estão prontas para revisão**.

**Acceptance Criteria:**

**Given** o endpoint GET /aulas (Story 3.1) existe
**When** crio página `/minhas-aulas` com tabela de aulas:
- Filtros no topo:
  - Turma (select: "Todas" ou selecionar específica)
  - Período (date range picker)
  - Status (select multi: todos status possíveis)
  - Botão: "Nova Aula" → `/aulas/upload`
- Tabela responsiva (shadcn/ui Table):
  - Colunas: Data, Turma, Tipo, Status, Ações
  - Mobile: colapsa em cards verticais
- Ordenação: data DESC (mais recentes primeiro)
- Pagination: 20 aulas por página
**Then** a estrutura da listagem está criada

**Given** a estrutura está pronta
**When** implemento coluna "Tipo":
- Badge com ícone:
  - 🎵 "Áudio" (AUDIO)
  - 📝 "Transcrição" (TRANSCRICAO)
  - ✍️ "Manual" (MANUAL)
- Cores diferenciadas por tipo
**Then** tipo de entrada é visível

**Given** a coluna Tipo existe
**When** implemento coluna "Status" com badges coloridos:
```typescript
const statusConfig = {
  CRIADA: { label: 'Criada', color: 'gray', icon: '⚪' },
  UPLOAD_PROGRESSO: { label: 'Enviando...', color: 'blue', icon: '🔄', animated: true },
  AGUARDANDO_TRANSCRICAO: { label: 'Aguardando transcrição', color: 'yellow', icon: '⏳' },
  TRANSCRITA: { label: 'Transcrita', color: 'cyan', icon: '📄' },
  ANALISANDO: { label: 'Analisando...', color: 'purple', icon: '🔄', animated: true },
  ANALISADA: { label: 'Pronta para revisão', color: 'green', icon: '✅' },
  APROVADA: { label: 'Aprovada', color: 'success', icon: '✔️' },
  REJEITADA: { label: 'Rejeitada', color: 'red', icon: '❌' },
  ERRO: { label: 'Erro', color: 'destructive', icon: '⚠️' },
};
```
- Badge renderiza: `{icon} {label}` com cor e animação (se animated)
- Tooltip explica cada status
**Then** status visual está completo

**Given** os badges de status existem
**When** implemento polling para atualizar status automaticamente:
```typescript
// React Query com refetchInterval
const { data: aulas, isLoading } = useQuery({
  queryKey: ['aulas', filters],
  queryFn: () => fetchAulas(filters),
  refetchInterval: (data) => {
    // Apenas refetch se há aulas em processamento
    const hasProcessing = data?.some(aula =>
      ['UPLOAD_PROGRESSO', 'AGUARDANDO_TRANSCRICAO', 'ANALISANDO'].includes(aula.status_processamento)
    );
    return hasProcessing ? 5000 : false; // Poll a cada 5s se há processamento
  },
});
```
**Then** status atualiza automaticamente enquanto há aulas processando

**Given** o polling está ativo
**When** implemento coluna "Ações":
- Botão: "Ver Detalhes" (todos status) → abre modal com info completa
- Botão: "Revisar Relatório" (status: ANALISADA, APROVADA) → `/aulas/:id/relatorio` (Epic 6)
- Botão: "Reprocessar" (status: ERRO) → chama endpoint para reenfileirar job
- Botão: "Excluir" (status: CRIADA, ERRO) → dialog de confirmação
**Then** ações contextuais estão disponíveis

**Given** as ações existem
**When** implemento modal "Ver Detalhes":
- Dialog (shadcn/ui) com informações completas:
  - Turma, Data, Planejamento vinculado
  - Tipo de entrada
  - Status atual (badge)
  - Timestamps: criado em, atualizado em
  - Se AUDIO: arquivo URL, tamanho
  - Se ERRO: mensagem de erro
- Botão: "Fechar"
**Then** modal de detalhes mostra todas informações

**Given** o modal existe
**When** implemento ação "Reprocessar":
- Dialog de confirmação: "Deseja reprocessar esta aula?"
- Ao confirmar:
  - POST /aulas/:id/reprocessar (endpoint que reenfileira job)
  - Toast: "Aula adicionada à fila de processamento"
  - Status atualiza: ERRO → AGUARDANDO_TRANSCRICAO (ou ANALISANDO)
  - Polling detecta e atualiza automaticamente
**Then** reprocessamento permite recuperação de erros

**Given** todas funcionalidades estão implementadas
**When** testo a página completa:
1. Acesso `/minhas-aulas` → vejo tabela vazia ou com aulas
2. Faço upload de nova aula via `/aulas/upload`
3. Retorno para `/minhas-aulas` → vejo aula com status "Enviando..." (badge azul animado)
4. Polling atualiza a cada 5s
5. Após 2min, status muda para "Aguardando transcrição" (badge amarelo)
6. Após mais 5min, status muda para "Analisando..." (badge roxo animado)
7. Após mais 1min, status muda para "Pronta para revisão" (badge verde)
8. Botão "Revisar Relatório" aparece
9. Clico "Ver Detalhes" → modal mostra todas informações
10. Filtro por turma específica → lista filtra
11. Filtro por status "Pronta para revisão" → lista filtra
12. Simulo erro: status "Erro" (badge vermelho)
13. Clico "Reprocessar" → confirmo → status volta para processamento
14. Após reprocessamento, status fica "Pronta para revisão"
**Then** a listagem funciona completamente com tracking em tempo real

**And** a tabela é responsiva (mobile mostra cards, desktop mostra tabela)

**And** polling para quando não há aulas em processamento (economia de recursos)

---

**Epic 3 COMPLETO!** ✅

**Resumo:**
- 5 stories criadas
- Upload completo: Aula entity + TUS Protocol (resumível) + Múltiplos métodos (áudio/texto/manual) + Frontend drag-and-drop + Listagem com status tracking
- Upload resiliente funciona com conexões instáveis (retry automático, resumível)
- Base para transcrição (Epic 4) pronta

---

## Epic 4: Transcrição Automática (STT)

**Goal:** Áudios são convertidos em texto de forma confiável, rápida e com custo otimizado, usando múltiplos providers para garantir resiliência.

### Story 4.1: Backend - STT Service Abstraction Layer

As a **desenvolvedor**,
I want **uma camada de abstração para providers STT com interface comum**,
So that **posso trocar entre Whisper, Google Speech e futuros providers sem mudar código consumidor**.

**Acceptance Criteria:**

**Given** preciso suportar múltiplos providers STT
**When** crio entidade `Transcricao` no schema Prisma:
```prisma
model Transcricao {
  id                String   @id @default(uuid())
  aula_id           String   @unique
  texto             String   @db.Text
  provider          ProviderSTT // WHISPER, GOOGLE, AZURE, MANUAL
  idioma            String   @default("pt-BR")
  duracao_segundos  Int?
  confianca         Float?   // 0.0-1.0
  custo_usd         Float?   // Cost tracking
  tempo_processamento_ms Int?
  metadata_json     Json?    // Provider-specific data
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  aula Aula @relation(fields: [aula_id], references: [id], onDelete: Cascade)

  @@index([aula_id])
  @@index([provider, created_at])
}

enum ProviderSTT {
  WHISPER
  GOOGLE
  AZURE
  MANUAL
}
```
**Then** a entidade está modelada e migration criada

**Given** a entidade existe
**When** crio interface comum para providers STT:
```typescript
// stt/interfaces/stt-provider.interface.ts
export interface TranscriptionResult {
  texto: string;
  idioma: string;
  duracao_segundos?: number;
  confianca?: number;
  custo_usd: number;
  tempo_processamento_ms: number;
  metadata?: Record<string, any>;
}

export interface STTProvider {
  getName(): ProviderSTT;
  transcribe(audioBuffer: Buffer, options?: TranscribeOptions): Promise<TranscriptionResult>;
  isAvailable(): Promise<boolean>; // Health check
}

export interface TranscribeOptions {
  idioma?: string; // Default: pt-BR
  model?: string; // Provider-specific
}
```
**Then** a interface define contrato comum

**Given** a interface está definida
**When** crio `STTService` orquestrador:
```typescript
@Injectable()
export class STTService {
  private primaryProvider: STTProvider;
  private fallbackProvider: STTProvider;

  constructor(
    @Inject('WHISPER_PROVIDER') private whisperProvider: WhisperProvider,
    @Inject('GOOGLE_PROVIDER') private googleProvider: GoogleProvider,
    private configService: ConfigService,
  ) {
    const primary = this.configService.get('STT_PRIMARY_PROVIDER') || 'WHISPER';
    const fallback = this.configService.get('STT_FALLBACK_PROVIDER') || 'GOOGLE';

    this.primaryProvider = primary === 'WHISPER' ? this.whisperProvider : this.googleProvider;
    this.fallbackProvider = fallback === 'GOOGLE' ? this.googleProvider : this.whisperProvider;
  }

  async transcribe(audioBuffer: Buffer, options?: TranscribeOptions): Promise<TranscriptionResult> {
    const startTime = Date.now();

    try {
      // Tentar provider primário
      this.logger.log(`Tentando transcrição com ${this.primaryProvider.getName()}`);
      const result = await this.transcribeWithTimeout(this.primaryProvider, audioBuffer, options, 300000); // 5min timeout

      this.logger.log(`Transcrição bem-sucedida com ${this.primaryProvider.getName()} em ${Date.now() - startTime}ms`);
      return result;

    } catch (primaryError) {
      this.logger.warn(`Falha no provider primário: ${primaryError.message}`);

      // Tentar provider fallback
      try {
        this.logger.log(`Tentando fallback com ${this.fallbackProvider.getName()}`);
        const result = await this.transcribeWithTimeout(this.fallbackProvider, audioBuffer, options, 300000);

        this.logger.log(`Transcrição bem-sucedida com fallback ${this.fallbackProvider.getName()}`);
        return result;

      } catch (fallbackError) {
        this.logger.error(`Falha no provider fallback: ${fallbackError.message}`);
        throw new Error(`Transcrição falhou em ambos providers: ${primaryError.message} | ${fallbackError.message}`);
      }
    }
  }

  private async transcribeWithTimeout(
    provider: STTProvider,
    audioBuffer: Buffer,
    options: TranscribeOptions,
    timeoutMs: number,
  ): Promise<TranscriptionResult> {
    return Promise.race([
      provider.transcribe(audioBuffer, options),
      this.timeout(timeoutMs),
    ]);
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout após ${ms}ms`)), ms)
    );
  }
}
```
**Then** o orquestrador tenta primário → fallback com timeout

**Given** o orquestrador existe
**When** crio `TranscricaoService` para persistir resultados:
```typescript
@Injectable()
export class TranscricaoService {
  constructor(
    private prisma: PrismaService,
    private sttService: STTService,
  ) {}

  async transcribeAula(aulaId: string): Promise<Transcricao> {
    // Buscar aula
    const aula = await this.prisma.aula.findUnique({ where: { id: aulaId } });
    if (!aula || !aula.arquivo_url) {
      throw new Error('Aula não encontrada ou sem arquivo de áudio');
    }

    // Download áudio do S3
    const audioBuffer = await this.downloadFromS3(aula.arquivo_url);

    // Transcrever
    const result = await this.sttService.transcribe(audioBuffer, { idioma: 'pt-BR' });

    // Salvar transcricao
    const transcricao = await this.prisma.transcricao.create({
      data: {
        aula_id: aulaId,
        texto: result.texto,
        provider: result.provider,
        idioma: result.idioma,
        duracao_segundos: result.duracao_segundos,
        confianca: result.confianca,
        custo_usd: result.custo_usd,
        tempo_processamento_ms: result.tempo_processamento_ms,
        metadata_json: result.metadata,
      },
    });

    // Atualizar aula: status → TRANSCRITA, vincular transcricao
    await this.prisma.aula.update({
      where: { id: aulaId },
      data: {
        status_processamento: 'TRANSCRITA',
        transcricao_id: transcricao.id,
      },
    });

    // Log custo para tracking
    this.logger.log(`Transcrição completa: aulaId=${aulaId}, provider=${result.provider}, custo=$${result.custo_usd.toFixed(4)}`);

    return transcricao;
  }

  private async downloadFromS3(s3Url: string): Promise<Buffer> {
    // Parse s3:// URL
    const match = s3Url.match(/s3:\/\/([^\/]+)\/(.*)/);
    if (!match) throw new Error('Invalid S3 URL');

    const [, bucket, key] = match;

    // Download via AWS SDK
    const s3 = new S3Client({ /* config */ });
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3.send(command);

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of response.Body as Readable) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }
}
```
**Then** o service completo transcreve e persiste

**Given** todos services estão implementados
**When** testo a abstraction layer:
1. Configuro `.env`: `STT_PRIMARY_PROVIDER=WHISPER`, `STT_FALLBACK_PROVIDER=GOOGLE`
2. Mock WhisperProvider para retornar sucesso
3. Chamo `sttService.transcribe(audioBuffer)` → retorna resultado do Whisper
4. Mock WhisperProvider para lançar erro
5. Mock GoogleProvider para retornar sucesso
6. Chamo `sttService.transcribe(audioBuffer)` → retorna resultado do Google (fallback)
7. Mock ambos providers para falhar
8. Chamo `sttService.transcribe(audioBuffer)` → lança erro "ambos providers falharam"
**Then** a lógica de failover funciona corretamente

---

### Story 4.2: Backend - Whisper & Google Speech Integration

As a **desenvolvedor**,
I want **integrações com OpenAI Whisper e Google Speech-to-Text**,
So that **posso transcrever áudios com alta qualidade e resiliência via failover**.

**Acceptance Criteria:**

**Given** as dependências estão instaladas: `npm install @google-cloud/speech openai`
**When** crio `WhisperProvider` implementando `STTProvider`:
```typescript
@Injectable()
export class WhisperProvider implements STTProvider {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  getName(): ProviderSTT {
    return ProviderSTT.WHISPER;
  }

  async transcribe(audioBuffer: Buffer, options?: TranscribeOptions): Promise<TranscriptionResult> {
    const startTime = Date.now();

    try {
      // Whisper requer arquivo temporário
      const tempFile = `/tmp/${crypto.randomUUID()}.mp3`;
      await fs.promises.writeFile(tempFile, audioBuffer);

      // API call
      const response = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFile),
        model: 'whisper-1', // whisper-large-v3
        language: options?.idioma || 'pt',
        response_format: 'verbose_json', // Inclui timestamps, duracao, confianca
      });

      // Cleanup temp file
      await fs.promises.unlink(tempFile);

      // Calcular custo: $0.006 per minute
      const duracaoMinutos = (response.duration || 0) / 60;
      const custoUsd = duracaoMinutos * 0.006;

      return {
        texto: response.text,
        idioma: response.language || 'pt-BR',
        duracao_segundos: response.duration,
        confianca: this.calculateConfidence(response.segments), // Média das confidences dos segments
        custo_usd: custoUsd,
        tempo_processamento_ms: Date.now() - startTime,
        metadata: {
          provider: 'whisper',
          model: 'whisper-1',
          segments: response.segments?.length,
        },
      };

    } catch (error) {
      if (error.code === 'rate_limit_exceeded') {
        throw new Error('Whisper rate limit exceeded');
      }
      if (error.status === 429) {
        throw new Error('Whisper quota exceeded');
      }
      throw new Error(`Whisper error: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Health check: verificar se API key é válida
      const response = await this.openai.models.retrieve('whisper-1');
      return !!response;
    } catch {
      return false;
    }
  }

  private calculateConfidence(segments: any[]): number {
    if (!segments || segments.length === 0) return 0.9; // Default alto para Whisper
    const avgConfidence = segments.reduce((sum, seg) => sum + (seg.confidence || 0.9), 0) / segments.length;
    return avgConfidence;
  }
}
```
**Then** o WhisperProvider está funcional

**Given** o WhisperProvider existe
**When** crio `GoogleSpeechProvider` implementando `STTProvider`:
```typescript
@Injectable()
export class GoogleSpeechProvider implements STTProvider {
  private client: SpeechClient;

  constructor(private configService: ConfigService) {
    this.client = new SpeechClient({
      credentials: JSON.parse(this.configService.get('GOOGLE_CLOUD_CREDENTIALS')),
    });
  }

  getName(): ProviderSTT {
    return ProviderSTT.GOOGLE;
  }

  async transcribe(audioBuffer: Buffer, options?: TranscribeOptions): Promise<TranscriptionResult> {
    const startTime = Date.now();

    try {
      const audioBytes = audioBuffer.toString('base64');

      const [response] = await this.client.recognize({
        audio: { content: audioBytes },
        config: {
          encoding: 'MP3',
          sampleRateHertz: 16000,
          languageCode: options?.idioma || 'pt-BR',
          model: 'default', // ou 'enhanced' para melhor qualidade (+$$)
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: false, // Não precisa de timestamps por palavra
        },
      });

      if (!response.results || response.results.length === 0) {
        throw new Error('Google Speech retornou resultado vazio');
      }

      // Concatenar todos os resultados
      const fullTranscription = response.results
        .map(result => result.alternatives[0].transcript)
        .join(' ');

      const confidence = response.results
        .reduce((sum, r) => sum + (r.alternatives[0].confidence || 0.85), 0) / response.results.length;

      // Calcular custo: $0.024 per minute (enhanced model)
      // Estimar duração baseado em tamanho do áudio (aproximação)
      const estimatedDurationMinutes = audioBuffer.length / (1024 * 1024) * 2; // ~2 min per MB
      const custoUsd = estimatedDurationMinutes * 0.024;

      return {
        texto: fullTranscription,
        idioma: options?.idioma || 'pt-BR',
        duracao_segundos: Math.round(estimatedDurationMinutes * 60),
        confianca: confidence,
        custo_usd: custoUsd,
        tempo_processamento_ms: Date.now() - startTime,
        metadata: {
          provider: 'google',
          model: 'default',
          results_count: response.results.length,
        },
      };

    } catch (error) {
      if (error.code === 8) { // RESOURCE_EXHAUSTED
        throw new Error('Google Speech quota exceeded');
      }
      throw new Error(`Google Speech error: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Health check: tentar transcrever áudio vazio (fail gracefully)
      await this.client.recognize({
        audio: { content: Buffer.from('').toString('base64') },
        config: { encoding: 'MP3', languageCode: 'pt-BR' },
      });
      return true;
    } catch {
      return false;
    }
  }
}
```
**Then** o GoogleSpeechProvider está funcional

**Given** ambos providers estão implementados
**When** registro providers no módulo:
```typescript
@Module({
  providers: [
    WhisperProvider,
    GoogleSpeechProvider,
    {
      provide: 'WHISPER_PROVIDER',
      useClass: WhisperProvider,
    },
    {
      provide: 'GOOGLE_PROVIDER',
      useClass: GoogleSpeechProvider,
    },
    STTService,
    TranscricaoService,
  ],
  exports: [STTService, TranscricaoService],
})
export class STTModule {}
```
**Then** os providers estão disponíveis para injeção

**Given** tudo está registrado
**When** testo ambos providers:

**Whisper:**
1. Preparo áudio de teste (30s, mp3, 500KB)
2. Chamo `whisperProvider.transcribe(audioBuffer)`
3. Recebo transcrição: texto completo, duração ~30s, confiança ~0.92
4. Custo: $0.003 (30s = 0.5 min * $0.006/min)
5. Tempo de processamento: ~2-3s

**Google Speech:**
1. Preparo mesmo áudio de teste
2. Chamo `googleProvider.transcribe(audioBuffer)`
3. Recebo transcrição: texto completo, duração estimada ~30s, confiança ~0.88
4. Custo: $0.012 (estimativa)
5. Tempo de processamento: ~1-2s

**Comparação:**
- Whisper: mais barato (~75% menor custo), qualidade ligeiramente superior
- Google: mais rápido (~50% mais rápido), custo maior

**Then** ambos providers funcionam e métricas são registradas

---

### Story 4.3: Backend - Transcription Worker (Bull Queue)

As a **desenvolvedor**,
I want **worker assíncrono que processa transcrições em batch**,
So that **uploads não bloqueiam a aplicação e processamento escala horizontalmente**.

**Acceptance Criteria:**

**Given** o Bull queue está configurado (Epic 0)
**When** crio job `transcribe-aula` no queue:
```typescript
// aulas/aulas.service.ts
async enqueueTranscription(aulaId: string, priority: 'P1' | 'P2' = 'P2') {
  const priorityValue = priority === 'P1' ? 1 : 2;

  await this.bullQueue.add('transcribe-aula',
    { aulaId },
    {
      priority: priorityValue,
      attempts: 3, // Retry até 3 vezes
      backoff: {
        type: 'exponential',
        delay: 60000, // 1min, 2min, 4min
      },
      removeOnComplete: 100, // Manter últimos 100 completos
      removeOnFail: false, // Manter falhos para debug
    }
  );

  this.logger.log(`Job transcribe-aula enfileirado: aulaId=${aulaId}, priority=${priority}`);
}
```
**Then** jobs são enfileirados com retry e prioridade

**Given** os jobs são enfileirados
**When** crio `TranscriptionProcessor` worker:
```typescript
@Processor('default')
export class TranscriptionProcessor {
  constructor(
    private transcricaoService: TranscricaoService,
    private prisma: PrismaService,
    private logger: Logger,
  ) {}

  @Process('transcribe-aula')
  async handleTranscription(job: Job<{ aulaId: string }>) {
    const { aulaId } = job.data;
    this.logger.log(`Iniciando transcrição: aulaId=${aulaId}`);

    try {
      // Atualizar progresso: 0%
      await job.progress(0);

      // Buscar aula
      const aula = await this.prisma.aula.findUnique({ where: { id: aulaId } });
      if (!aula) {
        throw new Error(`Aula ${aulaId} não encontrada`);
      }

      // Validar estado
      if (aula.status_processamento !== 'AGUARDANDO_TRANSCRICAO') {
        this.logger.warn(`Aula ${aulaId} não está aguardando transcrição (status: ${aula.status_processamento})`);
        return; // Skip
      }

      // Atualizar progresso: 10% (baixando áudio)
      await job.progress(10);

      // Transcrever (STTService faz download + transcrição)
      const transcricao = await this.transcricaoService.transcribeAula(aulaId);

      // Atualizar progresso: 90% (salvando resultado)
      await job.progress(90);

      this.logger.log(`Transcrição concluída: aulaId=${aulaId}, provider=${transcricao.provider}`);

      // Enfileirar próximo job: análise pedagógica (Epic 5)
      await this.bullQueue.add('analyze-aula', { aulaId });

      // Atualizar progresso: 100%
      await job.progress(100);

      return { transcricaoId: transcricao.id, provider: transcricao.provider };

    } catch (error) {
      this.logger.error(`Erro na transcrição: aulaId=${aulaId}, error=${error.message}`);

      // Atualizar aula: status → ERRO
      await this.prisma.aula.update({
        where: { id: aulaId },
        data: {
          status_processamento: 'ERRO',
          // Opcional: armazenar mensagem de erro em campo separado
        },
      });

      // Re-lançar erro para Bull retry
      throw error;
    }
  }
}
```
**Then** o worker processa jobs com tracking de progresso

**Given** o worker existe
**When** configuro Bull para múltiplos workers:
```typescript
// app.module.ts
BullModule.forRoot({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: false,
  },
}),
BullModule.registerQueue({
  name: 'default',
  processors: [
    {
      name: 'transcribe-aula',
      concurrency: 3, // Processar até 3 transcrições simultaneamente
    },
  ],
}),
```
**Then** múltiplos jobs processam em paralelo

**Given** os workers estão configurados
**When** adiciono endpoint para reprocessar aula com erro:
```typescript
@Post('aulas/:id/reprocessar')
@Roles(Role.PROFESSOR)
async reprocessarAula(@Param('id') id: string, @CurrentUser() user) {
  const aula = await this.prisma.aula.findUnique({ where: { id } });

  // Validações
  if (!aula) throw new NotFoundException('Aula não encontrada');
  if (aula.professor_id !== user.id) throw new ForbiddenException();
  if (aula.status_processamento !== 'ERRO') {
    throw new BadRequestException('Apenas aulas com erro podem ser reprocessadas');
  }

  // Atualizar status: ERRO → AGUARDANDO_TRANSCRICAO
  await this.prisma.aula.update({
    where: { id },
    data: { status_processamento: 'AGUARDANDO_TRANSCRICAO' },
  });

  // Reenfileirar job
  await this.aulasService.enqueueTranscription(id);

  return { message: 'Aula adicionada à fila de processamento' };
}
```
**Then** aulas com erro podem ser reprocessadas

**Given** tudo está implementado
**When** testo o worker end-to-end:
1. Upload de áudio via TUS → aula criada (status: AGUARDANDO_TRANSCRICAO)
2. Job `transcribe-aula` enfileirado automaticamente (Epic 3, TUS onUploadFinish)
3. Worker processa job:
   - Progresso: 0% → 10% (baixando áudio)
   - Progresso: 10% → 90% (transcrevendo com Whisper)
   - Progresso: 90% → 100% (salvando resultado)
4. Transcricao criada no banco
5. Aula atualizada: status → TRANSCRITA, transcricao_id vinculado
6. Job `analyze-aula` enfileirado (para Epic 5)
7. Worker completa job com sucesso

**Teste de falha e retry:**
1. Mock WhisperProvider para falhar (rate limit)
2. Job tenta transcrição → falha
3. Bull faz retry automático após 1min
4. Mock WhisperProvider continua falhando
5. Retry 2 após 2min → falha
6. Retry 3 após 4min → falha
7. Job marcado como failed após 3 tentativas
8. Aula atualizada: status → ERRO
9. Professor vê aula com status "Erro" na listagem
10. Professor clica "Reprocessar" → job reenfileirado
11. Mock WhisperProvider para suceder
12. Job processa com sucesso → status → TRANSCRITA

**Then** o fluxo completo funciona com retry e reprocessamento

---

### Story 4.4: Backend - Notification System (Email/In-App)

As a **professor**,
I want **ser notificado quando minha aula for transcrita**,
So that **sei quando posso revisar o relatório sem precisar ficar atualizando a página**.

**Acceptance Criteria:**

**Given** preciso notificar professores
**When** crio entidade `Notificacao` no schema Prisma:
```prisma
model Notificacao {
  id           String   @id @default(uuid())
  usuario_id   String
  tipo         TipoNotificacao
  titulo       String
  mensagem     String
  lida         Boolean  @default(false)
  link         String?  // Deep link para ação relevante
  metadata_json Json?
  created_at   DateTime @default(now())

  usuario Usuario @relation(fields: [usuario_id], references: [id], onDelete: Cascade)

  @@index([usuario_id, lida, created_at])
}

enum TipoNotificacao {
  TRANSCRICAO_PRONTA
  ANALISE_PRONTA
  ERRO_PROCESSAMENTO
  SISTEMA
}
```
**Then** a entidade de notificações está modelada

**Given** a entidade existe
**When** crio `NotificacaoService`:
```typescript
@Injectable()
export class NotificacaoService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async notifyTranscricaoPronta(aulaId: string) {
    const aula = await this.prisma.aula.findUnique({
      where: { id: aulaId },
      include: { turma: true, professor: true },
    });

    if (!aula) return;

    // Criar notificação in-app
    await this.prisma.notificacao.create({
      data: {
        usuario_id: aula.professor_id,
        tipo: 'TRANSCRICAO_PRONTA',
        titulo: 'Transcrição pronta!',
        mensagem: `Sua aula de ${aula.turma.nome} (${new Date(aula.data).toLocaleDateString()}) foi transcrita e está pronta para análise.`,
        link: `/aulas/${aulaId}`,
        metadata_json: { aulaId, turmaId: aula.turma_id },
      },
    });

    // Enviar email (se professor tem notificações email habilitadas)
    const perfilUsuario = await this.prisma.perfilUsuario.findUnique({
      where: { usuario_id: aula.professor_id },
    });

    if (perfilUsuario.notificacoes_email) {
      await this.emailService.sendTranscricaoProntaEmail({
        to: aula.professor.email,
        professorNome: aula.professor.nome,
        turmaNome: aula.turma.nome,
        aulaData: aula.data,
        link: `${process.env.FRONTEND_URL}/aulas/${aulaId}`,
      });
    }
  }

  async getNotificacoes(usuarioId: string, options?: { limit?: number; offset?: number }) {
    return this.prisma.notificacao.findMany({
      where: { usuario_id: usuarioId },
      orderBy: { created_at: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });
  }

  async markAsRead(notificacaoId: string, usuarioId: string) {
    return this.prisma.notificacao.update({
      where: { id: notificacaoId, usuario_id: usuarioId },
      data: { lida: true },
    });
  }

  async markAllAsRead(usuarioId: string) {
    return this.prisma.notificacao.updateMany({
      where: { usuario_id: usuarioId, lida: false },
      data: { lida: true },
    });
  }

  async getUnreadCount(usuarioId: string): Promise<number> {
    return this.prisma.notificacao.count({
      where: { usuario_id: usuarioId, lida: false },
    });
  }
}
```
**Then** o service de notificações está funcional

**Given** o service existe
**When** integro notificação no worker de transcrição:
```typescript
@Process('transcribe-aula')
async handleTranscription(job: Job<{ aulaId: string }>) {
  const { aulaId } = job.data;

  try {
    // ... transcrição acontece (código anterior)

    // Notificar professor
    await this.notificacaoService.notifyTranscricaoPronta(aulaId);

    return { transcricaoId: transcricao.id };
  } catch (error) {
    // ... (código anterior)
  }
}
```
**Then** notificação é enviada automaticamente após transcrição

**Given** as notificações são criadas
**When** crio endpoints de notificações:
```typescript
@Get('notificacoes')
@Roles(Role.PROFESSOR, Role.COORDENADOR, Role.DIRETOR)
async getNotificacoes(@CurrentUser() user, @Query('limit') limit?: number, @Query('offset') offset?: number) {
  return this.notificacaoService.getNotificacoes(user.id, { limit, offset });
}

@Get('notificacoes/unread-count')
@Roles(Role.PROFESSOR, Role.COORDENADOR, Role.DIRETOR)
async getUnreadCount(@CurrentUser() user) {
  const count = await this.notificacaoService.getUnreadCount(user.id);
  return { count };
}

@Patch('notificacoes/:id/read')
@Roles(Role.PROFESSOR, Role.COORDENADOR, Role.DIRETOR)
async markAsRead(@Param('id') id: string, @CurrentUser() user) {
  return this.notificacaoService.markAsRead(id, user.id);
}

@Post('notificacoes/mark-all-read')
@Roles(Role.PROFESSOR, Role.COORDENADOR, Role.DIRETOR)
async markAllAsRead(@CurrentUser() user) {
  return this.notificacaoService.markAllAsRead(user.id);
}
```
**Then** endpoints de notificações estão disponíveis

**Given** os endpoints existem
**When** crio componente frontend de notificações:
- Badge no header com contador de não-lidas
- Dropdown com lista de notificações (últimas 10)
- Clicar em notificação → marca como lida + navega para link
- Botão "Marcar todas como lidas"
- Polling a cada 30s para atualizar contador (ou WebSocket)
**Then** UI de notificações está funcional

**Given** tudo está implementado
**When** testo o fluxo completo:
1. Upload de aula → job enfileirado
2. Worker processa transcrição
3. Transcrição completa → `notifyTranscricaoPronta` chamado
4. Notificação in-app criada no banco
5. Email enviado (se habilitado)
6. Frontend faz polling: GET /notificacoes/unread-count → retorna 1
7. Badge no header mostra "1"
8. Professor clica no badge → dropdown abre
9. Vê notificação: "Transcrição pronta! Sua aula de Turma 7A..."
10. Clica na notificação → marca como lida + navega para `/aulas/{id}`
11. Contador volta para 0
**Then** o sistema de notificações funciona end-to-end

**And** professor pode desabilitar notificações por email nas configurações

---

**Epic 4 COMPLETO!** ✅

**Resumo:**
- 4 stories criadas
- Transcrição completa: STT abstraction layer (multi-provider) + Whisper & Google Speech + Worker assíncrono (Bull) + Notificações (in-app + email)
- Failover automático: Whisper (primário, $0.36/h) → Google (fallback, $1.44/h)
- Retry com exponential backoff e reprocessamento manual
- Base para análise pedagógica (Epic 5) pronta

---

## Epic 5: Análise Pedagógica por IA (MOAT Técnico)

**Goal:** Sistema cruza transcrição com planejamento e BNCC, gerando análise pedagógica profunda (cobertura curricular, gaps, evidências literais) usando pipeline de 5 prompts especializados.

### Story 5.1: Backend - LLM Service Abstraction & Prompt Versioning

As a **desenvolvedor**,
I want **abstração para LLMs com versionamento de prompts e A/B testing**,
So that **posso melhorar prompts continuamente sem quebrar código e medir impacto de mudanças**.

**Acceptance Criteria:**

**Given** preciso armazenar prompts versionados
**When** crio entidade `Prompt` no schema Prisma:
```prisma
model Prompt {
  id              String   @id @default(uuid())
  nome            String   // "prompt-cobertura", "prompt-qualitativa", etc
  versao          String   // "v1.0.0", "v1.1.0", etc
  conteudo        String   @db.Text
  variaveis       Json?    // { transcricao, planejamento, habilidades, ... }
  modelo_sugerido ProviderLLM? // CLAUDE, GPT, GEMINI
  ativo           Boolean  @default(false)
  ab_testing      Boolean  @default(false) // Se true, usa split 50/50 com versão anterior
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  @@unique([nome, versao])
  @@index([nome, ativo])
}

enum ProviderLLM {
  CLAUDE_SONNET
  CLAUDE_HAIKU
  GPT4_TURBO
  GPT4_MINI
  GEMINI_PRO
  GEMINI_FLASH
}
```
**Then** prompts são armazenados e versionados no banco

**Given** a entidade existe
**When** crio interface comum para LLM providers:
```typescript
// llm/interfaces/llm-provider.interface.ts
export interface LLMResult {
  texto: string;
  provider: ProviderLLM;
  modelo: string;
  tokens_input: number;
  tokens_output: number;
  custo_usd: number;
  tempo_processamento_ms: number;
  metadata?: Record<string, any>;
}

export interface LLMProvider {
  getName(): ProviderLLM;
  generate(prompt: string, options?: GenerateOptions): Promise<LLMResult>;
  isAvailable(): Promise<boolean>;
}

export interface GenerateOptions {
  temperature?: number; // 0.0-1.0
  maxTokens?: number;
  systemPrompt?: string;
}
```
**Then** a interface define contrato comum para LLMs

**Given** a interface está definida
**When** crio `ClaudeProvider` implementando `LLMProvider`:
```typescript
@Injectable()
export class ClaudeProvider implements LLMProvider {
  private anthropic: Anthropic;

  constructor(private configService: ConfigService) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get('ANTHROPIC_API_KEY'),
    });
  }

  getName(): ProviderLLM {
    return ProviderLLM.CLAUDE_SONNET;
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<LLMResult> {
    const startTime = Date.now();

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514', // Claude 4.6 Sonnet
      max_tokens: options?.maxTokens || 4000,
      temperature: options?.temperature || 0.7,
      system: options?.systemPrompt,
      messages: [
        { role: 'user', content: prompt },
      ],
    });

    const texto = response.content[0].type === 'text' ? response.content[0].text : '';

    // Custos Claude 4.6 Sonnet: $3/1M input, $15/1M output
    const custoInput = (response.usage.input_tokens / 1_000_000) * 3;
    const custoOutput = (response.usage.output_tokens / 1_000_000) * 15;

    return {
      texto,
      provider: ProviderLLM.CLAUDE_SONNET,
      modelo: 'claude-sonnet-4',
      tokens_input: response.usage.input_tokens,
      tokens_output: response.usage.output_tokens,
      custo_usd: custoInput + custoOutput,
      tempo_processamento_ms: Date.now() - startTime,
      metadata: { stop_reason: response.stop_reason },
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      return true;
    } catch {
      return false;
    }
  }
}
```
**Then** o ClaudeProvider está funcional

**Given** o ClaudeProvider existe
**When** crio `GPTProvider` implementando `LLMProvider`:
```typescript
@Injectable()
export class GPTProvider implements LLMProvider {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  getName(): ProviderLLM {
    return ProviderLLM.GPT4_MINI;
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<LLMResult> {
    const startTime = Date.now();

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini', // GPT-4.6 mini
      max_tokens: options?.maxTokens || 4000,
      temperature: options?.temperature || 0.7,
      messages: [
        ...(options?.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
        { role: 'user' as const, content: prompt },
      ],
    });

    const texto = response.choices[0].message.content || '';

    // Custos GPT-4.6 mini: $0.15/1M input, $0.60/1M output
    const custoInput = (response.usage.prompt_tokens / 1_000_000) * 0.15;
    const custoOutput = (response.usage.completion_tokens / 1_000_000) * 0.60;

    return {
      texto,
      provider: ProviderLLM.GPT4_MINI,
      modelo: 'gpt-4o-mini',
      tokens_input: response.usage.prompt_tokens,
      tokens_output: response.usage.completion_tokens,
      custo_usd: custoInput + custoOutput,
      tempo_processamento_ms: Date.now() - startTime,
      metadata: { finish_reason: response.choices[0].finish_reason },
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      return true;
    } catch {
      return false;
    }
  }
}
```
**Then** o GPTProvider está funcional

**Given** ambos providers existem
**When** crio `PromptService` para gerenciar prompts versionados:
```typescript
@Injectable()
export class PromptService {
  constructor(private prisma: PrismaService) {}

  async getActivePrompt(nome: string): Promise<Prompt> {
    // Se há A/B testing ativo, escolher aleatoriamente entre 2 versões
    const promptsAtivos = await this.prisma.prompt.findMany({
      where: { nome, ativo: true },
      orderBy: { versao: 'desc' },
      take: 2,
    });

    if (promptsAtivos.length === 0) {
      throw new Error(`Nenhum prompt ativo encontrado para: ${nome}`);
    }

    // Se há 2 prompts ativos e ab_testing = true, escolher aleatoriamente (50/50)
    if (promptsAtivos.length === 2 && promptsAtivos[0].ab_testing) {
      return Math.random() < 0.5 ? promptsAtivos[0] : promptsAtivos[1];
    }

    // Caso contrário, retornar o mais recente
    return promptsAtivos[0];
  }

  async renderPrompt(prompt: Prompt, variaveis: Record<string, any>): Promise<string> {
    let conteudo = prompt.conteudo;

    // Substituir variáveis no template: {{variavel}} → valor
    for (const [key, value] of Object.entries(variaveis)) {
      const placeholder = `{{${key}}}`;
      conteudo = conteudo.replaceAll(placeholder, String(value));
    }

    return conteudo;
  }

  async createPrompt(data: {
    nome: string;
    versao: string;
    conteudo: string;
    variaveis?: any;
    modelo_sugerido?: ProviderLLM;
    ativo?: boolean;
    ab_testing?: boolean;
  }): Promise<Prompt> {
    return this.prisma.prompt.create({ data });
  }
}
```
**Then** o PromptService gerencia versionamento e A/B testing

**Given** tudo está implementado
**When** testo o fluxo de prompt versionado:
1. Crio prompt v1.0.0: `nome = "prompt-cobertura"`, `ativo = true`, `ab_testing = false`
2. Chamo `getActivePrompt("prompt-cobertura")` → retorna v1.0.0
3. Crio prompt v1.1.0: `ativo = true`, `ab_testing = true` (novo prompt para testar)
4. Chamo `getActivePrompt` 100x → ~50x retorna v1.0.0, ~50x retorna v1.1.0 (split 50/50)
5. Após validar que v1.1.0 é melhor (taxa de aprovação maior), desativo v1.0.0
6. Chamo `getActivePrompt` → sempre retorna v1.1.0
7. Renderizo prompt com variáveis: `{{transcricao}}`, `{{planejamento}}` → substitui valores
**Then** o sistema de versionamento e A/B testing funciona

---

### Story 5.2: Backend - Pipeline Serial de 5 Prompts (Orquestrador)

As a **desenvolvedor**,
I want **orquestrador que executa pipeline serial de 5 prompts com contexto acumulativo**,
So that **cada prompt vê outputs anteriores e análise é construída incrementalmente**.

**Acceptance Criteria:**

**Given** preciso armazenar resultados da análise
**When** crio entidade `Analise` no schema Prisma:
```prisma
model Analise {
  id                       String   @id @default(uuid())
  aula_id                  String   @unique
  transcricao_id           String
  planejamento_id          String?

  // Outputs dos 5 prompts
  cobertura_json           Json     // Prompt 1: { habilidades: [ { id, nivel, evidencias: [] } ] }
  analise_qualitativa_json Json     // Prompt 2: { bloom_levels, metodologias, adequacao_cognitiva, sinais_engajamento }
  relatorio_texto          String   @db.Text // Prompt 3: Relatório narrativo formatado
  exercicios_json          Json     // Prompt 4: [ { enunciado, gabarito, nivel_bloom, ... } ]
  alertas_json             Json     // Prompt 5: [ { tipo, nivel, mensagem, ... } ]

  // Metadata
  prompt_versoes_json      Json     // { cobertura: "v1.0.0", qualitativa: "v1.1.0", ... }
  custo_total_usd          Float
  tempo_processamento_ms   Int

  created_at               DateTime @default(now())
  updated_at               DateTime @updatedAt

  aula         Aula         @relation(fields: [aula_id], references: [id], onDelete: Cascade)
  transcricao  Transcricao  @relation(fields: [transcricao_id], references: [id])
  planejamento Planejamento? @relation(fields: [planejamento_id], references: [id])

  @@index([aula_id])
}
```
**Then** a entidade Analise armazena outputs do pipeline

**Given** a entidade existe
**When** crio `AnaliseService` orquestrador:
```typescript
@Injectable()
export class AnaliseService {
  constructor(
    private prisma: PrismaService,
    private promptService: PromptService,
    private claudeProvider: ClaudeProvider,
    private gptProvider: GPTProvider,
    private logger: Logger,
  ) {}

  async analisarAula(aulaId: string): Promise<Analise> {
    this.logger.log(`Iniciando análise pedagógica: aulaId=${aulaId}`);
    const startTime = Date.now();

    // 1. Buscar dados necessários
    const aula = await this.prisma.aula.findUnique({
      where: { id: aulaId },
      include: {
        transcricao: true,
        planejamento: {
          include: {
            habilidades: {
              include: { habilidade: true },
            },
          },
        },
        turma: true,
      },
    });

    if (!aula || !aula.transcricao) {
      throw new Error('Aula ou transcrição não encontrada');
    }

    // Contexto acumulativo (cada prompt vê outputs anteriores)
    const contexto: any = {
      transcricao: aula.transcricao.texto,
      turma: {
        nome: aula.turma.nome,
        disciplina: aula.turma.disciplina,
        serie: aula.turma.serie,
      },
      planejamento: aula.planejamento ? {
        habilidades: aula.planejamento.habilidades.map(ph => ({
          codigo: ph.habilidade.codigo,
          descricao: ph.habilidade.descricao,
          unidade_tematica: ph.habilidade.unidade_tematica,
        })),
      } : null,
    };

    let custoTotal = 0;
    const promptVersoes: any = {};

    // 2. PROMPT 1: Análise de Cobertura BNCC
    const { output: coberturaOutput, custo: custo1, versao: versao1 } = await this.executePrompt(
      'prompt-cobertura',
      contexto,
      this.claudeProvider, // Claude para análise pedagógica
    );
    contexto.cobertura = coberturaOutput;
    custoTotal += custo1;
    promptVersoes.cobertura = versao1;

    // 3. PROMPT 2: Análise Qualitativa
    const { output: qualitativaOutput, custo: custo2, versao: versao2 } = await this.executePrompt(
      'prompt-qualitativa',
      contexto,
      this.claudeProvider,
    );
    contexto.analise_qualitativa = qualitativaOutput;
    custoTotal += custo2;
    promptVersoes.qualitativa = versao2;

    // 4. PROMPT 3: Geração de Relatório
    const { output: relatorioOutput, custo: custo3, versao: versao3 } = await this.executePrompt(
      'prompt-relatorio',
      contexto,
      this.claudeProvider,
    );
    custoTotal += custo3;
    promptVersoes.relatorio = versao3;

    // 5. PROMPT 4: Geração de Exercícios (GPT-4 mini - mais barato)
    const { output: exerciciosOutput, custo: custo4, versao: versao4 } = await this.executePrompt(
      'prompt-exercicios',
      contexto,
      this.gptProvider, // GPT mini para tarefa mais simples
    );
    custoTotal += custo4;
    promptVersoes.exercicios = versao4;

    // 6. PROMPT 5: Detecção de Alertas
    const { output: alertasOutput, custo: custo5, versao: versao5 } = await this.executePrompt(
      'prompt-alertas',
      contexto,
      this.claudeProvider,
    );
    custoTotal += custo5;
    promptVersoes.alertas = versao5;

    // 7. Salvar análise completa
    const analise = await this.prisma.analise.create({
      data: {
        aula_id: aulaId,
        transcricao_id: aula.transcricao.id,
        planejamento_id: aula.planejamento?.id,
        cobertura_json: coberturaOutput,
        analise_qualitativa_json: qualitativaOutput,
        relatorio_texto: relatorioOutput,
        exercicios_json: exerciciosOutput,
        alertas_json: alertasOutput,
        prompt_versoes_json: promptVersoes,
        custo_total_usd: custoTotal,
        tempo_processamento_ms: Date.now() - startTime,
      },
    });

    // 8. Atualizar aula: status → ANALISADA
    await this.prisma.aula.update({
      where: { id: aulaId },
      data: {
        status_processamento: 'ANALISADA',
        analise_id: analise.id,
      },
    });

    this.logger.log(`Análise concluída: aulaId=${aulaId}, custo=$${custoTotal.toFixed(4)}, tempo=${Date.now() - startTime}ms`);

    return analise;
  }

  private async executePrompt(
    nomePrompt: string,
    contexto: any,
    provider: LLMProvider,
  ): Promise<{ output: any; custo: number; versao: string }> {
    // Buscar prompt ativo (com A/B testing se habilitado)
    const prompt = await this.promptService.getActivePrompt(nomePrompt);

    // Renderizar prompt com variáveis do contexto
    const promptRendered = await this.promptService.renderPrompt(prompt, contexto);

    // Executar LLM
    const result = await provider.generate(promptRendered, {
      temperature: 0.7,
      maxTokens: 4000,
    });

    // Parse JSON output (assumindo que prompts retornam JSON)
    let output;
    try {
      output = JSON.parse(result.texto);
    } catch {
      // Se não é JSON, retornar texto puro
      output = result.texto;
    }

    return {
      output,
      custo: result.custo_usd,
      versao: prompt.versao,
    };
  }
}
```
**Then** o orquestrador executa pipeline serial completo

**Given** o orquestrador está implementado
**When** testo o pipeline end-to-end:
1. Aula com transcrição pronta (status: TRANSCRITA)
2. Chamo `analiseService.analisarAula(aulaId)`
3. Pipeline executa sequencialmente:
   - Prompt 1 (Cobertura) → JSON com habilidades classificadas
   - Prompt 2 (Qualitativa) → JSON com análise pedagógica
   - Prompt 3 (Relatório) → Texto formatado em markdown
   - Prompt 4 (Exercícios) → JSON com array de exercícios
   - Prompt 5 (Alertas) → JSON com array de alertas
4. Analise completa salva no banco
5. Aula atualizada: status → ANALISADA
6. Custo total: ~$0.10-0.15 (Claude ~$0.08 + GPT mini ~$0.02)
7. Tempo total: ~45-60s (5 prompts seriais)
**Then** o pipeline funciona end-to-end

---

### Story 5.3: Backend - Prompts 1-2 (Cobertura BNCC + Análise Qualitativa)

As a **desenvolvedor**,
I want **implementação dos prompts de cobertura BNCC e análise qualitativa**,
So that **sistema identifica o que foi ensinado e como foi ensinado com fundamentação pedagógica**.

**Acceptance Criteria:**

**Given** preciso dos prompts 1 e 2
**When** crio seed para **Prompt 1 - Análise de Cobertura BNCC**:
```typescript
await promptService.createPrompt({
  nome: 'prompt-cobertura',
  versao: 'v1.0.0',
  conteudo: `
Você é um especialista em análise pedagógica e BNCC (Base Nacional Comum Curricular).

**TAREFA:** Analise a transcrição da aula abaixo e identifique quais habilidades BNCC foram abordadas.

**TRANSCRIÇÃO DA AULA:**
{{transcricao}}

**HABILIDADES PLANEJADAS (do planejamento do professor):**
{{planejamento}}

**SÉRIE:** {{turma.serie}}º ano
**DISCIPLINA:** {{turma.disciplina}}

**INSTRUÇÕES:**
1. Para cada habilidade planejada, classifique o nível de cobertura:
   - COMPLETE: Habilidade foi abordada completamente com profundidade adequada
   - PARTIAL: Habilidade foi abordada parcialmente (introduzida ou revisada superficialmente)
   - MENTIONED: Habilidade foi apenas mencionada de passagem
   - NOT_COVERED: Habilidade não foi abordada nesta aula

2. Para cada habilidade coberta (COMPLETE, PARTIAL, MENTIONED), extraia evidências LITERAIS da transcrição.
   IMPORTANTE: Use trechos exatos da transcrição, não paráfrases.

3. Se identificar habilidades fora do planejamento que foram abordadas, liste-as também.

**OUTPUT ESPERADO (JSON):**
{
  "habilidades": [
    {
      "codigo": "EF06MA01",
      "nivel_cobertura": "COMPLETE" | "PARTIAL" | "MENTIONED" | "NOT_COVERED",
      "evidencias": [
        "Trecho literal da transcrição que comprova a cobertura...",
        "Outro trecho literal..."
      ],
      "timestamp_estimado": "00:05:30" // Opcional: estimativa de quando foi abordado
    }
  ],
  "habilidades_extras": [
    {
      "codigo": "EF06MA02",
      "descricao": "Breve descrição",
      "nivel_cobertura": "PARTIAL",
      "evidencias": [...]
    }
  ]
}
`,
  variaveis: { transcricao: '', planejamento: '', turma: {} },
  modelo_sugerido: ProviderLLM.CLAUDE_SONNET,
  ativo: true,
  ab_testing: false,
});
```
**Then** o Prompt 1 está seedado e pronto para uso

**Given** o Prompt 1 existe
**When** crio seed para **Prompt 2 - Análise Qualitativa**:
```typescript
await promptService.createPrompt({
  nome: 'prompt-qualitativa',
  versao: 'v1.0.0',
  conteudo: `
Você é um especialista em pedagogia e análise qualitativa de aulas.

**TAREFA:** Analise a transcrição da aula e forneça insights qualitativos sobre metodologia, níveis cognitivos e sinais de engajamento.

**TRANSCRIÇÃO DA AULA:**
{{transcricao}}

**COBERTURA BNCC (análise anterior):**
{{cobertura}}

**SÉRIE:** {{turma.serie}}º ano
**DISCIPLINA:** {{turma.disciplina}}

**INSTRUÇÕES:**

1. **Taxonomia de Bloom:** Identifique os níveis cognitivos dominantes na aula:
   - Nível 1 (Lembrar): Memorização, recitação de fatos
   - Nível 2 (Entender): Explicação, interpretação
   - Nível 3 (Aplicar): Uso de conhecimento em situações práticas
   - Nível 4 (Analisar): Decomposição, comparação
   - Nível 5 (Avaliar): Julgamento crítico
   - Nível 6 (Criar): Produção de algo novo

2. **Metodologias Detectadas:**
   - Expositiva (professor explica)
   - Investigativa (alunos exploram/descobrem)
   - Colaborativa (trabalho em grupo)
   - Prática (exercícios, aplicação)
   - % estimado de cada metodologia

3. **Adequação Cognitiva:** A linguagem e abordagem são adequadas para a série?
   - Muito infantil / Adequada / Muito abstrata

4. **Sinais de Engajamento:** Detecte sinais na transcrição:
   - Perguntas dos alunos (indica curiosidade)
   - Discussões ativas
   - Silêncio prolongado (pode indicar desengajamento ou dificuldade)
   - Interrupções ou dispersão

**OUTPUT ESPERADO (JSON):**
{
  "bloom_levels": {
    "dominantes": ["Nível 2", "Nível 3"],
    "percentual_estimado": { "nivel_1": 20, "nivel_2": 50, "nivel_3": 30, ... },
    "observacao": "Aula focada em compreensão e aplicação, pouca memorização"
  },
  "metodologias": {
    "expositiva": 60,
    "investigativa": 10,
    "colaborativa": 0,
    "pratica": 30
  },
  "adequacao_cognitiva": "adequada" | "muito_infantil" | "muito_abstrata",
  "sinais_engajamento": {
    "nivel": "alto" | "medio" | "baixo",
    "evidencias": [
      "Alunos fizeram 5 perguntas durante a explicação...",
      "Discussão ativa sobre exercício 3..."
    ],
    "preocupacoes": [
      "Silêncio prolongado após introdução de equações (min 15-20)"
    ]
  }
}
`,
  variaveis: { transcricao: '', cobertura: '', turma: {} },
  modelo_sugerido: ProviderLLM.CLAUDE_SONNET,
  ativo: true,
  ab_testing: false,
});
```
**Then** o Prompt 2 está seedado e pronto para uso

**Given** ambos prompts existem
**When** testo Prompt 1 com transcrição real:
1. Transcrição: Aula de matemática 6º ano sobre números naturais (45min)
2. Planejamento: Habilidades EF06MA01, EF06MA02, EF06MA03
3. Executo Prompt 1 → recebo JSON:
   - EF06MA01: COMPLETE, evidências: ["Vamos comparar esses números...", "Quem consegue ordenar?"]
   - EF06MA02: PARTIAL, evidências: ["Falamos rapidamente sobre múltiplos..."]
   - EF06MA03: NOT_COVERED
4. Validação: evidências são literais (não parafraseadas) ✅
5. Validação: classificação faz sentido (revisão manual) ✅
**Then** o Prompt 1 produz output estruturado e útil

**Given** o Prompt 1 funciona
**When** testo Prompt 2 com mesma transcrição:
1. Contexto inclui output do Prompt 1
2. Executo Prompt 2 → recebo JSON:
   - bloom_levels: dominantes ["Nível 2", "Nível 3"], 50% compreensão, 30% aplicação
   - metodologias: 60% expositiva, 30% prática, 10% investigativa
   - adequacao_cognitiva: "adequada"
   - sinais_engajamento: nível "alto", evidências de perguntas dos alunos
3. Validação: análise pedagógica faz sentido (revisão com coordenador pedagógico) ✅
**Then** o Prompt 2 fornece insights qualitativos profundos

---

### Story 5.4: Backend - Prompts 3-4 (Relatório + Exercícios)

As a **desenvolvedor**,
I want **implementação dos prompts de relatório e exercícios**,
So that **professor recebe relatório narrativo e exercícios contextuais prontos para usar**.

**Acceptance Criteria:**

**Given** os outputs dos Prompts 1-2 existem no contexto
**When** crio seed para **Prompt 3 - Geração de Relatório**:
```typescript
await promptService.createPrompt({
  nome: 'prompt-relatorio',
  versao: 'v1.0.0',
  conteudo: `
Você é um assistente pedagógico que escreve relatórios claros e acionáveis para professores.

**TAREFA:** Gere um relatório narrativo da aula baseado nas análises anteriores.

**ANÁLISE DE COBERTURA:**
{{cobertura}}

**ANÁLISE QUALITATIVA:**
{{analise_qualitativa}}

**TURMA:** {{turma.nome}} - {{turma.serie}}º ano
**DATA:** {{data}}

**INSTRUÇÕES:**

1. Escreva um relatório estruturado com as seguintes seções:

   **a) Resumo Executivo** (2-3 frases)
   - O que foi ensinado (habilidades cobertas)
   - Como foi ensinado (metodologias dominantes)

   **b) Cobertura Curricular**
   - Liste habilidades COMPLETAS e PARCIAIS com descrição breve
   - Destaque habilidades NÃO COBERTAS (se houver)

   **c) Análise Pedagógica**
   - Níveis de Bloom predominantes
   - Metodologias usadas
   - Adequação cognitiva

   **d) Sinais de Engajamento**
   - Resumo do nível de engajamento
   - Evidências positivas ou preocupações

   **e) Próximos Passos** (opcional)
   - Sugestões rápidas baseadas nos gaps

2. Tom: Profissional mas acolhedor. Sem julgamentos ("faltou X"), usar "oportunidade de reforçar X".

3. Formato: Markdown, uso de negrito e listas.

**OUTPUT ESPERADO (Markdown):**
# Relatório da Aula - [Turma] - [Data]

## Resumo Executivo
[2-3 frases sobre o que foi coberto e como]

## Cobertura Curricular
✅ **EF06MA01** - [Descrição breve] - Abordado completamente
⚠️ **EF06MA02** - [Descrição] - Abordado parcialmente
❌ **EF06MA03** - [Descrição] - Não abordado nesta aula

## Análise Pedagógica
...

## Sinais de Engajamento
...

## Próximos Passos
...
`,
  variaveis: { cobertura: '', analise_qualitativa: '', turma: {}, data: '' },
  modelo_sugerido: ProviderLLM.CLAUDE_SONNET,
  ativo: true,
});
```
**Then** o Prompt 3 está seedado

**Given** o Prompt 3 existe
**When** crio seed para **Prompt 4 - Geração de Exercícios**:
```typescript
await promptService.createPrompt({
  nome: 'prompt-exercicios',
  versao: 'v1.0.0',
  conteudo: `
Você é um professor experiente que cria exercícios contextuais baseados no conteúdo real da aula.

**TAREFA:** Gere 3-5 exercícios baseados no que foi realmente ensinado nesta aula.

**TRANSCRIÇÃO DA AULA:**
{{transcricao}}

**COBERTURA BNCC:**
{{cobertura}}

**SÉRIE:** {{turma.serie}}º ano
**DISCIPLINA:** {{turma.disciplina}}

**INSTRUÇÕES:**

1. Crie exercícios que usem conceitos/exemplos MENCIONADOS NA AULA (não genéricos).
2. Variar níveis de Bloom:
   - 2 exercícios Nível 2 (Entender/Aplicar) - mais fáceis
   - 2 exercícios Nível 3-4 (Aplicar/Analisar) - intermediários
   - 1 exercício Nível 4-5 (Analisar/Avaliar) - desafiador
3. Adequar linguagem para a série.
4. Incluir gabarito com resolução passo-a-passo.

**OUTPUT ESPERADO (JSON):**
{
  "exercicios": [
    {
      "numero": 1,
      "enunciado": "Considerando os números que vimos na aula (15, 23, 8, 42)...",
      "nivel_bloom": "Nível 2",
      "dificuldade": "facil" | "medio" | "dificil",
      "gabarito": {
        "resposta_curta": "8, 15, 23, 42",
        "resolucao": "Passo 1: ...\nPasso 2: ..."
      },
      "habilidade_relacionada": "EF06MA01"
    },
    ...
  ]
}
`,
  variaveis: { transcricao: '', cobertura: '', turma: {} },
  modelo_sugerido: ProviderLLM.GPT4_MINI, // Mais barato, tarefa mais simples
  ativo: true,
});
```
**Then** o Prompt 4 está seedado

**Given** ambos prompts existem
**When** testo Prompt 3:
1. Contexto inclui outputs Prompts 1-2
2. Executo Prompt 3 → recebo relatório em Markdown
3. Validação: estrutura correta (seções presentes) ✅
4. Validação: tom acolhedor, sem julgamentos ✅
5. Validação: informações precisas (baseadas em análises anteriores) ✅
**Then** o Prompt 3 gera relatório profissional

**Given** o Prompt 3 funciona
**When** testo Prompt 4:
1. Contexto inclui transcrição + cobertura
2. Executo Prompt 4 → recebo JSON com 5 exercícios
3. Validação: exercícios usam exemplos da aula (não genéricos) ✅
4. Validação: níveis de Bloom variados ✅
5. Validação: gabaritos corretos (revisão manual) ✅
6. Validação: linguagem adequada para 6º ano ✅
**Then** o Prompt 4 gera exercícios contextuais de qualidade

---

### Story 5.5: Backend - Prompt 5 + Analysis Worker (Alertas + Integração)

As a **desenvolvedor**,
I want **implementação do prompt de alertas e worker assíncrono que orquestra tudo**,
So that **sistema detecta gaps críticos e processa análises em batch sem bloquear aplicação**.

**Acceptance Criteria:**

**Given** os outputs dos Prompts 1-4 existem
**When** crio seed para **Prompt 5 - Detecção de Alertas**:
```typescript
await promptService.createPrompt({
  nome: 'prompt-alertas',
  versao: 'v1.0.0',
  conteudo: `
Você é um sistema de alertas pedagógicos que identifica situações que merecem atenção.

**TAREFA:** Detecte alertas baseados nas análises anteriores.

**COBERTURA BNCC:**
{{cobertura}}

**ANÁLISE QUALITATIVA:**
{{analise_qualitativa}}

**PLANEJAMENTO:**
{{planejamento}}

**INSTRUÇÕES:**

Identifique alertas nos seguintes níveis:
- INFO: Informativo, não requer ação imediata
- WARNING: Atenção recomendada
- CRITICAL: Requer ação urgente

**Tipos de alertas a detectar:**

1. **Gap Curricular:** Habilidade planejada não coberta por 2+ aulas consecutivas
2. **Atraso no Ritmo:** % cobertura do bimestre abaixo do esperado
3. **Metodologia Desequilibrada:** >80% expositiva (sinal de desengajamento potencial)
4. **Níveis de Bloom Baixos:** >70% da aula em Nível 1-2 (apenas memorização)
5. **Sinais de Dificuldade:** Engajamento baixo + linguagem muito abstrata
6. **Habilidades Extras:** Abordou habilidades fora do planejamento (pode ser positivo ou desvio)

**OUTPUT ESPERADO (JSON):**
{
  "alertas": [
    {
      "tipo": "gap_curricular" | "atraso_ritmo" | "metodologia_desequilibrada" | ...,
      "nivel": "INFO" | "WARNING" | "CRITICAL",
      "titulo": "Gap detectado: EF06MA03 não coberto",
      "mensagem": "A habilidade EF06MA03 estava planejada mas não foi abordada nesta aula...",
      "acoes_sugeridas": [
        "Considere abordar na próxima aula",
        "Verifique se há tempo hábil no bimestre"
      ],
      "metadata": {
        "habilidade_id": "EF06MA03",
        ...
      }
    },
    ...
  ]
}
`,
  variaveis: { cobertura: '', analise_qualitativa: '', planejamento: '' },
  modelo_sugerido: ProviderLLM.CLAUDE_SONNET,
  ativo: true,
});
```
**Then** o Prompt 5 está seedado

**Given** o Prompt 5 existe
**When** crio `AnalysisProcessor` worker Bull:
```typescript
@Processor('default')
export class AnalysisProcessor {
  constructor(
    private analiseService: AnaliseService,
    private prisma: PrismaService,
    private notificacaoService: NotificacaoService,
    private logger: Logger,
  ) {}

  @Process('analyze-aula')
  async handleAnalysis(job: Job<{ aulaId: string }>) {
    const { aulaId } = job.data;
    this.logger.log(`Iniciando análise pedagógica: aulaId=${aulaId}`);

    try {
      await job.progress(0);

      // Buscar aula
      const aula = await this.prisma.aula.findUnique({ where: { id: aulaId } });
      if (!aula) throw new Error(`Aula ${aulaId} não encontrada`);

      // Validar estado
      if (aula.status_processamento !== 'TRANSCRITA') {
        this.logger.warn(`Aula ${aulaId} não está transcrita (status: ${aula.status_processamento})`);
        return;
      }

      // Atualizar status: TRANSCRITA → ANALISANDO
      await this.prisma.aula.update({
        where: { id: aulaId },
        data: { status_processamento: 'ANALISANDO' },
      });

      await job.progress(10);

      // Executar pipeline completo (5 prompts)
      const analise = await this.analiseService.analisarAula(aulaId);

      await job.progress(90);

      this.logger.log(`Análise concluída: aulaId=${aulaId}, custo=$${analise.custo_total_usd.toFixed(4)}`);

      // Notificar professor (análise pronta para revisão)
      await this.notificacaoService.notifyAnalisePronta(aulaId);

      await job.progress(100);

      return { analiseId: analise.id };

    } catch (error) {
      this.logger.error(`Erro na análise: aulaId=${aulaId}, error=${error.message}`);

      // Atualizar aula: status → ERRO
      await this.prisma.aula.update({
        where: { id: aulaId },
        data: { status_processamento: 'ERRO' },
      });

      throw error;
    }
  }
}
```
**Then** o worker processa análises assincronamente

**Given** o worker está implementado
**When** testo Prompt 5:
1. Contexto inclui outputs Prompts 1-4
2. Cenário: EF06MA03 não coberto (estava no planejamento)
3. Executo Prompt 5 → recebo JSON com alerta:
   - tipo: "gap_curricular"
   - nivel: "WARNING"
   - mensagem: "Habilidade EF06MA03 não abordada..."
   - acoes_sugeridas: ["Considere reforçar na próxima aula"]
4. Validação: alerta é relevante e acionável ✅
**Then** o Prompt 5 detecta alertas corretamente

**Given** todo o pipeline está implementado
**When** testo o fluxo end-to-end completo (Épico 3 → 4 → 5):
1. Upload de áudio (Epic 3) → aula criada (AGUARDANDO_TRANSCRICAO)
2. Worker transcribe-aula (Epic 4) → transcrição completa (TRANSCRITA)
3. Job analyze-aula enfileirado automaticamente
4. Worker analyze-aula (Epic 5) processa:
   - Progresso: 0% → 10% (preparando)
   - Prompt 1 (Cobertura) → 20%
   - Prompt 2 (Qualitativa) → 40%
   - Prompt 3 (Relatório) → 60%
   - Prompt 4 (Exercícios) → 80%
   - Prompt 5 (Alertas) → 90%
   - Salvando → 100%
5. Analise completa salva no banco
6. Aula atualizada: status → ANALISADA
7. Notificação enviada: "Sua aula está pronta para revisão!"
8. Professor acessa `/aulas/{id}` → vê relatório + exercícios (Epic 6)
**Then** o fluxo completo funciona end-to-end através de 3 épicos

---

**Epic 5 COMPLETO!** ✅

**Resumo:**
- 5 stories criadas
- MOAT Técnico implementado: Pipeline de 5 prompts pedagógicos especializados
- LLM abstraction layer (Claude/GPT/Gemini) + Prompt versionamento + A/B testing
- Prompts fundamen tados: Cobertura BNCC, Taxonomia de Bloom, Metodologias, Evidências Literais
- Custo otimizado: Claude (~$0.10/aula) + GPT mini (~$0.02/aula) = ~$0.12/aula
- Worker assíncrono processa análises em ~45-60s
- Base para aprovação do professor (Epic 6) pronta

---

## Epic 6: Relatórios & Exercícios para Professor

**Goal:** Professor recebe, visualiza, edita e aprova relatórios pedagógicos gerados por IA, com acesso a exercícios contextuais, sugestões para próxima aula e dashboard pessoal de cobertura curricular.

**User Outcome:** Professor consome outputs da análise pedagógica de forma eficiente, aprova relatórios com edições mínimas (>90% utilizáveis), e acompanha sua própria cobertura curricular em tempo real.

**FRs covered:** FR23, FR24, FR25, FR26, FR27, FR28, FR29

**Key Deliverables:**
- Visualização estruturada do relatório completo (cobertura BNCC, análise qualitativa, evidências, alertas)
- Workflow de aprovação: Editor rich-text → Salvar draft → Aprovar/Rejeitar
- Diff tracking (gerado vs editado) - feedback implícito para melhorar prompts
- Visualização e edição de exercícios contextuais (WYSIWYG editor)
- Sugestões para próxima aula (baseadas em gaps e planejamento)
- Dashboard pessoal: % cobertura bimestral, habilidades trabalhadas vs planejadas, gráfico temporal

**Technical Notes:**
- Frontend: shadcn/ui components (Card, Tabs, Sheet, Badge, Button, Progress)
- Rich-text editor: TipTap ou Slate.js (markdown-compatible)
- Diff tracking: biblioteca `diff` (Google Diff Match Patch) para gerar patches
- Backend: Endpoints RESTful para CRUD de análises e métricas
- Database: Campos `relatorio_original`, `relatorio_editado`, `exercicios_original`, `exercicios_editado` (JSON) em `Analise`

---

### Story 6.1: Visualização de Análise Completa

As a **Professor**,
I want **visualizar o relatório completo da análise pedagógica da minha aula**,
So that **posso revisar a cobertura BNCC, análise qualitativa, evidências e alertas antes de aprovar**.

**Acceptance Criteria:**

**Given** o schema Prisma tem a entidade `Analise` completa (criada no Epic 5):
```prisma
model Analise {
  id                    String   @id @default(uuid())
  aula_id               String   @unique
  aula                  Relacao  Aula @relation(fields: [aula_id], references: [id], onDelete: Cascade)

  // Outputs dos 5 prompts
  cobertura_bncc        Json     // Prompt 1
  analise_qualitativa   Json     // Prompt 2
  relatorio_original    Json     // Prompt 3 (output inicial)
  relatorio_editado     Json?    // Versão editada pelo professor
  exercicios_original   Json     // Prompt 4
  exercicios_editado    Json?    // Versão editada pelo professor
  sugestoes_proxima     Json     // Prompt 5 (parte - sugestões)
  alertas               Json     // Prompt 5 (parte - alertas)

  // Metadata
  tempo_processamento   Int      // Segundos
  custo_estimado        Decimal  @db.Decimal(10, 4) // Em reais (R$)
  provider_usado        ProviderLLM
  prompt_versao         String   // Ex: "v1.0.0"

  // Workflow de aprovação
  status                StatusAnalise @default(AGUARDANDO_REVISAO)
  aprovado_em           DateTime?
  rejeitado_em          DateTime?
  tempo_revisao         Int?     // Segundos entre análise pronta e aprovação

  escola_id             String
  escola                Escola   @relation(fields: [escola_id], references: [id])

  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt

  @@index([escola_id])
  @@index([status])
}

enum StatusAnalise {
  AGUARDANDO_REVISAO
  APROVADO
  REJEITADO
}
```
**When** confirmo que o schema existe
**Then** a entidade Analise está pronta

**Given** a entidade `Analise` existe
**When** crio endpoint `GET /api/v1/aulas/{aulaId}/analise`:
```typescript
// analises.controller.ts
@Get(':aulaId/analise')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PROFESSOR')
async getAnaliseByAula(
  @Param('aulaId') aulaId: string,
  @CurrentUser() user: Usuario,
) {
  // Verificar: aula pertence ao professor
  const aula = await this.aulasService.findOne(aulaId, user.escola_id);
  if (aula.professor_id !== user.id) {
    throw new ForbiddenException('Você não tem acesso a esta aula');
  }

  // Buscar análise
  const analise = await this.analisesService.findByAulaId(aulaId, user.escola_id);
  if (!analise) {
    throw new NotFoundException('Análise não encontrada');
  }

  // Retornar análise completa
  return {
    id: analise.id,
    aula: {
      id: aula.id,
      titulo: aula.titulo,
      data_aula: aula.data_aula,
      turma: aula.turma.nome,
    },
    cobertura_bncc: analise.cobertura_bncc,
    analise_qualitativa: analise.analise_qualitativa,
    relatorio: analise.relatorio_editado || analise.relatorio_original, // Priorizar editado
    exercicios: analise.exercicios_editado || analise.exercicios_original,
    sugestoes_proxima: analise.sugestoes_proxima,
    alertas: analise.alertas,
    status: analise.status,
    metadata: {
      tempo_processamento: analise.tempo_processamento,
      custo_estimado: analise.custo_estimado,
      provider_usado: analise.provider_usado,
      created_at: analise.created_at,
    },
  };
}
```
**Then** o endpoint retorna análise completa com relatório priorizado (editado > original)

**Given** o endpoint existe
**When** testo com usuário autenticado:
```bash
GET /api/v1/aulas/{aulaId}/analise
Authorization: Bearer {token}
```
**Then** recebo `200 OK` com JSON estruturado

**Given** testo com professor que NÃO é dono da aula
**When** faço GET com token de outro professor
**Then** recebo `403 Forbidden`

**Given** o endpoint funciona
**When** crio página frontend `/aulas/{aulaId}/analise`:
```tsx
// pages/AulaAnalise.tsx
export function AulaAnalisePage() {
  const { aulaId } = useParams();
  const { data: analise, isLoading } = useQuery(['analise', aulaId], () =>
    api.get(`/aulas/${aulaId}/analise`).then(res => res.data)
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header com info da aula */}
      <AulaHeader aula={analise.aula} />

      {/* Tabs: Relatório | Exercícios | Sugestões */}
      <Tabs defaultValue="relatorio">
        <TabsList>
          <TabsTrigger value="relatorio">Relatório Pedagógico</TabsTrigger>
          <TabsTrigger value="exercicios">Exercícios</TabsTrigger>
          <TabsTrigger value="sugestoes">Sugestões</TabsTrigger>
        </TabsList>

        <TabsContent value="relatorio">
          <RelatorioTab analise={analise} />
        </TabsContent>

        <TabsContent value="exercicios">
          <ExerciciosTab exercicios={analise.exercicios} />
        </TabsContent>

        <TabsContent value="sugestoes">
          <SugestoesTab sugestoes={analise.sugestoes_proxima} />
        </TabsContent>
      </Tabs>

      {/* Alertas (sempre visíveis) */}
      {analise.alertas.alertas.length > 0 && (
        <AlertasSection alertas={analise.alertas.alertas} />
      )}
    </div>
  );
}
```
**Then** a página exibe análise estruturada com tabs

**Given** a página existe
**When** crio componente `RelatorioTab` para exibir relatório:
```tsx
// components/RelatorioTab.tsx
export function RelatorioTab({ analise }: { analise: Analise }) {
  const relatorio = analise.relatorio;

  return (
    <Card className="p-6">
      {/* Seção: Cobertura BNCC */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Cobertura BNCC</h2>
        {analise.cobertura_bncc.habilidades.map(hab => (
          <CoberturaBadge
            key={hab.codigo}
            codigo={hab.codigo}
            descricao={hab.descricao}
            nivel={hab.nivel_cobertura} // COMPLETE | PARTIAL | MENTIONED | NOT_COVERED
            evidencias={hab.evidencias}
          />
        ))}
      </section>

      {/* Seção: Análise Qualitativa */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Análise Qualitativa</h2>
        <div className="space-y-4">
          <QualitativaCard
            title="Nível Cognitivo (Bloom)"
            data={analise.analise_qualitativa.niveis_bloom}
          />
          <QualitativaCard
            title="Metodologias Identificadas"
            data={analise.analise_qualitativa.metodologias}
          />
          <QualitativaCard
            title="Linguagem e Engajamento"
            data={analise.analise_qualitativa.linguagem}
          />
        </div>
      </section>

      {/* Seção: Relatório Textual */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Relatório da Aula</h2>
        <div className="prose max-w-none">
          <ReactMarkdown>{relatorio.conteudo}</ReactMarkdown>
        </div>
      </section>

      {/* Ações: Editar | Aprovar */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => navigate('edit')}>
          Editar Relatório
        </Button>
        <Button variant="default" onClick={handleAprovar}>
          Aprovar
        </Button>
      </div>
    </Card>
  );
}
```
**Then** o relatório é exibido com estrutura clara (cobertura, qualitativa, texto)

**Given** o componente `CoberturaBadge` existe
**When** renderizo habilidade com evidências:
```tsx
// components/CoberturaBadge.tsx
export function CoberturaBadge({ codigo, descricao, nivel, evidencias }) {
  const getBadgeColor = (nivel: NivelCobertura) => {
    switch (nivel) {
      case 'COMPLETE': return 'bg-green-100 text-green-800';
      case 'PARTIAL': return 'bg-yellow-100 text-yellow-800';
      case 'MENTIONED': return 'bg-blue-100 text-blue-800';
      case 'NOT_COVERED': return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="border rounded-lg p-4 mb-3">
      <div className="flex items-center gap-3 mb-2">
        <Badge className={getBadgeColor(nivel)}>{nivel}</Badge>
        <span className="font-semibold">{codigo}</span>
      </div>
      <p className="text-sm text-gray-600 mb-3">{descricao}</p>

      {/* Evidências literais */}
      {evidencias.length > 0 && (
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-xs font-semibold mb-2">Evidências:</p>
          {evidencias.map((ev, idx) => (
            <blockquote key={idx} className="text-sm italic border-l-4 border-cyan-500 pl-3 mb-2">
              "{ev.texto_literal}"
            </blockquote>
          ))}
        </div>
      )}
    </div>
  );
}
```
**Then** evidências literais são destacadas visualmente com blockquote estilizado

**Given** todos componentes existem
**When** crio componente `AlertasSection` para exibir alertas:
```tsx
// components/AlertasSection.tsx
export function AlertasSection({ alertas }: { alertas: Alerta[] }) {
  const getAlertIcon = (nivel: 'INFO' | 'WARNING' | 'CRITICAL') => {
    switch (nivel) {
      case 'INFO': return <InfoIcon className="text-blue-500" />;
      case 'WARNING': return <AlertTriangleIcon className="text-orange-500" />;
      case 'CRITICAL': return <AlertCircleIcon className="text-red-500" />;
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Alertas Pedagógicos</h2>
      <div className="space-y-3">
        {alertas.map((alerta, idx) => (
          <Alert key={idx} variant={alerta.nivel.toLowerCase()}>
            <div className="flex items-start gap-3">
              {getAlertIcon(alerta.nivel)}
              <div>
                <AlertTitle>{alerta.titulo}</AlertTitle>
                <AlertDescription>{alerta.mensagem}</AlertDescription>
                {alerta.acoes_sugeridas.length > 0 && (
                  <ul className="mt-2 text-sm list-disc list-inside">
                    {alerta.acoes_sugeridas.map((acao, i) => (
                      <li key={i}>{acao}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Alert>
        ))}
      </div>
    </div>
  );
}
```
**Then** alertas são exibidos com ícones e ações sugeridas

**Given** a UI completa está implementada
**When** acesso `/aulas/{aulaId}/analise` como professor
**Then** vejo:
- ✅ Header com info da aula (turma, data, título)
- ✅ Tabs: Relatório | Exercícios | Sugestões
- ✅ Cobertura BNCC com badges coloridos (COMPLETE=verde, PARTIAL=amarelo)
- ✅ Evidências literais destacadas com blockquote
- ✅ Análise qualitativa (Bloom, metodologias, linguagem)
- ✅ Relatório textual (markdown renderizado)
- ✅ Alertas pedagógicos com níveis (INFO/WARNING/CRITICAL)
- ✅ Botões "Editar Relatório" e "Aprovar"

---

### Story 6.2: Edição e Aprovação de Relatório

As a **Professor**,
I want **editar o relatório gerado antes de aprovar**,
So that **posso ajustar detalhes, corrigir erros e aprovar com confiança, gerando feedback implícito para melhorar os prompts**.

**Acceptance Criteria:**

**Given** a entidade `Analise` tem campos `relatorio_original` e `relatorio_editado` (JSON)
**When** confirmo no schema Prisma
**Then** os campos existem

**Given** o endpoint GET `/aulas/{aulaId}/analise` existe (Story 6.1)
**When** crio endpoint `PATCH /api/v1/analises/{analiseId}/relatorio`:
```typescript
// analises.controller.ts
@Patch(':analiseId/relatorio')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PROFESSOR')
async editarRelatorio(
  @Param('analiseId') analiseId: string,
  @Body() dto: EditarRelatorioDto,
  @CurrentUser() user: Usuario,
) {
  // Validar: análise pertence à escola do professor
  const analise = await this.analisesService.findOne(analiseId, user.escola_id);
  if (!analise) throw new NotFoundException();

  // Validar: apenas análises em AGUARDANDO_REVISAO podem ser editadas
  if (analise.status !== StatusAnalise.AGUARDANDO_REVISAO) {
    throw new BadRequestException('Relatório já foi aprovado ou rejeitado');
  }

  // Atualizar relatorio_editado (mantém original intacto)
  await this.analisesService.update(analiseId, {
    relatorio_editado: dto.relatorio,
    updated_at: new Date(),
  });

  return { message: 'Relatório atualizado com sucesso' };
}

// DTOs
export class EditarRelatorioDto {
  @IsObject()
  relatorio: {
    conteudo: string; // Markdown ou HTML
    secoes?: Record<string, any>; // Estrutura flexível
  };
}
```
**Then** o endpoint salva edições sem sobrescrever original

**Given** o endpoint PATCH existe
**When** testo salvamento de edição:
```bash
PATCH /api/v1/analises/{analiseId}/relatorio
Body: {
  "relatorio": {
    "conteudo": "## Resumo da Aula\n\n[EDITADO] Professor abordou..."
  }
}
```
**Then** recebo `200 OK` e banco atualiza `relatorio_editado`

**Given** testo com análise já aprovada
**When** tento PATCH em analise com `status = APROVADO`
**Then** recebo `400 Bad Request: "Relatório já foi aprovado ou rejeitado"`

**Given** o endpoint de edição funciona
**When** crio endpoint `POST /api/v1/analises/{analiseId}/aprovar`:
```typescript
// analises.controller.ts
@Post(':analiseId/aprovar')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PROFESSOR')
async aprovarRelatorio(
  @Param('analiseId') analiseId: string,
  @CurrentUser() user: Usuario,
) {
  const analise = await this.analisesService.findOne(analiseId, user.escola_id);
  if (!analise) throw new NotFoundException();

  if (analise.status !== StatusAnalise.AGUARDANDO_REVISAO) {
    throw new BadRequestException('Análise já foi processada');
  }

  // Calcular tempo de revisão
  const tempo_revisao = Math.floor(
    (Date.now() - analise.created_at.getTime()) / 1000
  );

  // Aprovar
  await this.analisesService.update(analiseId, {
    status: StatusAnalise.APROVADO,
    aprovado_em: new Date(),
    tempo_revisao,
  });

  // Atualizar status da Aula para APROVADA
  await this.aulasService.updateStatus(analise.aula_id, StatusAula.APROVADA);

  // Enfileirar job para calcular diff (feedback implícito)
  if (analise.relatorio_editado) {
    await this.feedbackQueue.add('calculate-report-diff', {
      analise_id: analiseId,
      original: analise.relatorio_original,
      editado: analise.relatorio_editado,
    });
  }

  return { message: 'Relatório aprovado com sucesso', tempo_revisao };
}
```
**Then** o endpoint aprova, calcula tempo de revisão e enfileira job de diff

**Given** o endpoint de aprovação existe
**When** crio endpoint `POST /api/v1/analises/{analiseId}/rejeitar`:
```typescript
@Post(':analiseId/rejeitar')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PROFESSOR')
async rejeitarRelatorio(
  @Param('analiseId') analiseId: string,
  @Body() dto: RejeitarRelatorioDto,
  @CurrentUser() user: Usuario,
) {
  const analise = await this.analisesService.findOne(analiseId, user.escola_id);
  if (!analise) throw new NotFoundException();

  if (analise.status !== StatusAnalise.AGUARDANDO_REVISAO) {
    throw new BadRequestException('Análise já foi processada');
  }

  // Rejeitar com motivo
  await this.analisesService.update(analiseId, {
    status: StatusAnalise.REJEITADO,
    rejeitado_em: new Date(),
    motivo_rejeicao: dto.motivo, // Novo campo (adicionar ao schema)
  });

  // Atualizar aula para REJEITADA
  await this.aulasService.updateStatus(analise.aula_id, StatusAula.REJEITADA);

  // Feedback explícito: enfileirar análise de rejeição
  await this.feedbackQueue.add('analyze-rejection', {
    analise_id: analiseId,
    motivo: dto.motivo,
  });

  return { message: 'Relatório rejeitado' };
}

export class RejeitarRelatorioDto {
  @IsString()
  @MinLength(10)
  motivo: string; // Feedback explícito do professor
}
```
**Then** o endpoint rejeita, armazena motivo e enfileira análise de feedback

**Given** os endpoints de aprovação/rejeição existem
**When** adiciono campo `motivo_rejeicao` ao schema `Analise`:
```prisma
model Analise {
  // ... (campos existentes)
  motivo_rejeicao       String?  // Feedback explícito
}
```
**Then** o schema suporta armazenar motivo de rejeição

**Given** os endpoints estão prontos
**When** crio página de edição `/aulas/{aulaId}/analise/edit`:
```tsx
// pages/AulaAnaliseEdit.tsx
export function AulaAnaliseEditPage() {
  const { aulaId } = useParams();
  const navigate = useNavigate();
  const { data: analise } = useQuery(['analise', aulaId], fetchAnalise);

  const [conteudo, setConteudo] = useState(
    analise?.relatorio.conteudo || ''
  );

  const saveMutation = useMutation(
    (data) => api.patch(`/analises/${analise.id}/relatorio`, { relatorio: { conteudo: data } }),
    {
      onSuccess: () => {
        toast.success('Rascunho salvo!');
      },
    }
  );

  const aprovarMutation = useMutation(
    () => api.post(`/analises/${analise.id}/aprovar`),
    {
      onSuccess: (res) => {
        toast.success(`Aprovado! Tempo de revisão: ${res.tempo_revisao}s`);
        navigate(`/aulas/${aulaId}/analise`);
      },
    }
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Editar Relatório</h1>

      {/* Rich-text editor (TipTap) */}
      <Card className="p-6 mb-6">
        <RichTextEditor
          content={conteudo}
          onChange={(newContent) => {
            setConteudo(newContent);
            // Auto-save após 2s de inatividade
            debouncedSave(newContent);
          }}
        />
      </Card>

      {/* Diff Viewer (opcional) */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Diferenças (Original vs Editado)</h2>
        <DiffViewer
          original={analise.relatorio_original.conteudo}
          modified={conteudo}
        />
      </Card>

      {/* Ações */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Voltar
        </Button>
        <Button variant="secondary" onClick={() => saveMutation.mutate(conteudo)}>
          Salvar Rascunho
        </Button>
        <Button variant="default" onClick={() => aprovarMutation.mutate()}>
          Aprovar Relatório
        </Button>
        <Button variant="destructive" onClick={handleRejeitar}>
          Rejeitar
        </Button>
      </div>
    </div>
  );
}
```
**Then** a página permite editar, salvar draft, ver diff e aprovar/rejeitar

**Given** a página de edição existe
**When** crio componente `RichTextEditor` com TipTap:
```tsx
// components/RichTextEditor.tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export function RichTextEditor({ content, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="border rounded-lg">
      {/* Toolbar */}
      <div className="border-b p-2 flex gap-2">
        <Button size="sm" onClick={() => editor.chain().focus().toggleBold().run()}>
          <BoldIcon />
        </Button>
        <Button size="sm" onClick={() => editor.chain().focus().toggleItalic().run()}>
          <ItalicIcon />
        </Button>
        <Button size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </Button>
        <Button size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <ListIcon />
        </Button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} className="prose max-w-none p-4" />
    </div>
  );
}
```
**Then** o editor TipTap permite formatação rich-text (bold, heading, listas)

**Given** o editor está implementado
**When** crio componente `DiffViewer` para mostrar diferenças:
```tsx
// components/DiffViewer.tsx
import { diffLines } from 'diff';

export function DiffViewer({ original, modified }) {
  const diff = diffLines(original, modified);

  return (
    <div className="font-mono text-sm">
      {diff.map((part, idx) => (
        <div
          key={idx}
          className={cn(
            'px-2 py-1',
            part.added && 'bg-green-100 text-green-900',
            part.removed && 'bg-red-100 text-red-900 line-through'
          )}
        >
          {part.value}
        </div>
      ))}
    </div>
  );
}
```
**Then** o diff viewer mostra linhas adicionadas (verde) e removidas (vermelho)

**Given** testo o fluxo completo
**When** sigo os passos:
1. Acesso `/aulas/{aulaId}/analise` → vejo relatório original
2. Clico "Editar Relatório" → abro `/aulas/{aulaId}/analise/edit`
3. Modifico texto no editor TipTap → auto-save após 2s
4. Vejo diff (original vs editado) abaixo do editor
5. Clico "Aprovar Relatório" → POST `/analises/{analiseId}/aprovar`
6. Backend:
   - Atualiza `status = APROVADO`
   - Calcula `tempo_revisao = 180s` (3 minutos)
   - Enfileira job `calculate-report-diff` (feedback implícito)
   - Atualiza `Aula.status = APROVADA`
7. Recebo toast: "Aprovado! Tempo de revisão: 180s"
8. Redirecionado para `/aulas/{aulaId}/analise`
**Then** o workflow de edição e aprovação funciona end-to-end

**Given** testo rejeição
**When** clico "Rejeitar" → abre modal com textarea "Motivo"
**Then** posso inserir feedback explícito (ex: "Relatório muito genérico, faltou detalhar habilidades")

**Given** submeto rejeição com motivo
**When** POST `/analises/{analiseId}/rejeitar` com `{ motivo: "..." }`
**Then** backend salva motivo, atualiza status e enfileira análise de feedback

---

### Story 6.3: Visualização e Edição de Exercícios Contextuais

As a **Professor**,
I want **visualizar e editar exercícios gerados pela IA**,
So that **posso ajustar questões, alternativas e gabaritos para melhor adequação à minha turma**.

**Acceptance Criteria:**

**Given** a entidade `Analise` tem campos `exercicios_original` e `exercicios_editado` (JSON)
**When** confirmo no schema Prisma (já existe desde Story 6.1)
**Then** os campos existem

**Given** o endpoint GET `/aulas/{aulaId}/analise` retorna exercícios (Story 6.1)
**When** confirmo resposta inclui:
```json
{
  "exercicios": {
    "questoes": [
      {
        "numero": 1,
        "enunciado": "Qual é a área de um triângulo com base 10cm e altura 5cm?",
        "alternativas": [
          { "letra": "A", "texto": "25 cm²", "correta": true },
          { "letra": "B", "texto": "50 cm²", "correta": false },
          { "letra": "C", "texto": "15 cm²", "correta": false },
          { "letra": "D", "texto": "30 cm²", "correta": false }
        ],
        "habilidade_bncc": "EF06MA29",
        "nivel_bloom": "Aplicação",
        "explicacao": "A fórmula da área do triângulo é (base × altura) / 2 = (10 × 5) / 2 = 25 cm²"
      },
      // ... mais questões
    ]
  }
}
```
**Then** exercícios têm estrutura completa (questões, alternativas, gabarito, BNCC, Bloom)

**Given** a estrutura dos exercícios está definida
**When** crio componente `ExerciciosTab` (referenciado na Story 6.1):
```tsx
// components/ExerciciosTab.tsx
export function ExerciciosTab({ exercicios }) {
  const [editMode, setEditMode] = useState(false);

  if (editMode) {
    return <ExerciciosEditor exercicios={exercicios} onSave={handleSave} />;
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Exercícios Contextuais</h2>
        <Button variant="outline" onClick={() => setEditMode(true)}>
          <EditIcon className="mr-2" />
          Editar Exercícios
        </Button>
      </div>

      {/* Lista de questões */}
      <div className="space-y-6">
        {exercicios.questoes.map((questao, idx) => (
          <QuestaoCard key={idx} questao={questao} showGabarito />
        ))}
      </div>

      {/* Metadados */}
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <p className="text-sm text-gray-600">
          {exercicios.questoes.length} questões geradas |
          Baseado em: {exercicios.questoes.map(q => q.habilidade_bncc).join(', ')}
        </p>
      </div>
    </Card>
  );
}
```
**Then** a tab exibe exercícios com botão "Editar"

**Given** o componente `ExerciciosTab` existe
**When** crio componente `QuestaoCard`:
```tsx
// components/QuestaoCard.tsx
export function QuestaoCard({ questao, showGabarito = false }) {
  return (
    <div className="border rounded-lg p-4">
      {/* Header com metadados */}
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="outline">{questao.habilidade_bncc}</Badge>
        <Badge variant="secondary">Bloom: {questao.nivel_bloom}</Badge>
      </div>

      {/* Enunciado */}
      <h3 className="font-semibold mb-3">
        {questao.numero}. {questao.enunciado}
      </h3>

      {/* Alternativas */}
      <div className="space-y-2 mb-4">
        {questao.alternativas.map(alt => (
          <div
            key={alt.letra}
            className={cn(
              'p-3 rounded border',
              showGabarito && alt.correta && 'bg-green-50 border-green-500'
            )}
          >
            <span className="font-semibold mr-2">{alt.letra})</span>
            {alt.texto}
            {showGabarito && alt.correta && (
              <CheckCircleIcon className="inline ml-2 text-green-600" />
            )}
          </div>
        ))}
      </div>

      {/* Explicação (gabarito) */}
      {showGabarito && (
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-sm font-semibold mb-1">Explicação:</p>
          <p className="text-sm">{questao.explicacao}</p>
        </div>
      )}
    </div>
  );
}
```
**Then** questões são exibidas com alternativas e gabarito (se `showGabarito=true`)

**Given** o componente de visualização existe
**When** crio componente `ExerciciosEditor` para edição:
```tsx
// components/ExerciciosEditor.tsx
export function ExerciciosEditor({ exercicios, onSave }) {
  const [questoes, setQuestoes] = useState(exercicios.questoes);

  const updateQuestao = (idx: number, field: string, value: any) => {
    const updated = [...questoes];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestoes(updated);
  };

  const updateAlternativa = (qIdx: number, aIdx: number, field: string, value: any) => {
    const updated = [...questoes];
    updated[qIdx].alternativas[aIdx] = {
      ...updated[qIdx].alternativas[aIdx],
      [field]: value,
    };
    setQuestoes(updated);
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">Editar Exercícios</h2>

      {questoes.map((questao, qIdx) => (
        <div key={qIdx} className="border rounded-lg p-4 mb-6">
          {/* Enunciado */}
          <Label>Enunciado</Label>
          <Textarea
            value={questao.enunciado}
            onChange={(e) => updateQuestao(qIdx, 'enunciado', e.target.value)}
            className="mb-4"
          />

          {/* Alternativas */}
          <Label>Alternativas</Label>
          {questao.alternativas.map((alt, aIdx) => (
            <div key={aIdx} className="flex gap-2 items-center mb-2">
              <span className="font-semibold w-8">{alt.letra})</span>
              <Input
                value={alt.texto}
                onChange={(e) => updateAlternativa(qIdx, aIdx, 'texto', e.target.value)}
                className="flex-1"
              />
              <Checkbox
                checked={alt.correta}
                onCheckedChange={(checked) => updateAlternativa(qIdx, aIdx, 'correta', checked)}
              />
            </div>
          ))}

          {/* Explicação */}
          <Label>Explicação (Gabarito)</Label>
          <Textarea
            value={questao.explicacao}
            onChange={(e) => updateQuestao(qIdx, 'explicacao', e.target.value)}
            className="mb-4"
          />
        </div>
      ))}

      {/* Ações */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => onSave(null)}>
          Cancelar
        </Button>
        <Button variant="default" onClick={() => onSave({ questoes })}>
          Salvar Exercícios
        </Button>
      </div>
    </Card>
  );
}
```
**Then** o editor permite modificar enunciados, alternativas, gabaritos e explicações

**Given** o editor está implementado
**When** crio endpoint `PATCH /api/v1/analises/{analiseId}/exercicios`:
```typescript
// analises.controller.ts
@Patch(':analiseId/exercicios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PROFESSOR')
async editarExercicios(
  @Param('analiseId') analiseId: string,
  @Body() dto: EditarExerciciosDto,
  @CurrentUser() user: Usuario,
) {
  const analise = await this.analisesService.findOne(analiseId, user.escola_id);
  if (!analise) throw new NotFoundException();

  // Validar estrutura dos exercícios
  this.validateExercicios(dto.exercicios);

  // Salvar exercicios_editado
  await this.analisesService.update(analiseId, {
    exercicios_editado: dto.exercicios,
    updated_at: new Date(),
  });

  return { message: 'Exercícios atualizados com sucesso' };
}

export class EditarExerciciosDto {
  @IsObject()
  exercicios: {
    questoes: Array<{
      numero: number;
      enunciado: string;
      alternativas: Array<{
        letra: string;
        texto: string;
        correta: boolean;
      }>;
      habilidade_bncc: string;
      nivel_bloom: string;
      explicacao: string;
    }>;
  };
}
```
**Then** o endpoint salva exercícios editados com validação de estrutura

**Given** o endpoint existe
**When** testo salvamento de exercícios editados:
```bash
PATCH /api/v1/analises/{analiseId}/exercicios
Body: {
  "exercicios": {
    "questoes": [
      {
        "numero": 1,
        "enunciado": "[EDITADO] Qual é a área de um triângulo retângulo com base 10cm e altura 5cm?",
        "alternativas": [
          { "letra": "A", "texto": "25 cm²", "correta": true },
          { "letra": "B", "texto": "50 cm²", "correta": false },
          { "letra": "C", "texto": "15 cm²", "correta": false },
          { "letra": "D", "texto": "30 cm²", "correta": false }
        ],
        "habilidade_bncc": "EF06MA29",
        "nivel_bloom": "Aplicação",
        "explicacao": "A fórmula é (base × altura) / 2 = 25 cm²"
      }
    ]
  }
}
```
**Then** recebo `200 OK` e banco atualiza `exercicios_editado`

**Given** testo o fluxo completo
**When** sigo os passos:
1. Acesso tab "Exercícios" → vejo 5 questões geradas pela IA
2. Clico "Editar Exercícios" → abre `ExerciciosEditor`
3. Modifico enunciado da questão 1: adiciono "[EDITADO] retângulo" para especificar
4. Corrijo alternativa B de "50 cm²" para "10 cm²"
5. Atualizo explicação para incluir mais detalhes
6. Clico "Salvar Exercícios" → PATCH `/analises/{analiseId}/exercicios`
7. Backend salva `exercicios_editado` (mantém `exercicios_original` intacto)
8. Recebo toast: "Exercícios atualizados!"
9. Volto para visualização → vejo exercícios editados
**Then** o fluxo de edição de exercícios funciona end-to-end

**Given** GET `/aulas/{aulaId}/analise` prioriza exercícios editados (implementado em Story 6.1)
**When** faço GET após editar exercícios
**Then** a resposta retorna `exercicios_editado` (não `exercicios_original`)

---

### Story 6.4: Sugestões para Próxima Aula

As a **Professor**,
I want **visualizar sugestões para a próxima aula baseadas em gaps identificados**,
So that **posso planejar melhor e garantir continuidade do conteúdo curricular**.

**Acceptance Criteria:**

**Given** o Prompt 5 já gera sugestões (implementado no Epic 5, Story 5.5)
**When** confirmo estrutura JSON de `sugestoes_proxima` em `Analise`:
```json
{
  "sugestoes_proxima": {
    "prioridades": [
      {
        "tipo": "gap_curricular" | "reforco" | "avanco",
        "habilidade_bncc": "EF06MA03",
        "descricao": "Retomar conceito de área de triângulos",
        "justificativa": "Esta habilidade estava planejada mas não foi coberta",
        "recursos_sugeridos": [
          "Vídeo: Khan Academy - Área de Triângulos",
          "Atividade prática: Medir áreas com régua"
        ]
      },
      // ... mais prioridades
    ],
    "pacing_sugerido": {
      "tempo_estimado": "45 minutos",
      "distribuicao": {
        "revisao": "10 min",
        "novo_conteudo": "25 min",
        "exercicios": "10 min"
      }
    },
    "proxima_aula_planejada": {
      "titulo": "Geometria: Área de Quadriláteros",
      "habilidades": ["EF06MA29", "EF06MA30"],
      "data_prevista": "2026-02-12"
    }
  }
}
```
**Then** a estrutura está bem definida com prioridades, pacing e próxima aula planejada

**Given** a estrutura JSON está definida
**When** crio componente `SugestoesTab` (referenciado na Story 6.1):
```tsx
// components/SugestoesTab.tsx
export function SugestoesTab({ sugestoes }) {
  const { prioridades, pacing_sugerido, proxima_aula_planejada } = sugestoes;

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">Sugestões para Próxima Aula</h2>

      {/* Seção: Prioridades */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Prioridades de Conteúdo</h3>
        <div className="space-y-4">
          {prioridades.map((prioridade, idx) => (
            <PrioridadeCard key={idx} prioridade={prioridade} />
          ))}
        </div>
      </section>

      {/* Seção: Pacing Sugerido */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Pacing Sugerido</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <ClockIcon className="text-gray-600" />
            <span className="font-semibold">Tempo Total: {pacing_sugerido.tempo_estimado}</span>
          </div>
          <div className="space-y-2">
            {Object.entries(pacing_sugerido.distribuicao).map(([fase, tempo]) => (
              <div key={fase} className="flex justify-between">
                <span className="capitalize">{fase.replace('_', ' ')}:</span>
                <span className="font-semibold">{tempo}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção: Próxima Aula Planejada */}
      {proxima_aula_planejada && (
        <section>
          <h3 className="text-lg font-semibold mb-4">Próxima Aula Planejada</h3>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h4 className="font-semibold mb-2">{proxima_aula_planejada.titulo}</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Data prevista: {formatDate(proxima_aula_planejada.data_prevista)}</p>
              <p>Habilidades: {proxima_aula_planejada.habilidades.join(', ')}</p>
            </div>
            <Button variant="outline" size="sm" className="mt-3" onClick={handleVerPlanejamento}>
              Ver Planejamento Completo
            </Button>
          </Card>
        </section>
      )}
    </Card>
  );
}
```
**Then** a tab exibe sugestões com prioridades, pacing e próxima aula planejada

**Given** o componente `SugestoesTab` existe
**When** crio componente `PrioridadeCard`:
```tsx
// components/PrioridadeCard.tsx
export function PrioridadeCard({ prioridade }) {
  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'gap_curricular': return <AlertTriangleIcon className="text-orange-500" />;
      case 'reforco': return <RefreshIcon className="text-blue-500" />;
      case 'avanco': return <TrendingUpIcon className="text-green-500" />;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'gap_curricular': return <Badge variant="warning">Gap Curricular</Badge>;
      case 'reforco': return <Badge variant="info">Reforço</Badge>;
      case 'avanco': return <Badge variant="success">Avançar</Badge>;
    }
  };

  return (
    <div className="border rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        {getTipoIcon(prioridade.tipo)}
        {getTipoBadge(prioridade.tipo)}
        <Badge variant="outline">{prioridade.habilidade_bncc}</Badge>
      </div>

      {/* Descrição */}
      <h4 className="font-semibold mb-2">{prioridade.descricao}</h4>
      <p className="text-sm text-gray-600 mb-3">{prioridade.justificativa}</p>

      {/* Recursos Sugeridos */}
      {prioridade.recursos_sugeridos.length > 0 && (
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-xs font-semibold mb-2">Recursos Sugeridos:</p>
          <ul className="text-sm space-y-1">
            {prioridade.recursos_sugeridos.map((recurso, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckIcon className="text-green-600 mt-0.5 flex-shrink-0" size={16} />
                <span>{recurso}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```
**Then** cada prioridade é exibida com tipo, habilidade BNCC, descrição e recursos sugeridos

**Given** os componentes estão implementados
**When** testo a visualização de sugestões:
1. Acesso tab "Sugestões" → vejo 3 prioridades:
   - Gap Curricular: EF06MA03 (área de triângulos) - não coberto
   - Reforço: EF06MA01 (sistema numérico) - cobertura PARTIAL
   - Avançar: EF06MA29 (polígonos) - COMPLETE, pode avançar
2. Vejo pacing sugerido: 45min (10min revisão + 25min conteúdo + 10min exercícios)
3. Vejo card "Próxima Aula Planejada": "Geometria: Área de Quadriláteros"
4. Clico "Ver Planejamento Completo" → navego para `/planejamentos/{id}`
**Then** as sugestões são exibidas de forma estruturada e acionável

**Given** quero integrar sugestões com planejamento
**When** adiciono botão "Aplicar Sugestões ao Planejamento":
```tsx
// components/SugestoesTab.tsx (adicionar botão)
<Button variant="default" onClick={handleAplicarSugestoes}>
  Aplicar Sugestões ao Planejamento
</Button>

// Handler
const handleAplicarSugestoes = async () => {
  // Abrir modal para selecionar qual sugestão aplicar
  const selected = await openSelectModal(prioridades);

  // Criar/atualizar planejamento com habilidade sugerida
  await api.post('/planejamentos/{id}/habilidades', {
    habilidade_codigo: selected.habilidade_bncc,
    observacao: `Sugerido por IA: ${selected.justificativa}`,
  });

  toast.success('Habilidade adicionada ao planejamento!');
};
```
**Then** professor pode aplicar sugestões diretamente ao planejamento (feature opcional)

**Given** testo o fluxo completo
**When** sigo os passos:
1. Aula analisada tem gap: EF06MA03 não coberto (estava no planejamento)
2. Prompt 5 detecta gap e gera sugestão (Epic 5)
3. Professor acessa tab "Sugestões"
4. Vê prioridade "Gap Curricular: EF06MA03 - Retomar área de triângulos"
5. Vê recursos sugeridos: "Khan Academy", "Atividade prática"
6. Vê pacing: 45min com distribuição
7. Vê próxima aula planejada: "Geometria: Área de Quadriláteros" em 2026-02-12
8. (Opcional) Clica "Aplicar Sugestões" → adiciona EF06MA03 ao planejamento
**Then** o fluxo de sugestões funciona e ajuda professor a planejar próxima aula

---

### Story 6.5: Dashboard Pessoal do Professor (Cobertura Própria)

As a **Professor**,
I want **visualizar meu próprio % de cobertura curricular por turma e bimestre**,
So that **posso acompanhar meu progresso e identificar gaps antes do fim do bimestre**.

**Acceptance Criteria:**

**Given** o professor tem aulas analisadas e planejamentos cadastrados
**When** preciso calcular cobertura própria, crio query otimizada:
```typescript
// professores.service.ts
async getCoberturaPropria(professorId: string, escolaId: string, filtros?: FiltrosCobertura) {
  // Filtros: turma_id, disciplina, bimestre, ano

  // Query: JOIN entre Planejamento, Aula, Analise
  const result = await this.prisma.$queryRaw`
    SELECT
      t.id as turma_id,
      t.nome as turma_nome,
      p.disciplina,
      p.bimestre,
      COUNT(DISTINCT ph.habilidade_id) as habilidades_planejadas,
      COUNT(DISTINCT CASE
        WHEN jsonb_array_elements(a.cobertura_bncc->'habilidades')->>'nivel_cobertura' IN ('COMPLETE', 'PARTIAL')
        THEN jsonb_array_elements(a.cobertura_bncc->'habilidades')->>'codigo'
      END) as habilidades_trabalhadas,
      ROUND(
        (COUNT(DISTINCT CASE
          WHEN jsonb_array_elements(a.cobertura_bncc->'habilidades')->>'nivel_cobertura' IN ('COMPLETE', 'PARTIAL')
          THEN jsonb_array_elements(a.cobertura_bncc->'habilidades')->>'codigo'
        END)::numeric / NULLIF(COUNT(DISTINCT ph.habilidade_id), 0)) * 100,
        2
      ) as percentual_cobertura
    FROM "Planejamento" p
    INNER JOIN "Turma" t ON p.turma_id = t.id
    LEFT JOIN "PlanejamentoHabilidade" ph ON ph.planejamento_id = p.id
    LEFT JOIN "Aula" au ON au.turma_id = t.id AND au.professor_id = ${professorId}
    LEFT JOIN "Analise" a ON a.aula_id = au.id AND a.status = 'APROVADO'
    WHERE p.professor_id = ${professorId}
      AND p.escola_id = ${escolaId}
      ${filtros?.turma_id ? Prisma.sql`AND t.id = ${filtros.turma_id}` : Prisma.empty}
      ${filtros?.disciplina ? Prisma.sql`AND p.disciplina = ${filtros.disciplina}` : Prisma.empty}
      ${filtros?.bimestre ? Prisma.sql`AND p.bimestre = ${filtros.bimestre}` : Prisma.empty}
    GROUP BY t.id, t.nome, p.disciplina, p.bimestre
    ORDER BY p.bimestre, t.nome;
  `;

  return result;
}
```
**Then** a query calcula % cobertura por turma/disciplina/bimestre

**Given** a query existe
**When** crio endpoint `GET /api/v1/professores/me/cobertura`:
```typescript
// professores.controller.ts
@Get('me/cobertura')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PROFESSOR')
async getMinhaCob ertura(
  @CurrentUser() user: Usuario,
  @Query() filtros: FiltrosCoberturaDto,
) {
  // Buscar cobertura própria
  const cobertura = await this.professoresService.getCoberturaPropria(
    user.id,
    user.escola_id,
    filtros
  );

  // Calcular estatísticas agregadas
  const stats = {
    total_turmas: cobertura.length,
    media_cobertura: cobertura.reduce((acc, c) => acc + c.percentual_cobertura, 0) / cobertura.length,
    turmas_abaixo_meta: cobertura.filter(c => c.percentual_cobertura < 70).length, // Meta: 70%
  };

  return {
    cobertura,
    stats,
  };
}

export class FiltrosCoberturaDto {
  @IsOptional()
  @IsUUID()
  turma_id?: string;

  @IsOptional()
  @IsEnum(Disciplina)
  disciplina?: Disciplina;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  bimestre?: number;
}
```
**Then** o endpoint retorna cobertura com filtros e estatísticas agregadas

**Given** o endpoint existe
**When** testo com filtros:
```bash
GET /api/v1/professores/me/cobertura?disciplina=MATEMATICA&bimestre=1
```
**Then** recebo cobertura filtrada:
```json
{
  "cobertura": [
    {
      "turma_id": "uuid",
      "turma_nome": "6º Ano A",
      "disciplina": "MATEMATICA",
      "bimestre": 1,
      "habilidades_planejadas": 15,
      "habilidades_trabalhadas": 12,
      "percentual_cobertura": 80.00
    },
    {
      "turma_id": "uuid2",
      "turma_nome": "6º Ano B",
      "disciplina": "MATEMATICA",
      "bimestre": 1,
      "habilidades_planejadas": 15,
      "habilidades_trabalhadas": 9,
      "percentual_cobertura": 60.00
    }
  ],
  "stats": {
    "total_turmas": 2,
    "media_cobertura": 70.00,
    "turmas_abaixo_meta": 1
  }
}
```

**Given** o endpoint funciona
**When** crio página `/dashboard/cobertura-pessoal`:
```tsx
// pages/CoberturaPessoal.tsx
export function CoberturaPessoalPage() {
  const [filtros, setFiltros] = useState<FiltrosCobertura>({
    disciplina: 'MATEMATICA',
    bimestre: 1,
  });

  const { data, isLoading } = useQuery(
    ['cobertura-pessoal', filtros],
    () => api.get('/professores/me/cobertura', { params: filtros }).then(res => res.data)
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Minha Cobertura Curricular</h1>

      {/* Filtros */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4">
          <Select value={filtros.disciplina} onValueChange={(v) => setFiltros({...filtros, disciplina: v})}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Disciplina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MATEMATICA">Matemática</SelectItem>
              <SelectItem value="LINGUA_PORTUGUESA">Língua Portuguesa</SelectItem>
              <SelectItem value="CIENCIAS">Ciências</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtros.bimestre?.toString()} onValueChange={(v) => setFiltros({...filtros, bimestre: parseInt(v)})}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Bimestre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1º Bimestre</SelectItem>
              <SelectItem value="2">2º Bimestre</SelectItem>
              <SelectItem value="3">3º Bimestre</SelectItem>
              <SelectItem value="4">4º Bimestre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Média de Cobertura"
          value={`${data.stats.media_cobertura.toFixed(1)}%`}
          icon={<TrendingUpIcon />}
          color="blue"
        />
        <StatCard
          title="Total de Turmas"
          value={data.stats.total_turmas}
          icon={<UsersIcon />}
          color="green"
        />
        <StatCard
          title="Turmas Abaixo da Meta"
          value={data.stats.turmas_abaixo_meta}
          icon={<AlertTriangleIcon />}
          color="orange"
        />
      </div>

      {/* Tabela de Cobertura por Turma */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Cobertura por Turma</h2>
        <CoberturaTable cobertura={data.cobertura} />
      </Card>

      {/* Gráfico de Progresso Temporal */}
      <Card className="p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">Progresso ao Longo do Bimestre</h2>
        <CoberturaChart turmaId={data.cobertura[0]?.turma_id} />
      </Card>
    </div>
  );
}
```
**Then** a página exibe dashboard com filtros, cards de stats e tabela de cobertura

**Given** o componente `CoberturaTable` existe
**When** crio tabela com progresso visual:
```tsx
// components/CoberturaTable.tsx
export function CoberturaTable({ cobertura }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Turma</TableHead>
          <TableHead>Habilidades Planejadas</TableHead>
          <TableHead>Habilidades Trabalhadas</TableHead>
          <TableHead>% Cobertura</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cobertura.map(c => (
          <TableRow key={c.turma_id}>
            <TableCell className="font-semibold">{c.turma_nome}</TableCell>
            <TableCell>{c.habilidades_planejadas}</TableCell>
            <TableCell>{c.habilidades_trabalhadas}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Progress value={c.percentual_cobertura} className="w-24" />
                <span className="font-semibold">{c.percentual_cobertura}%</span>
              </div>
            </TableCell>
            <TableCell>
              {c.percentual_cobertura >= 70 ? (
                <Badge variant="success">No Ritmo</Badge>
              ) : c.percentual_cobertura >= 50 ? (
                <Badge variant="warning">Atenção</Badge>
              ) : (
                <Badge variant="destructive">Atraso</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```
**Then** a tabela exibe cobertura com progress bar e badges de status

**Given** quero visualizar progresso temporal
**When** crio endpoint `GET /api/v1/professores/me/cobertura/timeline`:
```typescript
// professores.controller.ts
@Get('me/cobertura/timeline')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PROFESSOR')
async getCoberturaTimeline(
  @CurrentUser() user: Usuario,
  @Query() filtros: { turma_id: string; bimestre: number },
) {
  // Buscar aulas aprovadas da turma no bimestre, agrupadas por semana
  const timeline = await this.prisma.$queryRaw`
    SELECT
      DATE_TRUNC('week', au.data_aula) as semana,
      COUNT(DISTINCT CASE
        WHEN jsonb_array_elements(a.cobertura_bncc->'habilidades')->>'nivel_cobertura' IN ('COMPLETE', 'PARTIAL')
        THEN jsonb_array_elements(a.cobertura_bncc->'habilidades')->>'codigo'
      END) as habilidades_acumuladas,
      COUNT(au.id) as aulas_realizadas
    FROM "Aula" au
    INNER JOIN "Analise" a ON a.aula_id = au.id AND a.status = 'APROVADO'
    WHERE au.turma_id = ${filtros.turma_id}
      AND au.professor_id = ${user.id}
      AND EXTRACT(QUARTER FROM au.data_aula) = ${Math.ceil(filtros.bimestre / 2)}
    GROUP BY semana
    ORDER BY semana ASC;
  `;

  return timeline;
}
```
**Then** o endpoint retorna evolução temporal (semana a semana)

**Given** o endpoint de timeline existe
**When** crio componente `CoberturaChart` com gráfico de linha:
```tsx
// components/CoberturaChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export function CoberturaChart({ turmaId }: { turmaId: string }) {
  const { data: timeline, isLoading } = useQuery(
    ['cobertura-timeline', turmaId],
    () => api.get('/professores/me/cobertura/timeline', { params: { turma_id: turmaId, bimestre: 1 } })
      .then(res => res.data)
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="w-full h-[300px]">
      <LineChart width={800} height={300} data={timeline}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="semana" tickFormatter={(date) => format(new Date(date), 'dd/MM')} />
        <YAxis />
        <Tooltip labelFormatter={(date) => format(new Date(date), 'dd MMM', { locale: ptBR })} />
        <Legend />
        <Line
          type="monotone"
          dataKey="habilidades_acumuladas"
          stroke="#2563EB"
          strokeWidth={2}
          name="Habilidades Trabalhadas"
        />
        <Line
          type="monotone"
          dataKey="aulas_realizadas"
          stroke="#06B6D4"
          strokeWidth={2}
          name="Aulas Realizadas"
        />
      </LineChart>
    </div>
  );
}
```
**Then** o gráfico mostra evolução de cobertura ao longo do bimestre (linha do tempo)

**Given** testo o fluxo completo
**When** sigo os passos:
1. Acesso `/dashboard/cobertura-pessoal`
2. Seleciono filtros: Matemática, 1º Bimestre
3. Vejo cards:
   - Média de Cobertura: 75.5%
   - Total de Turmas: 3
   - Turmas Abaixo da Meta: 1 (meta: 70%)
4. Vejo tabela com 3 turmas:
   - 6º Ano A: 15 planejadas, 12 trabalhadas, 80% (badge verde "No Ritmo")
   - 6º Ano B: 15 planejadas, 9 trabalhadas, 60% (badge laranja "Atenção")
   - 6º Ano C: 15 planejadas, 13 trabalhadas, 86.7% (badge verde "No Ritmo")
5. Vejo gráfico de linha mostrando evolução semanal:
   - Semana 1: 3 habilidades, 2 aulas
   - Semana 2: 7 habilidades (+4), 4 aulas (+2)
   - Semana 3: 12 habilidades (+5), 6 aulas (+2)
6. Identifico que 6º Ano B precisa atenção (60% cobertura)
7. Navego para análises daquela turma para planejar ação
**Then** o dashboard pessoal funciona e ajuda professor a monitorar progresso próprio

---

**Epic 6 COMPLETO!** ✅

**Resumo:**
- 5 stories criadas
- Professor pode visualizar, editar e aprovar relatórios pedagógicos com workflow completo
- Diff tracking implementado (gerado vs editado) para feedback implícito aos prompts
- Exercícios contextuais podem ser visualizados e editados com WYSIWYG editor
- Sugestões para próxima aula baseadas em gaps, com recursos e pacing sugerido
- Dashboard pessoal de cobertura: % por turma/bimestre, gráfico temporal, identificação de gaps
- Rich-text editing com TipTap, visualização estruturada com shadcn/ui
- Endpoints RESTful completos: GET análise, PATCH relatório/exercícios, POST aprovar/rejeitar
- Meta de qualidade: >90% relatórios utilizáveis, <5min tempo de revisão (tracked)

---

## Epic 7: Dashboard de Gestão (Coordenador & Diretor)

**Goal:** Coordenadores e Diretores visualizam métricas agregadas de cobertura curricular para tomar decisões pedagógicas baseadas em dados, identificar turmas em atraso e monitorar progresso da escola - **sem acesso a transcrições brutas** (privacidade do professor).

**User Outcome:** Coordenador identifica professores e turmas que precisam suporte, prioriza ações de intervenção, e acompanha evolução da cobertura curricular. Diretor tem visão executiva da escola.

**FRs covered:** FR31, FR32, FR33, FR34, FR35, FR36, FR37

**Key Deliverables:**
- Materialized view `cobertura_bimestral` para performance (agregação pré-calculada)
- Dashboard Coordenador: Métricas por professor (ranking, drill-down)
- Dashboard Coordenador: Métricas por turma (identificação de atrasos)
- Dashboard Diretor: Métricas consolidadas da escola (KPIs executivos)
- RBAC enforcement: Coordenador NÃO acessa transcrições brutas (403 Forbidden)

**Technical Notes:**
- PostgreSQL Materialized View com refresh CONCURRENTLY (Bull job diário + trigger on demand)
- Bull queue: Job `refresh-cobertura-bimestral` agendado (cron: '0 2 * * *' - 2h da manhã)
- Frontend: Recharts para gráficos (LineChart, BarChart), shadcn/ui para tabelas
- Guards: `@Roles('COORDENADOR', 'DIRETOR')` + verificações adicionais no service layer
- Cache Redis: Métricas agregadas (TTL 1h) para reduzir carga no DB

---

### Story 7.1: Materialized View de Cobertura Bimestral

As a **desenvolvedor**,
I want **criar materialized view para agregar dados de cobertura curricular**,
So that **queries de dashboard sejam rápidas (<2s) mesmo com milhares de aulas**.

**Acceptance Criteria:**

**Given** tenho dados de Planejamento, Aula, Analise no banco
**When** crio migration SQL para materialized view:
```sql
-- migrations/xxx_create_cobertura_bimestral_view.sql

CREATE MATERIALIZED VIEW cobertura_bimestral AS
SELECT
  p.escola_id,
  p.id as planejamento_id,
  p.professor_id,
  p.turma_id,
  p.disciplina,
  p.bimestre,
  p.ano_letivo,
  t.nome as turma_nome,
  t.serie as turma_serie,
  u.nome as professor_nome,

  -- Habilidades planejadas
  COUNT(DISTINCT ph.habilidade_id) as habilidades_planejadas,

  -- Habilidades trabalhadas (COMPLETE ou PARTIAL em análises aprovadas)
  COUNT(DISTINCT CASE
    WHEN a.status = 'APROVADO' AND
         jsonb_array_elements(a.cobertura_bncc->'habilidades')->>'nivel_cobertura' IN ('COMPLETE', 'PARTIAL')
    THEN (jsonb_array_elements(a.cobertura_bncc->'habilidades')->>'codigo')::text
  END) as habilidades_trabalhadas,

  -- Percentual de cobertura
  ROUND(
    COALESCE(
      (COUNT(DISTINCT CASE
        WHEN a.status = 'APROVADO' AND
             jsonb_array_elements(a.cobertura_bncc->'habilidades')->>'nivel_cobertura' IN ('COMPLETE', 'PARTIAL')
        THEN (jsonb_array_elements(a.cobertura_bncc->'habilidades')->>'codigo')::text
      END)::numeric / NULLIF(COUNT(DISTINCT ph.habilidade_id), 0)) * 100,
      0
    ),
    2
  ) as percentual_cobertura,

  -- Métricas adicionais
  COUNT(DISTINCT au.id) FILTER (WHERE au.status = 'APROVADA') as total_aulas_aprovadas,
  AVG(a.tempo_revisao) FILTER (WHERE a.status = 'APROVADO') as tempo_medio_revisao,

  -- Timestamp do último refresh
  NOW() as ultima_atualizacao

FROM "Planejamento" p
INNER JOIN "Turma" t ON p.turma_id = t.id
INNER JOIN "Usuario" u ON p.professor_id = u.id
LEFT JOIN "PlanejamentoHabilidade" ph ON ph.planejamento_id = p.id
LEFT JOIN "Aula" au ON au.turma_id = p.turma_id
                    AND au.professor_id = p.professor_id
                    AND EXTRACT(QUARTER FROM au.data_aula) = CEIL(p.bimestre / 2.0)
LEFT JOIN "Analise" a ON a.aula_id = au.id

GROUP BY
  p.escola_id,
  p.id,
  p.professor_id,
  p.turma_id,
  p.disciplina,
  p.bimestre,
  p.ano_letivo,
  t.nome,
  t.serie,
  u.nome;

-- Índices para performance
CREATE UNIQUE INDEX idx_cobertura_bimestral_pk ON cobertura_bimestral (planejamento_id);
CREATE INDEX idx_cobertura_bimestral_escola ON cobertura_bimestral (escola_id, bimestre);
CREATE INDEX idx_cobertura_bimestral_turma ON cobertura_bimestral (turma_id, bimestre);
CREATE INDEX idx_cobertura_bimestral_professor ON cobertura_bimestral (professor_id, bimestre);
CREATE INDEX idx_cobertura_bimestral_cobertura ON cobertura_bimestral (percentual_cobertura);
```
**Then** a materialized view está criada com índices otimizados

**Given** a materialized view existe
**When** testo query de leitura:
```sql
SELECT * FROM cobertura_bimestral
WHERE escola_id = 'uuid-escola'
  AND bimestre = 1
ORDER BY percentual_cobertura ASC;
```
**Then** a query retorna em <200ms (índice utilizado)

**Given** a view precisa ser atualizada periodicamente
**When** crio Bull job para refresh:
```typescript
// jobs/refresh-cobertura.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('refresh-cobertura-queue')
export class RefreshCoberturaProcessor {
  constructor(private prisma: PrismaService) {}

  @Process('refresh-cobertura-bimestral')
  async refreshCoberturaBimestral(job: Job) {
    const startTime = Date.now();

    // Refresh CONCURRENTLY (não bloqueia leituras)
    await this.prisma.$executeRaw`
      REFRESH MATERIALIZED VIEW CONCURRENTLY cobertura_bimestral;
    `;

    const duration = Date.now() - startTime;
    console.log(`Materialized view refreshed in ${duration}ms`);

    return { success: true, duration };
  }
}
```
**Then** o worker atualiza a view sem bloquear leituras

**Given** o processor existe
**When** configuro Bull queue no módulo:
```typescript
// app.module.ts
@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
      },
    }),
    BullModule.registerQueue({
      name: 'refresh-cobertura-queue',
    }),
  ],
})
```
**Then** a fila está configurada

**Given** a fila está configurada
**When** crio serviço para agendar refresh:
```typescript
// cobertura.service.ts
@Injectable()
export class CoberturaService {
  constructor(
    @InjectQueue('refresh-cobertura-queue') private coberturaQueue: Queue,
  ) {}

  async onModuleInit() {
    // Agendar refresh diário às 2h da manhã
    await this.coberturaQueue.add(
      'refresh-cobertura-bimestral',
      {},
      {
        repeat: {
          cron: '0 2 * * *', // 2h AM todos os dias
        },
      },
    );
  }

  // Trigger manual (on-demand)
  async triggerRefresh() {
    await this.coberturaQueue.add('refresh-cobertura-bimestral', {}, {
      priority: 1, // Alta prioridade
    });
    return { message: 'Refresh enfileirado' };
  }
}
```
**Then** o refresh é agendado automaticamente (cron) e pode ser triggered manualmente

**Given** testo o refresh manual
**When** crio endpoint admin para trigger:
```typescript
// admin.controller.ts
@Post('admin/refresh-cobertura')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_INTERNO') // Apenas admin interno
async triggerRefreshCobertura() {
  await this.coberturaService.triggerRefresh();
  return { message: 'Refresh iniciado' };
}
```
**Then** admin pode forçar refresh via API

**Given** testo o fluxo completo
**When** sigo os passos:
1. Migration cria materialized view + índices
2. View contém dados agregados de 100 planejamentos
3. Query `SELECT * FROM cobertura_bimestral WHERE escola_id = '...'` retorna em 150ms
4. Job cron executa às 2h AM → refresh CONCURRENTLY
5. Durante refresh, queries continuam retornando dados (não bloqueia)
6. Refresh completa em ~2s (100 planejamentos)
7. Admin trigger manual → POST `/admin/refresh-cobertura` → job enfileirado
**Then** a materialized view funciona com refresh automático e manual

---

### Story 7.2: Dashboard do Coordenador - Visão por Professor

As a **Coordenador**,
I want **visualizar métricas de cobertura curricular por professor**,
So that **posso identificar professores que precisam suporte e reconhecer boas práticas**.

**Acceptance Criteria:**

**Given** a materialized view `cobertura_bimestral` existe (Story 7.1)
**When** crio endpoint `GET /api/v1/dashboard/coordenador/professores`:
```typescript
// dashboard.controller.ts
@Get('coordenador/professores')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COORDENADOR', 'DIRETOR')
async getMetricasPorProfessor(
  @CurrentUser() user: Usuario,
  @Query() filtros: FiltrosDashboardDto,
) {
  // Buscar dados da materialized view
  const metricas = await this.prisma.$queryRaw<MetricasProfessor[]>`
    SELECT
      professor_id,
      professor_nome,
      disciplina,
      COUNT(DISTINCT turma_id) as total_turmas,
      AVG(percentual_cobertura) as media_cobertura,
      SUM(habilidades_planejadas) as total_habilidades_planejadas,
      SUM(habilidades_trabalhadas) as total_habilidades_trabalhadas,
      SUM(total_aulas_aprovadas) as total_aulas,
      AVG(tempo_medio_revisao) as tempo_medio_revisao
    FROM cobertura_bimestral
    WHERE escola_id = ${user.escola_id}
      ${filtros.bimestre ? Prisma.sql`AND bimestre = ${filtros.bimestre}` : Prisma.empty}
      ${filtros.disciplina ? Prisma.sql`AND disciplina = ${filtros.disciplina}` : Prisma.empty}
    GROUP BY professor_id, professor_nome, disciplina
    ORDER BY media_cobertura DESC;
  `;

  return {
    metricas,
    resumo: {
      total_professores: metricas.length,
      media_geral: metricas.reduce((acc, m) => acc + m.media_cobertura, 0) / metricas.length,
      professores_abaixo_meta: metricas.filter(m => m.media_cobertura < 70).length,
    },
  };
}

export class FiltrosDashboardDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  bimestre?: number;

  @IsOptional()
  @IsEnum(Disciplina)
  disciplina?: Disciplina;
}
```
**Then** o endpoint retorna métricas agregadas por professor (sem dados sensíveis)

**Given** o endpoint existe
**When** adiciono cache Redis para reduzir carga:
```typescript
// dashboard.controller.ts
@Get('coordenador/professores')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COORDENADOR', 'DIRETOR')
@UseInterceptors(CacheInterceptor)
@CacheTTL(3600) // Cache 1 hora
async getMetricasPorProfessor(...) {
  // ... (código anterior)
}
```
**Then** resultados são cacheados por 1h no Redis

**Given** o endpoint funciona
**When** testo com filtros:
```bash
GET /api/v1/dashboard/coordenador/professores?bimestre=1&disciplina=MATEMATICA
Authorization: Bearer {token-coordenador}
```
**Then** recebo métricas filtradas:
```json
{
  "metricas": [
    {
      "professor_id": "uuid1",
      "professor_nome": "Maria Silva",
      "disciplina": "MATEMATICA",
      "total_turmas": 3,
      "media_cobertura": 85.50,
      "total_habilidades_planejadas": 45,
      "total_habilidades_trabalhadas": 38,
      "total_aulas": 24,
      "tempo_medio_revisao": 180
    },
    {
      "professor_id": "uuid2",
      "professor_nome": "João Santos",
      "disciplina": "MATEMATICA",
      "total_turmas": 2,
      "media_cobertura": 62.00,
      "total_habilidades_planejadas": 30,
      "total_habilidades_trabalhadas": 19,
      "total_aulas": 16,
      "tempo_medio_revisao": 420
    }
  ],
  "resumo": {
    "total_professores": 2,
    "media_geral": 73.75,
    "professores_abaixo_meta": 1
  }
}
```

**Given** o endpoint retorna dados
**When** crio página `/dashboard/coordenador/professores`:
```tsx
// pages/DashboardCoordenadorProfessores.tsx
export function DashboardCoordenadorProfessoresPage() {
  const [filtros, setFiltros] = useState({ bimestre: 1, disciplina: 'MATEMATICA' });

  const { data, isLoading } = useQuery(
    ['dashboard-professores', filtros],
    () => api.get('/dashboard/coordenador/professores', { params: filtros }).then(res => res.data)
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard - Professores</h1>

      {/* Filtros */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4">
          <Select value={filtros.disciplina} onValueChange={(v) => setFiltros({...filtros, disciplina: v})}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MATEMATICA">Matemática</SelectItem>
              <SelectItem value="LINGUA_PORTUGUESA">Língua Portuguesa</SelectItem>
              <SelectItem value="CIENCIAS">Ciências</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtros.bimestre.toString()} onValueChange={(v) => setFiltros({...filtros, bimestre: parseInt(v)})}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1º Bimestre</SelectItem>
              <SelectItem value="2">2º Bimestre</SelectItem>
              <SelectItem value="3">3º Bimestre</SelectItem>
              <SelectItem value="4">4º Bimestre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Média Geral de Cobertura"
          value={`${data.resumo.media_geral.toFixed(1)}%`}
          icon={<TrendingUpIcon />}
          color="blue"
        />
        <StatCard
          title="Total de Professores"
          value={data.resumo.total_professores}
          icon={<UsersIcon />}
          color="green"
        />
        <StatCard
          title="Professores Abaixo da Meta"
          value={data.resumo.professores_abaixo_meta}
          icon={<AlertTriangleIcon />}
          color="orange"
        />
      </div>

      {/* Tabela de Professores */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Ranking de Professores</h2>
        <ProfessoresTable metricas={data.metricas} />
      </Card>
    </div>
  );
}
```
**Then** a página exibe dashboard com filtros, resumo e tabela

**Given** o componente da página existe
**When** crio componente `ProfessoresTable`:
```tsx
// components/ProfessoresTable.tsx
export function ProfessoresTable({ metricas }) {
  const navigate = useNavigate();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ranking</TableHead>
          <TableHead>Professor</TableHead>
          <TableHead>Turmas</TableHead>
          <TableHead>Aulas Aprovadas</TableHead>
          <TableHead>% Cobertura Média</TableHead>
          <TableHead>Tempo Médio Revisão</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {metricas.map((prof, idx) => (
          <TableRow key={prof.professor_id} className="cursor-pointer hover:bg-gray-50">
            <TableCell>
              {idx === 0 && <TrophyIcon className="text-yellow-500" />}
              {idx + 1}
            </TableCell>
            <TableCell className="font-semibold">{prof.professor_nome}</TableCell>
            <TableCell>{prof.total_turmas}</TableCell>
            <TableCell>{prof.total_aulas}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Progress value={prof.media_cobertura} className="w-24" />
                <span className="font-semibold">{prof.media_cobertura.toFixed(1)}%</span>
              </div>
            </TableCell>
            <TableCell>
              <span className={cn(
                'font-semibold',
                prof.tempo_medio_revisao < 300 && 'text-green-600', // <5min = verde
                prof.tempo_medio_revisao >= 300 && prof.tempo_medio_revisao < 600 && 'text-yellow-600',
                prof.tempo_medio_revisao >= 600 && 'text-red-600' // >10min = vermelho
              )}>
                {Math.floor(prof.tempo_medio_revisao / 60)}min {prof.tempo_medio_revisao % 60}s
              </span>
            </TableCell>
            <TableCell>
              {prof.media_cobertura >= 70 ? (
                <Badge variant="success">No Ritmo</Badge>
              ) : prof.media_cobertura >= 50 ? (
                <Badge variant="warning">Atenção</Badge>
              ) : (
                <Badge variant="destructive">Atraso</Badge>
              )}
            </TableCell>
            <TableCell>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/dashboard/coordenador/professores/${prof.professor_id}/turmas`)}
              >
                Ver Turmas
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```
**Then** a tabela exibe ranking com drill-down para turmas do professor

**Given** implemento drill-down
**When** crio endpoint `GET /api/v1/dashboard/coordenador/professores/{professorId}/turmas`:
```typescript
// dashboard.controller.ts
@Get('coordenador/professores/:professorId/turmas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COORDENADOR', 'DIRETOR')
async getTurmasPorProfessor(
  @Param('professorId') professorId: string,
  @CurrentUser() user: Usuario,
  @Query() filtros: FiltrosDashboardDto,
) {
  const turmas = await this.prisma.$queryRaw`
    SELECT
      turma_id,
      turma_nome,
      turma_serie,
      disciplina,
      bimestre,
      percentual_cobertura,
      habilidades_planejadas,
      habilidades_trabalhadas,
      total_aulas_aprovadas
    FROM cobertura_bimestral
    WHERE escola_id = ${user.escola_id}
      AND professor_id = ${professorId}
      ${filtros.bimestre ? Prisma.sql`AND bimestre = ${filtros.bimestre}` : Prisma.empty}
    ORDER BY percentual_cobertura ASC;
  `;

  return { turmas };
}
```
**Then** o endpoint retorna turmas do professor específico

**Given** testo o fluxo completo
**When** sigo os passos:
1. Faço login como Coordenador
2. Acesso `/dashboard/coordenador/professores`
3. Seleciono filtros: Matemática, 1º Bimestre
4. Vejo resumo: Média 73.75%, 2 professores, 1 abaixo da meta
5. Vejo tabela ranking:
   - #1: Maria Silva - 3 turmas, 85.5%, 24 aulas, 3min revisão (badge verde "No Ritmo")
   - #2: João Santos - 2 turmas, 62%, 16 aulas, 7min revisão (badge laranja "Atenção")
6. Clico "Ver Turmas" em João Santos
7. Navego para `/dashboard/coordenador/professores/{id}/turmas`
8. Vejo 2 turmas:
   - 6º Ano A: 65% cobertura (15 planejadas, 10 trabalhadas)
   - 6º Ano B: 58% cobertura (15 planejadas, 9 trabalhadas)
9. Identifico que João precisa suporte especialmente no 6º Ano B
**Then** o dashboard de coordenador funciona com drill-down para identificar professores e turmas que precisam atenção

---

### Story 7.3: Dashboard do Coordenador - Visão por Turma

As a **Coordenador**,
I want **visualizar métricas de cobertura por turma e identificar turmas em atraso**,
So that **posso priorizar intervenções pedagógicas onde há maior necessidade**.

**Acceptance Criteria:**

**Given** a materialized view `cobertura_bimestral` existe
**When** crio endpoint `GET /api/v1/dashboard/coordenador/turmas`:
```typescript
// dashboard.controller.ts
@Get('coordenador/turmas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COORDENADOR', 'DIRETOR')
@UseInterceptors(CacheInterceptor)
@CacheTTL(3600)
async getMetricasPorTurma(
  @CurrentUser() user: Usuario,
  @Query() filtros: FiltrosDashboardDto,
) {
  const metricas = await this.prisma.$queryRaw<MetricasTurma[]>`
    SELECT
      turma_id,
      turma_nome,
      turma_serie,
      disciplina,
      bimestre,
      AVG(percentual_cobertura) as percentual_cobertura,
      SUM(habilidades_planejadas) as habilidades_planejadas,
      SUM(habilidades_trabalhadas) as habilidades_trabalhadas,
      SUM(total_aulas_aprovadas) as total_aulas,
      STRING_AGG(DISTINCT professor_nome, ', ') as professores
    FROM cobertura_bimestral
    WHERE escola_id = ${user.escola_id}
      ${filtros.bimestre ? Prisma.sql`AND bimestre = ${filtros.bimestre}` : Prisma.empty}
      ${filtros.disciplina ? Prisma.sql`AND disciplina = ${filtros.disciplina}` : Prisma.empty}
    GROUP BY turma_id, turma_nome, turma_serie, disciplina, bimestre
    ORDER BY percentual_cobertura ASC;
  `;

  // Classificar turmas por urgência
  const turmas_criticas = metricas.filter(t => t.percentual_cobertura < 50);
  const turmas_atencao = metricas.filter(t => t.percentual_cobertura >= 50 && t.percentual_cobertura < 70);
  const turmas_ritmo = metricas.filter(t => t.percentual_cobertura >= 70);

  return {
    metricas,
    classificacao: {
      criticas: turmas_criticas.length,
      atencao: turmas_atencao.length,
      no_ritmo: turmas_ritmo.length,
    },
    turmas_priorizadas: turmas_criticas.slice(0, 5), // Top 5 mais urgentes
  };
}
```
**Then** o endpoint retorna métricas por turma com classificação de urgência

**Given** o endpoint existe
**When** testo com filtros:
```bash
GET /api/v1/dashboard/coordenador/turmas?bimestre=1&disciplina=MATEMATICA
```
**Then** recebo:
```json
{
  "metricas": [
    {
      "turma_id": "uuid1",
      "turma_nome": "6º Ano B",
      "turma_serie": "6_ANO",
      "disciplina": "MATEMATICA",
      "bimestre": 1,
      "percentual_cobertura": 45.50,
      "habilidades_planejadas": 15,
      "habilidades_trabalhadas": 7,
      "total_aulas": 8,
      "professores": "João Santos"
    },
    // ... mais turmas
  ],
  "classificacao": {
    "criticas": 2,
    "atencao": 3,
    "no_ritmo": 8
  },
  "turmas_priorizadas": [ /* 5 turmas com menor % */ ]
}
```

**Given** o endpoint funciona
**When** crio página `/dashboard/coordenador/turmas`:
```tsx
// pages/DashboardCoordenadorTurmas.tsx
export function DashboardCoordenadorTurmasPage() {
  const [filtros, setFiltros] = useState({ bimestre: 1, disciplina: 'MATEMATICA' });

  const { data, isLoading } = useQuery(
    ['dashboard-turmas', filtros],
    () => api.get('/dashboard/coordenador/turmas', { params: filtros }).then(res => res.data)
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard - Turmas</h1>

      {/* Filtros */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4">
          <Select value={filtros.disciplina} onValueChange={(v) => setFiltros({...filtros, disciplina: v})}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MATEMATICA">Matemática</SelectItem>
              <SelectItem value="LINGUA_PORTUGUESA">Língua Portuguesa</SelectItem>
              <SelectItem value="CIENCIAS">Ciências</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtros.bimestre.toString()} onValueChange={(v) => setFiltros({...filtros, bimestre: parseInt(v)})}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1º Bimestre</SelectItem>
              <SelectItem value="2">2º Bimestre</SelectItem>
              <SelectItem value="3">3º Bimestre</SelectItem>
              <SelectItem value="4">4º Bimestre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Cards de Classificação */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Turmas Críticas (<50%)"
          value={data.classificacao.criticas}
          icon={<AlertCircleIcon />}
          color="red"
        />
        <StatCard
          title="Turmas em Atenção (50-70%)"
          value={data.classificacao.atencao}
          icon={<AlertTriangleIcon />}
          color="orange"
        />
        <StatCard
          title="Turmas no Ritmo (>70%)"
          value={data.classificacao.no_ritmo}
          icon={<CheckCircleIcon />}
          color="green"
        />
      </div>

      {/* Alerta: Turmas Priorizadas */}
      {data.turmas_priorizadas.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Atenção! Turmas Prioritárias</AlertTitle>
          <AlertDescription>
            {data.turmas_priorizadas.length} turmas estão com cobertura crítica (<50%) e requerem intervenção urgente.
          </AlertDescription>
        </Alert>
      )}

      {/* Grid de Turmas */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {data.metricas.map(turma => (
          <TurmaCard key={turma.turma_id} turma={turma} />
        ))}
      </div>
    </div>
  );
}
```
**Then** a página exibe grid de turmas com classificação visual

**Given** o componente da página existe
**When** crio componente `TurmaCard`:
```tsx
// components/TurmaCard.tsx
export function TurmaCard({ turma }) {
  const navigate = useNavigate();

  const getCardBorderColor = (percentual: number) => {
    if (percentual < 50) return 'border-l-4 border-red-500';
    if (percentual < 70) return 'border-l-4 border-orange-500';
    return 'border-l-4 border-green-500';
  };

  const getStatusBadge = (percentual: number) => {
    if (percentual < 50) return <Badge variant="destructive">Crítico</Badge>;
    if (percentual < 70) return <Badge variant="warning">Atenção</Badge>;
    return <Badge variant="success">No Ritmo</Badge>;
  };

  return (
    <Card className={cn('p-4 cursor-pointer hover:shadow-lg transition', getCardBorderColor(turma.percentual_cobertura))}
          onClick={() => navigate(`/dashboard/coordenador/turmas/${turma.turma_id}/detalhes`)}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">{turma.turma_nome}</h3>
          <p className="text-sm text-gray-600">{turma.professores}</p>
        </div>
        {getStatusBadge(turma.percentual_cobertura)}
      </div>

      {/* Progresso */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span>Cobertura</span>
          <span className="font-semibold">{turma.percentual_cobertura.toFixed(1)}%</span>
        </div>
        <Progress value={turma.percentual_cobertura} className="h-2" />
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-gray-600">Habilidades</p>
          <p className="font-semibold">{turma.habilidades_trabalhadas}/{turma.habilidades_planejadas}</p>
        </div>
        <div>
          <p className="text-gray-600">Aulas</p>
          <p className="font-semibold">{turma.total_aulas}</p>
        </div>
      </div>
    </Card>
  );
}
```
**Then** cada turma é exibida em card colorido por status (verde/laranja/vermelho)

**Given** implemento drill-down para detalhes da turma
**When** crio endpoint `GET /api/v1/dashboard/coordenador/turmas/{turmaId}/detalhes`:
```typescript
// dashboard.controller.ts
@Get('coordenador/turmas/:turmaId/detalhes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COORDENADOR', 'DIRETOR')
async getDetalhesTurma(
  @Param('turmaId') turmaId: string,
  @CurrentUser() user: Usuario,
  @Query('bimestre') bimestre?: number,
) {
  // Buscar habilidades planejadas vs trabalhadas
  const detalhes = await this.prisma.$queryRaw`
    SELECT
      h.codigo as habilidade_codigo,
      h.descricao as habilidade_descricao,
      CASE
        WHEN COUNT(a.id) FILTER (
          WHERE jsonb_array_elements(a.cobertura_bncc->'habilidades')->>'codigo' = h.codigo
            AND jsonb_array_elements(a.cobertura_bncc->'habilidades')->>'nivel_cobertura' = 'COMPLETE'
        ) > 0 THEN 'COMPLETE'
        WHEN COUNT(a.id) FILTER (
          WHERE jsonb_array_elements(a.cobertura_bncc->'habilidades')->>'codigo' = h.codigo
            AND jsonb_array_elements(a.cobertura_bncc->'habilidades')->>'nivel_cobertura' = 'PARTIAL'
        ) > 0 THEN 'PARTIAL'
        WHEN COUNT(a.id) FILTER (
          WHERE jsonb_array_elements(a.cobertura_bncc->'habilidades')->>'codigo' = h.codigo
            AND jsonb_array_elements(a.cobertura_bncc->'habilidades')->>'nivel_cobertura' = 'MENTIONED'
        ) > 0 THEN 'MENTIONED'
        ELSE 'NOT_COVERED'
      END as status_cobertura,
      COUNT(DISTINCT au.id) FILTER (WHERE a.status = 'APROVADO') as aulas_relacionadas
    FROM "PlanejamentoHabilidade" ph
    INNER JOIN "Planejamento" p ON ph.planejamento_id = p.id
    INNER JOIN "Habilidade" h ON ph.habilidade_id = h.id
    LEFT JOIN "Aula" au ON au.turma_id = p.turma_id AND au.professor_id = p.professor_id
    LEFT JOIN "Analise" a ON a.aula_id = au.id
    WHERE p.turma_id = ${turmaId}
      AND p.escola_id = ${user.escola_id}
      ${bimestre ? Prisma.sql`AND p.bimestre = ${bimestre}` : Prisma.empty}
    GROUP BY h.codigo, h.descricao
    ORDER BY status_cobertura DESC, h.codigo ASC;
  `;

  return { detalhes };
}
```
**Then** o endpoint retorna status de cada habilidade planejada (COMPLETE/PARTIAL/MENTIONED/NOT_COVERED)

**Given** testo o fluxo completo
**When** sigo os passos:
1. Acesso `/dashboard/coordenador/turmas`
2. Vejo cards de classificação: 2 críticas, 3 atenção, 8 no ritmo
3. Vejo alerta vermelho: "2 turmas prioritárias requerem intervenção"
4. Vejo grid com 13 turmas:
   - 6º Ano B: borda vermelha, 45.5%, badge "Crítico"
   - 7º Ano C: borda laranja, 65%, badge "Atenção"
   - 6º Ano A: borda verde, 85%, badge "No Ritmo"
5. Clico em "6º Ano B" (crítico)
6. Navego para `/dashboard/coordenador/turmas/{id}/detalhes`
7. Vejo lista de 15 habilidades planejadas:
   - EF06MA01: COMPLETE (3 aulas)
   - EF06MA02: PARTIAL (2 aulas)
   - EF06MA03: NOT_COVERED (0 aulas) ⚠️
   - EF06MA04: MENTIONED (1 aula)
   - ... 11 mais habilidades
8. Identifico 5 habilidades NOT_COVERED que precisam atenção urgente
9. Coordenador pode planejar intervenção específica para essa turma
**Then** o dashboard de turmas funciona com identificação visual e drill-down para habilidades

---

### Story 7.4: Dashboard do Diretor - Métricas Agregadas da Escola

As a **Diretor (Dono)**,
I want **visualizar métricas consolidadas da escola inteira**,
So that **posso ter visão executiva do progresso curricular e tomar decisões estratégicas**.

**Acceptance Criteria:**

**Given** a materialized view `cobertura_bimestral` existe
**When** crio endpoint `GET /api/v1/dashboard/diretor/metricas`:
```typescript
// dashboard.controller.ts
@Get('diretor/metricas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('DIRETOR')
@UseInterceptors(CacheInterceptor)
@CacheTTL(3600)
async getMetricasEscola(
  @CurrentUser() user: Usuario,
  @Query() filtros: { bimestre?: number },
) {
  // KPIs consolidados
  const kpis = await this.prisma.$queryRaw<any[]>`
    SELECT
      AVG(percentual_cobertura) as cobertura_geral,
      COUNT(DISTINCT professor_id) as total_professores_ativos,
      COUNT(DISTINCT turma_id) as total_turmas,
      SUM(total_aulas_aprovadas) as total_aulas,
      AVG(tempo_medio_revisao) as tempo_medio_revisao_geral
    FROM cobertura_bimestral
    WHERE escola_id = ${user.escola_id}
      ${filtros.bimestre ? Prisma.sql`AND bimestre = ${filtros.bimestre}` : Prisma.empty};
  `;

  // Distribuição por disciplina
  const porDisciplina = await this.prisma.$queryRaw`
    SELECT
      disciplina,
      AVG(percentual_cobertura) as cobertura_media,
      COUNT(DISTINCT turma_id) as total_turmas,
      SUM(total_aulas_aprovadas) as total_aulas
    FROM cobertura_bimestral
    WHERE escola_id = ${user.escola_id}
      ${filtros.bimestre ? Prisma.sql`AND bimestre = ${filtros.bimestre}` : Prisma.empty}
    GROUP BY disciplina
    ORDER BY cobertura_media DESC;
  `;

  // Evolução temporal (últimos 4 bimestres)
  const evolucao = await this.prisma.$queryRaw`
    SELECT
      bimestre,
      AVG(percentual_cobertura) as cobertura_media
    FROM cobertura_bimestral
    WHERE escola_id = ${user.escola_id}
      AND ano_letivo = EXTRACT(YEAR FROM CURRENT_DATE)
    GROUP BY bimestre
    ORDER BY bimestre ASC;
  `;

  return {
    kpis: kpis[0],
    por_disciplina: porDisciplina,
    evolucao_temporal: evolucao,
  };
}
```
**Then** o endpoint retorna KPIs consolidados, distribuição por disciplina e evolução temporal

**Given** o endpoint existe
**When** testo:
```bash
GET /api/v1/dashboard/diretor/metricas?bimestre=1
```
**Then** recebo:
```json
{
  "kpis": {
    "cobertura_geral": 72.50,
    "total_professores_ativos": 15,
    "total_turmas": 40,
    "total_aulas": 320,
    "tempo_medio_revisao_geral": 210
  },
  "por_disciplina": [
    { "disciplina": "MATEMATICA", "cobertura_media": 75.80, "total_turmas": 15, "total_aulas": 120 },
    { "disciplina": "CIENCIAS", "cobertura_media": 71.20, "total_turmas": 15, "total_aulas": 105 },
    { "disciplina": "LINGUA_PORTUGUESA", "cobertura_media": 70.50, "total_turmas": 10, "total_aulas": 95 }
  ],
  "evolucao_temporal": [
    { "bimestre": 1, "cobertura_media": 72.50 },
    { "bimestre": 2, "cobertura_media": 0 }, // Ainda não iniciado
    { "bimestre": 3, "cobertura_media": 0 },
    { "bimestre": 4, "cobertura_media": 0 }
  ]
}
```

**Given** o endpoint funciona
**When** crio página `/dashboard/diretor`:
```tsx
// pages/DashboardDiretor.tsx
export function DashboardDiretorPage() {
  const [bimestre, setBimestre] = useState<number | undefined>(1);

  const { data, isLoading } = useQuery(
    ['dashboard-diretor', bimestre],
    () => api.get('/dashboard/diretor/metricas', { params: { bimestre } }).then(res => res.data)
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Executivo</h1>

      {/* Filtro */}
      <Card className="p-4 mb-6">
        <Select value={bimestre?.toString() || 'all'} onValueChange={(v) => setBimestre(v === 'all' ? undefined : parseInt(v))}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Ano Inteiro</SelectItem>
            <SelectItem value="1">1º Bimestre</SelectItem>
            <SelectItem value="2">2º Bimestre</SelectItem>
            <SelectItem value="3">3º Bimestre</SelectItem>
            <SelectItem value="4">4º Bimestre</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Cobertura Geral"
          value={`${data.kpis.cobertura_geral.toFixed(1)}%`}
          icon={<TrendingUpIcon />}
          color="blue"
        />
        <StatCard
          title="Professores Ativos"
          value={data.kpis.total_professores_ativos}
          icon={<UsersIcon />}
          color="green"
        />
        <StatCard
          title="Total de Turmas"
          value={data.kpis.total_turmas}
          icon={<SchoolIcon />}
          color="purple"
        />
        <StatCard
          title="Aulas Aprovadas"
          value={data.kpis.total_aulas}
          icon={<CheckCircleIcon />}
          color="cyan"
        />
        <StatCard
          title="Tempo Médio Revisão"
          value={`${Math.floor(data.kpis.tempo_medio_revisao_geral / 60)}min`}
          icon={<ClockIcon />}
          color="orange"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico: Cobertura por Disciplina */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Cobertura por Disciplina</h2>
          <CoberturaPorDisciplinaChart data={data.por_disciplina} />
        </Card>

        {/* Gráfico: Evolução Temporal */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Evolução ao Longo do Ano</h2>
          <EvolucaoTemporalChart data={data.evolucao_temporal} />
        </Card>
      </div>
    </div>
  );
}
```
**Then** a página exibe dashboard executivo com KPIs e gráficos

**Given** o componente da página existe
**When** crio componente `CoberturaPorDisciplinaChart`:
```tsx
// components/CoberturaPorDisciplinaChart.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';

export function CoberturaPorDisciplinaChart({ data }) {
  const COLORS = {
    MATEMATICA: '#2563EB',
    CIENCIAS: '#06B6D4',
    LINGUA_PORTUGUESA: '#8B5CF6',
  };

  const chartData = data.map(d => ({
    disciplina: d.disciplina.replace('_', ' '),
    cobertura: d.cobertura_media,
    turmas: d.total_turmas,
  }));

  return (
    <div className="w-full h-[300px]">
      <BarChart width={400} height={300} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="disciplina" />
        <YAxis domain={[0, 100]} />
        <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
        <Legend />
        <Bar dataKey="cobertura" name="% Cobertura">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[data[index].disciplina]} />
          ))}
        </Bar>
      </BarChart>
    </div>
  );
}
```
**Then** o gráfico de barras mostra cobertura por disciplina com cores distintas

**Given** o componente de gráfico por disciplina existe
**When** crio componente `EvolucaoTemporalChart`:
```tsx
// components/EvolucaoTemporalChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export function EvolucaoTemporalChart({ data }) {
  const chartData = data.map(d => ({
    bimestre: `${d.bimestre}º Bim`,
    cobertura: d.cobertura_media,
  }));

  return (
    <div className="w-full h-[300px]">
      <LineChart width={400} height={300} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="bimestre" />
        <YAxis domain={[0, 100]} />
        <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
        <Legend />
        <Line
          type="monotone"
          dataKey="cobertura"
          stroke="#2563EB"
          strokeWidth={3}
          name="% Cobertura Média"
          dot={{ r: 6 }}
        />
      </LineChart>
    </div>
  );
}
```
**Then** o gráfico de linha mostra evolução da cobertura ao longo dos bimestres

**Given** testo o fluxo completo
**When** sigo os passos:
1. Faço login como Diretor
2. Acesso `/dashboard/diretor`
3. Vejo 5 KPI cards:
   - Cobertura Geral: 72.5%
   - Professores Ativos: 15
   - Total de Turmas: 40
   - Aulas Aprovadas: 320
   - Tempo Médio Revisão: 3min 30s
4. Vejo gráfico de barras "Cobertura por Disciplina":
   - Matemática: 75.8% (barra azul)
   - Ciências: 71.2% (barra ciano)
   - Língua Portuguesa: 70.5% (barra roxa)
5. Vejo gráfico de linha "Evolução ao Longo do Ano":
   - 1º Bim: 72.5%
   - 2º-4º Bim: ainda sem dados (linha reta em 0)
6. Seleciono filtro "Ano Inteiro" → vejo dados consolidados de todos os bimestres
7. Tenho visão executiva clara da escola sem detalhes granulares de professores individuais
**Then** o dashboard executivo do diretor funciona com visão consolidada da escola

---

### Story 7.5: RBAC Guards & Privacy Enforcement

As a **desenvolvedor**,
I want **garantir que Coordenador NÃO pode acessar transcrições brutas**,
So that **a privacidade do professor é respeitada e apenas métricas agregadas são expostas**.

**Acceptance Criteria:**

**Given** o endpoint `GET /aulas/{id}/analise` existe (Epic 6, Story 6.1)
**When** confirmo que tem guard `@Roles('PROFESSOR')`:
```typescript
// analises.controller.ts (Epic 6)
@Get(':aulaId/analise')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PROFESSOR') // ✅ Apenas professor
async getAnaliseByAula(...) {
  // Verificação adicional: aula pertence ao professor
  if (aula.professor_id !== user.id) {
    throw new ForbiddenException('Você não tem acesso a esta aula');
  }
  // ...
}
```
**Then** o endpoint é restrito a PROFESSOR apenas

**Given** o guard `@Roles()` existe
**When** testo com token de Coordenador:
```bash
GET /api/v1/aulas/{aulaId}/analise
Authorization: Bearer {token-coordenador}
```
**Then** recebo `403 Forbidden: "Insufficient permissions"`

**Given** quero testar todos endpoints de dashboard
**When** crio teste E2E de segurança:
```typescript
// test/dashboard-security.e2e-spec.ts
describe('Dashboard Security (E2E)', () => {
  let coordenadorToken: string;
  let professorToken: string;
  let diretorToken: string;

  beforeAll(async () => {
    // Setup: Login com cada role
    coordenadorToken = await loginAs('coordenador@escola.com');
    professorToken = await loginAs('professor@escola.com');
    diretorToken = await loginAs('diretor@escola.com');
  });

  describe('Coordenador Permissions', () => {
    it('DEVE acessar dashboard de professores', async () => {
      const res = await request(app.getHttpServer())
        .get('/dashboard/coordenador/professores')
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.metricas).toBeDefined();
    });

    it('DEVE acessar dashboard de turmas', async () => {
      const res = await request(app.getHttpServer())
        .get('/dashboard/coordenador/turmas')
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(res.status).toBe(200);
    });

    it('NÃO DEVE acessar transcrição bruta', async () => {
      const res = await request(app.getHttpServer())
        .get(`/aulas/${aulaId}/analise`)
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Insufficient permissions');
    });

    it('NÃO DEVE acessar endpoint de diretor', async () => {
      const res = await request(app.getHttpServer())
        .get('/dashboard/diretor/metricas')
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Diretor Permissions', () => {
    it('DEVE acessar dashboard executivo', async () => {
      const res = await request(app.getHttpServer())
        .get('/dashboard/diretor/metricas')
        .set('Authorization', `Bearer ${diretorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.kpis).toBeDefined();
    });

    it('DEVE acessar dashboards de coordenador (herança)', async () => {
      const res = await request(app.getHttpServer())
        .get('/dashboard/coordenador/professores')
        .set('Authorization', `Bearer ${diretorToken}`);

      expect(res.status).toBe(200);
    });

    it('NÃO DEVE acessar transcrição bruta', async () => {
      const res = await request(app.getHttpServer())
        .get(`/aulas/${aulaId}/analise`)
        .set('Authorization', `Bearer ${diretorToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Professor Permissions', () => {
    it('DEVE acessar apenas suas próprias transcrições', async () => {
      const res = await request(app.getHttpServer())
        .get(`/aulas/${professorAulaId}/analise`)
        .set('Authorization', `Bearer ${professorToken}`);

      expect(res.status).toBe(200);
    });

    it('NÃO DEVE acessar transcrição de outro professor', async () => {
      const res = await request(app.getHttpServer())
        .get(`/aulas/${outroProfessorAulaId}/analise`)
        .set('Authorization', `Bearer ${professorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Você não tem acesso');
    });

    it('NÃO DEVE acessar dashboards de coordenador', async () => {
      const res = await request(app.getHttpServer())
        .get('/dashboard/coordenador/professores')
        .set('Authorization', `Bearer ${professorToken}`);

      expect(res.status).toBe(403);
    });
  });
});
```
**Then** os testes validam permissões de cada role

**Given** os testes E2E existem
**When** executo `npm run test:e2e dashboard-security`
**Then** todos os testes passam ✅

**Given** quero documentar permissões claramente
**When** adiciono tabela de permissões ao README:
```markdown
## RBAC - Permissões por Role

| Recurso                          | Professor | Coordenador | Diretor |
|----------------------------------|-----------|-------------|---------|
| Ver própria transcrição/análise  | ✅        | ❌          | ❌      |
| Ver transcrição de outro prof    | ❌        | ❌          | ❌      |
| Dashboard pessoal cobertura      | ✅        | ❌          | ❌      |
| Dashboard métricas por professor | ❌        | ✅          | ✅      |
| Dashboard métricas por turma     | ❌        | ✅          | ✅      |
| Dashboard executivo escola       | ❌        | ❌          | ✅      |
| Editar/aprovar relatórios        | ✅        | ❌          | ❌      |
| Cadastrar planejamento           | ✅        | ❌          | ❌      |
| Upload de áudio                  | ✅        | ❌          | ❌      |

### Princípio de Privacidade

**Transcrições brutas são SEMPRE privadas ao professor.**

Coordenadores e Diretores têm acesso apenas a:
- Métricas agregadas (% cobertura, quantidade de aulas)
- Habilidades BNCC trabalhadas (códigos, não evidências literais)
- Tempo médio de revisão

Coordenadores NÃO podem ver:
- Texto da transcrição
- Evidências literais
- Relatórios completos
- Observações do professor
```
**Then** as permissões estão documentadas claramente

**Given** testo o fluxo completo de privacy
**When** sigo os passos:
1. Professor faz upload de aula → transcrição gerada → análise completa
2. Professor acessa `/aulas/{id}/analise` → vê transcrição bruta ✅
3. Coordenador tenta acessar `/aulas/{id}/analise` → 403 Forbidden ❌
4. Coordenador acessa `/dashboard/coordenador/professores` → vê apenas % cobertura ✅
5. Coordenador acessa `/dashboard/coordenador/turmas/{id}/detalhes` → vê lista de habilidades (códigos) sem evidências literais ✅
6. Diretor acessa `/dashboard/diretor` → vê KPIs consolidados ✅
7. Diretor tenta acessar `/aulas/{id}/analise` → 403 Forbidden ❌
8. Testes E2E validam todas as permissões → 100% pass ✅
**Then** a privacidade do professor está garantida por guards e testes

---

**Epic 7 COMPLETO!** ✅

**Resumo:**
- 5 stories criadas
- Materialized view `cobertura_bimestral` para performance (<200ms queries)
- Bull job para refresh diário (cron 2h AM) + trigger manual
- Dashboard Coordenador: Ranking de professores, drill-down para turmas, identificação de atrasos
- Dashboard Coordenador: Grid visual de turmas (verde/laranja/vermelho), drill-down para habilidades
- Dashboard Diretor: KPIs executivos (cobertura geral, professores ativos, aulas), gráficos (por disciplina, evolução temporal)
- RBAC enforcement: Coordenador/Diretor NÃO acessam transcrições brutas (403 Forbidden)
- Testes E2E de segurança validam permissões de cada role
- Cache Redis (TTL 1h) para reduzir carga no DB
- Privacidade do professor garantida por design

---

## Epic 8: Administração & Monitoramento Interno

**Goal:** Admins internos monitoram saúde operacional do sistema (STT, análises, filas, custos, qualidade de prompts) para identificar problemas proativamente, otimizar custos e melhorar qualidade dos outputs de IA.

**User Outcome:** Time de operações detecta falhas antes que usuários reclamem, identifica escolas com custos altos, e melhora continuamente os prompts de IA através de feedback de aprovação.

**FRs covered:** FR46, FR47, FR48, FR49, FR50

**Key Deliverables:**
- Dashboard de monitoramento de STT (taxa de erro, provider usado, tempo médio)
- Dashboard de monitoramento de análise (fila Bull, tempo processamento, erros)
- Dashboard de custos por escola (ranking, evolução mensal, alertas)
- Dashboard de qualidade de prompts (taxa de aprovação, A/B testing, diffs)
- Alertas automáticos (taxa erro > 5%, custo mensal > threshold, prompt < 80% aprovação)

**Technical Notes:**
- Role `ADMIN_INTERNO` (separado de roles da escola: Professor/Coordenador/Diretor)
- Endpoints protegidos: `@Roles('ADMIN_INTERNO')` + guard de tenant (admin vê todas escolas)
- Bull Board UI (dashboard nativo do Bull) para visualizar filas em real-time
- Sentry integration para rastreamento de erros de STT/LLM
- Queries de analytics: `Transcricao`, `Analise`, `Prompt` com agregações
- Cache Redis: Métricas de monitoramento (TTL 5min) para reduzir carga

---

### Story 8.1: Dashboard de Monitoramento de STT

As a **Admin Interno**,
I want **monitorar taxa de erro e performance de transcrições**,
So that **posso identificar problemas com providers de STT e trocar para fallback se necessário**.

**Acceptance Criteria:**

**Given** o schema Prisma tem entidade `Transcricao` (criada no Epic 4):
```prisma
model Transcricao {
  id                  String   @id @default(uuid())
  aula_id             String   @unique
  aula                Aula     @relation(fields: [aula_id], references: [id], onDelete: Cascade)

  // Transcrição
  texto               String   @db.Text
  idioma_detectado    String?  // "pt-BR"
  confianca_media     Decimal? @db.Decimal(5, 2) // 0-100

  // Processamento
  provider_usado      ProviderSTT // WHISPER_OPENAI, GOOGLE_SPEECH
  provider_fallback   Boolean  @default(false) // True se primary falhou
  tempo_processamento Int      // Segundos
  custo_estimado      Decimal  @db.Decimal(10, 4) // Em reais
  duracao_audio       Int      // Segundos

  // Status e erro
  status              StatusTranscricao @default(PROCESSANDO)
  erro_mensagem       String?  @db.Text

  escola_id           String
  escola              Escola   @relation(fields: [escola_id], references: [id])

  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  @@index([escola_id])
  @@index([status])
  @@index([provider_usado])
  @@index([created_at])
}

enum StatusTranscricao {
  PROCESSANDO
  COMPLETA
  ERRO
}
```
**When** confirmo que o schema existe
**Then** a entidade Transcricao está pronta com campos de monitoramento

**Given** a entidade existe
**When** crio endpoint `GET /api/v1/admin/monitoramento/stt`:
```typescript
// admin.controller.ts
@Get('monitoramento/stt')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_INTERNO')
@UseInterceptors(CacheInterceptor)
@CacheTTL(300) // Cache 5 minutos
async getMonitoramentoSTT(
  @Query() filtros: FiltrosMonitoramentoDto,
) {
  const periodo = filtros.periodo || '24h'; // 1h, 24h, 7d, 30d
  const dataInicio = this.calcularDataInicio(periodo);

  // KPIs
  const kpis = await this.prisma.transcricao.aggregate({
    where: {
      created_at: { gte: dataInicio },
    },
    _count: { _all: true },
    _avg: {
      tempo_processamento: true,
      confianca_media: true,
    },
  });

  const taxaSucesso = await this.prisma.transcricao.count({
    where: {
      created_at: { gte: dataInicio },
      status: 'COMPLETA',
    },
  });

  const taxaErro = await this.prisma.transcricao.count({
    where: {
      created_at: { gte: dataInicio },
      status: 'ERRO',
    },
  });

  const useFallback = await this.prisma.transcricao.count({
    where: {
      created_at: { gte: dataInicio },
      provider_fallback: true,
    },
  });

  // Distribuição por provider
  const porProvider = await this.prisma.transcricao.groupBy({
    by: ['provider_usado'],
    where: {
      created_at: { gte: dataInicio },
    },
    _count: { _all: true },
    _avg: { tempo_processamento: true },
  });

  // Erros ao longo do tempo (agrupado por hora)
  const errosTimeline = await this.prisma.$queryRaw`
    SELECT
      DATE_TRUNC('hour', created_at) as hora,
      COUNT(*) FILTER (WHERE status = 'ERRO') as total_erros,
      COUNT(*) as total
    FROM "Transcricao"
    WHERE created_at >= ${dataInicio}
    GROUP BY hora
    ORDER BY hora ASC;
  `;

  return {
    kpis: {
      total: kpis._count._all,
      sucesso: taxaSucesso,
      erro: taxaErro,
      taxa_sucesso: (taxaSucesso / kpis._count._all) * 100,
      taxa_erro: (taxaErro / kpis._count._all) * 100,
      fallback_usado: useFallback,
      tempo_medio: kpis._avg.tempo_processamento,
      confianca_media: kpis._avg.confianca_media,
    },
    por_provider: porProvider,
    erros_timeline: errosTimeline,
  };
}

export class FiltrosMonitoramentoDto {
  @IsOptional()
  @IsEnum(['1h', '24h', '7d', '30d'])
  periodo?: string;
}
```
**Then** o endpoint retorna métricas completas de STT

**Given** o endpoint existe
**When** testo com diferentes períodos:
```bash
GET /api/v1/admin/monitoramento/stt?periodo=24h
Authorization: Bearer {token-admin}
```
**Then** recebo:
```json
{
  "kpis": {
    "total": 150,
    "sucesso": 145,
    "erro": 5,
    "taxa_sucesso": 96.67,
    "taxa_erro": 3.33,
    "fallback_usado": 8,
    "tempo_medio": 180,
    "confianca_media": 87.50
  },
  "por_provider": [
    {
      "provider_usado": "WHISPER_OPENAI",
      "_count": { "_all": 142 },
      "_avg": { "tempo_processamento": 175 }
    },
    {
      "provider_usado": "GOOGLE_SPEECH",
      "_count": { "_all": 8 },
      "_avg": { "tempo_processamento": 220 }
    }
  ],
  "erros_timeline": [
    { "hora": "2026-02-09T10:00:00Z", "total_erros": 2, "total": 50 },
    { "hora": "2026-02-09T11:00:00Z", "total_erros": 1, "total": 45 },
    { "hora": "2026-02-09T12:00:00Z", "total_erros": 2, "total": 55 }
  ]
}
```

**Given** o endpoint funciona
**When** crio sistema de alertas para taxa de erro alta:
```typescript
// services/alertas.service.ts
@Injectable()
export class AlertasService {
  constructor(
    private prisma: PrismaService,
    private sentryService: SentryService,
  ) {}

  @Cron('*/15 * * * *') // A cada 15 minutos
  async verificarTaxaErroSTT() {
    const ultimaHora = new Date(Date.now() - 60 * 60 * 1000);

    const stats = await this.prisma.transcricao.groupBy({
      by: ['status'],
      where: { created_at: { gte: ultimaHora } },
      _count: { _all: true },
    });

    const total = stats.reduce((acc, s) => acc + s._count._all, 0);
    const erros = stats.find(s => s.status === 'ERRO')?._count._all || 0;
    const taxaErro = (erros / total) * 100;

    // Alerta se taxa > 5%
    if (taxaErro > 5) {
      this.sentryService.captureMessage(
        `ALERTA: Taxa de erro STT acima do limite: ${taxaErro.toFixed(2)}% (${erros}/${total})`,
        'warning',
      );

      // Enviar notificação (Slack, email, etc.)
      await this.notificarEquipe({
        tipo: 'STT_ERROR_RATE_HIGH',
        taxa_erro: taxaErro,
        erros,
        total,
      });
    }
  }
}
```
**Then** alertas automáticos são enviados quando taxa de erro > 5%

**Given** o backend está pronto
**When** crio página `/admin/monitoramento/stt`:
```tsx
// pages/AdminMonitoramentoSTT.tsx
export function AdminMonitoramentoSTTPage() {
  const [periodo, setPeriodo] = useState('24h');

  const { data, isLoading } = useQuery(
    ['admin-stt', periodo],
    () => api.get('/admin/monitoramento/stt', { params: { periodo } }).then(res => res.data),
    { refetchInterval: 60000 } // Auto-refresh a cada 1min
  );

  if (isLoading) return <LoadingSpinner />;

  const alertaTaxaErro = data.kpis.taxa_erro > 5;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Monitoramento STT</h1>

      {/* Filtro de Período */}
      <Card className="p-4 mb-6">
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Última Hora</SelectItem>
            <SelectItem value="24h">Últimas 24h</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {/* Alerta */}
      {alertaTaxaErro && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Taxa de Erro Alta!</AlertTitle>
          <AlertDescription>
            Taxa de erro STT está em {data.kpis.taxa_erro.toFixed(2)}% (acima do limite de 5%).
            Verifique logs do Sentry e considere trocar provider primário.
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total de Transcrições"
          value={data.kpis.total}
          icon={<FileTextIcon />}
          color="blue"
        />
        <StatCard
          title="Taxa de Sucesso"
          value={`${data.kpis.taxa_sucesso.toFixed(1)}%`}
          icon={<CheckCircleIcon />}
          color="green"
        />
        <StatCard
          title="Taxa de Erro"
          value={`${data.kpis.taxa_erro.toFixed(1)}%`}
          icon={<AlertTriangleIcon />}
          color={alertaTaxaErro ? 'red' : 'orange'}
        />
        <StatCard
          title="Fallback Usado"
          value={data.kpis.fallback_usado}
          icon={<RefreshIcon />}
          color="purple"
        />
        <StatCard
          title="Tempo Médio"
          value={`${Math.floor(data.kpis.tempo_medio / 60)}min ${data.kpis.tempo_medio % 60}s`}
          icon={<ClockIcon />}
          color="cyan"
        />
        <StatCard
          title="Confiança Média"
          value={`${data.kpis.confianca_media.toFixed(1)}%`}
          icon={<TrendingUpIcon />}
          color="green"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Provider */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Uso por Provider</h2>
          <PieChart width={400} height={300}>
            <Pie
              data={data.por_provider.map(p => ({
                name: p.provider_usado,
                value: p._count._all,
              }))}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {data.por_provider.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#2563EB' : '#06B6D4'} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </Card>

        {/* Timeline de Erros */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Erros ao Longo do Tempo</h2>
          <LineChart width={500} height={300} data={data.erros_timeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hora" tickFormatter={(date) => format(new Date(date), 'HH:mm')} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total_erros" stroke="#EF4444" strokeWidth={2} name="Erros" />
            <Line type="monotone" dataKey="total" stroke="#10B981" strokeWidth={2} name="Total" />
          </LineChart>
        </Card>
      </div>
    </div>
  );
}
```
**Then** a página exibe dashboard de monitoramento com auto-refresh

**Given** testo o fluxo completo
**When** sigo os passos:
1. Faço login como Admin Interno
2. Acesso `/admin/monitoramento/stt`
3. Vejo KPIs últimas 24h: 150 transcrições, 96.67% sucesso, 3.33% erro, 8 fallbacks
4. Taxa de erro está abaixo de 5% → sem alerta
5. Vejo gráfico pizza: Whisper 95%, Google Speech 5% (fallback)
6. Vejo gráfico linha: timeline de erros (2 erros às 10h, 1 às 11h, 2 às 12h)
7. Mudo filtro para "Última Hora" → vejo métricas atualizadas
8. Página auto-refresh a cada 1min → dados sempre atualizados
9. Simulo cenário: 10 erros em 1h (>5%)
10. Alerta vermelho aparece: "Taxa de erro alta! 6.67%"
11. Sentry recebe mensagem de alerta
**Then** o monitoramento de STT funciona com alertas automáticos

---

### Story 8.2: Dashboard de Monitoramento de Análise Pedagógica

As a **Admin Interno**,
I want **monitorar filas de processamento e tempo de análise**,
So that **posso identificar gargalos e escalar workers se necessário**.

**Acceptance Criteria:**

**Given** uso Bull queue para processamento assíncrono (Epic 4 + 5)
**When** instalo Bull Board para UI nativa:
```bash
npm install @bull-board/api @bull-board/nestjs
```
**Then** a dependência está instalada

**Given** Bull Board está instalado
**When** configuro no módulo NestJS:
```typescript
// app.module.ts
import { BullBoardModule } from '@bull-board/nestjs';
import { BullAdapter } from '@bull-board/api/bullAdapter';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'transcribe-queue' },
      { name: 'analyze-queue' },
      { name: 'refresh-cobertura-queue' },
    ),
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: BullAdapter,
    }),
    BullBoardModule.forFeature(
      { name: 'transcribe-queue', adapter: BullAdapter },
      { name: 'analyze-queue', adapter: BullAdapter },
      { name: 'refresh-cobertura-queue', adapter: BullAdapter },
    ),
  ],
})
```
**Then** Bull Board UI está disponível em `/admin/queues`

**Given** Bull Board está configurado
**When** adiciono guard de autenticação:
```typescript
// guards/bull-board-auth.guard.ts
@Injectable()
export class BullBoardAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Apenas ADMIN_INTERNO pode acessar
    return user && user.role === 'ADMIN_INTERNO';
  }
}

// app.module.ts (adicionar guard)
BullBoardModule.forRoot({
  route: '/admin/queues',
  adapter: BullAdapter,
  middleware: {
    guard: BullBoardAuthGuard,
  },
}),
```
**Then** apenas admins internos podem acessar `/admin/queues`

**Given** Bull Board está protegido
**When** crio endpoint customizado para métricas agregadas:
```typescript
// admin.controller.ts
@Get('monitoramento/analise')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_INTERNO')
@UseInterceptors(CacheInterceptor)
@CacheTTL(300)
async getMonitoramentoAnalise(
  @Query() filtros: FiltrosMonitoramentoDto,
) {
  const periodo = filtros.periodo || '24h';
  const dataInicio = this.calcularDataInicio(periodo);

  // KPIs de Analise
  const kpis = await this.prisma.analise.aggregate({
    where: {
      created_at: { gte: dataInicio },
    },
    _count: { _all: true },
    _avg: {
      tempo_processamento: true,
      custo_estimado: true,
      tempo_revisao: true,
    },
  });

  const porProvider = await this.prisma.analise.groupBy({
    by: ['provider_usado'],
    where: {
      created_at: { gte: dataInicio },
    },
    _count: { _all: true },
    _avg: { tempo_processamento: true, custo_estimado: true },
  });

  const porStatus = await this.prisma.analise.groupBy({
    by: ['status'],
    where: {
      created_at: { gte: dataInicio },
    },
    _count: { _all: true },
  });

  // Métricas da fila Bull (real-time)
  const analyzeQueue = this.getQueue('analyze-queue');
  const queueStats = {
    waiting: await analyzeQueue.getWaitingCount(),
    active: await analyzeQueue.getActiveCount(),
    completed: await analyzeQueue.getCompletedCount(),
    failed: await analyzeQueue.getFailedCount(),
    delayed: await analyzeQueue.getDelayedCount(),
  };

  return {
    kpis: {
      total: kpis._count._all,
      tempo_medio: kpis._avg.tempo_processamento,
      custo_medio: kpis._avg.custo_estimado,
      tempo_revisao_medio: kpis._avg.tempo_revisao,
    },
    por_provider: porProvider,
    por_status: porStatus,
    queue_stats: queueStats,
  };
}
```
**Then** o endpoint retorna métricas de análise + status da fila

**Given** o endpoint existe
**When** testo:
```bash
GET /api/v1/admin/monitoramento/analise?periodo=24h
```
**Then** recebo:
```json
{
  "kpis": {
    "total": 140,
    "tempo_medio": 52,
    "custo_medio": 0.12,
    "tempo_revisao_medio": 210
  },
  "por_provider": [
    {
      "provider_usado": "CLAUDE_SONNET",
      "_count": { "_all": 120 },
      "_avg": { "tempo_processamento": 50, "custo_estimado": 0.10 }
    },
    {
      "provider_usado": "GPT4",
      "_count": { "_all": 20 },
      "_avg": { "tempo_processamento": 60, "custo_estimado": 0.22 }
    }
  ],
  "por_status": [
    { "status": "AGUARDANDO_REVISAO", "_count": { "_all": 85 } },
    { "status": "APROVADO", "_count": { "_all": 50 } },
    { "status": "REJEITADO", "_count": { "_all": 5 } }
  ],
  "queue_stats": {
    "waiting": 12,
    "active": 3,
    "completed": 125,
    "failed": 2,
    "delayed": 0
  }
}
```

**Given** o backend está pronto
**When** crio página `/admin/monitoramento/analise`:
```tsx
// pages/AdminMonitoramentoAnalise.tsx
export function AdminMonitoramentoAnalisePage() {
  const [periodo, setPeriodo] = useState('24h');

  const { data, isLoading } = useQuery(
    ['admin-analise', periodo],
    () => api.get('/admin/monitoramento/analise', { params: { periodo } }).then(res => res.data),
    { refetchInterval: 30000 } // Auto-refresh a cada 30s
  );

  if (isLoading) return <LoadingSpinner />;

  const alertaFilaAlta = data.queue_stats.waiting > 50;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Monitoramento de Análise</h1>

      {/* Filtro */}
      <Card className="p-4 mb-6">
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Última Hora</SelectItem>
            <SelectItem value="24h">Últimas 24h</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {/* Alerta Fila Alta */}
      {alertaFilaAlta && (
        <Alert variant="warning" className="mb-6">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Fila de Análise Alta!</AlertTitle>
          <AlertDescription>
            {data.queue_stats.waiting} jobs aguardando processamento. Considere escalar workers.
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total de Análises"
          value={data.kpis.total}
          icon={<BarChart2Icon />}
          color="blue"
        />
        <StatCard
          title="Tempo Médio"
          value={`${data.kpis.tempo_medio}s`}
          icon={<ClockIcon />}
          color="purple"
        />
        <StatCard
          title="Custo Médio"
          value={`R$ ${data.kpis.custo_medio.toFixed(3)}`}
          icon={<DollarSignIcon />}
          color="green"
        />
        <StatCard
          title="Tempo Revisão"
          value={`${Math.floor(data.kpis.tempo_revisao_medio / 60)}min`}
          icon={<EditIcon />}
          color="orange"
        />
      </div>

      {/* Status da Fila (Real-time) */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Status da Fila (Real-time)</h2>
        <div className="grid grid-cols-5 gap-4">
          <QueueStatCard label="Aguardando" value={data.queue_stats.waiting} color="yellow" />
          <QueueStatCard label="Processando" value={data.queue_stats.active} color="blue" />
          <QueueStatCard label="Completados" value={data.queue_stats.completed} color="green" />
          <QueueStatCard label="Falhados" value={data.queue_stats.failed} color="red" />
          <QueueStatCard label="Agendados" value={data.queue_stats.delayed} color="purple" />
        </div>
        <div className="mt-4">
          <Button variant="outline" onClick={() => window.open('/admin/queues', '_blank')}>
            Abrir Bull Board (Detalhes)
          </Button>
        </div>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Uso por Provider */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Análises por Provider LLM</h2>
          <BarChart width={500} height={300} data={data.por_provider}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="provider_usado" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="_count._all" fill="#2563EB" name="Total Análises" />
          </BarChart>
        </Card>

        {/* Status de Análises */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Status de Análises</h2>
          <PieChart width={400} height={300}>
            <Pie
              data={data.por_status.map(s => ({
                name: s.status,
                value: s._count._all,
              }))}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              <Cell fill="#F59E0B" /> {/* AGUARDANDO_REVISAO */}
              <Cell fill="#10B981" /> {/* APROVADO */}
              <Cell fill="#EF4444" /> {/* REJEITADO */}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </Card>
      </div>
    </div>
  );
}
```
**Then** a página exibe dashboard com status da fila real-time

**Given** testo o fluxo completo
**When** sigo os passos:
1. Acesso `/admin/monitoramento/analise`
2. Vejo KPIs: 140 análises, 52s tempo médio, R$0.12 custo médio, 3min30s revisão
3. Vejo "Status da Fila": 12 aguardando, 3 processando, 125 completados, 2 falhados
4. Fila está normal (<50 aguardando) → sem alerta
5. Vejo gráfico: Claude Sonnet 86%, GPT-4 14%
6. Vejo gráfico pizza: 61% aguardando revisão, 36% aprovado, 3% rejeitado
7. Clico "Abrir Bull Board" → abre `/admin/queues` em nova aba
8. Bull Board UI mostra detalhes de cada job (retry, progresso, erro logs)
9. Simulo sobrecarga: 60 jobs na fila
10. Alerta laranja aparece: "Fila alta! Considere escalar workers"
**Then** o monitoramento de análise funciona com visibilidade completa da fila

---

### Story 8.3: Dashboard de Custos por Escola

As a **Admin Interno**,
I want **monitorar custos de API (STT + LLM) por escola**,
So that **posso identificar escolas com uso alto e ajustar pricing se necessário**.

**Acceptance Criteria:**

**Given** tenho custos estimados em `Transcricao.custo_estimado` e `Analise.custo_estimado`
**When** crio endpoint `GET /api/v1/admin/custos/escolas`:
```typescript
// admin.controller.ts
@Get('custos/escolas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_INTERNO')
@UseInterceptors(CacheInterceptor)
@CacheTTL(3600) // Cache 1h
async getCustosPorEscola(
  @Query() filtros: { mes?: string }, // "2026-02" formato YYYY-MM
) {
  const mes = filtros.mes || format(new Date(), 'yyyy-MM');
  const [ano, mesNum] = mes.split('-').map(Number);

  const custos = await this.prisma.$queryRaw`
    SELECT
      e.id as escola_id,
      e.nome as escola_nome,
      COALESCE(SUM(t.custo_estimado), 0) as custo_transcricao,
      COALESCE(SUM(a.custo_estimado), 0) as custo_analise,
      COALESCE(SUM(t.custo_estimado), 0) + COALESCE(SUM(a.custo_estimado), 0) as custo_total,
      COUNT(DISTINCT au.id) as total_aulas,
      COUNT(DISTINCT au.professor_id) as professores_ativos
    FROM "Escola" e
    LEFT JOIN "Aula" au ON au.escola_id = e.id
      AND EXTRACT(YEAR FROM au.created_at) = ${ano}
      AND EXTRACT(MONTH FROM au.created_at) = ${mesNum}
    LEFT JOIN "Transcricao" t ON t.aula_id = au.id
    LEFT JOIN "Analise" a ON a.aula_id = au.id
    GROUP BY e.id, e.nome
    ORDER BY custo_total DESC;
  `;

  // Totais gerais
  const totais = custos.reduce(
    (acc, c) => ({
      custo_total: acc.custo_total + parseFloat(c.custo_total),
      aulas: acc.aulas + c.total_aulas,
    }),
    { custo_total: 0, aulas: 0 }
  );

  // Projeção para o mês inteiro (baseado em dias decorridos)
  const diasDecorridos = new Date().getDate();
  const diasNoMes = new Date(ano, mesNum, 0).getDate();
  const projecao = (totais.custo_total / diasDecorridos) * diasNoMes;

  return {
    custos,
    totais: {
      custo_total: totais.custo_total,
      total_aulas: totais.aulas,
      projecao_mensal: projecao,
    },
  };
}
```
**Then** o endpoint retorna custos por escola com projeção mensal

**Given** o endpoint existe
**When** testo:
```bash
GET /api/v1/admin/custos/escolas?mes=2026-02
```
**Then** recebo:
```json
{
  "custos": [
    {
      "escola_id": "uuid1",
      "escola_nome": "Escola Municipal Pedro Álvares",
      "custo_transcricao": 45.80,
      "custo_analise": 67.20,
      "custo_total": 113.00,
      "total_aulas": 95,
      "professores_ativos": 12
    },
    {
      "escola_id": "uuid2",
      "escola_nome": "Colégio São José",
      "custo_transcricao": 32.50,
      "custo_analise": 48.75,
      "custo_total": 81.25,
      "total_aulas": 68,
      "professores_ativos": 8
    }
  ],
  "totais": {
    "custo_total": 194.25,
    "total_aulas": 163,
    "projecao_mensal": 583.50
  }
}
```

**Given** o endpoint funciona
**When** crio sistema de alertas para custos altos:
```typescript
// services/alertas.service.ts
@Cron('0 9 * * *') // Diariamente às 9h
async verificarCustosAltos() {
  const mesAtual = format(new Date(), 'yyyy-MM');
  const { custos } = await this.adminService.getCustosPorEscola({ mes: mesAtual });

  // Alerta se escola > R$1.000/mês
  const escolasAltas = custos.filter(c => parseFloat(c.custo_total) > 1000);

  if (escolasAltas.length > 0) {
    await this.notificarEquipe({
      tipo: 'CUSTOS_ALTOS',
      escolas: escolasAltas.map(e => ({
        nome: e.escola_nome,
        custo: e.custo_total,
      })),
    });
  }
}
```
**Then** alertas automáticos identificam escolas com custos > R$1.000

**Given** o backend está pronto
**When** crio página `/admin/custos/escolas`:
```tsx
// pages/AdminCustosEscolas.tsx
export function AdminCustosEscolasPage() {
  const [mes, setMes] = useState(format(new Date(), 'yyyy-MM'));

  const { data, isLoading } = useQuery(
    ['admin-custos', mes],
    () => api.get('/admin/custos/escolas', { params: { mes } }).then(res => res.data)
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Custos por Escola</h1>

      {/* Filtro de Mês */}
      <Card className="p-4 mb-6">
        <Input
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="w-[200px]"
        />
      </Card>

      {/* Cards de Totais */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Custo Total (Mês Atual)"
          value={`R$ ${data.totais.custo_total.toFixed(2)}`}
          icon={<DollarSignIcon />}
          color="blue"
        />
        <StatCard
          title="Total de Aulas"
          value={data.totais.total_aulas}
          icon={<FileTextIcon />}
          color="green"
        />
        <StatCard
          title="Projeção Mensal"
          value={`R$ ${data.totais.projecao_mensal.toFixed(2)}`}
          icon={<TrendingUpIcon />}
          color="purple"
        />
      </div>

      {/* Tabela de Escolas */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Ranking de Custos por Escola</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ranking</TableHead>
              <TableHead>Escola</TableHead>
              <TableHead>Professores Ativos</TableHead>
              <TableHead>Total Aulas</TableHead>
              <TableHead>Custo STT</TableHead>
              <TableHead>Custo LLM</TableHead>
              <TableHead>Custo Total</TableHead>
              <TableHead>Custo/Aula</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.custos.map((escola, idx) => {
              const custoTotal = parseFloat(escola.custo_total);
              const custoPorAula = custoTotal / escola.total_aulas;
              const alertaAlto = custoTotal > 1000;

              return (
                <TableRow key={escola.escola_id} className={alertaAlto ? 'bg-red-50' : ''}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell className="font-semibold">
                    {escola.escola_nome}
                    {alertaAlto && <Badge variant="destructive" className="ml-2">Alto</Badge>}
                  </TableCell>
                  <TableCell>{escola.professores_ativos}</TableCell>
                  <TableCell>{escola.total_aulas}</TableCell>
                  <TableCell>R$ {parseFloat(escola.custo_transcricao).toFixed(2)}</TableCell>
                  <TableCell>R$ {parseFloat(escola.custo_analise).toFixed(2)}</TableCell>
                  <TableCell className="font-semibold">R$ {custoTotal.toFixed(2)}</TableCell>
                  <TableCell>R$ {custoPorAula.toFixed(3)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
```
**Then** a página exibe ranking de custos com destaque para escolas altas

**Given** testo o fluxo completo
**When** sigo os passos:
1. Acesso `/admin/custos/escolas`
2. Vejo totais: Custo total R$194.25, 163 aulas, Projeção R$583.50
3. Vejo tabela ranking:
   - #1: Escola Pedro Álvares - 12 profs, 95 aulas, R$113.00 (R$1.19/aula)
   - #2: Colégio São José - 8 profs, 68 aulas, R$81.25 (R$1.19/aula)
4. Nenhuma escola acima de R$1.000 → sem alertas
5. Seleciono mês anterior "2026-01" → vejo histórico
6. Simulo cenário: Escola X com R$1.200 em um mês
7. Linha destacada em vermelho com badge "Alto"
8. Alerta automático enviado às 9h: "Escola X com custo R$1.200"
**Then** o dashboard de custos funciona com alertas para custos altos

---

### Story 8.4: Dashboard de Qualidade de Prompts (A/B Testing)

As a **Admin Interno**,
I want **monitorar taxa de aprovação de prompts e identificar low performers**,
So that **posso iterar sobre prompts ruins e melhorar continuamente a qualidade dos outputs de IA**.

**Acceptance Criteria:**

**Given** tenho prompts versionados em `Prompt` table (Epic 5):
```prisma
model Prompt {
  id              String   @id @default(uuid())
  nome            String   // "prompt-cobertura", "prompt-qualitativa", etc.
  versao          String   // "v1.0.0", "v1.1.0"
  conteudo        String   @db.Text
  variaveis       Json?
  modelo_sugerido ProviderLLM?
  ativo           Boolean  @default(false)
  ab_testing      Boolean  @default(false)
  created_at      DateTime @default(now())
  @@unique([nome, versao])
}
```
**When** confirmo que existe campo `prompt_versao` em `Analise`
**Then** posso rastrear qual prompt gerou cada análise

**Given** tenho dados de aprovação em `Analise.status` e `Analise.tempo_revisao`
**When** crio endpoint `GET /api/v1/admin/prompts/qualidade`:
```typescript
// admin.controller.ts
@Get('prompts/qualidade')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_INTERNO')
@UseInterceptors(CacheInterceptor)
@CacheTTL(3600)
async getQualidadePrompts(
  @Query() filtros: { periodo?: string },
) {
  const periodo = filtros.periodo || '30d';
  const dataInicio = this.calcularDataInicio(periodo);

  // Métricas por prompt_versao
  const metricas = await this.prisma.analise.groupBy({
    by: ['prompt_versao'],
    where: {
      created_at: { gte: dataInicio },
    },
    _count: { _all: true },
    _avg: { tempo_revisao: true },
  });

  // Taxa de aprovação por versão
  const taxasAprovacao = await Promise.all(
    metricas.map(async (m) => {
      const aprovados = await this.prisma.analise.count({
        where: {
          prompt_versao: m.prompt_versao,
          status: 'APROVADO',
          created_at: { gte: dataInicio },
        },
      });

      const rejeitados = await this.prisma.analise.count({
        where: {
          prompt_versao: m.prompt_versao,
          status: 'REJEITADO',
          created_at: { gte: dataInicio },
        },
      });

      return {
        prompt_versao: m.prompt_versao,
        total: m._count._all,
        aprovados,
        rejeitados,
        taxa_aprovacao: (aprovados / m._count._all) * 100,
        tempo_revisao_medio: m._avg.tempo_revisao,
      };
    })
  );

  // Identificar low performers (<80% aprovação)
  const lowPerformers = taxasAprovacao.filter(t => t.taxa_aprovacao < 80);

  return {
    metricas: taxasAprovacao,
    low_performers: lowPerformers,
  };
}
```
**Then** o endpoint retorna taxa de aprovação por versão de prompt

**Given** o endpoint existe
**When** testo:
```bash
GET /api/v1/admin/prompts/qualidade?periodo=30d
```
**Then** recebo:
```json
{
  "metricas": [
    {
      "prompt_versao": "v1.0.0",
      "total": 85,
      "aprovados": 78,
      "rejeitados": 7,
      "taxa_aprovacao": 91.76,
      "tempo_revisao_medio": 180
    },
    {
      "prompt_versao": "v1.1.0",
      "total": 60,
      "aprovados": 42,
      "rejeitados": 18,
      "taxa_aprovacao": 70.00,
      "tempo_revisao_medio": 420
    }
  ],
  "low_performers": [
    {
      "prompt_versao": "v1.1.0",
      "total": 60,
      "aprovados": 42,
      "rejeitados": 18,
      "taxa_aprovacao": 70.00,
      "tempo_revisao_medio": 420
    }
  ]
}
```

**Given** quero analisar feedback implícito (diffs)
**When** crio endpoint para buscar diffs mais comuns:
```typescript
// admin.controller.ts
@Get('prompts/:versao/diffs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_INTERNO')
async getDiffsPrompt(
  @Param('versao') versao: string,
  @Query() filtros: { limit?: number },
) {
  const limit = filtros.limit || 20;

  // Buscar análises com relatorio_editado (houve edição)
  const analises = await this.prisma.analise.findMany({
    where: {
      prompt_versao: versao,
      relatorio_editado: { not: null },
      status: 'APROVADO',
    },
    select: {
      id: true,
      relatorio_original: true,
      relatorio_editado: true,
    },
    take: limit,
  });

  // Calcular diffs usando biblioteca
  const diffs = analises.map(a => {
    const original = JSON.stringify(a.relatorio_original);
    const editado = JSON.stringify(a.relatorio_editado);
    const diff = diffChars(original, editado);

    const totalChanges = diff.filter(d => d.added || d.removed).length;

    return {
      analise_id: a.id,
      total_mudancas: totalChanges,
      diff_preview: diff.slice(0, 5), // Primeiras 5 mudanças
    };
  });

  // Ordenar por total de mudanças (mais editado = pior qualidade)
  diffs.sort((a, b) => b.total_mudancas - a.total_mudancas);

  return { diffs };
}
```
**Then** o endpoint retorna diffs mais comuns para análise qualitativa

**Given** os endpoints estão prontos
**When** crio página `/admin/prompts/qualidade`:
```tsx
// pages/AdminPromptsQualidade.tsx
export function AdminPromptsQualidadePage() {
  const [periodo, setPeriodo] = useState('30d');

  const { data, isLoading } = useQuery(
    ['admin-prompts-qualidade', periodo],
    () => api.get('/admin/prompts/qualidade', { params: { periodo } }).then(res => res.data)
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Qualidade de Prompts</h1>

      {/* Filtro */}
      <Card className="p-4 mb-6">
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {/* Alerta Low Performers */}
      {data.low_performers.length > 0 && (
        <Alert variant="warning" className="mb-6">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Prompts com Baixa Taxa de Aprovação</AlertTitle>
          <AlertDescription>
            {data.low_performers.length} versões de prompt estão abaixo de 80% de aprovação.
            Revise e itere sobre esses prompts.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabela de Prompts */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Métricas por Versão de Prompt</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Versão</TableHead>
              <TableHead>Total Análises</TableHead>
              <TableHead>Aprovados</TableHead>
              <TableHead>Rejeitados</TableHead>
              <TableHead>Taxa de Aprovação</TableHead>
              <TableHead>Tempo Revisão Médio</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.metricas.map(metrica => {
              const lowPerformer = metrica.taxa_aprovacao < 80;

              return (
                <TableRow key={metrica.prompt_versao} className={lowPerformer ? 'bg-orange-50' : ''}>
                  <TableCell className="font-semibold">{metrica.prompt_versao}</TableCell>
                  <TableCell>{metrica.total}</TableCell>
                  <TableCell>{metrica.aprovados}</TableCell>
                  <TableCell>{metrica.rejeitados}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={metrica.taxa_aprovacao} className="w-24" />
                      <span className="font-semibold">{metrica.taxa_aprovacao.toFixed(1)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {Math.floor(metrica.tempo_revisao_medio / 60)}min {metrica.tempo_revisao_medio % 60}s
                  </TableCell>
                  <TableCell>
                    {lowPerformer ? (
                      <Badge variant="destructive">Low Performer</Badge>
                    ) : metrica.taxa_aprovacao >= 90 ? (
                      <Badge variant="success">Excelente</Badge>
                    ) : (
                      <Badge variant="default">Bom</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/admin/prompts/${metrica.prompt_versao}/diffs`)}
                    >
                      Ver Diffs
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Heatmap de Performance (opcional) */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Heatmap de Performance</h2>
        <p className="text-sm text-gray-600">
          Verde: &gt;90% aprovação | Amarelo: 80-90% | Laranja: 70-80% | Vermelho: &lt;70%
        </p>
        <div className="grid grid-cols-4 gap-4 mt-4">
          {data.metricas.map(m => (
            <div
              key={m.prompt_versao}
              className={cn(
                'p-4 rounded text-center font-semibold',
                m.taxa_aprovacao >= 90 && 'bg-green-100 text-green-800',
                m.taxa_aprovacao >= 80 && m.taxa_aprovacao < 90 && 'bg-yellow-100 text-yellow-800',
                m.taxa_aprovacao >= 70 && m.taxa_aprovacao < 80 && 'bg-orange-100 text-orange-800',
                m.taxa_aprovacao < 70 && 'bg-red-100 text-red-800'
              )}
            >
              <div className="text-xs mb-1">{m.prompt_versao}</div>
              <div className="text-lg">{m.taxa_aprovacao.toFixed(0)}%</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
```
**Then** a página exibe qualidade de prompts com heatmap visual

**Given** testo o fluxo completo
**When** sigo os passos:
1. Acesso `/admin/prompts/qualidade`
2. Vejo alerta laranja: "1 versão abaixo de 80% aprovação"
3. Vejo tabela:
   - v1.0.0: 85 análises, 91.76% aprovação, 3min revisão (badge verde "Excelente")
   - v1.1.0: 60 análises, 70% aprovação, 7min revisão (badge vermelho "Low Performer") ⚠️
4. Vejo heatmap: v1.0.0 verde, v1.1.0 vermelho
5. Clico "Ver Diffs" em v1.1.0
6. Navego para `/admin/prompts/v1.1.0/diffs`
7. Vejo 20 análises mais editadas:
   - Análise #1: 15 mudanças (professor corrigiu códigos BNCC errados)
   - Análise #2: 12 mudanças (professor expandiu análise qualitativa)
   - Padrão identificado: prompt v1.1.0 gera habilidades BNCC incorretas
8. Admin interno decide: desativar v1.1.0, voltar para v1.0.0
9. Cria v1.2.0 com correções baseadas nos diffs
10. Deploy v1.2.0 → monitora taxa de aprovação nas próximas semanas
**Then** o feedback loop funciona: prompts ruins são identificados e iterados

---

**Epic 8 COMPLETO!** ✅

**Resumo:**
- 4 stories criadas
- Dashboard STT: Taxa de erro, provider usado, tempo médio, alertas se >5% erro
- Dashboard Análise: Fila Bull (real-time), tempo processamento, status de análises, Bull Board UI
- Dashboard Custos: Ranking escolas, custo STT+LLM, projeção mensal, alertas se >R$1.000
- Dashboard Prompts: Taxa de aprovação por versão, identificação de low performers (<80%), análise de diffs
- Alertas automáticos: Erro STT, fila alta, custos altos, prompts ruins
- Feedback loop: Diffs mais comuns → iteração de prompts → melhoria contínua
- Role ADMIN_INTERNO separado das roles da escola
- Cache Redis (TTL 5min-1h) para reduzir carga em queries de analytics

---

## Epic 9: Layout de Navegação & Polimento Visual

**Goal:** Transformar a aplicação de páginas isoladas sem navegação em um produto coeso com sidebar, header e design consistente, garantindo que todas as telas implementadas sejam acessíveis via UI.

**User Outcome:** Todos os usuários (Professor, Coordenador, Diretor, Admin) conseguem navegar naturalmente entre todas as funcionalidades da aplicação sem precisar saber URLs, e a experiência visual reflete a identidade profissional do Ressoa AI.

**FRs covered:** Transversal — melhora usabilidade de FR11, FR29, FR31-FR37, FR46-FR50

**Key Deliverables:**
- Sidebar persistente adaptativa por role (Deep Navy, com ícones e labels)
- Header com breadcrumbs auto-gerados + user dropdown (perfil, logout)
- Sidebar responsiva (mobile drawer, tablet collapsa pra ícones)
- Rotas quebradas corrigidas (DIRETOR redirect, placeholders, forgot-password)
- Design system aplicado consistentemente em todas as pages existentes (tipografia, cores, espaçamento)
- Padronização de ícones (substituição de emoticons por Tabler Icons)

**Technical Notes:**
- Frontend-only — zero mudanças no backend
- Novos componentes shadcn/ui necessários: `sheet` (mobile drawer), `avatar`, `separator`, `collapsible`
- AppLayout wrapa todas as rotas protegidas via React Router `<Outlet />`
- Navegação definida como config por role (fácil de estender quando novos módulos surgirem)
- Sidebar state persistido em localStorage (collapsed/expanded)

**NFRs addressed:**
- NFR-UX-01: Máximo 2 cliques para qualquer funcionalidade principal
- NFR-ACCESS-01: WCAG AAA (contrast 14.8:1, touch targets 44px)

---

### Story 9.1: Layout Shell — Sidebar + Header + Breadcrumbs

As a **usuário autenticado (qualquer role)**,
I want **uma interface com sidebar de navegação e header persistentes**,
So that **posso acessar qualquer funcionalidade sem precisar memorizar URLs ou usar o botão voltar do navegador**.

**Acceptance Criteria:**

**Given** o usuário está autenticado
**When** acessa qualquer rota protegida
**Then** vê layout com 3 áreas: sidebar (esquerda), header (topo), conteúdo (centro-direita)

**Given** o layout renderiza em viewport >= 1024px
**When** a sidebar está visível
**Then**:
- Background Deep Navy (#0A2647)
- Logo "Ressoa AI" no topo com ícone gradiente (Tech Blue → Cyan AI)
- Items de navegação com ícones Lucide + labels
- Item ativo destacado com bg Tech Blue (#2563EB) + sombra
- Largura: 240px expanded, 68px collapsed
- Botão "Recolher/Expandir" no rodapé

**Given** qualquer página protegida carrega
**When** o header renderiza
**Then** exibe breadcrumbs auto-gerados + avatar/nome do usuário + dropdown com logout

**Given** App.tsx define as rotas
**When** rotas protegidas são renderizadas
**Then** todas usam `<AppLayout>` como wrapper via nested routes com `<Outlet />`

---

### Story 9.2: Sidebar Responsiva — Mobile Drawer + Tablet Collapse

As a **usuário em dispositivo móvel ou tablet**,
I want **acessar a navegação através de um menu hambúrguer**,
So that **posso navegar pela aplicação em qualquer tamanho de tela**.

**Acceptance Criteria:**

**Given** viewport < 768px
**When** página carrega
**Then** sidebar fica oculta, header mostra botão hambúrguer, clique abre sidebar como Sheet drawer

**Given** drawer aberto no mobile
**When** clica em item de navegação
**Then** drawer fecha automaticamente e navega para a rota

**Given** viewport entre 768px e 1024px
**When** página carrega
**Then** sidebar inicia colapsada (apenas ícones, 68px)

**Given** qualquer viewport
**When** items de navegação renderizam
**Then** todos têm área de toque mínima de 44x44px

---

### Story 9.3: Fix de Rotas Quebradas e Redirecionamentos

As a **usuário de qualquer role**,
I want **que o login me leve para a página correta e que todas as rotas funcionem**,
So that **não encontro páginas 404 ou "em desenvolvimento" desnecessárias**.

**Acceptance Criteria:**

**Given** DIRETOR faz login
**When** LoginPage redireciona
**Then** navega para `/dashboard/diretor` (NÃO `/dashboard-diretor`)

**Given** COORDENADOR faz login
**When** LoginPage redireciona
**Then** navega para `/dashboard/coordenador/professores` (NÃO `/dashboard-coordenador`)

**Given** rotas placeholder existem (`/dashboard`, `/dashboard-coordenador`, `/admin`)
**When** qualquer uma é acessada
**Then** redirecionam para a página funcional correspondente ao role

**Given** rota `/` é acessada por usuário autenticado
**When** React Router resolve
**Then** redireciona para `getHomeRoute(user.role)` em vez de `/login`

**Given** link "Esqueceu sua senha?" na LoginPage
**When** clicado
**Then** navega para rota válida (placeholder com mensagem ou link desabilitado)

---

### Story 9.4: Navegação CTA — Botão "Nova Aula" Destacado

As a **Professor**,
I want **um botão de "Nova Aula" sempre visível e destacado na sidebar**,
So that **posso iniciar um upload rapidamente de qualquer página da aplicação**.

**Acceptance Criteria:**

**Given** o usuário é PROFESSOR
**When** sidebar renderiza
**Then** item "Nova Aula" tem estilo CTA: Background Focus Orange (#F97316), texto branco, sombra sutil

**Given** sidebar colapsada
**When** CTA renderiza
**Then** mostra ícone Upload com background Focus Orange e tooltip

---

### Story 9.5: Polimento Visual — Pages do Professor

As a **Professor**,
I want **que as páginas de Aulas, Upload, Planejamentos e Cobertura tenham visual profissional e consistente**,
So that **a experiência parece um produto completo, não um protótipo**.

**Acceptance Criteria:**

**Given** qualquer page do Professor carrega
**When** renderiza headers
**Then** usa `font-montserrat font-bold text-deep-navy` (não `text-gray-900`)

**Given** qualquer page do Professor carrega
**When** content renderiza
**Then** container `max-w-7xl`, padding consistente `p-6`, margin entre seções `mb-6`

**Given** dados estão sendo carregados
**When** page mostra loading
**Then** usa Skeleton components em vez de spinners genéricos

**Given** pages tinham headers internos
**When** layout global agora fornece navegação + breadcrumbs
**Then** pages removem padding-top excessivo e headers redundantes

---

### Story 9.6: Polimento Visual — Dashboards de Gestão e Admin

As a **Coordenador, Diretor ou Admin**,
I want **dashboards com visual consistente, profissional e alinhado ao design system**,
So that **a experiência de análise de dados é clara e agradável**.

**Acceptance Criteria:**

**Given** qualquer dashboard carrega
**When** renderiza
**Then** `text-gray-900` → `text-deep-navy`, cores do design system nos StatCards e gráficos

**Given** StatCard é usado em múltiplos dashboards
**When** renderiza
**Then** ícone com fundo circular sutil, valor com `font-montserrat font-bold text-2xl`, hover com elevação

**Given** qualquer dashboard sem dados carrega
**When** renderiza empty state
**Then** ícone centralizado + mensagem acionável + CTA quando aplicável

---

### Story 9.7: Padronização de Ícones — Substituir Emoticons por Tabler Icons

As a **desenvolvedor/usuário**,
I want **todos os ícones da aplicação padronizados com uma biblioteca profissional como Tabler Icons**,
So that **a interface tenha aparência consistente e profissional, sem emoticons misturados**.

**Acceptance Criteria:**

**Given** a aplicação atualmente usa emoticons (📤, 👁️, ✏️, ✅, etc.) em diversos lugares
**When** substituo por ícones da biblioteca Tabler Icons
**Then** todos os emoticons são substituídos por ícones vetoriais consistentes

**Given** Tabler Icons está instalado no projeto
**When** importo ícones
**Then** uso import individual para otimizar bundle size (ex: `import { Upload } from '@tabler/icons-react'`)

**Given** todos os ícones são substituídos
**When** renderizam na UI
**Then** mantêm o mesmo tamanho e cor do design system (classes Tailwind consistentes)

**Given** ícones são usados em diferentes contextos (sidebar, buttons, cards, alerts)
**When** aplico classes de estilo
**Then** uso tamanho padrão `size-5` (20px) para inline, `size-6` (24px) para destaque, `size-4` (16px) para small

---

### Story 9.8: Testing E2E — Navegação e Polimento Visual

As a **desenvolvedor**,
I want **testes E2E que validem navegação, sidebar, breadcrumbs, e visual consistency**,
So that **mudanças futuras não quebrem a experiência de navegação e visual**.

**Acceptance Criteria:**

**Given** aplicação está rodando
**When** usuário faz login como PROFESSOR
**Then** sidebar renderiza com items corretos, CTA "Nova Aula" destacado

**Given** usuário está na página de upload
**When** breadcrumbs renderizam
**Then** mostram "Dashboard > Aulas > Nova Aula"

**Given** usuário é COORDENADOR
**When** navega entre dashboards
**Then** menu lateral muda (sem "Nova Aula"), breadcrumbs corretos

---

## Epic 10: Gestão de Turmas & Suporte a Ensino Médio

**Goal:** Permitir que Diretores e Coordenadores cadastrem turmas de forma independente, e expandir o sistema para suportar Ensino Médio (1º-3º ano EM), mantendo todas as funcionalidades pedagógicas do sistema (planejamento BNCC, análise de cobertura, dashboards) compatíveis com ambos os níveis de ensino.

**User Outcome:**
- **Diretor/Coordenador** pode criar, editar e gerenciar turmas sem depender de seeds ou admin interno
- **Professor** pode lecionar para turmas de Ensino Médio com mesma qualidade de análise pedagógica baseada em BNCC
- **Sistema** suporta escolas que oferecem Fundamental (6º-9º) E Ensino Médio (1º-3º)

**FRs covered:**
- **Novo:** FR51: Diretor/Coordenador pode criar e gerenciar turmas
- **Novo:** FR52: Sistema suporta turmas de Ensino Médio (1º-3º ano)
- **Novo:** FR53: Sistema filtra habilidades BNCC por tipo de ensino (Fundamental vs Médio)
- **Expansão de:** FR3, FR31-FR36 (dashboards e planejamento agora incluem EM)

**Key Deliverables:**
- **Backend:**
  - Expandir modelo `Turma` com campo `tipo_ensino` (ENUM: FUNDAMENTAL, MEDIO)
  - Expandir enum `Serie` para incluir: PRIMEIRO_ANO_EM, SEGUNDO_ANO_EM, TERCEIRO_ANO_EM
  - API CRUD completa de Turmas (POST, PUT, DELETE) com RBAC
  - Seeding de habilidades BNCC do Ensino Médio (~500 habilidades: LGG, MAT, CNT, CHS)
  - Ajustar queries de habilidades para filtrar por `tipo_ensino`
  - Adaptar prompts de IA para considerar faixa etária 14-17 anos (EM)

- **Frontend:**
  - Tela de gestão de turmas (lista, criar, editar, deletar) - acessível por Diretor/Coordenador
  - Formulário de turma com seletor de `tipo_ensino` + `serie` dinâmico
  - Adaptar seletor de habilidades BNCC em planejamento para mostrar LGG/MAT/CNT/CHS quando EM
  - Filtros de `tipo_ensino` em dashboards de cobertura
  - Badge visual diferenciando Fundamental vs Médio

- **Data Migration:**
  - Adicionar `tipo_ensino = FUNDAMENTAL` para turmas existentes (default seguro)
  - Seed script idempotente para habilidades EM

**Technical Notes:**
- **Compatibilidade retroativa:** Turmas existentes recebem `tipo_ensino = FUNDAMENTAL` automaticamente
- **BNCC Ensino Médio:**
  - Estrutura hierárquica diferente: Áreas (LGG, MAT, CNT, CHS) > Competências > Habilidades
  - Código alfanumérico: `EM13LGG101` (EM = Ensino Médio, 13 = etapa, LGG = Linguagens, 101 = habilidade)
  - ~500 habilidades totais (vs 369 do Fundamental)
  - Fonte: BNCC oficial MEC 2018 (mesmo doc que Fundamental)
- **Prompts de IA:**
  - Bloom Taxonomy para EM requer ajuste de complexidade cognitiva (14-17 anos vs 11-14 anos)
  - Metodologias pedagógicas apropriadas para adolescentes (mais investigação, menos direcionamento)
  - Exercícios precisam considerar preparação ENEM/vestibular (EM) vs formação básica (Fundamental)
- **Permissões:**
  - POST/PUT/DELETE `/turmas`: Apenas DIRETOR + COORDENADOR
  - GET `/turmas`: PROFESSOR (filtra por `professor_id`), COORDENADOR/DIRETOR (todas da escola)
- **Validações:**
  - Nome único por escola + ano_letivo + turno (não pode ter "1A" duplicado no mesmo ano/turno)
  - Serie compatível com tipo_ensino (SEXTO_ANO só se FUNDAMENTAL, PRIMEIRO_ANO_EM só se MEDIO)
  - Disciplina válida para ambos níveis (MA/LP/CI aplicam a ambos; LGG/CNT/CHS só para EM)

**NFRs addressed:**
- **NFR-SCALE-02:** Suporte a escolas maiores (Fundamental + Médio = ~2x volume de turmas)
- **NFR-ACCESS-02:** Navegação por teclado em formulário de turmas
- **NFR-SEC-03:** Multi-tenancy (turmas isoladas por escola_id)

**Dependencies:**
- ✅ Epic 0: BNCC seeding infrastructure já existe
- ✅ Epic 1: RBAC foundations já existem (apenas adicionar guards em novos endpoints)
- ✅ Epic 2: Planejamento BNCC já existe (apenas filtrar habilidades por tipo_ensino)

**Estimated Effort:** 8-10 stories, ~4-5 semanas

**Risk Mitigation:**
- **Risco:** BNCC Ensino Médio tem estrutura diferente (sem Unidades Temáticas, usa Competências de Área)
  - **Mitigação:** Modelo de dados já suporta campos opcionais; mapear hierarquia EM como JSON adicional se necessário
- **Risco:** Prompts de IA podem gerar análises inadequadas para EM
  - **Mitigação:** Criar variantes de prompts por faixa etária; A/B testing com professores EM durante rollout

---

### Story 10.1: Backend — Expandir Modelo Turma com Tipo de Ensino e Novas Séries

As a **desenvolvedor**,
I want **expandir o modelo Prisma `Turma` para incluir `tipo_ensino` e novas séries de Ensino Médio**,
So that **o banco de dados suporta tanto Ensino Fundamental quanto Médio sem quebrar dados existentes**.

**Acceptance Criteria:**

**Given** o schema Prisma atual tem `Serie` enum limitado a Fundamental
**When** adiciono ao enum:
```prisma
enum Serie {
  SEXTO_ANO
  SETIMO_ANO
  OITAVO_ANO
  NONO_ANO
  PRIMEIRO_ANO_EM  // Novo
  SEGUNDO_ANO_EM   // Novo
  TERCEIRO_ANO_EM  // Novo
}
```
**Then** o enum é expandido sem remover valores antigos

**Given** o schema Prisma atual tem model `Turma`
**When** adiciono campo:
```prisma
model Turma {
  // ... campos existentes
  tipo_ensino TipoEnsino @default(FUNDAMENTAL)
  // ... relações
}

enum TipoEnsino {
  FUNDAMENTAL
  MEDIO
}
```
**Then** o campo `tipo_ensino` é adicionado com default seguro

**Given** schema Prisma foi alterado
**When** crio migration:
```bash
npx prisma migrate dev --name add-tipo-ensino-and-em-series
```
**Then** migration é criada e aplicada ao banco local

**Given** migration foi aplicada
**When** verifico turmas existentes no banco
**Then** todas têm `tipo_ensino = FUNDAMENTAL` (default automático)

**Given** types Prisma foram regenerados
**When** executo `npx prisma generate`
**Then** tipos TypeScript incluem `TipoEnsino` e novas `Serie`

**Given** DTO `CreateTurmaDto` existe
**When** adiciono validação:
```typescript
@IsEnum(TipoEnsino)
@IsNotEmpty()
tipo_ensino: TipoEnsino;

@IsEnum(Serie)
@IsNotEmpty()
serie: Serie;
```
**Then** validação impede criação de turmas com dados inválidos

**Given** turma EM está sendo criada
**When** valido compatibilidade serie-tipo_ensino:
```typescript
if (tipo_ensino === TipoEnsino.FUNDAMENTAL && !['SEXTO_ANO', 'SETIMO_ANO', 'OITAVO_ANO', 'NONO_ANO'].includes(serie)) {
  throw new BadRequestException('Série incompatível com Ensino Fundamental');
}
if (tipo_ensino === TipoEnsino.MEDIO && !['PRIMEIRO_ANO_EM', 'SEGUNDO_ANO_EM', 'TERCEIRO_ANO_EM'].includes(serie)) {
  throw new BadRequestException('Série incompatível com Ensino Médio');
}
```
**Then** request é rejeitado se serie-tipo_ensino forem incompatíveis

---

### Story 10.2: Backend — API CRUD Completa de Turmas com RBAC

As a **Diretor ou Coordenador**,
I want **uma API REST completa para criar, editar, listar e deletar turmas**,
So that **posso gerenciar turmas sem depender de seeds ou ferramentas internas**.

**Acceptance Criteria:**

**Given** módulo `TurmasModule` existe
**When** adiciono endpoint POST `/api/v1/turmas`:
```typescript
@Post()
@Roles('DIRETOR', 'COORDENADOR')
@UseGuards(JwtAuthGuard, RolesGuard)
async create(@CurrentUser() user, @Body() dto: CreateTurmaDto) {
  return this.turmasService.create({ ...dto, escola_id: user.escolaId });
}
```
**Then** Diretor/Coordenador podem criar turmas

**Given** CreateTurmaDto tem `escola_id` injetado automaticamente
**When** request é processado
**Then** `escola_id` vem de `user.escolaId` (multi-tenancy enforced)

**Given** endpoint PUT `/api/v1/turmas/:id` existe
**When** Diretor/Coordenador atualiza turma:
```typescript
@Put(':id')
@Roles('DIRETOR', 'COORDENADOR')
async update(@Param('id') id: string, @Body() dto: UpdateTurmaDto, @CurrentUser() user) {
  await this.turmasService.ensureTurmaOwnership(id, user.escolaId); // Verifica que turma pertence à escola do user
  return this.turmasService.update(id, dto);
}
```
**Then** turma é atualizada apenas se pertencer à escola do user

**Given** endpoint DELETE `/api/v1/turmas/:id` existe
**When** Diretor deleta turma:
```typescript
@Delete(':id')
@Roles('DIRETOR') // Apenas Diretor pode deletar
async remove(@Param('id') id: string, @CurrentUser() user) {
  await this.turmasService.ensureTurmaOwnership(id, user.escolaId);
  return this.turmasService.softDelete(id); // Soft delete
}
```
**Then** turma é soft-deleted (não removida fisicamente)

**Given** endpoint GET `/api/v1/turmas` existe
**When** Professor faz request
**Then** retorna apenas turmas onde `professor_id = user.userId` (comportamento atual mantido)

**Given** endpoint GET `/api/v1/turmas` existe
**When** Coordenador/Diretor faz request
**Then** retorna TODAS turmas da escola (`escola_id = user.escolaId`)

**Given** validações de unicidade existem
**When** tento criar turma duplicada (mesmo nome + ano_letivo + turno + escola_id)
**Then** retorna 409 Conflict com mensagem: "Turma com esse nome já existe para este ano letivo e turno"

**Given** turma tem planejamentos ou aulas associadas
**When** tento deletar
**Then** soft delete é executado (dados preservados, flag `deleted_at` setada)

**And** endpoints de listagem filtram turmas deletadas (não aparecem)

**Given** Swagger docs existem
**When** acesso `/api/v1/docs`
**Then** endpoints de turmas estão documentados com exemplos de request/response

---

### Story 10.3: Backend — Seeding de Habilidades BNCC do Ensino Médio

As a **desenvolvedor**,
I want **as ~500 habilidades BNCC do Ensino Médio mapeadas e inseridas no banco via seed script**,
So that **professores de EM podem criar planejamentos usando habilidades oficiais**.

**Acceptance Criteria:**

**Given** fonte oficial BNCC 2018 (PDF/site MEC)
**When** extraio habilidades do Ensino Médio
**Then** crio JSON files em `prisma/seeds/bncc-ensino-medio/`:
- `bncc-em-lgg.json` (~150 habilidades Linguagens e suas Tecnologias)
- `bncc-em-mat.json` (~120 habilidades Matemática e suas Tecnologias)
- `bncc-em-cnt.json` (~110 habilidades Ciências da Natureza e suas Tecnologias)
- `bncc-em-chs.json` (~120 habilidades Ciências Humanas e Sociais Aplicadas)

**Given** JSON files estão criados
**When** inspeciono estrutura:
```json
{
  "codigo": "EM13LGG101",
  "descricao": "Compreender e analisar processos de produção...",
  "area": "Linguagens e suas Tecnologias",
  "competencia_especifica": 1,
  "tipo_ensino": "MEDIO",
  "anos": [1, 2, 3] // EM abrange todos os 3 anos
}
```
**Then** estrutura está consistente com BNCC oficial

**Given** seed script `prisma/seed.ts` existe
**When** adiciono função:
```typescript
async function seedBNCCEnsinoMedio() {
  const lgg = JSON.parse(fs.readFileSync('prisma/seeds/bncc-ensino-medio/bncc-em-lgg.json', 'utf-8'));
  const mat = JSON.parse(fs.readFileSync('prisma/seeds/bncc-ensino-medio/bncc-em-mat.json', 'utf-8'));
  const cnt = JSON.parse(fs.readFileSync('prisma/seeds/bncc-ensino-medio/bncc-em-cnt.json', 'utf-8'));
  const chs = JSON.parse(fs.readFileSync('prisma/seeds/bncc-ensino-medio/bncc-em-chs.json', 'utf-8'));

  const allHabilidades = [...lgg, ...mat, ...cnt, ...chs];

  for (const hab of allHabilidades) {
    await prisma.habilidade.upsert({
      where: { codigo: hab.codigo },
      update: {}, // Não atualiza se já existe
      create: {
        codigo: hab.codigo,
        descricao: hab.descricao,
        disciplina: mapAreaToDisciplina(hab.area), // LGG → LINGUA_PORTUGUESA/INGLES, etc
        tipo_ensino: 'MEDIO',
        ano_inicio: 1, // EM não divide por ano como Fundamental
        ano_fim: 3,
        unidade_tematica: null, // EM não usa Unidades Temáticas
        competencia_especifica: hab.competencia_especifica,
        metadata: { area: hab.area } // JSON field para dados adicionais
      }
    });
  }
}
```
**Then** função insere habilidades de forma idempotente

**Given** função `mapAreaToDisciplina` precisa mapear áreas EM para disciplinas
**When** implemento:
```typescript
function mapAreaToDisciplina(area: string): string {
  const map = {
    'Linguagens e suas Tecnologias': 'LINGUA_PORTUGUESA', // Simplificação MVP
    'Matemática e suas Tecnologias': 'MATEMATICA',
    'Ciências da Natureza e suas Tecnologias': 'CIENCIAS',
    'Ciências Humanas e Sociais Aplicadas': 'CIENCIAS_HUMANAS' // Nova disciplina?
  };
  return map[area] || 'OUTROS';
}
```
**Then** mapeamento está funcional

**Given** seed script está completo
**When** executo `npm run prisma:seed`
**Then** ~500 habilidades EM são inseridas sem duplicatas

**And** habilidades existentes (Fundamental) não são afetadas

**Given** habilidades EM foram inseridas
**When** consulto `SELECT COUNT(*) FROM habilidade WHERE tipo_ensino = 'MEDIO'`
**Then** retorna ~500 registros

---

### Story 10.4: Frontend — Tela de Gestão de Turmas (CRUD)

As a **Diretor ou Coordenador**,
I want **uma tela para listar, criar, editar e deletar turmas**,
So that **posso gerenciar turmas da escola sem depender de ferramentas externas**.

**Acceptance Criteria:**

**Given** usuário é DIRETOR ou COORDENADOR
**When** acessa rota `/turmas`
**Then** renderiza `TurmasListPage` com tabela de turmas

**Given** `TurmasListPage` renderiza
**When** carrega dados via `useTurmas()` hook
**Then** exibe tabela com colunas: Nome, Série, Tipo Ensino, Disciplina, Ano Letivo, Turno, Qtd Alunos, Ações

**Given** tabela está renderizada
**When** clico em botão "Nova Turma" (header CTA)
**Then** navega para `/turmas/nova`

**Given** estou em `/turmas/nova`
**When** renderiza `TurmaFormPage`
**Then** exibe formulário com campos:
- Nome (text input)
- Tipo de Ensino (select: Fundamental, Médio)
- Série (select dinâmico baseado em tipo_ensino)
- Disciplina (select)
- Ano Letivo (number input)
- Turno (select: Matutino, Vespertino, Integral)
- Qtd Alunos (number input)
- Professor Responsável (combobox com search)

**Given** tipo_ensino = FUNDAMENTAL selecionado
**When** campo Série renderiza
**Then** mostra opções: 6º Ano, 7º Ano, 8º Ano, 9º Ano

**Given** tipo_ensino = MEDIO selecionado
**When** campo Série renderiza
**Then** mostra opções: 1º Ano (EM), 2º Ano (EM), 3º Ano (EM)

**Given** formulário preenchido corretamente
**When** clico "Salvar"
**Then** POST `/api/v1/turmas` é executado

**And** redirect para `/turmas` com toast de sucesso

**Given** erro de validação ocorre (nome duplicado)
**When** API retorna 409 Conflict
**Then** exibe mensagem de erro embaixo do campo Nome

**Given** tabela de turmas renderizada
**When** clico ícone de editar em uma turma
**Then** navega para `/turmas/:id/editar`

**And** formulário pré-preenche com dados da turma

**Given** estou editando turma
**When** altero dados e clico "Salvar"
**Then** PUT `/api/v1/turmas/:id` é executado

**Given** tabela de turmas renderizada
**When** clico ícone de deletar
**Then** exibe dialog de confirmação: "Deletar turma X? Planejamentos e aulas serão preservados mas turma ficará inativa."

**Given** dialog de confirmação exibido
**When** confirmo deleção
**Then** DELETE `/api/v1/turmas/:id` é executado

**And** turma desaparece da tabela

**Given** tabela tem badge de Tipo Ensino
**When** tipo_ensino = FUNDAMENTAL
**Then** badge azul com texto "Fundamental"

**Given** tabela tem badge de Tipo Ensino
**When** tipo_ensino = MEDIO
**Then** badge roxo com texto "Médio"

---

### Story 10.5: Frontend — Adaptar Seletor de Habilidades BNCC para Ensino Médio

As a **Professor de Ensino Médio**,
I want **que o seletor de habilidades no planejamento mostre habilidades do EM quando aplicável**,
So that **posso planejar minhas aulas com base no currículo oficial do Ensino Médio**.

**Acceptance Criteria:**

**Given** estou criando planejamento para turma de EM
**When** acesso Step 2 do wizard de planejamento
**Then** seletor de habilidades filtra por `tipo_ensino = MEDIO`

**Given** seletor de habilidades EM renderiza
**When** filtro por disciplina
**Then** mostra opções: Linguagens, Matemática, Ciências da Natureza, Ciências Humanas

**Given** seletor de habilidades EM renderiza
**When** não há filtro de "série" específico (EM abrange 1º-3º)
**Then** campo de filtro por série não renderiza (EM não divide habilidades por ano)

**Given** seletor de habilidades EM renderiza
**When** listo habilidades
**Then** exibe código (EM13LGG101), descrição, área, competência específica

**Given** habilidade EM é selecionada
**When** adiciono ao planejamento
**Then** habilidade aparece na lista de selecionadas com badge "EM"

**Given** planejamento de turma Fundamental já existe
**When** edito planejamento
**Then** seletor continua mostrando habilidades Fundamental (não afetado)

**Given** hook `useHabilidadesBNCC` existe
**When** recebe parâmetro `tipo_ensino`:
```typescript
export const useHabilidadesBNCC = (tipo_ensino: 'FUNDAMENTAL' | 'MEDIO', disciplina?: string, serie?: number) => {
  return useQuery({
    queryKey: ['habilidades-bncc', tipo_ensino, disciplina, serie],
    queryFn: async () => {
      const params = { tipo_ensino, disciplina, ...(tipo_ensino === 'FUNDAMENTAL' && { serie }) };
      const { data } = await apiClient.get<Habilidade[]>('/habilidades-bncc', { params });
      return data;
    },
  });
};
```
**Then** retorna habilidades filtradas corretamente

**Given** backend endpoint `/habilidades-bncc` existe
**When** recebe query param `tipo_ensino=MEDIO`
**Then** filtra `WHERE tipo_ensino = 'MEDIO'`

---

### Story 10.6: Backend — Ajustar Prompts de IA para Ensino Médio

As a **Professor de Ensino Médio**,
I want **que a análise pedagógica por IA considere a faixa etária e complexidade cognitiva do EM**,
So that **relatórios e exercícios gerados sejam apropriados para adolescentes de 14-17 anos**.

**Acceptance Criteria:**

**Given** pipeline de 5 prompts existe
**When** aula de turma EM é analisada
**Then** sistema detecta `tipo_ensino = MEDIO` via relacionamento `Aula.turma.tipo_ensino`

**Given** Prompt 1 (Cobertura BNCC) está sendo executado
**When** tipo_ensino = MEDIO
**Then** prompt inclui contexto adicional:
```
A aula analisada é de Ensino Médio (faixa etária 14-17 anos).
Habilidades BNCC do EM são organizadas por ÁREAS e COMPETÊNCIAS ESPECÍFICAS, não Unidades Temáticas.
Considere que alunos de EM têm maior capacidade de abstração e pensamento crítico.
```

**Given** Prompt 2 (Análise Qualitativa) está sendo executado
**When** tipo_ensino = MEDIO
**Then** prompt ajusta Bloom Taxonomy:
```
Para Ensino Médio, espera-se maior uso de níveis cognitivos superiores:
- Análise (40% do conteúdo)
- Avaliação (30%)
- Criação (20%)
- Aplicação/Compreensão (10%)

Metodologias apropriadas: investigação científica, debates estruturados, projetos interdisciplinares.
```

**Given** Prompt 4 (Exercícios) está sendo executado
**When** tipo_ensino = MEDIO
**Then** prompt adapta complexidade:
```
Exercícios devem:
- Usar linguagem técnica apropriada para EM
- Incluir questões dissertativas e de múltipla escolha
- Contextualizar com temas atuais e interdisciplinares
- Preparar para ENEM/vestibulares quando aplicável (especialmente 3º ano EM)
- Evitar infantilização (sem ilustrações excessivas, linguagem simples demais)
```

**Given** serviço `LLMService.executePrompt()` recebe contexto de turma
**When** monta payload para LLM:
```typescript
const context = {
  turma: {
    tipo_ensino: aula.turma.tipo_ensino,
    serie: aula.turma.serie,
    faixa_etaria: aula.turma.tipo_ensino === 'MEDIO' ? '14-17 anos' : '11-14 anos'
  },
  habilidades_planejadas: // filtradas por tipo_ensino
};
```
**Then** LLM recebe contexto completo para gerar análise apropriada

**Given** variantes de prompts foram criadas
**When** comparo análises geradas para mesma transcrição (Fundamental vs Médio)
**Then** relatório EM usa linguagem mais técnica, exercícios mais complexos, metodologias apropriadas

---

### Story 10.7: Frontend — Filtros de Tipo de Ensino em Dashboards

As a **Coordenador ou Diretor**,
I want **filtrar dashboards de cobertura por tipo de ensino (Fundamental, Médio, Todos)**,
So that **posso analisar performance curricular separadamente por nível de ensino**.

**Acceptance Criteria:**

**Given** dashboard de Coordenador (visão por turma) renderiza
**When** adiciono filtro de tipo de ensino no header:
```tsx
<Select value={tipoEnsinoFilter} onValueChange={setTipoEnsinoFilter}>
  <SelectItem value="TODOS">Todos</SelectItem>
  <SelectItem value="FUNDAMENTAL">Ensino Fundamental</SelectItem>
  <SelectItem value="MEDIO">Ensino Médio</SelectItem>
</Select>
```
**Then** filtro é exibido junto com filtros de disciplina e bimestre

**Given** filtro de tipo_ensino = MEDIO selecionado
**When** query de turmas executa
**Then** filtra `WHERE tipo_ensino = 'MEDIO'`

**Given** dashboard de cobertura por professor renderiza
**When** filtro tipo_ensino = FUNDAMENTAL
**Then** métrica de cobertura mostra % baseado em habilidades Fundamental

**Given** StatCard de "Total de Turmas" renderiza
**When** filtro tipo_ensino = TODOS
**Then** mostra total geral (Fundamental + Médio)

**Given** gráfico de cobertura ao longo do tempo renderiza
**When** filtro tipo_ensino aplicado
**Then** séries do gráfico refletem apenas dados do tipo selecionado

**Given** tabela de turmas com atraso renderiza
**When** filtro tipo_ensino = MEDIO
**Then** lista apenas turmas EM com gaps de cobertura

**Given** dashboard de Diretor (métricas agregadas) renderiza
**When** adiciono breakdown por tipo de ensino:
```tsx
<div className="grid grid-cols-2 gap-4">
  <StatCard title="Cobertura Fundamental" value="78%" />
  <StatCard title="Cobertura Médio" value="82%" />
</div>
```
**Then** métricas separadas são exibidas lado a lado

---

### Story 10.8: Backend — Query Optimization para Turmas Multi-Tipo

As a **desenvolvedor**,
I want **queries otimizadas para lidar com turmas Fundamental + Médio sem degradação de performance**,
So that **dashboards e listagens continuam rápidos mesmo com 2x mais dados**.

**Acceptance Criteria:**

**Given** queries de cobertura existem
**When** adiciono índice composto:
```sql
CREATE INDEX idx_turma_tipo_ensino_escola ON turma(tipo_ensino, escola_id, ano_letivo);
```
**Then** queries filtradas por tipo_ensino são otimizadas

**Given** materialized view `cobertura_bimestral` existe
**When** adiciono coluna `tipo_ensino`:
```sql
CREATE MATERIALIZED VIEW cobertura_bimestral AS
SELECT
  t.id AS turma_id,
  t.tipo_ensino,
  t.serie,
  -- ... resto das colunas
FROM turma t
-- ... joins
```
**Then** view inclui tipo_ensino para filtros rápidos

**Given** query de dashboard por tipo_ensino executa
**When** uso view materializada:
```typescript
await prisma.$queryRaw`
  SELECT * FROM cobertura_bimestral
  WHERE escola_id = ${escolaId}
  AND tipo_ensino = ${tipoEnsino}
  AND ano_letivo = ${anoLetivo}
`;
```
**Then** query retorna em <500ms mesmo com 200+ turmas

**Given** seed de EM adiciona ~500 habilidades
**When** query de habilidades filtra por tipo_ensino + disciplina
**Then** usa índice `idx_habilidade_tipo_ensino_disciplina` (criar se não existe)

**Given** testes de carga existem
**When** simulo escola com 50 turmas Fundamental + 50 turmas Médio
**Then** dashboards carregam em <2s (NFR-PERF-04)

---

### Story 10.9: Testing E2E — CRUD de Turmas & Análise EM

As a **QA/desenvolvedor**,
I want **testes E2E que validem fluxo completo de gestão de turmas e análise pedagógica para EM**,
So that **mudanças futuras não quebrem funcionalidades críticas**.

**Acceptance Criteria:**

**Given** aplicação está rodando
**When** faço login como DIRETOR
**Then** posso acessar `/turmas`

**Given** estou em `/turmas`
**When** clico "Nova Turma"
**Then** formulário renderiza

**Given** formulário renderizado
**When** preencho:
- Nome: "1A - Matutino"
- Tipo Ensino: Médio
- Série: 1º Ano (EM)
- Disciplina: Matemática
- Ano Letivo: 2026
- Turno: Matutino
- Qtd Alunos: 35
**Then** turma é criada com sucesso

**Given** turma EM foi criada
**When** faço login como PROFESSOR associado
**Then** vejo turma na lista de minhas turmas

**Given** turma EM existe
**When** crio planejamento para ela
**Then** seletor de habilidades mostra habilidades EM (EM13MAT...)

**Given** planejamento EM foi criado
**When** faço upload de aula de Matemática EM
**Then** aula é transcrita e analisada

**Given** análise de aula EM foi concluída
**When** abro relatório
**Then** relatório usa linguagem apropriada para EM (técnica, complexa)

**And** exercícios gerados são de nível EM (não infantilizados)

**Given** dashboard de Coordenador renderiza
**When** filtro tipo_ensino = MEDIO
**Then** vejo apenas turmas e métricas de EM

**Given** turma tem planejamentos associados
**When** tento deletar turma como DIRETOR
**Then** turma é soft-deleted (não removida)

**And** planejamentos continuam existindo

**Given** suite de testes E2E está completa
**When** executo `npm run test:e2e`
**Then** todos os testes passam (CRUD turmas + análise EM + dashboards)

---

### Story 10.10: Documentation — Guia de Migração para Escolas com EM

As a **usuário admin/suporte**,
I want **documentação clara de como migrar escolas existentes para usar Ensino Médio**,
So that **rollout da funcionalidade é suave e sem erros**.

**Acceptance Criteria:**

**Given** documentação de migração é criada em `docs/migration-ensino-medio.md`
**When** leio o guia
**Then** inclui seções:
1. Pré-requisitos (atualizar backend, rodar migrations)
2. Passo a passo para criar turmas EM
3. Como professores criam planejamentos EM
4. Diferenças entre Fundamental e Médio (habilidades, prompts)
5. FAQ (turmas existentes são afetadas? Como deletar turma?)
6. Troubleshooting (erros comuns)

**Given** seção de pré-requisitos existe
**When** leio instruções
**Then** inclui comandos:
```bash
git pull origin main
npm install
npx prisma migrate deploy
npm run prisma:seed # Roda seed de habilidades EM
```

**Given** seção de FAQ existe
**When** leio pergunta "Turmas existentes são afetadas?"
**Then** resposta: "Não. Todas turmas existentes receberam automaticamente tipo_ensino=FUNDAMENTAL. Funcionalidades antigas continuam idênticas."

**Given** troubleshooting existe
**When** leio erro comum "Série incompatível com tipo de ensino"
**Then** explica: "Verifique que série selecionada corresponde ao tipo (6º-9º para Fundamental, 1º-3º EM para Médio)"

**Given** documentação está completa
**When** time de suporte consulta
**Then** consegue responder 90% das dúvidas sem escalar para dev

---

## Status Geral dos Épicos

- ✅ **Epic 0:** Project Setup & Infrastructure Foundation (5 stories)
- ✅ **Epic 1:** Authentication & Multi-Tenant User Management (7 stories)
- ✅ **Epic 2:** Planejamento Bimestral (4 stories)
- ✅ **Epic 3:** Upload & Captura de Aulas (5 stories)
- ✅ **Epic 4:** Transcrição Automática (STT) (4 stories)
- ✅ **Epic 5:** Análise Pedagógica por IA (MOAT Técnico) (5 stories)
- ✅ **Epic 6:** Relatórios & Exercícios para Professor (5 stories)
- ✅ **Epic 7:** Dashboard de Gestão (Coordenador & Diretor) (5 stories)
- ✅ **Epic 8:** Administração & Monitoramento Interno (4 stories)
- 🆕 **Epic 9:** Layout de Navegação & Polimento Visual (8 stories)
- 🆕 **Epic 10:** Gestão de Turmas & Suporte a Ensino Médio (10 stories)

**Total:** 11 épicos, 62 stories

---
