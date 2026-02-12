import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { NavItem } from './navigation-config';

interface SidebarCTAItemProps {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}

/**
 * CTA (Call-to-Action) item destacado para sidebar
 * Usado exclusivamente para ação primária do Professor: "Nova Aula"
 *
 * Design: Focus Orange background, texto branco, sombra sutil
 * Inspiração: Canva "Create a design", Linear "New issue"
 */
export function SidebarCTAItem({ item, collapsed, onNavigate }: SidebarCTAItemProps) {
  const { pathname } = useLocation();
  const isActive = pathname === item.path;
  const Icon = item.icon;

  // CTA button classes — Focus Orange background (#F97316)
  const ctaClasses = cn(
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
    'bg-focus-orange text-white shadow-lg shadow-focus-orange/20',
    'hover:bg-focus-orange/90 hover:shadow-xl hover:shadow-focus-orange/30',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue focus-visible:ring-offset-2 focus-visible:ring-offset-deep-navy',
    isActive && 'bg-focus-orange/80', // Slightly dimmed when active
    collapsed ? 'justify-center px-2.5' : 'justify-start',
    'min-h-[44px]' // Touch-friendly minimum height (WCAG 2.2)
  );

  const linkContent = (
    <Link
      to={item.path}
      onClick={onNavigate}
      className={ctaClasses}
      aria-label={collapsed ? item.label : undefined}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  // Tooltip apenas quando colapsado (accessibility)
  if (collapsed) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium bg-deep-navy text-white border-white/10">
            {item.label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return linkContent;
}
