import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { getNavigationForRole } from './navigation-config';
import { SidebarNavItem } from './SidebarNavItem';
import { AudioWaveform } from 'lucide-react';

export function MobileSidebar() {
  const user = useAuthStore((s) => s.user);
  const mobileMenuOpen = useUIStore((s) => s.mobileMenuOpen);
  const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen);
  const closeMobileMenu = useUIStore((s) => s.closeMobileMenu);

  const navItems = getNavigationForRole(user?.role ?? '');

  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetContent side="left" className="w-60 bg-deep-navy p-0 border-none">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-4 border-b border-white/10">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-tech-blue to-cyan-ai">
            <AudioWaveform className="size-5 text-white" />
          </div>
          <span className="text-lg font-montserrat font-bold text-white truncate">
            Ressoa AI
          </span>
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
