import { Button } from '@/components/ui/button';
import { IconSchool, IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

export const AulasListEmpty = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 py-12">
      {/* Illustrated icon with branded color */}
      <IconSchool
        size={64}
        className="text-cyan-ai animate-pulse-subtle"
        aria-hidden="true"
      />

      {/* Title */}
      <h2 className="text-2xl font-montserrat font-bold text-deep-navy text-center">
        Nenhuma aula registrada ainda
      </h2>

      {/* Motivational subtitle */}
      <p className="text-center text-deep-navy/80 max-w-md font-inter">
        Comece fazendo upload da sua primeira aula e veja a mágica acontecer!
      </p>

      {/* CTA button with Tech Blue (primary action) */}
      <Button
        onClick={() => navigate('/aulas/upload')}
        size="lg"
        className="bg-tech-blue hover:bg-tech-blue/90"
        aria-label="Fazer upload da primeira aula"
      >
        <IconPlus className="h-5 w-5 mr-2" />
        Nova Aula
      </Button>
    </div>
  );
};
