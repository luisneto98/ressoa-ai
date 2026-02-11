import { usePlanejamentoWizard } from '../hooks/usePlanejamentoWizard';
import { useCreatePlanejamento } from '../hooks/useCreatePlanejamento';
import { useUpdatePlanejamento } from '../hooks/useUpdatePlanejamento';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiClient } from '../../../api/axios';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';

interface Step3RevisaoProps {
  mode?: 'create' | 'edit';
  planejamentoId?: string;
}

export const Step3Revisao = ({ mode = 'create', planejamentoId }: Step3RevisaoProps) => {
  const { formData, selectedHabilidades, prevStep, reset } =
    usePlanejamentoWizard();
  const createMutation = useCreatePlanejamento();
  const updateMutation = useUpdatePlanejamento();
  const navigate = useNavigate();

  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [existingPlanejamentoId, setExistingPlanejamentoId] = useState<
    string | null
  >(null);

  // Check for duplicate on mount (only in create mode)
  useEffect(() => {
    if (mode === 'edit') return; // Skip duplicate check in edit mode

    const checkDuplicate = async () => {
      try {
        const { data } = await apiClient.get('/planejamentos', {
          params: {
            turma_id: formData.turma_id,
            bimestre: formData.bimestre,
            ano_letivo: formData.ano_letivo,
          },
        });

        if (Array.isArray(data) && data.length > 0) {
          setExistingPlanejamentoId(data[0].id);
          setShowDuplicateAlert(true);
        }
      } catch (error) {
        // Log error but don't block user (duplicate check is a UX enhancement, not critical)
        if (import.meta.env.MODE === 'development') {
          console.error('Error checking duplicate:', error);
        }
      }
    };

    void checkDuplicate();
  }, [formData, mode]);

  const handleSubmit = async () => {
    try {
      const payload = {
        turma_id: formData.turma_id,
        bimestre: formData.bimestre,
        ano_letivo: formData.ano_letivo,
        habilidades: selectedHabilidades.map((h) => ({
          habilidade_id: h.id,
        })),
      };

      if (mode === 'edit' && planejamentoId) {
        // Update existing planejamento
        await updateMutation.mutateAsync({ id: planejamentoId, payload });
        toast.success('Planejamento atualizado com sucesso!');
      } else {
        // Create new planejamento
        await createMutation.mutateAsync(payload);
        toast.success('Planejamento criado com sucesso!');
      }

      reset();
      navigate('/planejamentos');
    } catch (error) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 400) {
        toast.error('Já existe planejamento para esta turma neste bimestre');
      } else {
        toast.error('Erro ao salvar planejamento. Tente novamente.');
      }
    }
  };

  const isLoading = mode === 'edit' ? updateMutation.isPending : createMutation.isPending;

  const pesoAutomatico = (1 / selectedHabilidades.length) * 100;
  const aulasEstimadas = Math.round(40 / selectedHabilidades.length);

  return (
    <>
      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="mb-6 text-xl font-semibold text-deep-navy">
            Revisão do Planejamento
          </h2>

          {/* Summary */}
          <div className="mb-6 space-y-2 rounded-lg bg-gray-50 p-4">
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <span className="font-medium">Turma:</span>{' '}
                {formData.turma?.nome} - {formData.turma?.disciplina} -{' '}
                {formData.turma?.serie}
              </div>
              <div>
                <span className="font-medium">Bimestre:</span>{' '}
                <Badge>{formData.bimestre}º Bimestre</Badge>
              </div>
              <div>
                <span className="font-medium">Ano Letivo:</span>{' '}
                {formData.ano_letivo}
              </div>
              <div>
                <span className="font-medium">Habilidades Selecionadas:</span>{' '}
                {selectedHabilidades.length}
              </div>
            </div>
          </div>

          {/* Habilidades List */}
          <div>
            <h3 className="mb-4 font-semibold">
              Habilidades ({selectedHabilidades.length})
            </h3>
            <div className="max-h-[400px] space-y-3 overflow-auto">
              {selectedHabilidades.map((hab) => (
                <div
                  key={hab.id}
                  className="rounded-lg border bg-white p-4 shadow-sm"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <span className="font-bold text-deep-navy">
                      {hab.codigo}
                    </span>
                    <div className="text-right text-sm text-gray-600">
                      <div>Peso: {pesoAutomatico.toFixed(1)}%</div>
                      <div>~{aulasEstimadas} aulas</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{hab.descricao}</p>
                  {hab.unidade_tematica && (
                    <Badge variant="secondary" className="mt-2">
                      {hab.unidade_tematica}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            * Os pesos e aulas previstas são calculados automaticamente pelo
            sistema (1/N para cada habilidade)
          </p>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={isLoading}
            aria-label="Voltar para seleção de habilidades"
          >
            Voltar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-focus-orange hover:bg-focus-orange/90"
            aria-label="Salvar planejamento"
          >
            {isLoading ? 'Salvando...' : mode === 'edit' ? 'Atualizar Planejamento' : 'Salvar Planejamento'}
          </Button>
        </div>
      </div>

      {/* Duplicate Alert Dialog */}
      <AlertDialog
        open={showDuplicateAlert}
        onOpenChange={setShowDuplicateAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Planejamento já existe</AlertDialogTitle>
            <AlertDialogDescription>
              Já existe um planejamento para esta turma neste bimestre. Deseja
              editar o existente ou cancelar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => navigate('/planejamentos')}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                navigate(`/planejamentos/${existingPlanejamentoId}/editar`)
              }
            >
              Editar Existente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
