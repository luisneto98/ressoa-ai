import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { IconLoader2 } from '@tabler/icons-react';
import { turmaFormSchema, getTurmaFormDefaults, type TurmaFormData } from '@/lib/validation/turma.schema';
import {
  TipoEnsino,
  Turno,
  SERIE_LABELS,
  TURNO_LABELS,
  TIPO_ENSINO_LABELS,
  getSeriesByTipoEnsino,
} from '@/types/turma';
import type { Turma } from '@/types/turma';

/**
 * Form dialog for creating/editing turmas
 * Story 10.4 - AC#3, #4, #5, #6, #7, #8
 *
 * Features:
 * - Dynamic Serie selector based on tipo_ensino (AC#5)
 * - zod + React Hook Form validation (AC#4)
 * - Create and Edit modes (AC#6, #8)
 * - Error handling for backend validation (AC#7)
 * - Loading states (AC#6, #8)
 * - Accessible form with labels and error messages (AC#13)
 */

interface TurmaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  defaultValues?: Turma;
  onSubmit: (data: TurmaFormData) => Promise<void>;
  isLoading?: boolean;
}

// Disciplinas disponíveis (from BNCC)
const DISCIPLINAS = [
  { value: 'MATEMATICA', label: 'Matemática' },
  { value: 'LINGUA_PORTUGUESA', label: 'Língua Portuguesa' },
  { value: 'CIENCIAS', label: 'Ciências' },
  { value: 'HISTORIA', label: 'História' },
  { value: 'GEOGRAFIA', label: 'Geografia' },
  { value: 'ARTE', label: 'Arte' },
  { value: 'EDUCACAO_FISICA', label: 'Educação Física' },
  { value: 'INGLES', label: 'Inglês' },
];

export function TurmaFormDialog({
  open,
  onOpenChange,
  mode,
  defaultValues,
  onSubmit,
  isLoading = false,
}: TurmaFormDialogProps) {
  const form = useForm<TurmaFormData>({
    resolver: zodResolver(turmaFormSchema),
    defaultValues: getTurmaFormDefaults(defaultValues),
  });

  const tipoEnsino = form.watch('tipo_ensino');
  const serieAtual = form.watch('serie');

  // Reset form when dialog opens/closes or defaultValues change
  useEffect(() => {
    if (open) {
      form.reset(getTurmaFormDefaults(defaultValues));
    }
  }, [open, defaultValues, form]);

  // Reset serie when tipo_ensino changes (AC#5)
  useEffect(() => {
    const validSeries = getSeriesByTipoEnsino(tipoEnsino);

    // If current serie is not compatible with new tipo_ensino, reset it
    if (!validSeries.includes(serieAtual)) {
      form.setValue('serie', validSeries[0], { shouldValidate: true });
    }
  }, [tipoEnsino, serieAtual, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      // Handle 409 Conflict (duplicate nome) - show error below Nome field (AC#7)
      if (error?.response?.status === 409) {
        const message = error.response?.data?.message || 'Turma com esse nome já existe';
        form.setError('nome', {
          type: 'manual',
          message: Array.isArray(message) ? message[0] : message,
        });
      }
      // Other errors are handled by the hook via toast
      // Keep dialog open so user can fix validation errors
    }
  });

  const validSeries = getSeriesByTipoEnsino(tipoEnsino);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-deep-navy text-2xl font-semibold">
            {mode === 'create' ? 'Nova Turma' : 'Editar Turma'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {mode === 'create'
              ? 'Preencha os dados abaixo para criar uma nova turma'
              : 'Atualize os dados da turma'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Nome */}
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="nome">Nome da Turma *</FormLabel>
                    <FormControl>
                      <Input
                        id="nome"
                        placeholder="Ex: 6º Ano A"
                        aria-invalid={!!form.formState.errors.nome}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage aria-live="polite" />
                  </FormItem>
                )}
              />

              {/* Tipo Ensino */}
              <FormField
                control={form.control}
                name="tipo_ensino"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="tipo_ensino">Tipo de Ensino *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger id="tipo_ensino" aria-invalid={!!form.formState.errors.tipo_ensino}>
                          <SelectValue placeholder="Selecione o tipo de ensino" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(TipoEnsino).map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {TIPO_ENSINO_LABELS[tipo]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage aria-live="polite" />
                  </FormItem>
                )}
              />

              {/* Série (dinâmica baseada em tipo_ensino) */}
              <FormField
                control={form.control}
                name="serie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="serie">Série *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger id="serie" aria-invalid={!!form.formState.errors.serie}>
                          <SelectValue placeholder="Selecione a série" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {validSeries.map((serie) => (
                          <SelectItem key={serie} value={serie}>
                            {SERIE_LABELS[serie]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage aria-live="polite" />
                  </FormItem>
                )}
              />

              {/* Disciplina */}
              <FormField
                control={form.control}
                name="disciplina"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="disciplina">Disciplina *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger id="disciplina" aria-invalid={!!form.formState.errors.disciplina}>
                          <SelectValue placeholder="Selecione a disciplina" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DISCIPLINAS.map((disc) => (
                          <SelectItem key={disc.value} value={disc.value}>
                            {disc.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage aria-live="polite" />
                  </FormItem>
                )}
              />

              {/* Grid: Ano Letivo + Turno */}
              <div className="grid grid-cols-2 gap-4">
                {/* Ano Letivo */}
                <FormField
                  control={form.control}
                  name="ano_letivo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="ano_letivo">Ano Letivo *</FormLabel>
                      <FormControl>
                        <Input
                          id="ano_letivo"
                          type="number"
                          min={2020}
                          max={2030}
                          placeholder="2026"
                          aria-invalid={!!form.formState.errors.ano_letivo}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                        />
                      </FormControl>
                      <FormMessage aria-live="polite" />
                    </FormItem>
                  )}
                />

                {/* Turno */}
                <FormField
                  control={form.control}
                  name="turno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="turno">Turno *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger id="turno" aria-invalid={!!form.formState.errors.turno}>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(Turno).map((turno) => (
                            <SelectItem key={turno} value={turno}>
                              {TURNO_LABELS[turno]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage aria-live="polite" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Quantidade de Alunos (opcional) */}
              <FormField
                control={form.control}
                name="quantidade_alunos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="quantidade_alunos">Quantidade de Alunos (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        id="quantidade_alunos"
                        type="number"
                        min={1}
                        max={50}
                        placeholder="30"
                        aria-invalid={!!form.formState.errors.quantidade_alunos}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? null : parseInt(value, 10));
                        }}
                      />
                    </FormControl>
                    <FormMessage aria-live="polite" />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-focus-orange hover:bg-focus-orange/90 text-white"
              >
                {isLoading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
