import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { fetchProfessorTurmas, fetchTurmaPlanejamentos } from '@/api/aulas';
import { useCreateRascunho } from '@/hooks/useCreateRascunho';

const rascunhoSchema = z.object({
  turma_id: z.string().uuid('Selecione uma turma válida'),
  data: z.string().min(1, 'Data é obrigatória'), // Aceita datas futuras — sem validação @IsNotFutureDate (DT-3)
  planejamento_id: z.string().uuid().optional().or(z.literal('')),
  descricao: z.string().max(2000, 'Máximo 2000 caracteres').optional().or(z.literal('')),
});

type RascunhoFormData = z.infer<typeof rascunhoSchema>;

interface RascunhoAulaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RascunhoAulaDialog({ open, onOpenChange }: RascunhoAulaDialogProps) {
  const { mutate: createRascunho, isPending } = useCreateRascunho();

  const form = useForm<RascunhoFormData>({
    resolver: zodResolver(rascunhoSchema),
    defaultValues: {
      turma_id: '',
      data: '',
      planejamento_id: '',
      descricao: '',
    },
  });

  const turmaId = form.watch('turma_id');
  const descricao = form.watch('descricao') ?? '';

  const { data: turmas, isLoading: isLoadingTurmas } = useQuery({
    queryKey: ['turmas'],
    queryFn: fetchProfessorTurmas,
  });

  const { data: planejamentos, isLoading: isLoadingPlanejamentos } = useQuery({
    queryKey: ['planejamentos', turmaId],
    queryFn: () => fetchTurmaPlanejamentos(turmaId),
    enabled: !!turmaId,
  });

  // Reset planejamento when turma changes
  useEffect(() => {
    if (turmaId) {
      form.setValue('planejamento_id', '');
    }
  }, [turmaId, form]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const handleSubmit = (data: RascunhoFormData) => {
    createRascunho(
      {
        turma_id: data.turma_id,
        data: data.data,
        planejamento_id: data.planejamento_id || undefined,
        descricao: data.descricao || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Planejar Aula</DialogTitle>
          <DialogDescription>
            Crie um rascunho de aula com data futura. Você poderá enviar o áudio ou texto quando a aula acontecer.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Turma */}
            <FormField
              control={form.control}
              name="turma_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Turma *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingTurmas}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue
                          placeholder={isLoadingTurmas ? 'Carregando...' : 'Selecione a turma'}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {turmas?.map((turma) => (
                        <SelectItem key={turma.id} value={turma.id}>
                          {turma.nome} - {turma.ano}º ano ({turma.disciplina})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data — permite datas futuras (DT-3) */}
            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data da Aula *</FormLabel>
                  <FormControl>
                    {/* SEM max={today} — datas futuras permitidas para rascunhos */}
                    <Input type="date" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Planejamento (opcional) */}
            <FormField
              control={form.control}
              name="planejamento_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Planejamento (opcional)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === '__none__' ? '' : value)}
                    value={field.value || '__none__'}
                    disabled={!turmaId || isLoadingPlanejamentos}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue
                          placeholder={
                            !turmaId
                              ? 'Selecione uma turma primeiro'
                              : isLoadingPlanejamentos
                              ? 'Carregando...'
                              : 'Selecione um planejamento'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum planejamento</SelectItem>
                      {planejamentos?.map((planejamento) => (
                        <SelectItem key={planejamento.id} value={planejamento.id}>
                          {planejamento.bimestre}º Bimestre {planejamento.ano_letivo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição (opcional) — readonly após RASCUNHO (DT-4 — enforced by AC #12) */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objetivo da Aula (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Revisar frações decimais e resolver exercícios do livro..."
                      rows={4}
                      maxLength={2000}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground text-right">
                    {descricao.length}/2000
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvando...' : 'Planejar Aula'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
