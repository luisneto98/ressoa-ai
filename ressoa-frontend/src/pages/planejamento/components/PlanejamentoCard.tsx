import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Planejamento } from '../hooks/usePlanejamentos';
import { StatusBadge } from './StatusBadge';
import { PlanejamentoActionsDropdown } from './PlanejamentoActionsDropdown';

interface PlanejamentoCardProps {
  planejamento: Planejamento;
}

export const PlanejamentoCard = ({ planejamento }: PlanejamentoCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-deep-navy">{planejamento.turma.nome}</CardTitle>
        <CardDescription>
          {planejamento.turma.disciplina} - {planejamento.turma.serie}º ano
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bimestre:</span>
            <span className="font-medium">{planejamento.bimestre}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ano:</span>
            <span className="font-medium">{planejamento.ano_letivo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Habilidades:</span>
            <span className="font-medium">{planejamento.habilidades.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Status:</span>
            <StatusBadge validado={planejamento.validado_coordenacao} />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <PlanejamentoActionsDropdown planejamento={planejamento} />
      </CardFooter>
    </Card>
  );
};
