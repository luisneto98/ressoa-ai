import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  manuallyToggled: boolean;
  toggleSidebar: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  closeMobileMenu: () => void;
  autoCollapseSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileMenuOpen: false,
      manuallyToggled: false,
      toggleSidebar: () =>
        set((s) => ({
          sidebarCollapsed: !s.sidebarCollapsed,
          manuallyToggled: true,
        })),
      setMobileMenuOpen: (open: boolean) => set({ mobileMenuOpen: open }),
      closeMobileMenu: () => set({ mobileMenuOpen: false }),
      autoCollapseSidebar: () => set({ sidebarCollapsed: true }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        manuallyToggled: state.manuallyToggled,
      }),
    }
  )
);
