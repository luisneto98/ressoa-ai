import { NivelBloom, NIVEL_BLOOM_LABELS, NIVEL_BLOOM_DESCRIPTIONS, NIVEL_BLOOM_COLORS } from '@/types/objetivo';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface NivelBloomBadgeProps {
  nivel: NivelBloom;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Badge colorido para Nível Cognitivo (Taxonomia de Bloom)
 *
 * - Cores diferenciadas por nível (gray → purple: Lembrar → Criar)
 * - Tooltip com descrição pedagógica ao hover
 * - Acessível (aria-label, keyboard navigation)
 *
 * @param nivel - Nível cognitivo Bloom
 * @param size - Tamanho do badge ('sm' | 'md')
 */
export function NivelBloomBadge({ nivel, size = 'md', className }: NivelBloomBadgeProps) {
  const colors = NIVEL_BLOOM_COLORS[nivel];
  const label = NIVEL_BLOOM_LABELS[nivel];
  const description = NIVEL_BLOOM_DESCRIPTIONS[nivel];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'font-medium border',
              colors.bg,
              colors.text,
              colors.border,
              size === 'sm' && 'text-xs px-2 py-0.5',
              size === 'md' && 'text-sm px-3 py-1',
              className
            )}
            aria-label={`Nível cognitivo: ${label}`}
          >
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-gray-600 mt-1">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
