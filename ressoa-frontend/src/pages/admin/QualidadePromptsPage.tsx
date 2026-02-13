import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/api/axios';
import { StatCard } from '@/pages/dashboard/components/StatCard';

interface PromptMetrica {
  nome: string;
  versao: string;
  ab_testing: boolean;
  total_analises: number;
  aprovadas: number;
  rejeitadas: number;
  taxa_aprovacao: number;
  tempo_medio_revisao: number;
  status: 'Excelente' | 'Bom' | 'Low Performer';
}

interface QualidadePromptsResponse {
  metricas: PromptMetrica[];
  resumo: {
    total_versoes: number;
    low_performers: number;
    taxa_aprovacao_geral: number;
  };
  periodo: string;
}

const PROMPT_NOMES_DISPLAY: Record<string, string> = {
  'prompt-cobertura': 'Cobertura BNCC',
  'prompt-qualitativa': 'Análise Qualitativa',
  'prompt-relatorio': 'Relatório',
  'prompt-exercicios': 'Exercícios',
  'prompt-alertas': 'Alertas',
};

function getStatusBadge(status: string) {
  switch (status) {
    case 'Excelente':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Excelente</Badge>;
    case 'Bom':
      return <Badge variant="secondary">Bom</Badge>;
    case 'Low Performer':
      return <Badge variant="destructive">Low Performer</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getHeatmapColor(taxaAprovacao: number): string {
  if (taxaAprovacao >= 90) return 'bg-green-500';
  if (taxaAprovacao >= 80) return 'bg-yellow-500';
  if (taxaAprovacao >= 70) return 'bg-orange-500';
  return 'bg-red-500';
}

function getProgressColor(taxaAprovacao: number): string {
  if (taxaAprovacao >= 90) return '[&>div]:bg-green-500';
  if (taxaAprovacao >= 80) return '[&>div]:bg-yellow-500';
  if (taxaAprovacao >= 70) return '[&>div]:bg-orange-500';
  return '[&>div]:bg-red-500';
}

export function QualidadePromptsPage() {
  const [periodo, setPeriodo] = useState('30d');
  const navigate = useNavigate();

  const { data, isLoading, isError, error } =
    useQuery<QualidadePromptsResponse>({
      queryKey: ['admin-prompts-qualidade', periodo],
      queryFn: () =>
        apiClient
          .get('/admin/prompts/qualidade', { params: { periodo } })
          .then((res) => res.data),
      refetchInterval: 300000, // 5min
    });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ghost-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-deep-navy/40" />
          <p className="text-sm text-deep-navy/60">Carregando métricas de qualidade de prompts...</p>
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
              <p className="font-semibold">Erro ao carregar qualidade de prompts</p>
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

  // Build heatmap data: group by nome, with versions as columns
  const heatmapData = buildHeatmapData(data.metricas);

  return (
    <div className="min-h-screen bg-ghost-white">
      <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl md:text-4xl font-montserrat font-bold text-deep-navy mb-2">
        Qualidade de Prompts
      </h1>
      <p className="text-deep-navy/80 mb-6">
        Monitoramento de taxa de aprovação e performance de prompts de IA
      </p>

      {/* Filtro de Período */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-deep-navy/80">Período:</label>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* KPI StatCards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Versões de Prompt"
          value={data.resumo.total_versoes}
          icon={<Activity className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Taxa Aprovação Geral"
          value={`${data.resumo.taxa_aprovacao_geral}%`}
          icon={<TrendingUp className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Low Performers"
          value={data.resumo.low_performers}
          icon={<AlertTriangle className="h-6 w-6" />}
          color={data.resumo.low_performers > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Tabela de Métricas */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl md:text-2xl font-montserrat font-semibold text-deep-navy mb-4">
          Métricas por Versão de Prompt
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prompt</TableHead>
              <TableHead>Versão</TableHead>
              <TableHead className="text-right">Total Análises</TableHead>
              <TableHead className="w-[200px]">Taxa Aprovação</TableHead>
              <TableHead className="text-right">Tempo Médio Revisão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>A/B</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.metricas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-deep-navy/80 py-8">
                  Nenhuma métrica disponível no período selecionado
                </TableCell>
              </TableRow>
            ) : (
              data.metricas.map((m) => (
                <TableRow
                  key={`${m.nome}-${m.versao}`}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() =>
                    navigate(`/admin/prompts/${encodeURIComponent(m.nome)}/${encodeURIComponent(m.versao)}/diffs`)
                  }
                >
                  <TableCell className="font-medium">
                    {PROMPT_NOMES_DISPLAY[m.nome] || m.nome}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{m.versao}</TableCell>
                  <TableCell className="text-right">{m.total_analises}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={m.taxa_aprovacao}
                        className={`h-2 flex-1 ${getProgressColor(m.taxa_aprovacao)}`}
                      />
                      <span className="text-sm font-medium w-12 text-right">
                        {m.taxa_aprovacao}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {m.tempo_medio_revisao > 0
                      ? `${m.tempo_medio_revisao}s`
                      : '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(m.status)}</TableCell>
                  <TableCell>
                    {m.ab_testing && (
                      <Badge variant="outline" className="border-cyan-500 text-cyan-700">
                        A/B
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Heatmap de Qualidade */}
      <Card className="p-6">
        <h2 className="text-xl md:text-2xl font-montserrat font-semibold text-deep-navy mb-4">
          Heatmap de Qualidade
        </h2>
        <div className="flex items-center gap-4 mb-4 text-sm text-deep-navy/80">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span>&gt;90%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-yellow-500" />
            <span>80-90%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-orange-500" />
            <span>70-80%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span>&lt;70%</span>
          </div>
        </div>

        {heatmapData.length === 0 ? (
          <p className="text-deep-navy/80 text-center py-8">
            Nenhum dado para heatmap
          </p>
        ) : (
          <div className="grid gap-3">
            {heatmapData.map((row) => (
              <div key={row.nome} className="flex items-center gap-3">
                <span className="text-sm font-medium text-deep-navy/80 w-40 truncate">
                  {PROMPT_NOMES_DISPLAY[row.nome] || row.nome}
                </span>
                <div className="flex gap-2 flex-1">
                  {row.versoes.map((v) => (
                    <div
                      key={v.versao}
                      className={`${getHeatmapColor(v.taxa_aprovacao)} rounded px-3 py-2 text-white text-xs font-medium min-w-[80px] text-center cursor-pointer hover:opacity-80 transition-opacity`}
                      title={`${v.versao}: ${v.taxa_aprovacao}% (${v.total_analises} análises)`}
                      onClick={() =>
                        navigate(`/admin/prompts/${encodeURIComponent(row.nome)}/${encodeURIComponent(v.versao)}/diffs`)
                      }
                    >
                      <div>{v.versao}</div>
                      <div className="text-[10px] opacity-80">{v.taxa_aprovacao}%</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      </div>
    </div>
  );
}

function buildHeatmapData(metricas: PromptMetrica[]) {
  const grouped = new Map<string, Array<{ versao: string; taxa_aprovacao: number; total_analises: number }>>();

  for (const m of metricas) {
    const existing = grouped.get(m.nome) || [];
    existing.push({
      versao: m.versao,
      taxa_aprovacao: m.taxa_aprovacao,
      total_analises: m.total_analises,
    });
    grouped.set(m.nome, existing);
  }

  return Array.from(grouped.entries()).map(([nome, versoes]) => ({
    nome,
    versoes,
  }));
}
