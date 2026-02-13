import { Card } from '@/components/ui/card';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: 'blue' | 'green' | 'orange' | 'red' | 'cyan' | 'purple';
}

export function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-tech-blue/10 text-tech-blue',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-focus-orange/10 text-focus-orange',
    red: 'bg-red-50 text-red-600',
    cyan: 'bg-cyan-ai/10 text-cyan-ai',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        <div>
          <p className="text-sm text-deep-navy/80 font-medium">{title}</p>
          <p className="text-2xl font-montserrat font-bold text-deep-navy">{value}</p>
        </div>
      </div>
    </Card>
  );
}
