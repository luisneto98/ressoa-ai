import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TimelineBimestreCard } from './TimelineBimestreCard';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import type { Planejamento } from '../hooks/usePlanejamentos';
import { IconCalendarOff } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

interface TimelinePlanosProps {
  turmaId?: string;
  anoLetivo: number;
  planejamentos: Planejamento[];
  isLoading: boolean;
}

/**
 * TimelinePlanos - Componente principal de visualização em timeline
 *
 * Renderiza linha do tempo de planejamentos bimestrais (B1-B4) em grid 2x2 (desktop)
 * ou stack vertical (mobile).
 *
 * Features:
 * - Layout responsivo (grid 2x2 desktop, stack mobile)
 * - Loading state com SkeletonLoader branded
 * - Empty state empático quando não há planejamentos
 * - Expansão/colapso individual de cada bimestre (estado persistente)
 * - Navegação para criação/edição de planejamentos
 *
 * Performance:
 * - useMemo para mapear planejamentos por bimestre
 * - React.memo em TimelineBimestreCard para evitar re-renders
 *
 * Accessibility:
 * - role="region" com aria-label descritivo
 * - WCAG AAA contrast ratios
 * - Navegação por teclado completa
 *
 * @param turmaId - ID da turma selecionada (para filtro e expansão)
 * @param anoLetivo - Ano letivo selecionado
 * @param planejamentos - Array de planejamentos (já filtrados)
 * @param isLoading - Estado de carregamento
 */
export function TimelinePlanos({
  turmaId,
  anoLetivo,
  planejamentos,
  isLoading,
}: TimelinePlanosProps) {
  const navigate = useNavigate();

  // Mapear planejamentos para bimestres (1-4)
  const planejamentoPorBimestre = useMemo(() => {
    return [1, 2, 3, 4].map((bimestre) => ({
      bimestre,
      planejamento: planejamentos.find((p) => p.bimestre === bimestre),
    }));
  }, [planejamentos]);

  // Callbacks
  const handleEdit = React.useCallback(
    (planejamentoId: string) => {
      navigate(`/planejamentos/${planejamentoId}/editar`);
    },
    [navigate]
  );

  const handleCreate = React.useCallback(
    (bimestre: number) => {
      // Navegar para wizard com params pré-preenchidos
      const params = new URLSearchParams();
      if (turmaId) params.set('turma_id', turmaId);
      params.set('bimestre', String(bimestre));
      params.set('ano_letivo', String(anoLetivo));

      navigate(`/planejamentos/novo?${params.toString()}`);
    },
    [navigate, turmaId, anoLetivo]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="animate-in fade-in duration-200">
        <SkeletonLoader variant="card" count={4} />
      </div>
    );
  }

  // Empty state (nenhum planejamento encontrado com filtros atuais)
  if (planejamentos.length === 0) {
    return (
      <div
        role="region"
        aria-label="Timeline de planejamentos vazia"
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <IconCalendarOff
          className="w-16 h-16 text-gray-400 mb-4"
          aria-hidden="true"
        />
        <h3 className="text-xl font-montserrat font-semibold text-gray-700 mb-2">
          Nenhum planejamento encontrado
        </h3>
        <p className="text-gray-600 mb-6 max-w-md">
          {turmaId
            ? 'Não há planejamentos cadastrados para esta turma e ano letivo.'
            : 'Selecione uma turma para visualizar os planejamentos ou crie um novo.'}
        </p>
        {turmaId && (
          <Button
            onClick={() => handleCreate(1)}
            className="bg-tech-blue hover:bg-tech-blue/90"
          >
            Criar Primeiro Planejamento
          </Button>
        )}
      </div>
    );
  }

  // Timeline visual
  return (
    <div
      role="region"
      aria-label="Linha do tempo de planejamentos bimestrais"
      className="animate-in fade-in duration-200"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {planejamentoPorBimestre.map(({ bimestre, planejamento }) => (
          <TimelineBimestreCard
            key={bimestre}
            bimestre={bimestre}
            planejamento={planejamento}
            turmaId={turmaId}
            onEdit={handleEdit}
            onCreate={handleCreate}
          />
        ))}
      </div>
    </div>
  );
}
