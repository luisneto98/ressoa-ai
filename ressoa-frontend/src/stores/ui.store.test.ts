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
    useUIStore.setState({ sidebarCollapsed: false });
    localStorageMock.clear();
  });

  it('should have initial state with sidebar not collapsed', () => {
    const state = useUIStore.getState();

    expect(state.sidebarCollapsed).toBe(false);
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
});
