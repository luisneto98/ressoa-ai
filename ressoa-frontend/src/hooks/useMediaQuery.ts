import { useState, useEffect } from 'react';

/**
 * Hook to detect media query matches with SSR-safe defaults.
 *
 * @param query - CSS media query string (e.g., "(max-width: 767px)")
 * @returns boolean indicating if the media query matches
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 767px)');
 */
export function useMediaQuery(query: string): boolean {
  // SSR-safe: assume false until hydration
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Listen for changes
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

/**
 * Detects mobile viewport (< 768px).
 * Aligns with Tailwind's `md` breakpoint.
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * Detects tablet viewport (768px - 1023px).
 * Between Tailwind's `md` and `lg` breakpoints.
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

/**
 * Detects desktop viewport (>= 1024px).
 * Aligns with Tailwind's `lg` breakpoint.
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
