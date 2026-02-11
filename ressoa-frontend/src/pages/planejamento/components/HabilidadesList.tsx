import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { Checkbox } from '../../../components/ui/checkbox';
import { Badge } from '../../../components/ui/badge';
import type { Habilidade } from '../hooks/usePlanejamentoWizard';

interface HabilidadesListProps {
  habilidades: Habilidade[];
  selectedIds: Set<string>;
  onToggle: (habilidade: Habilidade) => void;
}

export const HabilidadesList = ({
  habilidades,
  selectedIds,
  onToggle,
}: HabilidadesListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: habilidades.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  if (habilidades.length === 0) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded border bg-gray-50 text-gray-500">
        Nenhuma habilidade encontrada
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-[500px] overflow-auto rounded border"
      role="list"
      aria-label="Lista de habilidades BNCC"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const habilidade = habilidades[virtualRow.index];
          const isSelected = selectedIds.has(habilidade.id);

          return (
            <div
              key={habilidade.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="border-b px-4 py-3 hover:bg-gray-50"
              role="listitem"
            >
              <label
                className="flex cursor-pointer items-start gap-3"
                htmlFor={`hab-${habilidade.id}`}
              >
                <Checkbox
                  id={`hab-${habilidade.id}`}
                  checked={isSelected}
                  onCheckedChange={() => onToggle(habilidade)}
                  aria-labelledby={`hab-${habilidade.id}-label`}
                />
                <div className="flex-1">
                  <span
                    id={`hab-${habilidade.id}-label`}
                    className="font-bold text-deep-navy"
                  >
                    {habilidade.codigo}
                  </span>
                  <p className="line-clamp-2 text-sm text-gray-600">
                    {habilidade.descricao}
                  </p>
                  {habilidade.unidade_tematica && (
                    <Badge variant="secondary" className="mt-1">
                      {habilidade.unidade_tematica}
                    </Badge>
                  )}
                </div>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};
