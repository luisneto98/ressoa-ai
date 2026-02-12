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
import { TurmasTable } from './components/TurmasTable';
import { ArrowLeft } from 'lucide-react';

export function DashboardCoordenadorProfessorTurmasPage() {
  const { professorId } = useParams<{ professorId: string }>();
  const navigate = useNavigate();
  const [bimestre, setBimestre] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['professor-turmas', professorId, bimestre],
    queryFn: () =>
      api
        .get(`/dashboard/coordenador/professores/${professorId}/turmas`, {
          params: { bimestre },
        })
        .then((res: any) => res.data),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar ao Ranking
      </Button>

      <h1 className="text-2xl font-bold mb-6">Turmas do Professor</h1>

      {/* Filtro de Bimestre */}
      <Card className="p-4 mb-6">
        <Select
          value={bimestre.toString()}
          onValueChange={(v) => setBimestre(parseInt(v))}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1º Bimestre</SelectItem>
            <SelectItem value="2">2º Bimestre</SelectItem>
            <SelectItem value="3">3º Bimestre</SelectItem>
            <SelectItem value="4">4º Bimestre</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {/* Tabela de Turmas */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Métricas por Turma</h2>
        <TurmasTable turmas={data.turmas} />
      </Card>
    </div>
  );
}
