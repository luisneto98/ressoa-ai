# Story 8.1: Dashboard de Monitoramento de STT

Status: done

## Story

As a **Admin (interno)**,
I want **monitorar taxa de erro, performance e custos de transcrições STT em tempo real**,
So that **posso identificar problemas com providers, trocar para fallback se necessário e otimizar custos operacionais**.

## Acceptance Criteria

### AC1: Endpoint de Métricas STT (Backend)

**Given** o Admin está autenticado com role `ADMIN`
**When** acessa `GET /api/v1/admin/monitoramento/stt?periodo=24h`
**Then** recebe JSON com:
- KPIs: total transcrições, taxa sucesso/erro, fallback count, tempo médio, confiança média, custo total
- Distribuição por provider (Whisper vs Google)
- Timeline de erros (agrupado por hora)
- Últimas transcrições com erro (para debugging)

### AC2: Filtro por Período

**Given** o endpoint existe
**When** passa `periodo` com valores `1h`, `24h`, `7d`, `30d`
**Then** retorna métricas agregadas apenas para o período selecionado

### AC3: Cache Redis (5 minutos)

**Given** o endpoint é chamado repetidamente
**When** mesma query é executada dentro de 5 minutos
**Then** retorna cache (CacheInterceptor + CacheTTL(300))

### AC4: Alerta Automático de Taxa de Erro Alta

**Given** um cron job roda a cada 15 minutos
**When** taxa de erro na última hora > 5%
**Then** loga alerta estruturado (Pino warning) com taxa, contagem de erros, total

### AC5: Frontend Dashboard Page

**Given** o Admin acessa `/admin/monitoramento/stt`
**When** a página carrega
**Then** exibe:
- 6 StatCards com KPIs (total, taxa sucesso, taxa erro, fallback, tempo médio, confiança)
- Alerta visual (Alert destructive) se taxa erro > 5%
- PieChart (distribuição por provider)
- LineChart (timeline de erros ao longo do tempo)
- Filtro de período (Select: 1h, 24h, 7d, 30d)
- Auto-refresh a cada 60 segundos

### AC6: Tabela de Erros Recentes

**Given** o dashboard está carregado
**When** existem transcrições com erro
**Then** exibe tabela com últimos 10 erros: aula_id, provider, data, status_processamento da aula

### AC7: Proteção RBAC

**Given** um usuário com role != ADMIN tenta acessar
**When** faz `GET /api/v1/admin/monitoramento/stt`
**Then** recebe 403 Forbidden

### AC8: Testes Unitários

**Given** a implementação está completa
**When** rodo `npm test`
**Then** testes passam para:
- MonitoramentoSTTService (queries, cálculos, edge cases como 0 transcrições)
- Cron job de alertas (trigger quando > 5%, não trigger quando <= 5%)
- RBAC guard (ADMIN = 200, PROFESSOR/COORDENADOR/DIRETOR = 403)

## Tasks / Subtasks

- [x] **Task 1: Instalar `@nestjs/schedule` para Cron** (AC4)
  - [x] 1.1 `npm install @nestjs/schedule` no backend
  - [x] 1.2 Adicionar `ScheduleModule.forRoot()` em `app.module.ts`

- [x] **Task 2: Criar módulo de Monitoramento STT** (AC1, AC2, AC3)
  - [x] 2.1 Criar `src/modules/monitoramento/monitoramento.module.ts`
  - [x] 2.2 Criar `src/modules/monitoramento/monitoramento-stt.service.ts`
  - [x] 2.3 Criar `src/modules/monitoramento/dto/filtros-monitoramento.dto.ts` com validação zod/class-validator
  - [x] 2.4 Implementar `getMetricasSTT(periodo)` no service com queries Prisma

- [x] **Task 3: Adicionar endpoint ao AdminController** (AC1, AC2, AC3, AC7)
  - [x] 3.1 Importar `MonitoramentoModule` no `AdminModule`
  - [x] 3.2 Adicionar `GET monitoramento/stt` no `admin.controller.ts`
  - [x] 3.3 Aplicar `@UseInterceptors(CacheInterceptor)` + `@CacheTTL(300)`
  - [x] 3.4 Controller fica protegido por `@Roles(RoleUsuario.ADMIN)` do class-level decorator já existente

- [x] **Task 4: Implementar Cron de Alertas** (AC4)
  - [x] 4.1 Criar `src/modules/monitoramento/monitoramento-alertas.service.ts`
  - [x] 4.2 Implementar `@Cron('*/15 * * * *')` para verificar taxa de erro
  - [x] 4.3 Logar alerta via Pino (logger.warn) com dados estruturados

- [x] **Task 5: Frontend - Página de Dashboard STT** (AC5, AC6)
  - [x] 5.1 Criar `src/pages/admin/MonitoramentoSTTPage.tsx`
  - [x] 5.2 Implementar useQuery com queryKey=['admin-stt', periodo] e refetchInterval: 60000
  - [x] 5.3 Renderizar 6 StatCards (reutilizar componente existente)
  - [x] 5.4 Renderizar Alert destructive condicional (taxa erro > 5%)
  - [x] 5.5 Renderizar PieChart (distribuição por provider) com Recharts
  - [x] 5.6 Renderizar LineChart (timeline erros) com Recharts
  - [x] 5.7 Renderizar tabela de erros recentes
  - [x] 5.8 Adicionar Select para filtro de período

- [x] **Task 6: Adicionar Rota no Router** (AC5)
  - [x] 6.1 Adicionar rota `/admin/monitoramento/stt` no React Router
  - [x] 6.2 Proteger rota com guard de role ADMIN no frontend

- [x] **Task 7: Testes Unitários** (AC8)
  - [x] 7.1 Criar `monitoramento-stt.service.spec.ts` com mocks Prisma
  - [x] 7.2 Criar `monitoramento-alertas.service.spec.ts`
  - [x] 7.3 Testar edge cases: 0 transcrições (divisão por zero), todos sucesso, todos erro

## Dev Notes

### ALERTA CRÍTICO: Schema Prisma vs Epics Divergem

O epic 8 assume campos que **NÃO existem** no schema real. Usar os campos REAIS:

| Campo no Epic | Campo REAL no Schema | Notas |
|---|---|---|
| `Transcricao.status` (enum StatusTranscricao) | **NÃO EXISTE** em Transcricao | Status de processamento está em `Aula.status_processamento` (enum StatusProcessamento) |
| `Transcricao.erro_mensagem` | **NÃO EXISTE** | Erros identificados por `Aula.status_processamento = 'ERRO'` |
| `Transcricao.provider_fallback` (Boolean) | **NÃO EXISTE** | Inferir: se `Transcricao.provider` != STT_PRIMARY_PROVIDER do .env, é fallback |
| `Transcricao.confianca_media` (Decimal 0-100) | `Transcricao.confianca` (Float 0.0-1.0) | Multiplicar por 100 para exibição |
| `Transcricao.custo_estimado` (Decimal) | `Transcricao.custo_usd` (Float) | Nome diferente, mesma função |
| `Transcricao.tempo_processamento` (Int segundos) | `Transcricao.tempo_processamento_ms` (Int milisegundos) | Dividir por 1000 para exibição |
| `Transcricao.duracao_audio` (Int segundos) | `Transcricao.duracao_segundos` (Int?) | Nome diferente |
| `Transcricao.escola_id` | **NÃO EXISTE** em Transcricao | JOIN: `Transcricao → Aula → escola_id` |
| `Transcricao.provider_usado` (enum ProviderSTT) | `Transcricao.provider` (enum ProviderSTT) | Nome diferente |
| Role `ADMIN_INTERNO` | `RoleUsuario.ADMIN` | Enum real no schema |

**Enum real `ProviderSTT`:**
```prisma
enum ProviderSTT {
  WHISPER
  GOOGLE
  AZURE
  MANUAL
}
```

**Enum real `StatusProcessamento` (em Aula, NÃO em Transcricao):**
```prisma
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

### Query Strategy para Métricas STT

Como `Transcricao` NÃO tem `escola_id` nem `status`, as queries precisam JOINar com `Aula`:

```typescript
// KPIs - Total de transcrições no período
const total = await this.prisma.transcricao.count({
  where: { created_at: { gte: dataInicio } },
});

// Erros de STT - JOIN com Aula para pegar status ERRO
// Uma transcrição com erro NÃO é criada (aula fica em ERRO sem transcricao)
// Logo: "erros STT" = Aulas com status ERRO que passaram por AGUARDANDO_TRANSCRICAO
const errosSTT = await this.prisma.aula.count({
  where: {
    status_processamento: 'ERRO',
    transcricao: null, // Sem transcrição = falhou no STT
    updated_at: { gte: dataInicio },
  },
});

// Transcrições que usaram fallback
const fallbackCount = await this.prisma.transcricao.count({
  where: {
    created_at: { gte: dataInicio },
    provider: { not: this.primaryProvider }, // Primary vem do .env STT_PRIMARY_PROVIDER
  },
});

// Distribuição por provider
const porProvider = await this.prisma.transcricao.groupBy({
  by: ['provider'],
  where: { created_at: { gte: dataInicio } },
  _count: { _all: true },
  _avg: { tempo_processamento_ms: true, confianca: true, custo_usd: true },
});

// Timeline de erros - via raw query (DATE_TRUNC)
const errosTimeline = await this.prisma.$queryRaw`
  SELECT
    DATE_TRUNC('hour', a.updated_at) as hora,
    COUNT(*) FILTER (WHERE a.status_processamento = 'ERRO' AND t.id IS NULL) as erros_stt,
    COUNT(DISTINCT t.id) as transcricoes_ok
  FROM aula a
  LEFT JOIN transcricao t ON t.aula_id = a.id
  WHERE a.updated_at >= ${dataInicio}
    AND a.status_processamento IN ('ERRO', 'TRANSCRITA', 'ANALISANDO', 'ANALISADA', 'APROVADA', 'REJEITADA')
  GROUP BY hora
  ORDER BY hora ASC
`;

// Últimos erros recentes (para debugging)
const errosRecentes = await this.prisma.aula.findMany({
  where: {
    status_processamento: 'ERRO',
    transcricao: null,
    updated_at: { gte: dataInicio },
  },
  select: {
    id: true,
    escola_id: true,
    data: true,
    updated_at: true,
    arquivo_tamanho: true,
    tipo_entrada: true,
  },
  orderBy: { updated_at: 'desc' },
  take: 10,
});
```

### Response Shape

```typescript
interface MonitoramentoSTTResponse {
  kpis: {
    total_transcricoes: number;
    erros_stt: number;
    taxa_sucesso: number;       // % (0-100)
    taxa_erro: number;          // % (0-100)
    fallback_count: number;
    tempo_medio_ms: number;     // Milisegundos
    confianca_media: number;    // 0.0-1.0 (frontend multiplica por 100)
    custo_total_usd: number;
  };
  por_provider: Array<{
    provider: ProviderSTT;
    count: number;
    avg_tempo_ms: number;
    avg_confianca: number;
    avg_custo_usd: number;
  }>;
  erros_timeline: Array<{
    hora: string;               // ISO timestamp
    erros_stt: number;
    transcricoes_ok: number;
  }>;
  erros_recentes: Array<{
    aula_id: string;
    escola_id: string;
    data: string;
    updated_at: string;
    arquivo_tamanho: number | null;
    tipo_entrada: string;
  }>;
}
```

### Admin Controller - Padrão Existente

O `AdminController` já existe em `src/modules/admin/admin.controller.ts`:
- Base path: `api/v1/admin`
- Class-level: `@Roles(RoleUsuario.ADMIN)` — protege TODOS endpoints automaticamente
- Padrão: NÃO precisa adicionar guard em cada endpoint (já está no class level)

**Adicionar novo endpoint seguindo o mesmo padrão:**
```typescript
@Get('monitoramento/stt')
@UseInterceptors(CacheInterceptor)
@CacheTTL(300) // 5 minutos (monitoramento é mais volátil que dashboards de 1h)
@ApiOperation({ summary: 'Métricas de monitoramento STT (admin only)' })
@ApiResponse({ status: 200, description: 'Métricas STT retornadas' })
async getMonitoramentoSTT(
  @Query() filtros: FiltrosMonitoramentoDto,
): Promise<MonitoramentoSTTResponse> {
  return this.monitoramentoSTTService.getMetricas(filtros.periodo);
}
```

### Divisão por Zero - Edge Case

Quando `total = 0` (nenhuma transcrição no período), evitar NaN:
```typescript
const taxaSucesso = total > 0 ? ((total - errosSTT) / (total + errosSTT)) * 100 : 0;
const taxaErro = total > 0 ? (errosSTT / (total + errosSTT)) * 100 : 0;
```

O "total" real para taxa é: transcrições OK + aulas com erro STT.

### Cron de Alertas - Sem Sentry

Sentry **NÃO está instalado** no projeto. O architecture.md menciona como decisão futura.
Usar **Pino logger** (já configurado) para alertas:

```typescript
import { Logger } from '@nestjs/common';

private readonly logger = new Logger('MonitoramentoAlertas');

@Cron('*/15 * * * *')
async verificarTaxaErroSTT() {
  const ultimaHora = new Date(Date.now() - 60 * 60 * 1000);
  // ... calcular taxa ...
  if (taxaErro > 5) {
    this.logger.warn(
      `ALERTA STT: Taxa de erro ${taxaErro.toFixed(2)}% (${erros}/${total}) na última hora`,
      { taxaErro, erros, total, threshold: 5 },
    );
  }
}
```

### Frontend Patterns - Reutilizar Componentes Existentes

| Componente | Localização | Reuso |
|---|---|---|
| `StatCard` | `src/pages/dashboard/components/StatCard.tsx` | Reutilizar diretamente (props: title, value, icon, color) |
| `Card` | shadcn/ui | Já instalado |
| `Select`, `SelectTrigger`, `SelectContent`, `SelectItem` | shadcn/ui | Já instalado |
| `Alert`, `AlertTitle`, `AlertDescription` | shadcn/ui | Já instalado |
| Recharts (`LineChart`, `PieChart`, `Pie`, `Cell`, `CartesianGrid`, `XAxis`, `YAxis`, `Tooltip`, `Legend`, `ResponsiveContainer`) | `recharts` v3.7.0 | Já instalado |
| `useQuery` | `@tanstack/react-query` v5 | Já configurado |
| `apiClient` ou `api` | axios instance existente | Usar a mesma instância |

**Padrão de Cores do Projeto (UX Design Spec):**
- Deep Navy: #0A2647
- Tech Blue: #2563EB
- Cyan AI: #06B6D4
- Focus Orange: #F97316
- Erro/Red: #EF4444
- Success/Green: #10B981

### NÃO Criar (já existe ou desnecessário)

- ❌ NÃO criar novo guard — AdminController já tem `@Roles(RoleUsuario.ADMIN)` no class level
- ❌ NÃO instalar Sentry — usar Pino logger (já configurado)
- ❌ NÃO criar StatCard — já existe em `pages/dashboard/components/`
- ❌ NÃO instalar recharts — v3.7.0 já instalado
- ❌ NÃO criar `FiltrosMonitoramentoDto` genérico demais — criar específico para monitoramento
- ❌ NÃO adicionar `escola_id` ao Transcricao model — fazer JOIN via Aula
- ❌ NÃO usar `ADMIN_INTERNO` — role real é `ADMIN`

### Dependências para Instalar

| Package | Versão | Motivo |
|---|---|---|
| `@nestjs/schedule` | latest | Cron jobs para alertas periódicos |

### Project Structure Notes

```
ressoa-backend/src/
├── modules/
│   ├── admin/
│   │   ├── admin.controller.ts        ✏️ MODIFICAR: Adicionar GET monitoramento/stt
│   │   ├── admin.module.ts            ✏️ MODIFICAR: Importar MonitoramentoModule
│   │   └── admin.service.ts           (sem alteração)
│   └── monitoramento/                 📁 CRIAR: Novo módulo
│       ├── monitoramento.module.ts
│       ├── monitoramento-stt.service.ts
│       ├── monitoramento-stt.service.spec.ts
│       ├── monitoramento-alertas.service.ts
│       ├── monitoramento-alertas.service.spec.ts
│       └── dto/
│           └── filtros-monitoramento.dto.ts
├── app.module.ts                      ✏️ MODIFICAR: Adicionar ScheduleModule.forRoot()
└── ...

ressoa-frontend/src/
├── pages/
│   └── admin/
│       └── MonitoramentoSTTPage.tsx   📄 CRIAR: Dashboard frontend
├── ...
```

### Bull Queue Names (Referência)

| Queue Name | Descrição |
|---|---|
| `transcription` | Processamento STT (Whisper/Google) |
| `analysis-pipeline` | Pipeline de 5 prompts LLM |
| `feedback-queue` | Feedback loop de qualidade |
| `cobertura-refresh` | Refresh da materialized view |

### Learnings da Epic 7 (Stories 7.1-7.5)

1. **CacheInterceptor + CacheTTL funciona bem** — Padrão: 3600 para dashboards, 300 para monitoramento
2. **RBAC via class-level @Roles()** — AdminController já tem, NÃO adicionar duplicado
3. **Raw queries para DATE_TRUNC** — PostgreSQL, usar `this.prisma.$queryRaw` com template literals tipados
4. **Ownership check via NotFoundException** — Para cross-tenant, retornar 404 (não 403)
5. **StatCard reutilizável** — Já suporta 6 cores: blue, green, orange, red, cyan, purple
6. **useQuery com refetchInterval** — Auto-refresh funciona bem para dashboards dinâmicos
7. **Edge cases de divisão por zero** — SEMPRE checar total > 0 antes de calcular percentuais
8. **Commits seguem:** `feat(story-8.1): ...` ou `fix(story-8.1): ...`

### Multi-Tenancy Notes

- AdminController NÃO usa TenantInterceptor (ADMIN tem `escolaId = null`)
- Queries de monitoramento são CROSS-TENANT (Admin vê todas as escolas)
- NÃO adicionar `escola_id` nos WHERE clauses de monitoramento (é agregação global)
- Se quiser drill-down por escola futuramente, adicionar como filtro opcional (NÃO nesta story)

### References

- [Source: epics.md#Story 8.1: Dashboard de Monitoramento de STT] - AC completos e especificação
- [Source: epics.md#Epic 8: Administração & Monitoramento Interno] - Context, FR46-FR50
- [Source: architecture.md#AD-5.4: Monitoring & Logging] - Sentry + Pino decision (Sentry NOT installed yet)
- [Source: architecture.md#AD-4.5: Materialized Views Refresh] - Bull job patterns
- [Source: architecture.md#Cross-Cutting Concerns - Observability] - Alerts: Error rate > 5%, Queue backlog > 12h
- [Source: project-context.md#🔐 Authentication & Authorization] - JWT payload, RBAC roles, Admin = escolaId null
- [Source: project-context.md#🗄️ Database Patterns] - Multi-tenancy, soft deletes
- [Source: prisma/schema.prisma#Transcricao] - Real model fields (diverge from epics!)
- [Source: prisma/schema.prisma#Aula] - StatusProcessamento enum, escola_id field
- [Source: admin.controller.ts] - Existing admin controller pattern with class-level @Roles(ADMIN)
- [Source: dashboard/dashboard.controller.ts] - CacheInterceptor + CacheTTL pattern
- [Source: pages/dashboard/components/StatCard.tsx] - Reusable StatCard component
- [Source: 7-5-rbac-guards-privacy-enforcement.md] - Previous story learnings, guard patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- All 22 new unit tests pass (16 STT service + 6 alertas service)
- Backend TypeScript compilation clean (no new errors in src/)
- Frontend TypeScript compilation clean (0 errors)
- Pre-existing test failures (29) in auth, analise, email specs — unrelated to this story
- CacheTTL set to 300000ms (5 min) per NestJS cache-manager-ioredis-yet ms-based TTL

### Completion Notes List

- **Task 1:** Installed `@nestjs/schedule` v5, added `ScheduleModule.forRoot()` to app.module.ts
- **Task 2:** Created MonitoramentoSTTService with `getMetricas(periodo)` and `getTaxaErroUltimaHora()`. Uses Prisma queries with proper Aula JOIN for error detection (transcricao=null pattern). Handles division-by-zero edge case. Reads STT_PRIMARY_PROVIDER from .env for fallback detection.
- **Task 3:** Added `GET monitoramento/stt` endpoint to AdminController with CacheInterceptor + CacheTTL(300000). Imported MonitoramentoModule in AdminModule. RBAC enforced by class-level @Roles(ADMIN).
- **Task 4:** Created MonitoramentoAlertasService with `@Cron('*/15 * * * *')`. Logs via NestJS Logger (Pino) when error rate > 5%. Delegates rate calculation to STT service.
- **Task 5:** Created MonitoramentoSTTPage with 6 StatCards, destructive Alert for error rate > 5%, PieChart (provider distribution), LineChart (error timeline), error table (last 10), period Select filter, and auto-refresh every 60s. Reused existing StatCard component and Recharts.
- **Task 6:** Added `/admin/monitoramento/stt` route in App.tsx with `<ProtectedRoute roles={['ADMIN']}>`.
- **Task 7:** 22 unit tests covering: KPI calculations, provider distribution, BigInt conversion, error timeline, edge cases (0 transcriptions, 100% errors, 100% success), period date range validation, fallback detection logic, cron alert triggers (above/below/at threshold).

### Senior Developer Review (AI)

**Reviewer:** Luisneto98 on 2026-02-12
**Outcome:** Approved (after fixes)
**Issues Found:** 3 High, 4 Medium, 1 Low → **7 auto-fixed, 1 low deferred**

**Fixes Applied:**
1. [HIGH] Added try/catch to cron job `verificarTaxaErroSTT()` to prevent silent failures
2. [HIGH] Documented raw SQL query edge case assumptions in timeline query
3. [HIGH] Added `Status` column to frontend error table to better match AC6
4. [MEDIUM] Improved `tipo_entrada` typing from `string` to union type
5. [MEDIUM] Added Swagger response schema example to monitoring endpoint
6. [MEDIUM] Added `Custo Total (USD)` StatCard to frontend dashboard
7. [MEDIUM] Removed duplicate period labels — now uses `PERIODO_LABELS` constant in Select

**Test Added:** 1 new test for cron error handling (23 total now)

**Low Not Fixed:**
- [LOW] `X` icon imported but only used in error state — acceptable, no action needed

### Change Log

- 2026-02-12: Code review complete — 7 issues fixed, 1 test added, status → done
- 2026-02-12: Story 8.1 implementation complete — STT monitoring dashboard (backend + frontend + tests)

### File List

**New files:**
- ressoa-backend/src/modules/monitoramento/monitoramento.module.ts
- ressoa-backend/src/modules/monitoramento/monitoramento-stt.service.ts
- ressoa-backend/src/modules/monitoramento/monitoramento-stt.service.spec.ts
- ressoa-backend/src/modules/monitoramento/monitoramento-alertas.service.ts
- ressoa-backend/src/modules/monitoramento/monitoramento-alertas.service.spec.ts
- ressoa-backend/src/modules/monitoramento/dto/filtros-monitoramento.dto.ts
- ressoa-frontend/src/pages/admin/MonitoramentoSTTPage.tsx

**Modified files:**
- ressoa-backend/src/app.module.ts (added ScheduleModule.forRoot() import)
- ressoa-backend/src/modules/admin/admin.module.ts (added MonitoramentoModule import)
- ressoa-backend/src/modules/admin/admin.controller.ts (added GET monitoramento/stt endpoint)
- ressoa-backend/package.json (added @nestjs/schedule dependency)
- ressoa-frontend/src/App.tsx (added admin/monitoramento/stt route + import)
