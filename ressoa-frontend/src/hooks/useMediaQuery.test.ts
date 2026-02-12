import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop } from './useMediaQuery';

describe('useMediaQuery', () => {
  let mockMediaQueryList: Partial<MediaQueryList>;
  let listeners: Array<(event: MediaQueryListEvent) => void>;

  beforeEach(() => {
    listeners = [];
    mockMediaQueryList = {
      matches: false,
      addEventListener: vi.fn((_, listener) => {
        listeners.push(listener as (event: MediaQueryListEvent) => void);
      }),
      removeEventListener: vi.fn(),
    };

    window.matchMedia = vi.fn(() => mockMediaQueryList as MediaQueryList);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return false by default (SSR-safe)', () => {
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));

    // Should be false initially before hydration
    expect(result.current).toBe(false);
  });

  it('should return true when media query matches', () => {
    mockMediaQueryList.matches = true;

    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));

    expect(result.current).toBe(true);
  });

  it('should update when media query changes', () => {
    mockMediaQueryList.matches = false;

    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));

    expect(result.current).toBe(false);

    // Simulate viewport resize
    act(() => {
      mockMediaQueryList.matches = true;
      listeners.forEach(listener => {
        listener({ matches: true } as MediaQueryListEvent);
      });
    });

    expect(result.current).toBe(true);
  });

  it('should cleanup event listener on unmount', () => {
    const { unmount } = renderHook(() => useMediaQuery('(max-width: 767px)'));

    unmount();

    expect(mockMediaQueryList.removeEventListener).toHaveBeenCalled();
  });

  it('should re-attach listener when query changes', () => {
    const { rerender } = renderHook(
      ({ query }) => useMediaQuery(query),
      { initialProps: { query: '(max-width: 767px)' } }
    );

    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767px)');

    rerender({ query: '(min-width: 768px)' });

    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 768px)');
  });
});

describe('useIsMobile', () => {
  beforeEach(() => {
    const mockMediaQueryList: Partial<MediaQueryList> = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    window.matchMedia = vi.fn(() => mockMediaQueryList as MediaQueryList);
  });

  it('should use correct mobile breakpoint (max-width: 767px)', () => {
    renderHook(() => useIsMobile());

    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767px)');
  });

  it('should return true for mobile viewport', () => {
    const mockMediaQueryList: Partial<MediaQueryList> = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    window.matchMedia = vi.fn(() => mockMediaQueryList as MediaQueryList);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });
});

describe('useIsTablet', () => {
  beforeEach(() => {
    const mockMediaQueryList: Partial<MediaQueryList> = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    window.matchMedia = vi.fn(() => mockMediaQueryList as MediaQueryList);
  });

  it('should use correct tablet breakpoint (768px to 1023px)', () => {
    renderHook(() => useIsTablet());

    expect(window.matchMedia).toHaveBeenCalledWith(
      '(min-width: 768px) and (max-width: 1023px)'
    );
  });

  it('should return true for tablet viewport', () => {
    const mockMediaQueryList: Partial<MediaQueryList> = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    window.matchMedia = vi.fn(() => mockMediaQueryList as MediaQueryList);

    const { result } = renderHook(() => useIsTablet());

    expect(result.current).toBe(true);
  });
});

describe('useIsDesktop', () => {
  beforeEach(() => {
    const mockMediaQueryList: Partial<MediaQueryList> = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    window.matchMedia = vi.fn(() => mockMediaQueryList as MediaQueryList);
  });

  it('should use correct desktop breakpoint (min-width: 1024px)', () => {
    renderHook(() => useIsDesktop());

    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
  });

  it('should return true for desktop viewport', () => {
    const mockMediaQueryList: Partial<MediaQueryList> = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    window.matchMedia = vi.fn(() => mockMediaQueryList as MediaQueryList);

    const { result } = renderHook(() => useIsDesktop());

    expect(result.current).toBe(true);
  });
});
