import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Questao {
  numero: number;
  enunciado: string;
  // Múltipla-escolha
  alternativas?: Array<{
    letra: string;
    texto: string;
    correta: boolean;
  }>;
  // Dissertativa (gabarito da IA)
  gabarito?: {
    resposta_curta?: string;
    resolucao_passo_a_passo?: string[];
    criterios_correcao?: string[];
    dica_professor?: string;
  };
  habilidade_bncc?: string;
  habilidade_relacionada?: string;
  nivel_bloom: string | number;
  nivel_bloom_descricao?: string;
  explicacao?: string;
  dificuldade?: string;
  contexto_aula?: string;
}

interface QuestaoCardProps {
  questao: Questao;
  showGabarito?: boolean;
}

export function QuestaoCard({ questao, showGabarito = false }: QuestaoCardProps) {
  const habilidade = questao.habilidade_bncc || questao.habilidade_relacionada || '';
  const nivelBloom = questao.nivel_bloom_descricao || `Nível ${questao.nivel_bloom}`;

  return (
    <div className="border rounded-lg p-4 bg-white">
      {/* Header com metadados */}
      <div className="flex items-center gap-2 mb-3">
        {habilidade && (
          <Badge variant="outline" className="text-xs">
            {habilidade}
          </Badge>
        )}
        <Badge variant="secondary" className="text-xs">
          Bloom: {nivelBloom}
        </Badge>
        {questao.dificuldade && (
          <Badge variant="secondary" className="text-xs capitalize">
            {questao.dificuldade}
          </Badge>
        )}
      </div>

      {/* Enunciado */}
      <h3 className="font-semibold mb-3 text-gray-900">
        {questao.numero}. {questao.enunciado}
      </h3>

      {/* Múltipla-escolha: Alternativas */}
      {questao.alternativas && questao.alternativas.length > 0 && (
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
      )}

      {/* Dissertativa: Gabarito */}
      {showGabarito && questao.gabarito && (
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 space-y-3">
          {questao.gabarito.resposta_curta && (
            <div>
              <p className="text-sm font-semibold mb-1 text-blue-900">Resposta:</p>
              <p className="text-sm text-blue-800">{questao.gabarito.resposta_curta}</p>
            </div>
          )}
          {questao.gabarito.resolucao_passo_a_passo && questao.gabarito.resolucao_passo_a_passo.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-1 text-blue-900">Resolução:</p>
              <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                {questao.gabarito.resolucao_passo_a_passo.map((passo, i) => (
                  <li key={i}>{passo}</li>
                ))}
              </ol>
            </div>
          )}
          {questao.gabarito.dica_professor && (
            <div>
              <p className="text-sm font-semibold mb-1 text-blue-900">Dica para o professor:</p>
              <p className="text-sm text-blue-800">{questao.gabarito.dica_professor}</p>
            </div>
          )}
        </div>
      )}

      {/* Explicação (formato antigo) */}
      {showGabarito && questao.explicacao && !questao.gabarito && (
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-sm font-semibold mb-1 text-blue-900">Explicação:</p>
          <p className="text-sm text-blue-800">{questao.explicacao}</p>
        </div>
      )}
    </div>
  );
}
