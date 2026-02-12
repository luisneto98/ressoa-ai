import { FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export const AulasListEmpty = () => {
  const navigate = useNavigate();

  return (
    <Card className="border-dashed">
      <CardContent className="pt-6 text-center">
        <FileX className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-deep-navy mb-2">
          Nenhuma aula encontrada
        </h3>
        <p className="text-sm text-deep-navy/60 mb-4">
          Faça upload da primeira aula para começar a acompanhar sua cobertura curricular
        </p>
        <Button
          onClick={() => navigate('/aulas/upload')}
          className="bg-focus-orange hover:bg-focus-orange/90 text-white"
        >
          Fazer Upload de Aula
        </Button>
      </CardContent>
    </Card>
  );
};
