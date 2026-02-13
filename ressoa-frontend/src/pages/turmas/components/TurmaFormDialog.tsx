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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { IconLoader2, IconAlertCircle, IconSchool, IconCertificate } from '@tabler/icons-react';
import { turmaFormSchema, getTurmaFormDefaults, type TurmaFormData } from '@/lib/validation/turma.schema';
import {
  TipoEnsino,
  Turno,
  CurriculoTipo,
  SERIE_LABELS,
  TURNO_LABELS,
  TIPO_ENSINO_LABELS,
  CURRICULO_TIPO_LABELS,
  CURRICULO_TIPO_DESCRIPTIONS,
  getSeriesByTipoEnsino,
} from '@/types/turma';
import type { Turma } from '@/types/turma';
import { useProfessores } from '@/hooks/useTurmas';
import { cn } from '@/lib/utils';

/**
 * Form dialog for creating/editing turmas
 * Story 10.4 - AC#3, #4, #5, #6, #7, #8
 * Story 11.5 - Contexto Pedagógico para Cursos Customizados
 *
 * Features:
 * - Dynamic Serie selector based on tipo_ensino (AC#5)
 * - Radio Group: BNCC vs Curso Customizado (AC#1)
 * - Conditional rendering of contexto_pedagogico fields (AC#2)
 * - Zod + React Hook Form validation with refine (AC#3, #4)
 * - Create and Edit modes (AC#6, #8)
 * - Error handling for backend validation (AC#7)
 * - Loading states (AC#6, #8)
 * - Accessible form with labels and error messages (AC#8, #13)
 * - Character counters for textareas (AC#2)
 * - Tooltips with examples (AC#2, #10)
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
  const { data: professores = [], isLoading: professoresLoading } = useProfessores();

  const form = useForm<TurmaFormData>({
    resolver: zodResolver(turmaFormSchema),
    defaultValues: getTurmaFormDefaults(defaultValues),
  });

  // Watch curriculo_tipo para mostrar/esconder contexto (AC#1, #2)
  // Conditional rendering: contexto pedagógico só aparece se curriculo_tipo = CUSTOM
  const curriculoTipo = form.watch('curriculo_tipo');
  const tipoEnsino = form.watch('tipo_ensino');
  const serieAtual = form.watch('serie');

  // Watch contexto pedagogico fields para character counters (AC#2)
  // Validação min/max: objetivo_geral (100-500), publico_alvo (20-200), metodologia (20-300), carga_horaria (8-1000)
  const objetivoGeral = (form.watch('contexto_pedagogico.objetivo_geral' as any) as string) || '';
  const publicoAlvo = (form.watch('contexto_pedagogico.publico_alvo' as any) as string) || '';
  const metodologia = (form.watch('contexto_pedagogico.metodologia' as any) as string) || '';
  const cargaHoraria = form.watch('contexto_pedagogico.carga_horaria_total' as any) as number;

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
              {/* Radio Group: Tipo de Currículo (BNCC vs Customizado) - AC#1 */}
              <FormField
                control={form.control}
                name="curriculo_tipo"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-heading text-deep-navy">Tipo de Currículo *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-col space-y-2"
                        aria-labelledby="curriculo_tipo_label"
                      >
                        {/* BNCC Option */}
                        <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <RadioGroupItem value={CurriculoTipo.BNCC} id="curriculo_bncc" className="mt-1" />
                          <div className="flex-1">
                            <label
                              htmlFor="curriculo_bncc"
                              className="flex items-center gap-2 font-medium text-deep-navy cursor-pointer"
                            >
                              <IconSchool className="h-4 w-4 text-tech-blue" aria-hidden="true" />
                              {CURRICULO_TIPO_LABELS.BNCC}
                            </label>
                            <p className="text-sm text-gray-600 mt-1">{CURRICULO_TIPO_DESCRIPTIONS.BNCC}</p>
                          </div>
                        </div>

                        {/* CUSTOM Option */}
                        <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <RadioGroupItem value={CurriculoTipo.CUSTOM} id="curriculo_custom" className="mt-1" />
                          <div className="flex-1">
                            <label
                              htmlFor="curriculo_custom"
                              className="flex items-center gap-2 font-medium text-deep-navy cursor-pointer"
                            >
                              <IconCertificate className="h-4 w-4 text-cyan-ai" aria-hidden="true" />
                              {CURRICULO_TIPO_LABELS.CUSTOM}
                            </label>
                            <p className="text-sm text-gray-600 mt-1">{CURRICULO_TIPO_DESCRIPTIONS.CUSTOM}</p>
                          </div>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage aria-live="polite" />
                  </FormItem>
                )}
              />

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

              {/* Professor */}
              <FormField
                control={form.control}
                name="professor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="professor_id">Professor Responsável *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger id="professor_id" aria-invalid={!!form.formState.errors.professor_id}>
                          <SelectValue placeholder={professoresLoading ? 'Carregando...' : 'Selecione o professor'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {professores.map((prof) => (
                          <SelectItem key={prof.id} value={prof.id}>
                            {prof.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage aria-live="polite" />
                  </FormItem>
                )}
              />

              {/* Contexto Pedagógico (condicional - só aparece se curriculo_tipo = CUSTOM) - AC#2 */}
              {curriculoTipo === CurriculoTipo.CUSTOM && (
                <div className="space-y-4 p-4 border-2 border-cyan-ai/20 rounded-lg bg-cyan-ai/5">
                  <h3 className="text-lg font-heading text-deep-navy font-semibold">Contexto Pedagógico</h3>
                  <p className="text-sm text-gray-600">
                    Preencha as informações abaixo para que a IA gere análises pedagógicas relevantes para este curso
                    customizado.
                  </p>

                  {/* Objetivo Geral */}
                  {/* @ts-expect-error: React Hook Form nested field type inference limitation */}
                  <FormField
                    control={form.control}
                    name={'contexto_pedagogico.objetivo_geral' as any}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel htmlFor="objetivo_geral">Objetivo Geral do Curso *</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <IconAlertCircle
                                  className="h-4 w-4 text-focus-orange cursor-help"
                                  aria-label="Informações sobre objetivo geral"
                                />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>Descreva o propósito do curso de forma clara. Isso ajuda a IA a gerar relatórios relevantes.</p>
                                <p className="mt-2 text-xs italic">
                                  Exemplo: "Preparar alunos para ENEM 2026 com foco em redação nota 1000"
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormControl>
                          <Textarea
                            id="objetivo_geral"
                            placeholder="Ex: Preparar candidatos para prova da Polícia Militar de São Paulo 2026"
                            rows={4}
                            aria-invalid={!!form.formState.errors.contexto_pedagogico?.objetivo_geral}
                            {...field}
                          />
                        </FormControl>
                        <div className="flex items-center justify-between">
                          <FormMessage aria-live="polite" />
                          <p
                            className={cn(
                              'text-sm text-gray-500',
                              objetivoGeral.length > 500 && 'text-red-600 font-medium'
                            )}
                          >
                            {objetivoGeral.length}/500 caracteres
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Público-Alvo */}
                  {/* @ts-expect-error: React Hook Form nested field type inference limitation */}
                  <FormField
                    control={form.control}
                    name={'contexto_pedagogico.publico_alvo' as any}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="publico_alvo">Público-Alvo *</FormLabel>
                        <FormControl>
                          <Input
                            id="publico_alvo"
                            placeholder="Ex: Jovens 18-25 anos, Ensino Médio completo"
                            aria-invalid={!!form.formState.errors.contexto_pedagogico?.publico_alvo}
                            {...field}
                          />
                        </FormControl>
                        <div className="flex items-center justify-between">
                          <FormMessage aria-live="polite" />
                          <p
                            className={cn(
                              'text-sm text-gray-500',
                              publicoAlvo.length > 200 && 'text-red-600 font-medium'
                            )}
                          >
                            {publicoAlvo.length}/200 caracteres
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Metodologia */}
                  {/* @ts-expect-error: React Hook Form nested field type inference limitation */}
                  <FormField
                    control={form.control}
                    name={'contexto_pedagogico.metodologia' as any}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel htmlFor="metodologia">Metodologia de Ensino *</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <IconAlertCircle
                                  className="h-4 w-4 text-focus-orange cursor-help"
                                  aria-label="Informações sobre metodologia"
                                />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>Descreva como o curso será ministrado.</p>
                                <p className="mt-2 text-xs italic">
                                  Exemplo: "Simulados semanais + revisão teórica focada em questões"
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormControl>
                          <Textarea
                            id="metodologia"
                            placeholder="Ex: Simulados semanais + revisão teórica focada em questões"
                            rows={3}
                            aria-invalid={!!form.formState.errors.contexto_pedagogico?.metodologia}
                            {...field}
                          />
                        </FormControl>
                        <div className="flex items-center justify-between">
                          <FormMessage aria-live="polite" />
                          <p
                            className={cn(
                              'text-sm text-gray-500',
                              metodologia.length > 300 && 'text-red-600 font-medium'
                            )}
                          >
                            {metodologia.length}/300 caracteres
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Carga Horária Total */}
                  <FormField
                    control={form.control}
                    name={'contexto_pedagogico.carga_horaria_total' as any}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="carga_horaria">Carga Horária Total (horas) *</FormLabel>
                        <FormControl>
                          <Input
                            id="carga_horaria"
                            type="number"
                            min={8}
                            max={1000}
                            placeholder="120"
                            aria-invalid={!!form.formState.errors.contexto_pedagogico?.carga_horaria_total}
                            {...field}
                            value={field.value ?? 40}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : 40)}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500">min: 8h, max: 1000h</FormDescription>
                        <FormMessage aria-live="polite" />
                      </FormItem>
                    )}
                  />
                </div>
              )}

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
