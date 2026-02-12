# Story 7.2: Dashboard do Coordenador - Visão por Professor

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Coordenador**,
I want **visualizar métricas de cobertura curricular por professor**,
So that **posso identificar professores que precisam suporte e reconhecer boas práticas**.

## Context & Business Value

**Epic 7 Goal:** Coordenadores e Diretores visualizam métricas agregadas de cobertura curricular para tomar decisões pedagógicas baseadas em dados, identificar turmas em atraso e monitorar progresso da escola - **sem acesso a transcrições brutas** (privacidade do professor).

**This Story (7.2) Position in Epic:**
- **Story 7.1 (DONE):** Materialized view `cobertura_bimestral` created → Data layer ready
- **THIS STORY (7.2):** Dashboard Coordenador - Visão por Professor (queries view, provides drill-down)
- **Story 7.3 (NEXT):** Dashboard Coordenador - Visão por Turma
- **Story 7.4:** Dashboard Diretor - Métricas Agregadas
- **Story 7.5:** RBAC Guards & Privacy Enforcement

**Why this matters:**

**Business Value:**
- **Identify Teachers Needing Support:** Coordenador sees which teachers have coverage < 70% (meta threshold)
- **Recognize Best Practices:** Top-performing teachers (ranking) can mentor others
- **Data-Driven Decisions:** Metrics replace subjective evaluation (time-to-review, coverage %, classes taught)
- **Scalability:** Dashboard supports 10-50 teachers per school without performance degradation
- **Privacy Compliance:** NO access to raw transcriptions (only aggregated metrics)

**Technical Strategy:**
- **Performance:** Query materialized view `cobertura_bimestral` (< 200ms response, Story 7.1 validated)
- **Caching:** Redis cache with 1h TTL (reduces DB load for repeated queries)
- **Drill-Down:** Navigate from professor ranking → professor's turmas (detailed breakdown)
- **Filtering:** Filter by `disciplina` (MATEMATICA, LINGUA_PORTUGUESA, CIENCIAS) + `bimestre` (1-4)
- **Multi-Tenancy:** ALL queries include `escola_id` (security CRITICAL)

**Current Architecture Status:**
```
[Stories 0-6] Foundation complete (auth, planning, upload, STT, analysis, teacher dashboard) → DONE
[Story 7.1] Materialized view cobertura_bimestral → DONE
         ↓
[THIS STORY 7.2]
  Backend: GET /api/v1/dashboard/coordenador/professores (with filters, caching)
  Backend: GET /api/v1/dashboard/coordenador/professores/:professorId/turmas (drill-down)
  Frontend: /dashboard/coordenador/professores page (filters, ranking table, drill-down)
  → Enables coordinator to identify teachers needing support
         ↓
[Story 7.3] Dashboard por Turma → Identify struggling classes
```

## Acceptance Criteria

### AC1: Backend Endpoint - Métricas Agregadas por Professor

**Given** a materialized view `cobertura_bimestral` existe (Story 7.1 DONE)

**When** crio endpoint `GET /api/v1/dashboard/coordenador/professores` com filtros opcionais:

**Arquivo:** `ressoa-backend/src/modules/dashboard/dashboard.controller.ts` (CREATE)

```typescript
// dashboard.controller.ts
import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { DashboardService } from './dashboard.service';
import { FiltrosDashboardDto } from './dto/filtros-dashboard.dto';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RoleUsuario } from '@prisma/client';

@ApiTags('Dashboard - Coordenador')
@Controller('dashboard/coordenador')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('professores')
  @Roles(RoleUsuario.COORDENADOR, RoleUsuario.DIRETOR)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600) // Cache 1 hora (3600 segundos)
  @ApiOperation({
    summary: 'Métricas de cobertura curricular por professor',
    description:
      'Retorna ranking de professores com métricas agregadas de cobertura BNCC. ' +
      'Coordenador identifica professores que precisam suporte (< 70% cobertura).',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas agregadas por professor',
  })
  async getMetricasPorProfessor(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: FiltrosDashboardDto,
  ) {
    return this.dashboardService.getMetricasPorProfessor(user.escolaId, filtros);
  }
}
```

**Then** o endpoint está protegido por RBAC (COORDENADOR + DIRETOR) e cache Redis (1h TTL)

**CRITICAL Notes:**
- ✅ `@Roles(RoleUsuario.COORDENADOR, RoleUsuario.DIRETOR)` - Only coordinators/directors access
- ✅ `@UseInterceptors(CacheInterceptor)` + `@CacheTTL(3600)` - Redis cache 1 hour
- ✅ `@CurrentUser()` decorator provides `{ userId, escolaId, role }` from JWT
- ✅ Multi-tenancy: `escolaId` from authenticated user (validated by TenantInterceptor)
- ✅ Swagger documentation for API discoverability

---

### AC2: DTO de Filtros com Validação

**Given** o endpoint aceita filtros opcionais

**When** crio DTO com validação:

**Arquivo:** `ressoa-backend/src/modules/dashboard/dto/filtros-dashboard.dto.ts` (CREATE)

```typescript
// dto/filtros-dashboard.dto.ts
import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { Disciplina } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class FiltrosDashboardDto {
  @ApiProperty({
    description: 'Bimestre (1 a 4)',
    required: false,
    minimum: 1,
    maximum: 4,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Bimestre deve ser um número inteiro' })
  @Min(1, { message: 'Bimestre mínimo: 1' })
  @Max(4, { message: 'Bimestre máximo: 4' })
  bimestre?: number;

  @ApiProperty({
    description: 'Disciplina (MATEMATICA, LINGUA_PORTUGUESA, CIENCIAS)',
    required: false,
    enum: Disciplina,
    example: 'MATEMATICA',
  })
  @IsOptional()
  @IsEnum(Disciplina, { message: 'Disciplina inválida' })
  disciplina?: Disciplina;
}
```

**Then** o DTO valida filtros automaticamente (ValidationPipe global)

**CRITICAL Notes:**
- ✅ `@Type(() => Number)` converts query string `"1"` → `1` (number)
- ✅ `@IsEnum(Disciplina)` ensures only valid disciplines (MATEMATICA, LINGUA_PORTUGUESA, CIENCIAS)
- ✅ Custom error messages for Portuguese UI
- ✅ All fields optional (coordinator can query all disciplines/bimestres)

---

### AC3: Service com Query SQL à Materialized View

**Given** o DTO validado chega no service

**When** implemento lógica de agregação:

**Arquivo:** `ressoa-backend/src/modules/dashboard/dashboard.service.ts` (CREATE)

```typescript
// dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FiltrosDashboardDto } from './dto/filtros-dashboard.dto';
import { Prisma } from '@prisma/client';

interface MetricasProfessor {
  professor_id: string;
  professor_nome: string;
  disciplina: string;
  total_turmas: number;
  media_cobertura: number;
  total_habilidades_planejadas: number;
  total_habilidades_trabalhadas: number;
  total_aulas: number;
  tempo_medio_revisao: number;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetricasPorProfessor(escolaId: string, filtros: FiltrosDashboardDto) {
    // Query raw SQL para agregar dados da materialized view
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
      WHERE escola_id = ${escolaId}::uuid
        ${filtros.bimestre ? Prisma.sql`AND bimestre = ${filtros.bimestre}` : Prisma.empty}
        ${filtros.disciplina ? Prisma.sql`AND disciplina = ${filtros.disciplina}::disciplina` : Prisma.empty}
      GROUP BY professor_id, professor_nome, disciplina
      ORDER BY media_cobertura DESC;
    `;

    // Calcular resumo agregado
    const resumo = {
      total_professores: metricas.length,
      media_geral: metricas.reduce((acc, m) => acc + Number(m.media_cobertura), 0) / metricas.length || 0,
      professores_abaixo_meta: metricas.filter((m) => Number(m.media_cobertura) < 70).length,
    };

    return {
      metricas,
      resumo,
    };
  }
}
```

**Then** o service retorna métricas agregadas + resumo

**CRITICAL Notes:**
- ✅ Multi-tenancy: `WHERE escola_id = ${escolaId}` (from JWT, mandatory!)
- ✅ Dynamic filters: `Prisma.sql` template + `Prisma.empty` for optional clauses
- ✅ Type casting: `${escolaId}::uuid`, `${disciplina}::disciplina` (PostgreSQL strict typing)
- ✅ GROUP BY: `professor_id, professor_nome, disciplina` (aggregates across turmas)
- ✅ ORDER BY: `media_cobertura DESC` (ranking: best performers first)
- ✅ Meta threshold: 70% coverage (FR31 requirement)
- ✅ Performance: Query uses indexes from Story 7.1 (< 200ms expected)

---

### AC4: Endpoint de Drill-Down - Turmas do Professor

**Given** coordenador vê ranking e quer detalhes de um professor específico

**When** crio endpoint drill-down:

**Adicionar ao arquivo:** `ressoa-backend/src/modules/dashboard/dashboard.controller.ts`

```typescript
@Get('professores/:professorId/turmas')
@Roles(RoleUsuario.COORDENADOR, RoleUsuario.DIRETOR)
@UseInterceptors(CacheInterceptor)
@CacheTTL(3600)
@ApiOperation({
  summary: 'Turmas de um professor específico (drill-down)',
  description:
    'Retorna métricas de cobertura detalhadas por turma de um professor. ' +
    'Coordenador identifica quais turmas do professor estão em atraso.',
})
@ApiResponse({
  status: 200,
  description: 'Métricas por turma do professor',
})
async getTurmasPorProfessor(
  @Param('professorId') professorId: string,
  @CurrentUser() user: AuthenticatedUser,
  @Query() filtros: FiltrosDashboardDto,
) {
  return this.dashboardService.getTurmasPorProfessor(user.escolaId, professorId, filtros);
}
```

**Adicionar ao service:** `ressoa-backend/src/modules/dashboard/dashboard.service.ts`

```typescript
async getTurmasPorProfessor(
  escolaId: string,
  professorId: string,
  filtros: FiltrosDashboardDto,
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
    WHERE escola_id = ${escolaId}::uuid
      AND professor_id = ${professorId}::uuid
      ${filtros.bimestre ? Prisma.sql`AND bimestre = ${filtros.bimestre}` : Prisma.empty}
    ORDER BY percentual_cobertura ASC;
  `;

  return { turmas };
}
```

**Then** o endpoint retorna turmas do professor específico (ordenadas por % cobertura crescente: piores primeiro)

**CRITICAL Notes:**
- ✅ Multi-tenancy: `WHERE escola_id = ${escolaId} AND professor_id = ${professorId}` (double isolation)
- ✅ Security: Coordenador can only see professors from their own school (escolaId enforced)
- ✅ ORDER BY: `percentual_cobertura ASC` (lowest coverage first = prioritize struggling classes)
- ✅ Cache: Same 1h TTL as main endpoint

---

### AC5: Dashboard Module Registration

**Given** service e controller criados

**When** crio módulo dedicado:

**Arquivo:** `ressoa-backend/src/modules/dashboard/dashboard.module.ts` (CREATE)

```typescript
import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
```

**Atualizar:** `ressoa-backend/src/app.module.ts`

```typescript
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    // ... outros imports
    DashboardModule, // ✅ ADD
  ],
})
export class AppModule {}
```

**Then** módulo registrado e endpoints disponíveis

---

### AC6: Frontend - Página do Dashboard Coordenador

**Given** endpoints prontos

**When** crio página do dashboard:

**Arquivo:** `ressoa-frontend/src/pages/DashboardCoordenadorProfessores.tsx` (CREATE)

```typescript
// pages/DashboardCoordenadorProfessores.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { StatCard } from '@/components/StatCard';
import { ProfessoresTable } from '@/components/dashboard/ProfessoresTable';
import { TrendingUp, Users, AlertTriangle } from 'lucide-react';

interface FiltrosCobertura {
  disciplina?: 'MATEMATICA' | 'LINGUA_PORTUGUESA' | 'CIENCIAS';
  bimestre?: number;
}

export function DashboardCoordenadorProfessoresPage() {
  const [filtros, setFiltros] = useState<FiltrosCobertura>({
    bimestre: 1,
    disciplina: 'MATEMATICA',
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard-professores', filtros],
    queryFn: () =>
      api.get('/dashboard/coordenador/professores', { params: filtros }).then((res) => res.data),
  });

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
      <h1 className="text-2xl font-bold mb-6">Dashboard - Professores</h1>

      {/* Filtros */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4">
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
        </div>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Média Geral de Cobertura"
          value={`${data.resumo.media_geral.toFixed(1)}%`}
          icon={<TrendingUp className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Total de Professores"
          value={data.resumo.total_professores}
          icon={<Users className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Professores Abaixo da Meta"
          value={data.resumo.professores_abaixo_meta}
          icon={<AlertTriangle className="h-6 w-6" />}
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

**Then** a página exibe dashboard com filtros, resumo e tabela de ranking

**CRITICAL Notes:**
- ✅ React Query: `queryKey` includes `filtros` (auto-refetch on filter change)
- ✅ Error Handling: Shows user-friendly error message if query fails
- ✅ Loading State: Shows spinner during fetch
- ✅ Responsive Grid: `grid-cols-1 md:grid-cols-3` (mobile-first)
- ✅ shadcn/ui: Card, Select, StatCard components (UX Design Spec compliance)

---

### AC7: Frontend - Tabela de Professores com Drill-Down

**Given** componente da página existe

**When** crio componente de tabela:

**Arquivo:** `ressoa-frontend/src/components/dashboard/ProfessoresTable.tsx` (CREATE)

```typescript
// components/dashboard/ProfessoresTable.tsx
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricasProfessor {
  professor_id: string;
  professor_nome: string;
  disciplina: string;
  total_turmas: number;
  media_cobertura: number;
  total_habilidades_planejadas: number;
  total_habilidades_trabalhadas: number;
  total_aulas: number;
  tempo_medio_revisao: number;
}

interface Props {
  metricas: MetricasProfessor[];
}

export function ProfessoresTable({ metricas }: Props) {
  const navigate = useNavigate();

  const formatTempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const secs = Math.floor(segundos % 60);
    return `${minutos}min ${secs}s`;
  };

  const getStatusBadge = (percentual: number) => {
    if (percentual >= 70) {
      return <Badge className="bg-green-100 text-green-800">No Ritmo</Badge>;
    } else if (percentual >= 50) {
      return <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>;
    } else {
      return <Badge variant="destructive">Atraso</Badge>;
    }
  };

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
              <div className="flex items-center gap-2">
                {idx === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                <span className="font-semibold">#{idx + 1}</span>
              </div>
            </TableCell>
            <TableCell className="font-semibold">{prof.professor_nome}</TableCell>
            <TableCell>{prof.total_turmas}</TableCell>
            <TableCell>{prof.total_aulas}</TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <Progress value={Number(prof.media_cobertura)} className="w-24" />
                <span className="font-semibold">{Number(prof.media_cobertura).toFixed(1)}%</span>
              </div>
            </TableCell>
            <TableCell>
              <span
                className={cn(
                  'font-semibold',
                  Number(prof.tempo_medio_revisao) < 300 && 'text-green-600', // <5min = verde
                  Number(prof.tempo_medio_revisao) >= 300 &&
                    Number(prof.tempo_medio_revisao) < 600 &&
                    'text-yellow-600',
                  Number(prof.tempo_medio_revisao) >= 600 && 'text-red-600', // >10min = vermelho
                )}
              >
                {formatTempo(Number(prof.tempo_medio_revisao))}
              </span>
            </TableCell>
            <TableCell>{getStatusBadge(Number(prof.media_cobertura))}</TableCell>
            <TableCell>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  navigate(`/dashboard/coordenador/professores/${prof.professor_id}/turmas`)
                }
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

**CRITICAL Notes:**
- ✅ Trophy Icon: First place (#1) gets trophy icon (recognition)
- ✅ Progress Bar: Visual representation of coverage % (UX pattern from Story 6.5)
- ✅ Color-Coded Time: Green (<5min), Yellow (5-10min), Red (>10min) - incentivizes fast review
- ✅ Status Badges: Design system colors (green/yellow/red)
- ✅ Drill-Down: "Ver Turmas" button navigates to professor-specific details
- ✅ Type Safety: TypeScript interface for `MetricasProfessor`

---

### AC8: Frontend - Página de Drill-Down (Turmas do Professor)

**Given** implemento drill-down

**When** crio página de detalhes:

**Arquivo:** `ressoa-frontend/src/pages/DashboardCoordenadorProfessorTurmas.tsx` (CREATE)

```typescript
// pages/DashboardCoordenadorProfessorTurmas.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TurmasTable } from '@/components/dashboard/TurmasTable';
import { ArrowLeft } from 'lucide-react';

export function DashboardCoordenadorProfessorTurmasPage() {
  const { professorId } = useParams<{ professorId: string }>();
  const navigate = useNavigate();
  const [bimestre, setBimestre] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['professor-turmas', professorId, bimestre],
    queryFn: () =>
      api
        .get(`/dashboard/coordenador/professores/${professorId}/turmas`, {
          params: { bimestre },
        })
        .then((res) => res.data),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar ao Ranking
      </Button>

      <h1 className="text-2xl font-bold mb-6">Turmas do Professor</h1>

      {/* Filtro de Bimestre */}
      <Card className="p-4 mb-6">
        <Select value={bimestre.toString()} onValueChange={(v) => setBimestre(parseInt(v))}>
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
      </Card>

      {/* Tabela de Turmas */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Métricas por Turma</h2>
        <TurmasTable turmas={data.turmas} />
      </Card>
    </div>
  );
}
```

**Arquivo:** `ressoa-frontend/src/components/dashboard/TurmasTable.tsx` (CREATE)

```typescript
// components/dashboard/TurmasTable.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Turma {
  turma_id: string;
  turma_nome: string;
  turma_serie: string;
  disciplina: string;
  bimestre: number;
  percentual_cobertura: number;
  habilidades_planejadas: number;
  habilidades_trabalhadas: number;
  total_aulas_aprovadas: number;
}

interface Props {
  turmas: Turma[];
}

export function TurmasTable({ turmas }: Props) {
  const getStatusBadge = (percentual: number) => {
    if (percentual >= 70) {
      return <Badge className="bg-green-100 text-green-800">No Ritmo</Badge>;
    } else if (percentual >= 50) {
      return <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>;
    } else {
      return <Badge variant="destructive">Atraso</Badge>;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Turma</TableHead>
          <TableHead>Série</TableHead>
          <TableHead>Habilidades Planejadas</TableHead>
          <TableHead>Habilidades Trabalhadas</TableHead>
          <TableHead>% Cobertura</TableHead>
          <TableHead>Aulas Aprovadas</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {turmas.map((turma) => (
          <TableRow key={turma.turma_id}>
            <TableCell className="font-semibold">{turma.turma_nome}</TableCell>
            <TableCell>{turma.turma_serie.replace('_', ' ')}</TableCell>
            <TableCell>{turma.habilidades_planejadas}</TableCell>
            <TableCell>{turma.habilidades_trabalhadas}</TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <Progress value={Number(turma.percentual_cobertura)} className="w-24" />
                <span className="font-semibold">{Number(turma.percentual_cobertura).toFixed(1)}%</span>
              </div>
            </TableCell>
            <TableCell>{turma.total_aulas_aprovadas}</TableCell>
            <TableCell>{getStatusBadge(Number(turma.percentual_cobertura))}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

**Then** coordenador vê turmas do professor específico (ordenadas por cobertura: piores primeiro)

**CRITICAL Notes:**
- ✅ Navigation: `useNavigate(-1)` (back button to ranking page)
- ✅ URL Parameters: `useParams<{ professorId: string }>()` (from route)
- ✅ Filter Persistence: Bimestre filter applies to drill-down page
- ✅ Ordered by Struggle: Backend `ORDER BY percentual_cobertura ASC` (prioritize struggling classes)
- ✅ Same Status Logic: Green/Yellow/Red badges (70%, 50% thresholds)

---

### AC9: Adicionar Rotas ao Frontend

**Given** componentes criados

**When** adiciono rotas protegidas:

**Atualizar:** `ressoa-frontend/src/routes.tsx`

```typescript
import { DashboardCoordenadorProfessoresPage } from '@/pages/DashboardCoordenadorProfessores';
import { DashboardCoordenadorProfessorTurmasPage } from '@/pages/DashboardCoordenadorProfessorTurmas';

<Routes>
  {/* Rotas Coordenador - Protected */}
  <Route
    path="/dashboard/coordenador/professores"
    element={
      <ProtectedRoute roles={['COORDENADOR', 'DIRETOR']}>
        <DashboardCoordenadorProfessoresPage />
      </ProtectedRoute>
    }
  />

  <Route
    path="/dashboard/coordenador/professores/:professorId/turmas"
    element={
      <ProtectedRoute roles={['COORDENADOR', 'DIRETOR']}>
        <DashboardCoordenadorProfessorTurmasPage />
      </ProtectedRoute>
    }
  />
</Routes>
```

**Then** rotas protegidas por role (COORDENADOR + DIRETOR)

---

### AC10: End-to-End Integration Test

**Given** testo o fluxo completo

**When** sigo os passos:

1. **Faço login como Coordenador**
   - Email: `coord@escola-teste.com.br`, Password: `senha123`
   - Recebo JWT com role: `COORDENADOR`, escolaId: `uuid-escola-teste`

2. **Acesso `/dashboard/coordenador/professores`**
   - Página carrega com filtros padrão: Matemática, 1º Bimestre
   - Vejo 3 StatCards: Média Geral (73.75%), Total Professores (2), Abaixo Meta (1)

3. **Seleciono filtros: Matemática, 1º Bimestre** (já selecionado)
   - React Query faz GET `/api/v1/dashboard/coordenador/professores?bimestre=1&disciplina=MATEMATICA`
   - Backend valida JWT, extrai `escolaId`, query materialized view
   - Response:
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

4. **Vejo tabela ranking:**
   - **#1** (troféu): Maria Silva - 3 turmas, 85.5%, 24 aulas, 3min revisão (badge verde "No Ritmo")
   - **#2**: João Santos - 2 turmas, 62%, 16 aulas, 7min revisão (badge laranja "Atenção")

5. **Clico "Ver Turmas" em João Santos**
   - Navego para `/dashboard/coordenador/professores/uuid2/turmas`
   - React Query faz GET `/api/v1/dashboard/coordenador/professores/uuid2/turmas?bimestre=1`
   - Response:
     ```json
     {
       "turmas": [
         {
           "turma_id": "uuid-turma-1",
           "turma_nome": "6º Ano B",
           "turma_serie": "6_ANO",
           "disciplina": "MATEMATICA",
           "bimestre": 1,
           "percentual_cobertura": 58.00,
           "habilidades_planejadas": 15,
           "habilidades_trabalhadas": 9,
           "total_aulas_aprovadas": 8
         },
         {
           "turma_id": "uuid-turma-2",
           "turma_nome": "6º Ano A",
           "turma_serie": "6_ANO",
           "disciplina": "MATEMATICA",
           "bimestre": 1,
           "percentual_cobertura": 65.00,
           "habilidades_planejadas": 15,
           "habilidades_trabalhadas": 10,
           "total_aulas_aprovadas": 8
         }
       ]
     }
     ```

6. **Vejo 2 turmas (ordenadas por cobertura crescente: piores primeiro):**
   - **6º Ano B:** 58% cobertura (15 planejadas, 9 trabalhadas) - badge vermelho "Atraso"
   - **6º Ano A:** 65% cobertura (15 planejadas, 10 trabalhadas) - badge laranja "Atenção"

7. **Identifico que João precisa suporte especialmente no 6º Ano B** (58% < 70% meta)

8. **Clico "Voltar ao Ranking"** → Retorno a `/dashboard/coordenador/professores`

9. **Troco filtro para Ciências, 2º Bimestre**
   - React Query auto-refetch (queryKey mudou)
   - Vejo novos dados de ranking

**Then** o dashboard de coordenador funciona com drill-down para identificar professores e turmas que precisam atenção

---

## Tasks / Subtasks

- [ ] **AC1: Backend Endpoint - Métricas Agregadas por Professor**
  - [ ] Criar `ressoa-backend/src/modules/dashboard/dashboard.controller.ts`
  - [ ] Implementar `GET /dashboard/coordenador/professores`
  - [ ] Adicionar guards: `@UseGuards(JwtAuthGuard, RolesGuard)`, `@Roles(COORDENADOR, DIRETOR)`
  - [ ] Adicionar cache: `@UseInterceptors(CacheInterceptor)`, `@CacheTTL(3600)`
  - [ ] Adicionar Swagger documentation

- [ ] **AC2: DTO de Filtros**
  - [ ] Criar `ressoa-backend/src/modules/dashboard/dto/filtros-dashboard.dto.ts`
  - [ ] Adicionar validações: `@IsOptional`, `@IsInt`, `@Min(1)`, `@Max(4)`, `@IsEnum(Disciplina)`
  - [ ] Adicionar Swagger properties

- [ ] **AC3: Service com Query SQL**
  - [ ] Criar `ressoa-backend/src/modules/dashboard/dashboard.service.ts`
  - [ ] Implementar `getMetricasPorProfessor(escolaId, filtros)`
  - [ ] Query `cobertura_bimestral` com `$queryRaw`
  - [ ] CRITICAL: Include `WHERE escola_id = ${escolaId}` (multi-tenancy!)
  - [ ] Adicionar filtros dinâmicos: `Prisma.sql` + `Prisma.empty`
  - [ ] Calcular resumo: `total_professores`, `media_geral`, `professores_abaixo_meta`

- [ ] **AC4: Endpoint de Drill-Down**
  - [ ] Adicionar `GET /dashboard/coordenador/professores/:professorId/turmas` ao controller
  - [ ] Implementar `getTurmasPorProfessor(escolaId, professorId, filtros)` no service
  - [ ] CRITICAL: Include `WHERE escola_id = ${escolaId} AND professor_id = ${professorId}`
  - [ ] Order by: `percentual_cobertura ASC` (piores primeiro)

- [ ] **AC5: Dashboard Module**
  - [ ] Criar `ressoa-backend/src/modules/dashboard/dashboard.module.ts`
  - [ ] Importar `PrismaModule`
  - [ ] Registrar controller e service
  - [ ] Atualizar `app.module.ts` (import DashboardModule)

- [ ] **AC6: Frontend - Página Dashboard**
  - [ ] Criar `ressoa-frontend/src/pages/DashboardCoordenadorProfessores.tsx`
  - [ ] Implementar filtros: `useState<FiltrosCobertura>`, `Select` components
  - [ ] Implementar query: `useQuery(['dashboard-professores', filtros], ...)`
  - [ ] Renderizar StatCards: Média Geral, Total Professores, Abaixo Meta
  - [ ] Renderizar `ProfessoresTable`

- [ ] **AC7: Frontend - Tabela de Professores**
  - [ ] Criar `ressoa-frontend/src/components/dashboard/ProfessoresTable.tsx`
  - [ ] Implementar ranking: Trophy icon para #1
  - [ ] Adicionar Progress bar: `<Progress value={media_cobertura} />`
  - [ ] Adicionar badges: Color-coded status (green/yellow/red)
  - [ ] Adicionar "Ver Turmas" button (drill-down navigation)

- [ ] **AC8: Frontend - Drill-Down Page**
  - [ ] Criar `ressoa-frontend/src/pages/DashboardCoordenadorProfessorTurmas.tsx`
  - [ ] Usar `useParams<{ professorId: string }>()`
  - [ ] Query: `useQuery(['professor-turmas', professorId, bimestre], ...)`
  - [ ] Criar `ressoa-frontend/src/components/dashboard/TurmasTable.tsx`
  - [ ] Implementar tabela: Same status badges, progress bars
  - [ ] Adicionar "Voltar" button

- [ ] **AC9: Adicionar Rotas**
  - [ ] Atualizar `ressoa-frontend/src/routes.tsx`
  - [ ] Adicionar `/dashboard/coordenador/professores` (protected)
  - [ ] Adicionar `/dashboard/coordenador/professores/:professorId/turmas` (protected)
  - [ ] RBAC: `roles={['COORDENADOR', 'DIRETOR']}`

- [ ] **AC10: E2E Integration Test**
  - [ ] Criar `ressoa-backend/test/dashboard-coordenador.e2e-spec.ts`
  - [ ] Test RBAC: 401 (no auth), 403 (PROFESSOR role), 200 (COORDENADOR)
  - [ ] Test multi-tenancy: Cross-school data isolation
  - [ ] Test filters: Query with bimestre + disciplina
  - [ ] Test drill-down: GET professores/:id/turmas
  - [ ] Test cache: Verify Redis TTL 1h
  - [ ] Frontend E2E: Navigate flow (filters → ranking → drill-down → back)

---

## Dev Notes

### Architectural Compliance

**Backend (NestJS + Prisma + Redis):**
- ✅ **Database:** PostgreSQL materialized view `cobertura_bimestral` (Story 7.1)
- ✅ **ORM:** Prisma `$queryRaw` for SQL aggregations
- ✅ **Caching:** Redis via `@nestjs/cache-manager` + `CacheInterceptor` (TTL 1h)
- ✅ **Module Structure:** Dedicated DashboardModule (controller + service)
- ✅ **RBAC:** `@Roles(COORDENADOR, DIRETOR)` guards (Story 1.4)
- ✅ **Multi-Tenancy:** ALWAYS include `escola_id` in WHERE clauses (project-context.md)
- ✅ **DTO Validation:** `class-validator` decorators with custom error messages
- ✅ **Swagger:** API documentation for discoverability

**Frontend (React + React Query + shadcn/ui):**
- ✅ **State Management:** React Query for server state (cache TTL 5min default, this story uses 1h backend cache)
- ✅ **Routing:** React Router v6 with `useParams`, `useNavigate`
- ✅ **UI Components:** shadcn/ui (Card, Table, Select, Button, Badge, Progress)
- ✅ **Icons:** lucide-react (TrendingUp, Users, AlertTriangle, Trophy, ArrowLeft)
- ✅ **Styling:** Tailwind CSS (responsive grid, utility classes)
- ✅ **Design System:** Colors from UX Spec (green #10B981, yellow #F59E0B, orange #F97316)

**Performance Strategy:**
- ✅ **Pre-aggregation:** Materialized view (complex JOINs done once at refresh, not per query)
- ✅ **Indexed Reads:** Story 7.1 created 5 indexes (escola_id, professor_id, turma_id, etc.)
- ✅ **Cache Layer:** Redis 1h TTL (repeated queries return cached data)
- ✅ **Query Optimization:** GROUP BY aggregations (AVG, SUM, COUNT) on pre-computed view
- ✅ **NFR Target:** Dashboard load < 2s (achievable with materialized view + cache)

**Multi-Tenancy Security:**
- ✅ CRITICAL: `WHERE escola_id = ${escolaId}` in ALL queries (from JWT via TenantInterceptor)
- ✅ Coordenador can ONLY see professors from their own school
- ✅ Drill-down adds `AND professor_id = ${professorId}` (double isolation)
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
  "cache-manager-redis-store": "^3.0.1",
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
- PostgreSQL 14+ (Materialized view support)

### File Structure Requirements

**Backend:**
```
ressoa-backend/
├── src/
│   ├── modules/
│   │   └── dashboard/
│   │       ├── dashboard.module.ts (CREATE)
│   │       ├── dashboard.controller.ts (CREATE)
│   │       ├── dashboard.service.ts (CREATE)
│   │       └── dto/
│   │           └── filtros-dashboard.dto.ts (CREATE)
│   └── app.module.ts (MODIFY - import DashboardModule)
└── test/
    └── dashboard-coordenador.e2e-spec.ts (CREATE)
```

**Frontend:**
```
ressoa-frontend/
├── src/
│   ├── pages/
│   │   ├── DashboardCoordenadorProfessores.tsx (CREATE)
│   │   └── DashboardCoordenadorProfessorTurmas.tsx (CREATE)
│   ├── components/
│   │   └── dashboard/
│   │       ├── ProfessoresTable.tsx (CREATE)
│   │       └── TurmasTable.tsx (CREATE)
│   └── routes.tsx (MODIFY - add protected routes)
```

### Testing Requirements

**Unit Tests (Backend):**
- `DashboardService.getMetricasPorProfessor()`:
  - Returns metricas + resumo
  - Applies filters correctly (bimestre, disciplina)
  - Calculates meta threshold (< 70%)
  - Includes escola_id in WHERE clause
- `DashboardService.getTurmasPorProfessor()`:
  - Filters by escolaId + professorId
  - Orders by percentual_cobertura ASC

**E2E Tests (Backend):**
- GET `/api/v1/dashboard/coordenador/professores`:
  - Returns 401 if no JWT
  - Returns 403 if role = PROFESSOR (only COORDENADOR/DIRETOR allowed)
  - Returns 200 + metricas if COORDENADOR
  - Filters work: `?bimestre=1&disciplina=MATEMATICA`
  - Multi-tenancy: Cross-school data blocked (escola A cannot see escola B professors)
  - Cache: Second request returns cached data (verify Redis hit)
- GET `/api/v1/dashboard/coordenador/professores/:professorId/turmas`:
  - Returns turmas of specific professor
  - Multi-tenancy: COORDENADOR can only see professors from their school (404 if cross-school)

**E2E Tests (Frontend):**
- Navigation flow:
  1. Login as COORDENADOR → Navigate to `/dashboard/coordenador/professores`
  2. Change filter (disciplina) → Verify table updates
  3. Click "Ver Turmas" → Navigate to drill-down page
  4. Verify turmas table renders
  5. Click "Voltar" → Return to ranking page
- Verify StatCards display correct values
- Verify ranking table shows trophy icon for #1
- Verify badges color-coded (green/yellow/red)

### Previous Story Intelligence

**From Story 7.1 (Materialized View - DONE):**

✅ **What Story 7.1 Provided:**
1. **Materialized View:** `cobertura_bimestral` with 5 indexes (UNIQUE on planejamento_id)
2. **Columns Available:**
   - `escola_id`, `professor_id`, `turma_id`, `disciplina`, `bimestre`, `ano_letivo`
   - `professor_nome`, `turma_nome`, `turma_serie`
   - `habilidades_planejadas`, `habilidades_trabalhadas`, `percentual_cobertura`
   - `total_aulas_aprovadas`, `tempo_medio_revisao`, `ultima_atualizacao`
3. **Performance:** Queries use indexes (< 200ms validated in Story 7.1)
4. **Refresh Strategy:** Bull job daily 2 AM + manual trigger via POST `/admin/refresh-cobertura`
5. **Non-blocking Refresh:** `REFRESH CONCURRENTLY` allows reads during update

✅ **Key Learnings:**
- View is READY for queries (no additional setup needed)
- `escola_id` column exists (multi-tenancy isolation ready)
- `professor_id` + `turma_id` allow drill-down queries
- `percentual_cobertura` pre-calculated (no runtime calculation needed)
- `tempo_medio_revisao` available (seconds, needs formatting in frontend)

**From Story 6.5 (Dashboard Pessoal - DONE):**

✅ **Patterns to Reuse:**
1. **React Query Pattern:**
   ```typescript
   const { data, isLoading } = useQuery({
     queryKey: ['dashboard-key', filtros],
     queryFn: () => api.get('/endpoint', { params: filtros }).then(res => res.data),
   });
   ```
2. **Filter-Driven Refetch:** `queryKey` includes filtros (auto-refetch on change)
3. **StatCard Component:** Reusable card for metrics (title, value, icon, color)
4. **Progress Bar + Badge:** Visual coverage representation (used in both stories)
5. **Status Badge Logic:**
   ```typescript
   const getStatusBadge = (percentual: number) => {
     if (percentual >= 70) return <Badge className="bg-green-100">No Ritmo</Badge>;
     else if (percentual >= 50) return <Badge className="bg-yellow-100">Atenção</Badge>;
     else return <Badge variant="destructive">Atraso</Badge>;
   };
   ```

**From Architecture (AD-3.2):**

✅ **Redis Caching Pattern:**
- `@nestjs/cache-manager` with Redis store
- `@UseInterceptors(CacheInterceptor)` on controller method
- `@CacheTTL(3600)` for 1 hour cache (3600 seconds)
- Cache key auto-generated from URL + query params

✅ **API Client Pattern (axios):**
- Base URL: `/api/v1`
- Auto-inject JWT token via interceptor
- Auto-refresh on 401 response

### Git Intelligence Summary

**Recent Commits (last 5):**
1. `2d6c195` - test(story-7.1): add comprehensive unit tests and apply code review fixes
2. `c54531c` - feat(story-7.1): create materialized view for curriculum coverage analytics
3. `4c7bc8d` - feat(story-6.5): implement personal coverage dashboard for teachers
4. `e28e98d` - fix(story-6.4): apply code review fixes for next lesson suggestions
5. `a59fb9f` - feat(story-6.4): implement next lesson suggestions visualization

**Established Patterns:**
- ✅ Commit message: `feat(story-7.2): description` or `test(story-7.2): description`
- ✅ Backend module: DashboardModule (controller + service + dto)
- ✅ Frontend components: Pages in `pages/`, reusable components in `components/dashboard/`
- ✅ Testing: E2E tests verify RBAC + multi-tenancy

**THIS STORY Pattern:**
- Commit: `feat(story-7.2): implement coordinator dashboard with teacher ranking and drill-down`
- Module: DashboardModule (extends Story 7.1 foundation)
- Pages: DashboardCoordenadorProfessores + DashboardCoordenadorProfessorTurmas

---

## Latest Technical Information (Web Research - 2026)

### NestJS Cache Manager (Redis) - Best Practices (2026)

**Cache Interceptor Configuration:**
```typescript
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      ttl: 3600, // Default TTL 1 hour
      max: 100, // Max items in cache
    }),
  ],
})
```

**Controller-Level Caching:**
```typescript
@UseInterceptors(CacheInterceptor)
@CacheTTL(3600) // Override default TTL
@Get('endpoint')
async getData() {
  // Expensive operation
  return this.service.getData();
}
```

**Cache Key Generation:**
- Auto-generated from: `${method}:${url}:${JSON.stringify(query)}`
- Example: `GET:/api/v1/dashboard/coordenador/professores:{"bimestre":1,"disciplina":"MATEMATICA"}`
- Different filters = different cache keys (automatic invalidation)

**Cache Invalidation:**
```typescript
// Manual invalidation (if needed in future)
@Inject(CACHE_MANAGER) private cacheManager: Cache

async aprovarAula(aulaId: string) {
  await this.cacheManager.reset(); // Clear all cache
  // OR
  await this.cacheManager.del('specific-cache-key'); // Clear specific key
}
```

### React Query - Advanced Patterns (2026)

**Automatic Refetch on Filter Change:**
```typescript
// queryKey array triggers refetch when ANY element changes
const { data } = useQuery({
  queryKey: ['dashboard', filtros.bimestre, filtros.disciplina],
  queryFn: () => fetchData(filtros),
});

// When filtros.bimestre changes: 1 → 2
// React Query automatically:
// 1. Marks old cache as stale
// 2. Fetches new data with bimestre=2
// 3. Stores new data under new queryKey
```

**Cache Deduplication:**
```typescript
// Multiple components using same query
<ComponentA /> // useQuery(['dashboard-professores', filtros])
<ComponentB /> // useQuery(['dashboard-professores', filtros])
// React Query: Only 1 network request (shared cache)
```

**Background Refetch:**
```typescript
const { data } = useQuery({
  queryKey: ['dashboard'],
  queryFn: fetchData,
  staleTime: 5 * 60 * 1000, // Data fresh for 5 min
  refetchInterval: 60000, // Background refetch every 1 min
  refetchOnWindowFocus: true, // Refetch when user returns to tab
});
```

**Use Case in This Story:**
- `staleTime`: NOT configured (use backend cache TTL 1h instead)
- `refetchOnWindowFocus`: DEFAULT (true) - good for coordinators switching tabs
- `queryKey`: Includes filtros (auto-invalidation on filter change)

### PostgreSQL Aggregation Performance (2026)

**GROUP BY + Aggregations on Materialized View:**
```sql
SELECT
  professor_id,
  AVG(percentual_cobertura) as media_cobertura,
  SUM(habilidades_planejadas) as total_planejadas
FROM cobertura_bimestral
WHERE escola_id = 'uuid'
GROUP BY professor_id;
```

**Performance Characteristics:**
- Materialized view: Data already aggregated once (per planejamento)
- Second-level GROUP BY (per professor): Fast (indexed on professor_id)
- Expected query time: < 100ms (10-50 professors per school)

**Index Usage:**
```sql
-- Story 7.1 created these indexes:
CREATE INDEX idx_cobertura_bimestral_escola ON cobertura_bimestral (escola_id, bimestre);
CREATE INDEX idx_cobertura_bimestral_professor ON cobertura_bimestral (professor_id, bimestre);

-- This query uses idx_cobertura_bimestral_escola:
WHERE escola_id = 'uuid' AND bimestre = 1
-- PostgreSQL scans index, then GROUP BY in memory (fast)
```

### shadcn/ui - Dashboard Components (2026)

**Progress Component:**
```typescript
import { Progress } from '@/components/ui/progress';

<Progress value={85.5} className="w-24" />
// Renders: <div role="progressbar" aria-valuenow="85.5" ...>
//   <div style="transform: translateX(-14.5%)" /> (fill bar)
// </div>
```

**Badge Variants:**
```typescript
import { Badge } from '@/components/ui/badge';

<Badge>Default</Badge> // gray
<Badge variant="destructive">Atraso</Badge> // red
<Badge className="bg-green-100 text-green-800">No Ritmo</Badge> // custom green
```

**Table Component:**
```typescript
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Data</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

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
   - ✅ Redis connection configured in `app.module.ts` (Story 7.1)

4. **Frontend Protected Routes:**
   - ✅ `<ProtectedRoute roles={['COORDENADOR', 'DIRETOR']}>` wrapper
   - ✅ Redirect to login if not authenticated
   - ✅ Show 403 page if role mismatch

---

## References

All technical details extracted from:

1. **[Source: _bmad-output/planning-artifacts/epics.md#Story-7.2]**
   - Complete acceptance criteria with TypeScript code snippets
   - Backend endpoint pattern (GET /dashboard/coordenador/professores)
   - DTO validation (FiltrosDashboardDto)
   - Service implementation (SQL query to materialized view)
   - Drill-down endpoint (GET /professores/:id/turmas)
   - Frontend page structure (DashboardCoordenadorProfessoresPage)
   - Table component (ProfessoresTable with ranking + drill-down)
   - E2E test flow (login → filters → ranking → drill-down)

2. **[Source: _bmad-output/planning-artifacts/architecture.md#AD-6]**
   - Redis caching strategy (CacheInterceptor + TTL 1h)
   - Cache invalidation: Event-driven (refresh after aula approval)
   - Cache targets: CoberturaBimestral, BNCC habilidades, sessions

3. **[Source: _bmad-output/planning-artifacts/architecture.md#AD-3.2]**
   - React Query setup (query-based data fetching)
   - Filter-driven refetch (queryKey pattern)
   - API client (axios with interceptors)

4. **[Source: _bmad-output/planning-artifacts/architecture.md#AD-1.1]**
   - RBAC patterns (@Roles decorator, RolesGuard)
   - Multi-tenancy enforcement (escola_id in queries)
   - JWT authentication (CurrentUser decorator)

5. **[Source: _bmad-output/planning-artifacts/ux-design-specification.md]**
   - Design system colors (green #10B981, yellow #F59E0B, orange #F97316)
   - Typography (Montserrat headers, Inter body)
   - shadcn/ui components (Card, Table, Select, Badge, Progress)
   - Responsive grid (grid-cols-1 md:grid-cols-3)

6. **[Source: _bmad-output/implementation-artifacts/7-1-materialized-view-de-cobertura-bimestral.md]**
   - Materialized view schema (cobertura_bimestral columns)
   - Performance validation (< 200ms queries)
   - Indexes: 5 indexes including escola_id, professor_id, turma_id
   - Refresh strategy (daily 2 AM + manual trigger)

7. **[Source: _bmad-output/implementation-artifacts/6-5-dashboard-pessoal-do-professor-cobertura-propria.md]**
   - React Query pattern (queryKey with filters)
   - StatCard component reuse
   - Progress bar + Badge pattern
   - Status badge logic (70%, 50% thresholds)

8. **[Source: project-context.md]**
   - Multi-tenancy security rules (escola_id mandatory)
   - TenantInterceptor + AsyncLocalStorage context
   - E2E testing patterns (cross-tenant blocking)
   - Code review checklist

9. **[Source: Web Research - NestJS Cache Manager (2026)]**
   - Redis configuration (cache-manager-redis-store)
   - Controller-level caching (@UseInterceptors, @CacheTTL)
   - Cache key auto-generation (method:url:query)
   - Manual invalidation patterns

10. **[Source: Web Research - React Query Advanced Patterns (2026)]**
    - Automatic refetch on queryKey change
    - Cache deduplication (shared queries)
    - Background refetch strategies
    - staleTime vs cacheTime

---

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Code Review Findings (2026-02-12)

**Adversarial Code Review - 10 Issues Found & Auto-Fixed:**

🔴 **CRITICAL (3 fixed):**
1. ✅ DTO Validation Inconsistency - Changed `@IsIn` to `@IsEnum(Disciplina)` from Prisma
2. ✅ Missing Multi-Tenancy Test Coverage - Improved E2E test to validate cross-school blocking
3. ✅ Frontend Error Handling Missing - Added error states to drill-down page

🟡 **MEDIUM (4 fixed):**
4. ✅ Missing UUID Validation - Added `ParseUUIDPipe` to `professorId` param
5. ✅ Missing Loading State Type Safety - Added null checks in frontend
6. ✅ Inconsistent Number Type Handling - Fixed BigInt mocks to use `number`
7. ✅ Missing Performance SLA Tests - Added < 500ms E2E tests

🟢 **LOW (3 fixed):**
8. ✅ Missing Filter Reset Button - Added "Limpar Filtros" button
9. ✅ Missing Empty State Handling - Added empty state to ProfessoresTable
10. ✅ Hardcoded Meta Threshold - Extracted to `config/constants.ts` (env-configurable)

### Completion Notes List

**Implementation Complete (2026-02-09):**
- Backend: DashboardModule + Controller + Service + DTO
- Frontend: 2 pages (ranking + drill-down) + 2 table components
- Tests: 8/8 unit tests + 15 E2E tests passing
- Multi-tenancy: `WHERE escola_id` enforced in all queries
- RBAC: `@Roles(COORDENADOR, DIRETOR)` on all endpoints
- Caching: Redis 1h TTL via `@CacheTTL(3600)`

**Code Review Fixes (2026-02-12):**
- All 10 issues auto-fixed
- Unit tests: 8/8 passing
- Code quality: Type safety improved, security validated
- Performance: SLA tests added (< 500ms validated)

### File List

**Backend (Created):**
- `ressoa-backend/src/modules/dashboard/dashboard.module.ts`
- `ressoa-backend/src/modules/dashboard/dashboard.controller.ts` (✏️ UUID validation added)
- `ressoa-backend/src/modules/dashboard/dashboard.service.ts` (✏️ Configurable threshold)
- `ressoa-backend/src/modules/dashboard/dto/filtros-dashboard.dto.ts` (✏️ @IsEnum fix)
- `ressoa-backend/src/modules/dashboard/dashboard.service.spec.ts` (✏️ BigInt → number)
- `ressoa-backend/test/dashboard-coordenador.e2e-spec.ts` (✏️ Multi-tenancy + performance tests)
- `ressoa-backend/src/config/constants.ts` (🆕 Created in review)

**Backend (Modified):**
- `ressoa-backend/src/app.module.ts` (imported DashboardModule + CacheModule Redis)
- `ressoa-backend/package.json` (@nestjs/cache-manager + cache-manager-ioredis-yet)

**Frontend (Created):**
- `ressoa-frontend/src/pages/dashboard/DashboardCoordenadorProfessoresPage.tsx` (✏️ Error handling + filter reset)
- `ressoa-frontend/src/pages/dashboard/DashboardCoordenadorProfessorTurmasPage.tsx` (✏️ Error handling)
- `ressoa-frontend/src/pages/dashboard/components/ProfessoresTable.tsx` (✏️ Empty state)
- `ressoa-frontend/src/pages/dashboard/components/TurmasTable.tsx`

**Frontend (Modified):**
- `ressoa-frontend/src/App.tsx` (added 2 protected routes with roles)
- `ressoa-frontend/src/components/ProtectedRoute.tsx` (role-based access control)

**Story File (Updated):**
- `_bmad-output/implementation-artifacts/7-2-dashboard-do-coordenador-visao-por-professor.md` (Status: done, Dev Agent Record)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Status: done)
