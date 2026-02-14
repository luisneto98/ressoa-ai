import { useEffect } from 'react';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import { useIsTablet } from '@/hooks/useMediaQuery';
import { getNavigationForRole } from './navigation-config';
import { SidebarNavItem } from './SidebarNavItem';
import { SidebarCTAItem } from './SidebarCTAItem';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const isTablet = useIsTablet();
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const manuallyToggled = useUIStore((s) => s.manuallyToggled);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const autoCollapseSidebar = useUIStore((s) => s.autoCollapseSidebar);

  // Auto-collapse on tablet if not manually expanded
  useEffect(() => {
    if (isTablet && !sidebarCollapsed && !manuallyToggled) {
      autoCollapseSidebar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Note: autoCollapseSidebar is a stable Zustand action (doesn't change), excluded from deps
  }, [isTablet, sidebarCollapsed, manuallyToggled]);

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
      <div className={cn(
        "flex h-20 items-center",
        sidebarCollapsed ? "justify-center" : "gap-3 px-4"
      )}>
        {sidebarCollapsed ? (
          <Logo
            variant="icon"
            className="size-14 shrink-0"
            iconClassName="w-full h-full"
          />
        ) : (
          <Logo
            variant="full"
            theme="dark"
            className="w-full"
            iconClassName="w-full h-auto max-h-16"
          />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) =>
            item.isCTA ? (
              <li key={item.path}>
                <SidebarCTAItem item={item} collapsed={sidebarCollapsed} />
              </li>
            ) : (
              <SidebarNavItem key={item.path} item={item} collapsed={sidebarCollapsed} />
            )
          )}
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
