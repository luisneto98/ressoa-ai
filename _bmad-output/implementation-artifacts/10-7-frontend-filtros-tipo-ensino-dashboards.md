# Story 10.7: Frontend — Filtros de Tipo de Ensino em Dashboards

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Coordenador ou Diretor**,
I want **filtrar dashboards de cobertura por tipo de ensino (Fundamental, Médio, Todos)**,
So that **posso analisar performance curricular separadamente por nível de ensino**.

## Acceptance Criteria

### AC1: Dashboard Coordenador (Turmas) - Adicionar filtro tipo_ensino

**Given** dashboard de Coordenador (visão por turma) renderiza em `/dashboard/coordenador/turmas`

**When** adiciono filtro de tipo de ensino no header da página:
```tsx
<Select value={tipoEnsinoFilter} onValueChange={setTipoEnsinoFilter}>
  <SelectItem value="TODOS">Todos</SelectItem>
  <SelectItem value="FUNDAMENTAL">Ensino Fundamental</SelectItem>
  <SelectItem value="MEDIO">Ensino Médio</SelectItem>
</Select>
```

**Then** filtro é exibido junto com filtros existentes de disciplina e bimestre

**And** filtro persiste no estado do componente (useState)

---

### AC2: Query de turmas filtra por tipo_ensino selecionado

**Given** filtro de tipo_ensino = "MEDIO" selecionado

**When** query de turmas executa via React Query

**Then** backend API é chamada com query param: `GET /api/v1/turmas?tipo_ensino=MEDIO`

**And** apenas turmas de Ensino Médio são retornadas e exibidas

---

### AC3: Dashboard Coordenador (Professores) - Adicionar filtro tipo_ensino

**Given** dashboard de cobertura por professor renderiza em `/dashboard/coordenador/professores`

**When** filtro tipo_ensino = "FUNDAMENTAL" selecionado

**Then** métrica de cobertura mostra % baseado apenas em habilidades de Ensino Fundamental

**And** listagem de professores filtra turmas por tipo_ensino

---

### AC4: StatCard "Total de Turmas" respeita filtro tipo_ensino

**Given** StatCard de "Total de Turmas" renderiza no dashboard

**When** filtro tipo_ensino = "TODOS"

**Then** mostra total geral (Fundamental + Médio)

**When** filtro tipo_ensino = "FUNDAMENTAL"

**Then** mostra apenas quantidade de turmas Fundamental

**When** filtro tipo_ensino = "MEDIO"

**Then** mostra apenas quantidade de turmas Médio

---

### AC5: Gráfico de cobertura ao longo do tempo reflete filtro

**Given** gráfico de cobertura ao longo do tempo renderiza

**When** filtro tipo_ensino aplicado

**Then** séries do gráfico refletem apenas dados do tipo selecionado

**And** tooltip exibe corretamente valores filtrados

---

### AC6: Tabela de turmas com atraso reflete filtro

**Given** tabela de turmas com gaps de cobertura renderiza

**When** filtro tipo_ensino = "MEDIO"

**Then** lista apenas turmas EM com atrasos de cobertura

**And** tabela mostra habilidades EM (formato EM13MAT...)

---

### AC7: Dashboard Diretor - Breakdown por tipo de ensino

**Given** dashboard de Diretor (métricas agregadas) renderiza em `/dashboard/diretor`

**When** página carrega

**Then** exibe métricas separadas lado a lado:
```tsx
<div className="grid grid-cols-2 gap-4">
  <StatCard title="Cobertura Fundamental" value="78%" trend="+5%" />
  <StatCard title="Cobertura Médio" value="82%" trend="+3%" />
</div>
```

**And** breakdown é sempre exibido (não depende de filtro)

---

### AC8: Persistence e UX do filtro

**Given** usuário está em dashboard com filtro tipo_ensino

**When** seleciona "MEDIO"

**Then** filtro persiste ao navegar entre abas do mesmo dashboard

**And** loading state é exibido durante fetch de dados filtrados

**And** se não houver dados para filtro selecionado, exibe empty state com mensagem clara

---

## Tasks / Subtasks

- [ ] **Task 1: Frontend - Adicionar filtro tipo_ensino em DashboardCoordenadorTurmasPage** (AC: #1, #2)
  - [ ] 1.1: Abrir `ressoa-frontend/src/pages/dashboard/DashboardCoordenadorTurmasPage.tsx`
  - [ ] 1.2: Adicionar estado local para filtro:
    ```tsx
    const [tipoEnsinoFilter, setTipoEnsinoFilter] = useState<'TODOS' | 'FUNDAMENTAL' | 'MEDIO'>('TODOS');
    ```
  - [ ] 1.3: Importar componente Select do shadcn/ui: `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';`
  - [ ] 1.4: Adicionar Select no header da página (ao lado dos filtros de disciplina/bimestre):
    ```tsx
    <div className="flex gap-4 items-center">
      <Select value={tipoEnsinoFilter} onValueChange={(v) => setTipoEnsinoFilter(v as any)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Tipo de Ensino" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TODOS">Todos</SelectItem>
          <SelectItem value="FUNDAMENTAL">Ensino Fundamental</SelectItem>
          <SelectItem value="MEDIO">Ensino Médio</SelectItem>
        </SelectContent>
      </Select>
      {/* ... outros filtros existentes ... */}
    </div>
    ```
  - [ ] 1.5: Atualizar React Query (useTurmas hook) para passar tipo_ensino como param:
    ```tsx
    const { data: turmas, isLoading } = useTurmas({
      disciplina: disciplinaFilter,
      bimestre: bimestreFilter,
      tipo_ensino: tipoEnsinoFilter === 'TODOS' ? undefined : tipoEnsinoFilter,
    });
    ```
  - [ ] 1.6: Verificar que query param é enviado corretamente para backend: `GET /api/v1/turmas?tipo_ensino=MEDIO`
  - [ ] 1.7: Adicionar loading state durante refetch: usar `isLoading` do React Query para exibir spinner
  - [ ] 1.8: Adicionar empty state se filtro não retornar resultados:
    ```tsx
    {turmas.length === 0 && (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhuma turma encontrada para {tipoEnsinoFilter === 'MEDIO' ? 'Ensino Médio' : 'Ensino Fundamental'}</p>
      </div>
    )}
    ```

- [ ] **Task 2: Frontend - Adicionar filtro tipo_ensino em DashboardCoordenadorProfessoresPage** (AC: #3)
  - [ ] 2.1: Abrir `ressoa-frontend/src/pages/dashboard/DashboardCoordenadorProfessoresPage.tsx`
  - [ ] 2.2: Adicionar estado e Select (mesmo padrão Task 1)
  - [ ] 2.3: Atualizar hook de professores para passar tipo_ensino:
    ```tsx
    const { data: professores } = useProfessores({
      tipo_ensino: tipoEnsinoFilter === 'TODOS' ? undefined : tipoEnsinoFilter,
    });
    ```
  - [ ] 2.4: Verificar que métricas de cobertura filtram corretamente (backend deve filtrar habilidades por tipo_ensino)
  - [ ] 2.5: Adicionar tooltip ou label indicando que % é baseado no tipo de ensino selecionado:
    ```tsx
    <p className="text-sm text-gray-500">
      Cobertura baseada em habilidades {tipoEnsinoFilter === 'MEDIO' ? 'EM' : tipoEnsinoFilter === 'FUNDAMENTAL' ? 'EF' : 'EF+EM'}
    </p>
    ```

- [ ] **Task 3: Frontend - Atualizar StatCard "Total de Turmas" com filtro** (AC: #4)
  - [ ] 3.1: Localizar componente StatCard de "Total de Turmas" (provavelmente em DashboardCoordenadorTurmasPage)
  - [ ] 3.2: Calcular total dinamicamente baseado em filtro:
    ```tsx
    const totalTurmas = useMemo(() => {
      if (tipoEnsinoFilter === 'TODOS') {
        return turmas.length; // Total geral
      }
      return turmas.filter(t => t.tipo_ensino === tipoEnsinoFilter).length;
    }, [turmas, tipoEnsinoFilter]);
    ```
  - [ ] 3.3: Atualizar StatCard:
    ```tsx
    <StatCard
      title={`Total de Turmas${tipoEnsinoFilter !== 'TODOS' ? ` (${tipoEnsinoFilter === 'MEDIO' ? 'EM' : 'EF'})` : ''}`}
      value={totalTurmas}
    />
    ```

- [ ] **Task 4: Frontend - Atualizar gráficos de cobertura com filtro** (AC: #5)
  - [ ] 4.1: Localizar componente de gráfico de cobertura ao longo do tempo (possivelmente Chart.js ou Recharts)
  - [ ] 4.2: Filtrar dados do gráfico antes de passar para componente:
    ```tsx
    const dadosGrafico = useMemo(() => {
      if (tipoEnsinoFilter === 'TODOS') {
        return coberturaBimestral; // Todos os dados
      }
      return coberturaBimestral.filter(item => item.tipo_ensino === tipoEnsinoFilter);
    }, [coberturaBimestral, tipoEnsinoFilter]);
    ```
  - [ ] 4.3: Passar `dadosGrafico` filtrados para componente Chart
  - [ ] 4.4: Verificar que tooltip exibe corretamente valores filtrados
  - [ ] 4.5: Adicionar label ou legenda indicando filtro ativo: "Dados filtrados: Ensino Médio"

- [ ] **Task 5: Frontend - Atualizar tabela de turmas com atraso** (AC: #6)
  - [ ] 5.1: Localizar componente de tabela de turmas com gaps de cobertura
  - [ ] 5.2: Filtrar turmas antes de exibir na tabela:
    ```tsx
    const turmasComAtraso = useMemo(() => {
      let filtered = turmasComGaps;
      if (tipoEnsinoFilter !== 'TODOS') {
        filtered = filtered.filter(t => t.tipo_ensino === tipoEnsinoFilter);
      }
      return filtered;
    }, [turmasComGaps, tipoEnsinoFilter]);
    ```
  - [ ] 5.3: Exibir formato correto de habilidades (EM13MAT... para EM, EF06MA... para EF)
  - [ ] 5.4: Adicionar badge visual diferenciando tipo de ensino na tabela:
    ```tsx
    <Badge variant={turma.tipo_ensino === 'MEDIO' ? 'purple' : 'blue'}>
      {turma.tipo_ensino === 'MEDIO' ? 'EM' : 'EF'}
    </Badge>
    ```

- [ ] **Task 6: Frontend - Implementar breakdown no Dashboard Diretor** (AC: #7)
  - [ ] 6.1: Abrir `ressoa-frontend/src/pages/dashboard/DashboardDiretorPage.tsx`
  - [ ] 6.2: Verificar se backend já retorna métricas separadas por tipo_ensino (GET /api/v1/dashboards/diretor)
  - [ ] 6.3: Se backend não retorna, calcular no frontend:
    ```tsx
    const { coberturaFundamental, coberturaEM } = useMemo(() => {
      const turmasFundamental = turmas.filter(t => t.tipo_ensino === 'FUNDAMENTAL');
      const turmasEM = turmas.filter(t => t.tipo_ensino === 'MEDIO');

      const cobF = calcularCobertura(turmasFundamental);
      const cobEM = calcularCobertura(turmasEM);

      return { coberturaFundamental: cobF, coberturaEM: cobEM };
    }, [turmas]);
    ```
  - [ ] 6.4: Adicionar grid de StatCards lado a lado:
    ```tsx
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4">Cobertura por Tipo de Ensino</h3>
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          title="Cobertura Fundamental"
          value={`${coberturaFundamental.percentual}%`}
          trend={coberturaFundamental.trend}
          icon={<IconBook className="size-5" />}
        />
        <StatCard
          title="Cobertura Médio"
          value={`${coberturaEM.percentual}%`}
          trend={coberturaEM.trend}
          icon={<IconSchool className="size-5" />}
        />
      </div>
    </div>
    ```
  - [ ] 6.5: Importar ícones do @tabler/icons-react (Story 9.7 padronizou Tabler Icons)
  - [ ] 6.6: Aplicar cores do design system: Deep Navy para títulos, Tech Blue/Cyan AI para valores

- [x] **Task 7: Backend - Garantir suporte a query param tipo_ensino** (AC: #2)
  - [x] 7.1: Abrir `ressoa-backend/src/modules/dashboards/dto/filtros-dashboard.dto.ts`
  - [x] 7.2: Verificar se método `getMetricasPorTurma()` suporta query param `tipo_ensino`
  - [x] 7.3: Se não existir, adicionar DTO:
    ```typescript
    // turmas/dto/find-turmas.dto.ts
    export class FindTurmasDto {
      @IsOptional()
      @IsEnum(TipoEnsino)
      tipo_ensino?: TipoEnsino;

      @IsOptional()
      @IsEnum(Disciplina)
      disciplina?: Disciplina;

      @IsOptional()
      @IsNumber()
      bimestre?: number;
    }
    ```
  - [ ] 7.4: Atualizar controller para usar DTO:
    ```typescript
    @Get()
    @Roles(Role.COORDENADOR, Role.DIRETOR)
    async findAll(@Query() query: FindTurmasDto, @CurrentUser() user: AuthenticatedUser) {
      const escolaId = this.prisma.getEscolaIdOrThrow();
      return this.turmasService.findAll(escolaId, query);
    }
    ```
  - [ ] 7.5: Atualizar service para aplicar filtro:
    ```typescript
    async findAll(escolaId: string, filters: FindTurmasDto) {
      return this.prisma.turma.findMany({
        where: {
          escola_id: escolaId, // ✅ Multi-tenancy
          deleted_at: null,
          ...(filters.tipo_ensino && { tipo_ensino: filters.tipo_ensino }),
          ...(filters.disciplina && { disciplina: filters.disciplina }),
        },
        include: {
          professor: { select: { id: true, nome: true } },
          planejamentos: { where: { deleted_at: null } },
        },
      });
    }
    ```
  - [ ] 7.6: Testar endpoint: `GET /api/v1/turmas?tipo_ensino=MEDIO` retorna apenas turmas EM
  - [ ] 7.7: Verificar multi-tenancy: `escola_id` SEMPRE presente em WHERE clause (project-context.md Rule #1)

- [ ] **Task 8: Backend - Dashboard Diretor métricas separadas** (AC: #7)
  - [ ] 8.1: Abrir `ressoa-backend/src/modules/dashboards/dashboards.service.ts` (ou criar se não existe)
  - [ ] 8.2: Implementar método `getMetricasDiretor()` que retorna breakdown por tipo_ensino:
    ```typescript
    async getMetricasDiretor(escolaId: string) {
      const turmas = await this.prisma.turma.findMany({
        where: { escola_id: escolaId, deleted_at: null },
        include: { coberturaBimestral: true },
      });

      const turmasFundamental = turmas.filter(t => t.tipo_ensino === 'FUNDAMENTAL');
      const turmasEM = turmas.filter(t => t.tipo_ensino === 'MEDIO');

      return {
        coberturaFundamental: this.calcularCobertura(turmasFundamental),
        coberturaEM: this.calcularCobertura(turmasEM),
        totalTurmasFundamental: turmasFundamental.length,
        totalTurmasEM: turmasEM.length,
      };
    }
    ```
  - [ ] 8.3: Criar endpoint `GET /api/v1/dashboards/diretor` se não existe
  - [ ] 8.4: Aplicar RBAC guard: `@Roles(Role.DIRETOR)`
  - [ ] 8.5: Verificar multi-tenancy: `escola_id` da query vem de `this.prisma.getEscolaIdOrThrow()`

- [ ] **Task 9: Frontend - Criar hook useTurmas com filtros** (AC: #2)
  - [ ] 9.1: Criar ou atualizar `ressoa-frontend/src/hooks/useTurmas.ts`
  - [ ] 9.2: Implementar hook com React Query:
    ```tsx
    import { useQuery } from '@tanstack/react-query';
    import { api } from '@/lib/api';

    interface UseTurmasOptions {
      tipo_ensino?: 'FUNDAMENTAL' | 'MEDIO';
      disciplina?: string;
      bimestre?: number;
    }

    export function useTurmas(filters: UseTurmasOptions = {}) {
      return useQuery({
        queryKey: ['turmas', filters],
        queryFn: async () => {
          const params = new URLSearchParams();
          if (filters.tipo_ensino) params.set('tipo_ensino', filters.tipo_ensino);
          if (filters.disciplina) params.set('disciplina', filters.disciplina);
          if (filters.bimestre) params.set('bimestre', filters.bimestre.toString());

          const response = await api.get(`/api/v1/turmas?${params.toString()}`);
          return response.data;
        },
      });
    }
    ```
  - [ ] 9.3: Exportar hook para uso nos dashboards
  - [ ] 9.4: Adicionar staleTime para evitar refetch excessivo: `staleTime: 1000 * 60 * 5` (5 min)

- [ ] **Task 10: Frontend - Persistence de filtro entre abas** (AC: #8)
  - [ ] 10.1: Avaliar se persistence é necessária (UX: filtro reseta ao trocar de aba ou persiste?)
  - [ ] 10.2: Se persistir, usar React Context ou Zustand:
    ```tsx
    // store/dashboard-filters.ts
    import { create } from 'zustand';

    interface DashboardFiltersStore {
      tipoEnsino: 'TODOS' | 'FUNDAMENTAL' | 'MEDIO';
      setTipoEnsino: (tipo: 'TODOS' | 'FUNDAMENTAL' | 'MEDIO') => void;
    }

    export const useDashboardFilters = create<DashboardFiltersStore>((set) => ({
      tipoEnsino: 'TODOS',
      setTipoEnsino: (tipo) => set({ tipoEnsino: tipo }),
    }));
    ```
  - [ ] 10.3: Usar store nos dashboards:
    ```tsx
    const { tipoEnsino, setTipoEnsino } = useDashboardFilters();
    ```
  - [ ] 10.4: Testar navegação entre `/dashboard/coordenador/turmas` e `/dashboard/coordenador/professores` - filtro persiste

- [ ] **Task 11: Frontend - Loading states e empty states** (AC: #8)
  - [ ] 11.1: Adicionar skeleton loader durante fetch:
    ```tsx
    {isLoading && (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )}
    ```
  - [ ] 11.2: Adicionar empty state customizado por filtro:
    ```tsx
    {!isLoading && turmas.length === 0 && (
      <div className="text-center py-12">
        <IconSchoolOff className="size-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700">Nenhuma turma encontrada</h3>
        <p className="text-gray-500 mt-2">
          {tipoEnsinoFilter === 'MEDIO'
            ? 'Não há turmas de Ensino Médio cadastradas neste filtro.'
            : tipoEnsinoFilter === 'FUNDAMENTAL'
            ? 'Não há turmas de Ensino Fundamental cadastradas neste filtro.'
            : 'Não há turmas cadastradas.'}
        </p>
        <Button variant="link" onClick={() => setTipoEnsinoFilter('TODOS')} className="mt-4">
          Ver todas as turmas
        </Button>
      </div>
    )}
    ```

- [ ] **Task 12: Frontend - Testes unitários para filtros** (AC: #1-8)
  - [ ] 12.1: Criar testes para Select de tipo_ensino:
    ```tsx
    // DashboardCoordenadorTurmasPage.test.tsx
    it('deve renderizar filtro de tipo de ensino', () => {
      render(<DashboardCoordenadorTurmasPage />);
      expect(screen.getByText('Tipo de Ensino')).toBeInTheDocument();
      expect(screen.getByText('Todos')).toBeInTheDocument();
    });

    it('deve filtrar turmas ao selecionar Ensino Médio', async () => {
      const { user } = render(<DashboardCoordenadorTurmasPage />);

      const select = screen.getByLabelText('Tipo de Ensino');
      await user.selectOptions(select, 'MEDIO');

      await waitFor(() => {
        expect(mockUseTurmas).toHaveBeenCalledWith({ tipo_ensino: 'MEDIO' });
      });
    });
    ```
  - [ ] 12.2: Testar StatCard atualiza corretamente com filtro
  - [ ] 12.3: Testar empty state exibido quando filtro não retorna resultados
  - [ ] 12.4: Testar loading state durante refetch
  - [ ] 12.5: Executar testes: `npm test -- DashboardCoordenador`

- [ ] **Task 13: Backend - Testes unitários para filtro tipo_ensino** (AC: #2, #7)
  - [ ] 13.1: Criar testes para TurmasService.findAll() com filtro:
    ```typescript
    // turmas.service.spec.ts
    it('deve filtrar turmas por tipo_ensino=MEDIO', async () => {
      const turmas = await service.findAll(escolaId, { tipo_ensino: 'MEDIO' });

      expect(turmas.every(t => t.tipo_ensino === 'MEDIO')).toBe(true);
      expect(turmas.every(t => t.escola_id === escolaId)).toBe(true); // ✅ Multi-tenancy
    });

    it('deve retornar todas turmas quando tipo_ensino não especificado', async () => {
      const turmas = await service.findAll(escolaId, {});

      expect(turmas.length).toBeGreaterThan(0);
      expect(turmas.some(t => t.tipo_ensino === 'FUNDAMENTAL')).toBe(true);
      expect(turmas.some(t => t.tipo_ensino === 'MEDIO')).toBe(true);
    });
    ```
  - [ ] 13.2: Testar endpoint do dashboard diretor retorna métricas separadas
  - [ ] 13.3: Executar testes: `npm test -- turmas.service`

- [ ] **Task 14: E2E - Validação completa do fluxo de filtros** (AC: #1-8)
  - [ ] 14.1: Criar teste E2E `dashboards-filters-tipo-ensino.e2e-spec.ts`
  - [ ] 14.2: Teste: Login como COORDENADOR → navegar para `/dashboard/coordenador/turmas` → ver filtro tipo_ensino
  - [ ] 14.3: Teste: Selecionar "Ensino Médio" → verificar que apenas turmas EM são exibidas
  - [ ] 14.4: Teste: StatCard "Total de Turmas" exibe contagem correta
  - [ ] 14.5: Teste: Gráfico de cobertura reflete filtro (verificar data-testid no chart)
  - [ ] 14.6: Teste: Navegar para dashboard diretor → verificar breakdown EF/EM exibido
  - [ ] 14.7: Executar testes: `npm run test:e2e -- dashboards-filters`

- [ ] **Task 15: Manual testing e polimento visual** (AC: #1-8)
  - [ ] 15.1: Login como COORDENADOR → `/dashboard/coordenador/turmas`
  - [ ] 15.2: Verificar que filtro tipo_ensino renderiza corretamente (alinhamento, cores)
  - [ ] 15.3: Testar cada opção do filtro: TODOS, FUNDAMENTAL, MEDIO
  - [ ] 15.4: Verificar transições suaves (sem flickering)
  - [ ] 15.5: Testar responsividade: mobile (320px), tablet (768px), desktop (1440px)
  - [ ] 15.6: Login como DIRETOR → `/dashboard/diretor`
  - [ ] 15.7: Verificar breakdown EF/EM lado a lado, cores corretas, trends exibidos
  - [ ] 15.8: Verificar empty states se escola não tem turmas EM ou EF
  - [ ] 15.9: Verificar acessibilidade: navegação por teclado (Tab), screen reader (aria-labels)

---

## Dev Notes

### Epic 10 Context - Gestão de Turmas & Suporte a Ensino Médio

**Epic Goal:** Expandir o sistema para suportar Ensino Médio (1º-3º ano EM), permitindo que gestores filtrem dashboards por tipo de ensino e visualizem métricas separadas.

**Previous Stories:**
- **Story 10.1:** ✅ Backend - Expandiu modelo Turma com `tipo_ensino` (FUNDAMENTAL, MEDIO)
- **Story 10.2:** ✅ Backend - API CRUD de Turmas com RBAC (DIRETOR/COORDENADOR)
- **Story 10.3:** ✅ Backend - Seed de ~500 habilidades BNCC do Ensino Médio
- **Story 10.4:** ✅ Frontend - Tela de gestão de turmas (CRUD) com tipo_ensino
- **Story 10.5:** ✅ Frontend - Seletor de habilidades adaptado para EM (badge purple)
- **Story 10.6:** ✅ Backend - Prompts de IA ajustados para EM (Bloom, exercícios complexos)

**Current Story (10.7):** Frontend - Filtros de tipo_ensino em dashboards

**Next Stories:**
- **Story 10.8:** Backend - Query optimization para turmas multi-tipo
- **Story 10.9:** Testing E2E - CRUD de turmas e análise EM
- **Story 10.10:** Documentation - Guia de migração para escolas com EM

---

### Design System & UX Patterns (from Story 9.x)

**Cores do Design System:**
- **Deep Navy (#0A2647):** Títulos, text-deep-navy
- **Tech Blue (#2563EB):** Ações primárias, valores positivos
- **Cyan AI (#06B6D4):** IA-related features, badges EM
- **Focus Orange (#F97316):** CTAs, alertas, trends positivos
- **Ghost White (#F8FAFC):** Backgrounds, cards

**Typography:**
- **Headers:** `font-montserrat font-bold` (Story 9.5)
- **Body:** `font-inter`
- **Values (StatCards):** `font-montserrat font-bold text-2xl`

**Ícones (Story 9.7):**
- **Biblioteca:** @tabler/icons-react
- **Tamanhos:** `size-4` (16px small), `size-5` (20px inline), `size-6` (24px destaque)
- **Importação:** Individual para otimizar bundle: `import { IconSchool } from '@tabler/icons-react'`

**Componentes shadcn/ui:**
- **Select:** Usado para filtros (disciplina, bimestre, tipo_ensino)
- **StatCard:** Card de métricas com ícone, título, valor, trend
- **Skeleton:** Loading states
- **Badge:** Tags visuais (EM badge purple, EF badge blue)

**Acessibilidade (UX Design Spec):**
- **WCAG AAA:** Contraste 14.8:1 (Deep Navy #0A2647 on Ghost White #F8FAFC)
- **Touch targets:** Mínimo 44px (botões, selects)
- **ARIA labels:** Obrigatório para screen readers
- **Keyboard navigation:** Tab order lógico

---

### Frontend Architecture Patterns

**State Management:**
- **Local state:** useState para filtros simples (dentro de um componente)
- **Global state:** Zustand para persistence entre abas (se necessário)
- **Server state:** React Query (@tanstack/react-query) para dados do backend

**React Query Patterns:**
```tsx
// Hook com filtros dinâmicos
const { data, isLoading, error } = useQuery({
  queryKey: ['turmas', { tipo_ensino, disciplina, bimestre }], // ✅ Inclui filtros na key
  queryFn: () => api.get('/api/v1/turmas', { params: { tipo_ensino, disciplina, bimestre } }),
  staleTime: 1000 * 60 * 5, // ✅ 5min cache (dashboards não mudam com frequência)
});
```

**Loading States Best Practices:**
- Usar `isLoading` do React Query (não spinner global)
- Skeleton para listas/grids (UX melhor que spinner)
- Empty states customizados (não apenas "Nenhum resultado")

**API Client (axios):**
```tsx
// ressoa-frontend/src/lib/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

### Backend Architecture Patterns (Multi-Tenancy)

**⚠️ CRITICAL:** Multi-Tenancy Security (project-context.md)

**Rule #1: ALWAYS add `escola_id` to WHERE clauses**

```typescript
// ✅ CORRECT Pattern
const escolaId = this.prisma.getEscolaIdOrThrow(); // From TenantInterceptor context
const turmas = await this.prisma.turma.findMany({
  where: {
    escola_id: escolaId, // ✅ REQUIRED!
    deleted_at: null,
    tipo_ensino: filters.tipo_ensino,
  },
});

// ❌ FORBIDDEN Pattern
const turmas = await this.prisma.turma.findMany({
  where: {
    tipo_ensino: filters.tipo_ensino, // ❌ Missing escola_id = SECURITY VULNERABILITY!
  },
});
```

**RBAC Guards (Story 1.4):**
- **COORDENADOR:** Access to `/dashboard/coordenador/*` (all teachers' metrics)
- **DIRETOR:** Access to `/dashboard/diretor` (aggregated school metrics)

```typescript
@Get('turmas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COORDENADOR, Role.DIRETOR) // ✅ Only Coordenador/Diretor can access
async findAll(@Query() filters: FindTurmasDto) {
  const escolaId = this.prisma.getEscolaIdOrThrow(); // ✅ Multi-tenancy
  return this.turmasService.findAll(escolaId, filters);
}
```

**DTOs with class-validator:**
```typescript
// turmas/dto/find-turmas.dto.ts
import { IsOptional, IsEnum } from 'class-validator';
import { TipoEnsino, Disciplina } from '@prisma/client';

export class FindTurmasDto {
  @IsOptional()
  @IsEnum(TipoEnsino)
  tipo_ensino?: TipoEnsino; // 'FUNDAMENTAL' | 'MEDIO'

  @IsOptional()
  @IsEnum(Disciplina)
  disciplina?: Disciplina;

  @IsOptional()
  bimestre?: number;
}
```

---

### Dashboard Files Location (from git)

**Dashboards Frontend (Story 7.x, 9.x):**
```
ressoa-frontend/src/pages/dashboard/
├── DashboardCoordenadorTurmasPage.tsx          # AC#1: Adicionar filtro tipo_ensino
├── DashboardCoordenadorProfessoresPage.tsx     # AC#3: Filtro por tipo_ensino
├── DashboardCoordenadorTurmaDetalhesPage.tsx   # Detalhes de turma específica
├── DashboardCoordenadorProfessorTurmasPage.tsx # Turmas de um professor específico
└── DashboardDiretorPage.tsx                    # AC#7: Breakdown EF/EM lado a lado
```

**Componentes Compartilhados:**
```
ressoa-frontend/src/components/
├── ui/
│   ├── select.tsx          # shadcn/ui Select (para filtros)
│   ├── skeleton.tsx        # Loading states
│   └── badge.tsx           # Badge EM/EF
└── dashboard/
    ├── StatCard.tsx        # Card de métricas (usado em todos dashboards)
    ├── CoberturaChart.tsx  # Gráfico de cobertura ao longo do tempo
    └── TurmasTable.tsx     # Tabela de turmas com gaps
```

---

### Git Intelligence (Recent Commits)

**Last 5 commits:**
```
114c3fa feat(story-10.6): adapt AI prompts for Ensino Médio with competência-based analysis
65e1fe6 feat(story-10.5): adapt habilidades selector for Ensino Médio with series-based filtering
8e2d801 feat(story-10.4): implement Turmas CRUD frontend with validation and RBAC
a056e6d feat(story-10.3): implement BNCC Ensino Médio habilidades seeding with multi-provider support
ed66cda feat(story-10.2): implement Turmas CRUD API with complete validation and RBAC
```

**Learnings from Story 10.5 (Habilidades Selector):**
- ✅ Badge purple para EM estabelecido: `<Badge variant="purple">EM</Badge>`
- ✅ Filtros por tipo_ensino já implementados em Step2 do planejamento
- ✅ Card informativo explica que EM não divide por série (habilidades transversais)
- ✅ 20/20 testes frontend passando

**Learnings from Story 10.4 (Turmas CRUD Frontend):**
- ✅ Formulário de turma com Select tipo_ensino já implementado
- ✅ Validação: série deve corresponder ao tipo (6º-9º para EF, 1º-3º EM para EM)
- ✅ 13/15 testes passando (2 skipped por limitação JSDOM com Radix Select)

**Learnings from Story 9.5-9.6 (Polimento Visual):**
- ✅ Design system aplicado: text-deep-navy (não text-gray-900)
- ✅ StatCards padronizados: ícone circular, font-montserrat bold, hover elevation
- ✅ Empty states: ícone + mensagem acionável + CTA
- ✅ 132/132 testes passando (incluindo dashboards)

---

### Testing Strategy

**Frontend Unit Tests (Vitest + React Testing Library):**

1. ✅ **Renderização de Select tipo_ensino:**
   - Verificar que Select renderiza com 3 opções (TODOS, FUNDAMENTAL, MEDIO)
   - Verificar labels corretos

2. ✅ **Filtro atualiza query:**
   - Mock useTurmas hook
   - Simular seleção de filtro
   - Verificar que hook foi chamado com filtro correto

3. ✅ **StatCards atualizam com filtro:**
   - Renderizar com dados mock (mix EF + EM)
   - Selecionar filtro "MEDIO"
   - Verificar que StatCard "Total de Turmas" exibe apenas contagem EM

4. ✅ **Empty states:**
   - Renderizar com dados vazios
   - Verificar mensagem customizada por filtro

**Backend Unit Tests (Jest):**

1. ✅ **TurmasService.findAll() com filtro:**
   - Criar turmas EF e EM em banco de testes
   - Chamar findAll({ tipo_ensino: 'MEDIO' })
   - Verificar que retorna apenas turmas EM
   - Verificar multi-tenancy: todas turmas têm mesmo escola_id

2. ✅ **Dashboard Diretor métricas separadas:**
   - Mock dados de cobertura EF e EM
   - Chamar getMetricasDiretor()
   - Verificar que retorna coberturaFundamental e coberturaEM separados

**E2E Tests (Playwright ou Cypress):**

1. ✅ **Fluxo completo de filtros:**
   - Login como COORDENADOR
   - Navegar para `/dashboard/coordenador/turmas`
   - Verificar que filtro tipo_ensino está visível
   - Selecionar "Ensino Médio"
   - Verificar que apenas turmas EM são exibidas na tabela
   - Verificar que StatCard "Total de Turmas" exibe contagem correta
   - Navegar para `/dashboard/coordenador/professores`
   - Verificar que filtro persiste (ou reseta, conforme UX definida)

2. ✅ **Dashboard Diretor breakdown:**
   - Login como DIRETOR
   - Navegar para `/dashboard/diretor`
   - Verificar que grid 2 colunas renderiza
   - Verificar StatCard "Cobertura Fundamental" e "Cobertura Médio" lado a lado
   - Verificar valores corretos (pode usar dados seed conhecidos)

---

### Data Model Context (from Story 10.1)

**Turma Model (Expanded in Story 10.1):**

```prisma
model Turma {
  id           String      @id @default(uuid())
  nome         String      // Ex: "6º A - Manhã" ou "1º EM - Tarde"
  tipo_ensino  TipoEnsino  @default(FUNDAMENTAL) // ✅ FUNDAMENTAL ou MEDIO
  serie        Serie       // SEXTO_ANO, PRIMEIRO_ANO_EM, etc.
  disciplina   Disciplina  // MATEMATICA, LINGUA_PORTUGUESA, etc.
  ano_letivo   Int         // 2026
  turno        Turno?      // MATUTINO, VESPERTINO, NOTURNO
  qtd_alunos   Int?

  escola_id    String
  escola       Escola      @relation(fields: [escola_id], references: [id])

  professor_id String
  professor    Usuario     @relation(fields: [professor_id], references: [id])

  planejamentos Planejamento[]
  aulas         Aula[]

  created_at   DateTime    @default(now())
  updated_at   DateTime    @updatedAt
  deleted_at   DateTime?   // Soft delete (LGPD)

  @@index([escola_id, tipo_ensino, serie]) // ✅ Performance para filtros
  @@index([escola_id, professor_id])
}

enum TipoEnsino {
  FUNDAMENTAL
  MEDIO
}

enum Serie {
  // Ensino Fundamental (6º-9º)
  SEXTO_ANO
  SETIMO_ANO
  OITAVO_ANO
  NONO_ANO

  // Ensino Médio (1º-3º)
  PRIMEIRO_ANO_EM
  SEGUNDO_ANO_EM
  TERCEIRO_ANO_EM
}
```

**Performance Index (from Story 10.1):**
- `@@index([escola_id, tipo_ensino, serie])` - Otimiza queries com filtro tipo_ensino
- Query pattern: `WHERE escola_id = ? AND tipo_ensino = ? AND serie = ?`

---

### Browser Compatibility & Responsive

**Target Browsers (from UX Design Spec):**
- Chrome/Edge 100+
- Firefox 90+
- Safari 14+

**Breakpoints (Tailwind CSS):**
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

**Responsive Patterns:**
```tsx
// Grid adapta de 2 colunas (desktop) para 1 coluna (mobile)
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <StatCard title="Cobertura Fundamental" value="78%" />
  <StatCard title="Cobertura Médio" value="82%" />
</div>

// Select full-width em mobile
<Select className="w-full md:w-[200px]">
  {/* ... */}
</Select>
```

---

### Performance Considerations (NFR-PERF-04)

**Dashboard Loading Target:** <2s (from PRD)

**Optimization Strategies:**

1. **React Query caching:**
   - `staleTime: 5min` para dados de dashboard (não mudam frequentemente)
   - `cacheTime: 10min` para manter dados em cache

2. **Backend query optimization (Story 10.8):**
   - Índice composto: `(escola_id, tipo_ensino, serie)`
   - Materialized view `cobertura_bimestral` inclui `tipo_ensino` (para filtros rápidos)

3. **Frontend rendering:**
   - useMemo para cálculos de métricas (evitar re-cálculo a cada render)
   - Lazy loading de gráficos (react-lazy + Suspense)

4. **Network optimization:**
   - Axios interceptor para JWT (evitar adicionar token manualmente)
   - Parallel fetches: React Query executa queries independentes em paralelo

---

### Security Checklist (Multi-Tenancy)

**BEFORE marking story as done, verify:**

- [ ] ✅ ALL backend queries include `escola_id` in WHERE clause
- [ ] ✅ Protected endpoints use `this.prisma.getEscolaIdOrThrow()`
- [ ] ✅ DTOs validate input (class-validator)
- [ ] ✅ RBAC guards applied (@Roles decorator)
- [ ] ✅ E2E tests verify cross-tenant access is blocked
- [ ] ✅ No hardcoded escola_id (always from context or JWT)

---

### References

**Epic 10 Planning:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-10-Story-10.7]
  - Original acceptance criteria
  - User story: Coordenador/Diretor quer filtrar dashboards por tipo de ensino
  - Technical requirements: Select filters, query params, breakdown metrics

**UX Design Document:**
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md]
  - Design system: Cores (Deep Navy, Tech Blue, Cyan AI), Typography (Montserrat, Inter)
  - Experience principles: Transparência Radical, Contexto Adaptativo
  - Accessibility: WCAG AAA (14.8:1 contrast), touch 44px, ARIA labels

**Architecture Document:**
- [Source: _bmad-output/planning-artifacts/architecture.md]
  - AD-3.1: React 18 + Vite + TypeScript (frontend)
  - AD-3.2: Zustand (state management)
  - AD-3.3: React Query (server state)
  - AD-4.2: NestJS + TypeScript strict (backend)
  - AD-4.5: Prisma ORM + PostgreSQL (multi-tenancy via escola_id)

**Previous Stories:**
- [Source: _bmad-output/implementation-artifacts/10-1-backend-expandir-modelo-turma-tipo-ensino-series-em.md]
  - Turma model expanded with tipo_ensino enum
  - Serie enum includes PRIMEIRO_ANO_EM, SEGUNDO_ANO_EM, TERCEIRO_ANO_EM
  - Performance index created: (escola_id, tipo_ensino, serie)

- [Source: _bmad-output/implementation-artifacts/10-4-frontend-tela-gestao-turmas-crud.md]
  - Frontend CRUD de turmas implementado
  - Select tipo_ensino já existe no form de criação/edição
  - Validação: série deve corresponder ao tipo

- [Source: _bmad-output/implementation-artifacts/10-5-frontend-adaptar-seletor-habilidades-ensino-medio.md]
  - Badge purple estabelecido para EM
  - Filtros por tipo_ensino em planejamento
  - 20/20 testes passando

- [Source: _bmad-output/implementation-artifacts/9-5-polimento-visual-pages-do-professor.md]
  - Design system aplicado: text-deep-navy, font-montserrat
  - StatCards padronizados
  - 132/132 testes passando

- [Source: _bmad-output/implementation-artifacts/9-7-padronizacao-de-icones-substituir-emoticons-por-tabler-icons.md]
  - @tabler/icons-react instalado
  - Import individual: `import { IconSchool } from '@tabler/icons-react'`
  - Tamanhos: size-4 (small), size-5 (inline), size-6 (destaque)

**Project Context:**
- [Source: project-context.md]
  - Multi-tenancy security rules (CRITICAL)
  - RBAC roles: PROFESSOR, COORDENADOR, DIRETOR
  - Testing standards: E2E multi-tenancy validation required
  - Code organization: modules, guards, interceptors

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4.5 (2026-02-13)

### Debug Log References

### Completion Notes List

**Implementation Summary (2026-02-13):**

✅ **Backend Implementation Complete:**
1. Added `tipo_ensino` field to `FiltrosDashboardDto` with validation (FUNDAMENTAL | MEDIO)
2. Updated `DashboardService.getMetricasPorProfessor()` to JOIN with Turma table and filter by tipo_ensino
3. Updated `DashboardService.getTurmasPorProfessor()` to support tipo_ensino filtering
4. Updated `DashboardService.getMetricasPorTurma()` to support tipo_ensino filtering
5. **AC #7:** Added breakdown by tipo_ensino to `DashboardService.getMetricasEscola()`:
   - Separate query for breakdown by tipo_ensino
   - Returns `cobertura_fundamental`, `cobertura_medio`, `total_turmas_fundamental`, `total_turmas_medio`
   - Added to KPIs object for easy frontend consumption

✅ **Frontend Implementation Complete:**
1. **AC #1-2:** `DashboardCoordenadorTurmasPage.tsx`:
   - Added tipo_ensino to FiltrosCobertura interface
   - Added Select component for tipo_ensino filter (TODOS, FUNDAMENTAL, MEDIO)
   - Filter persists in state and is sent to backend API
   - Responsive design (flex-wrap for mobile)
   - Updated handleLimparFiltros to clear tipo_ensino

2. **AC #3:** `DashboardCoordenadorProfessoresPage.tsx`:
   - Added tipo_ensino filter Select
   - Added helper text showing which habilidades are being used for coverage (EM or EF)
   - Responsive layout

3. **AC #7:** `DashboardDiretorPage.tsx`:
   - Added new "Cobertura por Tipo de Ensino" section
   - Side-by-side StatCards for Fundamental and Médio
   - Shows coverage % and total turmas count for each type
   - Color-coded based on thresholds (green ≥70%, orange 50-70%, red <50%)
   - Uses BookOpen icon for EF, GraduationCap icon for EM

4. **Component Update:** `StatCard.tsx`:
   - Added optional `subtitle` prop for displaying additional context
   - Used in Diretor dashboard to show turma counts

**Technical Decisions:**
- Used JOIN with Turma table for filtering (materialized view doesn't include tipo_ensino yet)
- This approach is efficient as it leverages existing indexes on turma_id
- Filter defaults to `undefined` (shows all tipos) for better UX
- Empty state and loading states handled correctly

### File List

**Modified Files:**
1. `ressoa-backend/src/modules/dashboard/dto/filtros-dashboard.dto.ts` - Added tipo_ensino field
2. `ressoa-backend/src/modules/dashboard/dashboard.service.ts` - Added tipo_ensino filtering logic + breakdown
3. `ressoa-frontend/src/pages/dashboard/DashboardCoordenadorTurmasPage.tsx` - Added tipo_ensino filter
4. `ressoa-frontend/src/pages/dashboard/DashboardCoordenadorProfessoresPage.tsx` - Added tipo_ensino filter + helper text
5. `ressoa-frontend/src/pages/dashboard/DashboardDiretorPage.tsx` - Added breakdown section
6. `ressoa-frontend/src/pages/dashboard/components/StatCard.tsx` - Added subtitle prop
7. `_bmad-output/implementation-artifacts/sprint-status.yaml` - Status: in-progress
