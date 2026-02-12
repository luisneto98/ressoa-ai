import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SugestoesTabProps {
  sugestoes: string[];
  planejamento: any;
}

export function SugestoesTab({ sugestoes }: SugestoesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sugestões para Próxima Aula</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {sugestoes.map((sugestao, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-cyan-500 font-bold">→</span>
              <span className="text-gray-700">{sugestao}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
