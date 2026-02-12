import { diffLines } from 'diff';
import { cn } from '@/lib/utils';

interface DiffViewerProps {
  original: string;
  modified: string;
}

export function DiffViewer({ original, modified }: DiffViewerProps) {
  const diff = diffLines(original, modified);

  return (
    <div className="font-mono text-sm border rounded-lg overflow-hidden">
      {diff.map((part, idx) => (
        <div
          key={idx}
          className={cn(
            'px-4 py-2 border-b last:border-b-0',
            part.added && 'bg-green-50 text-green-900 border-l-4 border-l-green-500',
            part.removed && 'bg-red-50 text-red-900 line-through border-l-4 border-l-red-500',
            !part.added && !part.removed && 'bg-white text-gray-700'
          )}
        >
          <pre className="whitespace-pre-wrap">{part.value}</pre>
        </div>
      ))}
    </div>
  );
}
