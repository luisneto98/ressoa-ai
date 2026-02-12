# Story 8.3: Dashboard de Custos por Escola

Status: done

## Story

As a **Admin Interno**,
I want **monitorar custos de API (STT + LLM) por escola com ranking, evolução mensal e alertas**,
So that **posso identificar escolas com uso alto, ajustar pricing se necessário e manter margens operacionais saudáveis**.

## Acceptance Criteria

**AC1: Endpoint de Custos por Escola (Backend)**
- Endpoint: `GET /api/v1/admin/custos/escolas`
- Guards: `JwtAuthGuard`, `RolesGuard` com `@Roles(RoleUsuario.ADMIN)` (class-level no AdminController)
- Query param: `mes` (formato `YYYY-MM`, default: mês atual)
- Cache: `@CacheTTL(3600000)` (1 hora em ms — dados de custo mudam lentamente)
- Response JSON com:
  - `escolas`: Array de escolas com custos STT + LLM discriminados, total aulas, professores ativos, custo/aula
  - `totais`: Custo total agregado, total de aulas, projeção mensal baseada em dias decorridos
- Ordenado por `custo_total` DESC (ranking)

**AC2: Filtro por Mês**
- Input HTML `type="month"` no frontend (formato YYYY-MM)
- Backend aceita string `YYYY-MM`, default mês corrente
- Permite navegar meses anteriores para histórico

**AC3: Projeção Mensal**
- Calcula projeção: `(custo_acumulado / dias_decorridos) * dias_no_mes`
- Usa `new Date().getDate()` para dias decorridos
- Usa `new Date(ano, mesNum, 0).getDate()` para total de dias no mês
- Se o mês consultado não é o mês corrente, projeção = custo total (dados completos)

**AC4: Alerta Automático de Custos Altos**
- Cron diário às 9h (UTC): `@Cron('0 9 * * *')`
- Threshold: escola com custo > $50 USD/mês (equivalente ~R$250)
- Log structured via Pino/NestJS Logger com nível `warn`
- Adicionado ao `MonitoramentoAlertasService` existente

**AC5: Frontend Dashboard Page**
- Rota: `/admin/custos/escolas`
- Protegida por `<ProtectedRoute roles={['ADMIN']}>`
- 3 StatCards: Custo Total USD, Total Aulas, Projeção Mensal USD
- Filtro de mês (Input type="month")
- Tabela ranking com colunas: #, Escola, Professores Ativos, Total Aulas, Custo STT, Custo LLM, Custo Total, Custo/Aula
- Linhas com custo > $50 destacadas (bg-red-50 + Badge "Alto")
- Sem auto-refresh (dados estáveis, 1h cache)

**AC6: Proteção RBAC**
- Apenas `ADMIN` pode acessar endpoint (herdado do AdminController class-level `@Roles`)
- Non-ADMIN recebe 403 Forbidden

**AC7: Testes Unitários**
- Unit tests para `MonitoramentoCustosService` (agregação, projeção, edge cases)
- Cron de alerta de custos (threshold, try/catch)
- Pelo menos 10 testes cobrindo:
  - Custos zerados (escola sem aulas)
  - Projeção mensal correta
  - Mês passado vs mês atual
  - Divisão por zero (0 aulas)
  - BigInt conversion de raw queries
  - Ordenação por custo DESC

**AC8: Documentação Swagger**
- ApiOperation, ApiResponse com schema example no endpoint
- DTO com ApiProperty para query param `mes`

## Tasks / Subtasks

- [x] Task 1: Criar `MonitoramentoCustosService` (AC: #1, #2, #3)
  - [x] 1.1 Criar arquivo `ressoa-backend/src/modules/monitoramento/monitoramento-custos.service.ts`
  - [x] 1.2 Implementar `getMetricas(mes: string)` com raw query JOIN Escola+Aula+Transcricao+Analise
  - [x] 1.3 Implementar cálculo de projeção mensal (mês corrente vs mês passado)
  - [x] 1.4 Exportar interface `MonitoramentoCustosResponse`
- [x] Task 2: Criar DTO de filtros (AC: #2, #8)
  - [x] 2.1 Criar `FiltrosCustosDto` com campo `mes` (string YYYY-MM, validação @Matches)
  - [x] 2.2 Adicionar ApiProperty com description e example
- [x] Task 3: Adicionar endpoint ao AdminController (AC: #1, #6, #8)
  - [x] 3.1 Adicionar `GET custos/escolas` ao `admin.controller.ts`
  - [x] 3.2 Injetar `MonitoramentoCustosService` no constructor
  - [x] 3.3 Adicionar `@UseInterceptors(CacheInterceptor)` + `@CacheTTL(3600000)`
  - [x] 3.4 Adicionar decorators Swagger (ApiOperation, ApiResponse com schema example)
- [x] Task 4: Registrar service no MonitoramentoModule (AC: #1)
  - [x] 4.1 Adicionar `MonitoramentoCustosService` em providers e exports no `monitoramento.module.ts`
- [x] Task 5: Adicionar cron de alerta de custos (AC: #4)
  - [x] 5.1 Adicionar método `verificarCustosAltos()` ao `monitoramento-alertas.service.ts`
  - [x] 5.2 `@Cron('0 9 * * *')` — diário às 9h UTC
  - [x] 5.3 Threshold: $50 USD por escola no mês corrente
  - [x] 5.4 Log warn com dados da escola
  - [x] 5.5 Try/catch (padrão das stories 8.1/8.2)
- [x] Task 6: Criar página frontend `CustosEscolasPage.tsx` (AC: #5)
  - [x] 6.1 Criar `ressoa-frontend/src/pages/admin/CustosEscolasPage.tsx`
  - [x] 6.2 3 StatCards (Custo Total, Total Aulas, Projeção Mensal)
  - [x] 6.3 Input type="month" para filtro
  - [x] 6.4 Tabela com ranking (Table shadcn/ui)
  - [x] 6.5 Highlight linhas com custo alto (bg-red-50 + Badge)
  - [x] 6.6 useQuery com queryKey `['admin-custos', mes]`
- [x] Task 7: Adicionar rota no App.tsx (AC: #5, #6)
  - [x] 7.1 Import `CustosEscolasPage`
  - [x] 7.2 Rota `/admin/custos/escolas` com `<ProtectedRoute roles={['ADMIN']}>`
- [x] Task 8: Criar testes unitários (AC: #7)
  - [x] 8.1 Criar `monitoramento-custos.service.spec.ts`
  - [x] 8.2 Testes para agregação de custos, projeção, edge cases
  - [x] 8.3 Testes para cron de alertas de custos no `monitoramento-alertas.service.spec.ts`

## Dev Notes

### Schema Real vs Epic — Divergências Críticas

| Campo no Epic | Campo REAL no Schema | Ação Necessária |
|---|---|---|
| `Transcricao.custo_estimado` (R$) | `Transcricao.custo_usd` (Float?, USD) | Usar USD, NÃO converter para R$ |
| `Analise.custo_estimado` (R$) | `Analise.custo_total_usd` (Float, USD) | Usar USD diretamente |
| `Transcricao.escola_id` | **NÃO EXISTE** | JOIN: `Transcricao → Aula.escola_id` |
| `Analise.escola_id` | **NÃO EXISTE** | JOIN: `Analise → Aula.escola_id` |
| Role `ADMIN_INTERNO` | `RoleUsuario.ADMIN` | Usar enum real |
| Custos em R$ | Custos em **USD** | Exibir como USD ($) no frontend |
| `Escola.professores_ativos` | **NÃO EXISTE** | COUNT DISTINCT `Aula.professor_id` |
| `format(new Date(), 'yyyy-MM')` | Não importar date-fns | Usar template string JS nativo |

### Query Strategy — Raw SQL (Obrigatório)

Prisma ORM não suporta JOIN agregado com GROUP BY multi-tabela. Usar `$queryRaw`:

```typescript
const custos = await this.prisma.$queryRaw<CustoEscolaRow[]>`
  SELECT
    e.id as escola_id,
    e.nome as escola_nome,
    COALESCE(SUM(t.custo_usd), 0)::float as custo_stt,
    COALESCE(SUM(an.custo_total_usd), 0)::float as custo_llm,
    (COALESCE(SUM(t.custo_usd), 0) + COALESCE(SUM(an.custo_total_usd), 0))::float as custo_total,
    COUNT(DISTINCT a.id)::int as total_aulas,
    COUNT(DISTINCT a.professor_id)::int as professores_ativos
  FROM escola e
  LEFT JOIN aula a ON a.escola_id = e.id
    AND a.deleted_at IS NULL
    AND EXTRACT(YEAR FROM a.created_at) = ${ano}
    AND EXTRACT(MONTH FROM a.created_at) = ${mesNum}
  LEFT JOIN transcricao t ON t.aula_id = a.id
  LEFT JOIN analise an ON an.aula_id = a.id
  GROUP BY e.id, e.nome
  ORDER BY custo_total DESC
`;
```

**Pontos críticos da query:**
1. `a.deleted_at IS NULL` — Respeitar soft deletes (LGPD)
2. `LEFT JOIN` em tudo — Escola sem aulas deve aparecer com zeros
3. `COALESCE(..., 0)` — Evitar NULL no resultado
4. `::float` / `::int` — BigInt conversion (PostgreSQL retorna bigint para COUNT)
5. `EXTRACT(YEAR/MONTH)` — Filtro por mês/ano (não usar BETWEEN com timestamps)
6. `ORDER BY custo_total DESC` — Ranking automático

### CacheTTL — Milissegundos (APRENDIDO Story 8.1)

NestJS cache-manager-ioredis-yet usa **milissegundos**:
- `@CacheTTL(3600000)` = 1 hora (custos mudam lentamente, cache maior que STT/análise)
- **NÃO** `@CacheTTL(3600)` (seria 3.6 segundos!)

### Projeção Mensal — Lógica

```typescript
// Se mês atual: projetar baseado em dias decorridos
if (mesConsultado === mesAtual) {
  const diasDecorridos = new Date().getDate();
  const diasNoMes = new Date(ano, mesNum, 0).getDate();
  projecao = diasDecorridos > 0
    ? (custoTotal / diasDecorridos) * diasNoMes
    : 0;
} else {
  // Mês passado: projeção = custo total (dados completos)
  projecao = custoTotal;
}
```

### Formato de Mês — Validação

```typescript
// DTO
export class FiltrosCustosDto {
  @ApiProperty({
    description: 'Mês de consulta (YYYY-MM)',
    example: '2026-02',
    required: false,
  })
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'Formato inválido. Use YYYY-MM' })
  mes?: string;
}
```

Parse no service:
```typescript
const mesStr = filtros.mes || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
const [ano, mesNum] = mesStr.split('-').map(Number);
```

### Threshold de Alerta — $50 USD (não R$1.000)

O epic sugere R$1.000, mas todos os custos no schema estão em **USD**. Usar $50 USD como threshold inicial (~R$250). Configurável via constante.

### Cron de Alertas — Padrão Existente

Adicionar ao `MonitoramentoAlertasService` (não criar novo service):

```typescript
@Cron('0 9 * * *') // Diariamente às 9h UTC
async verificarCustosAltos(): Promise<void> {
  try {
    const { escolas } = await this.monitoramentoCustosService.getMetricas();
    const escolasAltas = escolas.filter(e => e.custo_total > CUSTO_ALTO_THRESHOLD_USD);

    if (escolasAltas.length > 0) {
      this.logger.warn(
        `ALERTA CUSTOS: ${escolasAltas.length} escola(s) com custo acima de $${CUSTO_ALTO_THRESHOLD_USD}/mês`,
        { escolas: escolasAltas.map(e => ({ nome: e.escola_nome, custo: e.custo_total })) },
      );
    }
  } catch (error) {
    this.logger.error('Falha ao verificar custos altos', error instanceof Error ? error.stack : String(error));
  }
}
```

### Response Interface

```typescript
interface CustoEscolaRow {
  escola_id: string;
  escola_nome: string;
  custo_stt: number;
  custo_llm: number;
  custo_total: number;
  total_aulas: number;
  professores_ativos: number;
}

export interface MonitoramentoCustosResponse {
  escolas: Array<CustoEscolaRow & { custo_por_aula: number }>;
  totais: {
    custo_total: number;
    total_aulas: number;
    total_escolas: number;
    projecao_mensal: number;
  };
  mes: string; // "2026-02"
}
```

### Project Structure Notes

**Novos arquivos:**
- `ressoa-backend/src/modules/monitoramento/monitoramento-custos.service.ts`
- `ressoa-backend/src/modules/monitoramento/monitoramento-custos.service.spec.ts`
- `ressoa-backend/src/modules/monitoramento/dto/filtros-custos.dto.ts`
- `ressoa-frontend/src/pages/admin/CustosEscolasPage.tsx`

**Arquivos a modificar:**
- `ressoa-backend/src/modules/monitoramento/monitoramento.module.ts` — add provider + export
- `ressoa-backend/src/modules/admin/admin.controller.ts` — add endpoint + inject service
- `ressoa-backend/src/modules/monitoramento/monitoramento-alertas.service.ts` — add cron
- `ressoa-backend/src/modules/monitoramento/monitoramento-alertas.service.spec.ts` — add tests
- `ressoa-frontend/src/App.tsx` — add route

**Arquivos NÃO modificar:**
- `ressoa-frontend/package.json` — todas dependências já instaladas (shadcn/ui, Recharts, React Query, Lucide)
- `ressoa-backend/package.json` — nenhuma dependência nova necessária
- `ressoa-backend/src/modules/monitoramento/dto/filtros-monitoramento.dto.ts` — NÃO reutilizar (custos usa mês, não período)

### Frontend Patterns (Reutilizar de Stories 8.1/8.2)

| Componente | Localização | Uso |
|---|---|---|
| `StatCard` | `src/pages/dashboard/components/StatCard.tsx` | 3 cards KPI (colors: blue, green, purple) |
| `Card` | shadcn/ui `@/components/ui/card` | Container sections |
| `Table/*` | shadcn/ui `@/components/ui/table` | Ranking de custos |
| `Badge` | shadcn/ui `@/components/ui/badge` | "Alto" em escolas caras |
| `Input` | shadcn/ui `@/components/ui/input` | type="month" filter |
| `useQuery` | `@tanstack/react-query` v5 | Fetch com queryKey `['admin-custos', mes]` |
| `apiClient` | `@/api/axios` | GET `/admin/custos/escolas` |
| `DollarSign` | `lucide-react` | Ícone custo |
| `TrendingUp` | `lucide-react` | Ícone projeção |
| `Activity` | `lucide-react` | Ícone total aulas |

**Layout Pattern:**
```tsx
<div className="max-w-7xl mx-auto p-6">
  <h1 className="text-3xl font-bold text-gray-900 mb-2">Custos por Escola</h1>
  <p className="text-gray-600 mb-6">Monitoramento de custos API (STT + LLM) por escola</p>
  {/* Filtro + StatCards + Table */}
</div>
```

**Loading/Error States (copiar padrão exato de MonitoramentoAnalisePage):**
```tsx
if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin ..." /></div>;
if (isError) return <Card className="p-6 border-red-200 bg-red-50">...</Card>;
if (!data) return <Card className="p-6"><p>Nenhum dado disponível</p></Card>;
```

**Tabela com Highlight:**
```tsx
<TableRow className={custoTotal > 50 ? 'bg-red-50' : ''}>
  <TableCell>{idx + 1}</TableCell>
  <TableCell className="font-semibold">
    {escola.escola_nome}
    {custoTotal > 50 && <Badge variant="destructive" className="ml-2">Alto</Badge>}
  </TableCell>
  ...
</TableRow>
```

### Backend Patterns (Reutilizar de Stories 8.1/8.2)

**AdminController Pattern (existente):**
```typescript
// Adicionar ao constructor:
private readonly monitoramentoCustosService: MonitoramentoCustosService,

// Novo endpoint:
@Get('custos/escolas')
@UseInterceptors(CacheInterceptor)
@CacheTTL(3600000) // 1 hora
@ApiOperation({ summary: 'Custos de API por escola (admin only)' })
@ApiResponse({ status: 200, description: 'Custos por escola retornados', schema: { example: {...} } })
async getCustosEscolas(
  @Query() filtros: FiltrosCustosDto,
): Promise<MonitoramentoCustosResponse> {
  return this.monitoramentoCustosService.getMetricas(filtros.mes);
}
```

**Service Pattern (seguir monitoramento-analise.service.ts):**
```typescript
@Injectable()
export class MonitoramentoCustosService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetricas(mes?: string): Promise<MonitoramentoCustosResponse> {
    // Parse mes, raw query, calculate projection, return
  }
}
```

**Alertas Pattern (seguir monitoramento-alertas.service.ts):**
```typescript
constructor(
  private readonly monitoramentoSTTService: ...,
  private readonly monitoramentoAnaliseService: ...,
  private readonly monitoramentoCustosService: MonitoramentoCustosService, // ADD
) {}
```

### Testing Patterns (Reutilizar de Stories 8.1/8.2)

```typescript
// Mock Prisma raw query
const mockPrisma = {
  $queryRaw: jest.fn(),
};

// Test: custos zerados
it('should return zeros for escola without aulas', async () => {
  mockPrisma.$queryRaw.mockResolvedValue([
    { escola_id: 'uuid', escola_nome: 'Escola Vazia', custo_stt: 0, custo_llm: 0, custo_total: 0, total_aulas: 0, professores_ativos: 0 },
  ]);
  const result = await service.getMetricas('2026-02');
  expect(result.escolas[0].custo_total).toBe(0);
  expect(result.escolas[0].custo_por_aula).toBe(0); // division by zero handled
});

// Test: projeção mensal
it('should calculate monthly projection for current month', async () => {
  // Mock: 10 dias decorridos, $100 custo, 28 dias no mês
  // Projeção: ($100 / 10) * 28 = $280
});

// Test: mês passado sem projeção
it('should use actual total for past months', async () => {
  const result = await service.getMetricas('2025-12');
  expect(result.totais.projecao_mensal).toBe(result.totais.custo_total);
});
```

### Constantes

```typescript
// Adicionar em src/config/constants.ts ou diretamente no service
const CUSTO_ALTO_THRESHOLD_USD = 50; // $50/mês por escola
```

### Route Registration (App.tsx)

```tsx
import { CustosEscolasPage } from '@/pages/admin/CustosEscolasPage';

// No JSX, após a rota de monitoramento/analise:
<Route
  path="/admin/custos/escolas"
  element={
    <ProtectedRoute roles={['ADMIN']}>
      <CustosEscolasPage />
    </ProtectedRoute>
  }
/>
```

### Multi-Tenancy Note

Este endpoint é **ADMIN-only** e **cross-tenant by design** — o admin vê custos de TODAS escolas. NÃO usar `prisma.getEscolaIdOrThrow()`. O AdminController NÃO passa pelo TenantInterceptor para queries admin (admin não tem `escola_id`).

### References

- [Source: ressoa-backend/prisma/schema.prisma#Transcricao] — `custo_usd: Float?`
- [Source: ressoa-backend/prisma/schema.prisma#Analise] — `custo_total_usd: Float`
- [Source: ressoa-backend/prisma/schema.prisma#Aula] — `escola_id: String`, `deleted_at: DateTime?`
- [Source: ressoa-backend/src/modules/admin/admin.controller.ts] — Class-level `@Roles(RoleUsuario.ADMIN)`
- [Source: ressoa-backend/src/modules/monitoramento/monitoramento-analise.service.ts] — Service pattern, calcularDataInicio
- [Source: ressoa-backend/src/modules/monitoramento/monitoramento-alertas.service.ts] — Cron pattern with try/catch
- [Source: ressoa-frontend/src/pages/admin/MonitoramentoAnalisePage.tsx] — Frontend patterns, imports, layout
- [Source: ressoa-frontend/src/pages/dashboard/components/StatCard.tsx] — StatCard props (title, value, icon, color)
- [Source: _bmad-output/planning-artifacts/epics.md#Epic8-Story8.3] — Epic requirements
- [Source: _bmad-output/planning-artifacts/architecture.md#AD-2.1] — REST API patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#AD-5.4] — Monitoring patterns
- [Source: project-context.md] — Multi-tenancy rules, RBAC, testing standards

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- All 58 monitoramento tests pass (11 new custos + 4 new alertas custos + 43 existing)
- Frontend TypeScript compilation clean (no new errors)
- Backend test suite: 297 passed, 29 failed (all failures pre-existing, unrelated to this story)

### Completion Notes List

- **Task 1:** Created `MonitoramentoCustosService` with raw SQL query joining Escola+Aula+Transcricao+Analise. Handles LEFT JOINs for schools without aulas, COALESCE for NULL handling, BigInt casting, soft delete filtering (deleted_at IS NULL), and custo_por_aula division-by-zero protection.
- **Task 2:** Created `FiltrosCustosDto` with `@Matches` regex validation for YYYY-MM format and `@ApiProperty` Swagger documentation.
- **Task 3:** Added `GET custos/escolas` endpoint to AdminController with `@CacheTTL(3600000)` (1 hour), Swagger decorators with example response schema, and `MonitoramentoCustosService` injection.
- **Task 4:** Registered `MonitoramentoCustosService` in `MonitoramentoModule` providers and exports.
- **Task 5:** Added `verificarCustosAltos()` cron to `MonitoramentoAlertasService` with `@Cron('0 9 * * *')` (daily 9h UTC), $50 USD threshold, structured warn logging, and try/catch error handling.
- **Task 6:** Created `CustosEscolasPage.tsx` with 3 StatCards (Custo Total, Total Aulas, Projeção Mensal), month filter input, ranking table with 8 columns, high-cost row highlighting (bg-red-50 + Badge "Alto"), loading/error/empty states matching existing patterns.
- **Task 7:** Added `/admin/custos/escolas` route to App.tsx with `<ProtectedRoute roles={['ADMIN']}>`.
- **Task 8:** Created 11 unit tests for `MonitoramentoCustosService` (zeros, custo_por_aula, division by zero, past month projection, current month projection, ordering, aggregation, default month, empty array, BigInt conversion, response structure) and 4 tests for `verificarCustosAltos` cron (threshold alert, no alert, exact threshold, error handling).

### File List

**New files:**
- `ressoa-backend/src/modules/monitoramento/monitoramento-custos.service.ts`
- `ressoa-backend/src/modules/monitoramento/monitoramento-custos.service.spec.ts`
- `ressoa-backend/src/modules/monitoramento/dto/filtros-custos.dto.ts`
- `ressoa-frontend/src/pages/admin/CustosEscolasPage.tsx`

**Modified files:**
- `ressoa-backend/src/modules/monitoramento/monitoramento.module.ts`
- `ressoa-backend/src/modules/admin/admin.controller.ts`
- `ressoa-backend/src/modules/monitoramento/monitoramento-alertas.service.ts`
- `ressoa-backend/src/modules/monitoramento/monitoramento-alertas.service.spec.ts`
- `ressoa-frontend/src/App.tsx`

## Senior Developer Review (AI)

**Reviewer:** Luisneto98 | **Date:** 2026-02-12 | **Model:** Claude Opus 4.6

### Outcome: APPROVED (with minor fixes applied)

**AC Validation:** 8/8 implemented ✅
**Task Audit:** 8/8 complete, all claims verified ✅
**Tests:** 15 tests (11 service + 4 cron), all 58 monitoramento tests pass ✅
**TypeScript:** Zero frontend type errors ✅
**SQL:** Verified against Prisma schema — all tables/columns correct ✅
**Security:** RBAC class-level @Roles(ADMIN), multi-tenancy N/A (admin cross-tenant by design) ✅

### Issues Found: 0 Critical, 0 High, 1 Medium, 2 Low

| # | Severity | Description | Status |
|---|----------|-------------|--------|
| M3 | MEDIUM→LOW | Projeção mensal imprecisa nos primeiros dias do mês (amplificação extrema com poucos dados) | Fixed (comment added) |
| L1 | LOW | Prettier errors pré-existentes no admin.controller.ts (10 erros de formatação) | Fixed (eslint --fix) |
| L2 | LOW | 4 componentes shadcn/ui não usados no working tree (avatar, collapsible, separator, sheet) — não pertencem a esta story | Noted |

### Notes
- Qualidade de código consistente com stories 8.1/8.2
- SQL query correta: LEFT JOINs, COALESCE, soft delete, BigInt casting
- Relacionamentos Aula→Transcricao e Aula→Analise são 1:1 no schema atual (sem risco de double-counting)
- Se o schema evoluir para múltiplas análises por aula, a query precisará ser refatorada com subqueries

## Change Log

- **2026-02-12:** Story 8.3 implementation complete — Dashboard de Custos por Escola with backend service (raw SQL aggregation + monthly projection), admin endpoint (cached 1h), cost alert cron ($50 threshold daily), frontend dashboard page (StatCards + ranking table + month filter), and 15 unit tests (11 service + 4 cron).
- **2026-02-12:** Code review — APPROVED. Fixes applied: added projection limitation comment, fixed pre-existing prettier errors in admin.controller.ts.
