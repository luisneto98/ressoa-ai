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

## Cursos Customizados (Story 11.5)

A plataforma suporta dois tipos de currículo:

### **BNCC (Base Nacional Comum Curricular)**
- Currículo oficial brasileiro (Ensino Fundamental e Médio)
- Objetivos de aprendizagem baseados em habilidades BNCC
- Badge: Tech Blue (#2563EB) com ícone de escola

### **Curso Customizado**
- Preparatórios (concursos, vestibulares, ENEM)
- Idiomas, técnicos e outros cursos livres
- Badge: Cyan AI (#06B6D4) com ícone de certificado
- **Contexto Pedagógico obrigatório:**
  - `objetivo_geral` (100-500 chars) — Propósito do curso
  - `publico_alvo` (20-200 chars) — Quem são os alunos
  - `metodologia` (20-300 chars) — Como ensinar
  - `carga_horaria_total` (8-1000 horas) — Duração total

### Validação Condicional (Zod)
```typescript
// Contexto pedagógico é obrigatório apenas para curriculo_tipo = CUSTOM
turmaFormSchema.refine(
  (data) => {
    if (data.curriculo_tipo === 'CUSTOM') {
      return !!data.contexto_pedagogico?.objetivo_geral // etc
    }
    return true; // BNCC não requer contexto
  }
)
```

### Estrutura de Dados
```typescript
interface ContextoPedagogicoDto {
  objetivo_geral: string;       // Ex: "Preparar alunos para ENEM 2026"
  publico_alvo: string;         // Ex: "Jovens 18-25 anos"
  metodologia: string;          // Ex: "Simulados semanais"
  carga_horaria_total: number;  // Ex: 120 horas
}

interface Turma {
  // ... campos existentes
  curriculo_tipo?: 'BNCC' | 'CUSTOM';
  contexto_pedagogico?: ContextoPedagogicoDto;
}
```
