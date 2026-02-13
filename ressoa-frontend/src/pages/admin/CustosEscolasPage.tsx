import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DollarSign, TrendingUp, Activity, Loader2, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/api/axios';
import { StatCard } from '@/pages/dashboard/components/StatCard';

interface CustoEscola {
  escola_id: string;
  escola_nome: string;
  custo_stt: number;
  custo_llm: number;
  custo_total: number;
  total_aulas: number;
  professores_ativos: number;
  custo_por_aula: number;
}

interface MonitoramentoCustosResponse {
  escolas: CustoEscola[];
  totais: {
    custo_total: number;
    total_aulas: number;
    total_escolas: number;
    projecao_mensal: number;
  };
  mes: string;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const CUSTO_ALTO_THRESHOLD = 50;

export function CustosEscolasPage() {
  const [mes, setMes] = useState(getCurrentMonth());

  const { data, isLoading, isError, error } =
    useQuery<MonitoramentoCustosResponse>({
      queryKey: ['admin-custos', mes],
      queryFn: () =>
        apiClient
          .get('/admin/custos/escolas', { params: { mes } })
          .then((res) => res.data),
    });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ghost-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-deep-navy/40" />
          <p className="text-sm text-deep-navy/60">Carregando custos por escola...</p>
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
              <p className="font-semibold">Erro ao carregar custos</p>
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
        Custos por Escola
      </h1>
      <p className="text-deep-navy/80 mb-6">
        Monitoramento de custos API (STT + LLM) por escola
      </p>

      {/* Filtro de Mês */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-deep-navy/80">Mês:</label>
          <Input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="w-[200px]"
          />
        </div>
      </Card>

      {/* KPI StatCards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Custo Total (USD)"
          value={`$${data.totais.custo_total.toFixed(2)}`}
          icon={<DollarSign className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Total de Aulas"
          value={data.totais.total_aulas}
          icon={<Activity className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Projeção Mensal (USD)"
          value={`$${data.totais.projecao_mensal.toFixed(2)}`}
          icon={<TrendingUp className="h-6 w-6" />}
          color="purple"
        />
      </div>

      {/* Tabela Ranking */}
      <Card className="p-6">
        <h2 className="text-xl md:text-2xl font-montserrat font-semibold text-deep-navy mb-4">
          Ranking de Custos por Escola
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Escola</TableHead>
              <TableHead className="text-right">Prof. Ativos</TableHead>
              <TableHead className="text-right">Total Aulas</TableHead>
              <TableHead className="text-right">Custo STT</TableHead>
              <TableHead className="text-right">Custo LLM</TableHead>
              <TableHead className="text-right">Custo Total</TableHead>
              <TableHead className="text-right">Custo/Aula</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.escolas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-deep-navy/80 py-8">
                  Nenhuma escola encontrada para este mês
                </TableCell>
              </TableRow>
            ) : (
              data.escolas.map((escola, idx) => (
                <TableRow
                  key={escola.escola_id}
                  className={escola.custo_total > CUSTO_ALTO_THRESHOLD ? 'bg-red-50' : ''}
                >
                  <TableCell className="font-mono">{idx + 1}</TableCell>
                  <TableCell className="font-semibold">
                    {escola.escola_nome}
                    {escola.custo_total > CUSTO_ALTO_THRESHOLD && (
                      <Badge variant="destructive" className="ml-2">
                        Alto
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {escola.professores_ativos}
                  </TableCell>
                  <TableCell className="text-right">
                    {escola.total_aulas}
                  </TableCell>
                  <TableCell className="text-right">
                    ${escola.custo_stt.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    ${escola.custo_llm.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${escola.custo_total.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    ${escola.custo_por_aula.toFixed(4)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
      </div>
    </div>
  );
}
