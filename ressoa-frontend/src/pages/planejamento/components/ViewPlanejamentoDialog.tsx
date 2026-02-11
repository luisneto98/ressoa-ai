import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Planejamento } from '../hooks/usePlanejamentos';
import { StatusBadge } from './StatusBadge';

interface ViewPlanejamentoDialogProps {
  planejamento: Planejamento;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewPlanejamentoDialog = ({
  planejamento,
  open,
  onOpenChange,
}: ViewPlanejamentoDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Detalhes do Planejamento</DialogTitle>
          <DialogDescription>
            Visualização completa do planejamento bimestral
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Turma Info Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Turma</p>
                  <p className="font-semibold">
                    {planejamento.turma.nome} - {planejamento.turma.disciplina}
                  </p>
                  <p className="text-sm text-muted-foreground">{planejamento.turma.serie}º ano</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Período</p>
                  <p className="font-semibold">
                    Bimestre {planejamento.bimestre} - {planejamento.ano_letivo}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                <StatusBadge validado={planejamento.validado_coordenacao} />
              </div>
            </CardContent>
          </Card>

          {/* Habilidades List */}
          <div>
            <h3 className="font-semibold mb-2">
              Habilidades ({planejamento.habilidades.length})
            </h3>
            <ScrollArea className="h-[300px] border rounded-md p-4">
              <div className="space-y-4">
                {planejamento.habilidades.map((hab) => (
                  <div key={hab.id} className="border-b pb-3 last:border-b-0">
                    <p className="font-bold text-sm text-tech-blue mb-1">
                      {hab.habilidade.codigo}
                    </p>
                    <p className="text-sm text-gray-700 mb-2">{hab.habilidade.descricao}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {hab.peso && hab.peso !== 100 && (
                        <span>Peso: {hab.peso}%</span>
                      )}
                      {hab.aulas_previstas && (
                        <span>Aulas previstas: {hab.aulas_previstas}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
