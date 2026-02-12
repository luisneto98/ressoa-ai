import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatCard } from './components/StatCard';
import { ProfessoresTable } from './components/ProfessoresTable';
import { TrendingUp, Users, AlertTriangle } from 'lucide-react';

interface FiltrosCobertura {
  disciplina?: 'MATEMATICA' | 'LINGUA_PORTUGUESA' | 'CIENCIAS';
  bimestre?: number;
}

export function DashboardCoordenadorProfessoresPage() {
  const [filtros, setFiltros] = useState<FiltrosCobertura>({
    bimestre: 1,
    disciplina: 'MATEMATICA',
  });

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['dashboard-professores', filtros],
    queryFn: () =>
      api
        .get('/dashboard/coordenador/professores', { params: filtros })
        .then((res: any) => res.data),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">
          Erro ao carregar dashboard: {error.message}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Sem dados disponíveis</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard - Professores</h1>

      {/* Filtros */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4 items-center">
          <Select
            value={filtros.disciplina}
            onValueChange={(v) =>
              setFiltros({ ...filtros, disciplina: v as any })
            }
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Disciplina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MATEMATICA">Matemática</SelectItem>
              <SelectItem value="LINGUA_PORTUGUESA">
                Língua Portuguesa
              </SelectItem>
              <SelectItem value="CIENCIAS">Ciências</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filtros.bimestre?.toString()}
            onValueChange={(v) =>
              setFiltros({ ...filtros, bimestre: parseInt(v) })
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Bimestre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1º Bimestre</SelectItem>
              <SelectItem value="2">2º Bimestre</SelectItem>
              <SelectItem value="3">3º Bimestre</SelectItem>
              <SelectItem value="4">4º Bimestre</SelectItem>
            </SelectContent>
          </Select>

          {(filtros.disciplina || filtros.bimestre) && (
            <Button
              variant="ghost"
              onClick={() =>
                setFiltros({ disciplina: undefined, bimestre: undefined })
              }
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Média Geral de Cobertura"
          value={`${data.resumo.media_geral.toFixed(1)}%`}
          icon={<TrendingUp className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Total de Professores"
          value={data.resumo.total_professores}
          icon={<Users className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Professores Abaixo da Meta"
          value={data.resumo.professores_abaixo_meta}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="orange"
        />
      </div>

      {/* Tabela de Professores */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Ranking de Professores</h2>
        <ProfessoresTable metricas={data.metricas} />
      </Card>
    </div>
  );
}
