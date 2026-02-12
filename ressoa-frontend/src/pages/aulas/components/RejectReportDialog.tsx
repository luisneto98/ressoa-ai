import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface RejectReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (motivo: string) => void;
  isPending: boolean;
}

export function RejectReportDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: RejectReportDialogProps) {
  const [motivo, setMotivo] = useState('');
  const isValid = motivo.length >= 10;

  // ✅ MEDIUM FIX #3: Reset motivo when dialog closes
  useEffect(() => {
    if (!open) {
      setMotivo('');
    }
  }, [open]);

  const handleConfirm = () => {
    if (isValid) {
      onConfirm(motivo);
      setMotivo(''); // Reset after confirm
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rejeitar Relatório</DialogTitle>
          <DialogDescription>
            Por favor, descreva o motivo da rejeição para nos ajudar a melhorar a qualidade dos relatórios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="motivo">Motivo da Rejeição</Label>
          <Textarea
            id="motivo"
            placeholder="Ex: Relatório muito genérico, faltou detalhar habilidades BNCC trabalhadas..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={5}
            className="resize-none"
          />
          <p className="text-xs text-gray-500">
            Mínimo 10 caracteres ({motivo.length}/10)
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || isPending}
          >
            {isPending ? 'Rejeitando...' : 'Confirmar Rejeição'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
