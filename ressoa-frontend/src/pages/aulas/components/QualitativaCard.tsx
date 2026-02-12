import { Card } from '@/components/ui/card';

interface QualitativaCardProps {
  title: string;
  data: any; // Generic data structure
}

export function QualitativaCard({ title, data }: QualitativaCardProps) {
  return (
    <Card className="p-4 bg-gray-50">
      <h3 className="font-semibold text-deep-navy mb-2">{title}</h3>
      <div className="text-sm text-gray-700">
        <pre className="whitespace-pre-wrap font-sans">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </Card>
  );
}
