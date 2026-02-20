import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GradientCard } from '@/components/ui/gradient-card';
import { Button } from '@/components/ui/button';
import { IconEye, IconFileText, IconRefresh, IconTrash, IconSparkles, IconUpload } from '@tabler/icons-react';
import { StatusBadge } from './StatusBadge';
import { TipoBadge } from './TipoBadge';
import { formatDate } from '@/lib/utils';
import type { AulaListItem } from '@/api/aulas';
import { useIniciarProcessamento } from '@/hooks/useIniciarProcessamento';

interface AulasCardsDesktopProps {
  aulas: AulaListItem[];
  onViewDetails: (id: string) => void;
  onReview: (id: string) => void;
  onReprocess: (id: string) => void;
  onDelete: (id: string) => void;
  onStartAnalise: (id: string) => void;
}

export const AulasCardsDesktop = ({
  aulas,
  onViewDetails,
  onReview,
  onReprocess,
  onDelete,
  onStartAnalise,
}: AulasCardsDesktopProps) => {
  const navigate = useNavigate();
  const { mutate: iniciarProcessamento, isPending: isIniciarPending } = useIniciarProcessamento();

  return (
    <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {aulas.map((aula) => {
        const isApproved = aula.status_processamento === 'APROVADA';

        // Conditional rendering based on status
        if (isApproved) {
          // GradientCard for APROVADA status (highlight)
          return (
            <GradientCard
              key={aula.id}
              title={aula.turma_nome}
              description={formatDate(aula.data)}
              headerActions={<TipoBadge tipo={aula.tipo_entrada} />}
              className="hover:scale-[1.02] hover:shadow-lg hover:will-change-transform transition-all duration-200"
            >
              {/* Card body */}
              <div className="space-y-4">
                {/* Status badge */}
                <StatusBadge status={aula.status_processamento} />

                {/* Action buttons */}
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => onViewDetails(aula.id)}
                    className="w-full justify-start min-h-[44px] bg-white hover:bg-gray-50"
                    aria-label={`Visualizar detalhes da aula de ${aula.turma_nome} em ${formatDate(aula.data)}`}
                  >
                    <IconEye className="h-4 w-4 mr-2" />
                    Detalhes
                  </Button>

                  <Button
                    variant="default"
                    size="default"
                    onClick={() => onReview(aula.id)}
                    className="w-full justify-start min-h-[44px]"
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
          <Card
            key={aula.id}
            className="hover:scale-[1.02] hover:shadow-lg hover:will-change-transform transition-all duration-200"
          >
            <CardHeader>
              <CardTitle className="font-montserrat font-semibold text-deep-navy">
                {aula.turma_nome}
              </CardTitle>
              <CardDescription className="text-deep-navy/80">
                {formatDate(aula.data)}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Status & Type badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={aula.status_processamento} />
                <TipoBadge tipo={aula.tipo_entrada} />
              </div>

              {/* Story 16.2: Descrição (readonly, visível quando preenchida) */}
              {aula.descricao && (
                <p
                  className="text-sm text-deep-navy/70 italic line-clamp-2"
                  title={aula.descricao}
                >
                  {aula.descricao}
                </p>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-2">
              {/* Story 16.2: Enviar Áudio — apenas para RASCUNHO */}
              {/* Chama iniciarProcessamento (RASCUNHO→CRIADA) antes de navegar para upload */}
              {aula.status_processamento === 'RASCUNHO' && (
                <Button
                  variant="default"
                  size="default"
                  onClick={() =>
                    iniciarProcessamento({ aulaId: aula.id, data: { tipo_entrada: 'AUDIO' } })
                  }
                  disabled={isIniciarPending}
                  className="w-full justify-start min-h-[44px]"
                  aria-label={`Enviar áudio para a aula de ${aula.turma_nome}`}
                >
                  <IconUpload className="h-4 w-4 mr-2" />
                  {isIniciarPending ? 'Iniciando...' : 'Enviar Áudio'}
                </Button>
              )}

              {/* View Details - always available */}
              <Button
                variant="outline"
                size="default"
                onClick={() => onViewDetails(aula.id)}
                className="w-full justify-start min-h-[44px]"
                aria-label={`Visualizar detalhes da aula de ${aula.turma_nome} em ${formatDate(aula.data)}`}
              >
                <IconEye className="h-4 w-4 mr-2" />
                Detalhes
              </Button>

              {/* Start Analise - only for TRANSCRITA */}
              {aula.status_processamento === 'TRANSCRITA' && (
                <Button
                  variant="default"
                  size="default"
                  onClick={() => onStartAnalise(aula.id)}
                  className="w-full justify-start min-h-[44px]"
                  aria-label={`Iniciar análise da aula de ${aula.turma_nome}`}
                >
                  <IconSparkles className="h-4 w-4 mr-2" />
                  Analisar
                </Button>
              )}

              {/* Review - for ANALISADA */}
              {aula.status_processamento === 'ANALISADA' && (
                <Button
                  variant="default"
                  size="default"
                  onClick={() => onReview(aula.id)}
                  className="w-full justify-start min-h-[44px]"
                  aria-label={`Revisar aula de ${aula.turma_nome}`}
                >
                  <IconFileText className="h-4 w-4 mr-2" />
                  Revisar
                </Button>
              )}

              {/* Reprocess - only for ERRO */}
              {aula.status_processamento === 'ERRO' && (
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => onReprocess(aula.id)}
                  className="w-full justify-start min-h-[44px]"
                  aria-label={`Reprocessar aula de ${aula.turma_nome}`}
                >
                  <IconRefresh className="h-4 w-4 mr-2" />
                  Reprocessar
                </Button>
              )}

              {/* Delete - for RASCUNHO, CRIADA or ERRO */}
              {['RASCUNHO', 'CRIADA', 'ERRO'].includes(aula.status_processamento) && (
                <Button
                  variant="destructive"
                  size="default"
                  onClick={() => onDelete(aula.id)}
                  className="w-full justify-start min-h-[44px]"
                  aria-label={`Excluir aula de ${aula.turma_nome}`}
                >
                  <IconTrash className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};
