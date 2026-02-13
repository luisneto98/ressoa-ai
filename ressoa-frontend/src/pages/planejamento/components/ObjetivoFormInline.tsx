import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { IconAlertCircle, IconRefresh, IconCheck, IconX } from '@tabler/icons-react';
import { objetivoSchema } from '@/lib/validation/objetivo.schema';
import type { ObjetivoFormData } from '@/lib/validation/objetivo.schema';
import {
  NivelBloom,
  NIVEL_BLOOM_LABELS,
  NIVEL_BLOOM_DESCRIPTIONS,
} from '@/types/objetivo';
import type { CreateObjetivoDto } from '@/types/objetivo';
import { CriteriosEvidenciaField } from './CriteriosEvidenciaField';
import { cn } from '@/lib/utils';

interface ObjetivoFormInlineProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<CreateObjetivoDto>;
  onSave: (data: CreateObjetivoDto) => void;
  onCancel: () => void;
  onSuggestCodigo?: () => string;
  existingCodes?: string[];
  objetivoIndex?: number;
}

/**
 * Formulário inline para criar/editar um objetivo de aprendizagem
 *
 * - 5 campos validados com Zod
 * - Botão "Sugerir automático" para código
 * - Character counter para descrição
 * - Select com tooltips para níveis Bloom
 * - Array field para critérios de evidência
 *
 * @param mode - 'create' ou 'edit'
 * @param defaultValues - Valores iniciais (para modo edit)
 * @param onSave - Callback ao salvar (recebe CreateObjetivoDto)
 * @param onCancel - Callback ao cancelar
 * @param onSuggestCodigo - Função para sugerir código automático
 * @param existingCodes - Códigos já existentes (para validação duplicata)
 * @param objetivoIndex - Índice do objetivo (usado no título)
 */
export function ObjetivoFormInline({
  mode,
  defaultValues,
  onSave,
  onCancel,
  onSuggestCodigo,
  existingCodes = [],
  objetivoIndex,
}: ObjetivoFormInlineProps) {
  const form = useForm<ObjetivoFormData>({
    resolver: zodResolver(
      objetivoSchema.refine(
        (data) => {
          // Validação de código duplicado (exceto quando editando o próprio código)
          if (mode === 'edit' && data.codigo.toUpperCase() === defaultValues?.codigo?.toUpperCase()) {
            return true;
          }
          return !existingCodes.includes(data.codigo);
        },
        {
          message: 'Código já existe, use outro',
          path: ['codigo'],
        }
      )
    ),
    defaultValues: defaultValues || {
      codigo: '',
      descricao: '',
      area_conhecimento: '',
      nivel_cognitivo: NivelBloom.APLICAR,
      criterios_evidencia: [''],
      ordem: 1,
    },
  });

  // Reset form quando defaultValues mudam (modo edit)
  useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form]);

  const handleSuggestCodigo = () => {
    if (onSuggestCodigo) {
      const suggestedCode = onSuggestCodigo();
      form.setValue('codigo', suggestedCode, { shouldValidate: true });
    }
  };

  const onSubmit = (data: ObjetivoFormData) => {
    onSave(data);
    if (mode === 'create') {
      form.reset();
    }
  };

  const descricao = form.watch('descricao') || '';

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>
            📝 Objetivo {objetivoIndex !== undefined ? `#${objetivoIndex + 1}` : ''}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            aria-label="Cancelar edição"
          >
            Fechar
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Código */}
          <div className="space-y-2">
            <Label htmlFor="codigo">
              Código (obrigatório)
            </Label>
            <div className="flex gap-2">
              <Input
                {...form.register('codigo')}
                id="codigo"
                placeholder="PM-MAT-01"
                className={cn(form.formState.errors.codigo && 'border-red-500')}
              />
              {onSuggestCodigo && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSuggestCodigo}
                  className="whitespace-nowrap"
                >
                  <IconRefresh className="h-4 w-4 mr-1" />
                  Sugerir automático
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-600">3-20 caracteres, A-Z 0-9 - _</p>
            {form.formState.errors.codigo && (
              <p className="text-sm text-red-600">{form.formState.errors.codigo.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="descricao">
                Descrição do Objetivo (obrigatório)
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconAlertCircle className="h-4 w-4 text-blue-600 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-sm font-medium">O que o aluno deve saber ou saber fazer?</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Seja específico e mensurável. Exemplo: "Resolver problemas de razão e proporção
                      aplicados a questões da PM-SP"
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              {...form.register('descricao')}
              id="descricao"
              placeholder="Resolver problemas de razão e proporção aplicados a questões de concursos da Polícia Militar de SP"
              rows={3}
              className={cn(form.formState.errors.descricao && 'border-red-500')}
            />
            <p
              className={cn(
                'text-sm',
                descricao.length < 20
                  ? 'text-red-600 font-medium'
                  : descricao.length > 500
                  ? 'text-red-600 font-medium'
                  : 'text-gray-500'
              )}
            >
              {descricao.length}/500 caracteres
            </p>
            {form.formState.errors.descricao && (
              <p className="text-sm text-red-600">{form.formState.errors.descricao.message}</p>
            )}
          </div>

          {/* Área de Conhecimento */}
          <div className="space-y-2">
            <Label htmlFor="area_conhecimento">
              Área de Conhecimento (opcional)
            </Label>
            <Input
              {...form.register('area_conhecimento')}
              id="area_conhecimento"
              placeholder="Matemática - Raciocínio Lógico"
              className={cn(form.formState.errors.area_conhecimento && 'border-red-500')}
            />
            <p className="text-xs text-gray-600">0-100 caracteres</p>
            {form.formState.errors.area_conhecimento && (
              <p className="text-sm text-red-600">{form.formState.errors.area_conhecimento.message}</p>
            )}
          </div>

          {/* Nível Cognitivo Bloom */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="nivel_cognitivo">
                Nível Cognitivo (Bloom) (obrigatório)
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconAlertCircle className="h-4 w-4 text-blue-600 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-sm font-medium">Como o aluno usará esse conhecimento?</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Lembrar = decorar, Aplicar = usar em situações práticas, Criar = produzir algo novo
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={form.watch('nivel_cognitivo')}
              onValueChange={(value) => form.setValue('nivel_cognitivo', value as NivelBloom)}
            >
              <SelectTrigger id="nivel_cognitivo">
                <SelectValue placeholder="Selecione um nível" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(NivelBloom).map((nivel) => (
                  <SelectItem key={nivel} value={nivel}>
                    <div className="flex flex-col items-start py-1">
                      <span className="font-medium">{NIVEL_BLOOM_LABELS[nivel]}</span>
                      <span className="text-xs text-gray-600">
                        {NIVEL_BLOOM_DESCRIPTIONS[nivel]}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.nivel_cognitivo && (
              <p className="text-sm text-red-600">{form.formState.errors.nivel_cognitivo.message}</p>
            )}
          </div>

          {/* Critérios de Evidência */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Critérios de Evidência</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconAlertCircle className="h-4 w-4 text-blue-600 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-sm font-medium">Como você saberá que o objetivo foi atingido?</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Liste evidências observáveis. Ex: "Explica conceito com próprias palavras", "Resolve problema sozinho"
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CriteriosEvidenciaField form={form} />
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
              <IconCheck className="h-4 w-4 mr-2" />
              {mode === 'create' ? 'Adicionar Objetivo' : 'Salvar Edição'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              <IconX className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
