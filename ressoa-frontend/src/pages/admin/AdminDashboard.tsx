import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreateEscolaDialog } from './components/CreateEscolaDialog';
import { InviteDirectorDialog } from './components/InviteDirectorDialog';
import { useCreateEscola, useInviteDirector } from '@/hooks/useEscolas';
import type { EscolaFormData } from '@/lib/validation/escola.schema';
import type { InviteDirectorFormData } from '@/lib/validation/invite-director.schema';
import { IconBuildingCommunity, IconMailPlus } from '@tabler/icons-react';

/**
 * Dashboard administrativo (Admin role)
 * Epic 13 Story 13.1: Cadastro de escolas
 * Epic 13 Story 13.2: Convite de diretor por email
 */
export function AdminDashboard() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedEscola, setSelectedEscola] = useState<{
    id: string;
    nome: string;
  } | null>(null);

  const createEscolaMutation = useCreateEscola();
  const inviteDirectorMutation = useInviteDirector();

  /**
   * Handle school creation (Story 13.1 AC11)
   * Abre automaticamente o dialog de convite de diretor após criar escola
   */
  const handleCreateEscola = async (data: EscolaFormData) => {
    const newEscola = await createEscolaMutation.mutateAsync(data);

    console.log('Escola criada:', newEscola.id);
    setCreateDialogOpen(false);

    // Story 13.2: Abrir dialog de convite de diretor automaticamente
    setSelectedEscola({ id: newEscola.id, nome: newEscola.nome });
    setInviteDialogOpen(true);
  };

  /**
   * Handle director invitation (Story 13.2 AC12)
   */
  const handleInviteDirector = async (
    data: InviteDirectorFormData & { escola_id: string }
  ) => {
    await inviteDirectorMutation.mutateAsync(data);
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
            onClick={() => setCreateDialogOpen(true)}
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
            Clique em "Nova Escola" para cadastrar uma escola cliente e
            convidar o Diretor por email.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Story 13.1 - Cadastro de Escola ✅ Implementado
            <br />
            Story 13.2 - Convite de Diretor ✅ Implementado
            <br />
            Story 13.7 - Listagem de Escolas 🚧 Próximo
          </p>
        </div>

        {/* Dialog de cadastro de escola */}
        <CreateEscolaDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={handleCreateEscola}
          isLoading={createEscolaMutation.isPending}
        />

        {/* Dialog de convite de diretor */}
        {selectedEscola && (
          <InviteDirectorDialog
            open={inviteDialogOpen}
            onOpenChange={setInviteDialogOpen}
            escolaId={selectedEscola.id}
            escolaNome={selectedEscola.nome}
            onSubmit={handleInviteDirector}
            isLoading={inviteDirectorMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
