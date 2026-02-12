import { ChevronsLeft, ChevronsRight, AudioWaveform } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import { getNavigationForRole } from './navigation-config';
import { SidebarNavItem } from './SidebarNavItem';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  // Handle missing user gracefully (initial load) or unknown roles
  const navItems = getNavigationForRole(user?.role ?? '');

  // If user exists but no nav items found, warn about unknown role
  if (user && navItems.length === 0) {
    console.warn(`[Sidebar] No navigation items found for role: ${user.role}`);
  }

  return (
    <aside
      className={cn(
        'flex h-screen flex-col bg-deep-navy transition-all duration-300',
        sidebarCollapsed ? 'w-[68px]' : 'w-60'
      )}
      role="navigation"
      aria-label="Navegação principal"
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-tech-blue to-cyan-ai">
          <AudioWaveform className="size-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <span className="text-lg font-montserrat font-bold text-white truncate">
            Ressoa AI
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => (
            <SidebarNavItem key={item.path} item={item} collapsed={sidebarCollapsed} />
          ))}
        </ul>
      </nav>

      {/* Collapse button */}
      <div className="border-t border-white/10 p-3">
        <button
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
          className="flex w-full items-center justify-center rounded-lg p-2.5 text-white/60 hover:bg-white/10 hover:text-white transition-colors min-h-[44px]"
        >
          {sidebarCollapsed ? (
            <ChevronsRight className="size-5" />
          ) : (
            <ChevronsLeft className="size-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
