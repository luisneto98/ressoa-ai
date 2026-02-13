# Story 11.6 Creation Summary

**Story:** Frontend — Gestão de Objetivos Customizados no Planejamento
**Status:** ready-for-dev ✅
**Created:** 2026-02-13
**Workflow:** /bmad:bmm:workflows:create-story
**Agent:** Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

---

## 📋 Story Overview

**Story ID:** 11.6
**Story Key:** 11-6-frontend-gestao-objetivos-customizados
**Epic:** 11 - Suporte a Cursos Não-BNCC com Objetivos Customizados
**Effort:** 8 pontos
**File Location:** `_bmad-output/implementation-artifacts/11-6-frontend-gestao-objetivos-customizados.md`

**User Story:**
> As a **professor ou coordenador de turma customizada**,
> I want **criar, editar e organizar objetivos de aprendizagem customizados ao criar planejamento bimestral**,
> so that **posso definir objetivos pedagógicos claros e estruturados (descrição + nível Bloom + critérios de evidência) que serão usados pela IA para analisar aulas com mesma qualidade que turmas BNCC**.

---

## 🎯 Key Deliverables

### Components to Create (6 new)
1. **ObjetivosCustomForm.tsx** (~450 lines) - Main CRUD form with drag-and-drop
2. **ObjetivoFormInline.tsx** (~200 lines) - Inline form for creating/editing 1 objetivo
3. **ObjetivoCard.tsx** (~80 lines) - Compact card displaying saved objetivo
4. **CriteriosEvidenciaField.tsx** (~100 lines) - Array field for evidence criteria (add/remove)
5. **NivelBloomBadge.tsx** (~60 lines) - Colorful badge for Bloom taxonomy level
6. **DeleteObjetivoDialog.tsx** (~40 lines) - Confirmation dialog for deletion

### API Hooks to Create (5 new)
1. **useObjetivos.ts** - Query to list objetivos for a turma
2. **useCreateObjetivo.ts** - POST mutation
3. **useUpdateObjetivo.ts** - PATCH mutation
4. **useDeleteObjetivo.ts** - DELETE mutation
5. **useCreateObjetivosBatch.ts** - Batch POST (Step 2 → Step 3)

### Files to Modify (2)
1. **PlanejamentoWizard.tsx** - Add conditional Step 2 rendering (BNCC vs CUSTOM)
2. **Step3Revisao.tsx** - Add objetivos customizados section

### New Dependencies
- `@dnd-kit/core` - Drag-and-drop context
- `@dnd-kit/sortable` - Sortable lists
- `@dnd-kit/utilities` - CSS utilities (arrayMove)

---

## ✅ Acceptance Criteria (12 ACs)

**AC1:** Componente aparece apenas para turmas customizadas (curriculo_tipo = CUSTOM)
**AC2:** Formulário permite adicionar mínimo 3, máximo 10 objetivos
**AC3:** Validação completa com Zod (5 campos + array critérios)
**AC4:** Lista de objetivos com drag-and-drop reordenação
**AC5:** Botão "Sugerir automático" para código do objetivo
**AC6:** Níveis de Bloom com tooltips explicativos e badges coloridos
**AC7:** Contador de caracteres dinâmico para descrição (20-500 chars)
**AC8:** Critérios de evidência como lista editável (add/remove 1-5 itens)
**AC9:** Integração com backend (POST/PATCH/DELETE /turmas/:id/objetivos)
**AC10:** Step 3 (Revisão) mostra objetivos customizados ao invés de habilidades BNCC
**AC11:** Validação de mínimo 3 objetivos bloqueia avanço de wizard
**AC12:** Testes unitários completos (≥23 testes, coverage ≥85%)

---

## 🔍 Comprehensive Analysis Performed

### Epic & Story Analysis
- ✅ Epic 11 strategy document (11-0-estrategia-cursos-customizados.md)
- ✅ Epic 11 breakdown (epic-11-suporte-cursos-customizados.md - 482 lines)
- ✅ Story 11.4 (backend CRUD objetivos) - API contracts validation
- ✅ Story 11.5 (frontend turma customizada) - reusable patterns (character counter, tooltips)
- ✅ Story 2.3 (planejamento wizard) - structure to adapt

### Frontend Codebase Analysis (via Subagent Explore)
- ✅ **Planejamento pages structure:**
  - PlanejamentoWizard.tsx (3-step wizard, Zustand state)
  - Step2SelecaoHabilidades.tsx (virtualized list, multi-select pattern)
  - Step3Revisao.tsx (review page to adapt)

- ✅ **Forms & validation patterns:**
  - React Hook Form + Zod schema validation
  - Conditional validation with `.refine()`
  - Character counter pattern (Story 11.5)

- ✅ **CRUD patterns:**
  - Modal-based CRUD (TurmaFormDialog.tsx - 592 lines)
  - Error handling (409 Conflict, 400 Validation, 403 RBAC)
  - Mutation hooks with React Query

- ✅ **Design patterns identified:**
  - Drag-and-drop: @dnd-kit/sortable with useSortable hook
  - Array fields: useFieldArray (React Hook Form)
  - Tooltips with examples: IconAlertCircle + TooltipContent
  - Character counters: dynamic red color if > max
  - Badges: colorful with aria-label + tooltip

### Architecture & Design System
- ✅ Architecture.md (React + shadcn/ui + Tailwind patterns)
- ✅ UX Design Specification (color system, typography, accessibility)
- ✅ Design system alignment:
  - Bloom colors: 6 níveis (gray, blue, green, yellow, orange, purple)
  - Deep Navy, Tech Blue, Cyan AI, Focus Orange
  - Montserrat (headings) + Inter (body)
  - WCAG AAA (touch 44px, contrast 14.8:1)

### Git Intelligence
- ✅ Last 10 commits analyzed
- ✅ Patterns identified:
  - `feat(story-X.Y): descriptive title`
  - Epic 11: Stories 11.1-11.5 completed (backend foundation + turma frontend)
  - Story 11.6 is first frontend for objetivos customizados
- ✅ Learnings from previous stories:
  - Character counter pattern (Story 11.5) works well
  - Conditional validation with Zod refine (Story 11.5) reusable
  - Wizard state with Zustand (Story 2.3) established pattern

---

## 🛠️ Technical Highlights

### State Management Pattern
```typescript
const [objetivos, setObjetivos] = useState<ObjetivoCustom[]>([]);
const [editingIndex, setEditingIndex] = useState<number | null>(null);

// Add/Edit/Remove handlers
// Drag-and-drop with arrayMove
// Batch POST on Step 2 → Step 3
```

### Drag-and-Drop (@dnd-kit)
```tsx
<DndContext onDragEnd={handleDragEnd}>
  <SortableContext items={objetivos} strategy={verticalListSortingStrategy}>
    {objetivos.map((obj, i) => (
      <SortableObjetivoCard key={obj.id} objetivo={obj} />
    ))}
  </SortableContext>
</DndContext>
```

### Sugestão Automática de Código
```typescript
suggestObjetivoCodigo(turma, area, existingCodes)
// Example: "Preparatório PM-SP" + "Matemática" → "PM-MAT-01"
// Regex extraction + sequential numbering + duplicata check
```

### Nível Bloom Badge Colors
```typescript
NIVEL_BLOOM_COLORS = {
  LEMBRAR: { bg: 'bg-gray-100', text: 'text-gray-700' },
  ENTENDER: { bg: 'bg-blue-100', text: 'text-blue-700' },
  APLICAR: { bg: 'bg-green-100', text: 'text-green-700' },
  ANALISAR: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  AVALIAR: { bg: 'bg-orange-100', text: 'text-orange-700' },
  CRIAR: { bg: 'bg-purple-100', text: 'text-purple-700' },
}
```

### Validation Schema (Zod)
```typescript
objetivoSchema = z.object({
  codigo: z.string().min(3).max(20).regex(/^[A-Z0-9\-_]+$/),
  descricao: z.string().min(20).max(500),
  area_conhecimento: z.string().max(100).optional(),
  nivel_cognitivo: z.enum(['LEMBRAR', 'ENTENDER', ...]),
  criterios_evidencia: z.array(z.string().min(10).max(200)).min(1).max(5),
  ordem: z.number().int().positive(),
});
```

---

## 📝 Tasks Breakdown (15 Tasks)

**Task 1:** Create TypeScript types (objetivo.ts - 80 lines)
**Task 2:** Create Zod validation schema (objetivo.schema.ts - 40 lines)
**Task 3:** Create API hooks (5 files - 30 lines each)
**Task 4:** Create NivelBloomBadge component (60 lines)
**Task 5:** Create CriteriosEvidenciaField component (100 lines)
**Task 6:** Create ObjetivoFormInline component (200 lines)
**Task 7:** Create ObjetivoCard component (80 lines)
**Task 8:** Create ObjetivosCustomForm main component (450 lines)
**Task 9:** Implement código suggestion helper (suggestObjetivoCodigo)
**Task 10:** Integrate drag-and-drop with @dnd-kit
**Task 11:** Adapt PlanejamentoWizard for conditional Step2
**Task 12:** Adapt Step3Revisao to show objetivos customizados
**Task 13:** Write unit tests (23 tests, coverage ≥85%)
**Task 14:** Add documentation and examples
**Task 15:** Update sprint-status.yaml

**Total Estimated Lines:** ~1500 lines (new code + tests + modifications)

---

## 🎓 Pedagogical Features (UX Innovation)

### Bloom Taxonomy Integration
- **6 cognitive levels** with color-coded badges (visual pedagogy)
- **Tooltips explain each level** with examples (Lembrar = decorar, Criar = produzir novo)
- **Forces pedagogical rigor:** Nível cognitivo obrigatório (não pode criar objetivo sem pensar no nível)

### Evidence-Based Learning
- **Critérios de evidência obrigatórios** (min 1, max 5)
- **Forces specificity:** Como saber se objetivo foi atingido? (mensurabilidade)
- **Example:** "Explicar conceito com próprias palavras", "Resolver problema sozinho"

### Specificity Validation
- **Descrição min 20 chars** (força especificidade - não aceita objetivos vagos)
- **Character counter** muda cor se < 20 (vermelho) → incentiva detalhamento
- **Tooltip com exemplo contextual** (Preparatório PM: "Resolver questões de razão e proporção aplicadas a concursos PM-SP")

### Intelligent Code Suggestion
- **Auto-generates contextual códigos** baseado em:
  - Contexto pedagógico da turma (ex: "PM" from "Preparatório PM-SP")
  - Área de conhecimento (ex: "MAT" from "Matemática")
  - Sequential numbering (01, 02...) with duplicata check
- **Editable:** Professor pode customizar sugestão

### Accessibility & Usability
- **Drag-and-drop with keyboard navigation** (WCAG AAA)
- **Touch targets 44px** (mobile-friendly)
- **Screen reader support** (aria-labels, aria-live)
- **Tooltips clickable on mobile** (hover não funciona em touch)

---

## 🔗 Dependencies

### Backend (Already Implemented)
- ✅ Story 11.1: ObjetivoAprendizagem model created
- ✅ Story 11.2: Turma expanded with curriculo_tipo + contexto_pedagogico
- ✅ Story 11.3: Planejamento supports generic ObjetivoAprendizagem (N:N)
- ✅ Story 11.4: CRUD API endpoints for custom objetivos (/turmas/:id/objetivos)

### Frontend (Already Implemented)
- ✅ Story 11.5: TurmaFormDialog with curriculo_tipo field (BNCC | CUSTOM)
- ✅ Story 2.3: PlanejamentoWizard structure (3 steps, Zustand)
- ✅ Story 10.4: TurmaFormDialog patterns (React Hook Form + Zod + character counter)

### External Libraries
- ✅ React Hook Form - Form state management
- ✅ Zod - Schema validation
- ✅ React Query - API hooks
- ✅ shadcn/ui - UI components (Dialog, Select, Badge, Tooltip)
- ✅ Tailwind CSS - Styling
- ⚠️ **NEW:** @dnd-kit - Drag-and-drop (to install)

---

## 🚀 Next Steps (After Story 11.6)

**Story 11.7:** Backend — Adaptar Prompts de IA para Objetivos Genéricos
- Pipeline de IA (5 prompts) consome objetivos customizados
- Context dinâmico: BNCC vs CUSTOM (contexto_pedagogico + objetivos)
- Análise retorna cobertura por objetivo (código, %, evidências, Bloom)

**Story 11.8:** Frontend — Dashboard de Cobertura Adaptado
- Filtro "Tipo de Currículo" (BNCC | Custom | Todos)
- Métrica adaptada: "% Habilidades BNCC" vs "% Objetivos Customizados"
- Drill-down com objetivos (planejado, abordado, não abordado)

**Story 11.9:** Frontend — Relatório de Aula para Turmas Custom
- Seção "Cobertura de Objetivos" dinâmica
- Evidências literais + badge status (✅ ⚠️ ❌)
- Sugestões contextualizadas (ex: "Aprofundar simulado PM")

**Story 11.10:** Testing — Validação E2E e Qualidade IA
- Teste E2E completo (turma custom → objetivos → aula → análise)
- Testes de regressão BNCC (100% passam)
- Validação manual qualidade IA: 10 aulas, ≥80% concordância

---

## 📊 Story Metrics

**Acceptance Criteria:** 12 ACs
**Tasks:** 15 tasks
**Components:** 6 new + 2 modified
**API Hooks:** 5 new
**Tests:** ≥23 unit tests (coverage ≥85%)
**Estimated Lines:** ~1500 lines
**New Dependencies:** 3 (@dnd-kit packages)
**Effort:** 8 story points

---

## ✨ Innovation & Learning Opportunities

### Technical Innovation
- **Framework híbrido de objetivos:** Abstração BNCC + Custom (extensível para CEFR, Common Core futuramente)
- **Drag-and-drop pedagógico:** Reordenação visual de objetivos (ordem importa pedagogicamente)
- **Validação pedagógica automatizada:** Sistema força boas práticas (especificidade, mensurabilidade, Bloom)

### UX Pedagogy
- **Tooltips educativos:** Ensina taxonomia de Bloom ao professor enquanto cria objetivos
- **Exemplos contextuais:** PM (preparatório), Inglês (conversação), Técnico (programação)
- **Visual feedback:** Character counter, badges coloridos, drag handle (≡)

### Architectural Learnings
- **Conditional rendering pattern:** Wizard Step 2 dinâmico (BNCC vs CUSTOM)
- **Array field management:** useFieldArray (React Hook Form) para critérios de evidência
- **Batch API optimization:** Salvar N objetivos em 1 request (Step 2 → Step 3)
- **Accessibility-first DnD:** @dnd-kit com keyboard navigation + screen readers

---

## 🎯 Quality Gates

### Before `dev-story` Execution
- [ ] Story file validated (optional: run validate-create-story)
- [ ] Backend Story 11.4 confirmed done (API endpoints available)
- [ ] Frontend Story 11.5 confirmed done (turma customizada criável)
- [ ] Dependencies installed: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

### During Implementation
- [ ] All 12 Acceptance Criteria validated with tests
- [ ] ≥23 unit tests passing (coverage ≥85%)
- [ ] Character counter working (dynamic red if > 500)
- [ ] Drag-and-drop functional (visual feedback, ordem updated)
- [ ] Código suggestion helper working (contextual + duplicata check)
- [ ] Bloom badges colorful with tooltips

### After Implementation (Code Review)
- [ ] Run code-review workflow (auto-marks story as review)
- [ ] Fix issues found (CRITICAL/HIGH priority)
- [ ] All tests passing (backend + frontend)
- [ ] No regressions (BNCC planejamento still works)

---

## 📚 References

**Epic & Stories:**
- `epic-11-suporte-cursos-customizados.md` (482 lines)
- `11-0-estrategia-cursos-customizados.md` (UX strategy)
- `11-4-backend-crud-objetivos-customizados.md` (API contracts)
- `11-5-frontend-cadastro-turma-contexto-pedagogico.md` (character counter pattern)

**Frontend Codebase:**
- `PlanejamentoWizard.tsx` (Zustand state management)
- `Step2SelecaoHabilidades.tsx` (virtualized list pattern)
- `TurmaFormDialog.tsx` (modal CRUD pattern, 592 lines)
- `turma.schema.ts` (Zod conditional validation)

**Architecture & Design:**
- `architecture.md` (React + shadcn/ui patterns)
- `ux-design-specification.md` (design system, Bloom colors)

**External Docs:**
- [React Hook Form - useFieldArray](https://react-hook-form.com/docs/usefieldarray)
- [Zod - Array Validation](https://zod.dev/?id=arrays)
- [@dnd-kit - Sortable Preset](https://docs.dndkit.com/presets/sortable)
- [Bloom's Taxonomy](https://cft.vanderbilt.edu/guides-sub-pages/blooms-taxonomy/)

---

**Created by:** SM Agent (Scrum Master) via `/bmad:bmm:workflows:create-story`
**Date:** 2026-02-13
**Model:** Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)
**Status:** ✅ READY FOR IMPLEMENTATION
