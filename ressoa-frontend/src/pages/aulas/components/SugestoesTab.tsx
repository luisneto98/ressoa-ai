import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, BookOpen } from 'lucide-react';
import { PrioridadeCard } from './PrioridadeCard';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Prioridade {
  tipo: 'gap_curricular' | 'reforco' | 'avanco';
  habilidade_bncc: string;
  descricao: string;
  justificativa: string;
  recursos_sugeridos: string[];
}

interface PacingSugerido {
  tempo_estimado: string;
  distribuicao: {
    revisao: string;
    novo_conteudo: string;
    exercicios: string;
  };
}

interface ProximaAula {
  titulo: string;
  habilidades: string[];
  data_prevista: string;
}

interface SugestoesTabProps {
  sugestoes: {
    prioridades: Prioridade[];
    pacing_sugerido: PacingSugerido;
    proxima_aula_planejada?: ProximaAula;
  };
  planejamentoId?: string;
}

export function SugestoesTab({ sugestoes, planejamentoId }: SugestoesTabProps) {
  const navigate = useNavigate();

  if (!sugestoes || !sugestoes.prioridades || sugestoes.prioridades.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500 py-8">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-semibold mb-2">Nenhuma sugestão disponível</p>
          <p className="text-sm">As sugestões serão geradas após a análise pedagógica.</p>
        </div>
      </Card>
    );
  }

  const { prioridades, pacing_sugerido, proxima_aula_planejada } = sugestoes;

  const handleVerPlanejamento = () => {
    if (planejamentoId) {
      navigate(`/planejamentos/${planejamentoId}`);
    }
  };

  const handleAplicarSugestoes = () => {
    // TODO: Story futura - abrir modal para selecionar sugestões e aplicar ao planejamento
    console.log('Aplicar sugestões ao planejamento (feature futura)');
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Sugestões para Próxima Aula</h2>
        {planejamentoId && (
          <Button variant="outline" size="sm" onClick={handleAplicarSugestoes}>
            Aplicar Sugestões ao Planejamento
          </Button>
        )}
      </div>

      {/* Seção 1: Prioridades de Conteúdo */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Prioridades de Conteúdo</h3>
        <div className="space-y-4">
          {prioridades.map((prioridade, idx) => (
            <PrioridadeCard key={idx} prioridade={prioridade} />
          ))}
        </div>
      </section>

      {/* Seção 2: Pacing Sugerido */}
      {pacing_sugerido && (
        <section className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Pacing Sugerido</h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900">
                Tempo Total: {pacing_sugerido.tempo_estimado}
              </span>
            </div>
            <div className="space-y-2">
              {Object.entries(pacing_sugerido.distribuicao).map(([fase, tempo]) => (
                <div key={fase} className="flex justify-between items-center text-sm">
                  <span className="capitalize text-gray-700">
                    {fase.replace('_', ' ')}:
                  </span>
                  <span className="font-semibold text-gray-900">{tempo}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Seção 3: Próxima Aula Planejada */}
      {proxima_aula_planejada && (
        <section>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Próxima Aula Planejada</h3>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {proxima_aula_planejada.titulo}
                </h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    <span className="font-medium">Data prevista:</span>{' '}
                    {format(new Date(proxima_aula_planejada.data_prevista), "dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                  <p>
                    <span className="font-medium">Habilidades:</span>{' '}
                    {proxima_aula_planejada.habilidades.join(', ')}
                  </p>
                </div>
                {planejamentoId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={handleVerPlanejamento}
                  >
                    Ver Planejamento Completo
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </section>
      )}
    </Card>
  );
}
