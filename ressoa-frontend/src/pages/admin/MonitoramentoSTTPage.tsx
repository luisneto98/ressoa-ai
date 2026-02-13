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
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  ArrowRightLeft,
  Clock,
  Shield,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/api/axios';
import { StatCard } from '@/pages/dashboard/components/StatCard';

interface MonitoramentoSTTResponse {
  kpis: {
    total_transcricoes: number;
    erros_stt: number;
    taxa_sucesso: number;
    taxa_erro: number;
    fallback_count: number;
    tempo_medio_ms: number;
    confianca_media: number;
    custo_total_usd: number;
  };
  por_provider: Array<{
    provider: string;
    count: number;
    avg_tempo_ms: number;
    avg_confianca: number;
    avg_custo_usd: number;
  }>;
  erros_timeline: Array<{
    hora: string;
    erros_stt: number;
    transcricoes_ok: number;
  }>;
  erros_recentes: Array<{
    aula_id: string;
    escola_id: string;
    data: string;
    updated_at: string;
    arquivo_tamanho: number | null;
    tipo_entrada: string;
  }>;
}

const PROVIDER_COLORS: Record<string, string> = {
  WHISPER: '#2563EB',
  GOOGLE: '#10B981',
  AZURE: '#06B6D4',
  MANUAL: '#F97316',
};

const PERIODO_LABELS: Record<string, string> = {
  '1h': 'Última hora',
  '24h': 'Últimas 24 horas',
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
};

export function MonitoramentoSTTPage() {
  const [periodo, setPeriodo] = useState('24h');

  const { data, isLoading, isError, error } = useQuery<MonitoramentoSTTResponse>({
    queryKey: ['admin-stt', periodo],
    queryFn: () =>
      apiClient
        .get('/admin/monitoramento/stt', { params: { periodo } })
        .then((res) => res.data),
    refetchInterval: 90000, // Increased from 60s to 90s to avoid rate limiting
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ghost-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-deep-navy/40" />
          <p className="text-sm text-deep-navy/60">Carregando dados de transcrição...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-ghost-white">
        <div className="max-w-7xl mx-auto p-6">
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-3 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <p className="font-semibold">Erro ao carregar monitoramento</p>
              <p className="text-sm text-deep-navy/80">{(error as Error)?.message || 'Erro desconhecido'}</p>
            </div>
          </div>
        </Card>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-ghost-white">
        <div className="max-w-7xl mx-auto p-6">
        <Card className="p-6 text-center">
          <p className="text-deep-navy/80">Nenhum dado disponível</p>
        </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ghost-white">
      <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl md:text-4xl font-montserrat font-bold text-deep-navy mb-2">
        Monitoramento STT
      </h1>
      <p className="text-deep-navy/80 mb-6">
        Taxa de erro, performance e custos de transcrições em tempo real
      </p>

      {/* Alerta de taxa de erro alta */}
      {data.kpis.taxa_erro > 5 && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Taxa de Erro Alta</AlertTitle>
          <AlertDescription>
            Taxa de erro STT está em {data.kpis.taxa_erro.toFixed(2)}% (limite: 5%).
            {data.kpis.erros_stt} erros de {data.kpis.total_transcricoes + data.kpis.erros_stt} transcrições no período.
          </AlertDescription>
        </Alert>
      )}

      {/* Filtro de Período */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-deep-navy/80">Período:</label>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PERIODO_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-deep-navy/60">Auto-refresh a cada 60s</span>
        </div>
      </Card>

      {/* KPI StatCards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Transcrições"
          value={data.kpis.total_transcricoes}
          icon={<Activity className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Taxa de Sucesso"
          value={`${data.kpis.taxa_sucesso.toFixed(1)}%`}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Taxa de Erro"
          value={`${data.kpis.taxa_erro.toFixed(1)}%`}
          icon={<AlertTriangle className="h-6 w-6" />}
          color={data.kpis.taxa_erro > 5 ? 'red' : 'orange'}
        />
        <StatCard
          title="Fallback Count"
          value={data.kpis.fallback_count}
          icon={<ArrowRightLeft className="h-6 w-6" />}
          color="purple"
        />
        <StatCard
          title="Tempo Médio"
          value={`${(data.kpis.tempo_medio_ms / 1000).toFixed(1)}s`}
          icon={<Clock className="h-6 w-6" />}
          color="cyan"
        />
        <StatCard
          title="Confiança Média"
          value={`${(data.kpis.confianca_media * 100).toFixed(1)}%`}
          icon={<Shield className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Custo Total (USD)"
          value={`$${data.kpis.custo_total_usd.toFixed(2)}`}
          icon={<DollarSign className="h-6 w-6" />}
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* PieChart - Distribuição por Provider */}
        <Card className="p-6">
          <h2 className="text-xl md:text-2xl font-montserrat font-semibold text-deep-navy mb-4">
            Distribuição por Provider
          </h2>
          {data.por_provider.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.por_provider}
                  dataKey="count"
                  nameKey="provider"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry: any) => `${entry.provider}: ${entry.count}`}
                >
                  {data.por_provider.map((entry) => (
                    <Cell
                      key={entry.provider}
                      fill={PROVIDER_COLORS[entry.provider] || '#6B7280'}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-deep-navy/80 text-center py-12">
              Nenhuma transcrição no período
            </p>
          )}
        </Card>

        {/* LineChart - Timeline de Erros */}
        <Card className="p-6">
          <h2 className="text-xl md:text-2xl font-montserrat font-semibold text-deep-navy mb-4">
            Timeline de Erros
          </h2>
          {data.erros_timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.erros_timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="hora"
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    return `${d.getHours().toString().padStart(2, '0')}:00`;
                  }}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(v) => new Date(v as string).toLocaleString('pt-BR')}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="transcricoes_ok"
                  stroke="#10B981"
                  name="Transcrições OK"
                />
                <Line
                  type="monotone"
                  dataKey="erros_stt"
                  stroke="#EF4444"
                  name="Erros STT"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-deep-navy/80 text-center py-12">
              Nenhum dado no período
            </p>
          )}
        </Card>
      </div>

      {/* Tabela de Erros Recentes */}
      <Card className="p-6">
        <h2 className="text-xl md:text-2xl font-montserrat font-semibold text-deep-navy mb-4">
          Erros Recentes (últimos 10)
        </h2>
        {data.erros_recentes.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aula ID</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Atualizado em</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tipo Entrada</TableHead>
                <TableHead>Tamanho Arquivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.erros_recentes.map((erro) => (
                <TableRow key={erro.aula_id}>
                  <TableCell className="font-mono text-xs">
                    {erro.aula_id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    {new Date(erro.data).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {new Date(erro.updated_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                      ERRO
                    </span>
                  </TableCell>
                  <TableCell>{erro.tipo_entrada}</TableCell>
                  <TableCell>
                    {erro.arquivo_tamanho
                      ? `${(erro.arquivo_tamanho / (1024 * 1024)).toFixed(2)} MB`
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-deep-navy/80 text-center py-8">
            Nenhum erro no período selecionado ({PERIODO_LABELS[periodo]})
          </p>
        )}
      </Card>
      </div>
    </div>
  );
}
