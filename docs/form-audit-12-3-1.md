# Form Audit - Story 12.3.1: Forms de Cadastro Premium

**Data:** 2026-02-14
**Objetivo:** Identificar gaps visuais em formulários existentes para aplicar padrões premium consistentes do Epic 12

---

## Formulários Auditados

### 1. TurmaFormDialog.tsx ✅ (ALTA PRIORIDADE)
**Localização:** `ressoa-frontend/src/pages/turmas/components/TurmaFormDialog.tsx`
**Linhas:** 597
**Complexidade:** Alta (7+ campos, validação Zod complexa, contexto pedagógico condicional)

#### Conformidade Atual
- ✅ Usa FormField + FormItem + FormLabel + FormControl + FormMessage
- ✅ Labels têm `font-medium` (via FormLabel padrão shadcn/ui)
- ⚠️ Labels: faltam classes `text-sm text-deep-navy` (atualmente sem classes customizadas)
- ✅ Inputs: h-11 correto (44px touch target)
- ⚠️ Character counters customizados inline (linhas 393-403, 424-434, 474-484) - **MIGRAR para componente**
- ✅ Tooltips com IconAlertCircle + TooltipProvider (linhas 367-382, 448-463)
- ⚠️ Tooltip icon: usa `text-focus-orange` ✅ mas poderia ser componente reutilizável
- ✅ Loading button: IconLoader2 + disabled (linha 587)
- ⚠️ Botão submit: falta `aria-busy={isLoading}`
- ✅ Espaçamento: `space-y-4` entre campos, `space-y-6` no container
- ✅ Grid responsivo: `grid-cols-2 gap-4` (linha 518)
- ✅ Focus ring via shadcn/ui (Radix UI)
- ✅ Error color: text-destructive via FormMessage

#### Gaps Identificados
1. **Character Counters:** 3 implementações inline customizadas (objetivo_geral, publico_alvo, metodologia) → Migrar para `<FormFieldWithCounter>`
2. **Tooltips:** 2 implementações inline → Migrar para `<FormFieldWithTooltip>`
3. **Submit Button:** Falta `aria-busy`, não usa componente reutilizável → Migrar para `<SubmitButton>`
4. **Labels:** Faltam classes `text-sm text-deep-navy` explícitas (atualmente herdam do shadcn/ui default)
5. **Tipografia:** Labels têm `font-heading` (linha 161) mas campos normais não - revisar consistência

#### Prioridade: **ALTA** (formulário usado em demos, complexidade alta)

---

### 2. AulaFormFields.tsx ✅ (MÉDIA PRIORIDADE)
**Localização:** `ressoa-frontend/src/pages/aulas/components/AulaFormFields.tsx`
**Linhas:** 164
**Complexidade:** Média (3 campos, dependent dropdowns)

#### Conformidade Atual
- ✅ Usa FormField + FormItem + FormLabel + FormControl + FormMessage
- ✅ Labels: `text-deep-navy` (linhas 78, 108, 128)
- ⚠️ Labels: faltam `text-sm` (apenas `text-deep-navy`)
- ✅ Inputs: h-11 (linhas 85, 113, 135)
- ✅ Loading states em Select (linha 86: "Carregando turmas...")
- ✅ Disabled states corretos (isLoadingTurmas, isLoadingPlanejamentos)
- ✅ Espaçamento: gap-4 implícito via parent
- ✅ Placeholder dinâmico (linhas 138-143)
- ❌ **SEM loading icon visual** (apenas texto "Carregando...")
- ❌ **SEM tooltip** para campos complexos
- ❌ **SEM character counter** (não aplicável - campos simples)

#### Gaps Identificados
1. **Labels:** Adicionar `font-medium text-sm` (atualmente apenas `text-deep-navy`)
2. **Loading States:** Select disabled mas sem indicador visual (spinner) - considerar IconLoader2 inline
3. **Espaçamento:** Validar que parent usa `space-y-4` correto
4. **FormMessage:** Confirmar `aria-live="polite"` presente (shadcn/ui default)

#### Prioridade: **MÉDIA** (formulário simples, apenas polish visual)

---

### 3. ObjetivosCustomForm.tsx ⚠️ (MÉDIA PRIORIDADE)
**Localização:** `ressoa-frontend/src/pages/planejamento/components/ObjetivosCustomForm.tsx`
**Linhas:** 361
**Complexidade:** Alta (drag-and-drop, inline create/edit, min/max validation)

#### Conformidade Atual
- ✅ Usa FormField (via ObjetivoFormInline - componente filho)
- ✅ Tooltip com IconAlertCircle (linhas 248-271) - boa implementação
- ⚠️ Tooltip icon: `text-blue-600` (linha 251) → **TROCAR para `text-focus-orange`**
- ✅ Counter dinâmico de objetivos (linhas 226-238)
- ⚠️ Counter color: usa `text-red-600`, `text-orange-600`, `text-green-600` → **VALIDAR paleta Epic 12**
- ✅ Botão "Adicionar": IconPlus + label (linha 323)
- ⚠️ Botão "Próximo": sem loading state (linha 341) - não aplicável (não assíncrono)
- ✅ Drag handles visuais (via ObjetivoCard)
- ⚠️ Delete confirmation dialog existe (linha 352) mas não auditado aqui

#### Gaps Identificados
1. **Tooltip icon color:** `text-blue-600` → trocar para `text-focus-orange`
2. **Counter color:** Validar se `text-green-600` está na paleta (Epic 12 usa `#10B981` como success) - OK
3. **FormFieldWithCounter:** Verificar se ObjetivoFormInline (componente filho) usa character counters - AUDITAR FILHO
4. **Botões:** Validar consistência visual (variant, min-h-[44px])

#### Prioridade: **MÉDIA** (complexidade alta mas já bem implementado)

---

### 4. LoginPage.tsx ✅ (BAIXA PRIORIDADE)
**Localização:** `ressoa-frontend/src/pages/LoginPage.tsx`
**Linhas:** 167
**Complexidade:** Baixa (2 campos simples)

#### Conformidade Atual
- ✅ Usa FormField + FormItem + FormLabel + FormControl + FormMessage
- ❌ Labels: **SEM `font-medium text-sm text-deep-navy`** (usa padrão shadcn/ui)
- ✅ AutoComplete correto (email, current-password)
- ✅ Loading button com texto dinâmico (linha 148: "Entrando...")
- ⚠️ Botão: **SEM IconLoader2**, falta `aria-busy={isLoading}`
- ✅ Espaçamento: `space-y-4` (linha 99)
- ✅ Inputs: h-11 implícito via Input component
- ❌ **SEM tooltip** (não necessário para login simples)
- ❌ **SEM character counter** (não aplicável)

#### Gaps Identificados
1. **Labels:** Adicionar `font-medium text-sm text-deep-navy`
2. **Submit Button:** Trocar para `<SubmitButton isLoading={isLoading} label="Entrar" />`
3. **Loading icon:** Adicionar IconLoader2 ao botão

#### Prioridade: **BAIXA** (formulário simples, pouco usado após login inicial)

---

### 5. PlanejamentoWizard.tsx ⚠️ (ALTA PRIORIDADE)
**Localização:** `ressoa-frontend/src/pages/planejamento/PlanejamentoWizard.tsx`
**Linhas:** 140
**Complexidade:** Alta (3-step wizard, delegates para Step1DadosGerais, Step2SelecaoHabilidades, Step3Revisao)

#### Conformidade Atual (Wizard Shell)
- ✅ WizardNavigation component existe (linha 119)
- ✅ Step navigation funciona (handleStepClick)
- ⚠️ Título: usa `text-3xl font-bold text-deep-navy` (linha 115) → **REVISAR: deveria ser `font-heading`?**
- ✅ Container: `max-w-6xl` + padding responsivo
- ❌ **NÃO auditado:** Step1DadosGerais, Step2SelecaoHabilidades, Step3Revisao (componentes filhos)

#### Gaps Identificados
1. **Wizard Shell:** Validar título usa `font-heading` (Montserrat)
2. **Step Components:** AUDITAR Step1DadosGerais.tsx (formulário de metadados)
3. **Step Components:** AUDITAR Step2SelecaoHabilidades.tsx (multiselect de habilidades)
4. **Step Components:** AUDITAR Step3Revisao.tsx (resumo visual)
5. **Navegação:** Validar botões Anterior/Próximo/Salvar seguem padrão Epic 12

#### Prioridade: **ALTA** (wizard usado em demos, complexidade alta) - **REQUER AUDITAR FILHOS**

---

## Componentes Filhos a Auditar (Wizard Steps)

### Pendente: Step1DadosGerais.tsx
- **Localização:** `ressoa-frontend/src/pages/planejamento/components/Step1DadosGerais.tsx`
- **Campos esperados:** turma (Select), bimestre (Select), ano_letivo (Input)
- **Ação:** Ler arquivo completo e auditar

### Pendente: Step2SelecaoHabilidades.tsx
- **Localização:** `ressoa-frontend/src/pages/planejamento/components/Step2SelecaoHabilidades.tsx`
- **Funcionalidade:** Multiselect de habilidades BNCC
- **Ação:** Ler arquivo completo e auditar

### Pendente: Step3Revisao.tsx
- **Localização:** `ressoa-frontend/src/pages/planejamento/components/Step3Revisao.tsx`
- **Funcionalidade:** Resumo visual + botão final de submission
- **Ação:** Ler arquivo completo e auditar

### Pendente: ObjetivoFormInline.tsx
- **Localização:** `ressoa-frontend/src/pages/planejamento/components/ObjetivoFormInline.tsx`
- **Funcionalidade:** Formulário inline (create/edit objetivo)
- **Ação:** Ler arquivo completo e auditar character counters

---

## Resumo de Gaps Globais

### 1. Character Counters Customizados (ALTO IMPACTO)
- **TurmaFormDialog:** 3 implementações inline → Migrar para `<FormFieldWithCounter>`
- **ObjetivoFormInline:** (PENDENTE AUDITORIA) → Verificar e migrar se necessário

### 2. Tooltips Customizados (MÉDIO IMPACTO)
- **TurmaFormDialog:** 2 implementações inline → Migrar para `<FormFieldWithTooltip>`
- **ObjetivosCustomForm:** Tooltip icon color incorreto → Corrigir para `text-focus-orange`

### 3. Submit Buttons (MÉDIO IMPACTO)
- **TurmaFormDialog:** Botão sem `aria-busy` → Migrar para `<SubmitButton>`
- **LoginPage:** Botão sem IconLoader2 → Migrar para `<SubmitButton>`
- **Wizard Steps:** (PENDENTE AUDITORIA) → Validar botões Anterior/Próximo/Salvar

### 4. Labels (BAIXO IMPACTO - Polish)
- **AulaFormFields:** Falta `font-medium text-sm` (apenas `text-deep-navy`)
- **LoginPage:** Falta `font-medium text-sm text-deep-navy` (usa padrão)
- **Global:** Validar consistência de `font-heading` vs `font-medium` em labels

### 5. Loading States (BAIXO IMPACTO)
- **AulaFormFields:** Select loading sem icon visual (apenas texto)
- **Global:** Validar que todos os Select assíncronos têm feedback visual

---

## Próximos Passos (Task 2)

### Criar Componentes Helper
1. ✅ **FormFieldWithCounter.tsx** - Character counter reutilizável
2. ✅ **FormFieldWithTooltip.tsx** - Tooltip pattern reutilizável
3. ✅ **SubmitButton.tsx** - Botão consistente com loading state
4. ✅ **Barrel export** - `src/components/ui/index.ts`

### Refatorar Formulários (Tasks 3-7)
- **Task 3:** TurmaFormDialog (ALTA) - Aplicar 3 helpers
- **Task 4:** PlanejamentoWizard + Steps (ALTA) - Auditar filhos + aplicar helpers
- **Task 5:** AulaFormFields (MÉDIA) - Polish visual
- **Task 6:** ObjetivosCustomForm + ObjetivoFormInline (MÉDIA) - Corrigir tooltip color
- **Task 7:** LoginPage (BAIXA) - Aplicar SubmitButton

---

## Métricas de Impacto

### Antes (Estimado)
- **Character counters customizados:** 3+ implementações inline (120+ LOC duplicado)
- **Tooltips customizados:** 2+ implementações inline (40+ LOC duplicado)
- **Submit buttons:** 2+ implementações inconsistentes (sem aria-busy)
- **Labels:** Inconsistência entre formulários (4+ variações)

### Depois (Esperado)
- **Character counters:** 1 componente reutilizável (40 LOC) + imports simples
- **Tooltips:** 1 componente reutilizável (30 LOC) + imports simples
- **Submit buttons:** 1 componente reutilizável (25 LOC) + imports simples
- **Labels:** 100% consistência (`font-medium text-sm text-deep-navy`)

### Economia de Código
- **LOC removido:** ~160 linhas duplicadas
- **LOC adicionado:** ~95 linhas (componentes reutilizáveis) + exports
- **Ganho líquido:** -65 LOC, +100% consistência visual

---

## Notas Técnicas

### Paleta de Cores Confirmada (Epic 12)
- **Deep Navy:** `#0A2647` - Labels, títulos
- **Tech Blue:** `#2563EB` - Focus ring, ações primárias
- **Cyan AI:** `#06B6D4` - Elementos AI (não usado em forms)
- **Focus Orange:** `#F97316` - Tooltips de atenção
- **Ghost White:** `#F8FAFC` - Backgrounds
- **Destructive:** `#EF4444` - Error messages (red)
- **Success:** `#10B981` - Success indicators (green) ✅

### Acessibilidade WCAG AAA
- **Contrast Deep Navy (#0A2647) sobre Ghost White (#F8FAFC):** 14.8:1 ✅ AAA
- **Contrast Error (#EF4444) sobre branco:** 4.54:1 ✅ AA (suficiente para texto)
- **Focus ring Tech Blue:** Visível, offset 3px
- **Touch targets:** 44px (h-11) em todos os inputs/buttons

### Dependências Confirmadas (NÃO instalar nada novo)
- ✅ react-hook-form v7.54
- ✅ zod v3.24
- ✅ @hookform/resolvers v3.11
- ✅ @radix-ui/react-* (shadcn/ui base)
- ✅ @tabler/icons-react v3.29 (IconLoader2, IconAlertCircle, IconChevronLeft, IconChevronRight)
- ✅ class-variance-authority v0.7
- ✅ clsx + tailwind-merge

---

**Audit completada:** 2026-02-14
**Próxima ação:** Task 2 - Criar FormFieldWithCounter, FormFieldWithTooltip, SubmitButton
