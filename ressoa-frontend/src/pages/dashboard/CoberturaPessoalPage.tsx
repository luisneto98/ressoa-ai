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
import { TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { StatCard } from './components/StatCard';
import { CoberturaTable } from './components/CoberturaTable';
import { CoberturaChart } from './components/CoberturaChart';
import api from '@/lib/api';

interface FiltrosCobertura {
  disciplina?: 'MATEMATICA' | 'LINGUA_PORTUGUESA' | 'CIENCIAS';
  bimestre?: number;
}

export function CoberturaPessoalPage() {
  const [filtros, setFiltros] = useState<FiltrosCobertura>({
    disciplina: 'MATEMATICA',
    bimestre: 1,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['cobertura-pessoal', filtros],
    queryFn: () =>
      api
        .get('/professores/me/cobertura', { params: filtros })
        .then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-deep-navy/60">Carregando...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">
            Erro ao carregar dados de cobertura
          </p>
          <p className="text-deep-navy/60 text-sm">
            {error instanceof Error ? error.message : 'Erro desconhecido'}
          </p>
        </div>
      </div>
    );
  }

  // Validate data structure before rendering
  if (!data || !data.stats || !Array.isArray(data.cobertura)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-deep-navy/60">
          <p>Dados inválidos recebidos do servidor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ghost-white">
      <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-montserrat font-bold text-deep-navy mb-6">
        Minha Cobertura Curricular
      </h1>

      {/* Filtros */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4">
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
        </div>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Média de Cobertura"
          value={`${data.stats.media_cobertura.toFixed(1)}%`}
          icon={<TrendingUp className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Total de Turmas"
          value={data.stats.total_turmas}
          icon={<Users className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Turmas Abaixo da Meta"
          value={data.stats.turmas_abaixo_meta}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="orange"
        />
      </div>

      {/* Tabela de Cobertura por Turma */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold text-deep-navy mb-4">
          Cobertura por Turma
        </h2>
        {data.cobertura.length > 0 ? (
          <CoberturaTable cobertura={data.cobertura} />
        ) : (
          <div className="text-center text-deep-navy/80 py-8">
            <p>Nenhuma turma encontrada para os filtros selecionados.</p>
            <p className="text-sm text-deep-navy/60 mt-2">
              Cadastre um planejamento e envie aulas para começar.
            </p>
          </div>
        )}
      </Card>

      {/* Gráfico de Progresso Temporal */}
      {data.cobertura.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-deep-navy mb-4">
            Progresso ao Longo do Bimestre
          </h2>
          <CoberturaChart
            turmaId={data.cobertura[0].turma_id}
            bimestre={filtros.bimestre || 1}
          />
        </Card>
      )}
      </div>
    </div>
  );
}
