import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GradientCard } from '@/components/ui/gradient-card';
import { Button } from '@/components/ui/button';
import { IconEye, IconFileText, IconRefresh, IconTrash, IconSparkles, IconUpload } from '@tabler/icons-react';
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
  const navigate = useNavigate();

  return (
    <div className="block md:hidden space-y-4">
      {aulas.map((aula) => {
        const isApproved = aula.status_processamento === 'APROVADA';

        // GradientCard for APROVADA status (highlight)
        if (isApproved) {
          return (
            <GradientCard
              key={aula.id}
              title={aula.turma_nome}
              description={formatDate(aula.data)}
              headerActions={<TipoBadge tipo={aula.tipo_entrada} />}
            >
              <div className="space-y-4">
                {/* Status badge */}
                <StatusBadge status={aula.status_processamento} />

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => onViewDetails(aula.id)}
                    className="flex-1 min-h-[44px] bg-white hover:bg-gray-50"
                    aria-label={`Visualizar detalhes da aula de ${aula.turma_nome}`}
                  >
                    <IconEye className="h-4 w-4 mr-2" />
                    Detalhes
                  </Button>

                  <Button
                    variant="default"
                    size="default"
                    onClick={() => onReview(aula.id)}
                    className="flex-1 min-h-[44px]"
                    aria-label={`Revisar aula de ${aula.turma_nome}`}
                  >
                    <IconFileText className="h-4 w-4 mr-2" />
                    Revisar
                  </Button>
                </div>
              </div>
            </GradientCard>
          );
        }

        // Standard Card for all other statuses
        return (
          <Card key={aula.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="font-montserrat font-semibold text-deep-navy text-lg">
                    {aula.turma_nome}
                  </CardTitle>
                  <CardDescription className="text-deep-navy/80 text-sm mt-1">
                    {formatDate(aula.data)}
                  </CardDescription>
                </div>
                <TipoBadge tipo={aula.tipo_entrada} />
              </div>
            </CardHeader>

            <CardContent className="pb-3">
              <StatusBadge status={aula.status_processamento} />
            </CardContent>

            <CardFooter className="flex flex-wrap gap-2">
              {/* Enviar Áudio — para CRIADA com tipo AUDIO */}
              {aula.status_processamento === 'CRIADA' && aula.tipo_entrada === 'AUDIO' && (
                <Button
                  variant="default"
                  size="default"
                  onClick={() => navigate('/aulas/upload', {
                    state: { aulaId: aula.id, turma_id: aula.turma_id, data: aula.data, turma_nome: aula.turma_nome },
                  })}
                  className="flex-1 min-h-[44px]"
                  aria-label={`Enviar áudio para a aula de ${aula.turma_nome}`}
                >
                  <IconUpload className="h-4 w-4 mr-2" />
                  Enviar Áudio
                </Button>
              )}

              <Button
                variant="outline"
                size="default"
                onClick={() => onViewDetails(aula.id)}
                className="flex-1 min-h-[44px]"
                aria-label={`Visualizar detalhes da aula de ${aula.turma_nome}`}
              >
                <IconEye className="h-4 w-4 mr-2" />
                Detalhes
              </Button>

              {aula.status_processamento === 'TRANSCRITA' && (
                <Button
                  variant="default"
                  size="default"
                  onClick={() => onStartAnalise(aula.id)}
                  className="flex-1 min-h-[44px]"
                  aria-label={`Iniciar análise da aula de ${aula.turma_nome}`}
                >
                  <IconSparkles className="h-4 w-4 mr-2" />
                  Analisar
                </Button>
              )}

              {aula.status_processamento === 'ANALISADA' && (
                <Button
                  variant="default"
                  size="default"
                  onClick={() => onReview(aula.id)}
                  className="flex-1 min-h-[44px]"
                  aria-label={`Revisar aula de ${aula.turma_nome}`}
                >
                  <IconFileText className="h-4 w-4 mr-2" />
                  Revisar
                </Button>
              )}

              {aula.status_processamento === 'ERRO' && (
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => onReprocess(aula.id)}
                  className="flex-1 min-h-[44px]"
                  aria-label={`Reprocessar aula de ${aula.turma_nome}`}
                >
                  <IconRefresh className="h-4 w-4 mr-2" />
                  Reprocessar
                </Button>
              )}

              {['CRIADA', 'ERRO'].includes(aula.status_processamento) && (
                <Button
                  variant="destructive"
                  size="default"
                  onClick={() => onDelete(aula.id)}
                  className="min-h-[44px] min-w-[44px]"
                  aria-label={`Excluir aula de ${aula.turma_nome}`}
                >
                  <IconTrash className="h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};
