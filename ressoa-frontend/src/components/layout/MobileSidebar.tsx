import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { getNavigationForRole } from './navigation-config';
import { SidebarNavItem } from './SidebarNavItem';
import { Logo } from '@/components/ui/logo';

export function MobileSidebar() {
  const user = useAuthStore((s) => s.user);
  const mobileMenuOpen = useUIStore((s) => s.mobileMenuOpen);
  const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen);
  const closeMobileMenu = useUIStore((s) => s.closeMobileMenu);

  // Handle missing user gracefully (initial load) or unknown roles
  const navItems = getNavigationForRole(user?.role ?? '');

  // If user exists but no nav items found, warn about unknown role
  if (user && navItems.length === 0) {
    console.warn(`[MobileSidebar] No navigation items found for role: ${user.role}`);
  }

  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetContent side="left" className="w-60 bg-deep-navy p-0 border-none">
        {/* Logo */}
        <div className="flex h-20 items-center px-4 border-b border-white/10">
          <Logo
            variant="full"
            theme="dark"
            className="w-full"
            iconClassName="w-full h-auto max-h-16"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <SidebarNavItem
                key={item.path}
                item={item}
                collapsed={false}
                onNavigate={closeMobileMenu}
              />
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
