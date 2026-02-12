import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/lib/api';

interface CoberturaChartProps {
  turmaId: string;
  bimestre: number;
}

export function CoberturaChart({ turmaId, bimestre }: CoberturaChartProps) {
  const { data: timeline, isLoading, isError, error } = useQuery({
    queryKey: ['cobertura-timeline', turmaId, bimestre],
    queryFn: () =>
      api
        .get('/professores/me/cobertura/timeline', {
          params: { turma_id: turmaId, bimestre },
        })
        .then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="text-center text-gray-500 py-8">
        Carregando gráfico...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-red-600 py-8">
        <p className="font-semibold mb-1">Erro ao carregar gráfico</p>
        <p className="text-sm text-gray-500">
          {error instanceof Error ? error.message : 'Erro desconhecido'}
        </p>
      </div>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>Nenhum dado de evolução temporal disponível.</p>
        <p className="text-sm mt-2">
          O gráfico será exibido após a aprovação de aulas ao longo do bimestre.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={timeline}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="semana"
          tickFormatter={(date) => format(new Date(date), 'dd/MM')}
          stroke="#6B7280"
        />
        <YAxis stroke="#6B7280" />
        <Tooltip
          labelFormatter={(date) =>
            format(new Date(date), "dd 'de' MMMM", { locale: ptBR })
          }
          contentStyle={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="habilidades_acumuladas"
          stroke="#2563EB"
          strokeWidth={2}
          name="Habilidades Trabalhadas"
          dot={{ fill: '#2563EB', r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="aulas_realizadas"
          stroke="#06B6D4"
          strokeWidth={2}
          name="Aulas Realizadas"
          dot={{ fill: '#06B6D4', r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
