import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { AulasListEmpty } from './AulasListEmpty';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('AulasListEmpty', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders motivational message', () => {
    render(<AulasListEmpty />);

    expect(screen.getByText(/Nenhuma aula registrada ainda/i)).toBeInTheDocument();
    expect(screen.getByText(/Comece fazendo upload da sua primeira aula e veja a mágica acontecer!/i)).toBeInTheDocument();
  });

  it('renders icon illustration with correct styling', () => {
    const { container } = render(<AulasListEmpty />);

    // IconSchool from Tabler renders as SVG
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('text-cyan-ai');
    expect(icon).toHaveClass('animate-pulse-subtle');
  });

  it('renders title with correct typography', () => {
    render(<AulasListEmpty />);

    const title = screen.getByRole('heading', { name: /Nenhuma aula registrada ainda/i });
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('text-2xl');
    expect(title).toHaveClass('font-montserrat');
    expect(title).toHaveClass('font-bold');
    expect(title).toHaveClass('text-deep-navy');
  });

  it('renders subtitle with correct styling', () => {
    render(<AulasListEmpty />);

    const subtitle = screen.getByText(/Comece fazendo upload/i);
    expect(subtitle).toHaveClass('text-deep-navy/80');
    expect(subtitle).toHaveClass('font-inter');
  });

  it('renders CTA button with correct label', () => {
    render(<AulasListEmpty />);

    const button = screen.getByRole('button', { name: /Nova Aula/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-tech-blue');
  });

  it('navigates to /aulas/upload on CTA click', async () => {
    const user = userEvent.setup();
    render(<AulasListEmpty />);

    const button = screen.getByRole('button', { name: /Nova Aula/i });
    await user.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/aulas/upload');
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('has accessible ARIA label on CTA button', () => {
    render(<AulasListEmpty />);

    const button = screen.getByRole('button', { name: /Fazer upload da primeira aula/i });
    expect(button).toBeInTheDocument();
  });

  it('applies correct layout classes', () => {
    const { container } = render(<AulasListEmpty />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex');
    expect(wrapper).toHaveClass('flex-col');
    expect(wrapper).toHaveClass('items-center');
    expect(wrapper).toHaveClass('justify-center');
    expect(wrapper).toHaveClass('min-h-[400px]');
    expect(wrapper).toHaveClass('gap-6');
  });

  it('icon has aria-hidden attribute', () => {
    const { container } = render(<AulasListEmpty />);

    const icon = container.querySelector('svg');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });
});
