import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreateEscolaDialog } from './components/CreateEscolaDialog';
import { useCreateEscola } from '@/hooks/useEscolas';
import type { EscolaFormData } from '@/lib/validation/escola.schema';
import { IconBuildingCommunity } from '@tabler/icons-react';

/**
 * Dashboard administrativo (Admin role)
 * Epic 13 Story 13.1: Cadastro de escolas
 */
export function AdminDashboard() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const createEscolaMutation = useCreateEscola();

  /**
   * Handle school creation (AC11)
   * Redireciona para tela de convite de diretor após sucesso
   * (Story 13-2 ainda não implementada, então apenas fecha o dialog)
   */
  const handleCreateEscola = async (data: EscolaFormData) => {
    const newEscola = await createEscolaMutation.mutateAsync(data);

    // TODO Story 13-2: Redirecionar para tela de convite de Diretor
    // navigate(`/admin/convites/diretor?escolaId=${newEscola.id}`);

    console.log('Escola criada:', newEscola.id);
    setDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-ghost-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-montserrat font-bold text-deep-navy mb-2">
              Painel Administrativo
            </h1>
            <p className="text-gray-600">
              Gestão de escolas e usuários do sistema Ressoa AI
            </p>
          </div>

          <Button
            onClick={() => setDialogOpen(true)}
            size="lg"
            className="bg-tech-blue hover:bg-tech-blue/90 text-white gap-2"
          >
            <IconBuildingCommunity size={20} />
            Nova Escola
          </Button>
        </div>

        {/* Content placeholder */}
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <IconBuildingCommunity
            size={64}
            className="mx-auto mb-4 text-gray-300"
          />
          <h2 className="text-xl font-semibold text-deep-navy mb-2">
            Bem-vindo ao Painel Administrativo
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Clique em "Nova Escola" para cadastrar uma escola cliente e começar
            o processo de onboarding.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Story 13.1 - Cadastro de Escola ✅ Implementado
            <br />
            Story 13.7 - Listagem de Escolas 🚧 Próximo
          </p>
        </div>

        {/* Dialog de cadastro */}
        <CreateEscolaDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleCreateEscola}
          isLoading={createEscolaMutation.isPending}
        />
      </div>
    </div>
  );
}
