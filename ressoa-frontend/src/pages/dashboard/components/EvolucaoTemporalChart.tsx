import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface EvolucaoData {
  bimestre: number;
  cobertura_media: number;
}

interface Props {
  data: EvolucaoData[];
}

export function EvolucaoTemporalChart({ data }: Props) {
  // Empty state handling
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-deep-navy/80">
        <p>Nenhum dado disponível</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    bimestre: `${d.bimestre}º Bim`,
    cobertura: d.cobertura_media != null ? parseFloat(d.cobertura_media.toFixed(1)) : 0,
  }));

  return (
    <div aria-label="Gráfico de evolução temporal da cobertura curricular">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="bimestre" tick={{ fill: '#6B7280', fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 12 }} />
          <Tooltip
            formatter={(value: any) => {
              if (value === undefined || value === null) return ['-', '% Cobertura Média'];
              return [`${parseFloat(value).toFixed(1)}%`, '% Cobertura Média'];
            }}
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '12px',
            }}
          />
          <Legend
            formatter={() => '% Cobertura Média da Escola'}
            wrapperStyle={{ paddingTop: '20px' }}
          />
          <Line
            type="monotone"
            dataKey="cobertura"
            stroke="#2563EB"
            strokeWidth={3}
            name="% Cobertura Média"
            dot={{ fill: '#2563EB', r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
