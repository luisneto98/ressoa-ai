import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUIStore } from './ui.store';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ui.store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUIStore.setState({
      sidebarCollapsed: false,
      mobileMenuOpen: false,
      manuallyToggled: false,
    });
    localStorageMock.clear();
  });

  it('should have initial state with sidebar not collapsed', () => {
    const state = useUIStore.getState();

    expect(state.sidebarCollapsed).toBe(false);
  });

  it('should have initial state with mobile menu closed', () => {
    const state = useUIStore.getState();

    expect(state.mobileMenuOpen).toBe(false);
  });

  it('should have initial state with manuallyToggled false', () => {
    const state = useUIStore.getState();

    expect(state.manuallyToggled).toBe(false);
  });

  it('should toggle sidebar state from false to true', () => {
    const initialState = useUIStore.getState();
    expect(initialState.sidebarCollapsed).toBe(false);

    useUIStore.getState().toggleSidebar();

    const newState = useUIStore.getState();
    expect(newState.sidebarCollapsed).toBe(true);
  });

  it('should toggle sidebar state from true to false', () => {
    useUIStore.setState({ sidebarCollapsed: true });

    useUIStore.getState().toggleSidebar();

    const newState = useUIStore.getState();
    expect(newState.sidebarCollapsed).toBe(false);
  });

  it('should toggle sidebar state multiple times', () => {
    const { toggleSidebar } = useUIStore.getState();

    expect(useUIStore.getState().sidebarCollapsed).toBe(false);

    toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);

    toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);

    toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
  });

  it('should persist sidebar state to localStorage', () => {
    const { toggleSidebar } = useUIStore.getState();

    toggleSidebar();

    // Check if state was persisted
    const persistedData = localStorageMock.getItem('ui-storage');
    expect(persistedData).toBeDefined();

    if (persistedData) {
      const parsed = JSON.parse(persistedData);
      expect(parsed.state.sidebarCollapsed).toBe(true);
    }
  });

  it('should set manuallyToggled to true when toggleSidebar is called', () => {
    const { toggleSidebar } = useUIStore.getState();

    toggleSidebar();

    const state = useUIStore.getState();
    expect(state.manuallyToggled).toBe(true);
  });

  it('should persist manuallyToggled to localStorage', () => {
    const { toggleSidebar } = useUIStore.getState();

    toggleSidebar();

    const persistedData = localStorageMock.getItem('ui-storage');
    expect(persistedData).toBeDefined();

    if (persistedData) {
      const parsed = JSON.parse(persistedData);
      expect(parsed.state.manuallyToggled).toBe(true);
    }
  });

  describe('mobile menu', () => {
    it('should set mobile menu open to true', () => {
      const { setMobileMenuOpen } = useUIStore.getState();

      setMobileMenuOpen(true);

      const state = useUIStore.getState();
      expect(state.mobileMenuOpen).toBe(true);
    });

    it('should set mobile menu open to false', () => {
      useUIStore.setState({ mobileMenuOpen: true });
      const { setMobileMenuOpen } = useUIStore.getState();

      setMobileMenuOpen(false);

      const state = useUIStore.getState();
      expect(state.mobileMenuOpen).toBe(false);
    });

    it('should close mobile menu', () => {
      useUIStore.setState({ mobileMenuOpen: true });
      const { closeMobileMenu } = useUIStore.getState();

      closeMobileMenu();

      const state = useUIStore.getState();
      expect(state.mobileMenuOpen).toBe(false);
    });

    it('should NOT persist mobileMenuOpen to localStorage', () => {
      const { setMobileMenuOpen } = useUIStore.getState();

      setMobileMenuOpen(true);

      const persistedData = localStorageMock.getItem('ui-storage');

      if (persistedData) {
        const parsed = JSON.parse(persistedData);
        expect(parsed.state.mobileMenuOpen).toBeUndefined();
      }
    });
  });

  describe('auto collapse', () => {
    it('should collapse sidebar via autoCollapseSidebar', () => {
      const { autoCollapseSidebar } = useUIStore.getState();

      autoCollapseSidebar();

      const state = useUIStore.getState();
      expect(state.sidebarCollapsed).toBe(true);
    });

    it('should NOT set manuallyToggled when using autoCollapseSidebar', () => {
      const { autoCollapseSidebar } = useUIStore.getState();

      autoCollapseSidebar();

      const state = useUIStore.getState();
      expect(state.manuallyToggled).toBe(false);
    });
  });
});
