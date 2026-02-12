import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';
import { Header } from './Header';
import { useIsMobile } from '@/hooks/useMediaQuery';

export function AppLayout() {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile: Sheet drawer (hidden until opened) */}
      {isMobile ? (
        <MobileSidebar />
      ) : (
        /* Tablet/Desktop: Fixed sidebar */
        <Sidebar />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header showMenuButton={isMobile} />
        <main className="flex-1 overflow-y-auto bg-ghost-white p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
