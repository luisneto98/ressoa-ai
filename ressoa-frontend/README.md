# Ressoa AI - Frontend

Inteligência de Aula, Análise e Previsão de Conteúdo.

## Tech Stack

- **React 19** + TypeScript (strict mode)
- **Vite 7** (SWC, HMR)
- **Tailwind CSS 4** (design tokens via `@theme`)
- **shadcn/ui** (Radix UI + Tailwind, copy-paste model)

## Setup

```bash
# Instalar dependências
npm install

# Servidor de desenvolvimento
npm run dev
# → http://localhost:5173

# Build de produção
npm run build

# Preview do build
npm run preview
```

## Estrutura de Pastas

```
src/
├── components/
│   └── ui/          # shadcn/ui (não editar diretamente)
├── hooks/           # Custom React hooks
├── lib/             # Utilitários (cn, helpers)
├── pages/           # Páginas de rota
├── stores/          # Zustand stores (futuro)
├── types/           # TypeScript types/interfaces
├── App.tsx          # Componente raiz
├── main.tsx         # Entry point
└── index.css        # Estilos globais + Tailwind + shadcn
```

## Design System

| Token | Valor | Uso |
|-------|-------|-----|
| Deep Navy | `#0A2647` | Headers, nav, áreas escuras (30%) |
| Tech Blue | `#2563EB` | Botões, links, interativo |
| Cyan AI | `#06B6D4` | Gradientes, features de IA |
| Focus Orange | `#F97316` | CTAs, alertas (10%) |
| Ghost White | `#F8FAFC` | Background principal (60%) |

**Tipografia:** Montserrat (headers) + Inter (body)

## Convenções

- Package manager: `npm`
- Path alias: `@/` → `src/`
- Componentes shadcn: `npx shadcn@latest add <componente>`
- TypeScript strict (sem `any` sem justificativa)
- Tailwind utility classes (evitar CSS custom)
- ES modules (não CommonJS)
