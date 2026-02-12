# Story 9.2: Sidebar Responsiva — Mobile Drawer + Tablet Collapse

Status: review

## Story

As a **usuário em dispositivo móvel ou tablet**,
I want **acessar a navegação através de um menu hambúrguer**,
So that **posso navegar pela aplicação em qualquer tamanho de tela**.

## Acceptance Criteria

1. **Given** viewport < 768px **When** página carrega **Then** sidebar fica oculta, header mostra botão hambúrguer, clique abre sidebar como Sheet drawer

2. **Given** drawer aberto no mobile **When** clica em item de navegação **Then** drawer fecha automaticamente e navega para a rota

3. **Given** viewport entre 768px e 1024px **When** página carrega **Then** sidebar inicia colapsada (apenas ícones, 68px)

4. **Given** qualquer viewport **When** items de navegação renderizam **Then** todos têm área de toque mínima de 44x44px

## Tasks / Subtasks

- [x] Task 1: Implementar lógica de breakpoints responsivos no AppLayout (AC: #1, #3)
  - [x] 1.1: Criar hook `useMediaQuery` em `src/hooks/useMediaQuery.ts` para detectar breakpoints (mobile: <768px, tablet: 768-1024px, desktop: >=1024px)
  - [x] 1.2: Atualizar `AppLayout.tsx` para detectar viewport e renderizar sidebar mobile (Sheet drawer) ou sidebar desktop (fixo)
  - [x] 1.3: Adicionar estado `mobileMenuOpen` no UI store para controlar abertura do drawer mobile

- [x] Task 2: Criar MobileSidebar component com Sheet drawer (AC: #1, #2)
  - [x] 2.1: Criar `src/components/layout/MobileSidebar.tsx` usando shadcn/ui `Sheet` component
  - [x] 2.2: Implementar botão hambúrguer no Header para abrir drawer (ícone `Menu` do Lucide)
  - [x] 2.3: Configurar Sheet para fechar automaticamente ao clicar em item de navegação (callback no `SidebarNavItem`)
  - [x] 2.4: Aplicar mesmos estilos da sidebar desktop (Deep Navy, logo, nav items)

- [x] Task 3: Implementar auto-collapse da sidebar em viewports tablet (AC: #3)
  - [x] 3.1: Atualizar UI store com lógica: se viewport 768-1024px E sidebar não foi manualmente expandida pelo usuário → forçar collapsed
  - [x] 3.2: Persistir preferência do usuário (se expandiu manualmente em tablet, manter expandida)
  - [x] 3.3: Implementar useEffect em Sidebar.tsx que monitora breakpoints e auto-collapsa quando apropriado

- [x] Task 4: Garantir touch targets mínimos de 44x44px (AC: #4, NFR-ACCESS-01)
  - [x] 4.1: Revisar `SidebarNavItem.tsx` e garantir `min-h-[44px]` em todos os states (collapsed/expanded)
  - [x] 4.2: Revisar botão collapse e botão hambúrguer para `min-h-[44px]` e `min-w-[44px]`
  - [x] 4.3: Adicionar padding adequado em touch devices: `py-2.5 px-3` para items, `p-2.5` para ícones

- [x] Task 5: Testes responsivos e acessibilidade (AC: #1-#4)
  - [x] 5.1: Testar que Sheet drawer renderiza em viewport <768px e sidebar desktop oculta
  - [x] 5.2: Testar que drawer fecha automaticamente após navegação
  - [x] 5.3: Testar que sidebar inicia colapsada em viewport 768-1024px
  - [x] 5.4: Testar que todos os touch targets têm mínimo 44x44px
  - [x] 5.5: Testar que preferência de collapse persiste após resize de viewport
  - [x] 5.6: Testar acessibilidade: `aria-label` no botão hambúrguer, Sheet tem `role="dialog"` (shadcn/ui já faz isso)

## Dev Notes

### Arquitetura Responsiva — 3 Breakpoints

**Mobile (<768px):**
- Sidebar desktop OCULTA (display: none)
- Header mostra botão hambúrguer (canto superior esquerdo, antes dos breadcrumbs)
- Sheet drawer renderiza sidebar ao clicar hambúrguer
- Drawer overlay escurece conteúdo (shadcn/ui Sheet já faz isso)
- Auto-fecha ao clicar em item de navegação ou fora do drawer

**Tablet (768px - 1024px):**
- Sidebar desktop VISÍVEL mas COLAPSADA (68px, apenas ícones)
- Usuário pode expandir manualmente (botão collapse no rodapé)
- Preferência manual persiste em localStorage (se expandiu, mantém expandida)
- Se NÃO expandiu manualmente, permanece colapsada automaticamente

**Desktop (>=1024px):**
- Sidebar desktop VISÍVEL
- Estado inicial: expandida (240px) — a menos que usuário tenha colapsado manualmente
- Preferência persiste em localStorage (se colapsou, mantém colapsada)

### Hook `useMediaQuery`

Criar hook reutilizável para detectar breakpoints com SSR-safe defaults:

```typescript
// src/hooks/useMediaQuery.ts
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  // SSR-safe: assume false até hydration
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Listen for changes
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// Export breakpoint hooks for convenience
export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)');
}

export function useIsTablet() {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)');
}
```

**Rationale:**
- `window.matchMedia()` é nativo, performático, e reage a resize
- SSR-safe: assume `false` no servidor, atualiza no cliente após hydration
- Breakpoints consistentes com Tailwind: `sm: 640px`, `md: 768px`, `lg: 1024px`
- Usamos `md` (768px) como divisor mobile/tablet, `lg` (1024px) como divisor tablet/desktop

### UI Store — Estado Mobile Menu

Adicionar novo estado ao `ui.store.ts`:

```typescript
// src/stores/ui.store.ts
interface UIState {
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean; // NOVO
  toggleSidebar: () => void;
  setMobileMenuOpen: (open: boolean) => void; // NOVO
  closeMobileMenu: () => void; // NOVO
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileMenuOpen: false, // NÃO persistir (sempre começa fechado)
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileMenuOpen: (open: boolean) => set({ mobileMenuOpen: open }),
      closeMobileMenu: () => set({ mobileMenuOpen: false }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }), // APENAS persist collapsed, NÃO mobileMenuOpen
    }
  )
);
```

**Rationale:**
- `mobileMenuOpen` NÃO persiste (sempre começa fechado ao carregar página)
- `sidebarCollapsed` persiste (preferência do usuário em desktop/tablet)
- `closeMobileMenu()` helper evita duplicação de código

### AppLayout — Renderização Condicional

Atualizar `AppLayout.tsx` para renderizar sidebar mobile ou desktop baseado em breakpoint:

```typescript
// src/components/layout/AppLayout.tsx
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';
import { Header } from './Header';
import { useIsMobile } from '@/hooks/useMediaQuery';

export function AppLayout() {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile: Sheet drawer (hidden até abrir) */}
      {isMobile ? (
        <MobileSidebar />
      ) : (
        /* Tablet/Desktop: Sidebar fixo */
        <Sidebar />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header showMenuButton={isMobile} />
        <main className="flex-1 overflow-y-auto bg-ghost-white p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

**Rationale:**
- Renderização condicional evita renderizar sidebar desktop oculta no mobile (performance)
- `Header` recebe prop `showMenuButton` para renderizar hambúrguer apenas no mobile
- Sidebar desktop gerencia auto-collapse em tablet internamente (via hook)

### MobileSidebar — Sheet Drawer

Criar novo componente usando shadcn/ui Sheet:

```typescript
// src/components/layout/MobileSidebar.tsx
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { getNavigationForRole } from './navigation-config';
import { SidebarNavItem } from './SidebarNavItem';
import { AudioWaveform } from 'lucide-react';

export function MobileSidebar() {
  const user = useAuthStore((s) => s.user);
  const mobileMenuOpen = useUIStore((s) => s.mobileMenuOpen);
  const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen);
  const closeMobileMenu = useUIStore((s) => s.closeMobileMenu);

  const navItems = getNavigationForRole(user?.role ?? '');

  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetContent
        side="left"
        className="w-60 bg-deep-navy p-0 border-none"
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-4 border-b border-white/10">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-tech-blue to-cyan-ai">
            <AudioWaveform className="size-5 text-white" />
          </div>
          <span className="text-lg font-montserrat font-bold text-white truncate">
            Ressoa AI
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <SidebarNavItem
                key={item.path}
                item={item}
                collapsed={false}
                onNavigate={closeMobileMenu} // FECHA drawer ao navegar
              />
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

**Rationale:**
- Sheet renderiza overlay + drawer deslizante da esquerda (padrão mobile comum)
- `side="left"` alinha com sidebar desktop (consistência visual)
- `onNavigate` callback fecha drawer automaticamente após clicar em item
- Mesmos estilos da sidebar desktop (Deep Navy, logo, nav items) — consistência
- NUNCA mostra botão collapse no drawer mobile (não faz sentido, drawer já fecha)

### SidebarNavItem — Callback de Navegação

Atualizar `SidebarNavItem.tsx` para aceitar callback opcional `onNavigate`:

```typescript
// src/components/layout/SidebarNavItem.tsx
interface SidebarNavItemProps {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void; // NOVO — callback ao navegar
}

export function SidebarNavItem({ item, collapsed, onNavigate }: SidebarNavItemProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname.startsWith(item.path);

  const handleClick = () => {
    navigate(item.path);
    onNavigate?.(); // Chama callback se fornecido (fecha drawer mobile)
  };

  return (
    <li>
      <button
        onClick={handleClick}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors min-h-[44px]',
          isActive
            ? 'bg-tech-blue text-white shadow-md'
            : 'text-white/60 hover:bg-white/10 hover:text-white'
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        <item.icon className="size-5 shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </button>
    </li>
  );
}
```

**Rationale:**
- Callback opcional `onNavigate` permite fechar drawer mobile após clicar
- Desktop sidebar NÃO passa callback (não precisa fechar nada)
- Mobile sidebar passa `closeMobileMenu` como callback
- `min-h-[44px]` garante touch target mínimo (já estava implementado)

### Header — Botão Hambúrguer

Atualizar `Header.tsx` para mostrar botão hambúrguer no mobile:

```typescript
// src/components/layout/Header.tsx
import { Menu } from 'lucide-react';
import { useUIStore } from '@/stores/ui.store';
import { Breadcrumbs } from './Breadcrumbs';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  showMenuButton?: boolean; // NOVO
}

export function Header({ showMenuButton = false }: HeaderProps) {
  const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-white px-6">
      <div className="flex items-center gap-4">
        {/* Botão hambúrguer — apenas mobile */}
        {showMenuButton && (
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menu de navegação"
            className="flex size-10 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px]"
          >
            <Menu className="size-5 text-deep-navy" />
          </button>
        )}
        <Breadcrumbs />
      </div>
      <UserMenu />
    </header>
  );
}
```

**Rationale:**
- Botão hambúrguer APENAS renderiza se `showMenuButton={true}` (mobile)
- Ícone `Menu` do Lucide (3 linhas horizontais — padrão universal)
- `min-h-[44px]` e `min-w-[44px]` garantem touch target mínimo
- `aria-label` para acessibilidade (screen readers)
- Posicionado antes dos breadcrumbs (canto superior esquerdo — convenção mobile)

### Sidebar — Auto-Collapse em Tablet

Atualizar `Sidebar.tsx` para auto-colapsar em tablet se usuário NÃO expandiu manualmente:

```typescript
// src/components/layout/Sidebar.tsx
import { useEffect } from 'react';
import { useIsTablet } from '@/hooks/useMediaQuery';
import { useUIStore } from '@/stores/ui.store';

export function Sidebar() {
  const isTablet = useIsTablet();
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  // Auto-collapse em tablet SE não foi manualmente expandida
  useEffect(() => {
    if (isTablet && !sidebarCollapsed) {
      // Forçar collapse em tablet (apenas se não estiver já colapsada)
      // IMPORTANTE: Não persistir essa mudança (é automática, não escolha do usuário)
      // Solução: adicionar flag `manuallyExpanded` no store
      toggleSidebar();
    }
  }, [isTablet]); // APENAS ao mudar breakpoint

  // ... resto do componente
}
```

**PROBLEMA IDENTIFICADO:** Lógica acima cria loop infinito (toggle → re-render → toggle). **Solução correta:**

Adicionar flag `manuallyToggled` no UI store:

```typescript
// src/stores/ui.store.ts
interface UIState {
  sidebarCollapsed: boolean;
  manuallyToggled: boolean; // NOVO — flag se usuário alterou manualmente
  // ...
  toggleSidebar: () => void; // Marca manuallyToggled = true
  autoCollapseSidebar: () => void; // NOVO — collapse automático (não marca manuallyToggled)
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      manuallyToggled: false,
      // ...
      toggleSidebar: () => set((s) => ({
        sidebarCollapsed: !s.sidebarCollapsed,
        manuallyToggled: true, // Usuário clicou no botão
      })),
      autoCollapseSidebar: () => set({ sidebarCollapsed: true }), // Auto, NÃO marca manuallyToggled
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        manuallyToggled: state.manuallyToggled, // Persistir flag
      }),
    }
  )
);
```

Atualizar Sidebar.tsx:

```typescript
// src/components/layout/Sidebar.tsx
useEffect(() => {
  const manuallyToggled = useUIStore.getState().manuallyToggled;

  if (isTablet && !sidebarCollapsed && !manuallyToggled) {
    // Auto-collapse APENAS se:
    // - Está em tablet
    // - Sidebar está expandida
    // - Usuário NÃO expandiu manualmente
    useUIStore.getState().autoCollapseSidebar();
  }
}, [isTablet, sidebarCollapsed]);
```

**Rationale:**
- Tablet inicia com sidebar colapsada (economiza espaço)
- Se usuário expandir manualmente (botão collapse), respeitar preferência
- Se usuário voltar para desktop, usar estado persistido (expandida por padrão)
- Flag `manuallyToggled` persiste no localStorage (sobrevive a refresh)

### Tailwind Breakpoints — Referência Rápida

Usar breakpoints padrão do Tailwind (já configurados):

| Breakpoint | Min Width | Uso |
|-----------|-----------|-----|
| `sm` | 640px | Não usado nesta story |
| `md` | 768px | Tablet (768px - 1024px) |
| `lg` | 1024px | Desktop (>= 1024px) |
| `xl` | 1280px | Não usado (desktop) |

**Media queries customizadas:**
- Mobile: `(max-width: 767px)` — ANTES de `md` breakpoint
- Tablet: `(min-width: 768px) and (max-width: 1023px)` — ENTRE `md` e `lg`
- Desktop: `(min-width: 1024px)` — A PARTIR de `lg`

### Acessibilidade (WCAG AAA) — Responsivo

**Mobile:**
- Botão hambúrguer: `aria-label="Abrir menu de navegação"`
- Sheet drawer: `role="dialog"` (shadcn/ui já aplica)
- Overlay: fecha drawer ao clicar fora (shadcn/ui já faz isso)
- Touch targets: mínimo 44x44px (verificar em todos os items)

**Tablet:**
- Sidebar colapsada: mostrar tooltips ao hover sobre ícones (usar shadcn/ui `Tooltip`)
- Ícones têm `aria-label` quando label está oculto

**Desktop:**
- Sidebar expandida: labels visíveis, sem necessidade de tooltips
- Botão collapse: `aria-label` dinâmico ("Recolher menu" / "Expandir menu")

**Universal:**
- Contraste: Deep Navy (#0A2647) em branco = 14.8:1 (AAA)
- Focus visível: `:focus-visible` com outline Tech Blue
- Navegação por teclado: Tab navega por items, Enter ativa, Esc fecha drawer mobile

### Componentes shadcn/ui Já Instalados

Verificado via `ls ressoa-frontend/src/components/ui/`:
- ✅ `sheet.tsx` — Mobile drawer (READY TO USE)
- ✅ `tooltip.tsx` — Tooltips para ícones colapsados (READY TO USE)
- ✅ `collapsible.tsx` — Não necessário nesta story (pode ser usado no futuro)

**NÃO precisa instalar nada novo** — todos os componentes necessários já estão disponíveis.

### Padrões de Código a Seguir

1. **Imports:** Path alias `@/` (ex: `import { useMediaQuery } from '@/hooks/useMediaQuery'`)
2. **Exports:** Named exports (ex: `export function useIsMobile()`)
3. **Hooks:** Prefixo `use`, retornar valores primitivos ou objetos simples
4. **State:** Zustand store único (`ui.store.ts`), evitar múltiplos stores
5. **Styling:** Tailwind utility classes, usar design tokens (`text-deep-navy`, `bg-tech-blue`)
6. **Responsive:** Breakpoints Tailwind (`md:`, `lg:`), media queries via `useMediaQuery` hook
7. **Touch Targets:** `min-h-[44px]` e `min-w-[44px]` em TODOS os elements clicáveis

### Anti-Patterns a Evitar

- **NÃO** usar CSS media queries inline (`@media (max-width: 768px)`) — usar hook `useMediaQuery`
- **NÃO** criar múltiplos stores para UI state — usar `ui.store.ts` único
- **NÃO** duplicar código de navegação entre MobileSidebar e Sidebar — reusar `SidebarNavItem`
- **NÃO** hardcodar breakpoints em múltiplos lugares — usar hook centralizado
- **NÃO** esquecer touch targets 44x44px — validar em TODOS os botões/links
- **NÃO** mostrar sidebar desktop no mobile (display: none) — renderização condicional é melhor (performance)
- **NÃO** usar `window.innerWidth` diretamente — usar `window.matchMedia()` (reage a mudanças)
- **NÃO** persistir `mobileMenuOpen` no localStorage — sempre começa fechado
- **NÃO** forçar collapse em desktop — auto-collapse APENAS em tablet

### Dependências entre Stories

- **Story 9.1** (DONE) → Base obrigatória: AppLayout, Sidebar, Header, UI store
- **Story 9.2** (ESTA) → Adiciona responsividade mobile/tablet
- **Story 9.3** (backlog) → Fix de rotas quebradas e redirects por role
- **Story 9.4** (backlog) → CTA "Nova Aula" com Focus Orange na sidebar (depende de 9.1 e 9.2)
- **Story 9.5** (backlog) → Polimento visual das pages do professor
- **Story 9.6** (backlog) → Polimento visual dos dashboards

**IMPORTANTE:** Esta story foca APENAS em responsividade. Não adicionar features de outras stories (CTA, polimento visual, fix de rotas).

### Git Intelligence — Últimos Commits

Padrão de commits recentes (Epic 9):
```
886a85f feat(story-9.1): implement responsive layout shell with sidebar, header, and breadcrumbs
```

**Padrão a seguir:**
- Formato: `feat(story-X.Y): description`
- Description: imperativo, lowercase, sem ponto final
- Exemplo para esta story: `feat(story-9.2): implement responsive sidebar with mobile drawer and tablet collapse`

**Build status:**
- Frontend: ✅ Passing (33/33 tests)
- Backend: ✅ Passing
- Componentes shadcn/ui instalados: 28 (incluindo `sheet`, `tooltip`)

### Project Structure Notes

**Novos arquivos a criar:**
```
src/
├── hooks/
│   └── useMediaQuery.ts          # Hook para detectar breakpoints
├── components/
│   └── layout/
│       └── MobileSidebar.tsx     # Sheet drawer para mobile
```

**Arquivos a modificar:**
```
src/
├── components/
│   └── layout/
│       ├── AppLayout.tsx         # Renderização condicional mobile vs desktop
│       ├── Header.tsx            # Adicionar botão hambúrguer no mobile
│       ├── Sidebar.tsx           # Auto-collapse em tablet
│       └── SidebarNavItem.tsx    # Callback onNavigate para fechar drawer
├── stores/
│   └── ui.store.ts               # Adicionar mobileMenuOpen e manuallyToggled
```

### Testing Strategy

**Testes unitários (Vitest + React Testing Library):**

1. **useMediaQuery.test.ts:**
   - Testa que hook retorna `false` por padrão (SSR-safe)
   - Testa que hook atualiza ao mudar `window.matchMedia()`
   - Testa hooks de conveniência: `useIsMobile()`, `useIsTablet()`, `useIsDesktop()`

2. **MobileSidebar.test.tsx:**
   - Testa que Sheet renderiza quando `mobileMenuOpen = true`
   - Testa que Sheet NÃO renderiza quando `mobileMenuOpen = false`
   - Testa que clicar em nav item fecha drawer (chama `closeMobileMenu`)

3. **AppLayout.test.tsx (atualizar):**
   - Testa que renderiza `MobileSidebar` quando `isMobile = true`
   - Testa que renderiza `Sidebar` quando `isMobile = false`

4. **Header.test.tsx (atualizar):**
   - Testa que botão hambúrguer renderiza quando `showMenuButton = true`
   - Testa que botão hambúrguer NÃO renderiza quando `showMenuButton = false`
   - Testa que clicar hambúrguer abre drawer (`setMobileMenuOpen(true)`)

5. **ui.store.test.ts (atualizar):**
   - Testa estado inicial: `mobileMenuOpen = false`, `manuallyToggled = false`
   - Testa `toggleSidebar()` marca `manuallyToggled = true`
   - Testa `autoCollapseSidebar()` NÃO marca `manuallyToggled`
   - Testa que `mobileMenuOpen` NÃO persiste no localStorage

6. **SidebarNavItem.test.tsx (atualizar):**
   - Testa que `onNavigate` callback é chamado ao clicar em item
   - Testa que callback NÃO quebra se não fornecido (opcional)

**Testes manuais (mobile/tablet/desktop):**
- Testar em Chrome DevTools: Mobile (375px), Tablet (768px), Desktop (1280px)
- Testar touch targets em device real (smartphone Android/iOS)
- Testar que drawer fecha ao clicar fora (overlay)
- Testar que sidebar auto-collapsa em tablet
- Testar que expandir manualmente em tablet persiste ao refresh

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-9, Story 9.2, lines 9501-9525]
- [Source: _bmad-output/implementation-artifacts/9-1-layout-shell-sidebar-header-breadcrumbs.md — Story 9.1 completa, componentes criados]
- [Source: _bmad-output/planning-artifacts/architecture.md#AD-3.1 State Management (Zustand)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX Pattern Analysis — Mobile Upload (Loom pattern)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility WCAG AAA — Touch Targets 44px]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System Breakpoints]
- [Source: ressoa-frontend/src/components/layout/Sidebar.tsx — Sidebar desktop existente]
- [Source: ressoa-frontend/src/components/layout/AppLayout.tsx — Layout atual]
- [Source: ressoa-frontend/src/components/ui/sheet.tsx — shadcn/ui Sheet component (já instalado)]
- [Source: ressoa-frontend/src/stores/ui.store.ts — Zustand UI store existente]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

No debug issues encountered. Implementation followed red-green-refactor TDD cycle throughout.

### Completion Notes List

✅ **Task 1 Complete:** Breakpoint Detection
- Created `useMediaQuery` hook with SSR-safe defaults
- Implemented convenience hooks: `useIsMobile()`, `useIsTablet()`, `useIsDesktop()`
- Updated `AppLayout` to conditionally render `MobileSidebar` vs `Sidebar` based on viewport
- 11 unit tests passing for media query hooks

✅ **Task 2 Complete:** Mobile Drawer Implementation
- Created `MobileSidebar` component using shadcn/ui `Sheet`
- Added hamburger menu button to `Header` (Menu icon from Lucide)
- Implemented auto-close drawer on navigation via `onNavigate` callback
- Applied Deep Navy design with logo and gradient icon matching desktop
- 7 unit tests passing for MobileSidebar, 9 tests passing for Header

✅ **Task 3 Complete:** Tablet Auto-Collapse
- Added `manuallyToggled` flag to UI store to distinguish user actions from auto-collapse
- Implemented `autoCollapseSidebar()` action that doesn't set `manuallyToggled`
- Added `useEffect` in `Sidebar.tsx` that auto-collapses when `isTablet && !collapsed && !manuallyToggled`
- Preferences persist correctly via Zustand persist middleware
- 6 unit tests passing for Sidebar auto-collapse behavior

✅ **Task 4 Complete:** Touch Target Accessibility
- Verified all interactive elements have `min-h-[44px]`
- Hamburger button: `min-h-[44px] min-w-[44px]`
- Navigation items: `min-h-[44px]` with `py-2.5 px-3` padding
- Collapse button: `min-h-[44px]` with `p-2.5` padding
- All components pass WCAG AAA touch target requirements

✅ **Task 5 Complete:** Comprehensive Testing
- 80 unit tests passing (up from 33 before this story)
- Tests cover responsive rendering, auto-collapse, touch targets, accessibility
- AppLayout tests verify conditional rendering (mobile vs desktop)
- Sidebar tests verify auto-collapse logic and manual override
- MobileSidebar tests verify Sheet integration and auto-close
- Header tests verify hamburger button rendering and callbacks
- UI store tests verify persistence and state transitions

### File List

**New Files:**
- `src/hooks/useMediaQuery.ts` — Media query detection hook
- `src/hooks/useMediaQuery.test.ts` — Hook tests (11 tests)
- `src/components/layout/MobileSidebar.tsx` — Mobile Sheet drawer
- `src/components/layout/MobileSidebar.test.tsx` — Mobile sidebar tests (7 tests)
- `src/components/layout/Header.test.tsx` — Header tests (9 tests)
- `src/components/layout/Sidebar.test.tsx` — Sidebar tests (6 tests)

**Modified Files:**
- `src/stores/ui.store.ts` — Added `mobileMenuOpen`, `manuallyToggled`, actions
- `src/stores/ui.store.test.ts` — Extended tests for new state (15 tests total)
- `src/components/layout/AppLayout.tsx` — Responsive rendering logic
- `src/components/layout/AppLayout.test.tsx` — Responsive tests (8 tests total)
- `src/components/layout/Header.tsx` — Added hamburger button
- `src/components/layout/Sidebar.tsx` — Auto-collapse on tablet
- `src/components/layout/SidebarNavItem.tsx` — Optional `onNavigate` callback
