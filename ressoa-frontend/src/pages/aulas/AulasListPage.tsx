import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAulas } from '@/hooks/useAulas';
import { useReprocessAula } from '@/hooks/useReprocessAula';
import { useDeleteAula } from '@/hooks/useDeleteAula';
import { useStartAnalise } from '@/hooks/useStartAnalise';
import { AulasFilters } from './components/AulasFilters';
import { AulasTable } from './components/AulasTable';
import { AulasCards } from './components/AulasCards';
import { AulaDetailsModal } from './components/AulaDetailsModal';
import { AulasListSkeleton } from './components/AulasListSkeleton';
import { AulasListEmpty } from './components/AulasListEmpty';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { AulaListItem } from '@/api/aulas';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AulasListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedAula, setSelectedAula] = useState<AulaListItem | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; aulaId: string | null }>({
    open: false,
    aulaId: null,
  });
  const [reprocessDialog, setReprocessDialog] = useState<{ open: boolean; aulaId: string | null }>({
    open: false,
    aulaId: null,
  });

  const page = parseInt(searchParams.get('page') || '1', 10);
  const filters = {
    turma_id: searchParams.get('turma_id') || undefined,
    data_inicio: searchParams.get('data_inicio') || undefined,
    data_fim: searchParams.get('data_fim') || undefined,
    status: searchParams.getAll('status') || [], // FIX: use getAll for multi-status
    page,
    limit: 20,
  };

  const { data: aulas = [], isLoading } = useAulas(filters);
  const { mutate: reprocessAula } = useReprocessAula();
  const { mutate: deleteAula } = useDeleteAula();
  const { mutate: startAnalise } = useStartAnalise();

  const handleFilterChange = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset to page 1 when filters change
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleStatusChange = (statuses: string[]) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('status'); // Clear all existing
    statuses.forEach(s => newParams.append('status', s)); // Add all selected
    newParams.set('page', '1'); // Reset to page 1
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(newPage));
    setSearchParams(newParams);
  };

  const handleViewDetails = (id: string) => {
    const aula = aulas.find((a: AulaListItem) => a.id === id);
    if (aula) {
      setSelectedAula(aula);
      setDetailsModalOpen(true);
    }
  };

  const handleReview = (id: string) => {
    navigate(`/aulas/${id}/analise`);
  };

  const handleStartAnalise = (id: string) => {
    startAnalise(id);
  };

  const handleReprocess = (id: string) => {
    setReprocessDialog({ open: true, aulaId: id });
  };

  const confirmReprocess = () => {
    if (reprocessDialog.aulaId) {
      reprocessAula(reprocessDialog.aulaId);
    }
    setReprocessDialog({ open: false, aulaId: null });
  };

  const handleDelete = (id: string) => {
    setDeleteDialog({ open: true, aulaId: id });
  };

  const confirmDelete = () => {
    if (deleteDialog.aulaId) {
      deleteAula(deleteDialog.aulaId);
    }
    setDeleteDialog({ open: false, aulaId: null });
  };

  // Calculate total pages (assuming backend returns total count)
  // For now, show "Next" disabled if < 20 results
  const hasNextPage = aulas.length === 20;
  const hasPrevPage = page > 1;

  return (
    <div className="min-h-screen bg-ghost-white">
      <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-montserrat font-bold text-deep-navy mb-2">Minhas Aulas</h1>
          <p className="text-deep-navy/80">Visualize e gerencie suas aulas</p>
        </div>
        <Button onClick={() => navigate('/aulas/upload')}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Aula
        </Button>
      </div>

      {/* Filters */}
      <AulasFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onStatusChange={handleStatusChange}
        onClearFilters={handleClearFilters}
      />

      {/* Content */}
      {isLoading ? (
        <AulasListSkeleton />
      ) : aulas.length === 0 ? (
        <AulasListEmpty />
      ) : (
        <>
          <AulasTable
            aulas={aulas}
            onViewDetails={handleViewDetails}
            onReview={handleReview}
            onReprocess={handleReprocess}
            onDelete={handleDelete}
            onStartAnalise={handleStartAnalise}
          />
          <AulasCards
            aulas={aulas}
            onViewDetails={handleViewDetails}
            onReview={handleReview}
            onReprocess={handleReprocess}
            onDelete={handleDelete}
            onStartAnalise={handleStartAnalise}
          />

          {/* Pagination */}
          <div className="mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => hasPrevPage && handlePageChange(page - 1)}
                    className={!hasPrevPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>

                {/* Page numbers */}
                {page > 1 && (
                  <PaginationItem>
                    <PaginationLink onClick={() => handlePageChange(page - 1)} className="cursor-pointer">
                      {page - 1}
                    </PaginationLink>
                  </PaginationItem>
                )}

                <PaginationItem>
                  <PaginationLink isActive className="cursor-default">
                    {page}
                  </PaginationLink>
                </PaginationItem>

                {hasNextPage && (
                  <PaginationItem>
                    <PaginationLink onClick={() => handlePageChange(page + 1)} className="cursor-pointer">
                      {page + 1}
                    </PaginationLink>
                  </PaginationItem>
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => hasNextPage && handlePageChange(page + 1)}
                    className={!hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </>
      )}

      {/* Details Modal */}
      <AulaDetailsModal
        aula={selectedAula}
        open={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedAula(null);
        }}
      />

      {/* Reprocess Confirmation Dialog */}
      <AlertDialog open={reprocessDialog.open} onOpenChange={(open) => setReprocessDialog({ open, aulaId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reprocessar aula?</AlertDialogTitle>
            <AlertDialogDescription>
              A aula será adicionada novamente à fila de processamento. Esta ação pode levar alguns minutos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReprocessDialog({ open: false, aulaId: null })}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmReprocess}>
              Reprocessar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, aulaId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aula?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A aula e todos os dados relacionados serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialog({ open: false, aulaId: null })}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
