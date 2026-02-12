import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Questao {
  numero: number;
  enunciado: string;
  alternativas: Array<{
    letra: string;
    texto: string;
    correta: boolean;
  }>;
  habilidade_bncc: string;
  nivel_bloom: string;
  explicacao: string;
}

interface QuestaoCardProps {
  questao: Questao;
  showGabarito?: boolean;
}

export function QuestaoCard({ questao, showGabarito = false }: QuestaoCardProps) {
  return (
    <div className="border rounded-lg p-4 bg-white">
      {/* Header com metadados */}
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="outline" className="text-xs">
          {questao.habilidade_bncc}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          Bloom: {questao.nivel_bloom}
        </Badge>
      </div>

      {/* Enunciado */}
      <h3 className="font-semibold mb-3 text-gray-900">
        {questao.numero}. {questao.enunciado}
      </h3>

      {/* Alternativas */}
      <div className="space-y-2 mb-4">
        {questao.alternativas.map((alt) => (
          <div
            key={alt.letra}
            className={cn(
              'p-3 rounded border transition-colors',
              showGabarito && alt.correta && 'bg-green-50 border-green-500 border-l-4'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="flex-1">
                <span className="font-semibold mr-2">{alt.letra})</span>
                {alt.texto}
              </span>
              {showGabarito && alt.correta && (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 ml-2" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Explicação (gabarito) */}
      {showGabarito && (
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-sm font-semibold mb-1 text-blue-900">Explicação:</p>
          <p className="text-sm text-blue-800">{questao.explicacao}</p>
        </div>
      )}
    </div>
  );
}
