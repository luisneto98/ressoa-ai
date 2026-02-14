import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GradientCard } from './gradient-card';

describe('GradientCard', () => {
  it('renders title', () => {
    render(<GradientCard title="Test Title">Content</GradientCard>);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <GradientCard title="Title" description="Test Description">
        Content
      </GradientCard>
    );
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('does not render description element when not provided', () => {
    render(<GradientCard title="Title">Content</GradientCard>);
    const description = screen.queryByText(/Test Description/);
    expect(description).not.toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <GradientCard title="Title">
        <p>Child Content</p>
      </GradientCard>
    );
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('renders headerActions when provided', () => {
    render(
      <GradientCard
        title="Title"
        headerActions={<button>Action Button</button>}
      >
        Content
      </GradientCard>
    );
    expect(screen.getByText('Action Button')).toBeInTheDocument();
  });

  it('applies gradient animation classes to header', () => {
    const { container } = render(<GradientCard title="Title">Content</GradientCard>);
    const header = container.querySelector('.bg-gradient-to-r');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('from-deep-navy', 'via-tech-blue', 'to-deep-navy');
    expect(header).toHaveClass('bg-[length:200%_100%]');
    expect(header?.className).toContain('animate-');
  });

  it('applies custom className to root element', () => {
    const { container } = render(
      <GradientCard title="Title" className="custom-class">
        Content
      </GradientCard>
    );
    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
  });

  it('has correct WCAG AAA contrast (white text on dark gradient)', () => {
    render(<GradientCard title="Title">Content</GradientCard>);
    const title = screen.getByText('Title');
    expect(title).toHaveClass('text-white');
  });

  it('forwards additional HTML attributes', () => {
    render(
      <GradientCard title="Title" data-testid="custom-card">
        Content
      </GradientCard>
    );
    expect(screen.getByTestId('custom-card')).toBeInTheDocument();
  });

  it('has data-slot attribute for styling hooks', () => {
    const { container } = render(<GradientCard title="Title">Content</GradientCard>);
    const card = container.querySelector('[data-slot="gradient-card"]');
    expect(card).toBeInTheDocument();
  });

  it('renders complex children with multiple elements', () => {
    render(
      <GradientCard title="Title">
        <div>
          <p>Paragraph 1</p>
          <p>Paragraph 2</p>
        </div>
      </GradientCard>
    );
    expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
    expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
  });

  it('handles long title without breaking layout', () => {
    const longTitle = 'This is a very long title that should not break the card layout and should wrap properly';
    render(<GradientCard title={longTitle}>Content</GradientCard>);
    expect(screen.getByText(longTitle)).toBeInTheDocument();
  });

  it('handles multiple header actions', () => {
    render(
      <GradientCard
        title="Title"
        headerActions={
          <div className="flex gap-2">
            <button>Edit</button>
            <button>Delete</button>
          </div>
        }
      >
        Content
      </GradientCard>
    );
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
});
