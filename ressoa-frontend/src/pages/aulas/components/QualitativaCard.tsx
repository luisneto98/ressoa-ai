import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Star } from 'lucide-react';

interface QualitativaCardProps {
  title: string;
  data: any;
  icon?: React.ReactNode;
}

const LABELS: Record<string, string> = {
  nota_geral: 'Nota Geral',
  pontos_fortes: 'Pontos Fortes',
  pontos_atencao: 'Pontos de Atenção',
  niveis_identificados: 'Níveis Identificados',
  nivel_dominante: 'Nível Dominante',
  avaliacao: 'Avaliação',
  sugestao: 'Sugestão',
  dominante: 'Metodologia Dominante',
  metodos_identificados: 'Métodos Identificados',
  percentual_estimado: 'Distribuição Estimada',
  variacao: 'Variação Metodológica',
  nivel: 'Nível',
  perguntas_alunos: 'Perguntas dos Alunos',
  respostas_alunos: 'Respostas dos Alunos',
  intervencoes_contadas: 'Intervenções Contadas',
  tempo_fala_alunos_pct: 'Fala dos Alunos (%)',
  qualidade_interacoes: 'Qualidade das Interações',
  participacao_estimulada: 'Participação Estimulada',
  discussoes: 'Discussões Observadas',
  sinais_positivos: 'Sinais Positivos',
  sinais_dificuldade: 'Sinais de Dificuldade',
  score: 'Score',
  explicacoes_claras: 'Explicações Claras',
  uso_exemplos: 'Uso de Exemplos',
  reformulacoes: 'Reformulações',
  observacoes: 'Observações',
  estrutura_presente: 'Estrutura Presente',
  conexao_conhecimento_previo: 'Conexão com Conhecimento Prévio',
  sequencia_logica: 'Sequência Lógica',
  fechamento: 'Fechamento',
  adequada_para_serie: 'Adequada para a Série',
  exemplos_adequacao: 'Exemplos de Adequação',
  expositiva: 'Expositiva',
  investigativa: 'Investigativa',
  colaborativa: 'Colaborativa',
  pratica: 'Prática',
};

function getLabel(key: string): string {
  return LABELS[key] || key.replaceAll('_', ' ').replace(/^\w/, c => c.toUpperCase());
}

function ScoreBadge({ value, max = 10 }: { value: number; max?: number }) {
  const ratio = value / max;
  const color = ratio >= 0.8 ? 'bg-green-100 text-green-800' :
                ratio >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-semibold ${color}`}>
      <Star className="h-3.5 w-3.5" />
      {value}/{max}
    </span>
  );
}

function BoolValue({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex items-center gap-1 text-green-700">
      <CheckCircle2 className="h-4 w-4" /> Sim
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-red-600">
      <XCircle className="h-4 w-4" /> Não
    </span>
  );
}

function BloomBadge({ level }: { level: number }) {
  const names: Record<number, string> = {
    1: 'Lembrar', 2: 'Compreender', 3: 'Aplicar',
    4: 'Analisar', 5: 'Avaliar', 6: 'Criar',
  };
  return (
    <Badge variant="outline" className="text-xs">
      Nível {level} - {names[level] || level}
    </Badge>
  );
}

function PercentBar({ label, value }: { label: string; value: number }) {
  const color = value > 70 ? 'bg-tech-blue' : value > 30 ? 'bg-cyan-ai' : 'bg-gray-300';
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-28 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className="text-sm font-medium text-gray-700 w-10 text-right">{value}%</span>
    </div>
  );
}

function renderValue(key: string, value: any): React.ReactNode {
  if (value === null || value === undefined) return null;

  // Score fields
  if ((key === 'score' || key === 'nota_geral') && typeof value === 'number') {
    return <ScoreBadge value={value} />;
  }

  // Bloom levels - V3/V4 usa strings ('LEMBRAR'), V2 usa numbers (1-6)
  if (key === 'niveis_identificados' && Array.isArray(value)) {
    return (
      <div className="flex gap-2 flex-wrap">
        {value.map((level: number | string) =>
          typeof level === 'number'
            ? <BloomBadge key={level} level={level} />
            : <Badge key={level} variant="outline" className="text-xs">{level}</Badge>
        )}
      </div>
    );
  }
  if (key === 'nivel_dominante') {
    if (typeof value === 'number') return <BloomBadge level={value} />;
    if (typeof value === 'string') return <Badge variant="outline" className="text-xs">{value}</Badge>;
  }

  // Percentual breakdown
  if (key === 'percentual_estimado' && typeof value === 'object' && !Array.isArray(value)) {
    return (
      <div className="space-y-2 mt-1">
        {Object.entries(value).map(([k, v]) => (
          <PercentBar key={k} label={getLabel(k)} value={v as number} />
        ))}
      </div>
    );
  }

  // Booleans
  if (typeof value === 'boolean') {
    return <BoolValue value={value} />;
  }

  // String arrays
  if (Array.isArray(value) && value.every(v => typeof v === 'string')) {
    return (
      <ul className="space-y-1.5">
        {value.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="text-gray-400 mt-0.5 shrink-0">&bull;</span>
            {item}
          </li>
        ))}
      </ul>
    );
  }

  // Numbers (generic)
  if (typeof value === 'number') {
    return <span className="font-semibold text-deep-navy">{value}</span>;
  }

  // Strings
  if (typeof value === 'string') {
    return <p className="text-sm text-gray-700">{value}</p>;
  }

  // Fallback for nested objects
  if (typeof value === 'object') {
    return (
      <div className="space-y-2 pl-3 border-l-2 border-gray-200">
        {Object.entries(value).map(([k, v]) => (
          <DataRow key={k} fieldKey={k} value={v} />
        ))}
      </div>
    );
  }

  return <span className="text-sm text-gray-700">{String(value)}</span>;
}

function DataRow({ fieldKey, value }: { fieldKey: string; value: any }) {
  if (value === null || value === undefined) return null;

  const isBlock = Array.isArray(value) || (typeof value === 'object' && fieldKey === 'percentual_estimado');

  return (
    <div className={isBlock ? 'space-y-1' : 'flex items-start gap-2 flex-wrap'}>
      <span className="text-sm font-medium text-gray-500 shrink-0">{getLabel(fieldKey)}:</span>
      {renderValue(fieldKey, value)}
    </div>
  );
}

export function QualitativaCard({ title, data, icon }: QualitativaCardProps) {
  if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
    return null;
  }

  return (
    <Card className="p-4 bg-gray-50/80 border-gray-200/80">
      <h3 className="font-semibold text-deep-navy mb-3 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="space-y-3">
        {typeof data === 'object' && !Array.isArray(data) ? (
          Object.entries(data).map(([key, value]) => (
            <DataRow key={key} fieldKey={key} value={value} />
          ))
        ) : (
          renderValue('', data)
        )}
      </div>
    </Card>
  );
}
