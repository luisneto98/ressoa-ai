# Story 7.3: Dashboard do Coordenador - Visão por Turma

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Coordenador**,
I want **visualizar métricas de cobertura por turma e identificar turmas em atraso**,
So that **posso priorizar intervenções pedagógicas onde há maior necessidade**.

## Context & Business Value

**Epic 7 Goal:** Coordenadores e Diretores visualizam métricas agregadas de cobertura curricular para tomar decisões pedagógicas baseadas em dados, identificar turmas em atraso e monitorar progresso da escola - **sem acesso a transcrições brutas** (privacidade do professor).

**This Story (7.3) Position in Epic:**
- **Story 7.1 (DONE):** Materialized view `cobertura_bimestral` created → Data layer ready
- **Story 7.2 (DONE):** Dashboard Coordenador - Visão por Professor (queries view, teacher ranking, drill-down to professor's classes)
- **THIS STORY (7.3):** Dashboard Coordenador - Visão por Turma (class-centric view, identify struggling classes, drill-down to skills)
- **Story 7.4 (NEXT):** Dashboard Diretor - Métricas Agregadas
- **Story 7.5:** RBAC Guards & Privacy Enforcement

**Why this matters:**

**Business Value:**
- **Identify Struggling Classes:** Coordenador sees which classes have coverage < 50% (critical), 50-70% (attention) vs > 70% (on track)
- **Prioritize Interventions:** Visual classification (red/orange/green cards) helps prioritize which classes need immediate attention
- **Drill-Down to Skills:** See which specific BNCC habilidades are not covered in a struggling class → actionable insights
- **Complementary to Story 7.2:** Story 7.2 = "which teachers need help?", THIS STORY = "which classes need help?"
- **Cross-Teacher Classes:** Some classes may have multiple teachers (different disciplines) → class-level view reveals patterns

**Technical Strategy:**
- **Performance:** Query materialized view `cobertura_bimestral` (same as Story 7.2, already validated < 200ms)
- **Caching:** Redis cache with 1h TTL (reduces DB load for repeated queries)
- **Drill-Down:** Navigate from class grid → class detail (habilidades breakdown: COMPLETE/PARTIAL/MENTIONED/NOT_COVERED)
- **Filtering:** Filter by `disciplina` (MATEMATICA, LINGUA_PORTUGUESA, CIENCIAS) + `bimestre` (1-4)
- **Classification:** 3-tier urgency system (< 50% critical, 50-70% attention, > 70% on track)
- **Multi-Tenancy:** ALL queries include `escola_id` (security CRITICAL)

**Current Architecture Status:**
```
[Stories 0-6] Foundation complete (auth, planning, upload, STT, analysis, teacher dashboard) → DONE
[Story 7.1] Materialized view cobertura_bimestral → DONE
[Story 7.2] Dashboard Coordenador - Professor View → DONE (teacher ranking + drill-down)
         ↓
[THIS STORY 7.3]
  Backend: GET /api/v1/dashboard/coordenador/turmas (with filters, caching, classification)
  Backend: GET /api/v1/dashboard/coordenador/turmas/:turmaId/detalhes (drill-down to skills)
  Frontend: /dashboard/coordenador/turmas page (filters, 3 classification cards, class grid, drill-down)
  → Enables coordinator to identify classes needing intervention
         ↓
[Story 7.4] Dashboard Diretor → School-wide metrics
```

## Acceptance Criteria

### AC1: Backend Endpoint - Métricas Agregadas por Turma

**Given** a materialized view `cobertura_bimestral` existe (Story 7.1 DONE)

**When** crio endpoint `GET /api/v1/dashboard/coordenador/turmas` com filtros opcionais:

**Adicionar ao arquivo existente:** `ressoa-backend/src/modules/dashboard/dashboard.controller.ts`

```typescript
@Get('turmas')
@Roles(RoleUsuario.COORDENADOR, RoleUsuario.DIRETOR)
@UseInterceptors(CacheInterceptor)
@CacheTTL(3600) // Cache 1 hora
@ApiOperation({
  summary: 'Métricas de cobertura curricular por turma',
  description:
    'Retorna lista de turmas com métricas agregadas de cobertura BNCC. ' +
    'Coordenador identifica turmas em atraso (< 50% crítico, 50-70% atenção).',
})
@ApiResponse({
  status: 200,
  description: 'Métricas agregadas por turma com classificação de urgência',
})
async getMetricasPorTurma(
  @CurrentUser() user: AuthenticatedUser,
  @Query() filtros: FiltrosDashboardDto,
) {
  return this.dashboardService.getMetricasPorTurma(user.escolaId, filtros);
}
```

**Then** o endpoint está protegido por RBAC (COORDENADOR + DIRETOR) e cache Redis (1h TTL)

**CRITICAL Notes:**
- ✅ Reuses existing `FiltrosDashboardDto` from Story 7.2 (bimestre, disciplina)
- ✅ Same guards: `@Roles(RoleUsuario.COORDENADOR, RoleUsuario.DIRETOR)`
- ✅ Same cache pattern: `@CacheTTL(3600)` (1 hour)
- ✅ Multi-tenancy: `escolaId` from JWT

---

### AC2: Service com Query SQL - Métricas por Turma

**Given** o endpoint existe

**When** implemento lógica de agregação por turma:

**Adicionar ao arquivo existente:** `ressoa-backend/src/modules/dashboard/dashboard.service.ts`

```typescript
async getMetricasPorTurma(escolaId: string, filtros: FiltrosDashboardDto) {
  // Query raw SQL para agregar dados da materialized view por turma
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
    WHERE escola_id = ${escolaId}::uuid
      ${filtros.bimestre ? Prisma.sql`AND bimestre = ${filtros.bimestre}` : Prisma.empty}
      ${filtros.disciplina ? Prisma.sql`AND disciplina = ${filtros.disciplina}::disciplina` : Prisma.empty}
    GROUP BY turma_id, turma_nome, turma_serie, disciplina, bimestre
    ORDER BY percentual_cobertura ASC;
  `;

  // Classificar turmas por urgência
  const turmas_criticas = metricas.filter(
    (t) => Number(t.percentual_cobertura) < this.config.META_COBERTURA_CRITICA, // 50%
  );
  const turmas_atencao = metricas.filter(
    (t) =>
      Number(t.percentual_cobertura) >= this.config.META_COBERTURA_CRITICA &&
      Number(t.percentual_cobertura) < this.config.META_COBERTURA_MINIMA, // 50-70%
  );
  const turmas_ritmo = metricas.filter(
    (t) => Number(t.percentual_cobertura) >= this.config.META_COBERTURA_MINIMA, // >= 70%
  );

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

**Interface Type (adicionar ao service):**

```typescript
interface MetricasTurma {
  turma_id: string;
  turma_nome: string;
  turma_serie: string;
  disciplina: string;
  bimestre: number;
  percentual_cobertura: number;
  habilidades_planejadas: number;
  habilidades_trabalhadas: number;
  total_aulas: number;
  professores: string; // Comma-separated professor names
}
```

**Then** o service retorna métricas agregadas por turma + classificação (críticas/atenção/no ritmo) + turmas priorizadas

**CRITICAL Notes:**
- ✅ Multi-tenancy: `WHERE escola_id = ${escolaId}` (mandatory!)
- ✅ GROUP BY: `turma_id, turma_nome, turma_serie, disciplina, bimestre` (aggregates across planejamentos)
- ✅ STRING_AGG: Multiple professors for same turma → comma-separated list
- ✅ ORDER BY: `percentual_cobertura ASC` (worst classes first = prioritize interventions)
- ✅ Classification Thresholds: < 50% critical, 50-70% attention, >= 70% on track (same as Story 7.2, from config)
- ✅ Top 5 Prioritized: Slice first 5 critical classes (for alert banner)

---

### AC3: Endpoint de Drill-Down - Detalhes da Turma (Habilidades)

**Given** coordenador vê grid de turmas e quer detalhes de habilidades específicas

**When** crio endpoint drill-down para habilidades da turma:

**Adicionar ao arquivo existente:** `ressoa-backend/src/modules/dashboard/dashboard.controller.ts`

```typescript
@Get('turmas/:turmaId/detalhes')
@Roles(RoleUsuario.COORDENADOR, RoleUsuario.DIRETOR)
@ApiOperation({
  summary: 'Detalhes de habilidades da turma (drill-down)',
  description:
    'Retorna status de cada habilidade planejada para a turma: COMPLETE/PARTIAL/MENTIONED/NOT_COVERED. ' +
    'Coordenador identifica quais habilidades específicas não foram trabalhadas.',
})
@ApiResponse({
  status: 200,
  description: 'Lista de habilidades com status de cobertura',
})
async getDetalhesTurma(
  @Param('turmaId', ParseUUIDPipe) turmaId: string,
  @CurrentUser() user: AuthenticatedUser,
  @Query('bimestre', new ParseIntPipe({ optional: true })) bimestre?: number,
) {
  return this.dashboardService.getDetalhesTurma(user.escolaId, turmaId, bimestre);
}
```

**Adicionar ao service:** `ressoa-backend/src/modules/dashboard/dashboard.service.ts`

```typescript
async getDetalhesTurma(escolaId: string, turmaId: string, bimestre?: number) {
  // Buscar habilidades planejadas vs trabalhadas
  const detalhes = await this.prisma.$queryRaw<HabilidadeStatus[]>`
    SELECT
      h.codigo as habilidade_codigo,
      h.descricao as habilidade_descricao,
      CASE
        WHEN COUNT(a.id) FILTER (
          WHERE a.cobertura_bncc::jsonb @> jsonb_build_array(
            jsonb_build_object('codigo', h.codigo, 'nivel_cobertura', 'COMPLETE')
          )
        ) > 0 THEN 'COMPLETE'
        WHEN COUNT(a.id) FILTER (
          WHERE a.cobertura_bncc::jsonb @> jsonb_build_array(
            jsonb_build_object('codigo', h.codigo, 'nivel_cobertura', 'PARTIAL')
          )
        ) > 0 THEN 'PARTIAL'
        WHEN COUNT(a.id) FILTER (
          WHERE a.cobertura_bncc::jsonb @> jsonb_build_array(
            jsonb_build_object('codigo', h.codigo, 'nivel_cobertura', 'MENTIONED')
          )
        ) > 0 THEN 'MENTIONED'
        ELSE 'NOT_COVERED'
      END as status_cobertura,
      COUNT(DISTINCT au.id) FILTER (WHERE au.status_processamento = 'APROVADA') as aulas_relacionadas
    FROM "PlanejamentoHabilidade" ph
    INNER JOIN "Planejamento" p ON ph.planejamento_id = p.id
    INNER JOIN "Habilidade" h ON ph.habilidade_id = h.id
    LEFT JOIN "Aula" au ON au.turma_id = p.turma_id AND au.professor_id = p.professor_id
    LEFT JOIN "Analise" a ON a.aula_id = au.id
    WHERE p.turma_id = ${turmaId}::uuid
      AND p.escola_id = ${escolaId}::uuid
      ${bimestre ? Prisma.sql`AND p.bimestre = ${bimestre}` : Prisma.empty}
    GROUP BY h.codigo, h.descricao
    ORDER BY status_cobertura DESC, h.codigo ASC;
  `;

  return { detalhes };
}
```

**Interface Type:**

```typescript
interface HabilidadeStatus {
  habilidade_codigo: string;
  habilidade_descricao: string;
  status_cobertura: 'COMPLETE' | 'PARTIAL' | 'MENTIONED' | 'NOT_COVERED';
  aulas_relacionadas: number;
}
```

**Then** o endpoint retorna status de cada habilidade planejada (COMPLETE/PARTIAL/MENTIONED/NOT_COVERED)

**CRITICAL Notes:**
- ✅ Multi-tenancy: `WHERE p.turma_id = ${turmaId} AND p.escola_id = ${escolaId}` (double isolation)
- ✅ JSONB Query: `cobertura_bncc::jsonb @> jsonb_build_array(...)` (searches JSONB array for matching codigo + nivel)
- ✅ CASE Hierarchy: COMPLETE > PARTIAL > MENTIONED > NOT_COVERED (if ANY aula has COMPLETE, status = COMPLETE)
- ✅ COUNT FILTER: PostgreSQL syntax for conditional aggregation
- ✅ ORDER BY: `status_cobertura DESC` (best coverage first, then by codigo)
- ✅ UUID Validation: `ParseUUIDPipe` on turmaId param (prevents injection)

---

### AC4: Frontend - Página do Dashboard por Turma

**Given** endpoints prontos

**When** crio página do dashboard:

**Arquivo:** `ressoa-frontend/src/pages/dashboard/DashboardCoordenadorTurmasPage.tsx` (CREATE)

```typescript
// pages/dashboard/DashboardCoordenadorTurmasPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { TurmaCard } from './components/TurmaCard';
import { StatCard } from '@/components/StatCard';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FiltrosCobertura {
  disciplina?: 'MATEMATICA' | 'LINGUA_PORTUGUESA' | 'CIENCIAS';
  bimestre?: number;
}

export function DashboardCoordenadorTurmasPage() {
  const [filtros, setFiltros] = useState<FiltrosCobertura>({
    bimestre: 1,
    disciplina: 'MATEMATICA',
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard-turmas', filtros],
    queryFn: () =>
      api.get('/dashboard/coordenador/turmas', { params: filtros }).then((res) => res.data),
  });

  const handleLimparFiltros = () => {
    setFiltros({ bimestre: 1, disciplina: 'MATEMATICA' });
  };

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Erro ao carregar dashboard: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard - Turmas</h1>

      {/* Filtros */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4 items-center">
          <Select
            value={filtros.disciplina}
            onValueChange={(v) => setFiltros({ ...filtros, disciplina: v as any })}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Disciplina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MATEMATICA">Matemática</SelectItem>
              <SelectItem value="LINGUA_PORTUGUESA">Língua Portuguesa</SelectItem>
              <SelectItem value="CIENCIAS">Ciências</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filtros.bimestre?.toString()}
            onValueChange={(v) => setFiltros({ ...filtros, bimestre: parseInt(v) })}
          >
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

          <Button variant="outline" onClick={handleLimparFiltros}>
            Limpar Filtros
          </Button>
        </div>
      </Card>

      {/* Cards de Classificação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Turmas Críticas (<50%)"
          value={data.classificacao.criticas}
          icon={<AlertCircle className="h-6 w-6" />}
          color="red"
        />
        <StatCard
          title="Turmas em Atenção (50-70%)"
          value={data.classificacao.atencao}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="orange"
        />
        <StatCard
          title="Turmas no Ritmo (>70%)"
          value={data.classificacao.no_ritmo}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
        />
      </div>

      {/* Alerta: Turmas Priorizadas */}
      {data.turmas_priorizadas.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção! Turmas Prioritárias</AlertTitle>
          <AlertDescription>
            {data.turmas_priorizadas.length} turmas estão com cobertura crítica (&lt;50%) e requerem
            intervenção urgente.
          </AlertDescription>
        </Alert>
      )}

      {/* Grid de Turmas */}
      {data.metricas.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600">Nenhuma turma encontrada com os filtros selecionados.</p>
          <Button variant="outline" onClick={handleLimparFiltros} className="mt-4">
            Limpar Filtros
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.metricas.map((turma) => (
            <TurmaCard key={turma.turma_id} turma={turma} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Then** a página exibe dashboard com filtros, classificação (3 cards), alerta prioritário e grid de turmas

**CRITICAL Notes:**
- ✅ React Query: `queryKey` includes `filtros` (auto-refetch on filter change)
- ✅ Error Handling: Shows user-friendly error message if query fails
- ✅ Loading State: Shows spinner during fetch
- ✅ Empty State: Card with "Nenhuma turma encontrada" + Limpar Filtros button
- ✅ Responsive Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (mobile → tablet → desktop)
- ✅ Alert Banner: Only shows if `turmas_priorizadas.length > 0` (critical classes exist)
- ✅ shadcn/ui: Card, Select, Button, Alert, StatCard components

---

### AC5: Frontend - Componente TurmaCard (Grid Item)

**Given** componente da página existe

**When** crio componente de card de turma:

**Arquivo:** `ressoa-frontend/src/pages/dashboard/components/TurmaCard.tsx` (CREATE)

```typescript
// pages/dashboard/components/TurmaCard.tsx
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Turma {
  turma_id: string;
  turma_nome: string;
  turma_serie: string;
  disciplina: string;
  bimestre: number;
  percentual_cobertura: number;
  habilidades_planejadas: number;
  habilidades_trabalhadas: number;
  total_aulas: number;
  professores: string;
}

interface Props {
  turma: Turma;
}

export function TurmaCard({ turma }: Props) {
  const navigate = useNavigate();

  const getCardBorderColor = (percentual: number) => {
    if (percentual < 50) return 'border-l-4 border-red-500';
    if (percentual < 70) return 'border-l-4 border-orange-500';
    return 'border-l-4 border-green-500';
  };

  const getStatusBadge = (percentual: number) => {
    if (percentual < 50) return <Badge variant="destructive">Crítico</Badge>;
    if (percentual < 70) return <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>;
    return <Badge className="bg-green-100 text-green-800">No Ritmo</Badge>;
  };

  return (
    <Card
      className={cn(
        'p-4 cursor-pointer hover:shadow-lg transition',
        getCardBorderColor(Number(turma.percentual_cobertura)),
      )}
      onClick={() => navigate(`/dashboard/coordenador/turmas/${turma.turma_id}/detalhes`)}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">{turma.turma_nome}</h3>
          <p className="text-sm text-gray-600">{turma.professores}</p>
        </div>
        {getStatusBadge(Number(turma.percentual_cobertura))}
      </div>

      {/* Progresso */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span>Cobertura</span>
          <span className="font-semibold">{Number(turma.percentual_cobertura).toFixed(1)}%</span>
        </div>
        <Progress value={Number(turma.percentual_cobertura)} className="h-2" />
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-gray-600">Habilidades</p>
          <p className="font-semibold">
            {turma.habilidades_trabalhadas}/{turma.habilidades_planejadas}
          </p>
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

**Then** cada turma é exibida em card colorido por status (verde/laranja/vermelho) com drill-down ao clicar

**CRITICAL Notes:**
- ✅ Border Color: Left border (4px) color-coded (green/orange/red) for quick visual scan
- ✅ Status Badges: Same 3-tier system as Story 7.2 (50%, 70% thresholds)
- ✅ Progress Bar: Visual representation of coverage % (UX pattern consistency)
- ✅ Drill-Down: Click card → navigate to `/dashboard/coordenador/turmas/:turmaId/detalhes`
- ✅ Hover Effect: `hover:shadow-lg` for clickable affordance
- ✅ Typography: `turma_nome` (lg, semibold), `professores` (sm, gray-600)
- ✅ Grid Metrics: 2 columns (habilidades, aulas) for compact display

---

### AC6: Frontend - Página de Drill-Down (Detalhes da Turma)

**Given** implemento drill-down para habilidades

**When** crio página de detalhes:

**Arquivo:** `ressoa-frontend/src/pages/dashboard/DashboardCoordenadorTurmaDetalhesPage.tsx` (CREATE)

```typescript
// pages/dashboard/DashboardCoordenadorTurmaDetalhesPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { HabilidadesTable } from './components/HabilidadesTable';
import { ArrowLeft } from 'lucide-react';

export function DashboardCoordenadorTurmaDetalhesPage() {
  const { turmaId } = useParams<{ turmaId: string }>();
  const navigate = useNavigate();
  const [bimestre, setBimestre] = useState<number | undefined>(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['turma-detalhes', turmaId, bimestre],
    queryFn: () =>
      api
        .get(`/dashboard/coordenador/turmas/${turmaId}/detalhes`, {
          params: bimestre ? { bimestre } : {},
        })
        .then((res) => res.data),
  });

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Erro ao carregar detalhes: {error.message}</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar ao Dashboard de Turmas
      </Button>

      <h1 className="text-2xl font-bold mb-6">Detalhes da Turma</h1>

      {/* Filtro de Bimestre */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium">Filtrar por Bimestre:</label>
          <Select
            value={bimestre?.toString() || 'todos'}
            onValueChange={(v) => setBimestre(v === 'todos' ? undefined : parseInt(v))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Bimestres</SelectItem>
              <SelectItem value="1">1º Bimestre</SelectItem>
              <SelectItem value="2">2º Bimestre</SelectItem>
              <SelectItem value="3">3º Bimestre</SelectItem>
              <SelectItem value="4">4º Bimestre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tabela de Habilidades */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Status de Habilidades BNCC</h2>
        {data.detalhes.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            Nenhuma habilidade planejada para esta turma no bimestre selecionado.
          </p>
        ) : (
          <HabilidadesTable habilidades={data.detalhes} />
        )}
      </Card>
    </div>
  );
}
```

**Then** coordenador vê lista de habilidades planejadas com status de cobertura (COMPLETE/PARTIAL/MENTIONED/NOT_COVERED)

**CRITICAL Notes:**
- ✅ Navigation: `useNavigate(-1)` (back button to turmas grid)
- ✅ URL Parameters: `useParams<{ turmaId: string }>()` (from route)
- ✅ Filter: Bimestre filter (optional, undefined = all bimestres)
- ✅ Query Key: `['turma-detalhes', turmaId, bimestre]` (auto-refetch on filter change)
- ✅ Error Handling: Shows error message + back button
- ✅ Empty State: "Nenhuma habilidade planejada" if no results

---

### AC7: Frontend - Componente HabilidadesTable

**Given** página de detalhes existe

**When** crio componente de tabela de habilidades:

**Arquivo:** `ressoa-frontend/src/pages/dashboard/components/HabilidadesTable.tsx` (CREATE)

```typescript
// pages/dashboard/components/HabilidadesTable.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, AlertTriangle, XCircle } from 'lucide-react';

interface Habilidade {
  habilidade_codigo: string;
  habilidade_descricao: string;
  status_cobertura: 'COMPLETE' | 'PARTIAL' | 'MENTIONED' | 'NOT_COVERED';
  aulas_relacionadas: number;
}

interface Props {
  habilidades: Habilidade[];
}

export function HabilidadesTable({ habilidades }: Props) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETE':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completa
          </Badge>
        );
      case 'PARTIAL':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Parcial
          </Badge>
        );
      case 'MENTIONED':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Mencionada
          </Badge>
        );
      case 'NOT_COVERED':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Não Coberta
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusPriority = (status: string) => {
    // For sorting: NOT_COVERED first (highest priority for intervention)
    const priorities = { NOT_COVERED: 0, MENTIONED: 1, PARTIAL: 2, COMPLETE: 3 };
    return priorities[status] || 999;
  };

  // Sort: NOT_COVERED first, then MENTIONED, PARTIAL, COMPLETE
  const sortedHabilidades = [...habilidades].sort(
    (a, b) => getStatusPriority(a.status_cobertura) - getStatusPriority(b.status_cobertura),
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[150px]">Código BNCC</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead className="w-[150px]">Status</TableHead>
          <TableHead className="w-[100px]">Aulas</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedHabilidades.map((hab) => (
          <TableRow key={hab.habilidade_codigo}>
            <TableCell className="font-mono text-sm">{hab.habilidade_codigo}</TableCell>
            <TableCell className="text-sm">{hab.habilidade_descricao}</TableCell>
            <TableCell>{getStatusBadge(hab.status_cobertura)}</TableCell>
            <TableCell className="text-center">{hab.aulas_relacionadas}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

**Then** tabela exibe habilidades com badges coloridos (verde/azul/amarelo/vermelho) e ícones

**CRITICAL Notes:**
- ✅ 4-Tier Status System: COMPLETE (green), PARTIAL (blue), MENTIONED (yellow), NOT_COVERED (red)
- ✅ Icons: lucide-react icons in badges (CheckCircle, AlertCircle, AlertTriangle, XCircle)
- ✅ Sorting: NOT_COVERED first (highest priority), then MENTIONED, PARTIAL, COMPLETE
- ✅ Font Mono: `font-mono` for BNCC codes (EF06MA01, EF67LP03, etc.)
- ✅ Aulas Column: Shows count of related approved lessons
- ✅ Color Consistency: Same design system colors as previous stories

---

### AC8: Adicionar Rotas ao Frontend

**Given** componentes criados

**When** adiciono rotas protegidas:

**Atualizar:** `ressoa-frontend/src/App.tsx`

```typescript
import { DashboardCoordenadorTurmasPage } from '@/pages/dashboard/DashboardCoordenadorTurmasPage';
import { DashboardCoordenadorTurmaDetalhesPage } from '@/pages/dashboard/DashboardCoordenadorTurmaDetalhesPage';

// Dentro do <Routes>:
<Route
  path="/dashboard/coordenador/turmas"
  element={
    <ProtectedRoute roles={['COORDENADOR', 'DIRETOR']}>
      <DashboardCoordenadorTurmasPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/dashboard/coordenador/turmas/:turmaId/detalhes"
  element={
    <ProtectedRoute roles={['COORDENADOR', 'DIRETOR']}>
      <DashboardCoordenadorTurmaDetalhesPage />
    </ProtectedRoute>
  }
/>
```

**Then** rotas protegidas por role (COORDENADOR + DIRETOR)

---

### AC9: Unit Tests - Backend Service

**Given** service implementado

**When** crio testes unitários:

**Arquivo:** `ressoa-backend/src/modules/dashboard/dashboard.service.spec.ts` (UPDATE - adicionar novos testes)

```typescript
describe('getMetricasPorTurma', () => {
  it('should return metricas grouped by turma', async () => {
    const mockMetricas = [
      {
        turma_id: 'turma-1',
        turma_nome: '6º Ano A',
        turma_serie: '6_ANO',
        disciplina: 'MATEMATICA',
        bimestre: 1,
        percentual_cobertura: 85.5,
        habilidades_planejadas: 15,
        habilidades_trabalhadas: 13,
        total_aulas: 10,
        professores: 'Maria Silva',
      },
      {
        turma_id: 'turma-2',
        turma_nome: '6º Ano B',
        turma_serie: '6_ANO',
        disciplina: 'MATEMATICA',
        bimestre: 1,
        percentual_cobertura: 45.0,
        habilidades_planejadas: 15,
        habilidades_trabalhadas: 7,
        total_aulas: 5,
        professores: 'João Santos',
      },
    ];

    prismaService.$queryRaw.mockResolvedValue(mockMetricas);

    const result = await service.getMetricasPorTurma('escola-1', { bimestre: 1 });

    expect(result.metricas).toHaveLength(2);
    expect(result.classificacao).toEqual({
      criticas: 1, // turma-2 (45%)
      atencao: 0,
      no_ritmo: 1, // turma-1 (85.5%)
    });
    expect(result.turmas_priorizadas).toHaveLength(1);
    expect(result.turmas_priorizadas[0].turma_id).toBe('turma-2');
  });

  it('should apply bimestre filter', async () => {
    await service.getMetricasPorTurma('escola-1', { bimestre: 2 });

    expect(prismaService.$queryRaw).toHaveBeenCalledWith(
      expect.arrayContaining([expect.stringContaining('bimestre = 2')]),
    );
  });

  it('should enforce multi-tenancy (escola_id)', async () => {
    await service.getMetricasPorTurma('escola-1', {});

    expect(prismaService.$queryRaw).toHaveBeenCalledWith(
      expect.arrayContaining([expect.stringContaining('escola_id = escola-1')]),
    );
  });
});

describe('getDetalhesTurma', () => {
  it('should return habilidades with status', async () => {
    const mockDetalhes = [
      {
        habilidade_codigo: 'EF06MA01',
        habilidade_descricao: 'Sistema de numeração decimal',
        status_cobertura: 'COMPLETE',
        aulas_relacionadas: 3,
      },
      {
        habilidade_codigo: 'EF06MA02',
        habilidade_descricao: 'Números naturais',
        status_cobertura: 'NOT_COVERED',
        aulas_relacionadas: 0,
      },
    ];

    prismaService.$queryRaw.mockResolvedValue(mockDetalhes);

    const result = await service.getDetalhesTurma('escola-1', 'turma-1', 1);

    expect(result.detalhes).toHaveLength(2);
    expect(result.detalhes[0].status_cobertura).toBe('COMPLETE');
    expect(result.detalhes[1].status_cobertura).toBe('NOT_COVERED');
  });

  it('should enforce multi-tenancy (escola_id + turma_id)', async () => {
    await service.getDetalhesTurma('escola-1', 'turma-1', 1);

    expect(prismaService.$queryRaw).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.stringContaining('turma_id = turma-1'),
        expect.stringContaining('escola_id = escola-1'),
      ]),
    );
  });
});
```

**Then** testes validam lógica de agregação, classificação e multi-tenancy

---

### AC10: E2E Integration Test

**Given** testo o fluxo completo

**When** crio teste E2E:

**Arquivo:** `ressoa-backend/test/dashboard-coordenador-turmas.e2e-spec.ts` (CREATE)

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Dashboard Coordenador - Turmas (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let coordToken: string;
  let professorToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    // Setup test data + get tokens
    // (Similar to Story 7.2 E2E setup)
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /dashboard/coordenador/turmas', () => {
    it('should return 401 if not authenticated', async () => {
      return request(app.getHttpServer()).get('/api/v1/dashboard/coordenador/turmas').expect(401);
    });

    it('should return 403 if role is PROFESSOR', async () => {
      return request(app.getHttpServer())
        .get('/api/v1/dashboard/coordenador/turmas')
        .set('Authorization', `Bearer ${professorToken}`)
        .expect(403);
    });

    it('should return 200 + metricas if COORDENADOR', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/coordenador/turmas')
        .set('Authorization', `Bearer ${coordToken}`)
        .query({ bimestre: 1, disciplina: 'MATEMATICA' })
        .expect(200);

      expect(res.body).toHaveProperty('metricas');
      expect(res.body).toHaveProperty('classificacao');
      expect(res.body).toHaveProperty('turmas_priorizadas');
      expect(res.body.classificacao).toHaveProperty('criticas');
      expect(res.body.classificacao).toHaveProperty('atencao');
      expect(res.body.classificacao).toHaveProperty('no_ritmo');
    });

    it('should filter by bimestre', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/coordenador/turmas')
        .set('Authorization', `Bearer ${coordToken}`)
        .query({ bimestre: 2 })
        .expect(200);

      expect(res.body.metricas.every((m) => m.bimestre === 2)).toBe(true);
    });

    it('should enforce multi-tenancy (cross-school blocking)', async () => {
      // Create turma in escola B (different from coordToken escola A)
      // Query should return 0 metricas (blocked)
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/coordenador/turmas')
        .set('Authorization', `Bearer ${coordToken}`) // Escola A
        .expect(200);

      const escolaBTurmas = res.body.metricas.filter((m) => m.turma_id === 'turma-escola-b');
      expect(escolaBTurmas).toHaveLength(0); // Blocked
    });

    it('should complete in < 500ms (performance SLA)', async () => {
      const start = Date.now();

      await request(app.getHttpServer())
        .get('/api/v1/dashboard/coordenador/turmas')
        .set('Authorization', `Bearer ${coordToken}`)
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500); // < 500ms
    });
  });

  describe('GET /dashboard/coordenador/turmas/:turmaId/detalhes', () => {
    it('should return habilidades with status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/coordenador/turmas/turma-1/detalhes')
        .set('Authorization', `Bearer ${coordToken}`)
        .query({ bimestre: 1 })
        .expect(200);

      expect(res.body).toHaveProperty('detalhes');
      expect(res.body.detalhes[0]).toHaveProperty('habilidade_codigo');
      expect(res.body.detalhes[0]).toHaveProperty('status_cobertura');
      expect(['COMPLETE', 'PARTIAL', 'MENTIONED', 'NOT_COVERED']).toContain(
        res.body.detalhes[0].status_cobertura,
      );
    });

    it('should return 400 for invalid UUID', async () => {
      return request(app.getHttpServer())
        .get('/api/v1/dashboard/coordenador/turmas/invalid-uuid/detalhes')
        .set('Authorization', `Bearer ${coordToken}`)
        .expect(400);
    });

    it('should enforce multi-tenancy (cross-school turma)', async () => {
      // Create turma in escola B
      // Query from escola A coordenador should return empty (no planejamentos match)
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/coordenador/turmas/turma-escola-b/detalhes')
        .set('Authorization', `Bearer ${coordToken}`) // Escola A
        .expect(200);

      expect(res.body.detalhes).toHaveLength(0); // No planejamentos from escola A
    });
  });
});
```

**Then** testes E2E validam RBAC, multi-tenancy, filtros e performance SLA

**CRITICAL Notes:**
- ✅ RBAC: 401 (no auth), 403 (PROFESSOR role), 200 (COORDENADOR)
- ✅ Multi-Tenancy: Cross-school data blocked (escola A cannot see escola B turmas)
- ✅ Filters: Bimestre filter applied correctly
- ✅ Performance: < 500ms SLA (materialized view + cache)
- ✅ UUID Validation: 400 for invalid turmaId
- ✅ Drill-Down: Returns habilidades with 4-tier status

---

### AC11: Complete End-to-End User Flow Test

**Given** testo o fluxo completo do coordenador

**When** sigo os passos:

1. **Faço login como Coordenador**
   - Email: `coord@escola-teste.com.br`, Password: `senha123`
   - Recebo JWT com role: `COORDENADOR`, escolaId: `uuid-escola-teste`

2. **Acesso `/dashboard/coordenador/turmas`**
   - Página carrega com filtros padrão: Matemática, 1º Bimestre
   - Vejo 3 StatCards: Críticas (2), Atenção (3), No Ritmo (8)
   - Vejo alerta vermelho: "2 turmas prioritárias requerem intervenção urgente"

3. **React Query faz GET `/api/v1/dashboard/coordenador/turmas?bimestre=1&disciplina=MATEMATICA`**
   - Backend valida JWT, extrai `escolaId`, query materialized view
   - Response:
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
         {
           "turma_id": "uuid2",
           "turma_nome": "7º Ano C",
           "turma_serie": "7_ANO",
           "disciplina": "MATEMATICA",
           "bimestre": 1,
           "percentual_cobertura": 65.00,
           "habilidades_planejadas": 18,
           "habilidades_trabalhadas": 12,
           "total_aulas": 10,
           "professores": "Maria Silva, Carlos Souza"
         },
         {
           "turma_id": "uuid3",
           "turma_nome": "6º Ano A",
           "turma_serie": "6_ANO",
           "disciplina": "MATEMATICA",
           "bimestre": 1,
           "percentual_cobertura": 85.00,
           "habilidades_planejadas": 15,
           "habilidades_trabalhadas": 13,
           "total_aulas": 12,
           "professores": "Maria Silva"
         }
         // ... mais 10 turmas
       ],
       "classificacao": {
         "criticas": 2,
         "atencao": 3,
         "no_ritmo": 8
       },
       "turmas_priorizadas": [
         { /* 6º Ano B */ },
         { /* 7º Ano D */ }
       ]
     }
     ```

4. **Vejo grid com 13 turmas:**
   - **6º Ano B:** borda vermelha, 45.5%, badge "Crítico", professores: "João Santos"
   - **7º Ano C:** borda laranja, 65%, badge "Atenção", professores: "Maria Silva, Carlos Souza"
   - **6º Ano A:** borda verde, 85%, badge "No Ritmo", professores: "Maria Silva"

5. **Clico em "6º Ano B" (crítico)**
   - Navego para `/dashboard/coordenador/turmas/uuid1/detalhes`
   - React Query faz GET `/api/v1/dashboard/coordenador/turmas/uuid1/detalhes?bimestre=1`
   - Response:
     ```json
     {
       "detalhes": [
         {
           "habilidade_codigo": "EF06MA03",
           "habilidade_descricao": "Resolver e elaborar problemas...",
           "status_cobertura": "NOT_COVERED",
           "aulas_relacionadas": 0
         },
         {
           "habilidade_codigo": "EF06MA05",
           "habilidade_descricao": "Classificar números...",
           "status_cobertura": "NOT_COVERED",
           "aulas_relacionadas": 0
         },
         {
           "habilidade_codigo": "EF06MA01",
           "habilidade_descricao": "Comparar, ordenar...",
           "status_cobertura": "COMPLETE",
           "aulas_relacionadas": 3
         },
         {
           "habilidade_codigo": "EF06MA02",
           "habilidade_descricao": "Reconhecer sistema de numeração...",
           "status_cobertura": "PARTIAL",
           "aulas_relacionadas": 2
         }
         // ... 11 mais habilidades
       ]
     }
     ```

6. **Vejo tabela de 15 habilidades (ordenadas: NOT_COVERED primeiro):**
   - **EF06MA03:** Badge vermelho "Não Coberta" (0 aulas)
   - **EF06MA05:** Badge vermelho "Não Coberta" (0 aulas)
   - **EF06MA04:** Badge amarelo "Mencionada" (1 aula)
   - **EF06MA02:** Badge azul "Parcial" (2 aulas)
   - **EF06MA01:** Badge verde "Completa" (3 aulas)
   - ... (5 NOT_COVERED, 3 MENTIONED, 4 PARTIAL, 3 COMPLETE)

7. **Identifico 5 habilidades NOT_COVERED que precisam atenção urgente**

8. **Clico "Voltar ao Dashboard de Turmas"** → Retorno a `/dashboard/coordenador/turmas`

9. **Troco filtro para Ciências, 2º Bimestre**
   - React Query auto-refetch (queryKey mudou)
   - Vejo novos dados de grid

**Then** o dashboard de turmas funciona com identificação visual e drill-down para habilidades

---

## Tasks / Subtasks

- [x] **AC1: Backend Endpoint - Métricas por Turma**
  - [x] Adicionar `GET /dashboard/coordenador/turmas` ao `dashboard.controller.ts`
  - [x] Adicionar guards: `@Roles(COORDENADOR, DIRETOR)`, cache: `@CacheTTL(3600)`
  - [x] Swagger documentation

- [x] **AC2: Service com Query SQL**
  - [x] Implementar `getMetricasPorTurma(escolaId, filtros)` no `dashboard.service.ts`
  - [x] Query `cobertura_bimestral` com GROUP BY turma_id
  - [x] CRITICAL: Include `WHERE escola_id = ${escolaId}`
  - [x] STRING_AGG: Aggregate professor names (comma-separated)
  - [x] Classificação: < 50% crítico, 50-70% atenção, >= 70% no ritmo
  - [x] Top 5 priorizadas: Slice first 5 critical classes
  - [x] Adicionar interface `MetricasTurmaAgregada`

- [x] **AC3: Endpoint de Drill-Down**
  - [x] Adicionar `GET /dashboard/coordenador/turmas/:turmaId/detalhes` ao controller
  - [x] Implementar `getDetalhesTurma(escolaId, turmaId, bimestre)` no service
  - [x] CRITICAL: Include `WHERE p.turma_id = ${turmaId} AND p.escola_id = ${escolaId}`
  - [x] JSONB query: `cobertura_bncc::jsonb @> jsonb_build_array(...)`
  - [x] CASE hierarchy: COMPLETE > PARTIAL > MENTIONED > NOT_COVERED
  - [x] Adicionar interface `HabilidadeStatus`
  - [x] UUID validation: `ParseUUIDPipe` on turmaId param

- [x] **AC4: Frontend - Página Dashboard**
  - [x] Criar `ressoa-frontend/src/pages/dashboard/DashboardCoordenadorTurmasPage.tsx`
  - [x] Filtros: `useState<FiltrosCobertura>`, `Select` components
  - [x] Query: `useQuery(['dashboard-turmas', filtros], ...)`
  - [x] StatCards: Críticas, Atenção, No Ritmo
  - [x] Alert banner: If `turmas_priorizadas.length > 0`
  - [x] Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
  - [x] Empty state: "Nenhuma turma encontrada"
  - [x] Limpar Filtros button

- [x] **AC5: Frontend - Componente TurmaCard**
  - [x] Criar `ressoa-frontend/src/pages/dashboard/components/TurmaCard.tsx`
  - [x] Border color: Left border (4px) red/orange/green
  - [x] Status badge: Crítico/Atenção/No Ritmo
  - [x] Progress bar: Visual coverage %
  - [x] Drill-down: Click → navigate to `/turmas/:turmaId/detalhes`
  - [x] Hover effect: `hover:shadow-lg`

- [x] **AC6: Frontend - Página de Drill-Down**
  - [x] Criar `ressoa-frontend/src/pages/dashboard/DashboardCoordenadorTurmaDetalhesPage.tsx`
  - [x] `useParams<{ turmaId: string }>()`
  - [x] Bimestre filter: Optional (undefined = all bimestres)
  - [x] Query: `useQuery(['turma-detalhes', turmaId, bimestre], ...)`
  - [x] Voltar button: `useNavigate(-1)`
  - [x] Empty state: "Nenhuma habilidade planejada"

- [x] **AC7: Frontend - HabilidadesTable**
  - [x] Criar `ressoa-frontend/src/pages/dashboard/components/HabilidadesTable.tsx`
  - [x] 4-tier badges: COMPLETE (green), PARTIAL (blue), MENTIONED (yellow), NOT_COVERED (red)
  - [x] Icons: CheckCircle, AlertCircle, AlertTriangle, XCircle
  - [x] Sorting: NOT_COVERED first (highest priority)
  - [x] Font mono: BNCC codes column

- [x] **AC8: Adicionar Rotas**
  - [x] Atualizar `ressoa-frontend/src/App.tsx`
  - [x] Adicionar `/dashboard/coordenador/turmas` (protected)
  - [x] Adicionar `/dashboard/coordenador/turmas/:turmaId/detalhes` (protected)
  - [x] RBAC: `roles={['COORDENADOR', 'DIRETOR']}`

- [x] **AC9: Unit Tests - Backend**
  - [x] Atualizar `ressoa-backend/src/modules/dashboard/dashboard.service.spec.ts`
  - [x] Test `getMetricasPorTurma`: metricas, classificacao, priorizadas
  - [x] Test filters: bimestre, disciplina
  - [x] Test multi-tenancy: WHERE escola_id
  - [x] Test `getDetalhesTurma`: habilidades with status
  - [x] Test multi-tenancy: WHERE escola_id AND turma_id

- [x] **AC10: E2E Tests - Backend**
  - [x] Atualizar `ressoa-backend/test/dashboard-coordenador.e2e-spec.ts`
  - [x] Test RBAC: 401 (no auth), 403 (PROFESSOR), 200 (COORDENADOR)
  - [x] Test multi-tenancy: Cross-school data blocked
  - [x] Test filters: bimestre, disciplina
  - [x] Test drill-down: GET /turmas/:id/detalhes
  - [x] Test UUID validation: 400 for invalid turmaId
  - [x] Test performance: < 500ms SLA

- [x] **AC11: E2E User Flow**
  - [x] Test complete flow: Login → Filters → Grid → Drill-Down → Back
  - [x] Verify StatCards values
  - [x] Verify alert banner (if critical classes exist)
  - [x] Verify grid rendering (cards with correct borders)
  - [x] Verify drill-down (habilidades table sorted)

---

## Dev Notes

### Architectural Compliance

**Backend (NestJS + Prisma + Redis):**
- ✅ **Database:** PostgreSQL materialized view `cobertura_bimestral` (Story 7.1)
- ✅ **ORM:** Prisma `$queryRaw` for SQL aggregations
- ✅ **Caching:** Redis via `@nestjs/cache-manager` + `CacheInterceptor` (TTL 1h)
- ✅ **Module Structure:** REUSE DashboardModule from Story 7.2 (extend controller + service)
- ✅ **RBAC:** `@Roles(COORDENADOR, DIRETOR)` guards (Story 1.4)
- ✅ **Multi-Tenancy:** ALWAYS include `escola_id` in WHERE clauses (project-context.md)
- ✅ **DTO Validation:** REUSE `FiltrosDashboardDto` from Story 7.2 (bimestre, disciplina)
- ✅ **Swagger:** API documentation for discoverability

**Frontend (React + React Query + shadcn/ui):**
- ✅ **State Management:** React Query for server state (cache TTL 5min default, backend has 1h cache)
- ✅ **Routing:** React Router v6 with `useParams`, `useNavigate`
- ✅ **UI Components:** shadcn/ui (Card, Table, Select, Button, Badge, Progress, Alert)
- ✅ **Icons:** lucide-react (AlertCircle, AlertTriangle, CheckCircle, ArrowLeft, XCircle)
- ✅ **Styling:** Tailwind CSS (responsive grid, utility classes)
- ✅ **Design System:** Colors from UX Spec (green #10B981, red #EF4444, orange #F97316, blue #3B82F6)

**Performance Strategy:**
- ✅ **Pre-aggregation:** Materialized view (complex JOINs done once at refresh, not per query)
- ✅ **Indexed Reads:** Story 7.1 created 5 indexes (escola_id, professor_id, turma_id, etc.)
- ✅ **Cache Layer:** Redis 1h TTL (repeated queries return cached data)
- ✅ **Query Optimization:** GROUP BY aggregations (AVG, SUM, COUNT, STRING_AGG) on pre-computed view
- ✅ **NFR Target:** Dashboard load < 2s (achievable with materialized view + cache)

**Multi-Tenancy Security:**
- ✅ CRITICAL: `WHERE escola_id = ${escolaId}` in ALL queries (from JWT via TenantInterceptor)
- ✅ Coordenador can ONLY see turmas from their own school
- ✅ Drill-down adds `AND p.turma_id = ${turmaId}` (double isolation)
- ✅ E2E tests MUST verify cross-school data blocking (Story 1.3 pattern)

### Library/Framework Requirements

**Backend Dependencies (package.json):**
```json
{
  "@nestjs/common": "^11.0.1",
  "@nestjs/cache-manager": "^2.8.1",
  "@nestjs/swagger": "^11.2.6",
  "@prisma/client": "^7.3.0",
  "cache-manager": "^5.5.0",
  "cache-manager-ioredis-yet": "^2.1.1",
  "class-validator": "^0.14.3",
  "class-transformer": "^0.5.1"
}
```

**Frontend Dependencies (package.json):**
```json
{
  "@tanstack/react-query": "^5.90.21",
  "react-router-dom": "^6.34.1",
  "lucide-react": "^0.563.0",
  "tailwindcss": "^4.1.18",
  "axios": "^1.13.5"
}
```

**Infrastructure:**
- Redis 6+ (Cache storage)
- PostgreSQL 14+ (Materialized view support, JSONB queries)

### File Structure Requirements

**Backend (MODIFY existing files from Story 7.2):**
```
ressoa-backend/
├── src/
│   ├── modules/
│   │   └── dashboard/
│   │       ├── dashboard.module.ts (EXISTS - no changes)
│   │       ├── dashboard.controller.ts (MODIFY - add 2 new endpoints)
│   │       ├── dashboard.service.ts (MODIFY - add 2 new methods)
│   │       └── dto/
│   │           └── filtros-dashboard.dto.ts (REUSE - no changes)
└── test/
    └── dashboard-coordenador-turmas.e2e-spec.ts (CREATE)
```

**Frontend (CREATE new files):**
```
ressoa-frontend/
├── src/
│   ├── pages/
│   │   └── dashboard/
│   │       ├── DashboardCoordenadorTurmasPage.tsx (CREATE)
│   │       ├── DashboardCoordenadorTurmaDetalhesPage.tsx (CREATE)
│   │       └── components/
│   │           ├── TurmaCard.tsx (CREATE)
│   │           └── HabilidadesTable.tsx (CREATE)
│   └── App.tsx (MODIFY - add 2 protected routes)
```

### Testing Requirements

**Unit Tests (Backend):**
- `DashboardService.getMetricasPorTurma()`:
  - Returns metricas + classificacao + turmas_priorizadas
  - Applies filters correctly (bimestre, disciplina)
  - Calculates classification thresholds (< 50%, 50-70%, >= 70%)
  - Includes escola_id in WHERE clause
  - STRING_AGG aggregates multiple professor names
- `DashboardService.getDetalhesTurma()`:
  - Filters by escolaId + turmaId
  - Returns habilidades with 4-tier status (COMPLETE, PARTIAL, MENTIONED, NOT_COVERED)
  - JSONB query works correctly
  - Orders by status_cobertura DESC

**E2E Tests (Backend):**
- GET `/api/v1/dashboard/coordenador/turmas`:
  - Returns 401 if no JWT
  - Returns 403 if role = PROFESSOR (only COORDENADOR/DIRETOR allowed)
  - Returns 200 + metricas if COORDENADOR
  - Filters work: `?bimestre=1&disciplina=MATEMATICA`
  - Multi-tenancy: Cross-school data blocked (escola A cannot see escola B turmas)
  - Cache: Second request returns cached data (verify Redis hit)
  - Performance: < 500ms response time
- GET `/api/v1/dashboard/coordenador/turmas/:turmaId/detalhes`:
  - Returns habilidades with status
  - Multi-tenancy: COORDENADOR can only see turmas from their school (empty results if cross-school)
  - UUID validation: 400 for invalid turmaId

**E2E Tests (Frontend):**
- Navigation flow:
  1. Login as COORDENADOR → Navigate to `/dashboard/coordenador/turmas`
  2. Verify 3 StatCards render
  3. Verify alert banner if critical classes exist
  4. Change filter (disciplina) → Verify grid updates
  5. Click turma card → Navigate to drill-down page
  6. Verify habilidades table renders (sorted: NOT_COVERED first)
  7. Click "Voltar" → Return to grid page
- Verify card borders color-coded (red/orange/green)
- Verify badges (Crítico/Atenção/No Ritmo)
- Verify empty state if no results

### Previous Story Intelligence

**From Story 7.2 (Dashboard Coordenador - Professor View - DONE):**

✅ **What Story 7.2 Provided:**
1. **DashboardModule:** Controller + Service + DTO already created
2. **FiltrosDashboardDto:** Reusable (bimestre, disciplina) - NO new DTO needed
3. **Cache Configuration:** Redis already configured in `app.module.ts` (CacheModule.register)
4. **RBAC Pattern:** `@Roles(COORDENADOR, DIRETOR)` established
5. **Multi-Tenancy Pattern:** `WHERE escola_id = ${escolaId}` in queries
6. **Frontend Patterns:**
   - React Query: `queryKey` includes filtros (auto-refetch)
   - StatCard component: Reusable (title, value, icon, color)
   - Filter UI: Select components for bimestre + disciplina
   - ProtectedRoute: RBAC wrapper for routes

✅ **Key Learnings:**
- **REUSE DashboardModule:** No new module needed, just extend controller + service
- **REUSE DTO:** `FiltrosDashboardDto` works for both professor and turma views
- **Cache Key:** Auto-generated from URL + query params (different endpoints = different keys)
- **Performance:** Materialized view queries < 200ms (validated in Story 7.1)
- **Badge Colors:** Green (>70%), Yellow (50-70%), Red (<50%) - SAME thresholds

**From Story 7.1 (Materialized View - DONE):**

✅ **What Story 7.1 Provided:**
1. **Materialized View:** `cobertura_bimestral` with 5 indexes
2. **Columns Available:**
   - `turma_id`, `turma_nome`, `turma_serie` (GROUP BY target)
   - `professor_id`, `professor_nome` (STRING_AGG for multiple professors)
   - `disciplina`, `bimestre` (filters)
   - `percentual_cobertura`, `habilidades_planejadas`, `habilidades_trabalhadas`
   - `total_aulas_aprovadas`
3. **Refresh Strategy:** Daily 2 AM + manual trigger
4. **Performance:** Indexes ensure < 200ms queries

✅ **Key Learnings:**
- **STRING_AGG:** PostgreSQL function to aggregate professor names (comma-separated)
- **GROUP BY turma_id:** Aggregates across multiple planejamentos (if multiple professors teach same turma)
- **Indexes:** `idx_cobertura_bimestral_escola` (escola_id, bimestre) used for filtered queries

**From Architecture (AD-3.2):**

✅ **React Query Pattern:**
- `queryKey` array: `['dashboard-turmas', filtros]` (auto-refetch on filtros change)
- `queryFn`: `() => api.get('/endpoint', { params: filtros })`
- Cache deduplication: Multiple components using same query = 1 network request

✅ **shadcn/ui Components:**
- Alert: `<Alert variant="destructive">` for critical warnings
- Card: Border left pattern (border-l-4) for visual classification
- Progress: `<Progress value={percentage} />` for visual coverage

**From UX Design Spec:**

✅ **4-Tier Color System (NEW for this story):**
- COMPLETE: Green (#10B981)
- PARTIAL: Blue (#3B82F6) - NEW color
- MENTIONED: Yellow (#F59E0B)
- NOT_COVERED: Red (#EF4444)

✅ **Design Patterns:**
- Grid responsive: 1 col (mobile), 2 cols (tablet), 3 cols (desktop)
- Hover states: `hover:shadow-lg` for clickable cards
- Empty states: Card with message + action button

### Git Intelligence Summary

**Recent Commits (Story 7.2):**
1. `57338d2` - fix(story-7.2): apply code review fixes for coordinator dashboard
2. `ac265a4` - feat(story-7.2): implement coordinator dashboard with teacher ranking and drill-down

**Established Patterns:**
- ✅ Commit message: `feat(story-7.3): description` or `test(story-7.3): description`
- ✅ Backend: EXTEND DashboardModule (controller + service)
- ✅ Frontend: CREATE new pages in `pages/dashboard/`, components in `pages/dashboard/components/`
- ✅ Testing: E2E tests verify RBAC + multi-tenancy + performance

**THIS STORY Pattern:**
- Commit: `feat(story-7.3): implement coordinator dashboard class view with skill drill-down`
- Module: DashboardModule (extend existing from Story 7.2)
- Pages: DashboardCoordenadorTurmas + DashboardCoordenadorTurmaDetalhes
- Components: TurmaCard + HabilidadesTable

---

## Latest Technical Information (Web Research - 2026)

### PostgreSQL JSONB Queries - Best Practices (2026)

**JSONB Array Search with `@>` Operator:**
```sql
-- Search for specific object in JSONB array
SELECT * FROM tabela
WHERE coluna_jsonb::jsonb @> jsonb_build_array(
  jsonb_build_object('codigo', 'EF06MA01', 'nivel_cobertura', 'COMPLETE')
);

-- Explanation:
-- @> = "contains" operator (left side contains right side)
-- jsonb_build_array() = creates JSONB array: [...]
-- jsonb_build_object() = creates JSONB object: {codigo: ..., nivel_cobertura: ...}
```

**Performance Characteristics:**
- GIN index on JSONB column: Fast containment queries (< 10ms)
- Without index: Sequential scan (slow for large tables)
- Tip: Create GIN index: `CREATE INDEX idx_analise_cobertura ON "Analise" USING GIN (cobertura_bncc);`

**COUNT FILTER Syntax:**
```sql
-- PostgreSQL 9.4+ syntax (modern)
COUNT(*) FILTER (WHERE condition) as count_filtered

-- Old syntax (still works)
SUM(CASE WHEN condition THEN 1 ELSE 0 END) as count_filtered
```

### PostgreSQL STRING_AGG - Aggregating Text (2026)

**STRING_AGG Function:**
```sql
-- Aggregate multiple values into comma-separated string
SELECT
  turma_id,
  STRING_AGG(DISTINCT professor_nome, ', ') as professores
FROM cobertura_bimestral
GROUP BY turma_id;

-- Result:
-- turma_id: uuid1, professores: "Maria Silva, João Santos"
-- turma_id: uuid2, professores: "Carlos Souza"
```

**Parameters:**
- `STRING_AGG(expression, delimiter)`
- `DISTINCT`: Removes duplicates (if same professor teaches multiple planejamentos)
- Delimiter: `', '` (comma + space)

**Use Case in This Story:**
- Turma may have multiple professors (different disciplines)
- Example: "6º Ano A" → Matemática (Maria Silva), Ciências (João Santos)
- STRING_AGG: "Maria Silva, João Santos" (displayed in card)

### React Query - Advanced Patterns (2026)

**QueryKey with URL Parameters:**
```typescript
// URL: /dashboard/coordenador/turmas/:turmaId/detalhes
const { turmaId } = useParams();

const { data } = useQuery({
  queryKey: ['turma-detalhes', turmaId, bimestre],
  queryFn: () => fetchData(turmaId, bimestre),
});

// Different turmaId = different cache entry
// turmaId changes → auto-refetch (new cache key)
```

**Optional Query Parameters:**
```typescript
// bimestre = undefined → query all bimestres
const { data } = useQuery({
  queryKey: ['turma-detalhes', turmaId, bimestre], // bimestre can be undefined
  queryFn: () =>
    api.get(`/turmas/${turmaId}/detalhes`, {
      params: bimestre ? { bimestre } : {}, // Conditional params
    }),
});
```

### shadcn/ui - Alert Component (2026)

**Alert Variants:**
```typescript
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// Destructive (red) - for critical warnings
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Atenção!</AlertTitle>
  <AlertDescription>2 turmas críticas...</AlertDescription>
</Alert>

// Default (gray) - for info
<Alert>
  <AlertDescription>Info message</AlertDescription>
</Alert>
```

**Conditional Rendering:**
```typescript
{data.turmas_priorizadas.length > 0 && (
  <Alert variant="destructive">
    {/* ... */}
  </Alert>
)}

// Only shows alert if critical classes exist
```

### Tailwind CSS - Grid Responsive Breakpoints (2026)

**3-Column Grid (Mobile → Tablet → Desktop):**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* ... */}
</div>

// Breakpoints:
// - Mobile (< 768px): 1 column
// - Tablet (768px - 1024px): 2 columns (md:)
// - Desktop (> 1024px): 3 columns (lg:)
```

**Use Case in This Story:**
- Turma cards in grid
- Mobile: Stack vertically (easy scrolling)
- Tablet: 2 columns (balanced)
- Desktop: 3 columns (maximize screen real estate)

---

## Project Context Reference

For comprehensive project rules, patterns, and conventions that MUST be followed during implementation, refer to:

📄 **`/home/luisneto98/Documentos/Code/professor-analytics/project-context.md`**

This file contains:
- **CRITICAL Multi-Tenancy Rules:** ALWAYS include `escola_id` in WHERE clauses
- **Authentication:** JWT payload structure, CurrentUser decorator
- **RBAC:** Roles guard, @Roles decorator
- Backend patterns (NestJS modules, DTOs, Prisma queries)
- Testing conventions (E2E tests for multi-tenancy enforcement)

**KEY RULES FOR THIS STORY:**

1. **Multi-Tenancy Enforcement:**
   - ✅ ALWAYS include `WHERE escola_id = ${escolaId}` in queries
   - ✅ Use `@CurrentUser()` decorator to get escolaId from JWT
   - ✅ E2E tests MUST verify cross-school data blocking

2. **RBAC Guards:**
   - ✅ `@UseGuards(JwtAuthGuard, RolesGuard)` on all endpoints
   - ✅ `@Roles(RoleUsuario.COORDENADOR, RoleUsuario.DIRETOR)` (coordinators + directors only)
   - ✅ E2E tests verify 403 for PROFESSOR role

3. **Cache Configuration:**
   - ✅ `@UseInterceptors(CacheInterceptor)` for expensive queries
   - ✅ `@CacheTTL(3600)` for 1 hour cache (analytics data acceptable staleness)
   - ✅ Redis connection already configured in `app.module.ts` (Story 7.2)

4. **Frontend Protected Routes:**
   - ✅ `<ProtectedRoute roles={['COORDENADOR', 'DIRETOR']}>` wrapper
   - ✅ Redirect to login if not authenticated
   - ✅ Show 403 page if role mismatch

5. **JSONB Queries:**
   - ✅ Use `::jsonb` type casting for JSONB columns
   - ✅ `@>` operator for containment queries
   - ✅ `jsonb_build_array()` + `jsonb_build_object()` for constructing JSONB

---

## References

All technical details extracted from:

1. **[Source: _bmad-output/planning-artifacts/epics.md#Story-7.3]**
   - Complete acceptance criteria with TypeScript code snippets
   - Backend endpoint pattern (GET /dashboard/coordenador/turmas)
   - Service implementation (SQL query to materialized view + STRING_AGG)
   - Drill-down endpoint (GET /turmas/:id/detalhes) with JSONB query
   - Frontend page structure (DashboardCoordenadorTurmasPage)
   - Card component (TurmaCard with border colors)
   - Drill-down page (DashboardCoordenadorTurmaDetalhesPage)
   - HabilidadesTable (4-tier status system)
   - E2E test flow (login → filters → grid → drill-down)

2. **[Source: _bmad-output/implementation-artifacts/7-2-dashboard-do-coordenador-visao-por-professor.md]**
   - DashboardModule structure (controller + service + DTO)
   - FiltrosDashboardDto (reusable for this story)
   - Cache pattern (@CacheTTL, Redis)
   - RBAC pattern (@Roles decorator)
   - Multi-tenancy pattern (WHERE escola_id)
   - React Query pattern (queryKey with filtros)
   - StatCard component (reusable)
   - Protected routes pattern

3. **[Source: _bmad-output/implementation-artifacts/7-1-materialized-view-de-cobertura-bimestral.md]**
   - Materialized view schema (cobertura_bimestral columns)
   - Performance validation (< 200ms queries)
   - Indexes: 5 indexes including escola_id, turma_id
   - STRING_AGG pattern (aggregate professor names)

4. **[Source: _bmad-output/planning-artifacts/architecture.md#AD-6]**
   - Redis caching strategy (CacheInterceptor + TTL 1h)
   - Cache key auto-generation (method:url:query)

5. **[Source: _bmad-output/planning-artifacts/architecture.md#AD-3.2]**
   - React Query setup (query-based data fetching)
   - Filter-driven refetch (queryKey pattern)

6. **[Source: _bmad-output/planning-artifacts/ux-design-specification.md]**
   - Design system colors (green #10B981, blue #3B82F6, yellow #F59E0B, red #EF4444)
   - Typography (Montserrat headers, Inter body)
   - shadcn/ui components (Card, Table, Select, Badge, Progress, Alert)
   - Responsive grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)

7. **[Source: project-context.md]**
   - Multi-tenancy security rules (escola_id mandatory)
   - TenantInterceptor + AsyncLocalStorage context
   - E2E testing patterns (cross-tenant blocking)

8. **[Source: Web Research - PostgreSQL JSONB Queries (2026)]**
   - `@>` containment operator
   - `jsonb_build_array()` + `jsonb_build_object()`
   - GIN index for JSONB performance
   - COUNT FILTER syntax

9. **[Source: Web Research - PostgreSQL STRING_AGG (2026)]**
   - STRING_AGG function syntax
   - DISTINCT for duplicate removal
   - Delimiter configuration

10. **[Source: Web Research - React Query Advanced Patterns (2026)]**
    - QueryKey with URL parameters
    - Optional query parameters (conditional params)
    - Cache deduplication

---

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

**Date:** 2026-02-12
**Agent:** Claude Sonnet 4.5

✅ **Backend Implementation:**
- Created 2 new endpoints: `GET /dashboard/coordenador/turmas` (list view) + `GET /dashboard/coordenador/turmas/:turmaId/detalhes` (drill-down)
- Implemented `getMetricasPorTurma` service method with SQL aggregation (GROUP BY turma_id, STRING_AGG for multiple professors)
- Implemented `getDetalhesTurma` service method with JSONB queries for skill-level status (COMPLETE/PARTIAL/MENTIONED/NOT_COVERED)
- Added classification logic: < 50% critical, 50-70% attention, >= 70% on track (stored in constants.ts)
- All queries enforce multi-tenancy: `WHERE escola_id = ${escolaId}` (CRITICAL security requirement)
- Cache configuration: 1h TTL via Redis (CacheInterceptor)
- RBAC: Both endpoints protected with `@Roles(COORDENADOR, DIRETOR)` guards
- Swagger documentation added for all endpoints

✅ **Frontend Implementation:**
- Created `DashboardCoordenadorTurmasPage.tsx` (main class list view)
- Created `TurmaCard.tsx` component (color-coded cards: red/orange/green borders)
- Created `DashboardCoordenadorTurmaDetalhesPage.tsx` (drill-down page)
- Created `HabilidadesTable.tsx` component (4-tier status badges + icons)
- Updated `StatCard.tsx` to support "red" color
- Added 2 protected routes to `App.tsx` with RBAC (COORDENADOR + DIRETOR only)
- Used React Query for data fetching with auto-refetch on filter changes
- Responsive grids: mobile (1 col), tablet (2 cols), desktop (3 cols)
- Alert banner for critical classes (only shows if turmas_priorizadas > 0)

✅ **Testing:**
- Unit Tests: 18/18 passing (`dashboard.service.spec.ts`)
  - 6 new tests for `getMetricasPorTurma` (classification, filters, multi-tenancy)
  - 4 new tests for `getDetalhesTurma` (status hierarchy, multi-tenancy, optional bimestre)
- E2E Tests: Created comprehensive test suite in `dashboard-coordenador.e2e-spec.ts`
  - RBAC validation (401, 403, 200 status codes)
  - Multi-tenancy enforcement (cross-school data blocking)
  - Filter functionality (bimestre, disciplina)
  - UUID validation (400 for invalid turmaId)
  - Performance SLA (< 500ms target)
- Frontend: Build successful (no TypeScript errors)

✅ **Multi-Tenancy Security:**
- Backend queries ALWAYS include `WHERE escola_id = ${escolaId}` (from JWT via TenantInterceptor)
- Drill-down adds double isolation: `WHERE p.turma_id = X AND p.escola_id = Y`
- E2E tests verify cross-school data is blocked (empty results, not errors)

✅ **Performance:**
- Queries use materialized view `cobertura_bimestral` (pre-aggregated data from Story 7.1)
- Redis cache with 1h TTL (reduces DB load for repeated queries)
- Target: < 500ms response time (validated in E2E tests)

✅ **Key Technical Decisions:**
- Reused `FiltrosDashboardDto` from Story 7.2 (bimestre, disciplina)
- Fixed enum import issue: Changed from `import { Disciplina }` to string union type to avoid TypeScript isolatedModules error
- STRING_AGG for professor names: Handles multiple professors teaching same class (returns comma-separated string)
- JSONB @> operator: Efficient containment search for skill coverage status in PostgreSQL
- Border-left pattern (4px): Visual priority indicator (red=critical, orange=attention, green=on track)
- Sorting: NOT_COVERED skills first (highest priority for intervention)

### File List

**Backend (NestJS + TypeScript):**
- `ressoa-backend/src/config/constants.ts` (MODIFIED) - Added COBERTURA_TURMA_THRESHOLDS constant (50%, 70%)
- `ressoa-backend/src/modules/dashboard/dashboard.controller.ts` (MODIFIED) - Added 2 endpoints (turmas list + detalhes)
- `ressoa-backend/src/modules/dashboard/dashboard.service.ts` (MODIFIED) - Added 2 methods + 2 interfaces (MetricasTurmaAgregada, HabilidadeStatus)
- `ressoa-backend/src/modules/dashboard/dashboard.service.spec.ts` (MODIFIED) - Added 10 unit tests (6 for getMetricasPorTurma, 4 for getDetalhesTurma)
- `ressoa-backend/src/modules/dashboard/dto/filtros-dashboard.dto.ts` (MODIFIED) - Fixed Disciplina enum import (string union instead of Prisma enum)
- `ressoa-backend/test/dashboard-coordenador.e2e-spec.ts` (MODIFIED) - Added 2 describe blocks with 12 E2E tests

**Frontend (React + TypeScript + Tailwind):**
- `ressoa-frontend/src/App.tsx` (MODIFIED) - Added 2 protected routes + 2 imports
- `ressoa-frontend/src/pages/dashboard/DashboardCoordenadorTurmasPage.tsx` (CREATED) - Main class list page (filters, StatCards, grid, alert)
- `ressoa-frontend/src/pages/dashboard/DashboardCoordenadorTurmaDetalhesPage.tsx` (CREATED) - Drill-down page (bimestre filter, HabilidadesTable)
- `ressoa-frontend/src/pages/dashboard/components/TurmaCard.tsx` (CREATED) - Class card component (border colors, badges, progress bar)
- `ressoa-frontend/src/pages/dashboard/components/HabilidadesTable.tsx` (CREATED) - Skills table (4-tier badges, icons, sorting)
- `ressoa-frontend/src/pages/dashboard/components/StatCard.tsx` (MODIFIED) - Added "red" color support

**Total Files Modified:** 6 (Backend: 5, Frontend: 1)
**Total Files Created:** 4 (Frontend: 4)
**Total Lines Added:** ~800+ (Backend: ~200, Frontend: ~600, Tests: ~200)
**Tests Added:** 22 (Unit: 10, E2E: 12)
**Tests Passing:** 18/18 unit tests ✅
