import { useState } from 'react';
import { IconPlus, IconSchoolOff } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useTurmas, useCreateTurma, useUpdateTurma, useDeleteTurma } from '@/hooks/useTurmas';
import { TurmasTable } from './components/TurmasTable';
import { TurmasTableSkeleton } from './components/TurmasTableSkeleton';
import { TurmaFormDialog } from './components/TurmaFormDialog';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import type { Turma } from '@/types/turma';
import type { TurmaFormData } from '@/lib/validation/turma.schema';

/**
 * Turmas List Page - CRUD interface for managing turmas
 * Story 10.4 - AC#1, #2, #3, #11, #12
 *
 * Features:
 * - List all turmas in table format
 * - Create, Edit, Delete operations
 * - Loading skeleton
 * - Empty state
 * - RBAC: Only DIRETOR and COORDENADOR can access (enforced by route guard)
 */

export default function TurmasListPage() {
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const { data: turmas = [], isLoading } = useTurmas();
  const createMutation = useCreateTurma();
  const updateMutation = useUpdateTurma();
  const deleteMutation = useDeleteTurma();

  // Open create dialog
  const handleCreateClick = () => {
    setSelectedTurma(null);
    setFormMode('create');
    setFormDialogOpen(true);
  };

  // Open edit dialog
  const handleEdit = (turma: Turma) => {
    setSelectedTurma(turma);
    setFormMode('edit');
    setFormDialogOpen(true);
  };

  // Open delete confirmation
  const handleDelete = (turma: Turma) => {
    setSelectedTurma(turma);
    setDeleteDialogOpen(true);
  };

  // Form submit handler
  const handleFormSubmit = async (data: TurmaFormData) => {
    if (formMode === 'create') {
      await createMutation.mutateAsync(data);
    } else if (selectedTurma) {
      await updateMutation.mutateAsync({ id: selectedTurma.id, data });
    }
  };

  // Delete confirmation handler
  const handleDeleteConfirm = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Gestão de Turmas</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-deep-navy text-4xl font-bold mb-2">
            Gestão de Turmas
          </h1>
          <p className="text-gray-600 text-lg">
            Cadastre e gerencie as turmas da escola
          </p>
        </div>
        <Button
          onClick={handleCreateClick}
          className="bg-focus-orange hover:bg-focus-orange/90 text-white h-11 px-6 gap-2"
          aria-label="Criar nova turma"
        >
          <IconPlus size={20} aria-hidden="true" />
          Nova Turma
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <TurmasTableSkeleton />
      ) : turmas.length === 0 ? (
        // Empty state (AC#11)
        <Card className="flex flex-col items-center justify-center py-16 px-6 text-center border-2 border-dashed border-gray-300">
          <IconSchoolOff size={64} className="text-gray-400 mb-4" aria-hidden="true" />
          <h2 className="font-heading text-deep-navy text-2xl font-semibold mb-2">
            Nenhuma turma cadastrada
          </h2>
          <p className="text-gray-600 mb-6 max-w-md">
            Crie a primeira turma para começar a gerenciar sua escola
          </p>
          <Button
            onClick={handleCreateClick}
            className="bg-focus-orange hover:bg-focus-orange/90 text-white h-11 px-6 gap-2"
            aria-label="Criar primeira turma da escola"
          >
            <IconPlus size={20} aria-hidden="true" />
            Criar Primeira Turma
          </Button>
        </Card>
      ) : (
        <TurmasTable turmas={turmas} onEdit={handleEdit} onDelete={handleDelete} />
      )}

      {/* Create/Edit Dialog */}
      <TurmaFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        mode={formMode}
        defaultValues={selectedTurma || undefined}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        turma={selectedTurma}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
