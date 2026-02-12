import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

type NivelCobertura = 'COMPLETE' | 'PARTIAL' | 'MENTIONED' | 'NOT_COVERED';

interface CoberturaBadgeProps {
  codigo: string;
  descricao: string;
  nivel: NivelCobertura;
  evidencias: Array<{ texto_literal: string }>;
}

export function CoberturaBadge({
  codigo,
  descricao,
  nivel,
  evidencias,
}: CoberturaBadgeProps) {
  const getBadgeConfig = (nivel: NivelCobertura) => {
    switch (nivel) {
      case 'COMPLETE':
        return {
          className: 'bg-green-100 text-green-800 hover:bg-green-200',
          label: 'Completo',
        };
      case 'PARTIAL':
        return {
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
          label: 'Parcial',
        };
      case 'MENTIONED':
        return {
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
          label: 'Mencionado',
        };
      case 'NOT_COVERED':
        return {
          className: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
          label: 'Não coberto',
        };
    }
  };

  const config = getBadgeConfig(nivel);

  return (
    <Card className="p-4 border-l-4 border-l-cyan-500">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Badge className={config.className}>{config.label}</Badge>
          <span className="font-semibold text-deep-navy">{codigo}</span>
        </div>

        <p className="text-sm text-gray-600">{descricao}</p>

        {/* Evidências literais */}
        {evidencias && evidencias.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Evidências:
            </p>
            {evidencias.map((ev, idx) => (
              <blockquote
                key={idx}
                className="text-sm italic border-l-4 border-cyan-500 pl-3 text-gray-700"
              >
                "{ev.texto_literal}"
              </blockquote>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
