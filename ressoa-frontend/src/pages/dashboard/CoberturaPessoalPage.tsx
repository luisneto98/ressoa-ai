import { useState, useEffect } from 'react';
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
import { getCoberturaLabel } from '@/lib/cobertura-helpers';
import { fetchProfessorTurmas } from '@/api/aulas';
import api from '@/lib/api';

interface FiltrosCobertura {
  disciplina?: string;
  bimestre?: number;
  curriculo_tipo?: 'TODOS' | 'BNCC' | 'CUSTOM'; // Story 11.8: Filter by curriculum type
}

// Mapeamento de códigos de disciplina para nomes legíveis
const DISCIPLINA_LABELS: Record<string, string> = {
  MATEMATICA: 'Matemática',
  LINGUA_PORTUGUESA: 'Língua Portuguesa',
  CIENCIAS: 'Ciências',
  HISTORIA: 'História',
  GEOGRAFIA: 'Geografia',
  ARTE: 'Arte',
  EDUCACAO_FISICA: 'Educação Física',
  LINGUA_INGLESA: 'Língua Inglesa',
  ENSINO_RELIGIOSO: 'Ensino Religioso',
  COMPUTACAO: 'Computação',
  CIENCIAS_HUMANAS: 'Ciências Humanas',
  CIENCIAS_NATUREZA: 'Ciências da Natureza',
  LINGUAGENS: 'Linguagens',
  MATEMATICA_MEDIO: 'Matemática',
};

export function CoberturaPessoalPage() {
  const [filtros, setFiltros] = useState<FiltrosCobertura>({
    disciplina: undefined,
    bimestre: 1,
    curriculo_tipo: 'TODOS', // Default: show all curriculum types
  });

  // Buscar turmas do professor para extrair disciplinas disponíveis
  const { data: turmas } = useQuery({
    queryKey: ['professor-turmas'],
    queryFn: fetchProfessorTurmas,
  });

  // Extrair disciplinas únicas das turmas
  const disciplinasDisponiveis = turmas
    ? Array.from(new Set(turmas.map(t => t.disciplina))).sort()
    : [];

  // Auto-selecionar primeira disciplina quando carregar
  useEffect(() => {
    if (disciplinasDisponiveis.length > 0 && !filtros.disciplina) {
      setFiltros(prev => ({ ...prev, disciplina: disciplinasDisponiveis[0] }));
    }
  }, [disciplinasDisponiveis, filtros.disciplina]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['cobertura-pessoal', filtros],
    queryFn: () => {
      // Build API params - exclude 'TODOS' from curriculo_tipo
      const apiParams = {
        ...filtros,
        curriculo_tipo: filtros.curriculo_tipo === 'TODOS' ? undefined : filtros.curriculo_tipo,
      };
      return api
        .get('/professores/me/cobertura', { params: apiParams })
        .then((res) => res.data);
    },
    enabled: !!filtros.disciplina, // Só executa se tiver disciplina selecionada
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-deep-navy/60 mb-2">Carregando sua cobertura curricular...</div>
          {filtros.disciplina && (
            <p className="text-sm text-deep-navy/40">
              Buscando dados de {DISCIPLINA_LABELS[filtros.disciplina] || filtros.disciplina} — {filtros.bimestre}º bimestre
            </p>
          )}
        </div>
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

  // Story 11.8 AC3: Get adaptive label for coverage metric
  const coberturaLabelConfig = getCoberturaLabel(filtros.curriculo_tipo);

  return (
    <div className="min-h-screen bg-ghost-white">
      <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl md:text-4xl font-montserrat font-bold text-deep-navy mb-6">
        Minha Cobertura Curricular
      </h1>

      {/* Filtros */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <Select
            value={filtros.disciplina}
            onValueChange={(v) =>
              setFiltros({
                ...filtros,
                disciplina: v
              })
            }
            disabled={disciplinasDisponiveis.length === 0}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder={
                disciplinasDisponiveis.length === 0
                  ? "Nenhuma turma encontrada"
                  : "Selecione a disciplina"
              } />
            </SelectTrigger>
            <SelectContent>
              {disciplinasDisponiveis.map(disc => (
                <SelectItem key={disc} value={disc}>
                  {DISCIPLINA_LABELS[disc] || disc}
                </SelectItem>
              ))}
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

          <Select
            value={filtros.curriculo_tipo}
            onValueChange={(v) =>
              setFiltros({
                ...filtros,
                curriculo_tipo: v as 'TODOS' | 'BNCC' | 'CUSTOM'
              })
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tipo de Currículo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="BNCC">BNCC</SelectItem>
              <SelectItem value="CUSTOM">Curso Customizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title={coberturaLabelConfig.title}
          value={`${data.stats.media_cobertura.toFixed(1)}%`}
          icon={<TrendingUp className="h-6 w-6" />}
          color="blue"
          tooltip={coberturaLabelConfig.tooltip}
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
        <h2 className="text-xl md:text-2xl font-montserrat font-semibold text-deep-navy mb-4">
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
          <h2 className="text-xl md:text-2xl font-montserrat font-semibold text-deep-navy mb-4">
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
