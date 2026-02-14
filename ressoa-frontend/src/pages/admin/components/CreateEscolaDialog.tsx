import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { SubmitButton } from '@/components/ui/submit-button';
import {
  escolaFormSchema,
  type EscolaFormData,
  formatCNPJ,
  formatTelefone,
  getLimiteHorasPorPlano,
} from '@/lib/validation/escola.schema';
import { toast } from 'sonner';

interface CreateEscolaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EscolaFormData) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Dialog de cadastro de escola para Admin (Epic 13 Story 13.1)
 * Features:
 * - Validação Zod em tempo real (mode: onChange)
 * - Auto-formatação de CNPJ e telefone on blur
 * - Limite de horas auto-preenchido baseado em plano
 * - Erro 409 exibe erro no campo específico (CNPJ ou email)
 * - WCAG AAA compliant (aria-invalid, aria-live, focus ring)
 */
export function CreateEscolaDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: CreateEscolaDialogProps) {
  const form = useForm<EscolaFormData>({
    resolver: zodResolver(escolaFormSchema),
    defaultValues: {
      nome: '',
      cnpj: '',
      tipo: undefined,
      contato_principal: '',
      email_contato: '',
      telefone: '',
      plano: undefined,
      limite_horas_mes: 100,
      endereco: undefined,
    },
    mode: 'onChange', // Validação em tempo real (AC7)
  });

  /** Auto-format CNPJ on blur (AC8) */
  const handleCNPJBlur = () => {
    const value = form.getValues('cnpj');
    if (value) {
      form.setValue('cnpj', formatCNPJ(value), { shouldValidate: true });
    }
  };

  /** Auto-format Telefone on blur (AC8) */
  const handleTelefoneBlur = () => {
    const value = form.getValues('telefone');
    if (value) {
      form.setValue('telefone', formatTelefone(value), { shouldValidate: true });
    }
  };

  /** Update limite_horas_mes when plano changes (AC9) */
  const handlePlanoChange = (plano: string) => {
    form.setValue('plano', plano as EscolaFormData['plano'], { shouldValidate: true });
    form.setValue('limite_horas_mes', getLimiteHorasPorPlano(plano));
  };

  /** Handle form submission with error handling (AC10, AC11) */
  const handleSubmit = async (data: EscolaFormData) => {
    try {
      await onSubmit(data);
      toast.success(`Escola ${data.nome} cadastrada com sucesso!`);
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Erro ao cadastrar escola';

      // 409 Conflict: CNPJ ou email duplicado → field error (AC10)
      if (error?.response?.status === 409) {
        if (message.includes('CNPJ')) {
          form.setError('cnpj', {
            type: 'manual',
            message: 'CNPJ já cadastrado no sistema',
          });
        } else if (message.includes('Email')) {
          form.setError('email_contato', {
            type: 'manual',
            message: 'Email de contato já cadastrado',
          });
        }
      } else {
        // Outros erros → toast
        toast.error(message);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Escola</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Seção 1: Dados Gerais */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-deep-navy">Dados Gerais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome */}
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel htmlFor="nome">Nome da Escola *</FormLabel>
                      <FormControl>
                        <Input
                          id="nome"
                          placeholder="Ex: Colégio Exemplo"
                          aria-invalid={!!form.formState.errors.nome}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage aria-live="polite" />
                    </FormItem>
                  )}
                />

                {/* CNPJ */}
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="cnpj">CNPJ *</FormLabel>
                      <FormControl>
                        <Input
                          id="cnpj"
                          placeholder="XX.XXX.XXX/XXXX-XX"
                          aria-invalid={!!form.formState.errors.cnpj}
                          onBlur={handleCNPJBlur}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage aria-live="polite" />
                    </FormItem>
                  )}
                />

                {/* Tipo */}
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="tipo">Tipo de Escola *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger id="tipo" aria-invalid={!!form.formState.errors.tipo}>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="particular">Particular</SelectItem>
                          <SelectItem value="publica_municipal">Pública Municipal</SelectItem>
                          <SelectItem value="publica_estadual">Pública Estadual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage aria-live="polite" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Seção 2: Contato */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-deep-navy">Contato</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Responsável */}
                <FormField
                  control={form.control}
                  name="contato_principal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="contato_principal">Responsável Principal *</FormLabel>
                      <FormControl>
                        <Input
                          id="contato_principal"
                          placeholder="Ex: Maria Silva"
                          aria-invalid={!!form.formState.errors.contato_principal}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage aria-live="polite" />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email_contato"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="email_contato">Email de Contato *</FormLabel>
                      <FormControl>
                        <Input
                          id="email_contato"
                          type="email"
                          placeholder="contato@escola.com.br"
                          aria-invalid={!!form.formState.errors.email_contato}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage aria-live="polite" />
                    </FormItem>
                  )}
                />

                {/* Telefone */}
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel htmlFor="telefone">Telefone *</FormLabel>
                      <FormControl>
                        <Input
                          id="telefone"
                          placeholder="(XX) XXXXX-XXXX"
                          aria-invalid={!!form.formState.errors.telefone}
                          onBlur={handleTelefoneBlur}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage aria-live="polite" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Seção 3: Plano */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-deep-navy">Plano Contratado</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Plano */}
                <FormField
                  control={form.control}
                  name="plano"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="plano">Plano *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={handlePlanoChange}
                      >
                        <FormControl>
                          <SelectTrigger id="plano" aria-invalid={!!form.formState.errors.plano}>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="trial">Trial (100h/mês)</SelectItem>
                          <SelectItem value="basico">Básico (400h/mês)</SelectItem>
                          <SelectItem value="completo">Completo (1.000h/mês)</SelectItem>
                          <SelectItem value="enterprise">Enterprise (5.000h/mês)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage aria-live="polite" />
                    </FormItem>
                  )}
                />

                {/* Limite horas/mês */}
                <FormField
                  control={form.control}
                  name="limite_horas_mes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="limite_horas_mes">Limite Horas/Mês *</FormLabel>
                      <FormControl>
                        <Input
                          id="limite_horas_mes"
                          type="number"
                          min={1}
                          aria-invalid={!!form.formState.errors.limite_horas_mes}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                        />
                      </FormControl>
                      <FormMessage aria-live="polite" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Seção 4: Endereço (opcional) */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-deep-navy">Endereço (Opcional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Rua */}
                <FormField
                  control={form.control}
                  name="endereco.rua"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel htmlFor="endereco.rua">Rua</FormLabel>
                      <FormControl>
                        <Input id="endereco.rua" placeholder="Rua Exemplo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Número */}
                <FormField
                  control={form.control}
                  name="endereco.numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="endereco.numero">Número</FormLabel>
                      <FormControl>
                        <Input id="endereco.numero" placeholder="123" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Bairro */}
                <FormField
                  control={form.control}
                  name="endereco.bairro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="endereco.bairro">Bairro</FormLabel>
                      <FormControl>
                        <Input id="endereco.bairro" placeholder="Centro" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Cidade */}
                <FormField
                  control={form.control}
                  name="endereco.cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="endereco.cidade">Cidade</FormLabel>
                      <FormControl>
                        <Input id="endereco.cidade" placeholder="São Paulo" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* UF */}
                <FormField
                  control={form.control}
                  name="endereco.uf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="endereco.uf">UF</FormLabel>
                      <FormControl>
                        <Input id="endereco.uf" placeholder="SP" maxLength={2} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* CEP */}
                <FormField
                  control={form.control}
                  name="endereco.cep"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel htmlFor="endereco.cep">CEP</FormLabel>
                      <FormControl>
                        <Input id="endereco.cep" placeholder="01234-567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <SubmitButton
                isLoading={isLoading || form.formState.isSubmitting}
                label="Cadastrar Escola"
                loadingLabel="Cadastrando..."
              />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
