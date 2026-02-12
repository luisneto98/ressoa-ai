import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, FileText, RotateCw, Trash2, Sparkles } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { TipoBadge } from './TipoBadge';
import { formatDate } from '@/lib/utils';
import type { AulaListItem } from '@/api/aulas';

interface AulasCardsProps {
  aulas: AulaListItem[];
  onViewDetails: (id: string) => void;
  onReview: (id: string) => void;
  onReprocess: (id: string) => void;
  onDelete: (id: string) => void;
  onStartAnalise: (id: string) => void;
}

export const AulasCards = ({
  aulas,
  onViewDetails,
  onReview,
  onReprocess,
  onDelete,
  onStartAnalise,
}: AulasCardsProps) => {
  return (
    <div className="block md:hidden space-y-4">
      {aulas.map((aula) => (
        <Card key={aula.id}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-lg">{aula.turma_nome}</p>
                <p className="text-sm text-gray-600">{formatDate(aula.data)}</p>
              </div>
              <TipoBadge tipo={aula.tipo_entrada} />
            </div>
          </CardHeader>

          <CardContent className="pb-3">
            <StatusBadge status={aula.status_processamento} />
          </CardContent>

          <CardFooter className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="default"
              onClick={() => onViewDetails(aula.id)}
              className="flex-1 min-h-[44px]"
            >
              <Eye className="h-4 w-4 mr-2" />
              Detalhes
            </Button>

            {aula.status_processamento === 'TRANSCRITA' && (
              <Button
                variant="default"
                size="default"
                onClick={() => onStartAnalise(aula.id)}
                className="flex-1 min-h-[44px]"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Analisar
              </Button>
            )}

            {['ANALISADA', 'APROVADA'].includes(aula.status_processamento) && (
              <Button
                variant="default"
                size="default"
                onClick={() => onReview(aula.id)}
                className="flex-1 min-h-[44px]"
              >
                <FileText className="h-4 w-4 mr-2" />
                Revisar
              </Button>
            )}

            {aula.status_processamento === 'ERRO' && (
              <Button
                variant="outline"
                size="default"
                onClick={() => onReprocess(aula.id)}
                className="flex-1 min-h-[44px]"
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Reprocessar
              </Button>
            )}

            {['CRIADA', 'ERRO'].includes(aula.status_processamento) && (
              <Button
                variant="destructive"
                size="default"
                onClick={() => onDelete(aula.id)}
                className="min-h-[44px] min-w-[44px]"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
