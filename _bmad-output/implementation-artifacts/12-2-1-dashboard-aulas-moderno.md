# Story 12.2.1: Dashboard de Aulas Moderno

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

Como **coordenador explorando aulas registradas**,
Eu quero **ver lista moderna e visualmente organizada em cards (não tabela genérica)**,
Para **perceber profissionalismo e qualidade do produto em demos**.

## Acceptance Criteria

- [ ] **AC1:** Aulas renderizadas como cards modernos usando `<GradientCard>` para aulas com status "APROVADA" (highlight)
- [ ] **AC2:** Status badges usam `<AIBadge variant="status">` com cores semânticas (verde=APROVADA, amarelo=ANALISADA, azul=TRANSCRITA, cinza=CRIADA, laranja=ERRO)
- [ ] **AC3:** Filtros têm UI limpa com shadcn/ui `<Select>` customizado (já existe em `AulasFilters.tsx` - apenas aplicar polish visual)
- [ ] **AC4:** Loading state usa `<SkeletonLoader variant="card">` em grid de 3 cards (desktop) / 1 card (mobile)
- [ ] **AC5:** Hover states sofisticados: `scale-[1.02]` + shadow transition `transition-all duration-200`
- [ ] **AC6:** Empty state tem design branded com ilustração + mensagem motivacional (não texto genérico "Nenhuma aula encontrada")
- [ ] **AC7:** Responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` com gaps adequados
- [ ] **AC8:** Cards desktop mostram: header (turma + data), status badge, tipo badge, ações primárias (Revisar/Analisar/Detalhes)
- [ ] **AC9:** Cards mobile (já existe `AulasCards.tsx`) recebe upgrade visual com GradientCard para highlights
- [ ] **AC10:** Paginação mantida (já implementada em `AulasListPage.tsx`)
- [ ] **AC11:** Design tokens Ressoa AI aplicados: Deep Navy headers, Tech Blue botões primários, Cyan AI badges de IA
- [ ] **AC12:** Acessibilidade: touch targets 44px, ARIA labels, keyboard navigation funcional

## Tasks / Subtasks

- [ ] Task 1: Refatorar AulasCards para Desktop com GradientCard (AC1, AC2, AC7, AC8)
  - [ ] 1.1: Criar novo componente `AulasCardsDesktop.tsx` baseado em `AulasCards.tsx` atual
  - [ ] 1.2: Substituir `<Card>` por `<GradientCard>` APENAS para aulas com status "APROVADA" (highlight visual)
  - [ ] 1.3: Usar `<Card>` padrão shadcn/ui para demais status (não sobrecarregar UI com gradients)
  - [ ] 1.4: Aplicar grid responsivo `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
  - [ ] 1.5: Card header: Turma (font-montserrat semibold) + Data (text-deep-navy/80)
  - [ ] 1.6: Card body: StatusBadge + TipoBadge (já existem, aplicar se necessário)
  - [ ] 1.7: Card footer: Botões primários (Revisar/Analisar/Detalhes) com ícones Tabler
  - [ ] 1.8: Adicionar hover effect: `hover:scale-[1.02] hover:shadow-lg transition-all duration-200`

- [ ] Task 2: Migrar StatusBadge para AIBadge variant="status" (AC2)
  - [ ] 2.1: Ler `StatusBadge.tsx` atual (verifica implementação)
  - [ ] 2.2: SE StatusBadge já usa cores corretas → apenas adicionar micro-animação `animate-pulse-subtle` para status "ANALISANDO"
  - [ ] 2.3: SE StatusBadge não usa AIBadge → refatorar para usar `<AIBadge variant="status">` com mapeamento:
    - APROVADA → variant="status" + green color
    - ANALISADA → variant="status" + yellow/amber color
    - TRANSCRITA → variant="status" + blue color
    - CRIADA → variant="status" + gray color
    - ERRO → variant="status" + orange (Focus Orange #F97316, não vermelho puro)
    - ANALISANDO → variant="processing" (pulsante)
  - [ ] 2.4: Garantir acessibilidade: ARIA role="status" para estados dinâmicos

- [ ] Task 3: Aplicar polish visual em AulasFilters (AC3)
  - [ ] 3.1: Ler `AulasFilters.tsx` atual
  - [ ] 3.2: Verificar se usa shadcn/ui `<Select>` → se sim, apenas validar design tokens (Deep Navy, Tech Blue)
  - [ ] 3.3: Aplicar espaçamento consistente: `gap-4` entre filtros
  - [ ] 3.4: Botão "Limpar Filtros" com variant="outline" e ícone `<IconFilterX>` do Tabler
  - [ ] 3.5: Garantir responsividade: filtros empilham verticalmente em mobile (<md)

- [ ] Task 4: Implementar SkeletonLoader no loading state (AC4)
  - [ ] 4.1: Substituir `<AulasListSkeleton>` atual por grid de `<SkeletonLoader variant="card">`
  - [ ] 4.2: Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` (match cards reais)
  - [ ] 4.3: Renderizar 6 skeleton cards (suficiente para preview acima do fold)
  - [ ] 4.4: Usar `count` prop do SkeletonLoader para simplificar: `<SkeletonLoader variant="card" count={6} />`
  - [ ] 4.5: Validar que skeleton respeita `prefers-reduced-motion`

- [ ] Task 5: Redesign Empty State branded (AC6)
  - [ ] 5.1: Ler `AulasListEmpty.tsx` atual
  - [ ] 5.2: Substituir mensagem genérica por branded:
    - Ícone ilustrativo: `<IconSchool>` ou `<IconBook>` do Tabler (tamanho 64px, cor Cyan AI)
    - Título: "Nenhuma aula registrada ainda" (font-montserrat bold)
    - Subtítulo motivacional: "Comece fazendo upload da sua primeira aula e veja a mágica acontecer!" (font-inter)
    - CTA primário: "Nova Aula" button (Tech Blue) com ícone `<IconPlus>`
  - [ ] 5.3: Layout centralizado: `flex flex-col items-center justify-center min-h-[400px]`
  - [ ] 5.4: Adicionar micro-animação sutil no ícone: `animate-pulse-subtle` (Epic 12 keyframe)

- [ ] Task 6: Upgrade Mobile Cards com GradientCard (AC9)
  - [ ] 6.1: Editar `AulasCards.tsx` existente (mobile-only, display `block md:hidden`)
  - [ ] 6.2: Aplicar mesmo padrão de Task 1: GradientCard para status "APROVADA", Card padrão para demais
  - [ ] 6.3: Manter touch targets 44px (já implementado segundo `AulasCards.tsx` linha 49)
  - [ ] 6.4: Validar hover não quebra em mobile (usar `@media (hover: hover)` se necessário)

- [ ] Task 7: Aplicar Design Tokens Ressoa AI (AC11)
  - [ ] 7.1: Verificar uso de cores hardcoded em `AulasListPage.tsx`, `AulasCards.tsx`, `AulasFilters.tsx`
  - [ ] 7.2: Substituir por design tokens:
    - Headers/títulos → `text-deep-navy` (classe Tailwind já definida)
    - Botões primários → `bg-tech-blue` ou usar Button variant="default" (já styled)
    - Badges IA → `bg-cyan-ai` (via AIBadge)
    - Alertas/Erros → `text-focus-orange` (não vermelho puro)
  - [ ] 7.3: Fontes:
    - Títulos (h1, card headers) → `font-montserrat`
    - Body text → `font-inter` (default)
  - [ ] 7.4: Background página → `bg-ghost-white` (já aplicado linha 138 de AulasListPage.tsx)

- [ ] Task 8: Acessibilidade WCAG AAA (AC12)
  - [ ] 8.1: Verificar contraste de cores com WebAIM Contrast Checker:
    - Deep Navy (#0A2647) sobre Ghost White (#F8FAFC) → deve ser ≥14.8:1
    - Tech Blue (#2563EB) sobre branco → verificar ≥7:1 (AAA para texto pequeno)
  - [ ] 8.2: Garantir touch targets 44px mínimo em TODOS os botões e links (mobile)
  - [ ] 8.3: Adicionar ARIA labels descritivos:
    - Cards: `aria-label="Aula de {turma} em {data} - Status {status}"`
    - Botões: `aria-label="Revisar aula de {turma}"`
  - [ ] 8.4: Testar navegação por teclado: Tab → foca cards → Enter abre ações
  - [ ] 8.5: Testar com screen reader (NVDA/JAWS/VoiceOver) - cards devem ser lidos corretamente

- [ ] Task 9: Testes Unitários dos Novos Componentes (AC4, AC5, AC6)
  - [ ] 9.1: Criar teste `AulasCardsDesktop.test.tsx`:
    - Renderiza grid de 3 colunas em desktop (classe grid-cols-3)
    - GradientCard usado para status APROVADA
    - Card padrão usado para outros status
    - Hover effect aplica classes corretas
  - [ ] 9.2: Criar teste `AulasListEmpty.test.tsx`:
    - Renderiza ícone ilustrativo
    - Renderiza mensagem motivacional
    - Botão "Nova Aula" navega para `/aulas/upload`
  - [ ] 9.3: Atualizar teste de `AulasListSkeleton.test.tsx`:
    - Renderiza SkeletonLoader com count=6
    - Grid responsivo aplicado
  - [ ] 9.4: Coverage target: ≥80% nos novos componentes

- [ ] Task 10: Integração e Validação Final (AC1-AC12)
  - [ ] 10.1: Integrar `AulasCardsDesktop` em `AulasListPage.tsx`:
    - Desktop: renderizar `<AulasCardsDesktop>` (display `hidden md:block`)
    - Mobile: manter `<AulasCards>` existente (display `block md:hidden`)
    - Remover `<AulasTable>` completamente (tabela genérica não é AI-first)
  - [ ] 10.2: Rodar `npm run build` (frontend) → verificar sem erros TypeScript
  - [ ] 10.3: Rodar `npm run lint` → verificar sem warnings
  - [ ] 10.4: Testar responsividade manual: mobile (375px), tablet (768px), desktop (1440px)
  - [ ] 10.5: Testar `prefers-reduced-motion` via Chrome DevTools → animações desabilitadas
  - [ ] 10.6: Lighthouse audit: Performance >90, Accessibility 100
  - [ ] 10.7: Commit com mensagem semântica: "feat(story-12.2.1): implement modern cards dashboard for aulas"

## Dev Notes

### Contexto do Epic 12

Este story é **Tier 2 - High Impact** do Epic 12: AI-First Visual Identity Transformation. Depende de Story 12.0 (Design System Enhancement Setup) para componentes base (`<GradientCard>`, `<AIBadge>`, `<SkeletonLoader>`).

**Objetivo:** Transformar listagem genérica de aulas em dashboard moderno e visualmente profissional que reflete sofisticação tecnológica da IA para demos com donos de escola.

**Stories relacionadas (Epic 12):**
- **Story 12.0:** Design System Enhancement Setup (DONE - componentes já disponíveis)
- **Story 12.1.1:** Relatório de Aula Premium (DONE)
- **Story 12.1.2:** Upload Visual Confiável (DONE)
- **Story 12.2.1:** Dashboard de Aulas Moderno (ESTE STORY)
- **Story 12.2.2:** Visualização de Planos Pedagógicos (DONE)

### Arquitetura: Componentes Já Existentes

**CRITICAL:** Este story é REFATORAÇÃO VISUAL - NÃO criar novas APIs ou alterar lógica de negócio.

**Componentes Epic 12 Disponíveis (criados em Story 12.0):**
- ✅ `<GradientCard>` → Card com header gradient animado (Deep Navy → Tech Blue)
- ✅ `<AIBadge variant="status|skill|processing">` → Badge branded com micro-animação
- ✅ `<SkeletonLoader variant="card|table|chart">` → Loading state branded
- ✅ Animações CSS: `animate-gradient-x`, `animate-pulse-subtle` (já em `src/index.css`)
- ✅ `prefers-reduced-motion` → Media query global (src/index.css linha ~80)

**Componentes Atuais a Refatorar:**
- ⏳ `AulasListPage.tsx` → Página principal (layout já correto, adicionar grid de cards)
- ⏳ `AulasCards.tsx` → Cards mobile (upgrade com GradientCard para highlights)
- ⏳ `StatusBadge.tsx` → Migrar para AIBadge variant="status"
- ⏳ `AulasListSkeleton.tsx` → Substituir por SkeletonLoader grid
- ⏳ `AulasListEmpty.tsx` → Redesign branded

**Componentes a Criar:**
- 🆕 `AulasCardsDesktop.tsx` → Versão desktop dos cards (grid 3 cols)

**Componentes a MANTER sem alteração:**
- ✅ `AulasFilters.tsx` → Apenas polish visual (cores, espaçamento)
- ✅ `AulaDetailsModal.tsx` → Não alterado neste story
- ✅ `TipoBadge.tsx` → Não alterado (já usa cores corretas)

**Componentes a REMOVER:**
- ❌ `AulasTable.tsx` → Removido (tabela genérica não é AI-first) - manter arquivo mas não renderizar

### Technical Requirements

#### 1. GradientCard Usage - Uso Seletivo para Highlights

**CRITICAL:** NÃO usar GradientCard em todos os cards. Usar APENAS para status "APROVADA" (highlight visual).

**Rationale:**
- GradientCard é hero component - overuse dilui impacto
- Status "APROVADA" = output final da IA = merece destaque
- Demais status (CRIADA, TRANSCRITA, ANALISANDO, ERRO) = Card padrão shadcn/ui

**Implementação:**
```typescript
// AulasCardsDesktop.tsx
{aulas.map((aula) => {
  const isApproved = aula.status_processamento === 'APROVADA';

  const CardComponent = isApproved ? GradientCard : Card;

  return (
    <CardComponent key={aula.id} className="hover:scale-[1.02] hover:shadow-lg transition-all duration-200">
      {isApproved ? (
        // GradientCard props
        <>
          {/* title, description, children, headerActions */}
          <CardComponent
            title={aula.turma_nome}
            description={formatDate(aula.data)}
          >
            {/* Card body content */}
          </CardComponent>
        </>
      ) : (
        // Card padrão shadcn/ui
        <>
          <CardHeader>
            <CardTitle>{aula.turma_nome}</CardTitle>
            <CardDescription>{formatDate(aula.data)}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Card body content */}
          </CardContent>
          <CardFooter>
            {/* Actions */}
          </CardFooter>
        </>
      )}
    </CardComponent>
  );
})}
```

**Performance Impact:**
- GradientCard animation: ~10ms overhead (Epic 12 budget <100ms total)
- 20 aulas × 1 GradientCard (média 2-3 aprovadas) = ~30ms total ✅ Aceitável

#### 2. AIBadge Status Mapping

**Mapeamento de cores semânticas (UX Design Spec - não punitivo):**

| Status | AIBadge Variant | Color | Rationale |
|--------|----------------|-------|-----------|
| APROVADA | `status` | Green (`bg-green-600`) | Sucesso, completo |
| ANALISADA | `status` | Amber (`bg-amber-500`) | Atenção, aguardando aprovação |
| TRANSCRITA | `status` | Blue (`bg-tech-blue`) | Processamento intermediário |
| CRIADA | `status` | Gray (`bg-gray-400`) | Aguardando processamento |
| ERRO | `status` | Orange (`bg-focus-orange`) | Alerta, não punitivo (não vermelho!) |
| ANALISANDO | `processing` | Tech Blue + pulse | Estado transitório, IA trabalhando |

**CRITICAL:** Usar `bg-focus-orange` (#F97316) para ERRO, NÃO vermelho puro. Princípio UX: "IA como lente, nunca como juiz" (UX Design Spec).

#### 3. Responsive Grid Breakpoints

**Grid Tailwind CSS:**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>
```

**Breakpoints:**
- `grid-cols-1` (default): Mobile (<768px) - 1 coluna
- `md:grid-cols-2` (≥768px): Tablet - 2 colunas
- `lg:grid-cols-3` (≥1024px): Desktop - 3 colunas

**Gap:** `gap-6` (24px) entre cards - espaçamento consistente com design system

**Container:** Usar container existente em `AulasListPage.tsx` (linha 139: `container mx-auto py-8 px-4`)

#### 4. Hover States - Performance Optimization

**Classes Tailwind:**
```typescript
className="hover:scale-[1.02] hover:shadow-lg transition-all duration-200"
```

**Breakdown:**
- `hover:scale-[1.02]` → Escala 2% maior (sutil, não exagerado)
- `hover:shadow-lg` → Sombra grande (depth cue)
- `transition-all` → Transição suave de todas propriedades
- `duration-200` → 200ms (sweet spot: não muito rápido, não muito lento)

**Performance:**
- CSS transforms são GPU-accelerated (60fps garantido)
- `will-change: transform` → SOMENTE se performance <60fps (medir DevTools Performance tab)
- Se adicionar `will-change`, remover após animação: `hover:will-change-transform`

**Accessibility:**
- Hover states funcionam APENAS em desktop (mouse)
- Mobile: usar `@media (hover: hover)` se necessário (Tailwind: `hover:` já tem suporte)
- Touch: estados focus visuais devem ser equivalentes (outline ou border)

#### 5. SkeletonLoader Grid - Match Real Cards

**CRITICAL:** Skeleton loaders devem ter MESMA estrutura visual dos cards reais (evita layout shift).

**Implementação:**
```typescript
// Substituir AulasListSkeleton.tsx
import { SkeletonLoader } from '@/components/ui/skeleton-loader';

export const AulasListSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <SkeletonLoader variant="card" count={6} />
    </div>
  );
};
```

**Count:** 6 cards skeleton (suficiente para preview acima do fold em desktop 1440px)

**Variant:** `card` → Retângulo com header + linhas (match estrutura de Card real)

**Duração:** Loading típico <2s (NFR-PERF-04). Se >2s, problema no backend (não UX).

#### 6. Empty State - Branded Design

**Layout Centralizado:**
```typescript
<div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
  {/* Ícone ilustrativo */}
  <IconSchool size={64} className="text-cyan-ai" />

  {/* Título */}
  <h2 className="text-2xl font-montserrat font-bold text-deep-navy">
    Nenhuma aula registrada ainda
  </h2>

  {/* Subtítulo motivacional */}
  <p className="text-center text-deep-navy/80 max-w-md">
    Comece fazendo upload da sua primeira aula e veja a mágica acontecer!
  </p>

  {/* CTA */}
  <Button onClick={() => navigate('/aulas/upload')} size="lg">
    <IconPlus className="h-5 w-5 mr-2" />
    Nova Aula
  </Button>
</div>
```

**Ícone:** `<IconSchool>` ou `<IconBook>` do `@tabler/icons-react` (64px, Cyan AI color)

**Micro-animação:** `animate-pulse-subtle` no ícone (Epic 12 keyframe) - APENAS se `prefers-reduced-motion` não ativo

**Tom de voz:** Motivacional, não punitivo (princípio UX Ressoa AI)

### Architecture Compliance

**AD-3.1: Frontend Stack - React 18 + Vite + TypeScript**
- [Source: architecture.md#AD-3.1]
- ✅ Componentes funcionais com hooks
- ✅ TypeScript strict mode (verificar tsconfig.json `"strict": true`)
- ✅ Props typing obrigatório (todas interfaces exportadas)

**AD-3.2: API Communication - React Query + Axios**
- [Source: architecture.md#AD-3.2]
- ✅ Hook `useAulas` já implementado (não alterar)
- ✅ Mutations já implementadas (useReprocessAula, useDeleteAula, useStartAnalise)

**AD-3.6: UI Components - shadcn/ui + Tailwind CSS**
- [Source: architecture.md#AD-3.6]
- ✅ Usar componentes shadcn/ui base: `<Card>`, `<Button>`, `<Select>`
- ✅ Customizar com Tailwind classes (não CSS inline)
- ✅ Epic 12 components: `<GradientCard>`, `<AIBadge>`, `<SkeletonLoader>`

**AD-3.12: Design System - Paleta Ressoa AI**
- [Source: architecture.md#AD-3.12]
- ✅ Deep Navy (#0A2647) - headers, navegação
- ✅ Tech Blue (#2563EB) - ações primárias, botões
- ✅ Cyan AI (#06B6D4) - elementos de IA (badges, ícones)
- ✅ Focus Orange (#F97316) - alertas, destaques (não vermelho!)
- ✅ Ghost White (#F8FAFC) - backgrounds claros
- ✅ Fontes: Montserrat (headers), Inter (body)

**NFR-ACCESS-01: WCAG AAA Compliance**
- [Source: prd.md#NFRs]
- ✅ Contraste 14.8:1 garantido (Deep Navy sobre Ghost White)
- ✅ Touch targets 44px mínimo (mobile)
- ✅ ARIA labels descritivos
- ✅ Keyboard navigation funcional
- ✅ `prefers-reduced-motion` suportado

**NFR-PERF-04: Dashboard <2s load**
- [Source: prd.md#NFRs]
- ✅ SkeletonLoader melhora percepção de performance
- ✅ CSS animations (60fps) vs JS animations (30-40fps)
- ✅ Lazy load não necessário (componentes leves)

### File Structure Requirements

**Frontend Estrutura:**
```
ressoa-frontend/src/pages/aulas/
├── AulasListPage.tsx                 # EDITAR - integrar AulasCardsDesktop
├── components/
│   ├── AulasCards.tsx                # EDITAR - upgrade mobile com GradientCard
│   ├── AulasCardsDesktop.tsx         # CRIAR - versão desktop grid 3 cols
│   ├── AulasFilters.tsx              # EDITAR - polish visual
│   ├── AulasListSkeleton.tsx         # EDITAR - usar SkeletonLoader grid
│   ├── AulasListEmpty.tsx            # EDITAR - redesign branded
│   ├── StatusBadge.tsx               # EDITAR - migrar para AIBadge
│   ├── TipoBadge.tsx                 # NÃO ALTERAR
│   ├── AulaDetailsModal.tsx          # NÃO ALTERAR
│   └── AulasTable.tsx                # NÃO RENDERIZAR (manter arquivo)
└── components/
    ├── AulasCardsDesktop.test.tsx    # CRIAR - testes unitários
    ├── AulasListEmpty.test.tsx       # CRIAR - testes unitários
    └── AulasListSkeleton.test.tsx    # EDITAR - atualizar testes
```

**Epic 12 Components (já existem):**
```
ressoa-frontend/src/components/ui/
├── gradient-card.tsx          # ✅ Disponível (Story 12.0)
├── ai-badge.tsx               # ✅ Disponível (Story 12.0)
├── skeleton-loader.tsx        # ✅ Disponível (Story 12.0)
└── index.ts                   # ✅ Barrel exports
```

### Testing Requirements

**Testes Unitários (Vitest + Testing Library):**

**1. AulasCardsDesktop.test.tsx:**
```typescript
import { render, screen } from '@testing-library/react';
import { AulasCardsDesktop } from './AulasCardsDesktop';

describe('AulasCardsDesktop', () => {
  it('renders grid with 3 columns on desktop', () => {
    const { container } = render(<AulasCardsDesktop aulas={mockAulas} {...mockHandlers} />);
    expect(container.firstChild).toHaveClass('grid-cols-3');
  });

  it('uses GradientCard for APROVADA status', () => {
    render(<AulasCardsDesktop aulas={[{ ...mockAula, status_processamento: 'APROVADA' }]} {...mockHandlers} />);
    // Verificar GradientCard renderizado (classe específica ou data-testid)
  });

  it('uses standard Card for non-approved status', () => {
    render(<AulasCardsDesktop aulas={[{ ...mockAula, status_processamento: 'CRIADA' }]} {...mockHandlers} />);
    // Verificar Card padrão (sem gradient)
  });

  it('applies hover effect classes', () => {
    const { container } = render(<AulasCardsDesktop aulas={mockAulas} {...mockHandlers} />);
    const card = container.querySelector('[role="article"]'); // ou data-testid
    expect(card).toHaveClass('hover:scale-[1.02]', 'transition-all');
  });
});
```

**2. AulasListEmpty.test.tsx:**
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AulasListEmpty } from './AulasListEmpty';

describe('AulasListEmpty', () => {
  it('renders motivational message', () => {
    render(<AulasListEmpty />);
    expect(screen.getByText(/Nenhuma aula registrada ainda/i)).toBeInTheDocument();
    expect(screen.getByText(/veja a mágica acontecer/i)).toBeInTheDocument();
  });

  it('renders icon illustration', () => {
    render(<AulasListEmpty />);
    // Verificar ícone SVG renderizado (IconSchool ou IconBook)
    const icon = screen.getByRole('img', { hidden: true }); // Tabler icons não têm role por padrão
    expect(icon).toBeInTheDocument();
  });

  it('navigates to /aulas/upload on CTA click', async () => {
    const mockNavigate = vi.fn();
    vi.mock('react-router-dom', () => ({
      useNavigate: () => mockNavigate,
    }));

    render(<AulasListEmpty />);
    const button = screen.getByRole('button', { name: /Nova Aula/i });
    await userEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith('/aulas/upload');
  });
});
```

**3. StatusBadge Migration Test:**
```typescript
import { render } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge - AIBadge variant="status"', () => {
  it('renders APROVADA with green color', () => {
    const { container } = render(<StatusBadge status="APROVADA" />);
    // Verificar bg-green-600 ou classe equivalente
  });

  it('renders ERRO with Focus Orange (not red)', () => {
    const { container } = render(<StatusBadge status="ERRO" />);
    // Verificar bg-focus-orange (#F97316), NÃO bg-red-600
  });

  it('renders ANALISANDO with processing variant (pulsing)', () => {
    const { container } = render(<StatusBadge status="ANALISANDO" />);
    // Verificar animate-pulse-subtle ou AIBadge variant="processing"
  });
});
```

**Coverage Target:**
- Novos componentes (AulasCardsDesktop, AulasListEmpty): ≥80%
- Refatorados (StatusBadge, AulasCards): ≥80%
- Utilitários (AulasListSkeleton): ≥60%

**Comando:**
```bash
cd ressoa-frontend
npm test -- --coverage --run
```

### Library/Framework Requirements

**Dependências Já Instaladas (verificadas em Stories anteriores):**
- ✅ `react`: ^18.3.1
- ✅ `react-router-dom`: ^6.x
- ✅ `@tabler/icons-react`: ^3.36.1
- ✅ `tailwindcss`: ^4.1.18
- ✅ `class-variance-authority`: ^0.7.1 (usado em AIBadge)
- ✅ `lucide-react`: ^0.x (ícones alternativos, usado em alguns places)

**Epic 12 Components (Story 12.0):**
- ✅ `<GradientCard>` em `/src/components/ui/gradient-card.tsx`
- ✅ `<AIBadge>` em `/src/components/ui/ai-badge.tsx`
- ✅ `<SkeletonLoader>` em `/src/components/ui/skeleton-loader.tsx`

**Padrões de Import:**
```typescript
// Epic 12 components
import { GradientCard } from '@/components/ui/gradient-card';
import { AIBadge } from '@/components/ui/ai-badge';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';

// shadcn/ui base
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Tabler Icons
import { IconSchool, IconPlus, IconFilterX } from '@tabler/icons-react';

// React Router
import { useNavigate, useSearchParams } from 'react-router-dom';

// Utils
import { formatDate, cn } from '@/lib/utils';
```

**NÃO instalar novas dependências neste story** - tudo já está disponível.

### Latest Tech Information (Web Research - Feb 2026)

**Tailwind CSS v4.1.18:**
- 🆕 Grid auto-fit/auto-fill suportado: `grid-cols-[auto-fit_minmax(300px,1fr)]`
- 🆕 Container queries disponíveis: `@container` (não necessário neste story)
- ✅ Hover modifiers já suportam `@media (hover: hover)` automaticamente

**React Router v6.x:**
- ✅ `useSearchParams` hook estável (usado em `AulasListPage.tsx`)
- ✅ `useNavigate` hook para navegação programática
- ⚠️ Não usar `useHistory` (deprecated)

**Vitest + Testing Library:**
- ✅ Vitest v1.x estável (compatível com Vite)
- ✅ `@testing-library/react` v16.3.2
- ✅ `userEvent` para interações (preferir sobre `fireEvent`)

**shadcn/ui:**
- ✅ Card component usa Radix UI internamente (acessibilidade garantida)
- ✅ Button component suporta variants: `default`, `outline`, `ghost`, `link`
- ✅ Select component (usado em AulasFilters) já ARIA-compliant

### Previous Story Intelligence

**Story 12.0: Design System Enhancement Setup (DONE)**
- ✅ Componentes base Epic 12 criados e testados (60/60 testes passing)
- ✅ GradientCard, AIBadge, SkeletonLoader disponíveis em `/src/components/ui/`
- ✅ Animações CSS (`gradient-x`, `pulse-subtle`) definidas em `src/index.css`
- ✅ `prefers-reduced-motion` media query global implementada
- ✅ Recharts theme configurado (não usado neste story)
- ✅ Documentação em `/docs/design-system-enhancements.md`
- 📋 **Lição:** SEMPRE usar componentes Epic 12 ao invés de recriar

**Story 12.1.1: Relatório de Aula Premium (DONE)**
- ✅ GradientCard usado com sucesso em header de relatório
- ✅ AIBadge variant="skill" usado para habilidades BNCC
- ✅ CoberturaBNCCChart implementado com recharts theme
- ✅ Lighthouse Performance >90 mantido
- 📋 **Lição:** GradientCard deve ser usado SELETIVAMENTE (apenas highlights) para não diluir impacto

**Story 12.1.2: Upload Visual Confiável (DONE)**
- ✅ ProcessingStatus usado com sucesso em upload workflow
- ✅ UploadProgressBar com gradient animado implementado
- ✅ UploadErrorCard com tom empático (Focus Orange, não vermelho)
- ✅ Touch targets 44px validados em mobile
- 📋 **Lição:** Sempre usar Focus Orange (#F97316) para erros/alertas (não vermelho puro)

**Story 12.2.2: Visualização de Planos Pedagógicos (DONE)**
- ✅ Timeline view implementado com cards responsivos
- ✅ AIBadge variant="skill" usado para habilidades BNCC
- ✅ Skeleton loaders aplicados corretamente
- 📋 **Lição:** Grid responsivo com `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` funciona bem

### Git Intelligence Summary

**Últimos 5 commits:**
1. `767b86f` - feat(story-12.2.2): implement timeline view for pedagogical planning
2. `33c984f` - fix(story-12.1.1): apply code review fixes for premium report
3. `107134c` - feat(story-12.1.1): implement premium AI-first report with interactive visualizations
4. `28c69db` - feat(story-12.1.2): implement visual-confident upload experience
5. `b219035` - fix(story-12.0): apply code review fixes for Epic 12 components

**Padrões identificados:**
- ✅ Commits semânticos: `feat(story-X.X.X): description` ou `fix(story-X.X.X): description`
- ✅ Epic 12 stories usando componentes base criados em Story 12.0
- ✅ Code reviews após implementação (fix commits aplicando correções)
- 📋 **Lição para commit deste story:** `feat(story-12.2.1): implement modern cards dashboard for aulas`

**Arquivos recentemente modificados (relevantes):**
- `ressoa-frontend/src/pages/aulas/*` → Aulas pages sendo refatoradas (Epic 12)
- `ressoa-frontend/src/components/ui/*` → Epic 12 components em uso
- `ressoa-frontend/src/pages/planos/*` → Timeline implementado em Story 12.2.2

**Conclusão:** Epic 12 em fase final (Stories 12.0, 12.1.1, 12.1.2, 12.2.2 completas). Story 12.2.1 é penúltima antes de finalizar Epic.

### Project Context Reference

**CRITICAL PROJECT RULES:**
- [Source: project-context.md]
- ✅ Multi-tenancy security: `escola_id` em queries (não aplicável - frontend)
- ✅ NUNCA usar `tailwind.config.js` - Tailwind v4 usa `@theme` inline no `src/index.css`
- ✅ SEMPRE usar design tokens CSS variables (--color-deep-navy) ao invés de hardcoded colors
- ✅ SEMPRE testar `prefers-reduced-motion` antes de commit
- ✅ SEMPRE usar TypeScript strict mode - nenhum `any` permitido
- ✅ SEMPRE usar barrel exports (`/src/components/ui/index.ts`) para componentes UI

### References

**Arquitetura:**
- [Source: _bmad-output/planning-artifacts/architecture.md#AD-3.1] - Frontend Stack
- [Source: _bmad-output/planning-artifacts/architecture.md#AD-3.6] - UI Components
- [Source: _bmad-output/planning-artifacts/architecture.md#AD-3.12] - Design System

**UX Design:**
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System] - Paleta de cores, tipografia
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Key Design Challenges] - Qualidade percebida da IA, Multi-persona dashboards

**PRD:**
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-ACCESS-01] - WCAG AAA compliance
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-PERF-04] - Dashboard <2s
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-USAB-01] - Interface intuitiva sem treinamento

**Epic 12:**
- [Source: _bmad-output/implementation-artifacts/epic-12-ai-first-visual-identity.md#Story 2.1] - Detalhes completos do story
- [Source: _bmad-output/implementation-artifacts/12-0-design-system-enhancement-setup.md] - Componentes base disponíveis
- [Source: docs/design-system-enhancements.md] - Usage guidelines para Epic 12 components

## Dev Agent Record

### Agent Model Used

_(Will be filled by dev agent during implementation)_

### Debug Log References

_(Will be filled by dev agent during implementation)_

### Completion Notes List

_(Will be filled by dev agent during implementation)_

### File List

_(Will be filled by dev agent during implementation)_

---

## Code Review Report

_(Will be filled after code review)_

---
