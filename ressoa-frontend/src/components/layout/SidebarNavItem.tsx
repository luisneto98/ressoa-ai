import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { NavItem } from './navigation-config';

interface SidebarNavItemProps {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}

export function SidebarNavItem({ item, collapsed, onNavigate }: SidebarNavItemProps) {
  const { pathname } = useLocation();
  const isActive = pathname.startsWith(item.path);
  const Icon = item.icon;

  return (
    <li>
      <Link
        to={item.path}
        onClick={onNavigate}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 min-h-[44px]',
          isActive
            ? 'bg-tech-blue text-white shadow-md'
            : 'text-white/80 hover:bg-white/10 hover:text-white'
        )}
      >
        <Icon className="size-5 shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    </li>
  );
}
