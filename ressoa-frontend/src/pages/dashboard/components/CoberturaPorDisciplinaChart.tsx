import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';

interface DisciplinaData {
  disciplina: string;
  cobertura_media: number;
  total_turmas: number;
  total_aulas: number;
}

interface Props {
  data: DisciplinaData[];
}

const COLORS: Record<string, string> = {
  MATEMATICA: '#2563EB',        // Tech Blue
  CIENCIAS: '#06B6D4',           // Cyan AI
  LINGUA_PORTUGUESA: '#8B5CF6', // Purple
};

const LABELS: Record<string, string> = {
  MATEMATICA: 'Matemática',
  CIENCIAS: 'Ciências',
  LINGUA_PORTUGUESA: 'Língua Portuguesa',
};

export function CoberturaPorDisciplinaChart({ data }: Props) {
  // Empty state handling
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-500">
        <p>Nenhum dado disponível</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    disciplina: LABELS[d.disciplina] || d.disciplina,
    cobertura: d.cobertura_media != null ? parseFloat(d.cobertura_media.toFixed(1)) : 0,
    turmas: d.total_turmas,
    aulas: d.total_aulas,
    originalDisciplina: d.disciplina,
  }));

  return (
    <div aria-label="Gráfico de cobertura curricular por disciplina">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="disciplina" tick={{ fill: '#6B7280', fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 12 }} />
          <Tooltip
            formatter={(value: any, name: any) => {
              if (value === undefined || value === null) return ['-', name || ''];
              if (name === 'cobertura') return [`${parseFloat(value).toFixed(1)}%`, '% Cobertura'];
              return [value, name || ''];
            }}
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '12px',
            }}
          />
          <Legend
            formatter={(value) => (value === 'cobertura' ? '% Cobertura Média' : value)}
            wrapperStyle={{ paddingTop: '20px' }}
          />
          <Bar dataKey="cobertura" name="cobertura" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.originalDisciplina] || '#94A3B8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
