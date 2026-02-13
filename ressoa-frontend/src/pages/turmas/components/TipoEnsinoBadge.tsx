import { IconSchool, IconCertificate } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { TipoEnsino, TIPO_ENSINO_LABELS } from '@/types/turma';

/**
 * Badge component for displaying TipoEnsino with color coding
 * Story 10.4 - AC#10
 *
 * Colors:
 * - FUNDAMENTAL: Tech Blue (#2563EB) + IconSchool
 * - MEDIO: Purple (#9333EA) + IconCertificate
 */

interface TipoEnsinoBadgeProps {
  tipo_ensino: TipoEnsino;
}

export function TipoEnsinoBadge({ tipo_ensino }: TipoEnsinoBadgeProps) {
  const isFundamental = tipo_ensino === TipoEnsino.FUNDAMENTAL;

  return (
    <Badge
      variant="outline"
      className={`
        flex items-center gap-1.5
        ${isFundamental ? 'border-tech-blue bg-tech-blue/10 text-tech-blue' : 'border-purple-600 bg-purple-50 text-purple-700'}
      `}
      aria-label={`Tipo de ensino: ${TIPO_ENSINO_LABELS[tipo_ensino]}`}
    >
      {isFundamental ? (
        <IconSchool size={14} aria-hidden="true" />
      ) : (
        <IconCertificate size={14} aria-hidden="true" />
      )}
      <span className="font-medium">{TIPO_ENSINO_LABELS[tipo_ensino]}</span>
    </Badge>
  );
}
