import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: 'blue' | 'green' | 'orange' | 'red' | 'cyan' | 'purple';
  subtitle?: string; // Optional subtitle
  tooltip?: string; // Story 11.8 AC3: Explanatory tooltip for adaptive metrics
}

export function StatCard({ title, value, icon, color, subtitle, tooltip }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-tech-blue/10 text-tech-blue',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-focus-orange/10 text-focus-orange',
    red: 'bg-red-50 text-red-600',
    cyan: 'bg-cyan-ai/10 text-cyan-ai',
    purple: 'bg-purple-50 text-purple-600',
  };

  const content = (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        <div>
          <p className="text-sm text-deep-navy/80 font-medium">{title}</p>
          <p className="text-2xl font-montserrat font-bold text-deep-navy">{value}</p>
          {subtitle && (
            <p className="text-xs text-deep-navy/60 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </Card>
  );

  // Wrap with tooltip if provided
  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
