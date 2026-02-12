import { Breadcrumbs } from './Breadcrumbs';
import { UserMenu } from './UserMenu';

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-white px-6">
      <Breadcrumbs />
      <UserMenu />
    </header>
  );
}
