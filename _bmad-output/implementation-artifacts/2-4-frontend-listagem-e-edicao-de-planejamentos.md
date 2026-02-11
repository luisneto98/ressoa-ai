# Story 2.4: Frontend - Listagem e Edição de Planejamentos

Status: review

---

## Story

As a **professor**,
I want **visualizar, editar e excluir meus planejamentos cadastrados**,
So that **posso gerenciar minhas expectativas curriculares ao longo do ano letivo**.

---

## Acceptance Criteria

### LISTAGEM STRUCTURE

**Given** o endpoint GET /planejamentos está funcional (Story 2.1)
**When** crio página `/planejamentos` com listagem:

- **Filtros no topo:**
  - Turma (select: "Todas" ou selecionar específica)
  - Bimestre (select: "Todos" ou 1-4)
  - Ano letivo (select: últimos 3 anos)
  - Botão: "Novo Planejamento" → `/planejamentos/novo`
- **Tabela responsiva (shadcn/ui Table):**
  - Colunas: Turma, Bimestre, Ano, Habilidades (count), Status, Ações
  - Mobile: colapsa em cards verticais
- Ordenação: ano letivo DESC, bimestre DESC, turma nome ASC
- Empty state: "Nenhum planejamento cadastrado. Crie seu primeiro!"

**Then** a listagem está estruturada

---

### STATUS COLUMN

**Given** a estrutura está pronta
**When** implemento coluna "Status":

- **Badge visual:**
  - ✅ "Validado" (verde) se `validado_coordenacao === true`
  - ⚠️ "Aguardando validação" (laranja) se `validado_coordenacao === false`
- Tooltip explica: "Planejamento validado pela coordenação" ou "Aguardando validação da coordenação (não bloqueia uso)"
- RN-PLAN-01: Status não-validado é apenas informativo, não bloqueia

**Then** status de validação é visível

---

### ACTIONS COLUMN

**Given** a coluna Status existe
**When** implemento coluna "Ações":

- Botão: **"Visualizar"** (ícone olho) → abre modal com detalhes
- Botão: **"Editar"** (ícone lápis) → `/planejamentos/:id/editar`
- Botão: **"Excluir"** (ícone lixeira) → abre dialog de confirmação
- Botão: **"Copiar"** (ícone copy) → abre dialog para copiar para outro bimestre

**Then** ações estão disponíveis

---

### VIEW MODAL

**Given** as ações estão implementadas
**When** implemento modal "Visualizar":

- **Dialog (shadcn/ui) com detalhes completos:**
  - Turma: {nome} - {disciplina} - {série}º ano
  - Bimestre: {1-4}
  - Ano letivo: {2026}
  - Status: Badge validado/não-validado
  - **Habilidades (lista expandida):**
    - Código + Descrição
    - Peso (se diferente do padrão)
    - Aulas previstas (se informado)
- Botão: "Fechar"

**Then** modal de visualização mostra todos detalhes

---

### EDIT PAGE

**Given** o modal de visualização existe
**When** implemento página de edição `/planejamentos/:id/editar`:

- Reutiliza wizard de criação (Story 2.3)
- **Pré-preenche dados existentes:**
  - Step 1: turma, bimestre, ano (turma readonly - não pode mudar)
  - Step 2: habilidades selecionadas pré-marcadas
- Submit chama `PATCH /planejamentos/:id` ao invés de POST
- Validações iguais ao cadastro

**Then** edição reutiliza wizard e funciona

---

### DELETE DIALOG

**Given** a edição existe
**When** implemento dialog "Excluir":

- **AlertDialog (shadcn/ui) com confirmação:**
  - Título: "Excluir planejamento?"
  - Descrição: "Esta ação não pode ser desfeita. Tem certeza?"
  - Se há aulas vinculadas: Adiciona warning: "⚠️ Há {N} aulas vinculadas a este planejamento. Elas serão desvinculadas."
  - Botões: "Cancelar", "Excluir" (variant destructive)
- Ao confirmar, chama `DELETE /planejamentos/:id`
- Se erro 400 (aulas vinculadas), mostra mensagem específica
- Se sucesso, remove da lista + toast "Planejamento excluído"

**Then** exclusão tem confirmação e tratamento de erros

---

### COPY DIALOG

**Given** a exclusão existe
**When** implemento dialog "Copiar para outro bimestre":

- **Dialog com form:**
  - Campo: Bimestre destino (select 1-4, excluindo bimestre atual)
  - Campo: Ano letivo destino (number, default: ano atual)
  - Checkbox: "Manter mesmas habilidades" (checked por padrão)
  - Botão: "Copiar"
- **Lógica:**
  1. Busca planejamento atual completo
  2. Cria novo planejamento com dados copiados + bimestre/ano destino
  3. Se "manter habilidades" = true, copia todas relações
  4. Chama `POST /planejamentos` com dados copiados
- Toast: "Planejamento copiado com sucesso!"
- Atualiza listagem automaticamente

**Then** cópia para outro bimestre facilita reutilização

---

### END-TO-END FLOW

**Given** todas funcionalidades estão implementadas
**When** testo o fluxo completo:

1. Acesso `/planejamentos` → vejo lista vazia
2. Clico "Novo Planejamento" → crio primeiro planejamento
3. Retorno para `/planejamentos` → vejo planejamento na lista
4. Status mostra "⚠️ Aguardando validação" (badge laranja)
5. Clico "Visualizar" → modal mostra todos detalhes
6. Clico "Editar" → wizard abre pré-preenchido
7. Adiciono mais 2 habilidades → salvo
8. Retorno para lista → vejo planejamento atualizado
9. Clico "Copiar" → copio para bimestre 2
10. Lista agora tem 2 planejamentos
11. Filtro por bimestre 1 → vejo apenas primeiro
12. Limpo filtros → vejo ambos
13. Clico "Excluir" no segundo → confirmo → planejamento removido
14. Lista volta a ter 1 planejamento

**Then** o fluxo de gerenciamento completo funciona

**And** a tabela é responsiva (mobile mostra cards, desktop mostra tabela)

**And** a página é acessível (keyboard navigation, screen reader friendly)

---

## Tasks / Subtasks

### 1. Create List Page Structure (AC: Listagem Structure)

- [x] Criar route `/planejamentos` no React Router
- [x] Criar componente `PlanejamentosListPage.tsx` em `src/pages/planejamento/`
- [x] Implementar filtros no topo:
  - [x] Select Turma (fetch turmas, opção "Todas")
  - [x] Select Bimestre (1-4, opção "Todos")
  - [x] Select Ano Letivo (últimos 3 anos, default: ano atual)
  - [x] Botão "Novo Planejamento" (navigate to `/planejamentos/novo`)
- [x] Fetch planejamentos com React Query: `GET /api/v1/planejamentos?turma_id={x}&bimestre={y}&ano_letivo={z}`
- [x] Implementar ordenação: `ano_letivo DESC, bimestre DESC, turma.nome ASC`

### 2. Implement Table with Status Column (AC: Status Column)

- [x] Criar `PlanejamentosTable.tsx` component (shadcn/ui Table)
- [x] Definir colunas:
  - [x] Turma (nome + disciplina + série)
  - [x] Bimestre (1-4)
  - [x] Ano Letivo
  - [x] Habilidades (count: `planejamento.habilidades.length`)
  - [x] Status (Badge component)
  - [x] Ações (Action buttons)
- [x] Implementar coluna Status:
  - [x] Badge "Validado" (variant: success/green) se `validado_coordenacao === true`
  - [x] Badge "Aguardando validação" (variant: warning/orange) se `validado_coordenacao === false`
  - [x] Tooltip com explicação (shadcn/ui Tooltip)
- [x] Empty state: Card com mensagem + botão "Criar Primeiro Planejamento"

### 3. Implement Actions Column (AC: Actions Column)

- [x] Criar `PlanejamentoActions.tsx` component (Dropdown menu ou inline buttons)
- [x] Implementar botões de ação:
  - [x] **Visualizar:** ícone Eye (lucide-react), onClick abre modal
  - [x] **Editar:** ícone Pencil, navigate to `/planejamentos/:id/editar`
  - [x] **Copiar:** ícone Copy, onClick abre dialog de cópia
  - [x] **Excluir:** ícone Trash2, onClick abre dialog de confirmação
- [x] Usar DropdownMenu (shadcn/ui) para mobile, inline buttons para desktop

### 4. Implement View Modal (AC: View Modal)

- [x] Criar `ViewPlanejamentoDialog.tsx` component
- [x] Implementar Dialog (shadcn/ui):
  - [x] Header: Título "Detalhes do Planejamento"
  - [x] Content:
    - [x] Turma info (Card)
    - [x] Bimestre + Ano Letivo
    - [x] Status Badge
    - [x] Lista de habilidades (ScrollArea se > 10):
      - [x] Código BNCC (bold)
      - [x] Descrição
      - [x] Peso (formatado como % se diferente de padrão)
      - [x] Aulas previstas (se informado)
  - [x] Footer: Botão "Fechar"
- [x] Fetch planejamento completo: `GET /api/v1/planejamentos/:id` (com includes)

### 5. Implement Edit Page (AC: Edit Page)

- [x] Criar route `/planejamentos/:id/editar` no React Router
- [x] Reutilizar `PlanejamentoWizard.tsx` da Story 2.3
- [x] Criar modo "edit" no wizard:
  - [x] Adicionar prop `mode: 'create' | 'edit'`
  - [x] Adicionar prop `planejamentoId?: string` (para edit mode)
- [x] Fetch planejamento existente: `GET /api/v1/planejamentos/:id`
- [x] Pré-preencher wizard state (Zustand):
  - [x] Step 1: turma_id, bimestre, ano_letivo
  - [x] Campo Turma: readonly (não pode mudar turma)
  - [x] Step 2: selectedHabilidades (pré-marcar checkboxes)
- [x] Submit logic:
  - [x] Se mode='create': POST /planejamentos
  - [x] Se mode='edit': PATCH /planejamentos/:id
- [x] Navigate to `/planejamentos` após sucesso

### 6. Implement Delete Dialog (AC: Delete Dialog)

- [x] Criar `DeletePlanejamentoDialog.tsx` component
- [x] Implementar AlertDialog (shadcn/ui):
  - [x] Título: "Excluir planejamento?"
  - [x] Descrição: "Esta ação não pode ser desfeita. Tem certeza?"
  - [x] Warning condicional: "⚠️ Há {N} aulas vinculadas" (se backend retornar 400)
  - [x] Botões: "Cancelar", "Excluir" (variant destructive, loading state)
- [x] Implementar delete mutation:
  - [x] `DELETE /api/v1/planejamentos/:id`
  - [x] Error handling: 400 → Toast "Não é possível excluir (aulas vinculadas)"
  - [x] Success: Toast "Planejamento excluído", invalidate query
- [x] React Query: `useMutation` com `onSuccess` invalidando lista

### 7. Implement Copy Dialog (AC: Copy Dialog)

- [x] Criar `CopyPlanejamentoDialog.tsx` component
- [x] Implementar Dialog (shadcn/ui) com form:
  - [x] Campo: Bimestre destino (Select 1-4, excluindo bimestre atual)
  - [x] Campo: Ano letivo destino (Input number, default: ano atual)
  - [x] Checkbox: "Manter mesmas habilidades" (checked por padrão)
  - [x] Botão: "Copiar Planejamento" (loading state)
- [x] Implementar lógica de cópia:
  - [x] Fetch planejamento completo (source)
  - [x] Construir payload:
    - [x] turma_id (mesmo)
    - [x] bimestre (destino)
    - [x] ano_letivo (destino)
    - [x] habilidades (copiar se checkbox marcado)
  - [x] POST /api/v1/planejamentos
- [x] Success: Toast "Planejamento copiado", fechar dialog, invalidate lista

### 8. Add Responsive Design (AC: End-to-End Flow)

- [x] Desktop (≥768px): Tabela completa
- [x] Mobile (<768px): Cards verticais
- [x] Implementar `PlanejamentoCard.tsx` component para mobile:
  - [x] Layout vertical (Stack)
  - [x] Todas informações da tabela em card
  - [x] Ações em dropdown menu (não inline buttons)
- [x] Usar Tailwind responsive classes:
  - [x] `hidden md:block` (tabela desktop)
  - [x] `block md:hidden` (cards mobile)
- [x] Testar em viewports: 320px, 768px, 1024px

### 9. Add Accessibility (AC: End-to-End Flow)

- [x] Keyboard navigation:
  - [x] Tab order lógico: Filtros → Tabela → Ações
  - [x] Enter para abrir modal/dialog
  - [x] Escape para fechar modal/dialog
- [x] ARIA labels:
  - [x] Table: `aria-label="Lista de planejamentos"`
  - [x] Action buttons: `aria-label="Visualizar planejamento {turma} bimestre {n}"`
  - [x] Empty state: `role="status"`
- [x] Screen reader:
  - [x] Anunciar quando lista atualiza (live region)
  - [x] Anunciar toast messages (role="alert")
- [x] Focus management:
  - [x] Retornar focus ao botão que abriu dialog ao fechar

### 10. Add E2E Tests (Opcional para MVP)

- [ ] Criar `e2e/planejamentos-list.spec.ts` (Playwright) - SKIP para MVP
- [ ] Testar fluxo completo (14 steps do AC) - SKIP para MVP
- [ ] Testar filtros - SKIP para MVP
- [ ] Testar ações (visualizar, editar, copiar, excluir) - SKIP para MVP

---

## Dev Notes

### **🎨 Design System: Tailwind + shadcn/ui**

**Components Usados:**
- **Table:** Listagem de planejamentos (desktop)
- **Card:** Mobile cards, View modal content
- **Select:** Filtros (Turma, Bimestre, Ano)
- **Button:** Ações, Novo Planejamento
- **Badge:** Status (Validado, Aguardando)
- **Dialog:** View modal, Copy dialog
- **AlertDialog:** Delete confirmation
- **DropdownMenu:** Actions menu (mobile)
- **Tooltip:** Status explanation
- **ScrollArea:** Habilidades list (se > 10)
- **Skeleton:** Loading state

**Installation (if not done):**
```bash
npx shadcn-ui@latest add table card select button badge dialog alert-dialog dropdown-menu tooltip scroll-area skeleton
```

---

### **Architecture: React Query + Zustand**

**React Query Hooks:**

1. **usePlanejamentos (List):**

```typescript
// hooks/usePlanejamentos.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/axios';

interface UsePlanejamentosParams {
  turma_id?: string;
  bimestre?: number;
  ano_letivo?: number;
}

export const usePlanejamentos = (params: UsePlanejamentosParams) => {
  return useQuery({
    queryKey: ['planejamentos', params],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/planejamentos', { params });
      return data;
    },
  });
};
```

2. **usePlanejamento (Single for View/Edit):**

```typescript
// hooks/usePlanejamento.ts
export const usePlanejamento = (id: string) => {
  return useQuery({
    queryKey: ['planejamento', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/planejamentos/${id}`);
      return data;
    },
    enabled: !!id,
  });
};
```

3. **useUpdatePlanejamento (Edit):**

```typescript
// hooks/useUpdatePlanejamento.ts
export const useUpdatePlanejamento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdatePlanejamentoDto }) => {
      const { data } = await api.patch(`/api/v1/planejamentos/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamentos'] });
      queryClient.invalidateQueries({ queryKey: ['planejamento'] });
    },
  });
};
```

4. **useDeletePlanejamento:**

```typescript
// hooks/useDeletePlanejamento.ts
export const useDeletePlanejamento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/planejamentos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamentos'] });
    },
    onError: (error: any) => {
      if (error.response?.status === 400) {
        throw new Error('Não é possível excluir planejamento com aulas vinculadas');
      }
      throw error;
    },
  });
};
```

---

### **Responsive Table Pattern**

**Desktop: Table**

```typescript
// Desktop table (hidden on mobile)
<div className="hidden md:block">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Turma</TableHead>
        <TableHead>Bimestre</TableHead>
        <TableHead>Ano</TableHead>
        <TableHead>Habilidades</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Ações</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {planejamentos.map((p) => (
        <TableRow key={p.id}>
          <TableCell>{p.turma.nome} - {p.turma.disciplina}</TableCell>
          <TableCell>{p.bimestre}</TableCell>
          <TableCell>{p.ano_letivo}</TableCell>
          <TableCell>{p.habilidades.length}</TableCell>
          <TableCell><StatusBadge validado={p.validado_coordenacao} /></TableCell>
          <TableCell><PlanejamentoActions planejamento={p} /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

**Mobile: Cards**

```typescript
// Mobile cards (hidden on desktop)
<div className="block md:hidden space-y-4">
  {planejamentos.map((p) => (
    <Card key={p.id}>
      <CardHeader>
        <CardTitle>{p.turma.nome}</CardTitle>
        <CardDescription>
          {p.turma.disciplina} - {p.turma.serie}º ano
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div>Bimestre: {p.bimestre}</div>
          <div>Ano: {p.ano_letivo}</div>
          <div>Habilidades: {p.habilidades.length}</div>
          <div><StatusBadge validado={p.validado_coordenacao} /></div>
        </div>
      </CardContent>
      <CardFooter>
        <PlanejamentoActionsDropdown planejamento={p} />
      </CardFooter>
    </Card>
  ))}
</div>
```

---

### **Status Badge Component**

```typescript
// components/StatusBadge.tsx
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, Clock } from 'lucide-react';

interface StatusBadgeProps {
  validado: boolean;
}

export const StatusBadge = ({ validado }: StatusBadgeProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          {validado ? (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Validado
            </Badge>
          ) : (
            <Badge variant="warning" className="gap-1">
              <Clock className="h-3 w-3" />
              Aguardando validação
            </Badge>
          )}
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {validado
              ? 'Planejamento validado pela coordenação'
              : 'Aguardando validação da coordenação (não bloqueia uso)'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
```

**Tailwind Config (Custom Badge Variants):**

```javascript
// tailwind.config.js - se variants não existirem
module.exports = {
  theme: {
    extend: {
      // Badge variants (se não tiver)
    }
  }
}

// Ou usar classes diretamente:
// variant="success" → className="bg-green-100 text-green-800"
// variant="warning" → className="bg-orange-100 text-orange-800"
```

---

### **Edit Mode: Reutilizar Wizard da Story 2.3**

**Pattern: Mode Prop**

```typescript
// PlanejamentoWizard.tsx (modificar)
interface PlanejamentoWizardProps {
  mode?: 'create' | 'edit';
  planejamentoId?: string;
}

export const PlanejamentoWizard = ({ mode = 'create', planejamentoId }: PlanejamentoWizardProps) => {
  const { data: planejamento } = usePlanejamento(planejamentoId || '');

  // Pre-fill wizard state in edit mode
  useEffect(() => {
    if (mode === 'edit' && planejamento) {
      setFormData({
        turma_id: planejamento.turma_id,
        turma: planejamento.turma,
        bimestre: planejamento.bimestre,
        ano_letivo: planejamento.ano_letivo,
      });
      // Pre-select habilidades
      planejamento.habilidades.forEach(h => {
        toggleHabilidade(h.habilidade); // Add to selectedHabilidades
      });
    }
  }, [mode, planejamento]);

  // Submit logic
  const handleSubmit = async () => {
    if (mode === 'create') {
      await createPlanejamento.mutateAsync(payload);
    } else {
      await updatePlanejamento.mutateAsync({ id: planejamentoId!, payload });
    }
  };

  return (
    // ... wizard JSX
    // Step 1: Turma field readonly in edit mode
    <Select disabled={mode === 'edit'} ...>
  );
};
```

**Route:**

```typescript
// App.tsx
<Route path="/planejamentos/novo" element={<PlanejamentoWizard mode="create" />} />
<Route path="/planejamentos/:id/editar" element={
  <PlanejamentoWizard mode="edit" planejamentoId={useParams().id} />
} />
```

---

### **Copy Planejamento Pattern**

**Dialog Component:**

```typescript
// CopyPlanejamentoDialog.tsx
export const CopyPlanejamentoDialog = ({ planejamento, open, onOpenChange }: Props) => {
  const [bimestreDestino, setBimestreDestino] = useState<number>(1);
  const [anoLetivoDestino, setAnoLetivoDestino] = useState(new Date().getFullYear());
  const [manterHabilidades, setManterHabilidades] = useState(true);

  const createMutation = useCreatePlanejamento();

  const handleCopy = async () => {
    const payload = {
      turma_id: planejamento.turma_id,
      bimestre: bimestreDestino,
      ano_letivo: anoLetivoDestino,
      habilidades: manterHabilidades
        ? planejamento.habilidades.map(h => ({ habilidade_id: h.habilidade_id }))
        : [],
    };

    await createMutation.mutateAsync(payload);
    toast.success('Planejamento copiado com sucesso!');
    onOpenChange(false);
  };

  // Bimestres disponíveis (excluindo atual)
  const bimestresDisponiveis = [1, 2, 3, 4].filter(b => b !== planejamento.bimestre);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Copiar Planejamento</DialogTitle>
          <DialogDescription>
            Copiar planejamento de {planejamento.turma.nome} - Bimestre {planejamento.bimestre}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Bimestre Destino</Label>
            <Select value={String(bimestreDestino)} onValueChange={(v) => setBimestreDestino(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {bimestresDisponiveis.map(b => (
                  <SelectItem key={b} value={String(b)}>Bimestre {b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Ano Letivo Destino</Label>
            <Input
              type="number"
              value={anoLetivoDestino}
              onChange={(e) => setAnoLetivoDestino(Number(e.target.value))}
              min={2024}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={manterHabilidades}
              onCheckedChange={(checked) => setManterHabilidades(Boolean(checked))}
              id="manter-habilidades"
            />
            <Label htmlFor="manter-habilidades">
              Manter mesmas habilidades ({planejamento.habilidades.length} selecionadas)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCopy} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Copiando...' : 'Copiar Planejamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

---

### **Filter State Management**

**Pattern: URL Query Params (Recommended)**

```typescript
// PlanejamentosListPage.tsx
import { useSearchParams } from 'react-router-dom';

export const PlanejamentosListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read from URL
  const turmaId = searchParams.get('turma_id') || undefined;
  const bimestre = searchParams.get('bimestre') ? Number(searchParams.get('bimestre')) : undefined;
  const anoLetivo = searchParams.get('ano_letivo') ? Number(searchParams.get('ano_letivo')) : new Date().getFullYear();

  // Fetch with filters
  const { data: planejamentos } = usePlanejamentos({ turma_id: turmaId, bimestre, ano_letivo: anoLetivo });

  // Update filters (updates URL)
  const updateFilter = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  return (
    <div>
      {/* Filters */}
      <Select value={turmaId || 'all'} onValueChange={(v) => updateFilter('turma_id', v === 'all' ? null : v)}>
        <SelectItem value="all">Todas as Turmas</SelectItem>
        {turmas.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
      </Select>
      {/* ... */}
    </div>
  );
};
```

**Benefits:**
- Filtros persistem ao refresh
- Shareable URLs (ex: `/planejamentos?turma_id=123&bimestre=1`)
- Browser back/forward funciona

---

### **Empty State Component**

```typescript
// components/EmptyState.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EmptyState = () => {
  const navigate = useNavigate();

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum planejamento cadastrado</h3>
        <p className="text-sm text-gray-500 mb-6">
          Crie seu primeiro planejamento bimestral para começar.
        </p>
        <Button onClick={() => navigate('/planejamentos/novo')}>
          Criar Primeiro Planejamento
        </Button>
      </CardContent>
    </Card>
  );
};
```

---

### **Accessibility Patterns**

**Table ARIA:**

```typescript
<Table aria-label="Lista de planejamentos cadastrados">
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Turma</TableHead>
      {/* ... */}
    </TableRow>
  </TableHeader>
  <TableBody>
    {planejamentos.map((p) => (
      <TableRow key={p.id}>
        <TableCell>{p.turma.nome}</TableCell>
        {/* ... */}
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**Action Buttons ARIA:**

```typescript
<Button
  variant="ghost"
  size="icon"
  aria-label={`Visualizar planejamento de ${p.turma.nome} bimestre ${p.bimestre}`}
  onClick={() => openViewModal(p)}
>
  <Eye className="h-4 w-4" />
</Button>

<Button
  variant="ghost"
  size="icon"
  aria-label={`Editar planejamento de ${p.turma.nome} bimestre ${p.bimestre}`}
  onClick={() => navigate(`/planejamentos/${p.id}/editar`)}
>
  <Pencil className="h-4 w-4" />
</Button>
```

**Live Region for Updates:**

```typescript
// Anunciar quando lista atualiza
<div role="status" aria-live="polite" className="sr-only">
  {planejamentos.length} planejamentos encontrados
</div>
```

---

### **Previous Story Learnings**

**Story 2.3 (Frontend Wizard):**
- ✅ Wizard de 3 steps funcionando
- ✅ Zustand para state management
- ✅ React Query para data fetching
- ✅ shadcn/ui components criados
- ✅ Axios com refresh token automático
- ✅ ErrorBoundary adicionado

**Reuse Patterns:**
- Reutilizar PlanejamentoWizard component (modo edit)
- Reutilizar hooks: useTurmas, useHabilidades
- Reutilizar axios client (com refresh token)

**Integration:**
- Listagem → Botão "Novo" → Wizard (Story 2.3)
- Listagem → Botão "Editar" → Wizard modo edit (Story 2.3 modified)
- Delete → Backend endpoint (Story 2.1)
- Copy → Backend POST endpoint (Story 2.1)

---

### **Folder Structure**

```
src/pages/planejamento/
├── PlanejamentosListPage.tsx          # Main list page
├── PlanejamentoWizard.tsx             # Wizard (from Story 2.3, add edit mode)
├── components/
│   ├── PlanejamentosTable.tsx         # Desktop table
│   ├── PlanejamentoCard.tsx           # Mobile card
│   ├── PlanejamentoActions.tsx        # Action buttons (desktop)
│   ├── PlanejamentoActionsDropdown.tsx # Action dropdown (mobile)
│   ├── StatusBadge.tsx                # Status badge with tooltip
│   ├── ViewPlanejamentoDialog.tsx     # View modal
│   ├── DeletePlanejamentoDialog.tsx   # Delete confirmation
│   ├── CopyPlanejamentoDialog.tsx     # Copy dialog
│   ├── EmptyState.tsx                 # Empty state
│   ├── Step1DadosGerais.tsx           # (from Story 2.3)
│   ├── Step2SelecaoHabilidades.tsx    # (from Story 2.3)
│   └── Step3Revisao.tsx               # (from Story 2.3)
└── hooks/
    ├── usePlanejamentos.ts            # List query
    ├── usePlanejamento.ts             # Single query
    ├── useUpdatePlanejamento.ts       # Update mutation
    ├── useDeletePlanejamento.ts       # Delete mutation
    ├── usePlanejamentoWizard.ts       # (from Story 2.3)
    ├── useTurmas.ts                   # (from Story 2.3)
    ├── useHabilidades.ts              # (from Story 2.3)
    └── useCreatePlanejamento.ts       # (from Story 2.3)
```

---

### **Dependencies**

Already installed from Story 2.3:
- ✅ @tanstack/react-query
- ✅ zustand
- ✅ react-router-dom
- ✅ axios
- ✅ shadcn/ui components (select, button, badge, dialog, alert-dialog)

New for Story 2.4:
- shadcn/ui: table, card, dropdown-menu, tooltip, scroll-area, skeleton

```bash
npx shadcn-ui@latest add table card dropdown-menu tooltip scroll-area skeleton
```

Icons:
- lucide-react (already installed): Eye, Pencil, Trash2, Copy, CheckCircle2, Clock, FileText

---

### **References**

- **[Source: epics.md - Epic 2, Story 2.4]** - Complete acceptance criteria, listagem flow
- **[Source: ux-design-specification.md]** - Design System, responsive patterns, accessibility
- **[Source: architecture.md]** - Frontend stack, React Query patterns
- **[Source: 2-1-backend-planejamento-crud-api.md]** - GET/PATCH/DELETE endpoints
- **[Source: 2-3-frontend-cadastro-de-planejamento-form-wizard.md]** - Wizard reuse, hooks patterns

---

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

- TypeScript build errors (tipo imports, API naming): Resolvidos com `import type` e `apiClient`
- Type mismatch `Turma.serie` (number vs string): Convertido com `String()` cast
- Type mismatch `Turma.ano_letivo`: Adicionado no wizard state durante pre-fill

### Completion Notes List

**✅ Implementação Completa:**
1. **Hooks criados:** 4 hooks React Query (usePlanejamentos, usePlanejamento, useUpdatePlanejamento, useDeletePlanejamento)
2. **List Page:** PlanejamentosListPage com filtros (Turma, Bimestre, Ano), ordenação, loading/empty states
3. **Table Desktop:** PlanejamentosTable com 6 colunas (Turma, Bimestre, Ano, Habilidades, Status, Ações)
4. **Status Badge:** Badge com tooltip (Validado verde, Aguardando validação laranja)
5. **Actions:** 4 botões (Visualizar, Editar, Copiar, Excluir) - inline desktop, dropdown mobile
6. **View Dialog:** Modal com detalhes completos, ScrollArea para lista de habilidades
7. **Edit Mode:** PlanejamentoWizard modificado para suportar mode='edit' + pre-fill + Turma readonly
8. **Delete Dialog:** AlertDialog com confirmação, error handling para aulas vinculadas
9. **Copy Dialog:** Dialog com form (Bimestre destino, Ano destino, Checkbox manter habilidades)
10. **Responsive:** Cards mobile (PlanejamentoCard + PlanejamentoActionsDropdown)
11. **Accessibility:** ARIA labels, keyboard navigation, live regions, focus management
12. **shadcn/ui:** Instalados 6 novos componentes (table, dialog, dropdown-menu, tooltip, scroll-area, skeleton)

**Decisões Técnicas:**
- **URL Query Params:** Filtros persistem na URL (melhor UX, shareable links)
- **Type-only imports:** `import type` para todos os tipos (TypeScript `verbatimModuleSyntax`)
- **API paths:** `/planejamentos` sem `/api/v1/` prefix (já configurado em axios baseURL)
- **Client naming:** `apiClient` (não `api`) conforme convenção existente
- **Edit mode:** Wizard reutilizado com prop `mode`, fetch planejamento, pre-fill Zustand state
- **Responsive pattern:** Tailwind classes `hidden md:block` / `block md:hidden`
- **Toast feedback:** Sonner para todas operações (criar, editar, copiar, excluir)

**Build Status:**
- ✅ TypeScript build: SUCCESS
- ✅ Vite production build: SUCCESS (662KB bundle)
- ⚠️ Warning: Bundle > 500KB (esperado para MVP, otimizar com code-splitting futuramente)

### File List

_Lista de arquivos criados/modificados pelo dev agent:_

**Criados:**
- [x] `ressoa-frontend/src/pages/planejamento/PlanejamentosListPage.tsx`
- [x] `ressoa-frontend/src/pages/planejamento/components/PlanejamentosTable.tsx`
- [x] `ressoa-frontend/src/pages/planejamento/components/PlanejamentoCard.tsx`
- [x] `ressoa-frontend/src/pages/planejamento/components/PlanejamentoActions.tsx`
- [x] `ressoa-frontend/src/pages/planejamento/components/PlanejamentoActionsDropdown.tsx`
- [x] `ressoa-frontend/src/pages/planejamento/components/StatusBadge.tsx`
- [x] `ressoa-frontend/src/pages/planejamento/components/ViewPlanejamentoDialog.tsx`
- [x] `ressoa-frontend/src/pages/planejamento/components/DeletePlanejamentoDialog.tsx`
- [x] `ressoa-frontend/src/pages/planejamento/components/CopyPlanejamentoDialog.tsx`
- [x] `ressoa-frontend/src/pages/planejamento/components/EmptyState.tsx`
- [x] `ressoa-frontend/src/pages/planejamento/hooks/usePlanejamentos.ts`
- [x] `ressoa-frontend/src/pages/planejamento/hooks/usePlanejamento.ts`
- [x] `ressoa-frontend/src/pages/planejamento/hooks/useUpdatePlanejamento.ts`
- [x] `ressoa-frontend/src/pages/planejamento/hooks/useDeletePlanejamento.ts`
- [x] `ressoa-frontend/src/components/ui/table.tsx` (via shadcn)
- [x] `ressoa-frontend/src/components/ui/dialog.tsx` (via shadcn)
- [x] `ressoa-frontend/src/components/ui/dropdown-menu.tsx` (via shadcn)
- [x] `ressoa-frontend/src/components/ui/tooltip.tsx` (via shadcn)
- [x] `ressoa-frontend/src/components/ui/scroll-area.tsx` (via shadcn)
- [x] `ressoa-frontend/src/components/ui/skeleton.tsx` (via shadcn)

**Modificados:**
- [x] `ressoa-frontend/src/pages/planejamento/PlanejamentoWizard.tsx` (add edit mode)
- [x] `ressoa-frontend/src/pages/planejamento/components/Step1DadosGerais.tsx` (turma readonly in edit)
- [x] `ressoa-frontend/src/pages/planejamento/components/Step3Revisao.tsx` (add update mutation)
- [x] `ressoa-frontend/src/App.tsx` (add routes: /planejamentos, /planejamentos/:id/editar)
- [x] `ressoa-frontend/src/components/ErrorBoundary.tsx` (fix type import)
