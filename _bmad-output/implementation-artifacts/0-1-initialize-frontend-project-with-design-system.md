# Story 0.1: Initialize Frontend Project with Design System

Status: done

---

## Story

As a **desenvolvedor**,
I want **um projeto frontend configurado com React 18, TypeScript, Tailwind CSS e shadcn/ui**,
So that **posso começar a implementar features de negócio imediatamente sem me preocupar com setup inicial**.

---

## Acceptance Criteria

**Given** o repositório frontend não existe
**When** executo o comando `npm create vite@latest ressoa-frontend -- --template react-ts`
**Then** o projeto React 18 + TypeScript é criado com estrutura padrão Vite

**Given** o projeto Vite foi criado
**When** executo os passos de configuração do Tailwind CSS:
- `npm install -D tailwindcss postcss autoprefixer`
- `npx tailwindcss init -p`
- Configuro `tailwind.config.js` com paths corretos
- Adiciono diretivas Tailwind no `index.css`
**Then** Tailwind CSS está funcional e classes utilitárias funcionam nos componentes

**Given** Tailwind CSS está configurado
**When** executo os passos de configuração do shadcn/ui:
- Configuro path aliases em `tsconfig.json` e `tsconfig.app.json` (`@/*`)
- Configuro `vite.config.ts` com path resolution
- Executo `npx shadcn@latest init`
- Seleciono theme: Default, CSS variables: Yes, Color: Deep Navy (#0A2647)
**Then** shadcn/ui está instalado e componentes podem ser adicionados via CLI

**Given** shadcn/ui está configurado
**When** adiciono componentes base essenciais:
- `npx shadcn@latest add button`
- `npx shadcn@latest add input`
- `npx shadcn@latest add toast`
**Then** os componentes estão em `src/components/ui/` e podem ser importados

**Given** a estrutura básica está pronta
**When** crio estrutura de pastas:
```
src/
├── components/
│   └── ui/          # shadcn/ui components
├── lib/             # utils
├── hooks/           # custom hooks
├── pages/           # route pages
├── App.tsx
└── main.tsx
```
**Then** a estrutura está pronta para desenvolvimento

**Given** todas configurações estão completas
**When** executo `npm run dev`
**Then** o servidor de desenvolvimento inicia em `http://localhost:5173` sem erros

**And** uma página inicial simples renderiza com título "Ressoa AI" usando tipografia Montserrat (headers) e componentes shadcn/ui

---

## Tasks / Subtasks

- [x] Task 1: Setup Vite + React 18 + TypeScript Project (AC: 1)
  - [x] Criar projeto com `npm create vite@latest ressoa-frontend -- --template react-ts`
  - [x] Executar `npm install` para instalar dependências
  - [x] Validar que `npm run dev` inicia sem erros

- [x] Task 2: Configure Tailwind CSS (AC: 2)
  - [x] Instalar Tailwind CSS e dependências: `npm install -D tailwindcss postcss autoprefixer`
  - [x] Inicializar config via `@tailwindcss/vite` plugin (Tailwind v4 - sem `tailwind.config.js`, usa `@theme` em CSS)
  - [x] Configurar design tokens (cores, fontes, tamanhos) via `@theme` no `index.css`
  - [x] Adicionar `@import "tailwindcss"` no arquivo CSS principal (Tailwind v4 syntax)
  - [x] Testar classes utilitárias em componente de exemplo

- [x] Task 3: Configure shadcn/ui (AC: 3)
  - [x] Configurar path aliases `@/*` em `tsconfig.json` e `tsconfig.app.json`
  - [x] Configurar path resolution em `vite.config.ts`
  - [x] Executar `npx shadcn@latest init` com opções corretas (ver Dev Notes)
  - [x] Validar criação de `components.json`

- [x] Task 4: Add Base Components (AC: 4)
  - [x] Adicionar Button: `npx shadcn@latest add button`
  - [x] Adicionar Input: `npx shadcn@latest add input`
  - [x] Adicionar Sonner (toast): `npx shadcn@latest add sonner` (toast renomeado para sonner em shadcn v4)
  - [x] Validar que componentes estão em `src/components/ui/`

- [x] Task 5: Create Folder Structure (AC: 5)
  - [x] Criar diretórios: `components/`, `lib/`, `hooks/`, `pages/`, `stores/`
  - [x] Criar subdiretório `components/ui/` (se não existir)
  - [x] Validar estrutura contra padrão documentado (ver Dev Notes)

- [x] Task 6: Create Landing Page with Branding (AC: 6, 7)
  - [x] Instalar fontes Google: Montserrat (Bold 700) e Inter (Regular 400)
  - [x] Criar página inicial simples com título "Ressoa AI" usando Montserrat
  - [x] Aplicar cores do design system (Deep Navy, Ghost White)
  - [x] Testar responsividade básica (mobile, tablet, desktop)
  - [x] Validar que `npm run dev` inicia servidor em `http://localhost:5173`

- [x] Task 7: Documentation & Cleanup (Meta)
  - [x] Criar `README.md` no projeto frontend com instruções de setup
  - [x] Remover arquivos de exemplo desnecessários do template Vite
  - [x] Validar que build de produção funciona: `npm run build`

---

## Dev Notes

### 🎯 CRITICAL CONTEXT FOR IMPLEMENTATION

**Product Name:** Ressoa AI (NÃO "Professor Analytics")
**Tagline:** "Inteligência de Aula, Análise e Previsão de Conteúdo"

Este é o **PRIMEIRO story do projeto** - você está criando a fundação do frontend. Tudo que você configurar aqui será usado pelas próximas 43 histórias. **Seja meticuloso**.

---

### Technical Requirements

#### Frontend Tech Stack (Architecture Decision #7)

- **React:** Version 18+ (concurrent features, Suspense, automatic batching)
- **TypeScript:** Version 5+ (strict mode enabled)
- **Build Tool:** Vite 5+ (SWC transformer for fast HMR)
- **Module Resolution:** ES2020+
- **Package Manager:** npm (consistent with NestJS backend)

**Starter Template:** Use official Vite React-TypeScript template:
```bash
npm create vite@latest ressoa-frontend -- --template react-ts
```

#### Path Aliases Configuration

Configure `@` alias to point to `src/`:

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**vite.config.ts:**
```typescript
import path from "path"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

---

### Design System Configuration (UX Design Specification)

#### Color Palette (Exact Hex Values)

Configure these in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'deep-navy': '#0A2647',      // Primary (30% usage) - Headers, nav, dark areas
        'tech-blue': '#2563EB',      // Secondary - Buttons, links, interactive
        'cyan-ai': '#06B6D4',        // AI Accent - Gradients, AI-related features
        'focus-orange': '#F97316',   // CTA/Alerts (10% usage) - High-attention actions
        'ghost-white': '#F8FAFC',    // Background (60% usage) - Main background
      },
    },
  },
}
```

**Accessibility Requirement:** Deep Navy on Ghost White = 14.8:1 contrast (WCAG AAA compliant)

#### Typography Configuration

**Fonts:**
- **Headers:** Montserrat (weights: 600 Semi-Bold, 700 Bold) - Modern, geometric
- **Body:** Inter (weights: 400 Regular, 500 Medium) - Optimized for screens

Add to `index.html` or install via npm:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
```

**Type Scale (tailwind.config.js):**
```javascript
theme: {
  extend: {
    fontFamily: {
      montserrat: ['Montserrat', 'sans-serif'],
      inter: ['Inter', 'sans-serif'],
    },
    fontSize: {
      'h1': '48px',   // Headers only
      'h2': '32px',   // Section titles
      'h3': '24px',   // Subsections
      'body': '16px', // Default text
      'caption': '14px', // Small text
    },
  },
}
```

#### shadcn/ui Configuration

**Installation Steps:**
```bash
npx shadcn@latest init
```

**CLI Options to Choose:**
- Style: Default
- Base color: Slate (or customize with Deep Navy)
- CSS variables: Yes
- CSS location: `src/index.css`
- Import alias: `@/components`
- React Server Components: No
- TypeScript: Yes

**Essential Base Components to Add Immediately:**
```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add toast
```

**Why shadcn/ui?** (Architecture Decision #9)
- Built on Radix UI (accessibility primitives with ARIA, keyboard nav)
- Copy-paste model (no package dependency, full control)
- Tailwind-based (seamless integration)
- WCAG AAA compliant by default

---

### Folder Structure Standards (Architecture Decision #8)

```
ressoa-frontend/
├── src/
│   ├── components/
│   │   ├── ui/                # shadcn/ui components (DO NOT edit directly)
│   │   └── [feature]/         # Feature-specific components (e.g., auth/, upload/)
│   ├── lib/
│   │   └── utils.ts           # shadcn classname helper (cn function)
│   ├── hooks/                 # Custom React hooks
│   │   └── use-*.ts
│   ├── pages/                 # Route pages (lazy-loadable for code splitting)
│   │   └── *.tsx
│   ├── stores/                # Zustand stores (will be added in future stories)
│   │   ├── auth.store.ts
│   │   ├── aula.store.ts
│   │   └── ui.store.ts
│   ├── types/                 # TypeScript types/interfaces
│   │   └── *.types.ts
│   ├── App.tsx                # Root component with routing
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles + Tailwind directives
├── public/                    # Static assets
├── index.html                 # HTML entry
├── vite.config.ts             # Vite configuration
├── tailwind.config.js         # Tailwind + design tokens
├── tsconfig.json              # TypeScript config
└── package.json
```

**CRITICAL:** Create ALL directories immediately (even if empty) to prevent import errors in future stories.

---

### Architecture Compliance

#### Responsive Design (Architecture Decision #10)

Configure Tailwind breakpoints:
```javascript
theme: {
  screens: {
    'sm': '640px',   // Mobile landscape, tablets
    'md': '768px',   // Tablets portrait
    'lg': '1024px',  // Desktop
    'xl': '1280px',  // Large desktop
  },
}
```

**Mobile-First Approach:** Design for 4G connections in Brazilian schools.

#### Accessibility Requirements (UX Design - Accessibility Section)

- **Touch Targets:** Minimum 44×44px (configure in Button component)
- **Keyboard Navigation:** All interactive elements must be keyboard-accessible
- **Focus States:** Visible focus ring (2px Tech Blue border)
- **ARIA Labels:** Radix primitives handle this automatically

---

### Library/Framework Requirements

#### Core Dependencies (Install Immediately)

```bash
# Styling
npm install -D tailwindcss postcss autoprefixer

# shadcn/ui will install these automatically:
# - @radix-ui/* (primitives)
# - class-variance-authority (variant styling)
# - clsx (classname utility)
# - tailwind-merge (tailwind class merging)
```

#### Future Dependencies (DO NOT install in this story)

These will be added in subsequent stories:
- `zustand` - State management (Story 1.7 - Frontend Login)
- `@tanstack/react-query` - Server state (Story 1.7)
- `axios` - HTTP client (Story 1.7)
- `react-router-dom` - Routing (Story 1.7)
- `react-hook-form` - Forms (Story 1.7)
- `zod` - Validation (Story 1.7)

---

### File Structure Requirements

#### Entry Point (main.tsx)

Keep it minimal:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

#### Global Styles (index.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-ghost-white text-deep-navy font-inter;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-montserrat font-bold;
  }
}
```

#### Landing Page (App.tsx for now)

Create a simple branded landing page:
```tsx
import { Button } from '@/components/ui/button'

function App() {
  return (
    <div className="min-h-screen bg-ghost-white flex flex-col items-center justify-center p-4">
      <h1 className="text-h1 font-montserrat font-bold text-deep-navy mb-4">
        Ressoa AI
      </h1>
      <p className="text-body text-center max-w-md mb-8 text-gray-600">
        Inteligência de Aula, Análise e Previsão de Conteúdo
      </p>
      <Button className="bg-tech-blue hover:bg-tech-blue/90">
        Começar
      </Button>
    </div>
  )
}

export default App
```

---

### Testing Requirements

#### Validation Checklist

- [ ] **Build Test:** `npm run build` succeeds without errors
- [ ] **Dev Server:** `npm run dev` starts and serves at `http://localhost:5173`
- [ ] **Hot Module Replacement (HMR):** Edit `App.tsx` and see instant changes
- [ ] **TypeScript:** No `tsc` errors when running `npx tsc --noEmit`
- [ ] **Tailwind Classes:** Apply `bg-deep-navy` to element and see color change
- [ ] **shadcn/ui Components:** Import and render `<Button>` successfully
- [ ] **Path Alias:** Import using `@/components/ui/button` works
- [ ] **Fonts Loaded:** Inspect element and see Montserrat on headers, Inter on body
- [ ] **Responsive:** Resize browser and see layout adapt (mobile, tablet, desktop)
- [ ] **Accessibility:** Tab navigation works, focus states visible

#### Manual Testing Steps

1. Run `npm run dev` and open `http://localhost:5173`
2. Verify "Ressoa AI" title renders with Montserrat font
3. Verify Button component renders with Tech Blue background
4. Inspect element - confirm Tailwind classes are applied
5. Resize window - confirm responsive behavior
6. Press Tab key - confirm focus states are visible
7. Check browser console - no errors or warnings

---

### Project Context Reference

**No `project-context.md` file exists yet** - you are creating the foundation that will define project conventions.

**Guidelines to Establish:**
- Use `npm` for all package management (NOT yarn or pnpm)
- Use TypeScript strict mode (NO `any` types without justification)
- Use Tailwind utility classes (avoid custom CSS unless absolutely necessary)
- Follow shadcn/ui conventions (copy components, customize via variants)
- Use ES modules (NOT CommonJS)
- Prefer named exports over default exports (except pages)

---

### References

- [Source: architecture.md - Decisão #7 "Frontend Stack"]
- [Source: architecture.md - Decisão #8 "Folder Structure"]
- [Source: architecture.md - Decisão #9 "UI Component Library"]
- [Source: ux-design-specification.md - Section "Design System"]
- [Source: ux-design-specification.md - Section "Colors"]
- [Source: ux-design-specification.md - Section "Typography"]
- [Source: ux-design-specification.md - Section "Accessibility"]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Tailwind CSS v4 instalado (4.1.18) em vez de v3 - v4 usa `@theme` em CSS em vez de `tailwind.config.js`. Configuração adaptada mantendo todos os design tokens.
- `npx tailwindcss init -p` não funciona em v4 - usado `@tailwindcss/vite` plugin como alternativa recomendada.
- shadcn/ui `toast` renomeado para `sonner` na versão mais recente (3.8.4). Instalado `sonner` como substituto funcional equivalente.
- CSS de shadcn/ui adicionou `@layer base` duplicado - consolidado manualmente para manter nossos design tokens (body: bg-ghost-white, text-deep-navy, font-inter).

### Completion Notes List

- ✅ Projeto Vite criado com React 19.2.0, TypeScript 5.9.3, Vite 7.3.1 (todas versões ≥ spec) + SWC plugin
- ✅ Tailwind CSS 4.1.18 configurado com todos design tokens: 5 cores (deep-navy, tech-blue, cyan-ai, focus-orange, ghost-white), 2 font families (montserrat, inter), 5 font sizes (h1-caption)
- ✅ shadcn/ui configurado com new-york style, CSS variables, path aliases (@/*)
- ✅ 3 componentes base: Button, Input, Sonner (toast)
- ✅ Estrutura de pastas: components/ui/, lib/, hooks/, pages/, stores/, types/
- ✅ Landing page com branding: "Ressoa AI", Montserrat headers, Inter body, Button shadcn/ui com Tech Blue
- ✅ Google Fonts carregadas via preconnect + link (Montserrat 600,700 + Inter 400,500)
- ✅ `lang="pt-BR"` no HTML, título "Ressoa AI"
- ✅ Acessibilidade: Button com min-h-[44px] (touch target), Radix UI ARIA automático
- ✅ `npm run build` (tsc + vite build) sem erros
- ✅ `npm run dev` em http://localhost:5173 sem erros
- ✅ `npx tsc --noEmit` sem erros TypeScript

### File List

**Novos arquivos criados:**
- `ressoa-frontend/package.json`
- `ressoa-frontend/package-lock.json`
- `ressoa-frontend/vite.config.ts`
- `ressoa-frontend/tsconfig.json`
- `ressoa-frontend/tsconfig.app.json`
- `ressoa-frontend/tsconfig.node.json`
- `ressoa-frontend/index.html`
- `ressoa-frontend/components.json`
- `ressoa-frontend/README.md`
- `ressoa-frontend/eslint.config.js`
- `ressoa-frontend/public/vite.svg`
- `ressoa-frontend/src/main.tsx`
- `ressoa-frontend/src/App.tsx`
- `ressoa-frontend/src/index.css`
- `ressoa-frontend/src/lib/utils.ts`
- `ressoa-frontend/src/components/ui/button.tsx`
- `ressoa-frontend/src/components/ui/input.tsx`
- `ressoa-frontend/src/components/ui/sonner.tsx`

**Diretórios criados (vazios, para uso futuro):**
- `ressoa-frontend/src/hooks/`
- `ressoa-frontend/src/pages/`
- `ressoa-frontend/src/stores/`
- `ressoa-frontend/src/types/`

**Arquivos removidos (template Vite):**
- `ressoa-frontend/src/App.css` (removido)
- `ressoa-frontend/src/assets/react.svg` (removido)

### Change Log

- **2026-02-10:** Story 0.1 implementada - Projeto frontend Ressoa AI criado com React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + shadcn/ui. Design system configurado com paleta de cores, tipografia e componentes base.
- **2026-02-10:** Code Review (AI) - 10 issues encontrados (4 HIGH, 3 MEDIUM, 3 LOW). Todos HIGH e MEDIUM corrigidos:
  - [HIGH] Substituído `@vitejs/plugin-react` (Babel) por `@vitejs/plugin-react-swc` (SWC) - Architecture Decision #7
  - [HIGH] Removido `next-themes` (pacote Next.js) e corrigido `sonner.tsx` para usar theme="light" sem dependência externa
  - [HIGH] Mapeado `--primary` para Deep Navy (#0A2647) e `--primary-foreground` para Ghost White (#F8FAFC) no shadcn theme
  - [HIGH] Removidos 2 arquivos fantasma da File List (postcss.config.js, vite-env.d.ts)
  - [MEDIUM] Movido `@tailwindcss/vite` de dependencies para devDependencies
  - [MEDIUM] Removidas dependências desnecessárias: `postcss`, `autoprefixer`
  - [MEDIUM] Button default height alterado de h-9 (36px) para h-11 (44px) - acessibilidade WCAG touch target
  - [LOW] Removido diretório `src/assets/` vazio (remnant do template Vite)
  - [LOW] Mapeado `--ring` para Tech Blue (#2563EB) para focus states conforme UX spec
