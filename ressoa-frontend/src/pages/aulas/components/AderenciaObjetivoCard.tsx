import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  IconTarget,
  IconTargetArrow,
  IconCircleCheck,
  IconCircleX,
  IconBulb,
  IconQuote,
} from '@tabler/icons-react';
import type { AderenciaObjetivoJson } from '@/lib/analise-adapter';

interface AderenciaObjetivoCardProps {
  aderencia: AderenciaObjetivoJson;
  descricaoAula: string; // Objetivo declarado pelo professor
}

const FAIXA_CONFIG = {
  BAIXA: {
    label: 'Baixa',
    progress: 25,
    badgeClass: 'text-red-700 bg-red-100 border-red-200',
    barClass: 'bg-red-500',
    icon: <IconTarget size={20} className="text-red-600" />,
  },
  MEDIA: {
    label: 'Média',
    progress: 50,
    badgeClass: 'text-amber-700 bg-amber-100 border-amber-200',
    barClass: 'bg-amber-500',
    icon: <IconTarget size={20} className="text-amber-600" />,
  },
  ALTA: {
    label: 'Alta',
    progress: 75,
    badgeClass: 'text-blue-700 bg-blue-100 border-blue-200',
    barClass: 'bg-blue-500',
    icon: <IconTargetArrow size={20} className="text-blue-600" />,
  },
  TOTAL: {
    label: 'Total',
    progress: 100,
    badgeClass: 'text-green-700 bg-green-100 border-green-200',
    barClass: 'bg-green-500',
    icon: <IconTargetArrow size={20} className="text-green-600" />,
  },
} as const;

export function AderenciaObjetivoCard({ aderencia, descricaoAula }: AderenciaObjetivoCardProps) {
  if (!aderencia) return null;

  const config = FAIXA_CONFIG[aderencia.faixa_aderencia];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {config.icon}
            Aderência ao Objetivo
          </CardTitle>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.badgeClass}`}
          >
            {config.label}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{aderencia.descricao_faixa}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* O que você planejou */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
            <IconQuote size={14} />
            O que você planejou
          </p>
          <blockquote className="border-l-4 border-gray-300 pl-4 italic text-sm text-gray-600">
            {descricaoAula}
          </blockquote>
        </div>

        {/* Barra de progresso visual */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Representação visual da faixa</p>
          <div className="bg-gray-200 rounded-full h-3">
            <div
              className={`${config.barClass} h-3 rounded-full transition-all duration-500`}
              style={{ width: `${config.progress}%` }}
            />
          </div>
        </div>

        {/* Análise qualitativa */}
        <p className="text-sm text-gray-700 leading-relaxed">{aderencia.analise_qualitativa}</p>

        {/* Grid pontos atingidos / não atingidos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aderencia.pontos_atingidos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                <IconCircleCheck size={14} className="text-green-600" />
                Pontos atingidos
              </p>
              <ul className="space-y-1">
                {aderencia.pontos_atingidos.map((ponto, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <IconCircleCheck size={16} className="text-green-500 shrink-0 mt-0.5" />
                    {ponto}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {aderencia.pontos_nao_atingidos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1">
                <IconCircleX size={14} className="text-red-600" />
                Pontos não atingidos
              </p>
              <ul className="space-y-1">
                {aderencia.pontos_nao_atingidos.map((ponto, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <IconCircleX size={16} className="text-red-500 shrink-0 mt-0.5" />
                    {ponto}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Box de recomendação */}
        {aderencia.recomendacao && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 flex gap-3">
            <IconBulb size={20} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800 mb-1">Recomendação</p>
              <p className="text-sm text-blue-700">{aderencia.recomendacao}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
