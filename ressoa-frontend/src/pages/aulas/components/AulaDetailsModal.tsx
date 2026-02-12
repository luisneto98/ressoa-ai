import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from './StatusBadge';
import { TipoBadge } from './TipoBadge';
import { formatDate, formatDateTime, formatFileSize } from '@/lib/utils';
import type { AulaListItem } from '@/api/aulas';

interface AulaDetailsModalProps {
  aula: AulaListItem | null;
  open: boolean;
  onClose: () => void;
}

export const AulaDetailsModal = ({ aula, open, onClose }: AulaDetailsModalProps) => {
  if (!aula) return null;

  const showErrorMessage = aula.status_processamento === 'ERRO' && (aula.error_message || '').trim();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Aula</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Turma</p>
              <p className="text-base">{aula.turma_nome}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Data da Aula</p>
              <p className="text-base">{formatDate(aula.data)}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Tipo de Entrada</p>
              <TipoBadge tipo={aula.tipo_entrada} />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <StatusBadge status={aula.status_processamento} />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Criado em</p>
              <p className="text-sm text-gray-700">{formatDateTime(aula.created_at)}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Atualizado em</p>
              <p className="text-sm text-gray-700">{formatDateTime(aula.updated_at)}</p>
            </div>

            {aula.tipo_entrada === 'AUDIO' && aula.arquivo_tamanho && (
              <div>
                <p className="text-sm font-medium text-gray-500">Tamanho do Arquivo</p>
                <p className="text-sm text-gray-700">{formatFileSize(aula.arquivo_tamanho)}</p>
              </div>
            )}

            {showErrorMessage && (
              <div className="col-span-2">
                <p className="text-sm font-medium text-red-600">Mensagem de Erro</p>
                <p className="text-sm text-red-700 bg-red-50 p-3 rounded">
                  {aula.error_message || 'Erro desconhecido no processamento'}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
