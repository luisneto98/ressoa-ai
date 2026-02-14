import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SkeletonLoader } from './skeleton-loader';

describe('SkeletonLoader', () => {
  describe('card variant', () => {
    it('renders card skeleton', () => {
      const { container } = render(<SkeletonLoader variant="card" />);
      // Card has border and padding
      const card = container.querySelector('.rounded-xl.border');
      expect(card).toBeInTheDocument();
    });

    it('renders multiple card skeletons when count is specified', () => {
      const { container } = render(<SkeletonLoader variant="card" count={3} />);
      const cards = container.querySelectorAll('.rounded-xl.border');
      expect(cards.length).toBe(3);
    });

    it('renders single card by default', () => {
      const { container } = render(<SkeletonLoader variant="card" />);
      const cards = container.querySelectorAll('.rounded-xl.border');
      expect(cards.length).toBe(1);
    });
  });

  describe('table variant', () => {
    it('renders table row skeleton', () => {
      const { container } = render(<SkeletonLoader variant="table" />);
      // Table row has border-b
      const row = container.querySelector('.border-b');
      expect(row).toBeInTheDocument();
    });

    it('renders multiple table rows when count is specified', () => {
      const { container } = render(<SkeletonLoader variant="table" count={5} />);
      const rows = container.querySelectorAll('.border-b');
      expect(rows.length).toBe(5);
    });

    it('table row has 4 skeleton columns', () => {
      const { container } = render(<SkeletonLoader variant="table" />);
      const row = container.querySelector('.border-b');
      const columns = row?.querySelectorAll('[data-slot="skeleton"]');
      expect(columns?.length).toBe(4);
    });
  });

  describe('chart variant', () => {
    it('renders chart skeleton', () => {
      const { container } = render(<SkeletonLoader variant="chart" />);
      // Chart has border and padding like card
      const chart = container.querySelector('.rounded-xl.border');
      expect(chart).toBeInTheDocument();
    });

    it('chart has 6 bar skeletons', () => {
      const { container } = render(<SkeletonLoader variant="chart" />);
      const chart = container.querySelector('.rounded-xl.border');
      // Find the container with h-48 (chart container)
      const barsContainer = chart?.querySelector('.h-48');
      const bars = barsContainer?.querySelectorAll('[data-slot="skeleton"]');
      expect(bars?.length).toBe(6);
    });

    it('chart has x-axis label skeletons', () => {
      const { container } = render(<SkeletonLoader variant="chart" />);
      const chart = container.querySelector('.rounded-xl.border');
      // X-axis labels are after the bars
      const labels = chart?.querySelectorAll('.mt-2 [data-slot="skeleton"]');
      expect(labels?.length).toBe(6);
    });

    it('renders multiple charts when count is specified', () => {
      const { container } = render(<SkeletonLoader variant="chart" count={2} />);
      const charts = container.querySelectorAll('.rounded-xl.border');
      expect(charts.length).toBe(2);
    });
  });

  describe('common functionality', () => {
    it('applies custom className to root element', () => {
      const { container } = render(
        <SkeletonLoader variant="card" className="custom-class" />
      );
      const root = container.querySelector('.custom-class');
      expect(root).toBeInTheDocument();
    });

    it('forwards additional HTML attributes', () => {
      render(<SkeletonLoader variant="card" data-testid="custom-skeleton" />);
      expect(screen.getByTestId('custom-skeleton')).toBeInTheDocument();
    });

    it('renders space-y-4 for vertical spacing', () => {
      const { container } = render(<SkeletonLoader variant="card" count={2} />);
      const root = container.firstChild;
      expect(root).toHaveClass('space-y-4');
    });
  });

  describe('skeleton base component integration', () => {
    it('uses Skeleton component with pulse animation', () => {
      const { container } = render(<SkeletonLoader variant="card" />);
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
      // Check if skeleton has pulse animation class
      skeletons.forEach((skeleton) => {
        expect(skeleton).toHaveClass('animate-pulse');
      });
    });

    it('card skeleton has rounded corners', () => {
      const { container } = render(<SkeletonLoader variant="card" />);
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      skeletons.forEach((skeleton) => {
        expect(skeleton).toHaveClass('rounded-md');
      });
    });
  });

  describe('count parameter', () => {
    it('respects count=1 (default)', () => {
      const { container } = render(<SkeletonLoader variant="card" count={1} />);
      const cards = container.querySelectorAll('.rounded-xl.border');
      expect(cards.length).toBe(1);
    });

    it('respects count=10', () => {
      const { container } = render(<SkeletonLoader variant="table" count={10} />);
      const rows = container.querySelectorAll('.border-b');
      expect(rows.length).toBe(10);
    });
  });
});
