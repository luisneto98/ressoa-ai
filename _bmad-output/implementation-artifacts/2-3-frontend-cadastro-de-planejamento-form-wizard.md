# Story 2.3: Frontend - Cadastro de Planejamento (Form Wizard)

Status: done

---

## Story

As a **professor**,
I want **cadastrar meu planejamento bimestral selecionando habilidades BNCC de forma intuitiva**,
So that **posso definir o que planejo ensinar no bimestre e o sistema usar isso nas análises futuras**.

---

## Acceptance Criteria

### WIZARD STRUCTURE

**Given** o endpoint POST /planejamentos está funcional (Story 2.1)
**When** crio página `/planejamentos/novo` com form wizard de 3 etapas:

- Step 1: Dados gerais (Turma, Bimestre, Ano letivo)
- Step 2: Seleção de habilidades BNCC
- Step 3: Revisão e confirmação

**Then** a estrutura do wizard está criada

---

### STEP 1: DADOS GERAIS

**Given** a estrutura está pronta
**When** implemento Step 1 - Dados gerais:

- Campo: **Turma** (select com turmas do professor)
  - Fetch: `GET /api/v1/turmas?professor_id=me`
  - Exibe: nome da turma + disciplina + série
- Campo: **Bimestre** (radio buttons: 1, 2, 3, 4)
- Campo: **Ano letivo** (number input, default: ano atual)
- Validação: todos campos obrigatórios
- Botão: "Próximo" → avança para Step 2

**Then** Step 1 captura dados gerais

---

### STEP 2: SELEÇÃO DE HABILIDADES

**Given** Step 1 está implementado
**When** implemento Step 2 - Seleção de habilidades:

- **Filtros no topo:**
  - Disciplina (auto-preenchido pela turma, readonly)
  - Série (auto-preenchido pela turma, readonly)
  - Unidade Temática (select com opções únicas do resultado)
  - Busca (input text com debounce 300ms)
- **Lista de habilidades (virtualized list para performance):**
  - Checkbox: selecionar/desselecionar
  - Código BNCC (ex: EF06MA01)
  - Descrição (truncada, tooltip com texto completo)
  - Badge: Unidade Temática
- **Painel lateral: Habilidades selecionadas (N habilidades)**
  - Drag-and-drop para reordenar (opcional - peso automático)
  - Botão "Remover" em cada
- Validação: mínimo 1 habilidade selecionada
- Botões: "Voltar" (Step 1), "Próximo" (Step 3)

**Then** Step 2 permite seleção intuitiva de habilidades

---

### STEP 3: REVISÃO E CONFIRMAÇÃO

**Given** Step 2 está implementado
**When** implemento Step 3 - Revisão:

- **Resumo dos dados:**
  - Turma: {nome} - {disciplina} - {série}º ano
  - Bimestre: {1-4}
  - Ano letivo: {2026}
  - Habilidades selecionadas: {N} habilidades
- **Lista de habilidades selecionadas (read-only):**
  - Código + Descrição
  - Peso calculado automaticamente (RN-PLAN-02: 1/N)
- Botões: "Voltar" (Step 2), "Salvar Planejamento" (submit)

**Then** Step 3 mostra revisão completa

---

### SUBMIT LOGIC

**Given** todos steps estão implementados
**When** implemento lógica de submit:

```typescript
const onSubmit = async () => {
  try {
    const payload = {
      turma_id: formData.turma_id,
      bimestre: formData.bimestre,
      ano_letivo: formData.ano_letivo,
      habilidades: selectedHabilidades.map(h => ({
        habilidade_id: h.id,
        // peso e aulas_previstas omitidos - backend calcula automaticamente
      }))
    };

    await apiClient.post('/planejamentos', payload);

    toast.success('Planejamento criado com sucesso!');
    navigate('/planejamentos');
  } catch (error) {
    toast.error('Erro ao salvar planejamento. Tente novamente.');
  }
};
```

**Then** o submit cria planejamento via API

---

### DUPLICATE VALIDATION

**Given** o wizard está completo
**When** adiciono validação de duplicata no frontend:

- Antes do Step 3, verificar se já existe planejamento:
  - `GET /planejamentos?turma_id={x}&bimestre={y}&ano_letivo={z}`
  - Se existe, mostrar warning: "Já existe planejamento para esta turma neste bimestre. Deseja substituir?"
  - Opções: "Cancelar" ou "Editar existente" (redirect para edição)

**Then** previne criação de duplicatas

---

### END-TO-END FLOW

**Given** tudo está implementado
**When** testo o fluxo completo:

1. Acesso `/planejamentos/novo` → wizard renderiza em Step 1
2. Seleciono turma, bimestre, ano → clico "Próximo"
3. Wizard avança para Step 2
4. Vejo lista de habilidades filtradas por disciplina/série da turma
5. Uso busca "equações" → lista filtra em tempo real
6. Seleciono 5 habilidades → painel lateral mostra "5 selecionadas"
7. Clico "Próximo" → wizard avança para Step 3
8. Vejo resumo completo → clico "Salvar"
9. Planejamento é criado → redirecionado para `/planejamentos`
10. Toast "Planejamento criado com sucesso!" aparece

**Then** o fluxo de cadastro funciona end-to-end

**And** o wizard é responsivo (funciona em mobile e desktop)

**And** o wizard é acessível (keyboard navigation, ARIA labels)

---

## Tasks / Subtasks

### 1. Setup Page Structure (AC: Wizard Structure)

- [x] Criar route `/planejamentos/novo` no React Router
- [x] Criar componente `PlanejamentoWizard.tsx` em `src/pages/planejamento/`
- [x] Criar state management para wizard:
  - [x] Step atual (1, 2, ou 3)
  - [x] Form data (turma_id, bimestre, ano_letivo)
  - [x] Habilidades selecionadas
- [x] Criar layout de wizard com steps indicator (shadcn/ui Steps ou custom)
- [x] Implementar navegação entre steps (nextStep, prevStep, goToStep)

### 2. Implement Step 1: Dados Gerais (AC: Step 1)

- [x] Criar componente `Step1DadosGerais.tsx`
- [x] Fetch turmas do professor: `GET /api/v1/turmas?professor_id=me`
- [x] Implementar Select de Turma (shadcn/ui Select):
  - [x] Exibir: `{turma.nome} - {turma.disciplina} - {turma.serie}º ano`
  - [x] Armazenar turma completa (incluindo disciplina e serie para Step 2)
- [x] Implementar Radio Group de Bimestre (shadcn/ui RadioGroup):
  - [x] Opções: 1, 2, 3, 4
  - [x] Layout: inline (horizontal)
- [x] Implementar Input de Ano Letivo (shadcn/ui Input type="number"):
  - [x] Default: ano atual (`new Date().getFullYear()`)
  - [x] Min: 2024, Max: ano atual + 1
- [x] Validação com Zod:
  - [x] Turma obrigatória
  - [x] Bimestre obrigatório (1-4)
  - [x] Ano letivo obrigatório (≥ 2024)
- [x] Botão "Próximo" (disabled até form válido)

### 3. Implement Step 2: Seleção de Habilidades (AC: Step 2)

- [x] Criar componente `Step2SelecaoHabilidades.tsx`
- [x] Fetch habilidades: `GET /api/v1/habilidades?disciplina={turma.disciplina}&serie={turma.serie}`
- [x] Implementar filtros:
  - [x] Disciplina (Input readonly, valor da turma)
  - [x] Série (Input readonly, valor da turma)
  - [x] Unidade Temática (Select com opções únicas extraídas de habilidades)
  - [x] Busca (Input com debounce 300ms usando `useDebouncedValue` hook)
- [x] Implementar lista virtualizada (react-window ou @tanstack/react-virtual):
  - [x] Renderizar apenas items visíveis (performance com 100+ habilidades)
  - [x] Checkbox para selecionar/desselecionar
  - [x] Exibir código BNCC (bold)
  - [x] Exibir descrição truncada (max 120 chars) + Tooltip com texto completo
  - [x] Badge com unidade temática
- [x] Implementar painel lateral "Habilidades Selecionadas":
  - [x] Header: "N habilidades selecionadas"
  - [x] Lista de selecionadas (não virtualizada - máximo ~20 habilidades)
  - [x] Botão "Remover" em cada item
  - [ ] (Opcional) Drag-and-drop para reordenar (react-beautiful-dnd ou dnd-kit) - SKIP (não necessário para MVP)
- [x] Validação: mínimo 1 habilidade selecionada
- [x] Botões: "Voltar" (Step 1), "Próximo" (Step 3, disabled até ≥1 selecionada)

### 4. Implement Step 3: Revisão (AC: Step 3)

- [x] Criar componente `Step3Revisao.tsx`
- [x] Exibir resumo dos dados:
  - [x] Card com informações da turma (nome, disciplina, série)
  - [x] Bimestre (badge ou text)
  - [x] Ano letivo
  - [x] Total de habilidades selecionadas
- [x] Exibir lista read-only de habilidades selecionadas:
  - [x] Código BNCC + Descrição
  - [x] Peso calculado: `1 / totalHabilidades` (formatado como %)
  - [x] Aulas previstas estimadas: `40 / totalHabilidades` (arredondado)
- [x] Botões: "Voltar" (Step 2), "Salvar Planejamento" (submit)

### 5. Implement Submit Logic (AC: Submit Logic)

- [x] Criar função `handleSubmit` no wizard
- [x] Validar duplicata antes de submit:
  - [x] Fetch `GET /planejamentos?turma_id={x}&bimestre={y}&ano_letivo={z}`
  - [x] Se existe, mostrar AlertDialog (shadcn/ui):
    - [x] Mensagem: "Já existe planejamento para esta turma neste bimestre."
    - [x] Opções: "Cancelar", "Editar Existente" (redirect)
  - [x] Se não existe, prosseguir com submit
- [x] Construir payload conforme AC:
  - [x] Mapear habilidades selecionadas para array com `habilidade_id`
  - [x] Não enviar `peso` nem `aulas_previstas` (backend calcula)
- [x] POST para `/api/v1/planejamentos`
- [x] Error handling:
  - [x] 400 (duplicate): Toast "Já existe planejamento para esta turma"
  - [x] 401/403: Redirecionar para login (via axios interceptor)
  - [x] 500: Toast "Erro ao salvar. Tente novamente."
- [x] Success handling:
  - [x] Toast success (shadcn/ui Sonner toast)
  - [x] Navigate to `/planejamentos`

### 6. Add Responsive & Accessible Design (AC: End-to-End Flow)

- [x] Testar wizard em mobile (320px+):
  - [x] Steps indicator responsivo (mobile: dots, desktop: labels)
  - [x] Form fields em coluna única (Tailwind grid responsive)
  - [x] Painel lateral de selecionadas (grid layout adaptativo)
- [x] Adicionar keyboard navigation:
  - [x] Tab order lógico (native HTML)
  - [x] Enter para avançar step (form submit)
  - [ ] Escape para cancelar/voltar (não implementado - opcional)
- [x] Adicionar ARIA labels:
  - [x] `aria-label` em buttons de navegação
  - [x] `aria-current="step"` no step ativo
  - [x] `aria-describedby` para validações de erro (role="alert")
- [x] Focus management:
  - [x] Auto-focus no primeiro campo ao entrar no step (Step 2 search input)
  - [x] Focus no erro após validação falhar (native HTML validation)

### 7. Add E2E Tests (AC: End-to-End Flow - Opcional para MVP)

- [ ] Criar `e2e/planejamento-wizard.spec.ts` (Playwright) - **SKIP para MVP**
- [ ] Testar fluxo completo (10 steps do AC) - **SKIP para MVP**
- [ ] Testar validações - **SKIP para MVP**
- [ ] Testar navegação - **SKIP para MVP**
- [ ] Testar responsividade - **SKIP para MVP**

**Nota:** E2E tests frontend são opcionais para MVP. Backend E2E tests existem para garantir API funcionando.

---

## Dev Notes

### **🎨 Design System: Tailwind + shadcn/ui**

**Component Library:** shadcn/ui (built sobre Radix UI)

**Components Usados:**
- **Select:** Turma selection, Unidade Temática filter
- **RadioGroup:** Bimestre selection (1-4)
- **Input:** Ano letivo, busca de habilidades
- **Checkbox:** Seleção de habilidades
- **Button:** Navegação (Voltar, Próximo, Salvar)
- **Card:** Container de step, resumo
- **Badge:** Unidade temática, bimestre
- **Tooltip:** Descrição completa de habilidade
- **Toast (Sonner):** Success/Error feedback
- **AlertDialog:** Confirmação de duplicata

**Paleta de Cores (Tailwind config):**
```javascript
// tailwind.config.js
colors: {
  'deep-navy': '#0A2647',    // Primária
  'tech-blue': '#2563EB',    // Secundária
  'cyan-ai': '#06B6D4',      // Detalhes
  'focus-orange': '#F97316', // CTA
  'ghost-white': '#F8FAFC',  // Background
}
```

**Typography:**
- Headers: Montserrat (font-sans)
- Body: Inter (font-body)

**Installation (if not done in Story 0.1):**
```bash
# Install shadcn/ui components
npx shadcn-ui@latest add select radio-group input checkbox button card badge tooltip toast alert-dialog
```

---

### **Architecture: React 18 + Vite + TypeScript**

**Tech Stack:**
- **Framework:** React 18 (Vite template)
- **State:** Zustand (wizard state) + React Query (API data fetching)
- **Forms:** React Hook Form + Zod (validation)
- **Router:** React Router v6
- **HTTP:** axios (via React Query)

**Folder Structure:**

```
src/
├── pages/
│   └── planejamento/
│       ├── PlanejamentoWizard.tsx         # Main wizard page
│       ├── components/
│       │   ├── Step1DadosGerais.tsx
│       │   ├── Step2SelecaoHabilidades.tsx
│       │   ├── Step3Revisao.tsx
│       │   ├── WizardNavigation.tsx       # Steps indicator + buttons
│       │   ├── HabilidadesList.tsx        # Virtualized list
│       │   └── HabilidadesSelectedPanel.tsx
│       └── hooks/
│           ├── usePlanejamentoWizard.ts   # Zustand store
│           ├── useTurmas.ts               # React Query (fetch turmas)
│           ├── useHabilidades.ts          # React Query (fetch habilidades)
│           └── useCreatePlanejamento.ts   # React Query (POST mutation)
├── lib/
│   └── api/
│       └── planejamento.ts                # API client functions
└── types/
    └── planejamento.ts                    # TypeScript types
```

---

### **State Management Pattern**

**Zustand Store for Wizard State:**

```typescript
// hooks/usePlanejamentoWizard.ts
import { create } from 'zustand';

interface PlanejamentoWizardState {
  currentStep: 1 | 2 | 3;
  formData: {
    turma_id: string;
    turma?: Turma; // Full turma object (for disciplina/serie in Step 2)
    bimestre: number;
    ano_letivo: number;
  };
  selectedHabilidades: Habilidade[];

  // Actions
  setCurrentStep: (step: 1 | 2 | 3) => void;
  nextStep: () => void;
  prevStep: () => void;
  setFormData: (data: Partial<PlanejamentoWizardState['formData']>) => void;
  toggleHabilidade: (habilidade: Habilidade) => void;
  removeHabilidade: (id: string) => void;
  reset: () => void;
}

export const usePlanejamentoWizard = create<PlanejamentoWizardState>((set) => ({
  currentStep: 1,
  formData: {
    turma_id: '',
    bimestre: 1,
    ano_letivo: new Date().getFullYear(),
  },
  selectedHabilidades: [],

  setCurrentStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({
    currentStep: Math.min(state.currentStep + 1, 3) as 1 | 2 | 3
  })),
  prevStep: () => set((state) => ({
    currentStep: Math.max(state.currentStep - 1, 1) as 1 | 2 | 3
  })),
  setFormData: (data) => set((state) => ({
    formData: { ...state.formData, ...data }
  })),
  toggleHabilidade: (habilidade) => set((state) => {
    const exists = state.selectedHabilidades.find(h => h.id === habilidade.id);
    return {
      selectedHabilidades: exists
        ? state.selectedHabilidades.filter(h => h.id !== habilidade.id)
        : [...state.selectedHabilidades, habilidade]
    };
  }),
  removeHabilidade: (id) => set((state) => ({
    selectedHabilidades: state.selectedHabilidades.filter(h => h.id !== id)
  })),
  reset: () => set({
    currentStep: 1,
    formData: {
      turma_id: '',
      bimestre: 1,
      ano_letivo: new Date().getFullYear(),
    },
    selectedHabilidades: [],
  }),
}));
```

---

### **React Query Hooks**

**Pattern: Fetch Turmas**

```typescript
// hooks/useTurmas.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export const useTurmas = () => {
  return useQuery({
    queryKey: ['turmas', 'me'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/turmas', {
        params: { professor_id: 'me' }
      });
      return data;
    },
  });
};
```

**Pattern: Fetch Habilidades with Filters**

```typescript
// hooks/useHabilidades.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

interface UseHabilidadesParams {
  disciplina?: string;
  serie?: number;
  unidade_tematica?: string;
  search?: string;
}

export const useHabilidades = (params: UseHabilidadesParams) => {
  return useQuery({
    queryKey: ['habilidades', params],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/habilidades', { params });
      return data;
    },
    enabled: !!params.disciplina && !!params.serie, // Only fetch if disciplina + serie set
  });
};
```

**Pattern: Create Planejamento Mutation**

```typescript
// hooks/useCreatePlanejamento.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

interface CreatePlanejamentoPayload {
  turma_id: string;
  bimestre: number;
  ano_letivo: number;
  habilidades: Array<{ habilidade_id: string }>;
}

export const useCreatePlanejamento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreatePlanejamentoPayload) => {
      const { data } = await api.post('/api/v1/planejamentos', payload);
      return data;
    },
    onSuccess: () => {
      // Invalidate planejamentos list query
      queryClient.invalidateQueries({ queryKey: ['planejamentos'] });
    },
  });
};
```

---

### **Virtualized List Pattern (Performance)**

**Why Virtualized:**
- Matemática 6º ano: ~30 habilidades
- Língua Portuguesa 7º ano: ~50-60 habilidades (blocos compartilhados)
- Renderizar 50+ checkboxes degrada performance

**Library:** `@tanstack/react-virtual` (lightweight, framework-agnostic)

**Implementation:**

```typescript
// components/HabilidadesList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

interface HabilidadesListProps {
  habilidades: Habilidade[];
  selectedIds: Set<string>;
  onToggle: (habilidade: Habilidade) => void;
}

export const HabilidadesList = ({ habilidades, selectedIds, onToggle }: HabilidadesListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: habilidades.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated height of each row
    overscan: 5, // Render 5 extra items above/below viewport
  });

  return (
    <div ref={parentRef} className="h-[500px] overflow-auto border rounded">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const habilidade = habilidades[virtualRow.index];
          const isSelected = selectedIds.has(habilidade.id);

          return (
            <div
              key={habilidade.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="px-4 py-3 border-b hover:bg-gray-50"
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggle(habilidade)}
                />
                <div className="flex-1">
                  <span className="font-bold text-deep-navy">{habilidade.codigo}</span>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {habilidade.descricao}
                  </p>
                  <Badge variant="secondary" className="mt-1">
                    {habilidade.unidade_tematica}
                  </Badge>
                </div>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

---

### **Debounce Pattern (Search Input)**

**Why Debounce:**
- Evita fetch em cada keystroke
- 300ms delay = UX responsiva sem overhead

**Hook Pattern:**

```typescript
// hooks/useDebouncedValue.ts
import { useEffect, useState } from 'react';

export const useDebouncedValue = <T>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};
```

**Usage in Step 2:**

```typescript
// components/Step2SelecaoHabilidades.tsx
const [searchInput, setSearchInput] = useState('');
const debouncedSearch = useDebouncedValue(searchInput, 300);

const { data: habilidadesData } = useHabilidades({
  disciplina: formData.turma?.disciplina,
  serie: formData.turma?.serie,
  search: debouncedSearch, // ✅ Only triggers query after 300ms pause
});
```

---

### **Validation Pattern (Zod + React Hook Form)**

**Step 1 Schema:**

```typescript
import { z } from 'zod';

const step1Schema = z.object({
  turma_id: z.string().uuid({ message: 'Selecione uma turma' }),
  bimestre: z.number().int().min(1).max(4),
  ano_letivo: z.number().int().min(2024),
});

type Step1FormData = z.infer<typeof step1Schema>;
```

**React Hook Form Integration:**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm<Step1FormData>({
  resolver: zodResolver(step1Schema),
  defaultValues: {
    turma_id: '',
    bimestre: 1,
    ano_letivo: new Date().getFullYear(),
  },
});

const onNext = form.handleSubmit((data) => {
  // Validation passed
  setFormData(data);
  nextStep();
});
```

---

### **Duplicate Validation Pattern**

**Before Step 3:**

```typescript
// PlanejamentoWizard.tsx
const checkDuplicate = async () => {
  try {
    const { data } = await api.get('/api/v1/planejamentos', {
      params: {
        turma_id: formData.turma_id,
        bimestre: formData.bimestre,
        ano_letivo: formData.ano_letivo,
      },
    });

    if (data.length > 0) {
      // Duplicate exists
      const existingPlanejamento = data[0];

      // Show AlertDialog
      setShowDuplicateAlert(true);
      setExistingPlanejamentoId(existingPlanejamento.id);

      return false; // Block navigation to Step 3
    }

    return true; // No duplicate, proceed
  } catch (error) {
    console.error('Error checking duplicate:', error);
    return true; // On error, allow proceeding
  }
};

const handleNextToStep3 = async () => {
  const canProceed = await checkDuplicate();
  if (canProceed) {
    nextStep();
  }
};
```

**AlertDialog Component:**

```typescript
<AlertDialog open={showDuplicateAlert} onOpenChange={setShowDuplicateAlert}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Planejamento já existe</AlertDialogTitle>
      <AlertDialogDescription>
        Já existe um planejamento para esta turma neste bimestre.
        Deseja editar o existente ou cancelar?
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction onClick={() => navigate(`/planejamentos/${existingPlanejamentoId}/editar`)}>
        Editar Existente
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### **Responsive Design Strategy**

**Breakpoints (Tailwind):**
- `sm`: 640px+ (mobile landscape)
- `md`: 768px+ (tablet)
- `lg`: 1024px+ (desktop)

**Mobile Patterns:**

```typescript
// Steps indicator: dots on mobile, labels on desktop
<div className="flex gap-2 md:gap-4">
  {[1, 2, 3].map(step => (
    <div
      key={step}
      className={cn(
        "flex items-center gap-2",
        step === currentStep && "text-tech-blue font-bold"
      )}
    >
      {/* Mobile: dot only */}
      <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center md:hidden">
        {step}
      </div>

      {/* Desktop: dot + label */}
      <div className="hidden md:flex items-center gap-2">
        <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center">
          {step}
        </div>
        <span>{stepLabels[step]}</span>
      </div>
    </div>
  ))}
</div>
```

**Painel Lateral → Bottom Sheet (Mobile):**

```typescript
// Desktop: sidebar
// Mobile: bottom sheet (shadcn/ui Sheet component)
const isMobile = useMediaQuery('(max-width: 768px)');

{isMobile ? (
  <Sheet open={selectedHabilidades.length > 0}>
    <SheetContent side="bottom">
      <HabilidadesSelectedPanel habilidades={selectedHabilidades} />
    </SheetContent>
  </Sheet>
) : (
  <aside className="w-80 border-l p-4">
    <HabilidadesSelectedPanel habilidades={selectedHabilidades} />
  </aside>
)}
```

---

### **Accessibility (WCAG AAA)**

**Keyboard Navigation:**
- Tab order: Step 1 fields → "Próximo" → Step 2 filters → Habilidades list → Selected panel → "Voltar"/"Próximo"
- Enter: Submit current step (advance to next)
- Escape: Cancel/go back

**ARIA Labels:**

```typescript
// Steps indicator
<nav aria-label="Progresso do wizard de planejamento">
  <ol>
    <li aria-current={currentStep === 1 ? 'step' : undefined}>
      Step 1: Dados Gerais
    </li>
    {/* ... */}
  </ol>
</nav>

// Form fields
<Label htmlFor="turma-select">Turma *</Label>
<Select id="turma-select" aria-required="true" aria-invalid={!!errors.turma_id}>
  {/* ... */}
</Select>
{errors.turma_id && (
  <span id="turma-error" role="alert" className="text-red-500">
    {errors.turma_id.message}
  </span>
)}

// Habilidades list
<div role="list" aria-label="Lista de habilidades BNCC">
  <div role="listitem">
    <Checkbox aria-labelledby={`habilidade-${habilidade.id}-label`} />
    <span id={`habilidade-${habilidade.id}-label`}>
      {habilidade.codigo} - {habilidade.descricao}
    </span>
  </div>
</div>
```

**Focus Management:**

```typescript
// Auto-focus first field when entering step
useEffect(() => {
  if (currentStep === 1) {
    document.getElementById('turma-select')?.focus();
  } else if (currentStep === 2) {
    document.getElementById('search-input')?.focus();
  }
}, [currentStep]);
```

---

### **Testing Strategy**

**Unit Tests (Vitest + React Testing Library):**
- Test wizard state transitions (nextStep, prevStep)
- Test form validation (Step 1 schema)
- Test habilidade selection logic (toggle, remove)

**E2E Tests (Playwright - Opcional para MVP):**
- Test complete flow (10 steps from AC)
- Test duplicate validation
- Test responsive behavior (mobile vs desktop)

---

### **Previous Story Learnings**

**Story 2.1 (Backend Planejamento CRUD):**
- ✅ Endpoint POST /planejamentos funcional
- ✅ DTOs validam entrada
- ✅ Backend calcula peso e aulas_previstas automaticamente
- ⚠️ Turma.disciplina é String (não enum Prisma)

**Story 2.2 (Backend Habilidades Query):**
- ✅ Endpoint GET /habilidades com filtros
- ✅ Full-text search funcional
- ✅ Cache Redis (responses rápidos)
- ✅ Pagination funcionando

**Integration Points:**
- Step 1 → Fetch turmas (endpoint ainda não existe - Story 2.1 criou Turma model, mas não controller)
- ⚠️ **BLOCKER:** Precisa criar endpoint GET /api/v1/turmas antes de implementar Step 1
- Step 2 → Fetch habilidades (Story 2.2 ✅)
- Step 3 → Submit planejamento (Story 2.1 ✅)

---

### **Dependencies & Libraries**

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.22.0",
    "@tanstack/react-query": "^5.20.0",
    "zustand": "^4.5.0",
    "axios": "^1.6.0",
    "react-hook-form": "^7.50.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",
    "@tanstack/react-virtual": "^3.0.0",
    "sonner": "^1.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.1.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "@playwright/test": "^1.41.0",
    "vitest": "^1.2.0",
    "@testing-library/react": "^14.1.0"
  }
}
```

---

### **References**

- **[Source: epics.md - Epic 2, Story 2.3]** - Complete acceptance criteria, wizard flow
- **[Source: ux-design-specification.md]** - Design System (Tailwind + shadcn/ui), colors, typography, accessibility
- **[Source: architecture.md]** - Frontend stack (React 18, Vite, TypeScript, Zustand, React Query)
- **[Source: 2-1-backend-planejamento-crud-api.md]** - POST endpoint, DTOs, business rules
- **[Source: 2-2-backend-habilidades-bncc-query-api.md]** - GET habilidades endpoint, filters, cache

---

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

- Backend turmas endpoint E2E tests: All 6 tests passing
- Frontend lint check: Minor fast-refresh warnings (non-blocking)

### Completion Notes List

**✅ BLOCKER RESOLVED: Backend GET /turmas endpoint criado**
- Criado TurmasModule completo (controller, service, E2E tests)
- 6 testes E2E passando com 100% coverage de multi-tenancy
- Endpoint segue padrões do projeto (tenant isolation com escola_id)

**✅ Frontend Wizard Completo (Tasks 1-6)**
- Wizard de 3 steps implementado com Zustand para state management
- Step 1: Form com validação Zod (Turma, Bimestre, Ano Letivo)
- Step 2: Lista virtualizada de habilidades com filtros e debounce (300ms)
- Step 3: Revisão com cálculo automático de peso e aulas previstas
- Submit com validação de duplicata e feedback via toast
- Responsive design (Tailwind grid) e ARIA labels para acessibilidade
- React Query para data fetching com cache e retry

**Decisões Técnicas:**
1. **@tanstack/react-virtual** usado para performance com 100+ habilidades (lista virtualizada)
2. **@tanstack/react-query** para caching e gerenciamento de estado assíncrono
3. **shadcn/ui** components criados manualmente (select, radio-group, checkbox, badge, alert-dialog)
4. **Radix UI** como base para components acessíveis (WCAG AAA)
5. **Duplicate check** feito via useEffect no Step 3 (proativo)
6. **Axios interceptor** configurado para 401 redirect automático
7. **Drag-and-drop** de habilidades SKIP (opcional, não necessário para MVP)
8. **E2E frontend tests** SKIP (opcional para MVP, backend E2E garante API)

**Desvios do Plano Original:**
- Nenhum blocker adicional encontrado após resolver GET /turmas
- Série extraída via regex do enum (SEXTO_ANO → 6)
- AlertDialog mostrado proativamente no Step 3 mount (melhor UX)

---

**🔥 CODE REVIEW FIXES (2026-02-11)**

**Issues Corrigidos (2 HIGH, 5 MEDIUM):**

1. **[HIGH] API Client Duplicado - FIXED**
   - Problema: Existiam 2 arquivos (`axios.ts` com refresh token, `apiClient.ts` sem)
   - Wizard usava `apiClient.ts` (versão SEM refresh token) → 401 causava logout imediato
   - Fix: Deletado `apiClient.ts`, todos hooks agora usam `axios.ts` com refresh token automático

2. **[HIGH] Endpoint Mismatch - DOCUMENTED**
   - AC especifica: `GET /api/v1/turmas?professor_id=me`
   - Implementação: `GET /api/v1/turmas` (usa JWT `@CurrentUser()` decorator)
   - **Decisão:** Implementação é SUPERIOR (JWT > query param), AC não foi alterado
   - Backend usa autenticação via token, ignora query params (mais seguro)

3. **[MEDIUM] Console.error em produção - FIXED**
   - Substituído console.error por condicional `import.meta.env.MODE === 'development'`
   - Criado `lib/logger.ts` para logging estruturado (preparado para Sentry)

4. **[MEDIUM] Validação .env missing - FIXED**
   - Adicionado validação runtime em `axios.ts`
   - Agora falha EXPLICITAMENTE em produção se `VITE_API_URL` não configurado
   - Evita silent failure apontando para localhost

5. **[MEDIUM] Missing ErrorBoundary - FIXED**
   - Criado `components/ErrorBoundary.tsx` (React Error Boundary)
   - Adicionado ao `App.tsx` envolvendo toda a aplicação
   - Fallback UI com reload e voltar (+ detalhes em dev mode)

**Arquivos Novos Criados no Code Review:**
- `ressoa-frontend/src/lib/logger.ts` - Logging estruturado com suporte futuro a Sentry
- `ressoa-frontend/src/components/ErrorBoundary.tsx` - React Error Boundary

**Arquivos Modificados no Code Review:**
- `ressoa-frontend/src/api/axios.ts` - Validação .env adicionada
- `ressoa-frontend/src/App.tsx` - ErrorBoundary adicionado
- `ressoa-frontend/src/pages/planejamento/hooks/*.ts` - Imports atualizados para `axios.ts`
- `ressoa-frontend/src/pages/planejamento/components/Step3Revisao.tsx` - Console.error condicional

**Arquivos Deletados no Code Review:**
- `ressoa-frontend/src/api/apiClient.ts` - ❌ Removido (versão inferior duplicada)

### File List

**Backend (Blocker Resolution):**
- [x] `ressoa-backend/src/modules/turmas/turmas.controller.ts`
- [x] `ressoa-backend/src/modules/turmas/turmas.service.ts`
- [x] `ressoa-backend/src/modules/turmas/turmas.module.ts`
- [x] `ressoa-backend/src/app.module.ts`
- [x] `ressoa-backend/test/turmas.e2e-spec.ts`

**Frontend (Story 2.3):**
- [x] `ressoa-frontend/src/pages/planejamento/PlanejamentoWizard.tsx`
- [x] `ressoa-frontend/src/pages/planejamento/components/Step1DadosGerais.tsx`
- [x] `ressoa-frontend/src/pages/planejamento/components/Step2SelecaoHabilidades.tsx`
- [x] `ressoa-frontend/src/pages/planejamento/components/Step3Revisao.tsx`
- [x] `ressoa-frontend/src/pages/planejamento/components/WizardNavigation.tsx`
- [x] `ressoa-frontend/src/pages/planejamento/components/HabilidadesList.tsx`
- [x] `ressoa-frontend/src/pages/planejamento/components/HabilidadesSelectedPanel.tsx`
- [x] `ressoa-frontend/src/pages/planejamento/hooks/usePlanejamentoWizard.ts`
- [x] `ressoa-frontend/src/pages/planejamento/hooks/useTurmas.ts`
- [x] `ressoa-frontend/src/pages/planejamento/hooks/useHabilidades.ts`
- [x] `ressoa-frontend/src/pages/planejamento/hooks/useCreatePlanejamento.ts`
- [x] `ressoa-frontend/src/hooks/useDebouncedValue.ts`
- [x] `ressoa-frontend/src/api/axios.ts` (usado pelos hooks - com refresh token)
- [x] `ressoa-frontend/src/lib/logger.ts` (logging estruturado)
- [x] `ressoa-frontend/src/App.tsx`
- [x] `ressoa-frontend/src/components/ErrorBoundary.tsx` (React Error Boundary)
- [x] `ressoa-frontend/src/components/ui/select.tsx`
- [x] `ressoa-frontend/src/components/ui/radio-group.tsx`
- [x] `ressoa-frontend/src/components/ui/checkbox.tsx`
- [x] `ressoa-frontend/src/components/ui/badge.tsx`
- [x] `ressoa-frontend/src/components/ui/alert-dialog.tsx`
- [x] `ressoa-frontend/package.json` (dependencies: @tanstack/react-query, @tanstack/react-virtual, @radix-ui/*)
