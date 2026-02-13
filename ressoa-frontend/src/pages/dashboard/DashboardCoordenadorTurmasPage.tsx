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
import { AlertCircle, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface FiltrosCobertura {
  disciplina?: 'MATEMATICA' | 'LINGUA_PORTUGUESA' | 'CIENCIAS';
  bimestre?: number;
  tipo_ensino?: 'FUNDAMENTAL' | 'MEDIO';
}

/**
 * Calcula o bimestre atual com base no mês (contexto adaptativo - UX Spec princípio #4)
 */
const getCurrentBimestre = (): number => {
  const month = new Date().getMonth() + 1; // 1-12
  if (month <= 3) return 1;
  if (month <= 6) return 2;
  if (month <= 9) return 3;
  return 4;
};

export function DashboardCoordenadorTurmasPage() {
  const [filtros, setFiltros] = useState<FiltrosCobertura>({
    bimestre: getCurrentBimestre(),
    disciplina: undefined, // Mostrar todas por padrão
    tipo_ensino: undefined, // Mostrar todos os tipos por padrão (AC #1)
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard-turmas', filtros],
    queryFn: () =>
      api
        .get('/dashboard/coordenador/turmas', { params: filtros })
        .then((res: any) => res.data),
  });

  const handleLimparFiltros = () => {
    setFiltros({ bimestre: undefined, disciplina: undefined, tipo_ensino: undefined });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ghost-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-deep-navy/40" />
          <p className="text-sm text-deep-navy/60">Carregando métricas das turmas...</p>
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
                <p className="text-sm text-deep-navy/80">{error.message}</p>
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
            <p className="text-deep-navy/80">Sem dados disponíveis</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ghost-white">
      <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl md:text-4xl font-montserrat font-bold text-deep-navy mb-6">Dashboard - Turmas</h1>

      {/* Filtros */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4 items-center flex-wrap">
          <Select
            value={filtros.tipo_ensino || 'TODOS'}
            onValueChange={(v) =>
              setFiltros({ ...filtros, tipo_ensino: v === 'TODOS' ? undefined : v as 'FUNDAMENTAL' | 'MEDIO' })
            }
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Tipo de Ensino" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="FUNDAMENTAL">Ensino Fundamental</SelectItem>
              <SelectItem value="MEDIO">Ensino Médio</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filtros.disciplina}
            onValueChange={(v) =>
              setFiltros({ ...filtros, disciplina: v as any })
            }
          >
            <SelectTrigger className="w-full md:w-[220px]">
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
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Bimestre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1º Bimestre</SelectItem>
              <SelectItem value="2">2º Bimestre</SelectItem>
              <SelectItem value="3">3º Bimestre</SelectItem>
              <SelectItem value="4">4º Bimestre</SelectItem>
            </SelectContent>
          </Select>

          {(filtros.disciplina || filtros.bimestre || filtros.tipo_ensino) && (
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
          <p className="text-deep-navy/80">
            {/* AC #8: Empty state customizado por filtro */}
            {filtros.tipo_ensino === 'MEDIO'
              ? 'Não há turmas de Ensino Médio cadastradas neste filtro.'
              : filtros.tipo_ensino === 'FUNDAMENTAL'
              ? 'Não há turmas de Ensino Fundamental cadastradas neste filtro.'
              : 'Nenhuma turma encontrada com os filtros selecionados.'}
          </p>
          <Button variant="outline" onClick={handleLimparFiltros} className="mt-4">
            {filtros.tipo_ensino ? 'Ver todas as turmas' : 'Limpar Filtros'}
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
    </div>
  );
}
