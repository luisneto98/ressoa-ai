import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Exercicio {
  enunciado: string;
  gabarito: string;
  nivel_bloom: number;
}

interface ExerciciosTabProps {
  exercicios: Exercicio[];
}

export function ExerciciosTab({ exercicios }: ExerciciosTabProps) {
  return (
    <div className="space-y-4">
      {exercicios.map((ex, idx) => (
        <Card key={idx}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Exercício {idx + 1}</CardTitle>
              <Badge variant="secondary">Bloom Nível {ex.nivel_bloom}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-semibold text-sm text-gray-700 mb-1">Enunciado:</p>
              <p className="text-gray-900">{ex.enunciado}</p>
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-700 mb-1">Gabarito:</p>
              <p className="text-gray-600 italic">{ex.gabarito}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
