import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { AulaFormFields, commonFormSchema } from './AulaFormFields';
import { uploadTranscricao } from '@/api/aulas';

// Form schema for transcription tab
const transcriptionSchema = commonFormSchema.extend({
  transcricao_texto: z
    .string()
    .min(100, 'Mínimo 100 caracteres')
    .max(50000, 'Máximo 50.000 caracteres'),
});

type TranscriptionFormData = z.infer<typeof transcriptionSchema>;

export function UploadTranscriptionTab() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TranscriptionFormData>({
    resolver: zodResolver(transcriptionSchema),
    defaultValues: {
      turma_id: '',
      data: '',
      planejamento_id: '',
      transcricao_texto: '',
    },
  });

  const transcricaoTexto = form.watch('transcricao_texto');
  const charCount = transcricaoTexto?.length || 0;

  // Determine counter color based on validation
  const getCounterColor = () => {
    if (charCount < 100) return 'text-yellow-600';
    if (charCount > 50000) return 'text-red-600';
    return 'text-green-600';
  };

  const handleSubmit = async (data: TranscriptionFormData) => {
    try {
      setIsSubmitting(true);

      await uploadTranscricao({
        turma_id: data.turma_id,
        data: data.data,
        planejamento_id: data.planejamento_id || undefined,
        transcricao_texto: data.transcricao_texto,
      });

      toast.success('Transcrição salva! Análise em andamento...');
      navigate('/minhas-aulas');
    } catch (error) {
      console.error('Error uploading transcription:', error);
      toast.error('Erro ao salvar transcrição. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Common form fields */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <AulaFormFields form={form} />
          </CardContent>
        </Card>

        {/* Transcription textarea */}
        <Card>
          <CardContent className="pt-6">
            <FormField
              control={form.control}
              name="transcricao_texto"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel className="text-deep-navy">Transcrição Completa *</FormLabel>
                    <span className={`text-sm font-medium ${getCounterColor()}`}>
                      {charCount.toLocaleString()} / 50.000
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Cole aqui a transcrição completa da aula..."
                      className="min-h-[300px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit button */}
        <Button
          type="submit"
          className="w-full h-11"
          disabled={!form.formState.isValid || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Transcrição'
          )}
        </Button>
      </form>
    </Form>
  );
}
