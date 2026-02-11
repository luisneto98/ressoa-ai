import { X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import type { Habilidade } from '../hooks/usePlanejamentoWizard';

interface HabilidadesSelectedPanelProps {
  habilidades: Habilidade[];
  onRemove: (id: string) => void;
}

export const HabilidadesSelectedPanel = ({
  habilidades,
  onRemove,
}: HabilidadesSelectedPanelProps) => {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="mb-4 font-semibold text-deep-navy">
        {habilidades.length} habilidade{habilidades.length !== 1 ? 's' : ''}{' '}
        selecionada{habilidades.length !== 1 ? 's' : ''}
      </h3>

      {habilidades.length === 0 ? (
        <p className="text-sm text-gray-500">
          Selecione habilidades na lista ao lado
        </p>
      ) : (
        <ul className="space-y-2">
          {habilidades.map((hab) => (
            <li
              key={hab.id}
              className="flex items-start justify-between gap-2 rounded border p-2 text-sm"
            >
              <div className="flex-1">
                <span className="font-semibold text-deep-navy">
                  {hab.codigo}
                </span>
                <p className="line-clamp-2 text-xs text-gray-600">
                  {hab.descricao}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(hab.id)}
                className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                aria-label={`Remover ${hab.codigo}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
