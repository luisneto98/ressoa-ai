import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubmitButton } from './submit-button';
import { IconPlus } from '@tabler/icons-react';

describe('SubmitButton', () => {
  it('renders button with label', () => {
    render(<SubmitButton isLoading={false} label="Salvar" />);

    expect(screen.getByRole('button', { name: /Salvar/ })).toBeInTheDocument();
  });

  it('button has type="submit" by default', () => {
    render(<SubmitButton isLoading={false} label="Salvar" />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('button has min-h-[44px] for accessibility', () => {
    render(<SubmitButton isLoading={false} label="Salvar" />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('min-h-[44px]');
  });

  it('shows loading state with spinner and loading label', () => {
    render(
      <SubmitButton
        isLoading={true}
        label="Salvar"
        loadingLabel="Salvando..."
      />
    );

    const button = screen.getByRole('button', { name: /Salvando/ });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();

    // IconLoader2 should be present (has aria-hidden)
    const svg = button.querySelector('svg.animate-spin');
    expect(svg).toBeInTheDocument();
  });

  it('uses label as loadingLabel if loadingLabel not provided', () => {
    render(<SubmitButton isLoading={true} label="Salvar" />);

    const button = screen.getByRole('button', { name: /Salvar/ });
    expect(button).toBeInTheDocument();
  });

  it('button is disabled when isLoading=true', () => {
    render(<SubmitButton isLoading={true} label="Salvar" />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('button has aria-busy={true} when loading', () => {
    render(<SubmitButton isLoading={true} label="Salvar" />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('button has aria-busy={false} when not loading', () => {
    render(<SubmitButton isLoading={false} label="Salvar" />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'false');
  });

  it('button has opacity-50 and cursor-not-allowed when loading', () => {
    render(<SubmitButton isLoading={true} label="Salvar" />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('opacity-50');
    expect(button).toHaveClass('cursor-not-allowed');
  });

  it('supports custom icon when not loading', () => {
    render(
      <SubmitButton
        isLoading={false}
        label="Criar"
        icon={<IconPlus className="h-4 w-4 mr-2" data-testid="custom-icon" />}
      />
    );

    const icon = screen.getByTestId('custom-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('mr-2'); // Icon must have its own spacing
  });

  it('icon is hidden when loading (shows spinner instead)', () => {
    render(
      <SubmitButton
        isLoading={true}
        label="Criar"
        icon={<IconPlus className="h-4 w-4 mr-2" data-testid="custom-icon" />}
      />
    );

    expect(screen.queryByTestId('custom-icon')).not.toBeInTheDocument();

    // Spinner should be visible
    const button = screen.getByRole('button');
    const spinner = button.querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('supports different variants', () => {
    const { rerender } = render(
      <SubmitButton isLoading={false} label="Salvar" variant="default" />
    );

    let button = screen.getByRole('button');
    // Default variant has specific classes (from Button component)
    expect(button).toBeInTheDocument();

    rerender(<SubmitButton isLoading={false} label="Deletar" variant="destructive" />);
    button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('supports custom className', () => {
    render(
      <SubmitButton
        isLoading={false}
        label="Salvar"
        className="w-full bg-focus-orange"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('w-full');
    expect(button).toHaveClass('bg-focus-orange');
    expect(button).toHaveClass('min-h-[44px]'); // Still has base class
  });

  it('spinner has aria-hidden="true" for accessibility', () => {
    const { container } = render(
      <SubmitButton isLoading={true} label="Salvar" />
    );

    const spinner = container.querySelector('svg.animate-spin');
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
  });

  it('spinner has mr-2 spacing before text', () => {
    const { container } = render(
      <SubmitButton isLoading={true} label="Salvando" />
    );

    const spinner = container.querySelector('svg.animate-spin');
    expect(spinner).toHaveClass('mr-2');
    expect(spinner).toHaveClass('h-4');
    expect(spinner).toHaveClass('w-4');
  });
});
