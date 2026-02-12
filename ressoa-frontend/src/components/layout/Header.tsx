import { Menu } from 'lucide-react';
import { useUIStore } from '@/stores/ui.store';
import { Breadcrumbs } from './Breadcrumbs';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  showMenuButton?: boolean;
}

export function Header({ showMenuButton = false }: HeaderProps) {
  const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-white px-6">
      <div className="flex items-center gap-4">
        {/* Hamburger button — mobile only */}
        {showMenuButton && (
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menu de navegação"
            className="flex size-10 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px]"
          >
            <Menu className="size-5 text-deep-navy" />
          </button>
        )}
        <Breadcrumbs />
      </div>
      <UserMenu />
    </header>
  );
}
