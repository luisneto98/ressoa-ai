import { useState } from 'react';
import { IconMailPlus } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { InviteProfessorDialog } from '@/components/shared/InviteProfessorDialog';
import { useAuthStore } from '@/stores/auth.store';
import { useInviteProfessor } from '@/hooks/useCoordenador';

export function ProfessoresPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const { user } = useAuthStore();

  const { mutateAsync: inviteProfessor, isPending } = useInviteProfessor();

  const handleInviteSuccess = () => {
    // AC14: Disable button for 3s to prevent duplicate clicks
    setButtonDisabled(true);
    setTimeout(() => setButtonDisabled(false), 3000);
  };

  const handleSubmit = async (data: Parameters<typeof inviteProfessor>[0]) => {
    await inviteProfessor(data);
    handleInviteSuccess();
  };

  return (
    <div className="container mx-auto py-6">
      {/* AC12: Header com botão "Convidar Professor" */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-montserrat font-bold text-deep-navy">
          Professores
        </h1>
        <Button
          onClick={() => setIsDialogOpen(true)}
          disabled={buttonDisabled}
          className="gap-2 bg-tech-blue hover:bg-tech-blue/90"
          title="Enviar convite por email para Professor"
        >
          <IconMailPlus size={20} />
          Convidar Professor
        </Button>
      </div>

      {/* AC12: Lista de professores (implementação futura) */}
      <div className="bg-white rounded-lg border p-6">
        <p className="text-gray-500">
          Lista de professores será implementada aqui.
        </p>
      </div>

      {/* AC13: Dialog reutilizável para convite */}
      <InviteProfessorDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
        isLoading={isPending}
        escolaNome={user?.escola?.nome || ''}
      />
    </div>
  );
}
