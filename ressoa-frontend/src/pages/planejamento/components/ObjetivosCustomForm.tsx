import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { IconAlertCircle, IconPlus } from '@tabler/icons-react';
import type { CreateObjetivoDto } from '@/types/objetivo';
import { ObjetivoFormInline } from './ObjetivoFormInline';
import { ObjetivoCard } from './ObjetivoCard';
import { DeleteObjetivoDialog } from './DeleteObjetivoDialog';
import { suggestObjetivoCodigo } from '../utils/suggestObjetivoCodigo';
import type { Turma } from '@/types/turma';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface LocalObjetivo extends CreateObjetivoDto {
  localId: string; // ID temporário para DnD (antes de salvar no backend)
}

interface ObjetivosCustomFormProps {
  turma: Turma;
  onNext: (objetivos: CreateObjetivoDto[]) => void;
}

/**
 * Componente SortableObjetivoCard (wrapper com drag-and-drop)
 */
function SortableObjetivoCard({
  objetivo,
  onEdit,
  onRemove,
}: {
  objetivo: LocalObjetivo;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: objetivo.localId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Converter LocalObjetivo para ObjetivoCustom mock (card espera ObjetivoCustom completo)
  const objetivoMock = {
    id: objetivo.localId,
    codigo: objetivo.codigo,
    descricao: objetivo.descricao,
    nivel_cognitivo: objetivo.nivel_cognitivo,
    area_conhecimento: objetivo.area_conhecimento,
    criterios_evidencia: objetivo.criterios_evidencia,
    ordem: objetivo.ordem,
    turma_id: '',
    created_at: '',
    updated_at: '',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ObjetivoCard
        objetivo={objetivoMock}
        onEdit={onEdit}
        onRemove={onRemove}
        dragHandleProps={{ ...attributes, ...listeners }}
        className={isDragging ? 'border-dashed border-blue-400' : ''}
      />
    </div>
  );
}

/**
 * Formulário completo de gestão de objetivos customizados
 *
 * - Lista de objetivos com drag-and-drop reordenação (@dnd-kit)
 * - Formulário inline para criar/editar objetivos
 * - Validação mínimo 3 objetivos (máximo 10)
 * - Contador dinâmico e botão "Próximo" condicional
 * - Sugestão automática de código
 *
 * @param turma - Turma customizada
 * @param onNext - Callback ao avançar para Step 3 (recebe array de objetivos)
 */
export function ObjetivosCustomForm({ turma, onNext }: ObjetivosCustomFormProps) {
  const { toast } = useToast();
  const [objetivos, setObjetivos] = useState<LocalObjetivo[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [objetivoToDelete, setObjetivoToDelete] = useState<LocalObjetivo | null>(null);

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setObjetivos((items) => {
        const oldIndex = items.findIndex((item) => item.localId === active.id);
        const newIndex = items.findIndex((item) => item.localId === over.id);

        const reordered = arrayMove(items, oldIndex, newIndex);

        // Atualizar campo `ordem`
        return reordered.map((item, index) => ({ ...item, ordem: index + 1 }));
      });
    }
  };

  const handleSaveObjetivo = (data: CreateObjetivoDto) => {
    if (editingIndex !== null) {
      // Editar existente
      setObjetivos((prev) =>
        prev.map((obj, i) =>
          i === editingIndex
            ? { ...obj, ...data }
            : obj
        )
      );
      toast({
        title: 'Objetivo atualizado',
        description: `Objetivo ${data.codigo} foi atualizado com sucesso.`,
      });
    } else {
      // Adicionar novo
      const newObjetivo: LocalObjetivo = {
        ...data,
        localId: `temp-${Date.now()}-${Math.random()}`,
        ordem: objetivos.length + 1,
      };
      setObjetivos((prev) => [...prev, newObjetivo]);
      toast({
        title: 'Objetivo adicionado',
        description: `Objetivo ${data.codigo} foi adicionado à lista.`,
      });
    }

    setIsFormOpen(false);
    setEditingIndex(null);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingIndex(null);
  };

  const handleEditObjetivo = (index: number) => {
    setEditingIndex(index);
    setIsFormOpen(true);
  };

  const handleRemoveObjetivo = (objetivo: LocalObjetivo) => {
    setObjetivoToDelete(objetivo);
  };

  const confirmRemoveObjetivo = () => {
    if (objetivoToDelete) {
      setObjetivos((prev) =>
        prev
          .filter((obj) => obj.localId !== objetivoToDelete.localId)
          .map((obj, i) => ({ ...obj, ordem: i + 1 }))
      );
      toast({
        title: 'Objetivo removido',
        description: `Objetivo ${objetivoToDelete.codigo} foi removido da lista.`,
        variant: 'destructive',
      });
      setObjetivoToDelete(null);
    }
  };

  const handleSuggestCodigo = (area?: string) => {
    const existingCodes = objetivos.map((obj) => obj.codigo);
    return suggestObjetivoCodigo(turma, area, existingCodes);
  };

  const handleNext = () => {
    if (objetivos.length < 3) {
      toast({
        title: 'Mínimo de objetivos não atingido',
        description: 'Adicione pelo menos 3 objetivos para continuar.',
        variant: 'destructive',
      });
      return;
    }

    // Converter LocalObjetivo para CreateObjetivoDto (remover localId)
    const objetivosToSave: CreateObjetivoDto[] = objetivos.map(
      ({ localId, ...resto }) => resto
    );

    onNext(objetivosToSave);
  };

  const canProceed = objetivos.length >= 3;
  const isMaxReached = objetivos.length >= 10;

  // Contador dinâmico
  const contadorTexto =
    objetivos.length < 3
      ? `${objetivos.length}/3 objetivos (adicione mais ${3 - objetivos.length})`
      : objetivos.length >= 10
      ? `${objetivos.length}/10 objetivos (máximo atingido)`
      : `${objetivos.length}/3 objetivos ✅ (pode adicionar até ${10 - objetivos.length} mais)`;

  const contadorColor =
    objetivos.length < 3
      ? 'text-red-600 font-medium'
      : objetivos.length >= 10
      ? 'text-orange-600 font-medium'
      : 'text-green-600 font-medium';

  return (
    <div className="space-y-6">
      {/* Header com tooltip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Objetivos de Aprendizagem Customizados
          </h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <IconAlertCircle className="h-5 w-5 text-blue-600 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-md">
                <p className="text-sm font-medium mb-2">
                  Defina pelo menos 3 objetivos pedagógicos específicos do curso
                </p>
                <p className="text-xs text-gray-600 mb-2">
                  Objetivos de aprendizagem são as competências e conhecimentos que os alunos
                  devem desenvolver neste bimestre. Quanto mais específicos, melhor a análise da IA.
                </p>
                <div className="text-xs text-gray-700 space-y-1 mt-2 border-t pt-2">
                  <p className="font-medium">Exemplo (Preparatório PM):</p>
                  <p>• Código: PM-MAT-01</p>
                  <p>• Descrição: Resolver problemas de razão e proporção aplicados a questões da PM-SP</p>
                  <p>• Nível: Aplicar (usar conhecimento em situações práticas)</p>
                  <p>• Critérios: Identificar dados, aplicar regra de três, interpretar resultado</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <p className={cn('text-sm', contadorColor)}>{contadorTexto}</p>
      </div>

      {/* Formulário inline (create/edit) */}
      {isFormOpen && (
        <ObjetivoFormInline
          mode={editingIndex !== null ? 'edit' : 'create'}
          defaultValues={editingIndex !== null ? objetivos[editingIndex] : undefined}
          onSave={handleSaveObjetivo}
          onCancel={handleCancelForm}
          onSuggestCodigo={() => handleSuggestCodigo()}
          existingCodes={objetivos.map((obj) => obj.codigo)}
          objetivoIndex={editingIndex !== null ? editingIndex : objetivos.length}
        />
      )}

      {/* Lista de objetivos (drag-and-drop) */}
      {objetivos.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={objetivos.map((obj) => obj.localId)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {objetivos.map((objetivo, index) => (
                <SortableObjetivoCard
                  key={objetivo.localId}
                  objetivo={objetivo}
                  onEdit={() => handleEditObjetivo(index)}
                  onRemove={() => handleRemoveObjetivo(objetivo)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Botão adicionar primeiro/novo objetivo */}
      {!isFormOpen && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setIsFormOpen(true)}
          disabled={isMaxReached}
        >
          <IconPlus className="h-4 w-4 mr-2" />
          {objetivos.length === 0
            ? 'Adicionar Primeiro Objetivo'
            : `Adicionar Objetivo (${objetivos.length}/10)`}
        </Button>
      )}

      {/* Aviso mínimo 3 objetivos */}
      {!canProceed && objetivos.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            ⚠️ Adicione pelo menos 3 objetivos para continuar
          </p>
        </div>
      )}

      {/* Botão Próximo */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          type="button"
          onClick={handleNext}
          disabled={!canProceed}
          className={cn(!canProceed && 'opacity-50 cursor-not-allowed')}
        >
          Próximo
        </Button>
      </div>

      {/* Dialog de confirmação de remoção */}
      <DeleteObjetivoDialog
        open={!!objetivoToDelete}
        onOpenChange={(open) => !open && setObjetivoToDelete(null)}
        objetivoCodigo={objetivoToDelete?.codigo || ''}
        onConfirm={confirmRemoveObjetivo}
      />
    </div>
  );
}
