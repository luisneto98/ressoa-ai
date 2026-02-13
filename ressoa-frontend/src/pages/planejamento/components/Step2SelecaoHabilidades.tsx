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
  const [unidadeTematica, setUnidadeTematica] = useState<string>('ALL');
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  // Extract serie number from turma (handles both number and enum string formats)
  const serieNumber = useMemo(() => {
    if (!formData.turma?.serie) return undefined;

    // If serie is already a number (e.g., 6, 7, 8, 9), return it directly
    if (typeof formData.turma.serie === 'number') {
      return formData.turma.serie;
    }

    // Map BNCC enum strings to numbers
    const serieMap: Record<string, number> = {
      'SEXTO_ANO': 6,
      'SETIMO_ANO': 7,
      'OITAVO_ANO': 8,
      'NONO_ANO': 9,
    };

    const serieStr = String(formData.turma.serie);
    const mapped = serieMap[serieStr];

    console.log('[Serie Mapping]', {
      original: serieStr,
      mapped: mapped,
      isQueryEnabled: !!formData.turma?.disciplina && !!mapped,
    });

    return mapped;
  }, [formData.turma?.serie, formData.turma?.disciplina]);

  const { data: habilidadesData, isLoading, error } = useHabilidades({
    disciplina: formData.turma?.disciplina,
    serie: serieNumber,
    unidade_tematica: unidadeTematica === 'ALL' ? undefined : unidadeTematica,
    search: debouncedSearch || undefined,
  });

  // DEBUG: Log query params for troubleshooting
  console.log('[Step2 Debug] Full State:', {
    'formData.turma_id': formData.turma_id,
    'formData.turma': formData.turma,
    'formData.bimestre': formData.bimestre,
    'formData.ano_letivo': formData.ano_letivo,
    disciplina: formData.turma?.disciplina,
    serieOriginal: formData.turma?.serie,
    serieNumber,
    isQueryEnabled: !!formData.turma?.disciplina && !!serieNumber,
    habilidadesCount: habilidadesData?.length ?? 0,
    isLoading,
    error: error?.message,
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
                <SelectItem value="ALL">Todas</SelectItem>
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
