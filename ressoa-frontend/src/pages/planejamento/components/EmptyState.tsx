import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EmptyState = () => {
  const navigate = useNavigate();

  return (
    <Card className="border-dashed" role="status">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum planejamento cadastrado</h3>
        <p className="text-sm text-gray-500 mb-6">
          Crie seu primeiro planejamento bimestral para começar.
        </p>
        <Button
          onClick={() => navigate('/planejamentos/novo')}
          className="bg-tech-blue hover:bg-tech-blue/90"
        >
          Criar Primeiro Planejamento
        </Button>
      </CardContent>
    </Card>
  );
};
