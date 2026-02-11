import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTurmas } from '../hooks/useTurmas';
import { usePlanejamentoWizard } from '../hooks/usePlanejamentoWizard';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';

const step1Schema = z.object({
  turma_id: z.string().min(1, 'Selecione uma turma'),
  bimestre: z.number().int().min(1).max(4),
  ano_letivo: z.number().int().min(2024),
});

type Step1FormData = z.infer<typeof step1Schema>;

export const Step1DadosGerais = () => {
  const { data: turmas, isLoading } = useTurmas();
  const { formData, setFormData, nextStep } = usePlanejamentoWizard();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      turma_id: formData.turma_id || '',
      bimestre: formData.bimestre || 1,
      ano_letivo: formData.ano_letivo || new Date().getFullYear(),
    },
  });

  const turmaId = watch('turma_id');

  const onSubmit = (data: Step1FormData) => {
    const selectedTurma = turmas?.find((t) => t.id === data.turma_id);
    setFormData({
      ...data,
      turma: selectedTurma,
    });
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-deep-navy">
          Dados Gerais
        </h2>

        {/* Turma Select */}
        <div className="mb-4">
          <Label htmlFor="turma-select" className="mb-2 block">
            Turma *
          </Label>
          <Select
            value={turmaId}
            onValueChange={(value) => setValue('turma_id', value)}
            disabled={isLoading}
          >
            <SelectTrigger
              id="turma-select"
              className={errors.turma_id ? 'border-red-500' : ''}
              aria-required="true"
              aria-invalid={!!errors.turma_id}
            >
              <SelectValue placeholder="Selecione uma turma" />
            </SelectTrigger>
            <SelectContent>
              {turmas?.map((turma) => (
                <SelectItem key={turma.id} value={turma.id}>
                  {turma.nome} - {turma.disciplina} - {turma.serie}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.turma_id && (
            <span className="mt-1 text-sm text-red-500" role="alert">
              {errors.turma_id.message}
            </span>
          )}
        </div>

        {/* Bimestre Radio Group */}
        <div className="mb-4">
          <Label className="mb-2 block">Bimestre *</Label>
          <RadioGroup
            value={watch('bimestre').toString()}
            onValueChange={(value) => setValue('bimestre', parseInt(value))}
            className="flex gap-4"
          >
            {[1, 2, 3, 4].map((bim) => (
              <div key={bim} className="flex items-center space-x-2">
                <RadioGroupItem value={bim.toString()} id={`bim-${bim}`} />
                <Label htmlFor={`bim-${bim}`} className="cursor-pointer">
                  {bim}º Bimestre
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Ano Letivo Input */}
        <div className="mb-4">
          <Label htmlFor="ano-letivo" className="mb-2 block">
            Ano Letivo *
          </Label>
          <Input
            id="ano-letivo"
            type="number"
            min={2024}
            max={new Date().getFullYear() + 1}
            {...register('ano_letivo', { valueAsNumber: true })}
            className={errors.ano_letivo ? 'border-red-500' : ''}
            aria-required="true"
            aria-invalid={!!errors.ano_letivo}
          />
          {errors.ano_letivo && (
            <span className="mt-1 text-sm text-red-500" role="alert">
              {errors.ano_letivo.message}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Button
          type="submit"
          className="bg-tech-blue hover:bg-tech-blue/90"
          aria-label="Avançar para seleção de habilidades"
        >
          Próximo
        </Button>
      </div>
    </form>
  );
};
