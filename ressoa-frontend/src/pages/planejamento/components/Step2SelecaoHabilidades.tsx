import { useState, useMemo } from 'react';
import { usePlanejamentoWizard } from '../hooks/usePlanejamentoWizard';
import { useHabilidades } from '../hooks/useHabilidades';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { HabilidadesList } from './HabilidadesList';
import { HabilidadesSelectedPanel } from './HabilidadesSelectedPanel';

export const Step2SelecaoHabilidades = () => {
  const {
    formData,
    selectedHabilidades,
    toggleHabilidade,
    removeHabilidade,
    nextStep,
    prevStep,
  } = usePlanejamentoWizard();

  const [searchInput, setSearchInput] = useState('');
  const [unidadeTematica, setUnidadeTematica] = useState<string>('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  // Extract serie number from enum (e.g., "SEXTO_ANO" -> 6)
  const serieNumber = useMemo(() => {
    if (!formData.turma?.serie) return undefined;
    const match = formData.turma.serie.match(/\d+/);
    return match ? parseInt(match[0]) : undefined;
  }, [formData.turma?.serie]);

  const { data: habilidadesData, isLoading } = useHabilidades({
    disciplina: formData.turma?.disciplina,
    serie: serieNumber,
    unidade_tematica: unidadeTematica || undefined,
    search: debouncedSearch || undefined,
  });

  // Extract unique unidades tematicas
  const unidadesTematicas = useMemo(() => {
    if (!habilidadesData) return [];
    const uniques = new Set(
      habilidadesData
        .map((h) => h.unidade_tematica)
        .filter((u): u is string => !!u),
    );
    return Array.from(uniques).sort();
  }, [habilidadesData]);

  const selectedIds = useMemo(
    () => new Set(selectedHabilidades.map((h) => h.id)),
    [selectedHabilidades],
  );

  const canProceed = selectedHabilidades.length > 0;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-deep-navy">
          Seleção de Habilidades
        </h2>

        {/* Filters */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div>
            <Label htmlFor="disciplina-display">Disciplina</Label>
            <Input
              id="disciplina-display"
              value={formData.turma?.disciplina || ''}
              readOnly
              disabled
              className="bg-gray-50"
            />
          </div>
          <div>
            <Label htmlFor="serie-display">Série</Label>
            <Input
              id="serie-display"
              value={formData.turma?.serie || ''}
              readOnly
              disabled
              className="bg-gray-50"
            />
          </div>
          <div>
            <Label htmlFor="unidade-tematica">Unidade Temática</Label>
            <Select value={unidadeTematica} onValueChange={setUnidadeTematica}>
              <SelectTrigger id="unidade-tematica">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {unidadesTematicas.map((ut) => (
                  <SelectItem key={ut} value={ut}>
                    {ut}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="search-input">Buscar</Label>
            <Input
              id="search-input"
              placeholder="Digite para buscar..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Lists */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            {isLoading ? (
              <div className="flex h-[500px] items-center justify-center rounded border bg-gray-50">
                Carregando habilidades...
              </div>
            ) : (
              <HabilidadesList
                habilidades={habilidadesData || []}
                selectedIds={selectedIds}
                onToggle={toggleHabilidade}
              />
            )}
          </div>
          <div>
            <HabilidadesSelectedPanel
              habilidades={selectedHabilidades}
              onRemove={removeHabilidade}
            />
          </div>
        </div>

        {!canProceed && (
          <p className="mt-4 text-sm text-red-500" role="alert">
            * Selecione pelo menos 1 habilidade para continuar
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          aria-label="Voltar para dados gerais"
        >
          Voltar
        </Button>
        <Button
          type="button"
          onClick={nextStep}
          disabled={!canProceed}
          className="bg-tech-blue hover:bg-tech-blue/90"
          aria-label="Avançar para revisão"
        >
          Próximo
        </Button>
      </div>
    </div>
  );
};
