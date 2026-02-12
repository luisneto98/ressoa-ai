# Story 9.1: Layout Shell — Sidebar + Header + Breadcrumbs

Status: done

## Story

As a **usuário autenticado (qualquer role)**,
I want **uma interface com sidebar de navegação e header persistentes**,
So that **posso acessar qualquer funcionalidade sem precisar memorizar URLs ou usar o botão voltar do navegador**.

## Acceptance Criteria

1. **Given** o usuário está autenticado **When** acessa qualquer rota protegida **Then** vê layout com 3 áreas: sidebar (esquerda), header (topo), conteúdo (centro-direita)

2. **Given** o layout renderiza em viewport >= 1024px **When** a sidebar está visível **Then**:
   - Background Deep Navy (#0A2647)
   - Logo "Ressoa AI" no topo com ícone gradiente (Tech Blue → Cyan AI)
   - Items de navegação com ícones Lucide + labels
   - Item ativo destacado com bg Tech Blue (#2563EB) + sombra
   - Largura: 240px expanded, 68px collapsed
   - Botão "Recolher/Expandir" no rodapé

3. **Given** qualquer página protegida carrega **When** o header renderiza **Then** exibe breadcrumbs auto-gerados + avatar/nome do usuário + dropdown com logout

4. **Given** App.tsx define as rotas **When** rotas protegidas são renderizadas **Then** todas usam `<AppLayout>` como wrapper via nested routes com `<Outlet />`

## Tasks / Subtasks

- [x] Task 1: Criar `AppLayout` component com sidebar + header + `<Outlet />` (AC: #1, #4)
  - [x] 1.1: Criar `src/components/layout/AppLayout.tsx` — flexbox horizontal: sidebar (fixed width) + vertical (header + main content com `<Outlet />`)
  - [x] 1.2: Criar `src/components/layout/index.ts` — barrel export
- [x] Task 2: Criar Sidebar component (AC: #2)
  - [x] 2.1: Criar `src/components/layout/Sidebar.tsx` — Deep Navy bg, logo no topo, nav items, botão collapse no rodapé
  - [x] 2.2: Criar `src/components/layout/SidebarNavItem.tsx` — ícone Lucide + label, active state com Tech Blue bg
  - [x] 2.3: Criar `src/components/layout/navigation-config.ts` — config de navegação por role com ícones, labels, paths
- [x] Task 3: Criar Header component com breadcrumbs + user dropdown (AC: #3)
  - [x] 3.1: Criar `src/components/layout/Header.tsx` — breadcrumbs à esquerda, user info + dropdown à direita
  - [x] 3.2: Criar `src/components/layout/Breadcrumbs.tsx` — auto-gerado a partir da rota atual usando `useLocation()` + route config
  - [x] 3.3: Criar `src/components/layout/UserMenu.tsx` — avatar + nome + dropdown com logout usando shadcn/ui `DropdownMenu` + `Avatar`
- [x] Task 4: Criar Zustand UI store para sidebar state (AC: #2)
  - [x] 4.1: Criar `src/stores/ui.store.ts` — `isCollapsed` boolean, `toggle()`, persist em localStorage
- [x] Task 5: Refatorar App.tsx para usar nested routes com `<AppLayout>` (AC: #4)
  - [x] 5.1: Converter rotas flat em nested structure: `<Route element={<AppLayout />}>` wrapa todas as rotas protegidas, cada rota filha usa `<Outlet />`
  - [x] 5.2: Manter `/login` fora do `<AppLayout>` (rota pública sem sidebar)
  - [x] 5.3: Manter `<ProtectedRoute>` como wrapper de cada rota filha para RBAC
- [x] Task 6: Testes unitários (AC: #1-#4)
  - [x] 6.1: Testar que `AppLayout` renderiza sidebar, header e outlet
  - [x] 6.2: Testar navigation config retorna items corretos por role
  - [x] 6.3: Testar breadcrumbs gera caminho correto a partir de rota
  - [x] 6.4: Testar sidebar collapse persiste em localStorage via ui.store
  - [x] 6.5: Testar UserMenu mostra nome do usuário e executa logout

## Dev Notes

### Arquitetura do AppLayout

O layout usa React Router v7 nested routes com `<Outlet />`:

```
<BrowserRouter>
  <Routes>
    <Route path="/login" element={<LoginPage />} />         {/* SEM layout */}
    <Route element={<AppLayout />}>                          {/* LAYOUT WRAPPER */}
      <Route path="/minhas-aulas" element={<ProtectedRoute><AulasListPage /></ProtectedRoute>} />
      <Route path="/aulas/upload" element={<ProtectedRoute><UploadAulaPage /></ProtectedRoute>} />
      {/* ... todas as rotas protegidas ... */}
    </Route>
  </Routes>
</BrowserRouter>
```

**AppLayout.tsx** — estrutura visual:
```
┌──────────────────────────────────────────┐
│  Sidebar (fixed)  │  Header (sticky top) │
│  240px / 68px     │  Breadcrumbs | User  │
│                   │──────────────────────│
│  [Logo]           │                      │
│  [Nav Items]      │  <Outlet /> (content)│
│  [...]            │                      │
│  [Collapse btn]   │                      │
└──────────────────────────────────────────┘
```

### Navegação por Role — Config Centralizada

Criar `navigation-config.ts` com estrutura type-safe:

```typescript
import { Home, Upload, BookOpen, BarChart3, Users, Building2, Shield, Settings, type LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

const NAVIGATION: Record<string, NavItem[]> = {
  PROFESSOR: [
    { label: 'Minhas Aulas', path: '/minhas-aulas', icon: Home },
    { label: 'Upload', path: '/aulas/upload', icon: Upload },
    { label: 'Planejamentos', path: '/planejamentos', icon: BookOpen },
    { label: 'Minha Cobertura', path: '/dashboard/cobertura-pessoal', icon: BarChart3 },
  ],
  COORDENADOR: [
    { label: 'Professores', path: '/dashboard/coordenador/professores', icon: Users },
    { label: 'Turmas', path: '/dashboard/coordenador/turmas', icon: Building2 },
  ],
  DIRETOR: [
    { label: 'Visão Geral', path: '/dashboard/diretor', icon: Building2 },
    { label: 'Professores', path: '/dashboard/coordenador/professores', icon: Users },
    { label: 'Turmas', path: '/dashboard/coordenador/turmas', icon: BarChart3 },
  ],
  ADMIN: [
    { label: 'Monitoramento STT', path: '/admin/monitoramento/stt', icon: Settings },
    { label: 'Monitoramento Análise', path: '/admin/monitoramento/analise', icon: BarChart3 },
    { label: 'Custos', path: '/admin/custos/escolas', icon: Building2 },
    { label: 'Qualidade Prompts', path: '/admin/prompts/qualidade', icon: Shield },
  ],
};

export function getNavigationForRole(role: string): NavItem[] {
  return NAVIGATION[role] ?? [];
}
```

### Breadcrumbs — Auto-Geração por Rota

Criar mapeamento de paths para labels legíveis:

```typescript
const ROUTE_LABELS: Record<string, string> = {
  'minhas-aulas': 'Minhas Aulas',
  'aulas': 'Aulas',
  'upload': 'Upload',
  'analise': 'Análise',
  'edit': 'Editar',
  'planejamentos': 'Planejamentos',
  'novo': 'Novo',
  'editar': 'Editar',
  'dashboard': 'Dashboard',
  'cobertura-pessoal': 'Minha Cobertura',
  'coordenador': 'Coordenador',
  'professores': 'Professores',
  'turmas': 'Turmas',
  'detalhes': 'Detalhes',
  'diretor': 'Diretor',
  'admin': 'Admin',
  'monitoramento': 'Monitoramento',
  'stt': 'STT',
  'custos': 'Custos',
  'escolas': 'Escolas',
  'prompts': 'Prompts',
  'qualidade': 'Qualidade',
};
```

Usar `useLocation()` para parsear `pathname`, ignorar segmentos dinâmicos (UUIDs), e gerar array de `{ label, path }`. Usar shadcn/ui `Breadcrumb` component (já existe como `breadcrumb` — precisa instalar: `npx shadcn@latest add breadcrumb`).

### UI Store (Zustand)

```typescript
// src/stores/ui.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: 'ui-storage' }
  )
);
```

### Sidebar — Estilo Visual

- **Background:** `bg-deep-navy` (#0A2647) — usar classe Tailwind customizada já definida em `index.css`
- **Texto:** `text-white` para labels, `text-white/60` para ícones inativos
- **Item Ativo:** `bg-tech-blue` (#2563EB) com `shadow-md` — detectar via `useLocation().pathname` com `startsWith()`
- **Item Hover:** `hover:bg-white/10` (sutil)
- **Largura:** `w-60` (240px) expanded, `w-[68px]` collapsed — transição com `transition-all duration-300`
- **Logo:** "Ressoa AI" com gradiente no ícone (Tech Blue → Cyan AI): `bg-gradient-to-r from-tech-blue to-cyan-ai`
- **Collapse button:** `ChevronsLeft` / `ChevronsRight` icon de Lucide no rodapé

### Header — Estilo Visual

- **Background:** `bg-white` com `border-b border-border`
- **Altura:** `h-16` (64px)
- **Layout:** `flex items-center justify-between px-6`
- **Esquerda:** Breadcrumbs (shadcn/ui `Breadcrumb`)
- **Direita:** Avatar (shadcn/ui `Avatar` — iniciais do nome) + nome + `DropdownMenu` com "Sair"
- **Sticky:** `sticky top-0 z-10`

### Project Structure Notes

Novos arquivos a criar:
```
src/
├── components/
│   └── layout/
│       ├── index.ts               # Barrel exports
│       ├── AppLayout.tsx           # Layout wrapper com Outlet
│       ├── Sidebar.tsx             # Sidebar component
│       ├── SidebarNavItem.tsx      # Individual nav item
│       ├── Header.tsx              # Header com breadcrumbs + user menu
│       ├── Breadcrumbs.tsx         # Auto-generated breadcrumbs
│       ├── UserMenu.tsx            # Avatar + dropdown
│       └── navigation-config.ts   # Nav items por role
├── stores/
│   └── ui.store.ts                # Sidebar collapsed state
```

Arquivos a modificar:
```
src/App.tsx                        # Refatorar para nested routes com <AppLayout>
```

### Componentes shadcn/ui Necessários

**Já instalados:** `avatar`, `dropdown-menu`, `separator`, `sheet`, `collapsible`, `tooltip`

**Precisa instalar:** `breadcrumb`
```bash
cd ressoa-frontend && npx shadcn@latest add breadcrumb
```

### Padrões de Código Existentes a Seguir

1. **Imports:** Usar `@/` path alias (ex: `import { Button } from '@/components/ui/button'`)
2. **Exports:** Named exports para componentes (ex: `export function AppLayout()`)
3. **Styling:** Tailwind utility classes, usar design tokens customizados (`text-deep-navy`, `bg-tech-blue`, etc.)
4. **State:** Zustand com `persist` middleware para estado que sobrevive refresh
5. **Routing:** React Router v7 (`react-router-dom` v7.13) — usar `useLocation`, `useNavigate`, `Outlet`
6. **Auth:** Acessar user via `useAuthStore()` — propriedades: `user.nome`, `user.role`, `user.email`
7. **Icons:** `lucide-react` v0.563 — import individual icons

### Anti-Patterns a Evitar

- **NÃO** criar layout duplicado — usar APENAS `<AppLayout>` com `<Outlet />`
- **NÃO** usar CSS modules ou styled-components — APENAS Tailwind utility classes
- **NÃO** hardcodar items de navegação no JSX — usar `navigation-config.ts`
- **NÃO** usar `useEffect` para breadcrumbs — derivar do `pathname` diretamente no render
- **NÃO** criar store separado para cada pedaço de UI state — usar `ui.store.ts` único
- **NÃO** usar `position: fixed` para sidebar — usar flexbox layout (sidebar + main são filhos flex)
- **NÃO** remover `<ProtectedRoute>` das rotas — manter RBAC guard em cada rota filha
- **NÃO** mover `<Toaster>` para dentro do layout — manter no App.tsx (precisa funcionar no login também)

### Acessibilidade (WCAG AAA)

- Sidebar navigation deve usar `<nav>` + `<ul>` + `<li>` semânticos
- Links ativos: `aria-current="page"`
- Botão collapse: `aria-label="Recolher menu"` / `"Expandir menu"`
- Breadcrumbs: usar `<nav aria-label="Breadcrumb">` (shadcn/ui Breadcrumb já faz isso)
- UserMenu: `aria-label="Menu do usuário"`
- Sidebar: `role="navigation"` + `aria-label="Navegação principal"`
- Todos os items clicáveis: mínimo 44x44px touch target
- Contraste: Deep Navy em Ghost White = 14.8:1 (AAA)

### Cores do Design System (referência rápida)

| Token | Hex | Uso |
|-------|-----|-----|
| `deep-navy` | #0A2647 | Sidebar bg, headers |
| `tech-blue` | #2563EB | Links, active states, ícones |
| `cyan-ai` | #06B6D4 | Gradientes, detalhes AI |
| `focus-orange` | #F97316 | CTAs (Story 9.4 — NÃO implementar aqui) |
| `ghost-white` | #F8FAFC | Background do conteúdo |

### Dependências entre Stories

- **Story 9.1** (esta) → base obrigatória para todas as demais
- **Story 9.2** → Responsividade mobile/tablet (Sheet drawer, collapse automático)
- **Story 9.3** → Fix de rotas quebradas e redirects por role
- **Story 9.4** → CTA "Nova Aula" com Focus Orange na sidebar
- **Story 9.5** → Polimento visual das pages do professor
- **Story 9.6** → Polimento visual dos dashboards

**IMPORTANTE:** Esta story foca APENAS em desktop (>= 1024px). A responsividade mobile/tablet é Story 9.2. Não adicionar lógica de mobile drawer ou breakpoint < 1024px aqui.

### Git Intelligence

Últimos commits relevantes (Epic 8 — dashboards admin):
- Padrão de commit: `feat(story-X.Y): description`
- Builds passando: frontend + backend
- 28 componentes shadcn/ui já instalados
- Nenhuma mudança de layout foi feita até agora — todas as pages são standalone

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-9, Story 9.1, lines 9469-9498]
- [Source: _bmad-output/planning-artifacts/architecture.md#AD-3.1 State Management (Zustand)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Structure]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System, Tailwind Config]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navegação Contextual, Breadcrumbs]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color Palette 60-30-10 Rule]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Typography Hierarchy]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility WCAG AAA]
- [Source: project-context.md#Authentication & Authorization]
- [Source: ressoa-frontend/src/App.tsx — current flat routing structure]
- [Source: ressoa-frontend/src/stores/auth.store.ts — Zustand persist pattern]
- [Source: ressoa-frontend/src/index.css — design tokens already configured]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

None - implementation was straightforward without issues.

### Completion Notes List

✅ **Task 1 completed**: Created `AppLayout` component with sidebar + header + `<Outlet />` using flexbox layout. All routes now wrapped with consistent navigation shell.

✅ **Task 2 completed**: Created `Sidebar` component with Deep Navy background, logo with gradient, navigation items, active state highlighting, and collapse/expand functionality.

✅ **Task 3 completed**: Created `Header` component with auto-generated breadcrumbs and user menu with avatar and logout dropdown.

✅ **Task 4 completed**: Created Zustand UI store with localStorage persistence for sidebar collapsed state.

✅ **Task 5 completed**: Refactored `App.tsx` to use React Router nested routes. All protected routes now wrapped with `<AppLayout />`, login route remains outside layout.

✅ **Task 6 completed**: Created comprehensive unit tests for all components (33 tests total, all passing):
- `navigation-config.test.ts`: 6 tests for role-based navigation
- `ui.store.test.ts`: 5 tests for sidebar state and localStorage persistence
- `AppLayout.test.tsx`: 4 tests for layout structure and rendering
- `Breadcrumbs.test.tsx`: 10 tests for breadcrumb generation and routing
- `UserMenu.test.tsx`: 8 tests for user menu, logout, and accessibility

**Additional improvements made**:
- Configured Vitest test framework for frontend (was missing)
- Fixed TypeScript error in `MonitoramentoSTTPage.tsx` (recharts Pie label type)
- Added test scripts to `package.json`: `test`, `test:ui`, `test:run`
- Created test setup with `@testing-library/react` and `jsdom`

**All Acceptance Criteria satisfied**:
- AC #1: Layout renders with sidebar (left), header (top), content (center-right) ✅
- AC #2: Sidebar has Deep Navy bg, logo, nav items, active state, collapse functionality ✅
- AC #3: Header displays breadcrumbs + user dropdown with logout ✅
- AC #4: App.tsx uses nested routes with `<AppLayout>` wrapper ✅

### File List

**Created:**
- ressoa-frontend/src/components/layout/AppLayout.tsx
- ressoa-frontend/src/components/layout/Sidebar.tsx
- ressoa-frontend/src/components/layout/SidebarNavItem.tsx
- ressoa-frontend/src/components/layout/Header.tsx
- ressoa-frontend/src/components/layout/Breadcrumbs.tsx
- ressoa-frontend/src/components/layout/UserMenu.tsx
- ressoa-frontend/src/components/layout/navigation-config.ts
- ressoa-frontend/src/components/layout/index.ts
- ressoa-frontend/src/components/ui/breadcrumb.tsx
- ressoa-frontend/src/stores/ui.store.ts
- ressoa-frontend/vitest.config.ts
- ressoa-frontend/src/test/setup.ts
- ressoa-frontend/src/components/layout/AppLayout.test.tsx
- ressoa-frontend/src/components/layout/Breadcrumbs.test.tsx
- ressoa-frontend/src/components/layout/UserMenu.test.tsx
- ressoa-frontend/src/components/layout/navigation-config.test.ts
- ressoa-frontend/src/stores/ui.store.test.ts

**Modified:**
- ressoa-frontend/src/App.tsx (nested routes structure already implemented)
- ressoa-frontend/package.json (added test scripts and dependencies + @radix-ui/react-slot)
- ressoa-frontend/src/pages/admin/MonitoramentoSTTPage.tsx (fixed TypeScript error)
- ressoa-frontend/src/components/ui/breadcrumb.tsx (fixed Slot import - code review)
- ressoa-frontend/src/components/layout/Sidebar.tsx (added warning for unknown roles - code review)
- ressoa-frontend/src/components/layout/Breadcrumbs.tsx (explicit root path handling - code review)

## Change Log

**2026-02-12**: Story 9.1 implementation completed
- Created complete layout shell with sidebar, header, and breadcrumbs
- Implemented Zustand UI store for sidebar state persistence
- Configured Vitest test framework for frontend
- All 33 unit tests passing
- All acceptance criteria satisfied
- Ready for code review

**2026-02-12 18:59**: Code review completed - 4 issues fixed automatically
- Fixed breadcrumb component Slot import (`Slot.Root` → `Slot`)
- Added missing dependency `@radix-ui/react-slot` to package.json (v1.2.4)
- Added warning log for unknown user roles in Sidebar component
- Added explicit root path handling in Breadcrumbs component
- All tests passing (33/33 ✅)
- Status updated to DONE
