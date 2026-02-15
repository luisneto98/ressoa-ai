import { useState } from 'react';
import { IconMailPlus } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { InviteCoordenadorDialog } from './components/InviteCoordenadorDialog';
import { useAuthStore } from '@/stores/auth.store';

export function CoordenadoresPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const { user } = useAuthStore();

  const handleInviteSuccess = () => {
    // Disable button for 3s to prevent duplicate clicks
    setButtonDisabled(true);
    setTimeout(() => setButtonDisabled(false), 3000);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-montserrat font-bold text-deep-navy">
          Coordenadores
        </h1>
        <Button
          onClick={() => setIsDialogOpen(true)}
          disabled={buttonDisabled}
          className="gap-2"
          title="Enviar convite por email para Coordenador"
        >
          <IconMailPlus size={20} />
          Convidar Coordenador
        </Button>
      </div>

      {/* Lista de coordenadores (implementação futura) */}
      <div className="bg-white rounded-lg border p-6">
        <p className="text-gray-500">
          Lista de coordenadores será implementada aqui.
        </p>
      </div>

      <InviteCoordenadorDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        escolaNome={user?.escola?.nome || ''}
        onSuccess={handleInviteSuccess}
      />
    </div>
  );
}
