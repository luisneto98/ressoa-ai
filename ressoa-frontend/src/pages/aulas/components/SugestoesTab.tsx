import { Card } from '@/components/ui/card';
import { BookOpen, Lightbulb, AlertTriangle } from 'lucide-react';

interface Alerta {
  tipo: string;
  nivel: 'INFO' | 'WARNING' | 'CRITICAL';
  titulo: string;
  mensagem: string;
  acoes_sugeridas: string[];
}

interface SugestoesTabProps {
  sugestoes: string[];
  alertas: Alerta[];
  planejamentoId?: string;
}

export function SugestoesTab({ sugestoes, alertas }: SugestoesTabProps) {
  const hasData = sugestoes.length > 0 || alertas.length > 0;

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

  // Filter alertas that have acoes_sugeridas
  const alertasComAcoes = alertas.filter(a => a.acoes_sugeridas?.length > 0);

  return (
    <Card className="p-6">
      <h2 className="text-xl font-montserrat font-semibold text-deep-navy mb-6">
        Sugestões para Próxima Aula
      </h2>

      {/* Seção 1: Sugestões gerais da IA */}
      {sugestoes.length > 0 && (
        <section className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-focus-orange" />
            Recomendações
          </h3>
          <ul className="space-y-3">
            {sugestoes.map((sugestao, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200"
              >
                <span className="text-focus-orange font-bold mt-0.5">{idx + 1}.</span>
                <span className="text-sm text-gray-800">{sugestao}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Seção 2: Ações sugeridas dos alertas */}
      {alertasComAcoes.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Ações Sugeridas por Alerta
          </h3>
          <div className="space-y-4">
            {alertasComAcoes.map((alerta, idx) => (
              <div
                key={idx}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <p className="font-semibold text-deep-navy mb-2">{alerta.titulo}</p>
                <ul className="space-y-1">
                  {alerta.acoes_sugeridas.map((acao, aIdx) => (
                    <li key={aIdx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-tech-blue mt-1">-</span>
                      {acao}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </Card>
  );
}
