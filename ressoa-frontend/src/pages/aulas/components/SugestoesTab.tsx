import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, BookOpen } from 'lucide-react';
import { PrioridadeCard } from './PrioridadeCard';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// FIX HIGH #2: Safe date formatter with error handling
const formatDateSafe = (dateStr: string | undefined): string => {
  if (!dateStr) return 'Data não informada';

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateStr; // Fallback to raw string
  }
};

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
    pacing_sugerido?: PacingSugerido; // FIX: Make optional to handle partial data
    proxima_aula_planejada?: ProximaAula;
  };
  planejamentoId?: string;
}

export function SugestoesTab({ sugestoes, planejamentoId }: SugestoesTabProps) {
  const navigate = useNavigate();

  // FIX HIGH #3: Check for any meaningful data, not just prioridades
  const hasData = sugestoes?.prioridades?.length > 0 ||
                  sugestoes?.pacing_sugerido ||
                  sugestoes?.proxima_aula_planejada;

  if (!hasData) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500 py-8">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" aria-label="Ícone de livro" role="img" />
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
    // FIX LOW #2: Removed console.log for production
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-montserrat font-semibold text-deep-navy">Sugestões para Próxima Aula</h2>
        {planejamentoId && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAplicarSugestoes}
            disabled
            title="Em breve: aplicar sugestões automaticamente ao planejamento"
            aria-label="Aplicar sugestões ao planejamento - funcionalidade em desenvolvimento"
          >
            Aplicar Sugestões (Em Breve)
          </Button>
        )}
      </div>

      {/* Seção 1: Prioridades de Conteúdo */}
      {prioridades && prioridades.length > 0 && (
        <section className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Prioridades de Conteúdo</h3>
          <div className="space-y-4">
            {/* FIX MEDIUM #1: Use proper keys instead of index */}
            {prioridades.map((prioridade) => (
              <PrioridadeCard
                key={`${prioridade.tipo}-${prioridade.habilidade_bncc}`}
                prioridade={prioridade}
              />
            ))}
          </div>
        </section>
      )}

      {/* Seção 2: Pacing Sugerido */}
      {pacing_sugerido && (
        <section className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Pacing Sugerido</h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-blue-600" aria-label="Ícone de relógio" role="img" />
              <span className="font-semibold text-deep-navy">
                Tempo Total: {pacing_sugerido.tempo_estimado}
              </span>
            </div>
            {/* FIX MEDIUM #2: Null safety for distribuicao */}
            {pacing_sugerido.distribuicao && (
              <div className="space-y-2">
                {Object.entries(pacing_sugerido.distribuicao).map(([fase, tempo]) => (
                  <div key={fase} className="flex justify-between items-center text-sm">
                    <span className="capitalize text-gray-700">
                      {/* FIX MEDIUM #5: Use replaceAll for multiple underscores */}
                      {fase.replaceAll('_', ' ')}:
                    </span>
                    <span className="font-semibold text-deep-navy">{tempo}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Seção 3: Próxima Aula Planejada */}
      {proxima_aula_planejada && (
        <section>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Próxima Aula Planejada</h3>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5" aria-label="Ícone de calendário" role="img" />
              <div className="flex-1">
                <h4 className="font-semibold text-deep-navy mb-2">
                  {proxima_aula_planejada.titulo}
                </h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    <span className="font-medium">Data prevista:</span>{' '}
                    {/* FIX HIGH #1: Safe date formatting */}
                    {formatDateSafe(proxima_aula_planejada.data_prevista)}
                  </p>
                  <p>
                    <span className="font-medium">Habilidades:</span>{' '}
                    {proxima_aula_planejada.habilidades?.join(', ') || 'Nenhuma habilidade especificada'}
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
