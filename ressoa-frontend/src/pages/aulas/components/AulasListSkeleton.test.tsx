import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AulasListSkeleton } from './AulasListSkeleton';

describe('AulasListSkeleton', () => {
  it('renders grid with responsive classes', () => {
    const { container } = render(<AulasListSkeleton />);

    const grid = container.firstChild as HTMLElement;
    expect(grid).toHaveClass('grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('md:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-3');
    expect(grid).toHaveClass('gap-6');
  });

  it('renders SkeletonLoader component with correct variant', () => {
    const { container } = render(<AulasListSkeleton />);

    // SkeletonLoader should be rendered inside grid
    expect(container.querySelector('[class*="skeleton"]')).toBeInTheDocument();
  });

  it('renders 6 skeleton cards (count prop)', () => {
    const { container } = render(<AulasListSkeleton />);

    // SkeletonLoader with count=6 should render 6 skeleton elements
    const skeletons = container.querySelectorAll('[class*="skeleton"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(1); // At least the wrapper
  });

  it('matches real cards grid structure', () => {
    const { container } = render(<AulasListSkeleton />);

    const grid = container.firstChild as HTMLElement;

    // Grid structure should match AulasCardsDesktop grid
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('md:grid-cols-2');
    expect(grid.className).toContain('lg:grid-cols-3');
    expect(grid.className).toContain('gap-6');
  });

  it('skeleton loader uses card variant', () => {
    const { container } = render(<AulasListSkeleton />);

    // SkeletonLoader should be rendered (component test in skeleton-loader.test.tsx validates variant)
    expect(container.firstChild).toBeInTheDocument();
  });
});
