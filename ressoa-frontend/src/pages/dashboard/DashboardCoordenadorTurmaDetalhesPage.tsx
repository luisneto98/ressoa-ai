import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
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
import { HabilidadesTable } from './components/HabilidadesTable';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';

export function DashboardCoordenadorTurmaDetalhesPage() {
  const { turmaId } = useParams<{ turmaId: string }>();
  const navigate = useNavigate();
  const [bimestre, setBimestre] = useState<number | undefined>(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['turma-detalhes', turmaId, bimestre],
    queryFn: () =>
      api
        .get(`/dashboard/coordenador/turmas/${turmaId}/detalhes`, {
          params: bimestre ? { bimestre } : {},
        })
        .then((res: any) => res.data),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ghost-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-deep-navy/40" />
          <p className="text-sm text-deep-navy/60">Carregando detalhes da turma...</p>
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
                <p className="font-semibold">Erro ao carregar detalhes</p>
                <p className="text-sm text-deep-navy/80">{error.message}</p>
              </div>
            </div>
          </Card>
          <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ghost-white">
      <div className="max-w-7xl mx-auto p-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar ao Dashboard de Turmas
      </Button>

      <h1 className="text-3xl md:text-4xl font-montserrat font-bold text-deep-navy mb-6">Detalhes da Turma</h1>

      {/* Filtro de Bimestre */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium text-deep-navy/80">Filtrar por Bimestre:</label>
          <Select
            value={bimestre?.toString() || 'todos'}
            onValueChange={(v) =>
              setBimestre(v === 'todos' ? undefined : parseInt(v))
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Bimestres</SelectItem>
              <SelectItem value="1">1º Bimestre</SelectItem>
              <SelectItem value="2">2º Bimestre</SelectItem>
              <SelectItem value="3">3º Bimestre</SelectItem>
              <SelectItem value="4">4º Bimestre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tabela de Habilidades */}
      <Card className="p-6">
        <h2 className="text-xl md:text-2xl font-montserrat font-semibold text-deep-navy mb-4">Status de Habilidades BNCC</h2>
        {!data?.detalhes || data.detalhes.length === 0 ? (
          <p className="text-deep-navy/80 text-center py-8">
            Nenhuma habilidade planejada para esta turma no bimestre selecionado.
          </p>
        ) : (
          <HabilidadesTable habilidades={data.detalhes} />
        )}
      </Card>
      </div>
    </div>
  );
}
