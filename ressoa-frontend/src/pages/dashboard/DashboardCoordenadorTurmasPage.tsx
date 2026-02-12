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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { StatCard } from './components/StatCard';
import { TurmaCard } from './components/TurmaCard';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';

interface FiltrosCobertura {
  disciplina?: 'MATEMATICA' | 'LINGUA_PORTUGUESA' | 'CIENCIAS';
  bimestre?: number;
}

export function DashboardCoordenadorTurmasPage() {
  const [filtros, setFiltros] = useState<FiltrosCobertura>({
    bimestre: 1,
    disciplina: 'MATEMATICA',
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard-turmas', filtros],
    queryFn: () =>
      api
        .get('/dashboard/coordenador/turmas', { params: filtros })
        .then((res: any) => res.data),
  });

  const handleLimparFiltros = () => {
    setFiltros({ bimestre: 1, disciplina: 'MATEMATICA' });
  };

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
      <h1 className="text-2xl font-bold mb-6">Dashboard - Turmas</h1>

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
            <Button variant="ghost" onClick={handleLimparFiltros}>
              Limpar Filtros
            </Button>
          )}
        </div>
      </Card>

      {/* Cards de Classificação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Turmas Críticas (<50%)"
          value={data.classificacao.criticas}
          icon={<AlertCircle className="h-6 w-6" />}
          color="red"
        />
        <StatCard
          title="Turmas em Atenção (50-70%)"
          value={data.classificacao.atencao}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="orange"
        />
        <StatCard
          title="Turmas no Ritmo (>70%)"
          value={data.classificacao.no_ritmo}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
        />
      </div>

      {/* Alerta: Turmas Priorizadas */}
      {data.turmas_priorizadas.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção! Turmas Prioritárias</AlertTitle>
          <AlertDescription>
            {data.turmas_priorizadas.length} turmas estão com cobertura crítica
            (&lt;50%) e requerem intervenção urgente.
          </AlertDescription>
        </Alert>
      )}

      {/* Grid de Turmas */}
      {data.metricas.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600">
            Nenhuma turma encontrada com os filtros selecionados.
          </p>
          <Button variant="outline" onClick={handleLimparFiltros} className="mt-4">
            Limpar Filtros
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.metricas.map((turma: any) => (
            <TurmaCard key={turma.turma_id} turma={turma} />
          ))}
        </div>
      )}
    </div>
  );
}
