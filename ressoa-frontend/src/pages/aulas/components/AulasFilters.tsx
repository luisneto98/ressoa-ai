import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronsUpDown } from 'lucide-react';
import { IconFilterX } from '@tabler/icons-react';
import { fetchProfessorTurmas, type Turma } from '@/api/aulas';
import { useQuery } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface AulasFiltersProps {
  filters: {
    turma_id?: string;
    data_inicio?: string;
    data_fim?: string;
    status?: string[];
  };
  onFilterChange: (key: string, value: string | null) => void;
  onStatusChange: (statuses: string[]) => void;
  onClearFilters: () => void;
}

const STATUS_OPTIONS = [
  { value: 'CRIADA', label: 'Criada' },
  { value: 'UPLOAD_PROGRESSO', label: 'Enviando' },
  { value: 'AGUARDANDO_TRANSCRICAO', label: 'Aguardando transcrição' },
  { value: 'TRANSCRITA', label: 'Transcrita' },
  { value: 'ANALISANDO', label: 'Analisando' },
  { value: 'ANALISADA', label: 'Pronta para revisão' },
  { value: 'APROVADA', label: 'Aprovada' },
  { value: 'REJEITADA', label: 'Rejeitada' },
  { value: 'ERRO', label: 'Erro' },
];

export const AulasFilters = ({ filters, onFilterChange, onStatusChange, onClearFilters }: AulasFiltersProps) => {
  const { data: turmas = [], isLoading: turmasLoading } = useQuery<Turma[]>({
    queryKey: ['turmas'],
    queryFn: fetchProfessorTurmas,
  });

  const hasActiveFilters = !!(
    filters.turma_id ||
    filters.data_inicio ||
    filters.data_fim ||
    (filters.status && filters.status.length > 0)
  );

  const toggleStatus = (statusValue: string) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(statusValue)
      ? currentStatuses.filter(s => s !== statusValue)
      : [...currentStatuses, statusValue];
    onStatusChange(newStatuses);
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Turma Filter */}
        <div className="space-y-2">
          <Label htmlFor="turma-filter" className="text-deep-navy font-medium">Turma</Label>
          <Select
            value={filters.turma_id || '__all__'}
            onValueChange={(value) => onFilterChange('turma_id', value === '__all__' ? null : value)}
            disabled={turmasLoading}
          >
            <SelectTrigger id="turma-filter">
              <SelectValue placeholder={turmasLoading ? "Carregando..." : "Todas as turmas"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas as turmas</SelectItem>
              {turmas.map((turma) => (
                <SelectItem key={turma.id} value={turma.id}>
                  {turma.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Data Início Filter */}
        <div className="space-y-2">
          <Label htmlFor="data-inicio-filter" className="text-deep-navy font-medium">Data Início</Label>
          <Input
            id="data-inicio-filter"
            type="date"
            value={filters.data_inicio || ''}
            onChange={(e) => onFilterChange('data_inicio', e.target.value || null)}
          />
        </div>

        {/* Data Fim Filter */}
        <div className="space-y-2">
          <Label htmlFor="data-fim-filter" className="text-deep-navy font-medium">Data Fim</Label>
          <Input
            id="data-fim-filter"
            type="date"
            value={filters.data_fim || ''}
            onChange={(e) => onFilterChange('data_fim', e.target.value || null)}
          />
        </div>

        {/* Multi-Select Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status-filter" className="text-deep-navy font-medium">Status</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="status-filter"
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                {filters.status && filters.status.length > 0
                  ? `${filters.status.length} selecionado${filters.status.length > 1 ? 's' : ''}`
                  : "Todos os status"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0">
              <div className="max-h-[300px] overflow-y-auto p-2">
                {STATUS_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => toggleStatus(option.value)}
                  >
                    <Checkbox
                      checked={filters.status?.includes(option.value) || false}
                      onCheckedChange={() => toggleStatus(option.value)}
                    />
                    <label className="text-sm cursor-pointer flex-1">
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
              {filters.status && filters.status.length > 0 && (
                <div className="border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => onStatusChange([])}
                  >
                    Limpar seleção
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="text-deep-navy/80 hover:text-deep-navy hover:bg-ghost-white"
          >
            <IconFilterX className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        </div>
      )}
    </div>
  );
};
