import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, School, CheckCircle, Clock, X, Loader2, AlertTriangle, BookOpen, GraduationCap } from 'lucide-react';
import { apiClient } from '@/api/axios';
import { StatCard } from './components/StatCard';
import { CoberturaPorDisciplinaChart } from './components/CoberturaPorDisciplinaChart';
import { EvolucaoTemporalChart } from './components/EvolucaoTemporalChart';

// Thresholds for color coding (aligned with backend constants)
const COBERTURA_META_THRESHOLD = 70; // >= 70% = green
const COBERTURA_ATENCAO_THRESHOLD = 50; // 50-70% = orange, < 50% = red
const TEMPO_REVISAO_FAST = 300; // < 5min = green
const TEMPO_REVISAO_MEDIUM = 600; // 5-10min = orange, > 10min = red

interface MetricasDiretor {
  kpis: {
    cobertura_geral: number;
    total_professores_ativos: number;
    total_turmas: number;
    total_aulas: number;
    tempo_medio_revisao_geral: number;
    // AC #7: Breakdown by tipo_ensino
    cobertura_fundamental: number;
    cobertura_medio: number;
    total_turmas_fundamental: number;
    total_turmas_medio: number;
  };
  por_disciplina: Array<{
    disciplina: string;
    cobertura_media: number;
    total_turmas: number;
    total_aulas: number;
  }>;
  evolucao_temporal: Array<{
    bimestre: number;
    cobertura_media: number;
  }>;
}

export function DashboardDiretorPage() {
  const [bimestre, setBimestre] = useState<number | undefined>(undefined);

  const { data, isLoading, isError, error } = useQuery<MetricasDiretor>({
    queryKey: ['dashboard-diretor', bimestre],
    queryFn: () =>
      apiClient
        .get('/dashboard/diretor/metricas', {
          params: bimestre ? { bimestre } : {},
        })
        .then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ghost-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-deep-navy/40" />
          <p className="text-sm text-deep-navy/60">Carregando métricas da escola...</p>
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
              <p className="font-semibold">Erro ao carregar dashboard</p>
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
      <h1 className="text-3xl md:text-4xl font-montserrat font-bold text-deep-navy mb-2">Dashboard Executivo</h1>
      <p className="text-deep-navy/80 mb-6">
        Visão consolidada das métricas de cobertura curricular da escola
      </p>

      {/* Filtro de Bimestre */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-deep-navy/80">Bimestre:</label>
          <Select
            value={bimestre?.toString() || 'todos'}
            onValueChange={(v) => setBimestre(v === 'todos' ? undefined : parseInt(v))}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Ano Inteiro</SelectItem>
              <SelectItem value="1">1º Bimestre</SelectItem>
              <SelectItem value="2">2º Bimestre</SelectItem>
              <SelectItem value="3">3º Bimestre</SelectItem>
              <SelectItem value="4">4º Bimestre</SelectItem>
            </SelectContent>
          </Select>
          {bimestre && (
            <Button variant="outline" size="sm" onClick={() => setBimestre(undefined)}>
              <X className="h-4 w-4 mr-2" />
              Limpar Filtro
            </Button>
          )}
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Cobertura Geral"
          value={`${data.kpis.cobertura_geral.toFixed(1)}%`}
          icon={<TrendingUp className="h-6 w-6" />}
          color={
            data.kpis.cobertura_geral >= COBERTURA_META_THRESHOLD
              ? 'green'
              : data.kpis.cobertura_geral >= COBERTURA_ATENCAO_THRESHOLD
                ? 'orange'
                : 'red'
          }
        />
        <StatCard
          title="Professores Ativos"
          value={data.kpis.total_professores_ativos}
          icon={<Users className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Total de Turmas"
          value={data.kpis.total_turmas}
          icon={<School className="h-6 w-6" />}
          color="purple"
        />
        <StatCard
          title="Aulas Aprovadas"
          value={data.kpis.total_aulas}
          icon={<CheckCircle className="h-6 w-6" />}
          color="cyan"
        />
        <StatCard
          title="Tempo Médio Revisão"
          value={`${Math.floor(data.kpis.tempo_medio_revisao_geral / 60)}min`}
          icon={<Clock className="h-6 w-6" />}
          color={
            data.kpis.tempo_medio_revisao_geral < TEMPO_REVISAO_FAST
              ? 'green'
              : data.kpis.tempo_medio_revisao_geral < TEMPO_REVISAO_MEDIUM
                ? 'orange'
                : 'red'
          }
        />
      </div>

      {/* AC #7: Breakdown por tipo de ensino - Side by side */}
      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-montserrat font-semibold text-deep-navy mb-4">Cobertura por Tipo de Ensino</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            title="Cobertura Fundamental"
            value={`${data.kpis.cobertura_fundamental.toFixed(1)}%`}
            subtitle={`${data.kpis.total_turmas_fundamental} turmas`}
            icon={<BookOpen className="h-5 w-5" />}
            color={
              data.kpis.cobertura_fundamental >= COBERTURA_META_THRESHOLD
                ? 'green'
                : data.kpis.cobertura_fundamental >= COBERTURA_ATENCAO_THRESHOLD
                  ? 'orange'
                  : 'red'
            }
          />
          <StatCard
            title="Cobertura Médio"
            value={`${data.kpis.cobertura_medio.toFixed(1)}%`}
            subtitle={`${data.kpis.total_turmas_medio} turmas`}
            icon={<GraduationCap className="h-5 w-5" />}
            color={
              data.kpis.cobertura_medio >= COBERTURA_META_THRESHOLD
                ? 'green'
                : data.kpis.cobertura_medio >= COBERTURA_ATENCAO_THRESHOLD
                  ? 'orange'
                  : 'red'
            }
          />
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico: Cobertura por Disciplina */}
        <Card className="p-6">
          <h2 className="text-xl md:text-2xl font-montserrat font-semibold text-deep-navy mb-4">Cobertura por Disciplina</h2>
          <CoberturaPorDisciplinaChart data={data.por_disciplina} />
        </Card>

        {/* Gráfico: Evolução Temporal */}
        <Card className="p-6">
          <h2 className="text-xl md:text-2xl font-montserrat font-semibold text-deep-navy mb-4">Evolução ao Longo do Ano</h2>
          <EvolucaoTemporalChart data={data.evolucao_temporal} />
        </Card>
      </div>
      </div>
    </div>
  );
}
