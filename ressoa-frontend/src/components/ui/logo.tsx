import { cn } from '@/lib/utils';
import logoHorizontal from '@/assets/logos/ressoa-logo-horizontal.png';
import logoHorizontalWhite from '@/assets/logos/ressoa-logo-horizontal-white.png';
import logoIcon from '@/assets/logos/ressoa-logo-icon.png';

interface LogoProps {
  variant?: 'full' | 'icon';
  theme?: 'light' | 'dark';
  className?: string;
  iconClassName?: string;
}

export function Logo({ variant = 'full', theme = 'light', className, iconClassName }: LogoProps) {
  if (variant === 'icon') {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <img
          src={logoIcon}
          alt="Ressoa AI"
          className={cn('object-contain', iconClassName)}
        />
      </div>
    );
  }

  // Use white logo for dark backgrounds (Sidebar), colored logo for light backgrounds (Login)
  const logoSrc = theme === 'dark' ? logoHorizontalWhite : logoHorizontal;

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <img
        src={logoSrc}
        alt="Ressoa AI - Inteligência de Aula, Análise e Previsão de Conteúdo"
        className={cn('object-contain', iconClassName)}
      />
    </div>
  );
}
