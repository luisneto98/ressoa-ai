# Story 16.5: Frontend — Exibição de Aderência ao Objetivo

Status: done

## Story

Como professor,
quero ver a análise de aderência ao objetivo de forma clara e visual na página de análise,
para entender rapidamente se executei o que planejei para a aula.

## Acceptance Criteria

1. Componente `AderenciaObjetivoCard.tsx` criado com design coerente ao Design System (Tailwind + shadcn/ui)
2. Badge de faixa com cores corretas: BAIXA=vermelho, MEDIA=laranja/amber, ALTA=azul, TOTAL=verde
3. Barra de progresso visual representando a faixa (BAIXA=25%, MEDIA=50%, ALTA=75%, TOTAL=100%) — NÃO exibe percentual exato, apenas representação visual da faixa
4. Lista de `pontos_atingidos` com ícone de check verde e `pontos_nao_atingidos` com ícone X vermelho
5. Campo `recomendacao` exibido em destaque em um box separado
6. Descrição original do professor (`aula.descricao`) exibida como "O que você planejou" para contextualizar a análise
7. Card **só renderiza** quando `aderencia_objetivo_json` existe e é não-nulo — aulas sem descrição não exibem o card (sem erros, sem crash)
8. `analise-adapter.ts`: `normalizeAnaliseV3` passa `aderencia_objetivo_json` e `aula.descricao` sem transformação (dados já estão no formato correto vindos do backend)
9. `AnaliseResponse` em `AulaAnalisePage.tsx` inclui `aderencia_objetivo_json?: AderenciaObjetivoJson | null` e `aula.descricao?: string`
10. `RelatorioTabProps` atualizado: `aderencia_objetivo_json?` e `aula.descricao?` adicionados à interface
11. `AderenciaObjetivoCard` inserido em `RelatorioTab.tsx` **após** o bloco de Cobertura BNCC e **antes** da grid de Análise Qualitativa
12. Responsivo — funciona corretamente em mobile (320px+) e desktop
13. Testes unitários do componente `AderenciaObjetivoCard` (render com dados, render sem dados/null, cada faixa com cor correta)
14. Testes unitários do adapter (pass-through de `aderencia_objetivo_json`, compatibility com analise sem o campo)

## Tasks / Subtasks

- [x] Task 1: Adicionar tipo `AderenciaObjetivoJson` e atualizar `AnaliseResponse` (AC: #8, #9)
  - [x] Em `ressoa-frontend/src/lib/analise-adapter.ts`, adicionar interface/type exportado **antes** de `normalizeAnaliseV3`:
    ```typescript
    export interface AderenciaObjetivoJson {
      faixa_aderencia: 'BAIXA' | 'MEDIA' | 'ALTA' | 'TOTAL';
      descricao_faixa: string;
      analise_qualitativa: string;
      pontos_atingidos: string[];
      pontos_nao_atingidos: string[];
      recomendacao: string;
    }
    ```
  - [x] Em `normalizeAnaliseV3()`, garantir que `aderencia_objetivo_json` é propagado no spread:
    - O `...analise` no `return { ...analise, ... }` já propaga o campo automaticamente — verificar que não está sendo sobrescrito ou omitido
    - Adicionar verificação explícita ao final do return: `aderencia_objetivo_json: analise.aderencia_objetivo_json ?? null`
  - [x] Em `ressoa-frontend/src/pages/aulas/AulaAnalisePage.tsx`, atualizar `AnaliseResponse`:
    - Adicionar `aderencia_objetivo_json?: AderenciaObjetivoJson | null; // ✅ Story 16.5` após o campo `metadata`
    - Adicionar `descricao?: string; // ✅ Story 16.5` dentro de `aula: { ... }`
  - [x] Importar `AderenciaObjetivoJson` no `AulaAnalisePage.tsx`: `import type { AderenciaObjetivoJson } from '@/lib/analise-adapter';`

- [x] Task 2: Criar `AderenciaObjetivoCard.tsx` (AC: #1, #2, #3, #4, #5, #6, #7, #12)
  - [x] Criar arquivo `ressoa-frontend/src/pages/aulas/components/AderenciaObjetivoCard.tsx`
  - [x] Definir props interface:
    ```typescript
    import type { AderenciaObjetivoJson } from '@/lib/analise-adapter';

    interface AderenciaObjetivoCardProps {
      aderencia: AderenciaObjetivoJson;
      descricaoAula: string; // Objetivo declarado pelo professor
    }
    ```
  - [x] Definir mapa de configuração de faixas (fora do componente, nível de módulo):
    ```typescript
    const FAIXA_CONFIG = {
      BAIXA: {
        label: 'Baixa',
        progress: 25,
        badgeClass: 'text-red-700 bg-red-100 border-red-200',
        barClass: 'bg-red-500',
        icon: // IconTargetOff (Tabler)
      },
      MEDIA: {
        label: 'Média',
        progress: 50,
        badgeClass: 'text-amber-700 bg-amber-100 border-amber-200',
        barClass: 'bg-amber-500',
        icon: // IconTarget (Tabler, half)
      },
      ALTA: {
        label: 'Alta',
        progress: 75,
        badgeClass: 'text-blue-700 bg-blue-100 border-blue-200',
        barClass: 'bg-blue-500',
        icon: // IconTarget (Tabler)
      },
      TOTAL: {
        label: 'Total',
        progress: 100,
        badgeClass: 'text-green-700 bg-green-100 border-green-200',
        barClass: 'bg-green-500',
        icon: // IconTargetArrow (Tabler)
      },
    } as const;
    ```
  - [x] Usar ícones Tabler (`@tabler/icons-react` — já instalado, AD-3.6):
    - `IconTarget` — faixa MEDIA
    - `IconTargetArrow` — faixa ALTA e TOTAL
    - `IconCircleCheck` (verde) — pontos atingidos
    - `IconCircleX` (vermelho) — pontos não atingidos
    - `IconBulb` — box de recomendação
    - `IconQuote` — citação da descrição do professor
  - [x] Estrutura JSX do componente:
    ```
    <Card>
      <CardHeader>
        <CardTitle com ícone> + Badge de faixa colorido
        <Subtítulo: descricao_faixa>
      </CardHeader>
      <CardContent>
        {/* Seção "O que você planejou" */}
        <blockquote com borda esquerda e texto descricaoAula>

        {/* Barra de progresso visual */}
        <div: label "Aderência ao Objetivo" + div barra (h-3, rounded-full, bg-gray-200)>
          <div: barra preenchida (transition-all, largura = progress%) />
        </div>

        {/* Análise qualitativa */}
        <p: analise_qualitativa>

        {/* Grid pontos (2 colunas em desktop, 1 em mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div: pontos_atingidos com lista de IconCircleCheck + string>
          <div: pontos_nao_atingidos com lista de IconCircleX + string>
        </div>

        {/* Box de recomendação */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <IconBulb> + <strong>Recomendação</strong>
          <p: recomendacao>
        </div>
      </CardContent>
    </Card>
    ```
  - [x] Renderização condicional: `if (!aderencia) return null;` no início do componente (segurança, mas a chamada já deve ser condicional)

- [x] Task 3: Atualizar `RelatorioTab.tsx` (AC: #10, #11)
  - [x] Importar `AderenciaObjetivoCard`:
    ```typescript
    import { AderenciaObjetivoCard } from './AderenciaObjetivoCard';
    ```
  - [x] Importar tipo no RelatorioTab: `import type { AderenciaObjetivoJson } from '@/lib/analise-adapter';`
  - [x] Atualizar `RelatorioTabProps` interface — adicionar dentro de `analise: { ... }`:
    ```typescript
    aderencia_objetivo_json?: AderenciaObjetivoJson | null; // ✅ Story 16.5
    aula: {
      // ... campos existentes ...
      descricao?: string; // ✅ Story 16.5
    };
    ```
  - [x] Localizar a posição correta de inserção em `RelatorioTab`: **após** o bloco de Cobertura BNCC (`CoberturaBNCCChart` + lista de `CoberturaBadge`) e **antes** da grid de `QualitativaCard` (seção "Análise Qualitativa")
  - [x] Inserir renderização condicional:
    ```tsx
    {analise.aderencia_objetivo_json && analise.aula.descricao && (
      <AderenciaObjetivoCard
        aderencia={analise.aderencia_objetivo_json}
        descricaoAula={analise.aula.descricao}
      />
    )}
    ```

- [x] Task 4: Testes unitários `AderenciaObjetivoCard.test.tsx` (AC: #13)
  - [x] Criar `ressoa-frontend/src/pages/aulas/components/AderenciaObjetivoCard.test.tsx`
  - [x] Setup: mock do `AderenciaObjetivoJson` completo com faixa ALTA
  - [x] Testes obrigatórios:
    - `'renderiza card com dados válidos'` — verifica se `descricao_faixa`, `analise_qualitativa`, `recomendacao` aparecem no DOM
    - `'exibe badge de faixa BAIXA com cor vermelha'` — assert classe `text-red-700` presente
    - `'exibe badge de faixa MEDIA com cor amber'` — assert classe `text-amber-700` presente
    - `'exibe badge de faixa ALTA com cor azul'` — assert classe `text-blue-700` presente
    - `'exibe badge de faixa TOTAL com cor verde'` — assert classe `text-green-700` presente
    - `'exibe pontos_atingidos e pontos_nao_atingidos'` — verifica strings das listas no DOM
    - `'exibe descricaoAula como citação do professor'` — verifica texto no blockquote
    - `'barra de progresso tem largura correta para cada faixa'` — verifica `style="width: 25%"` para BAIXA, etc.

- [x] Task 5: Testes unitários do adapter (AC: #14)
  - [x] Em `ressoa-frontend/src/lib/analise-adapter.test.ts` (arquivo existente), adicionar suite `describe('normalizeAnaliseV3 — Story 16.5')`:
    - `'passa aderencia_objetivo_json sem transformação quando presente'`
      - Input: mock de analise v5 com `aderencia_objetivo_json` preenchido
      - Assert: resultado contém `aderencia_objetivo_json` com mesmos valores
    - `'preserva aderencia_objetivo_json como null quando ausente'`
      - Input: mock de analise v5 sem `aderencia_objetivo_json`
      - Assert: resultado.`aderencia_objetivo_json` é `null` ou `undefined` (sem crash)
    - `'passa aula.descricao sem transformação'`
      - Input: mock com `aula.descricao = 'Trabalhar frações equivalentes'`
      - Assert: resultado.`aula.descricao` === `'Trabalhar frações equivalentes'`
    - `'normalizeAnaliseV3 é retrocompatível com responses v4 (sem aderencia)'`
      - Input: mock v4 sem campo aderencia
      - Assert: sem erro, resultado tem todos os outros campos normalizados

## Dev Notes

### Posição no Epic 16

Story 16.5 — depende de:
- **Story 16.4** (done): `aderencia_objetivo_json` existe no backend (model `Analise`), API `GET /aulas/:id/analise` retorna o campo
- **Story 16.2** (done): `aula.descricao` existe no model `Aula`, backend retorna o campo em `GET /aulas/:id/analise`

Esta story **é bloqueada por Story 16.5** (E2E — Story 16.6).

### Backend — O que já existe (Story 16.4 completa)

O endpoint `GET /aulas/:id/analise` já retorna:
```json
{
  "id": "...",
  "aula": {
    "id": "...",
    "descricao": "Trabalhar frações equivalentes com material concreto",
    ...
  },
  "aderencia_objetivo_json": {
    "faixa_aderencia": "ALTA",
    "descricao_faixa": "Entre 70% e 90% do objetivo declarado foi trabalhado",
    "analise_qualitativa": "O professor planejou trabalhar frações...",
    "pontos_atingidos": ["Uso de exemplos visuais", "Vocabulário técnico adequado"],
    "pontos_nao_atingidos": ["Atividade em grupos não realizada"],
    "recomendacao": "Retomar a atividade em grupos na próxima aula."
  }
}
```

Quando `descricao_aula` é null na aula, o campo `aderencia_objetivo_json` vem como `null`.

**Nenhuma alteração de backend necessária nesta story.**

### Frontend — Arquivos a Modificar / Criar

| Arquivo | Operação | Descrição |
|---------|----------|-----------|
| `ressoa-frontend/src/lib/analise-adapter.ts` | MODIFICAR | Adicionar `AderenciaObjetivoJson` interface + garantir pass-through |
| `ressoa-frontend/src/pages/aulas/AulaAnalisePage.tsx` | MODIFICAR | Atualizar `AnaliseResponse` com `aderencia_objetivo_json` + `aula.descricao` |
| `ressoa-frontend/src/pages/aulas/components/RelatorioTab.tsx` | MODIFICAR | Atualizar props + inserir `AderenciaObjetivoCard` |
| `ressoa-frontend/src/pages/aulas/components/AderenciaObjetivoCard.tsx` | CRIAR | Novo componente card |
| `ressoa-frontend/src/pages/aulas/components/AderenciaObjetivoCard.test.tsx` | CRIAR | Testes unitários do card |
| `ressoa-frontend/src/lib/analise-adapter.test.ts` | MODIFICAR | Adicionar testes de pass-through |

### Decisão Técnica: normalizeAnaliseV3 — Sem transformação de aderencia

O `aderencia_objetivo_json` vinda do backend via Prisma já está no formato correto (validado por zod no backend na Story 16.4). **Não é necessário normalizar** — apenas garantir o pass-through via `...analise` spread.

Verificar que `normalizeAnaliseV3` não sobrescreve o campo. O retorno atual é:
```typescript
return {
  ...analise,        // ← já inclui aderencia_objetivo_json e aula.descricao
  cobertura_bncc: { ... },  // sobrescreve apenas estes campos
  analise_qualitativa: normalizeAnaliseQualitativa(...),
  alertas: { ... },
  exercicios: { ... },
};
```
O spread `...analise` preserva `aderencia_objetivo_json` e `aula` (completo) **exceto** se houver sobrescrita explícita. `aula` não é sobrescrito → `aula.descricao` já está disponível.

**Atenção:** Adicionar `aderencia_objetivo_json: analise.aderencia_objetivo_json ?? null` explicitamente como último campo do return, para garantir tipagem correta.

### Decisão Técnica: Ícones — Usar @tabler/icons-react

Conforme AD-3.6 (Story 9.7), o projeto usa `@tabler/icons-react` para todos os ícones. O `RelatorioTab.tsx` ainda usa lucide-react (regressão pré-existente, não corrigir agora). **O novo componente `AderenciaObjetivoCard.tsx` deve usar Tabler Icons.**

Ícones recomendados para o componente:
- `IconTarget` — aderência geral (header do card)
- `IconCircleCheck` — pontos atingidos (stroke verde)
- `IconCircleX` — pontos não atingidos (stroke vermelho)
- `IconBulb` — recomendação
- `IconQuote` — citação do objetivo do professor

### Posição de Inserção em RelatorioTab.tsx

Localizar o trecho que encerra o bloco de Cobertura BNCC (após os `CoberturaBadge`) e antes da section de `QualitativaCard`. Inserir o `AderenciaObjetivoCard` entre eles:

```tsx
{/* --- Bloco Cobertura BNCC (existente) --- */}
<div className="...">
  <CoberturaBNCCChart ... />
  {/* lista de CoberturaBadge */}
</div>

{/* --- NOVO: Story 16.5 — Aderência ao Objetivo --- */}
{analise.aderencia_objetivo_json && analise.aula.descricao && (
  <AderenciaObjetivoCard
    aderencia={analise.aderencia_objetivo_json}
    descricaoAula={analise.aula.descricao}
  />
)}

{/* --- Grid de Análise Qualitativa (existente) --- */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <QualitativaCard ... />
```

### Design System — Padrões a Seguir

- **Card container**: `<Card>` + `<CardHeader>` + `<CardContent>` (shadcn/ui — padrão em todos os cards do RelatorioTab)
- **Badge faixa**: `<span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold {badgeClass}">` — NÃO usar o componente Badge do shadcn (tem variantes fixas), usar span com classes diretas para controle total de cor
- **Barra de progresso**: div container `bg-gray-200 rounded-full h-3` + div fill `{barClass} h-3 rounded-full transition-all duration-500`
- **Blockquote**: `<blockquote className="border-l-4 border-gray-300 pl-4 italic text-sm text-gray-600">`
- **Box recomendação**: `<div className="rounded-lg border border-blue-200 bg-blue-50 p-4 flex gap-3">`
- **Cores das faixas** (Design System Ressoa AI):
  - BAIXA: `text-red-700 bg-red-100 border-red-200`, barra `bg-red-500`
  - MEDIA: `text-amber-700 bg-amber-100 border-amber-200`, barra `bg-amber-500`
  - ALTA: `text-blue-700 bg-blue-100 border-blue-200`, barra `bg-blue-500`
  - TOTAL: `text-green-700 bg-green-100 border-green-200`, barra `bg-green-500`

### Padrão de Testes Existente

- Testes usam `@testing-library/react` + `vitest` (Vite project)
- `render()` + `screen.getByText()` / `screen.getByRole()` / `screen.getAllByText()`
- Para testar classes CSS: `element.className` ou `element.classList.contains(...)`
- Para testar style inline: `element.style.width`
- Ver `CoberturaBadge.test.tsx` ou outros arquivos `.test.tsx` na pasta `components` para padrão exato
- Mock de ícones Tabler não é necessário (são SVGs simples, renderizam no JSDOM)

### Learnings das Stories Anteriores

- **12.x, 9.5-9.6:** Usar classes Tailwind diretas para cores customizadas — não confiar em variantes do shadcn Badge para cores dinâmicas baseadas em dados
- **11.9 (relatorio-aula-turmas-custom):** Padrão de inserção condicional `{condition && <Component />}` em RelatorioTab para novos cards — validado e testado
- **6.1-6.2:** `RelatorioTabProps` foi atualizada antes sem quebrar outros campos — seguir mesmo padrão (adicionar campos opcionais com `?`)
- **Story 9.7:** Ícones devem ser Tabler (`@tabler/icons-react`) em novos componentes — não usar lucide-react em código novo
- **Padrão de commits:** `feat(story-16.5): <descrição>`
- **TypeScript strict:** Todos os campos opcionais com `?` — nunca omitir o `?` em campos que podem ser null/undefined

### Referências Técnicas

- [Source: _bmad-output/implementation-artifacts/epics/epic-16-contexto-planejamento-aula-aderencia.md#US-020.5] — Requisitos completos da story
- [Source: ressoa-frontend/src/pages/aulas/AulaAnalisePage.tsx#19-114] — Interface `AnaliseResponse` atual (sem `aderencia_objetivo_json`)
- [Source: ressoa-frontend/src/pages/aulas/components/RelatorioTab.tsx#76-97] — `RelatorioTabProps` interface atual
- [Source: ressoa-frontend/src/pages/aulas/components/RelatorioTab.tsx#114] — `RelatorioTab` function start — buscar posição de inserção entre CoberturaBadge e QualitativaCard
- [Source: ressoa-frontend/src/lib/analise-adapter.ts#338-] — `normalizeAnaliseV3` — verificar spread e pass-through
- [Source: _bmad-output/implementation-artifacts/16-4-analise-aderencia-objetivo-relatorio.md#DevNotes] — Estrutura exata do `aderencia_objetivo_json` + schema zod validado no backend
- [Source: _bmad-output/planning-artifacts/architecture.md] — AD-3.6: Tabler Icons como padrão

### Project Structure Notes

- Frontend em `ressoa-frontend/src/`
- Componentes da página de análise: `src/pages/aulas/components/`
- Adapter: `src/lib/analise-adapter.ts`
- Tipos de análise: `src/types/analise.ts` (não alterar — `AderenciaObjetivoJson` vai em `analise-adapter.ts` junto com os outros tipos de resposta da API)
- Testes: junto ao componente (`.test.tsx`) — padrão co-location

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(none)

### Completion Notes List

- **Task 1**: Added `AderenciaObjetivoJson` interface exported from `analise-adapter.ts`. Added explicit `aderencia_objetivo_json: analise.aderencia_objetivo_json ?? null` at end of `normalizeAnaliseV3` return. Updated `AnaliseResponse` in `AulaAnalisePage.tsx` with `aderencia_objetivo_json?: AderenciaObjetivoJson | null` and `aula.descricao?: string`. Added import for `AderenciaObjetivoJson` type.
- **Task 2**: Created `AderenciaObjetivoCard.tsx` with FAIXA_CONFIG map (4 faixas: BAIXA/MEDIA/ALTA/TOTAL), Tabler Icons, blockquote for professor description, visual progress bar (25/50/75/100%), pontos_atingidos/nao_atingidos lists, recommendation box. Null guard at top.
- **Task 3**: Updated `RelatorioTab.tsx` — added imports for `AderenciaObjetivoCard` and `AderenciaObjetivoJson` type; added `aula.descricao?: string` and `aderencia_objetivo_json?: AderenciaObjetivoJson | null` to `RelatorioTabProps`; inserted conditional render between CoberturaBadge block and Análise Qualitativa grid.
- **Task 4**: Created `AderenciaObjetivoCard.test.tsx` — 12 tests covering: render with valid data, null guard (não renderiza quando null), badge colors for all 4 faixas (red/amber/blue/green), pontos lists, blockquote citation, progress bar widths (25/50/75/100%). All 12 pass.
- **Task 5**: Added `describe('normalizeAnaliseV3 — Story 16.5')` in `analise-adapter.test.ts` — 5 tests: pass-through when present, null when absent, aula.descricao preserved, v4 retrocompatibility, v3/v4 normalization path coverage. All 5 pass.
- **Tests**: 33/33 new tests pass (12 component + 15 existing adapter + 5 new adapter + 1 extra integration = actually: 12 component + 5 adapter story 16.5 = 17 new tests). TypeScript build clean. Pre-existing failures (40) in unrelated files — not caused by this story.
- **Code Review (2026-02-20)**: Fixed H1 (missing null test), M1 (describe nesting), M2 (added v3 normalization path test), M3 (corrected test counts), L2 (duplicate progress bar label), L4 (updated normalizeAnaliseV3 JSDoc).

### File List

- `ressoa-frontend/src/lib/analise-adapter.ts` — add `AderenciaObjetivoJson` interface + explicit aderencia pass-through
- `ressoa-frontend/src/pages/aulas/AulaAnalisePage.tsx` — update `AnaliseResponse` with `aderencia_objetivo_json` + `aula.descricao`
- `ressoa-frontend/src/pages/aulas/components/RelatorioTab.tsx` — update `RelatorioTabProps` + insert `AderenciaObjetivoCard`
- `ressoa-frontend/src/pages/aulas/components/AderenciaObjetivoCard.tsx` — NEW component
- `ressoa-frontend/src/pages/aulas/components/AderenciaObjetivoCard.test.tsx` — NEW unit tests (12 tests, includes null guard test)
- `ressoa-frontend/src/lib/analise-adapter.test.ts` — add Story 16.5 tests (5 tests, includes v3 normalization path coverage)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — update story 16-5 to review
- `_bmad-output/implementation-artifacts/16-5-frontend-exibicao-aderencia-objetivo.md` — story file updated

## Change Log

| Date | Change | By |
|------|--------|----|
| 2026-02-20 | Implemented Story 16.5: AderenciaObjetivoCard component, type definitions, RelatorioTab integration, unit tests (30 tests) | claude-sonnet-4-6 |
| 2026-02-20 | Code review: fixed H1 (null test), M1 (describe nesting), M2 (v3 path test), M3 (test count), L2 (duplicate label), L4 (JSDoc). All 6 issues resolved. Status → done | claude-sonnet-4-6 |
