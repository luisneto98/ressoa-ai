import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Turma {
  turma_id: string;
  turma_nome: string;
  turma_serie: string;
  disciplina: string;
  bimestre: number;
  percentual_cobertura: number;
  habilidades_planejadas: number;
  habilidades_trabalhadas: number;
  total_aulas: number;
  professores: string;
}

interface Props {
  turma: Turma;
}

export function TurmaCard({ turma }: Props) {
  const navigate = useNavigate();

  const getCardBorderColor = (percentual: number) => {
    if (percentual < 50) return 'border-l-4 border-red-500';
    if (percentual < 70) return 'border-l-4 border-orange-500';
    return 'border-l-4 border-green-500';
  };

  const getStatusBadge = (percentual: number) => {
    if (percentual < 50)
      return <Badge variant="destructive">Crítico</Badge>;
    if (percentual < 70)
      return (
        <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>
      );
    return <Badge className="bg-green-100 text-green-800">No Ritmo</Badge>;
  };

  return (
    <Card
      className={cn(
        'p-4 cursor-pointer hover:shadow-lg transition',
        getCardBorderColor(Number(turma.percentual_cobertura)),
      )}
      onClick={() =>
        navigate(`/dashboard/coordenador/turmas/${turma.turma_id}/detalhes`)
      }
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">{turma.turma_nome}</h3>
          <p className="text-sm text-gray-600">{turma.professores}</p>
        </div>
        {getStatusBadge(Number(turma.percentual_cobertura))}
      </div>

      {/* Progresso */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span>Cobertura</span>
          <span className="font-semibold">
            {Number(turma.percentual_cobertura).toFixed(1)}%
          </span>
        </div>
        <Progress
          value={Number(turma.percentual_cobertura)}
          className="h-2"
        />
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-gray-600">Habilidades</p>
          <p className="font-semibold">
            {turma.habilidades_trabalhadas}/{turma.habilidades_planejadas}
          </p>
        </div>
        <div>
          <p className="text-gray-600">Aulas</p>
          <p className="font-semibold">{turma.total_aulas}</p>
        </div>
      </div>
    </Card>
  );
}
