import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { IconGripVertical, IconEdit, IconTrash, IconClipboardList, IconBook } from '@tabler/icons-react';
import { ObjetivoCustom } from '@/types/objetivo';
import { NivelBloomBadge } from './NivelBloomBadge';
import { cn } from '@/lib/utils';

interface ObjetivoCardProps {
  objetivo: ObjetivoCustom;
  onEdit: () => void;
  onRemove: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  className?: string;
}

/**
 * Card compacto exibindo objetivo de aprendizagem
 *
 * - Layout: [≡] Código · Nível [✏️] [🗑️]
 * - Descrição truncada com tooltip completo ao hover
 * - Metadata: count critérios + área de conhecimento
 * - Drag handle para reordenação
 *
 * @param objetivo - Objetivo de aprendizagem
 * @param onEdit - Callback ao clicar em editar
 * @param onRemove - Callback ao clicar em remover
 * @param dragHandleProps - Props do drag handle (@dnd-kit)
 */
export function ObjetivoCard({
  objetivo,
  onEdit,
  onRemove,
  dragHandleProps,
  className,
}: ObjetivoCardProps) {
  const descricaoTruncada =
    objetivo.descricao.length > 80
      ? objetivo.descricao.slice(0, 80) + '...'
      : objetivo.descricao;

  return (
    <Card
      className={cn(
        'p-3 hover:bg-gray-50 transition-colors border border-gray-200',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing pt-1"
          aria-label="Arrastar para reordenar"
        >
          <IconGripVertical className="h-5 w-5 text-gray-400" />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          {/* Linha 1: Código + Nível + Ações */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-gray-900">
                {objetivo.codigo}
              </span>
              <span className="text-gray-400">·</span>
              <NivelBloomBadge nivel={objetivo.nivel_cognitivo} size="sm" />
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onEdit}
                aria-label="Editar objetivo"
                className="h-7 w-7"
              >
                <IconEdit className="h-4 w-4 text-blue-600" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onRemove}
                aria-label="Remover objetivo"
                className="h-7 w-7"
              >
                <IconTrash className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>

          {/* Linha 2: Descrição (truncada com tooltip) */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-sm text-gray-700 mb-2 cursor-help">
                  {descricaoTruncada}
                </p>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-md">
                <p className="text-sm">{objetivo.descricao}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Linha 3: Metadata (Critérios + Área) */}
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <IconClipboardList className="h-3.5 w-3.5" />
              <span>
                Critérios: {objetivo.criterios_evidencia.length}
              </span>
            </div>
            {objetivo.area_conhecimento && (
              <>
                <span className="text-gray-400">|</span>
                <div className="flex items-center gap-1">
                  <IconBook className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[200px]">
                    {objetivo.area_conhecimento}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
