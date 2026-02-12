import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Activity,
  Clock,
  DollarSign,
  Timer,
  AlertTriangle,
  ExternalLink,
  X,
} from 'lucide-react';
import { apiClient } from '@/api/axios';
import { StatCard } from '@/pages/dashboard/components/StatCard';
import { Button } from '@/components/ui/button';

interface MonitoramentoAnaliseResponse {
  kpis: {
    total: number;
    tempo_medio_s: number;
    custo_medio_usd: number;
    tempo_revisao_medio_s: number;
  };
  por_status: Array<{
    status: string;
    count: number;
  }>;
  queue_stats: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
}

const PERIODO_LABELS: Record<string, string> = {
  '1h': 'Última hora',
  '24h': 'Últimas 24 horas',
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
};

const STATUS_COLORS: Record<string, string> = {
  AGUARDANDO_REVISAO: '#F59E0B',
  APROVADO: '#10B981',
  REJEITADO: '#EF4444',
};

const STATUS_LABELS: Record<string, string> = {
  AGUARDANDO_REVISAO: 'Aguardando Revisão',
  APROVADO: 'Aprovado',
  REJEITADO: 'Rejeitado',
};

export function MonitoramentoAnalisePage() {
  const [periodo, setPeriodo] = useState('24h');

  const { data, isLoading, isError, error } =
    useQuery<MonitoramentoAnaliseResponse>({
      queryKey: ['admin-analise', periodo],
      queryFn: () =>
        apiClient
          .get('/admin/monitoramento/analise', { params: { periodo } })
          .then((res) => res.data),
      refetchInterval: 30000,
    });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-3 text-red-800">
            <X className="h-5 w-5" />
            <p className="font-semibold">
              Erro ao carregar monitoramento:{' '}
              {(error as Error)?.message || 'Erro desconhecido'}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="p-6">
          <p className="text-gray-600">Nenhum dado disponível</p>
        </Card>
      </div>
    );
  }

  const barChartData = data.por_status.map((s) => ({
    status: STATUS_LABELS[s.status] || s.status,
    count: s.count,
    fill: STATUS_COLORS[s.status] || '#6B7280',
  }));

  const pieChartData = data.por_status.map((s) => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: s.count,
    fill: STATUS_COLORS[s.status] || '#6B7280',
  }));

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Monitoramento de Análise Pedagógica
      </h1>
      <p className="text-gray-600 mb-6">
        Filas de processamento, tempo de análise e métricas de qualidade
      </p>

      {/* Alerta de fila alta */}
      {data.queue_stats.waiting > 50 && (
        <Alert variant="destructive" className="mb-6 border-orange-300 bg-orange-50 text-orange-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Fila de Análise Alta!</AlertTitle>
          <AlertDescription>
            {data.queue_stats.waiting} jobs aguardando processamento. Considere
            escalar workers.
          </AlertDescription>
        </Alert>
      )}

      {/* Filtro de Período */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Período:</label>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PERIODO_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-gray-500">
            Auto-refresh a cada 30s
          </span>
        </div>
      </Card>

      {/* KPI StatCards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total de Análises"
          value={data.kpis.total}
          icon={<Activity className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Tempo Médio (s)"
          value={`${data.kpis.tempo_medio_s}s`}
          icon={<Clock className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Custo Médio (USD)"
          value={`$${data.kpis.custo_medio_usd}`}
          icon={<DollarSign className="h-6 w-6" />}
          color="orange"
        />
        <StatCard
          title="Tempo Revisão Médio (min)"
          value={`${(data.kpis.tempo_revisao_medio_s / 60).toFixed(1)}min`}
          icon={<Timer className="h-6 w-6" />}
          color="purple"
        />
      </div>

      {/* Queue Status Grid */}
      <h2 className="text-lg font-semibold mb-4 text-gray-900">
        Status das Filas (tempo real)
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <Card className="p-4 border-l-4 border-l-yellow-400">
          <p className="text-sm text-gray-600">Aguardando</p>
          <p className="text-2xl font-bold text-yellow-600">
            {data.queue_stats.waiting}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-400">
          <p className="text-sm text-gray-600">Processando</p>
          <p className="text-2xl font-bold text-blue-600">
            {data.queue_stats.active}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-green-400">
          <p className="text-sm text-gray-600">Completados</p>
          <p className="text-2xl font-bold text-green-600">
            {data.queue_stats.completed}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-400">
          <p className="text-sm text-gray-600">Falhados</p>
          <p className="text-2xl font-bold text-red-600">
            {data.queue_stats.failed}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-purple-400">
          <p className="text-sm text-gray-600">Agendados</p>
          <p className="text-2xl font-bold text-purple-600">
            {data.queue_stats.delayed}
          </p>
        </Card>
      </div>

      <div className="mb-8">
        <Button
          variant="outline"
          onClick={() => window.open('/admin/queues', '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Abrir Bull Board
        </Button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* BarChart - Análises por Status */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">
            Análises por Status
          </h2>
          {barChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" name="Quantidade">
                  {barChartData.map((entry) => (
                    <Cell key={`bar-${entry.status}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">
              Nenhuma análise no período
            </p>
          )}
        </Card>

        {/* PieChart - Distribuição de Status */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">
            Distribuição de Status
          </h2>
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieChartData.map((entry) => (
                    <Cell key={`pie-${entry.name}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">
              Nenhuma análise no período
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
