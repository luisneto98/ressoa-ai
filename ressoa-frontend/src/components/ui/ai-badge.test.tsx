import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AIBadge } from './ai-badge';

describe('AIBadge', () => {
  it('renders children content', () => {
    render(<AIBadge variant="skill">EF07MA18</AIBadge>);
    expect(screen.getByText('EF07MA18')).toBeInTheDocument();
  });

  it('renders skill variant with cyan color class', () => {
    render(<AIBadge variant="skill">Skill Badge</AIBadge>);
    const badge = screen.getByText('Skill Badge');
    expect(badge).toHaveClass('bg-cyan-ai', 'text-white');
  });

  it('renders processing variant with tech blue color', () => {
    render(<AIBadge variant="processing">Processing...</AIBadge>);
    const badge = screen.getByText('Processing...');
    expect(badge).toHaveClass('bg-tech-blue', 'text-white');
  });

  it('renders status variant with default status color', () => {
    render(<AIBadge variant="status">Status Badge</AIBadge>);
    const badge = screen.getByText('Status Badge');
    expect(badge).toHaveClass('bg-gray-200', 'text-gray-900');
  });

  it('renders status variant with success color', () => {
    render(<AIBadge variant="status" status="success">Success</AIBadge>);
    const badge = screen.getByText('Success');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('renders status variant with warning color', () => {
    render(<AIBadge variant="status" status="warning">Warning</AIBadge>);
    const badge = screen.getByText('Warning');
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('renders status variant with error color', () => {
    render(<AIBadge variant="status" status="error">Error</AIBadge>);
    const badge = screen.getByText('Error');
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('applies custom className', () => {
    render(<AIBadge variant="skill" className="custom-class">Test</AIBadge>);
    const badge = screen.getByText('Test');
    expect(badge).toHaveClass('custom-class');
  });

  it('renders small size correctly', () => {
    render(<AIBadge variant="skill" size="sm">Small</AIBadge>);
    const badge = screen.getByText('Small');
    expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs');
  });

  it('renders medium size correctly (default)', () => {
    render(<AIBadge variant="skill" size="md">Medium</AIBadge>);
    const badge = screen.getByText('Medium');
    expect(badge).toHaveClass('px-3', 'py-1', 'text-xs');
  });

  it('renders large size correctly', () => {
    render(<AIBadge variant="skill" size="lg">Large</AIBadge>);
    const badge = screen.getByText('Large');
    expect(badge).toHaveClass('px-4', 'py-1.5', 'text-sm');
  });

  it('processing variant has ARIA role status', () => {
    render(<AIBadge variant="processing">Processing...</AIBadge>);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('aria-live', 'polite');
  });

  it('skill variant does not have ARIA role status', () => {
    render(<AIBadge variant="skill">Skill</AIBadge>);
    const badge = screen.getByText('Skill');
    expect(badge).not.toHaveAttribute('role');
    expect(badge).not.toHaveAttribute('aria-live');
  });

  it('processing variant has pulse animation class', () => {
    render(<AIBadge variant="processing">Animating</AIBadge>);
    const badge = screen.getByText('Animating');
    // Check if animation class is applied (animate-[var(--animate-pulse-subtle)])
    expect(badge.className).toContain('animate-');
  });

  it('forwards additional HTML attributes', () => {
    render(<AIBadge variant="skill" data-testid="custom-badge">Test</AIBadge>);
    const badge = screen.getByTestId('custom-badge');
    expect(badge).toBeInTheDocument();
  });
});
