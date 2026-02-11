import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import type { Planejamento } from '../hooks/usePlanejamentos';
import { useCreatePlanejamento } from '../hooks/useCreatePlanejamento';

interface CopyPlanejamentoDialogProps {
  planejamento: Planejamento;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CopyPlanejamentoDialog = ({
  planejamento,
  open,
  onOpenChange,
}: CopyPlanejamentoDialogProps) => {
  const currentYear = new Date().getFullYear();
  const [bimestreDestino, setBimestreDestino] = useState<number>(1);
  const [anoLetivoDestino, setAnoLetivoDestino] = useState(currentYear);
  const [manterHabilidades, setManterHabilidades] = useState(true);

  const createMutation = useCreatePlanejamento();

  // Bimestres disponíveis (excluindo o atual)
  const bimestresDisponiveis = [1, 2, 3, 4].filter((b) => b !== planejamento.bimestre);

  const handleCopy = async () => {
    try {
      const payload = {
        turma_id: planejamento.turma_id,
        bimestre: bimestreDestino,
        ano_letivo: anoLetivoDestino,
        habilidades: manterHabilidades
          ? planejamento.habilidades.map((h) => ({
              habilidade_id: h.habilidade_id,
              peso: h.peso,
              aulas_previstas: h.aulas_previstas,
            }))
          : [],
      };

      await createMutation.mutateAsync(payload);
      toast.success('Planejamento copiado com sucesso!');
      onOpenChange(false);

      // Reset state
      setBimestreDestino(bimestresDisponiveis[0] || 1);
      setAnoLetivoDestino(currentYear);
      setManterHabilidades(true);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao copiar planejamento';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Copiar Planejamento</DialogTitle>
          <DialogDescription>
            Copiar planejamento de {planejamento.turma.nome} - Bimestre {planejamento.bimestre}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Bimestre Destino */}
          <div>
            <Label>Bimestre Destino</Label>
            <Select
              value={String(bimestreDestino)}
              onValueChange={(v) => setBimestreDestino(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {bimestresDisponiveis.map((b) => (
                  <SelectItem key={b} value={String(b)}>
                    Bimestre {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ano Letivo Destino */}
          <div>
            <Label>Ano Letivo Destino</Label>
            <Input
              type="number"
              value={anoLetivoDestino}
              onChange={(e) => setAnoLetivoDestino(Number(e.target.value))}
              min={2024}
              max={2030}
            />
          </div>

          {/* Manter Habilidades */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="manter-habilidades"
              checked={manterHabilidades}
              onCheckedChange={(checked) => setManterHabilidades(Boolean(checked))}
            />
            <Label htmlFor="manter-habilidades" className="cursor-pointer">
              Manter mesmas habilidades ({planejamento.habilidades.length} selecionadas)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleCopy}
            disabled={createMutation.isPending}
            className="bg-tech-blue hover:bg-tech-blue/90"
          >
            {createMutation.isPending ? 'Copiando...' : 'Copiar Planejamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
