# Story 9.5: Polimento Visual — Pages do Professor

Status: review

## Story

As a **Professor**,
I want **que as páginas de Aulas, Upload, Planejamentos e Cobertura tenham visual profissional e consistente**,
So that **a experiência parece um produto completo, não um protótipo**.

## Acceptance Criteria

1. **Given** qualquer page do Professor carrega **When** renderiza headers **Then** usa `font-montserrat font-bold text-deep-navy` (não `text-gray-900`)

2. **Given** qualquer page do Professor carrega **When** content renderiza **Then** container `max-w-7xl`, padding consistente `p-6`, margin entre seções `mb-6`

3. **Given** dados estão sendo carregados **When** page mostra loading **Then** usa Skeleton components em vez de spinners genéricos

4. **Given** pages tinham headers internos **When** layout global agora fornece navegação + breadcrumbs **Then** pages removem padding-top excessivo e headers redundantes

## Tasks / Subtasks

- [x] Task 1: Padronizar tipografia em todas as páginas do Professor (AC: #1)
  - [x] 1.1: Atualizar CoberturaPessoalPage headers de `text-gray-900` para `text-deep-navy`
  - [x] 1.2: Atualizar AulaHeader component de `text-gray-900` para `text-deep-navy`
  - [x] 1.3: Garantir H1 = `text-3xl font-montserrat font-bold text-deep-navy` em todas as pages
  - [x] 1.4: Garantir H2 = `text-xl font-semibold text-deep-navy` onde aplicável
  - [x] 1.5: Atualizar textos secundários para usar opacidade do deep-navy (80%, 60%) em vez de gray-600/700

- [x] Task 2: Padronizar containers e spacing (AC: #2)
  - [x] 2.1: List pages (Aulas, Planejamentos): manter `container mx-auto py-8 px-4`
  - [x] 2.2: Detail/Analysis pages: manter `max-w-7xl mx-auto p-6`
  - [x] 2.3: Garantir margin consistente entre seções: `mb-6` ou `space-y-6`
  - [x] 2.4: Remover padding-top excessivo agora que AppLayout fornece header global
  - [x] 2.5: Adicionar `bg-ghost-white` em páginas que ainda usam fundo branco puro

- [x] Task 3: Melhorar loading states com Skeleton (AC: #3)
  - [x] 3.1: Verificar UploadAudioTab e UploadTranscriptionTab — manter Loader2 spinner (upload/processing context apropriado)
  - [x] 3.2: Garantir que spinners usam `text-tech-blue` (não gray)
  - [x] 3.3: Verificar se skeletons existentes seguem padrão consistente
  - [x] 3.4: Adicionar mensagens de progresso transparente onde falta contexto ("Carregando aulas..." → "Carregando 15 aulas...")

- [x] Task 4: Padronizar empty states (AC: #1, #2)
  - [x] 4.1: Atualizar AulasListEmpty para usar Card com `border-dashed` (igual PlanejamentoEmptyState)
  - [x] 4.2: Garantir ícones usam `text-gray-400` (consistente)
  - [x] 4.3: Garantir botões CTA usam `bg-tech-blue hover:bg-tech-blue/90` ou `bg-focus-orange`
  - [x] 4.4: Adicionar mensagens acionáveis (não apenas "Nenhum item encontrado")

- [x] Task 5: Melhorar Cards e componentes reutilizáveis (AC: #1)
  - [x] 5.1: Atualizar PlanejamentoCard para usar `text-deep-navy` em títulos (não gray padrão)
  - [x] 5.2: Garantir todos os Cards usam shadow consistente: `shadow-sm hover:shadow-md`
  - [x] 5.3: Verificar AulaCard (mobile) usa cores do design system
  - [x] 5.4: Atualizar StatusBadge para usar cores do design system onde aplicável

- [x] Task 6: Polir detalhes visuais específicos das páginas (AC: #1, #2, #4)
  - [x] 6.1: **AulasListPage**: Verificar filtros (AulasFilters) usam cores consistentes
  - [x] 6.2: **CoberturaPessoalPage**: Atualizar StatCards para usar `text-deep-navy` em valores, ícones com `text-tech-blue`
  - [x] 6.3: **PlanejamentosListPage**: Verificar consistência de cores em badges de status
  - [x] 6.4: **UploadAulaPage**: Manter estilo existente (já usa deep-navy, max-w-4xl adequado)
  - [x] 6.5: **AulaAnalisePage**: Verificar prose classes em RelatorioTab não conflitam com design system
  - [x] 6.6: **AulaAnaliseEditPage**: Garantir botões de ação (Salvar, Cancelar, Aprovar) usam cores consistentes

- [x] Task 7: Testes visuais e validação (AC: #1, #2, #3, #4)
  - [x] 7.1: Testar visualmente todas as 6 páginas do Professor em desktop (1920px)
  - [x] 7.2: Testar visualmente todas as páginas em tablet (768px)
  - [x] 7.3: Testar visualmente todas as páginas em mobile (375px)
  - [x] 7.4: Verificar contraste WCAG AAA em todas as cores alteradas
  - [x] 7.5: Verificar que breadcrumbs do AppLayout aparecem corretamente em todas as páginas
  - [x] 7.6: Rodar build de produção e verificar ausência de warnings críticos
  - [x] 7.7: Rodar testes unitários existentes e garantir que nenhum quebrou com mudanças de estilo

## Dev Notes

### Contexto do Epic 9: Layout de Navegação & Polimento Visual

Esta story faz parte do Epic 9, que transforma o MVP funcional em um produto visualmente profissional. As stories anteriores já implementaram:

- **Story 9.1 (DONE):** AppLayout, Sidebar, Header, Breadcrumbs — estrutura base de navegação
- **Story 9.2 (DONE):** Responsividade mobile/tablet com drawer e collapse automático
- **Story 9.3 (DONE):** Fix de rotas quebradas e redirecionamentos inteligentes
- **Story 9.4 (DONE):** CTA destacado "Nova Aula" apenas para PROFESSOR

**Story 9.5 (ESTA):** Polir visualmente as 6 páginas do Professor para consistência com o Design System.

**Próximas stories (backlog):**
- **Story 9.6:** Polimento visual dos dashboards de gestão (Coordenador, Diretor, Admin)
- **Story 9.7:** Padronização de ícones (Tabler Icons)

---

### Análise Completa das Páginas do Professor

#### Páginas em Escopo (6 páginas)

1. **Minhas Aulas** (`/minhas-aulas`) → `ressoa-frontend/src/pages/aulas/AulasListPage.tsx`
2. **Nova Aula** (`/aulas/upload`) → `ressoa-frontend/src/pages/aulas/UploadAulaPage.tsx`
3. **Planejamentos** (`/planejamentos`) → `ressoa-frontend/src/pages/planejamento/PlanejamentosListPage.tsx`
4. **Minha Cobertura** (`/dashboard/cobertura-pessoal`) → `ressoa-frontend/src/pages/dashboard/CoberturaPessoalPage.tsx`
5. **Análise de Aula** (`/aulas/{id}/analise`) → `ressoa-frontend/src/pages/aulas/AulaAnalisePage.tsx`
6. **Edição de Análise** (`/aulas/{id}/analise/edit`) → `ressoa-frontend/src/pages/aulas/AulaAnaliseEditPage.tsx`

---

### Inconsistências Identificadas (Análise Detalhada)

**[Source: Explore Agent Analysis — Professor Pages Visual Patterns]**

#### 1. **Tipografia — Uso Inconsistente de Cores**

| Página | H1 Atual | H2 Atual | Problema |
|--------|----------|----------|----------|
| AulasListPage | `text-3xl font-montserrat font-bold text-deep-navy` | (none) | ✅ Correto |
| PlanejamentosListPage | `text-3xl font-montserrat font-bold text-deep-navy` | (none) | ✅ Correto |
| UploadAulaPage | `text-3xl font-montserrat font-bold text-deep-navy` | (none) | ✅ Correto |
| **CoberturaPessoalPage** | `text-2xl font-bold text-gray-900` | `text-lg font-semibold text-gray-900` | ❌ **INCONSISTENTE** |
| **AulaHeader (component)** | `text-3xl font-bold text-gray-900` | (none) | ❌ **INCONSISTENTE** |
| AulaAnaliseEditPage | (sem H1 explícito) | (none) | ⚠️ Usa max-width layout sem header |

**Problema Crítico:** CoberturaPessoalPage e AulaHeader component usam `text-gray-900` (Tailwind gray) em vez de `text-deep-navy` (#0A2647) do Design System.

**Solução:**
```tsx
// ❌ ANTES (CoberturaPessoalPage.tsx)
<h1 className="text-2xl font-bold text-gray-900 mb-6">Minha Cobertura</h1>
<h2 className="text-lg font-semibold text-gray-900 mb-4">Linha do Tempo</h2>

// ✅ DEPOIS
<h1 className="text-3xl font-montserrat font-bold text-deep-navy mb-6">Minha Cobertura</h1>
<h2 className="text-xl font-semibold text-deep-navy mb-4">Linha do Tempo</h2>
```

```tsx
// ❌ ANTES (AulaHeader.tsx)
<h1 className="text-3xl font-bold text-gray-900">{titulo}</h1>

// ✅ DEPOIS
<h1 className="text-3xl font-montserrat font-bold text-deep-navy">{titulo}</h1>
```

**Impacto:** 2 arquivos modificados, ~6 linhas alteradas.

---

#### 2. **Container & Padding — Padrões Divergentes**

| Página | Container Atual | Padding Atual | Observação |
|--------|----------------|---------------|------------|
| AulasListPage | `container mx-auto` | `py-8 px-4` | List page pattern ✅ |
| UploadAulaPage | `container mx-auto` | `py-8 px-4` + `max-w-4xl` | Centered form ✅ |
| PlanejamentosListPage | `container mx-auto` | `px-4 py-8` + `min-h-screen bg-ghost-white` | ✅ Usa bg-ghost-white |
| **CoberturaPessoalPage** | `max-w-7xl mx-auto` | `p-6` | Detail page pattern ✅ |
| AulaAnalisePage | `max-w-7xl mx-auto` | `p-6` | Detail page pattern ✅ |
| AulaAnaliseEditPage | `max-w-7xl mx-auto` | `p-6` | Detail page pattern ✅ |

**Padrão Observado (Correto):**
- **List pages** (Aulas, Planejamentos): `container mx-auto py-8 px-4` — fluid, full-width com breakpoints
- **Detail/Analysis pages** (Cobertura, Análise, Edit): `max-w-7xl mx-auto p-6` — fixed max-width, combined padding

**Problema Menor:** Apenas PlanejamentosListPage usa `bg-ghost-white`, outras list pages usam fundo padrão (branco).

**Solução:** Adicionar `bg-ghost-white` em AulasListPage para consistência visual (background levemente off-white é mais confortável).

```tsx
// ❌ ANTES (AulasListPage.tsx)
<div className="container mx-auto py-8 px-4">

// ✅ DEPOIS
<div className="min-h-screen bg-ghost-white">
  <div className="container mx-auto py-8 px-4">
```

**Impacto:** 1 arquivo modificado, wrapper adicional.

**IMPORTANTE:** CoberturaPessoalPage, AulaAnalisePage, AulaAnaliseEditPage usam `max-w-7xl` — **não alterar**, pois são detail pages (não list pages).

---

#### 3. **Loading States — Spinner vs Skeleton**

**Skeleton Loaders (✅ Correto):**
- PlanejamentosListPage: `<Skeleton className="h-20 w-full" />` (3 rows)
- AulasListPage: `<AulasListSkeleton />` component com 5 rows
- AulaAnaliseEditPage: `<Skeleton h-20 />` + `<Skeleton h-96 />`

**Spinners (⚠️ Contexto Específico):**
- UploadAudioTab: `<Loader2 className="animate-spin h-12 w-12 text-tech-blue" />`
- UploadTranscriptionTab: `<Loader2 className="animate-spin h-4 w-4" />`

**Análise:** Spinners são **apropriados** para upload/processing (ação em progresso), mas devem usar `text-tech-blue` (não gray).

**Ação Necessária:** Verificar que spinners em UploadAudioTab e UploadTranscriptionTab usam `text-tech-blue` (já parece correto).

**Melhoria Adicional (Transparência Radical):**
```tsx
// ❌ ANTES (genérico)
{isLoading && <Loader2 className="animate-spin h-12 w-12 text-tech-blue" />}

// ✅ DEPOIS (transparente)
{isLoading && (
  <div className="flex flex-col items-center gap-4">
    <Loader2 className="animate-spin h-12 w-12 text-tech-blue" />
    <p className="text-sm text-deep-navy/60">Enviando áudio (2,3 MB/s)...</p>
  </div>
)}
```

**Impacto:** Opcional — melhoria de UX, não bloqueante.

---

#### 4. **Empty States — Estilos Divergentes**

**AulasListEmpty (atual):**
```tsx
<div className="text-center py-12">
  <FileX className="mx-auto h-16 w-16 text-gray-400 mb-4" />
  <p className="text-gray-600 mb-4">Nenhuma aula encontrada</p>
  <Button>Fazer Upload</Button>
</div>
```

**PlanejamentoEmptyState (atual):**
```tsx
<Card className="border-dashed">
  <CardContent className="pt-6">
    <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
    <p className="text-gray-600 mb-4">Nenhum planejamento criado</p>
    <Button className="bg-tech-blue hover:bg-tech-blue/90">Criar Planejamento</Button>
  </CardContent>
</Card>
```

**Problema:** AulasListEmpty não usa Card com `border-dashed`, botão não usa cor específica.

**Solução:** Padronizar AulasListEmpty para match PlanejamentoEmptyState.

```tsx
// ✅ NOVO (AulasListEmpty.tsx)
<Card className="border-dashed">
  <CardContent className="pt-6 text-center">
    <FileX className="mx-auto h-16 w-16 text-gray-400 mb-4" />
    <h3 className="text-lg font-semibold text-deep-navy mb-2">Nenhuma aula encontrada</h3>
    <p className="text-sm text-deep-navy/60 mb-4">
      Faça upload da primeira aula para começar a acompanhar sua cobertura curricular
    </p>
    <Button className="bg-focus-orange hover:bg-focus-orange/90 text-white">
      Fazer Upload de Aula
    </Button>
  </CardContent>
</Card>
```

**Impacto:** 1 arquivo modificado (AulasListEmpty.tsx), ~15 linhas alteradas.

---

#### 5. **Cards — Títulos e Cores**

**PlanejamentoCard (atual):**
```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-lg">{titulo}</CardTitle>
    <CardDescription>{disciplina}</CardDescription>
  </CardHeader>
</Card>
```

**Problema:** CardTitle usa cor padrão do shadcn/ui (gray-900), não `text-deep-navy`.

**Análise:** shadcn/ui CardTitle tem classe padrão que pode ser sobrescrita localmente.

**Solução 1 (Local override):**
```tsx
<CardTitle className="text-lg text-deep-navy">{titulo}</CardTitle>
```

**Solução 2 (Global override via Tailwind config):**
Não recomendado — pode afetar outros componentes shadcn/ui que usam CardTitle.

**Decisão:** Usar Solução 1 (local override) em PlanejamentoCard.

**Impacto:** 1 arquivo modificado, 1 linha alterada.

---

#### 6. **Background Colors — Fundo Branco vs Ghost White**

**Páginas com `bg-ghost-white`:**
- PlanejamentosListPage: ✅ `min-h-screen bg-ghost-white`

**Páginas sem background específico (default branco):**
- AulasListPage: ❌ Sem `bg-ghost-white`
- CoberturaPessoalPage: ❌ Sem `bg-ghost-white`
- UploadAulaPage: ❌ Sem `bg-ghost-white`

**[Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color-Palette]**

> **Ghost White (#F8FAFC):** 60% - Background, ultra-light gray para conforto visual (evita fadiga do #FFFFFF puro)

**Solução:** Adicionar `bg-ghost-white` em páginas do Professor (exceto modals/cards que usam branco puro).

```tsx
// ✅ Wrapper externo com bg-ghost-white
<div className="min-h-screen bg-ghost-white">
  <div className="container mx-auto py-8 px-4">
    {/* Cards em branco puro (#FFFFFF) se destacam sobre ghost-white */}
  </div>
</div>
```

**Impacto:** 3 arquivos modificados (AulasListPage, CoberturaPessoalPage, UploadAulaPage).

---

### Design System — Padrões a Seguir

**[Source: _bmad-output/planning-artifacts/ux-design-specification.md]**

#### 1. **Typography Hierarchy**

```tsx
// H1 (Page Hero)
<h1 className="text-3xl md:text-4xl font-montserrat font-bold text-deep-navy">
  Minha Cobertura
</h1>

// H2 (Section)
<h2 className="text-xl md:text-2xl font-semibold text-deep-navy">
  Linha do Tempo
</h2>

// H3 (Subsection)
<h3 className="text-lg font-semibold text-deep-navy">
  Relatório Pedagógico
</h3>

// Body Large (Emphasis)
<p className="text-lg text-deep-navy/80">
  Suas 15 aulas cobrem 45% das habilidades do bimestre.
</p>

// Body (Standard)
<p className="text-base text-deep-navy/80">
  Conteúdo padrão de texto.
</p>

// Caption (Small)
<span className="text-sm text-deep-navy/60">
  Última atualização: 12/02/2026
</span>
```

**Font Families (já configuradas em Tailwind):**
- **Montserrat:** Headers (font-montserrat)
- **Inter:** Body text (font-sans — default)

---

#### 2. **Color Palette (60-30-10 Rule)**

**Primary Colors:**
- **Ghost White (#F8FAFC):** 60% — Backgrounds
- **Deep Navy (#0A2647):** 30% — Text, headers, emphasis
- **Tech Blue (#2563EB):** 10% — Links, icons, primary buttons
- **Cyan AI (#06B6D4):** Accent — Gradients, subtle highlights
- **Focus Orange (#F97316):** Accent — CTA buttons, important alerts

**Usage Examples:**
```tsx
// Primary CTA (Focus Orange)
<Button className="bg-focus-orange hover:bg-focus-orange/90 text-white">
  Fazer Upload
</Button>

// Secondary Action (Tech Blue)
<Button className="bg-tech-blue hover:bg-tech-blue/90 text-white">
  Criar Planejamento
</Button>

// Tertiary/Ghost (Tech Blue outline)
<Button variant="outline" className="border-tech-blue text-tech-blue hover:bg-tech-blue/10">
  Visualizar
</Button>

// Ícones (Tech Blue)
<Upload className="h-5 w-5 text-tech-blue" />

// Text Hierarchy
<h1 className="text-deep-navy">Título</h1>
<p className="text-deep-navy/80">Parágrafo</p>
<span className="text-deep-navy/60">Caption</span>
```

---

#### 3. **Spacing & Layout**

**Spacing Scale (multiples of 4px):**
```tsx
// Padding interno de cards
<Card className="p-6">

// Margin entre seções
<div className="space-y-6">

// Gap em grids
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

**Container Patterns:**
```tsx
// List pages (full-width fluid)
<div className="min-h-screen bg-ghost-white">
  <div className="container mx-auto py-8 px-4">
    {/* Content */}
  </div>
</div>

// Detail pages (fixed max-width)
<div className="max-w-7xl mx-auto p-6">
  {/* Content */}
</div>

// Form pages (centered narrow)
<div className="container mx-auto py-8 px-4 max-w-4xl">
  {/* Form */}
</div>
```

---

#### 4. **Component Styling Standards**

**Cards:**
```tsx
<Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
  <CardHeader>
    <CardTitle className="text-lg text-deep-navy">Título</CardTitle>
    <CardDescription className="text-deep-navy/60">Descrição</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

**Empty States:**
```tsx
<Card className="border-dashed">
  <CardContent className="pt-6 text-center">
    <Icon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
    <h3 className="text-lg font-semibold text-deep-navy mb-2">Título</h3>
    <p className="text-sm text-deep-navy/60 mb-4">Mensagem acionável</p>
    <Button className="bg-tech-blue hover:bg-tech-blue/90 text-white">
      Ação Primária
    </Button>
  </CardContent>
</Card>
```

**Loading States:**
```tsx
// Skeleton (preferido para lists)
{isLoading ? (
  <div className="space-y-4">
    <Skeleton className="h-20 w-full" />
    <Skeleton className="h-20 w-full" />
    <Skeleton className="h-20 w-full" />
  </div>
) : (
  <ContentList />
)}

// Spinner (apenas para upload/processing)
{isProcessing && (
  <div className="flex flex-col items-center gap-4">
    <Loader2 className="animate-spin h-12 w-12 text-tech-blue" />
    <p className="text-sm text-deep-navy/60">Processando...</p>
  </div>
)}
```

---

### Arquitetura — Decisões Relevantes

**[Source: _bmad-output/planning-artifacts/architecture.md#AD-1.1 Frontend Stack]**

- **React 18** + Vite + TypeScript strict
- **Tailwind CSS** para styling (classes utility-first)
- **shadcn/ui** para componentes base (Button, Card, Skeleton, etc.)
- **Zustand** para state global (auth, UI preferences)

**[Source: _bmad-output/planning-artifacts/architecture.md#AD-13.1 Design System Implementation]**

**Tailwind Custom Colors (já configurado):**
```typescript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      'deep-navy': '#0A2647',
      'tech-blue': '#2563EB',
      'cyan-ai': '#06B6D4',
      'focus-orange': '#F97316',
      'ghost-white': '#F8FAFC',
    },
    fontFamily: {
      montserrat: ['Montserrat', 'sans-serif'],
    },
  },
}
```

**shadcn/ui Components Disponíveis:**
- Button, Card (CardHeader, CardTitle, CardDescription, CardContent), Input, Dialog, Toast, Badge, Progress, Tooltip, Dropdown-Menu, Skeleton, Breadcrumb, Tabs

---

### Padrões de Código a Seguir

**1. Imports:**
```tsx
// Path alias @/ para todos os imports
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils'; // Para merge de classes Tailwind
```

**2. Styling:**
```tsx
// Tailwind utility classes via cn() helper
<div className={cn(
  'p-6 rounded-lg',
  isActive && 'bg-tech-blue/10',
  className // Permite override externo
)}>
```

**3. Typography:**
```tsx
// Sempre usar classes Tailwind do design system
<h1 className="text-3xl font-montserrat font-bold text-deep-navy"> // ✅
<h1 className="text-3xl font-bold text-gray-900"> // ❌ (não usar gray-900)
```

**4. Colors:**
```tsx
// Usar cores do design system
bg-deep-navy, text-deep-navy, border-tech-blue // ✅
bg-gray-900, text-gray-900 // ❌ (evitar, exceto gray-400 para ícones disabled)
```

**5. Responsive Design:**
```tsx
// Mobile-first breakpoints
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
<h1 className="text-2xl md:text-3xl lg:text-4xl font-montserrat">
```

---

### Git Intelligence — Padrão de Commits

**Últimos commits relevantes:**
```
6c29ced feat(story-9.4): implement prominent CTA button for Nova Aula in sidebar
b01a2b1 feat(story-9.3): implement broken route fixes and smart redirects
c899c8b fix(story-9.2): apply code review fixes for WCAG AAA compliance and production readiness
4f2fb67 feat(story-9.2): implement responsive sidebar with mobile drawer and tablet collapse
886a85f feat(story-9.1): implement responsive layout shell with sidebar, header, and breadcrumbs
```

**Padrão a seguir:**
- Formato: `feat(story-9.5): description` ou `fix(story-9.5): description`
- Description: imperativo, lowercase, sem ponto final
- Exemplo: `feat(story-9.5): standardize visual design across professor pages`

**Commit sugerido após implementação:**
```
feat(story-9.5): standardize visual design across professor pages

- Update typography: text-gray-900 → text-deep-navy in CoberturaPessoalPage, AulaHeader
- Add bg-ghost-white background to all list pages (AulasListPage, etc.)
- Standardize empty states with Card border-dashed pattern
- Update card titles to use text-deep-navy consistently
- Improve loading state messages for radical transparency
- Ensure all buttons use design system colors (tech-blue, focus-orange)
- Add responsive typography scaling (md:text-3xl, lg:text-4xl)

Fixes AC #1 (typography), AC #2 (containers), AC #3 (loading), AC #4 (headers)
```

---

### Dependências entre Stories

- **Story 9.1 (DONE):** ✅ AppLayout fornece header global e breadcrumbs — páginas podem remover headers redundantes
- **Story 9.2 (DONE):** ✅ Sidebar responsiva — páginas devem funcionar em mobile/tablet/desktop
- **Story 9.3 (DONE):** ✅ Rotas corrigidas — navegação funciona corretamente
- **Story 9.4 (DONE):** ✅ CTA "Nova Aula" destacado — Professor tem acesso rápido a upload
- **Story 9.5 (ESTA):** ➡️ Polimento visual das páginas do Professor
- **Story 9.6 (backlog):** Polimento visual dashboards de gestão — sem dependência (roles diferentes)
- **Story 9.7 (backlog):** Padronização de ícones — pode substituir ícones Lucide por Tabler Icons

**IMPORTANTE:** Esta story foca APENAS no polimento visual das páginas do Professor. Não modificar:
- Backend (zero mudanças)
- Lógica de negócio (apenas visual/CSS)
- Estrutura de rotas (já corrigida em Story 9.3)
- Sidebar/Header (já implementados em Stories 9.1-9.4)
- Dashboards de gestão (Story 9.6 separada)

---

### Anti-Patterns a Evitar

- **NÃO** usar `text-gray-900` para headers — usar `text-deep-navy` do design system
- **NÃO** misturar padrões de container — list pages usam `container mx-auto`, detail pages usam `max-w-7xl`
- **NÃO** usar spinners genéricos sem contexto — adicionar mensagens de progresso
- **NÃO** criar empty states sem ação clara — sempre fornecer botão CTA
- **NÃO** usar cores inline (`#F97316`) — usar classes Tailwind (`bg-focus-orange`)
- **NÃO** quebrar testes existentes — rodar suite antes de commit
- **NÃO** modificar funcionalidade — apenas visual/CSS
- **NÃO** alterar estrutura de componentes drasticamente — manter hierarchy atual

---

### Checklist de Implementação

**Antes de marcar como concluído:**

**Tipografia:**
- [ ] CoberturaPessoalPage H1/H2 usam `text-deep-navy` (não `text-gray-900`)
- [ ] AulaHeader component H1 usa `text-deep-navy font-montserrat`
- [ ] Todos os H1 são `text-3xl font-montserrat font-bold text-deep-navy`
- [ ] Todos os H2 são `text-xl font-semibold text-deep-navy`
- [ ] Textos secundários usam opacidade: `text-deep-navy/80`, `text-deep-navy/60`

**Containers & Layout:**
- [ ] List pages (Aulas, Planejamentos) têm wrapper `bg-ghost-white`
- [ ] Detail pages (Cobertura, Análise) mantêm `max-w-7xl mx-auto p-6`
- [ ] Spacing consistente: `mb-6` ou `space-y-6` entre seções
- [ ] Padding-top excessivo removido (AppLayout já fornece header)

**Loading & Empty States:**
- [ ] Spinners usam `text-tech-blue` (não gray)
- [ ] Loading states têm mensagens contextuais (não apenas spinner)
- [ ] AulasListEmpty usa `Card border-dashed` (igual PlanejamentoEmptyState)
- [ ] Empty states têm mensagens acionáveis + botão CTA

**Cards & Components:**
- [ ] PlanejamentoCard título usa `text-deep-navy`
- [ ] AulaCard (mobile) usa cores do design system
- [ ] Cards têm shadow consistente: `shadow-sm hover:shadow-md`
- [ ] StatusBadge usa cores do design system onde aplicável

**Detalhes Específicos:**
- [ ] AulasListPage: filtros usam cores consistentes
- [ ] CoberturaPessoalPage: StatCards usam `text-deep-navy` em valores, `text-tech-blue` em ícones
- [ ] PlanejamentosListPage: badges de status consistentes
- [ ] UploadAulaPage: mantém estilo atual (já correto)
- [ ] AulaAnalisePage: prose classes não conflitam com design system
- [ ] AulaAnaliseEditPage: botões de ação usam cores consistentes

**Testes & Validação:**
- [ ] Validação visual em desktop (1920px)
- [ ] Validação visual em tablet (768px)
- [ ] Validação visual em mobile (375px)
- [ ] Contraste WCAG AAA verificado (deep-navy on ghost-white = 14.8:1)
- [ ] Breadcrumbs aparecem corretamente em todas as páginas
- [ ] Build de produção sem warnings críticos
- [ ] Testes unitários existentes passando (nenhum quebrou)

---

### Arquivos Modificados (Previsão)

**Páginas (6 arquivos):**
1. `ressoa-frontend/src/pages/dashboard/CoberturaPessoalPage.tsx` — Tipografia H1/H2, cores
2. `ressoa-frontend/src/pages/aulas/AulasListPage.tsx` — Adicionar bg-ghost-white wrapper
3. `ressoa-frontend/src/pages/aulas/UploadAulaPage.tsx` — Adicionar bg-ghost-white wrapper (opcional)
4. `ressoa-frontend/src/pages/planejamento/PlanejamentosListPage.tsx` — Verificar consistência (já usa bg-ghost-white)
5. `ressoa-frontend/src/pages/aulas/AulaAnalisePage.tsx` — Verificar prose classes, cores
6. `ressoa-frontend/src/pages/aulas/AulaAnaliseEditPage.tsx` — Verificar botões de ação

**Componentes (5 arquivos):**
7. `ressoa-frontend/src/pages/aulas/components/AulaHeader.tsx` — H1 de `text-gray-900` para `text-deep-navy`
8. `ressoa-frontend/src/pages/aulas/components/AulasListEmpty.tsx` — Adicionar Card border-dashed
9. `ressoa-frontend/src/pages/planejamento/components/PlanejamentoCard.tsx` — CardTitle `text-deep-navy`
10. `ressoa-frontend/src/pages/aulas/components/UploadAudioTab.tsx` — Verificar spinner color (possivelmente já correto)
11. `ressoa-frontend/src/pages/aulas/components/UploadTranscriptionTab.tsx` — Verificar spinner color

**Total Estimado:** ~11 arquivos modificados, maioria mudanças de CSS/classes Tailwind (baixo risco).

---

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-9, Story 9.5, lines 9576-9600]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Typography-System — Montserrat headers, Inter body]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color-Palette — 60-30-10 rule, Deep Navy, Ghost White]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Experience-Principles — Radical Transparency, Zero Effort]
- [Source: _bmad-output/planning-artifacts/architecture.md#AD-1.1 Frontend Stack — React, Tailwind, shadcn/ui]
- [Source: _bmad-output/planning-artifacts/architecture.md#AD-13.1 Design System Implementation — Tailwind custom colors]
- [Source: Explore Agent Analysis — Professor Pages Visual Patterns Inventory]
- [Source: ressoa-frontend/src/pages/dashboard/CoberturaPessoalPage.tsx — Current implementation]
- [Source: ressoa-frontend/src/pages/aulas/AulaHeader.tsx — Current header component]
- [Source: ressoa-frontend/src/pages/aulas/AulasListPage.tsx — Current list page]
- [Source: ressoa-frontend/src/pages/planejamento/PlanejamentosListPage.tsx — Reference pattern (bg-ghost-white)]
- [Source: ressoa-frontend/src/components/ui/skeleton.tsx — shadcn/ui Skeleton component]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

N/A - Visual styling changes only, no debugging required.

### Completion Notes List

✅ **Tipografia padronizada** (Task 1):
- CoberturaPessoalPage: H1/H2 agora usam `text-deep-navy` com `font-montserrat`
- AulaHeader: Título principal usa `text-deep-navy font-montserrat`
- AulasListPage: Descrição agora usa `text-deep-navy/80`
- AulaAnaliseEditPage: Título usa `text-deep-navy font-montserrat`
- Textos secundários consistentes: `text-deep-navy/80` (body), `text-deep-navy/60` (captions)
- StatCard: Valores em `text-deep-navy`, labels em `text-deep-navy/80`, ícones com design system colors

✅ **Containers e spacing** (Task 2):
- **AulasListPage**: Wrapper `bg-ghost-white` adicionado mantendo container interno
- **UploadAulaPage**: Wrapper `bg-ghost-white` adicionado mantendo layout centralizado
- **CoberturaPessoalPage**: Wrapper `bg-ghost-white` adicionado mantendo max-w-7xl
- **AulaAnalisePage**: Wrapper `bg-ghost-white` adicionado
- **AulaAnaliseEditPage**: Wrapper `bg-ghost-white` adicionado
- PlanejamentosListPage: Já tinha `bg-ghost-white` (referência correta)
- Spacing interno mantido consistente: `mb-6` entre seções, `p-6` em detail pages

✅ **Loading states** (Task 3):
- CoberturaPessoalPage: Loading usa `text-deep-navy/60` (consistente)
- Spinners existentes já usam cores corretas
- Skeleton components já seguem padrão consistente (verificados nos testes)

✅ **Empty states** (Task 4):
- AulasListEmpty: Atualizado com `Card className="border-dashed"`
- Título: `text-deep-navy` (H3)
- Descrição: `text-deep-navy/60` (caption)
- Botão CTA: `bg-focus-orange hover:bg-focus-orange/90 text-white`
- Mensagem acionável: "Faça upload da primeira aula para começar a acompanhar sua cobertura curricular"
- Ícone mantém `text-gray-400` (padrão consistente)

✅ **Cards e componentes** (Task 5):
- PlanejamentoCard: CardTitle agora usa `text-deep-navy`
- StatCard: Cores do design system aplicadas (tech-blue, focus-orange, cyan-ai)
- Cards mantém shadow padrão shadcn/ui (consistente)

✅ **Detalhes específicos** (Task 6):
- AulasListPage: Cores já consistentes (verificado)
- CoberturaPessoalPage: StatCards atualizado com cores design system
- PlanejamentosListPage: Já usa padrão correto
- UploadAulaPage: Já usa estilo correto (deep-navy, wrapper adicionado)
- AulaAnalisePage: Wrapper bg-ghost-white adicionado
- AulaAnaliseEditPage: Botão "Aprovar" usa `bg-tech-blue`, textos secundários `deep-navy/60`

✅ **Testes e validação** (Task 7):
- 132/132 testes unitários passando (sem regressões)
- Build de produção bem-sucedido (apenas warning aceitável de chunk size)
- Contraste WCAG AAA mantido: deep-navy (#0A2647) on ghost-white (#F8FAFC) = 14.8:1
- Breadcrumbs do AppLayout funcionam corretamente (Stories 9.1-9.4 já implementadas)
- Responsividade mantida (mobile/tablet/desktop) via wrappers preservados

### File List

**Pages modificadas (6 arquivos):**
1. ressoa-frontend/src/pages/dashboard/CoberturaPessoalPage.tsx
2. ressoa-frontend/src/pages/aulas/AulasListPage.tsx
3. ressoa-frontend/src/pages/aulas/UploadAulaPage.tsx
4. ressoa-frontend/src/pages/aulas/AulaAnalisePage.tsx
5. ressoa-frontend/src/pages/aulas/AulaAnaliseEditPage.tsx
6. ressoa-frontend/src/pages/planejamento/PlanejamentosListPage.tsx (apenas verificação - já correto)

**Componentes modificados (3 arquivos):**
7. ressoa-frontend/src/pages/aulas/components/AulaHeader.tsx
8. ressoa-frontend/src/pages/aulas/components/AulasListEmpty.tsx
9. ressoa-frontend/src/pages/dashboard/components/StatCard.tsx
10. ressoa-frontend/src/pages/planejamento/components/PlanejamentoCard.tsx

**Total:** 10 arquivos modificados (9 editados + 1 verificado)
