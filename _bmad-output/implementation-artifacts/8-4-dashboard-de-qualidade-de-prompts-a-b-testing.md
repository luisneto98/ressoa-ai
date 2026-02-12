# Story 8.4: Dashboard de Qualidade de Prompts (A/B Testing)

Status: done

## Story

As a **Admin Interno**,
I want **monitorar taxa de aprovação de prompts e identificar low performers**,
so that **posso iterar sobre prompts ruins e melhorar continuamente a qualidade dos outputs de IA**.

## Acceptance Criteria

1. **AC1: Endpoint de métricas de qualidade de prompts**
   - Given um Admin Interno autenticado
   - When acessa `GET /api/v1/admin/prompts/qualidade?periodo=7d|30d|90d`
   - Then recebe métricas por versão de prompt: total de análises, aprovadas, rejeitadas, taxa de aprovação (%), tempo médio de revisão (s)
   - And versões com <80% aprovação são marcadas como "Low Performer"

2. **AC2: Endpoint de diffs por versão de prompt**
   - Given um Admin Interno autenticado
   - When acessa `GET /api/v1/admin/prompts/:nome/:versao/diffs`
   - Then recebe lista das top 20 análises mais editadas (ranking por contagem de mudanças)
   - And cada item contém: analise_id, aula info, change_count, original_length, edited_length

3. **AC3: Dashboard frontend de qualidade de prompts**
   - Given um Admin Interno no frontend
   - When navega para `/admin/prompts/qualidade`
   - Then vê tabela com todas versões de prompt ativas e suas métricas
   - And cada linha exibe: nome, versão, total análises, taxa aprovação (progress bar), tempo médio revisão, badge de status (Low Performer/Bom/Excelente), badge A/B se ab_testing=true
   - And filtro de período (7d, 30d, 90d) com auto-refresh a cada 5 minutos

4. **AC4: Heatmap de qualidade visual**
   - Given dados de prompts carregados no dashboard
   - When o admin visualiza a seção de heatmap
   - Then vê grid colorido por nome de prompt × versão
   - And cores: Verde (>90%), Amarelo (80-90%), Laranja (70-80%), Vermelho (<70%)

5. **AC5: Página de diffs detalhada**
   - Given um Admin Interno clica em uma versão de prompt no dashboard
   - When navega para `/admin/prompts/:nome/:versao/diffs`
   - Then vê lista das 20 análises mais editadas com contagem de mudanças
   - And pode expandir cada item para ver diff lado-a-lado (original vs editado)
   - And usa o componente DiffViewer existente (`diff` library v8.0.3)

6. **AC6: Alerta de prompt com baixa performance**
   - Given cron job roda diariamente às 10h UTC
   - When detecta prompt ativo com taxa de aprovação <80% nos últimos 30 dias (mínimo 10 análises)
   - Then loga alerta via Pino logger level `warn`
   - And inclui: nome do prompt, versão, taxa atual, total análises

7. **AC7: Cache e performance**
   - Given endpoint de qualidade de prompts
   - When requisição é feita
   - Then resposta é cacheada por 1 hora (CacheTTL 3600000ms)
   - And endpoint de diffs NÃO é cacheado (dados mudam com edições)

## Tasks / Subtasks

- [x] Task 1: Backend - Service de qualidade de prompts (AC: #1, #2, #6)
  - [x] 1.1 Criar `monitoramento-prompts.service.ts` no módulo monitoramento
  - [x] 1.2 Implementar `getQualidadePrompts(periodo)` com Prisma queries
  - [x] 1.3 Implementar `getDiffsPorVersao(nome, versao)` com query de análises editadas
  - [x] 1.4 Implementar `verificarPromptsBaixaPerformance()` como cron diário
  - [x] 1.5 Escrever testes unitários (~15 test cases)

- [x] Task 2: Backend - Controller endpoints (AC: #1, #2, #7)
  - [x] 2.1 Adicionar `GET admin/prompts/qualidade` no AdminController
  - [x] 2.2 Adicionar `GET admin/prompts/:nome/:versao/diffs` no AdminController
  - [x] 2.3 Criar DTOs: `FiltrosPromptsQualidadeDto`, response types
  - [x] 2.4 Configurar cache (1h para qualidade, sem cache para diffs)
  - [x] 2.5 Adicionar Swagger decorators

- [x] Task 3: Frontend - Dashboard de qualidade (AC: #3, #4)
  - [x] 3.1 Criar `QualidadePromptsPage.tsx` em `pages/admin/`
  - [x] 3.2 Implementar tabela de métricas com progress bars e badges
  - [x] 3.3 Implementar heatmap grid com cores condicionais
  - [x] 3.4 Implementar filtro de período e auto-refresh (5min)
  - [x] 3.5 Adicionar rota protegida em App.tsx

- [x] Task 4: Frontend - Página de diffs (AC: #5)
  - [x] 4.1 Criar `PromptDiffsPage.tsx` em `pages/admin/`
  - [x] 4.2 Implementar lista de análises mais editadas com contagem
  - [x] 4.3 Integrar DiffViewer existente para expansão inline
  - [x] 4.4 Adicionar rota protegida em App.tsx

- [x] Task 5: Testes (AC: #1-#7)
  - [x] 5.1 Testes unitários do service (Prisma mocking)
  - [x] 5.2 Testes do cron de alertas
  - [x] 5.3 Verificar cobertura ≥80%

## Dev Notes

### CRITICAL: Schema Divergences (Lições das Stories 8.1-8.3)

O epics.md assume campos que NÃO existem exatamente como descritos. Verificar SEMPRE o schema real:

| Epic Assume | Schema Real | Ação |
|---|---|---|
| `Analise.prompt_versao` (string) | `Analise.prompt_versoes_json` (Json) | É um JSON com 5 chaves: `{ cobertura: "v1.0.0", qualitativa: "v1.1.0", relatorio: "v1.0.0", exercicios: "v1.0.0", alertas: "v1.0.0" }` |
| Campo único de versão | 5 versões independentes | Agrupar por CADA prompt individualmente |
| `Prompt.modelo_sugerido` required | É `ProviderLLM?` (nullable) | Handle null |
| Tabela FeedbackImplicito | NÃO EXISTE ainda | Calcular diffs on-the-fly a partir de `relatorio_texto` vs `relatorio_editado` |

### Modelo Prompt Real (Prisma)

```prisma
model Prompt {
  id              String       @id @default(uuid())
  nome            String       // "prompt-cobertura", "prompt-qualitativa", etc
  versao          String       // "v1.0.0", "v1.1.0"
  conteudo        String       @db.Text
  variaveis       Json?
  modelo_sugerido ProviderLLM?
  ativo           Boolean      @default(false)
  ab_testing      Boolean      @default(false)
  created_at      DateTime     @default(now())
  updated_at      DateTime     @updatedAt

  @@unique([nome, versao])
  @@index([nome, ativo])
}
```

### Modelo Analise - Campos Relevantes

```prisma
model Analise {
  // ... outros campos
  relatorio_texto          String   @db.Text     // ORIGINAL gerado pela IA
  relatorio_editado        String?  @db.Text     // Editado pelo professor (null se não editou)
  status                   StatusAnalise @default(AGUARDANDO_REVISAO)
  aprovado_em              DateTime?
  rejeitado_em             DateTime?
  motivo_rejeicao          String?  @db.Text
  tempo_revisao            Int?     // Seconds
  prompt_versoes_json      Json     // { cobertura: "v1.0.0", qualitativa: "v1.1.0", ... }
  custo_total_usd          Float
  tempo_processamento_ms   Int
  created_at               DateTime
}
```

**StatusAnalise enum:** `AGUARDANDO_REVISAO | APROVADO | REJEITADO`

### Lógica de Agrupamento por Prompt

Como `prompt_versoes_json` armazena 5 versões, a query precisa extrair cada prompt separadamente:

```typescript
// Abordagem: Raw SQL com JSON extraction
const metricas = await this.prisma.$queryRaw<PromptMetrica[]>`
  SELECT
    p.nome,
    p.versao,
    p.ab_testing,
    COUNT(a.id) as total_analises,
    COUNT(CASE WHEN a.status = 'APROVADO' THEN 1 END) as aprovadas,
    COUNT(CASE WHEN a.status = 'REJEITADO' THEN 1 END) as rejeitadas,
    AVG(a.tempo_revisao) as tempo_medio_revisao
  FROM prompt p
  LEFT JOIN analise a ON a.prompt_versoes_json->>${promptNome} = p.versao
    AND p.nome = ${promptNome}
    AND a.created_at >= ${dataInicio}
    AND a.status IN ('APROVADO', 'REJEITADO')
  WHERE p.ativo = true OR (
    SELECT COUNT(*) FROM analise a2
    WHERE a2.prompt_versoes_json->>${promptNome} = p.versao
    AND a2.created_at >= ${dataInicio}
  ) > 0
  GROUP BY p.id, p.nome, p.versao, p.ab_testing
  ORDER BY p.nome, p.versao DESC
`;
```

**Alternativa mais simples:** Iterar sobre os 5 nomes de prompt conhecidos e fazer query individual para cada:
```typescript
const PROMPT_NOMES = ['prompt-cobertura', 'prompt-qualitativa', 'prompt-relatorio', 'prompt-exercicios', 'prompt-alertas'];
```

### Diff Calculation - Abordagem

**Frontend já tem `diff` v8.0.3 instalada** com `DiffViewer` component funcional em `src/pages/aulas/components/DiffViewer.tsx`. Reutilizar para diffs inline.

**Backend NÃO precisa instalar diff library.** Para o endpoint de diffs, basta:
1. Buscar análises onde `relatorio_editado IS NOT NULL`
2. Calcular `change_count` como diferença de tamanho: `ABS(LENGTH(relatorio_editado) - LENGTH(relatorio_texto))`
3. Ordenar por change_count DESC, LIMIT 20
4. Frontend calcula diff visual usando `diff` library já instalada

```typescript
// Query para top 20 mais editadas
const diffs = await this.prisma.$queryRaw<DiffItem[]>`
  SELECT
    a.id as analise_id,
    au.titulo as aula_titulo,
    au.data_aula,
    LENGTH(a.relatorio_editado) - LENGTH(a.relatorio_texto) as change_count,
    LENGTH(a.relatorio_texto) as original_length,
    LENGTH(a.relatorio_editado) as edited_length,
    a.relatorio_texto as original,
    a.relatorio_editado as editado
  FROM analise a
  JOIN aula au ON au.id = a.aula_id
  WHERE a.relatorio_editado IS NOT NULL
    AND a.prompt_versoes_json->>${promptNome} = ${versao}
  ORDER BY ABS(LENGTH(a.relatorio_editado) - LENGTH(a.relatorio_texto)) DESC
  LIMIT 20
`;
```

### Heatmap - Mapeamento de Cores

```typescript
const getHeatmapColor = (taxaAprovacao: number): string => {
  if (taxaAprovacao >= 90) return 'bg-green-500';   // Excelente
  if (taxaAprovacao >= 80) return 'bg-yellow-500';   // Bom
  if (taxaAprovacao >= 70) return 'bg-orange-500';   // Atenção
  return 'bg-red-500';                                // Low Performer
};

const getStatusBadge = (taxaAprovacao: number): { label: string; variant: string } => {
  if (taxaAprovacao >= 90) return { label: 'Excelente', variant: 'default' };  // green
  if (taxaAprovacao >= 80) return { label: 'Bom', variant: 'secondary' };      // gray
  return { label: 'Low Performer', variant: 'destructive' };                    // red
};
```

### CacheTTL - CRITICAL (Milliseconds!)

Descoberto em Story 8.1: NestJS `cache-manager-ioredis-yet` usa **milissegundos**, NÃO segundos:
- `@CacheTTL(3600000)` = 1 hora (endpoint qualidade)
- **NÃO** usar `@CacheTTL(3600)` (= 3.6 segundos!)
- Endpoint de diffs: SEM cache (dados mudam com edições)

### Admin Role - Usar Enum Correto

O epics diz `ADMIN_INTERNO`, mas o enum real é `RoleUsuario.ADMIN`. O AdminController já tem `@Roles(RoleUsuario.ADMIN)` no nível da classe — NÃO adicionar guards por endpoint.

### Cron Pattern (Story 8.1-8.3 Pattern)

```typescript
@Cron('0 10 * * *') // Diariamente às 10h UTC
async verificarPromptsBaixaPerformance(): Promise<void> {
  try {
    // Query prompts ativos com <80% aprovação (mínimo 10 análises nos últimos 30d)
    // Log warn via Pino se encontrar
  } catch (error) {
    this.logger.error('Falha ao verificar prompts', error instanceof Error ? error.stack : String(error));
  }
}
```

### Frontend Patterns (Consistente com 8.1-8.3)

**Componentes e libs usados nos dashboards anteriores:**
- `useQuery` com `queryKey: ['admin-prompts-qualidade', periodo]`
- `refetchInterval: 300000` (5 min para dados estáveis)
- shadcn/ui: `Card`, `Table`, `Select`, `Badge`, `Progress`, `Button`
- Recharts: Não necessário para heatmap (usar grid CSS com backgrounds condicionais)
- Lucide icons: `Activity`, `TrendingUp`, `AlertTriangle`, `CheckCircle`, `XCircle`
- StatCard: Reutilizar de `@/pages/dashboard/components/StatCard.tsx`
- Loading/Error states: Spinner + ErrorCard pattern das stories anteriores

**Rotas:**
```tsx
// App.tsx
<Route path="/admin/prompts/qualidade" element={<ProtectedRoute roles={['ADMIN']}><QualidadePromptsPage /></ProtectedRoute>} />
<Route path="/admin/prompts/:nome/:versao/diffs" element={<ProtectedRoute roles={['ADMIN']}><PromptDiffsPage /></ProtectedRoute>} />
```

**API client pattern:**
```typescript
// Em QualidadePromptsPage.tsx
const { data, isLoading, isError } = useQuery({
  queryKey: ['admin-prompts-qualidade', periodo],
  queryFn: () => apiClient.get(`/admin/prompts/qualidade?periodo=${periodo}`).then(r => r.data),
  refetchInterval: 300000, // 5min
});

// Em PromptDiffsPage.tsx
const { nome, versao } = useParams();
const { data, isLoading, isError } = useQuery({
  queryKey: ['admin-prompts-diffs', nome, versao],
  queryFn: () => apiClient.get(`/admin/prompts/${nome}/${versao}/diffs`).then(r => r.data),
  // SEM refetchInterval - dados sob demanda
});
```

### Infraestrutura Existente para Reutilizar

| Componente | Path | Uso |
|---|---|---|
| StatCard | `ressoa-frontend/src/pages/dashboard/components/StatCard.tsx` | KPI cards no topo |
| DiffViewer | `ressoa-frontend/src/pages/aulas/components/DiffViewer.tsx` | Diff inline na página de diffs |
| MonitoramentoModule | `ressoa-backend/src/modules/monitoramento/monitoramento.module.ts` | Adicionar novo service |
| AdminController | `ressoa-backend/src/modules/admin/admin.controller.ts` | Adicionar endpoints |
| FiltrosMonitoramentoDto | `ressoa-backend/src/modules/monitoramento/dto/filtros-monitoramento.dto.ts` | Pattern para novo DTO |
| PromptService | `ressoa-backend/src/modules/llm/services/prompt.service.ts` | Referência para lógica de prompts |
| MonitoramentoAlertasService | `ressoa-backend/src/modules/monitoramento/monitoramento-alertas.service.ts` | Adicionar cron de prompts |
| LoadingSpinner/ErrorCard | Inline nas páginas admin | Copiar pattern |

### BigInt Conversion (Lição 8.1-8.3)

Raw SQL com `COUNT`/`SUM` retorna `BigInt` no PostgreSQL. Converter para `Number` antes de serializar JSON:

```typescript
const result = rows.map(r => ({
  ...r,
  total_analises: Number(r.total_analises),
  aprovadas: Number(r.aprovadas),
  rejeitadas: Number(r.rejeitadas),
}));
```

### Project Structure Notes

**Novos arquivos a criar:**
```
ressoa-backend/src/modules/monitoramento/
  └── monitoramento-prompts.service.ts        (NEW)
  └── monitoramento-prompts.service.spec.ts   (NEW)
  └── dto/filtros-prompts-qualidade.dto.ts    (NEW)

ressoa-frontend/src/pages/admin/
  └── QualidadePromptsPage.tsx                (NEW)
  └── PromptDiffsPage.tsx                     (NEW)
```

**Arquivos a modificar:**
```
ressoa-backend/src/modules/monitoramento/monitoramento.module.ts     (ADD service export)
ressoa-backend/src/modules/admin/admin.controller.ts                 (ADD 2 endpoints)
ressoa-backend/src/modules/monitoramento/monitoramento-alertas.service.ts (ADD cron)
ressoa-frontend/src/App.tsx                                          (ADD 2 routes)
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-8-Story-8.4] - Story requirements, BDD scenarios, code examples
- [Source: _bmad-output/planning-artifacts/architecture.md#AD-2.1-REST-API] - API patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#AD-1.1-Authentication] - JWT + Roles guard
- [Source: _bmad-output/planning-artifacts/architecture.md#AD-5.4-Monitoring] - Sentry + Pino logging
- [Source: _bmad-output/planning-artifacts/prd.md#FR50] - Admin identifica prompts com baixa taxa de aprovação
- [Source: _bmad-output/planning-artifacts/prd.md#Innovation-Feedback-Loop] - A/B testing, métricas de qualidade
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Dashboard-Patterns] - Card, heatmap, filter patterns
- [Source: ressoa-backend/prisma/schema.prisma#Prompt-Model] - Schema real do Prompt
- [Source: ressoa-backend/prisma/schema.prisma#Analise-Model] - Schema real da Analise com prompt_versoes_json
- [Source: ressoa-backend/src/modules/llm/services/prompt.service.ts] - A/B testing logic existente
- [Source: ressoa-frontend/src/pages/aulas/components/DiffViewer.tsx] - DiffViewer reutilizável
- [Source: 8-1-dashboard-de-monitoramento-de-stt.md] - CacheTTL ms, error detection pattern
- [Source: 8-2-dashboard-de-monitoramento-de-analise-pedagogica.md] - Bull Board, provider alternative
- [Source: 8-3-dashboard-de-custos-por-escola.md] - Raw SQL JOIN pattern, monthly projection

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Implementation Plan

- Backend: Created `MonitoramentoPromptsService` with 3 core methods: `getQualidadePrompts()`, `getDiffsPorVersao()`, `verificarPromptsBaixaPerformance()`
- Iterated over 5 known prompt names with individual raw SQL queries using JSON extraction (`->>`) on `prompt_versoes_json`
- Diffs computed via SQL `ABS(LENGTH(editado) - LENGTH(original))` — no backend diff library needed
- Cron `@Cron('0 10 * * *')` checks active prompts with <80% approval rate (min 10 analyses in 30d)
- Controller: Added 2 endpoints to AdminController — `GET prompts/qualidade` (cached 1h) and `GET prompts/:nome/:versao/diffs` (no cache)
- Frontend: QualidadePromptsPage with metrics table (progress bars, status badges, A/B badges), heatmap grid, period filter (7d/30d/90d), auto-refresh 5min
- Frontend: PromptDiffsPage with expandable list + DiffViewer reuse from Story 6.2

### Completion Notes List

- Story created with comprehensive context from 3 previous stories (8.1-8.3)
- Schema divergences documented (prompt_versoes_json is JSON with 5 keys, NOT single string)
- DiffViewer component already exists in frontend — reuse, don't recreate
- Frontend `diff` library v8.0.3 already installed — no new dependencies needed
- Backend does NOT need diff library — calculate change_count via SQL LENGTH comparison
- CacheTTL uses milliseconds (critical learning from 8.1)
- Admin role is `RoleUsuario.ADMIN` not `ADMIN_INTERNO`
- 5 prompt names known: prompt-cobertura, prompt-qualitativa, prompt-relatorio, prompt-exercicios, prompt-alertas
- ✅ All 15 unit tests passing (9 getQualidadePrompts, 3 getDiffsPorVersao, 3 cron)
- ✅ All 73 monitoramento tests passing (no regressions)
- ✅ Frontend TypeScript compilation clean, Vite build successful
- ✅ Backend and frontend lint clean (prettier auto-fixed)
- ✅ BigInt→Number conversion applied for all raw SQL results
- ✅ No new dependencies added — all libraries already in project

### File List

**New files:**
- `ressoa-backend/src/modules/monitoramento/monitoramento-prompts.service.ts` — Service with quality metrics, diffs, and cron alert
- `ressoa-backend/src/modules/monitoramento/monitoramento-prompts.service.spec.ts` — 15 unit tests
- `ressoa-backend/src/modules/monitoramento/dto/filtros-prompts-qualidade.dto.ts` — DTO with periodo validation (7d|30d|90d)
- `ressoa-frontend/src/pages/admin/QualidadePromptsPage.tsx` — Dashboard with table, heatmap, StatCards, period filter
- `ressoa-frontend/src/pages/admin/PromptDiffsPage.tsx` — Diffs detail page with expandable DiffViewer

**Modified files:**
- `ressoa-backend/src/modules/monitoramento/monitoramento.module.ts` — Added MonitoramentoPromptsService to providers/exports
- `ressoa-backend/src/modules/admin/admin.controller.ts` — Added 2 endpoints (prompts/qualidade, prompts/:nome/:versao/diffs)
- `ressoa-frontend/src/App.tsx` — Added 2 protected routes for prompts quality dashboard and diffs page
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Updated story status tracking
- `_bmad-output/planning-artifacts/epics.md` — Updated epic tracking

## Change Log

- 2026-02-12: Implemented Story 8.4 — Dashboard de Qualidade de Prompts (A/B Testing). Backend service with raw SQL queries for prompt metrics by version, diffs endpoint for top 20 most edited analyses, daily cron alert for low-performing prompts. Frontend dashboard with metrics table, color-coded heatmap, and diff viewer integration. 15/15 unit tests passing, 73/73 monitoramento tests passing.
- 2026-02-12: **Code Review (AI)** — Fixed 6 issues: [HIGH] SQL query referenced non-existent `au.titulo` and `au.data_aula` columns (fixed to JOIN turma + use `au.data`); [HIGH] DiffViewer rendered outside table rows (moved inline with colSpan); [MEDIUM] Added input validation for `nome` param in getDiffsPorVersao; [MEDIUM] Added sprint-status.yaml and epics.md to File List; [MEDIUM] Added edge case test for min analyses threshold + invalid prompt name test. 17/17 tests passing.
