import { FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const AulasListEmpty = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center py-12">
      <FileX className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Nenhuma aula encontrada</h3>
      <p className="text-gray-600 mb-6">
        Comece criando sua primeira aula ou ajuste os filtros.
      </p>
      <Button onClick={() => navigate('/aulas/upload')}>
        Criar Primeira Aula
      </Button>
    </div>
  );
};
