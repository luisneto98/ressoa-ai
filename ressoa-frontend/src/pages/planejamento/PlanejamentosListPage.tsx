import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePlanejamentos } from './hooks/usePlanejamentos';
import type { Planejamento } from './hooks/usePlanejamentos';
import { useTurmas } from './hooks/useTurmas';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlanejamentosTable } from './components/PlanejamentosTable';
import { PlanejamentoCard } from './components/PlanejamentoCard';
import { EmptyState } from './components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

export const PlanejamentosListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read filters from URL
  const turmaId = searchParams.get('turma_id') || undefined;
  const bimestre = searchParams.get('bimestre') ? Number(searchParams.get('bimestre')) : undefined;
  const anoLetivo = searchParams.get('ano_letivo')
    ? Number(searchParams.get('ano_letivo'))
    : new Date().getFullYear();

  // Fetch data
  const { data: planejamentos = [], isLoading } = usePlanejamentos({
    turma_id: turmaId,
    bimestre,
    ano_letivo: anoLetivo,
  });
  const { data: turmas = [] } = useTurmas();

  // Update filter helper
  const updateFilter = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  // Generate last 3 years
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <div className="min-h-screen bg-ghost-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-montserrat font-bold text-deep-navy mb-2">
            Meus Planejamentos
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas expectativas curriculares ao longo do ano letivo
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
          {/* Turma Filter */}
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Turma</label>
            <Select
              value={turmaId || 'all'}
              onValueChange={(v) => updateFilter('turma_id', v === 'all' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as turmas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as turmas</SelectItem>
                {turmas.map((turma) => (
                  <SelectItem key={turma.id} value={turma.id}>
                    {turma.nome} - {turma.disciplina} - {turma.serie}º ano
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bimestre Filter */}
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Bimestre</label>
            <Select
              value={bimestre ? String(bimestre) : 'all'}
              onValueChange={(v) => updateFilter('bimestre', v === 'all' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os bimestres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os bimestres</SelectItem>
                {[1, 2, 3, 4].map((b) => (
                  <SelectItem key={b} value={String(b)}>
                    Bimestre {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ano Letivo Filter */}
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Ano Letivo</label>
            <Select
              value={String(anoLetivo)}
              onValueChange={(v) => updateFilter('ano_letivo', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* New Button */}
          <Button
            onClick={() => navigate('/planejamentos/novo')}
            className="bg-tech-blue hover:bg-tech-blue/90"
          >
            Novo Planejamento
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && planejamentos.length === 0 && <EmptyState />}

        {/* Table (Desktop) */}
        {!isLoading && planejamentos.length > 0 && (
          <div className="hidden md:block">
            <PlanejamentosTable planejamentos={planejamentos} />
          </div>
        )}

        {/* Cards (Mobile) */}
        {!isLoading && planejamentos.length > 0 && (
          <div className="block md:hidden space-y-4">
            {planejamentos.map((planejamento: Planejamento) => (
              <PlanejamentoCard key={planejamento.id} planejamento={planejamento} />
            ))}
          </div>
        )}

        {/* Live region for screen readers */}
        <div role="status" aria-live="polite" className="sr-only">
          {planejamentos.length} planejamentos encontrados
        </div>
      </div>
    </div>
  );
};
