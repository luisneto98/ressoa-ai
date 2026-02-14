import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AulasCardsDesktop } from './AulasCardsDesktop';
import type { AulaListItem } from '@/api/aulas';

// Mock useNavigate
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

const mockHandlers = {
  onViewDetails: vi.fn(),
  onReview: vi.fn(),
  onReprocess: vi.fn(),
  onDelete: vi.fn(),
  onStartAnalise: vi.fn(),
};

const createMockAula = (overrides?: Partial<AulaListItem>): AulaListItem => ({
  id: '1',
  turma_nome: 'Turma 6A',
  data: '2026-02-14T10:00:00Z',
  status_processamento: 'CRIADA',
  tipo_entrada: 'UPLOAD',
  duracao_minutos: null,
  observacoes: null,
  ...overrides,
});

describe('AulasCardsDesktop', () => {
  it('renders grid with correct responsive classes', () => {
    const aulas = [createMockAula()];
    const { container } = render(
      <AulasCardsDesktop aulas={aulas} {...mockHandlers} />
    );

    const grid = container.firstChild as HTMLElement;
    expect(grid).toHaveClass('hidden');
    expect(grid).toHaveClass('md:grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('md:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-3');
    expect(grid).toHaveClass('gap-6');
  });

  it('uses GradientCard for APROVADA status', () => {
    const aulas = [createMockAula({ id: '1', status_processamento: 'APROVADA' })];
    const { container } = render(
      <AulasCardsDesktop aulas={aulas} {...mockHandlers} />
    );

    // GradientCard has specific gradient background classes
    const gradientCard = container.querySelector('[class*="bg-gradient"]');
    expect(gradientCard).toBeInTheDocument();
  });

  it('uses standard Card for non-approved status', () => {
    const aulas = [createMockAula({ status_processamento: 'CRIADA' })];
    render(<AulasCardsDesktop aulas={aulas} {...mockHandlers} />);

    // Standard card should have CardHeader, CardContent, CardFooter structure
    expect(screen.getByText('Turma 6A')).toBeInTheDocument();
  });

  it('applies hover effect classes to all cards', () => {
    const aulas = [createMockAula(), createMockAula({ id: '2', status_processamento: 'APROVADA' })];
    const { container } = render(
      <AulasCardsDesktop aulas={aulas} {...mockHandlers} />
    );

    const cards = container.querySelectorAll('[class*="hover:scale-"]');
    expect(cards.length).toBe(2); // Both cards should have hover effect
    cards.forEach((card) => {
      expect(card).toHaveClass('hover:scale-[1.02]');
      expect(card).toHaveClass('hover:shadow-lg');
      expect(card).toHaveClass('transition-all');
      expect(card).toHaveClass('duration-200');
    });
  });

  it('renders status and type badges', () => {
    const aulas = [createMockAula()];
    render(<AulasCardsDesktop aulas={aulas} {...mockHandlers} />);

    // StatusBadge and TipoBadge should be rendered
    expect(screen.getByText('Criada')).toBeInTheDocument(); // StatusBadge label
  });

  it('shows correct action buttons for TRANSCRITA status', () => {
    const aulas = [createMockAula({ status_processamento: 'TRANSCRITA' })];
    render(<AulasCardsDesktop aulas={aulas} {...mockHandlers} />);

    expect(screen.getByRole('button', { name: /Detalhes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Analisar/i })).toBeInTheDocument();
  });

  it('shows correct action buttons for ANALISADA status', () => {
    const aulas = [createMockAula({ status_processamento: 'ANALISADA' })];
    render(<AulasCardsDesktop aulas={aulas} {...mockHandlers} />);

    expect(screen.getByRole('button', { name: /Detalhes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Revisar/i })).toBeInTheDocument();
  });

  it('shows correct action buttons for ERRO status', () => {
    const aulas = [createMockAula({ status_processamento: 'ERRO' })];
    render(<AulasCardsDesktop aulas={aulas} {...mockHandlers} />);

    expect(screen.getByRole('button', { name: /Detalhes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reprocessar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Excluir/i })).toBeInTheDocument();
  });

  it('shows correct action buttons for APROVADA status', () => {
    const aulas = [createMockAula({ status_processamento: 'APROVADA' })];
    render(<AulasCardsDesktop aulas={aulas} {...mockHandlers} />);

    expect(screen.getByRole('button', { name: /Detalhes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Revisar/i })).toBeInTheDocument();
  });

  it('has accessible ARIA labels on buttons', () => {
    const aulas = [createMockAula({ turma_nome: 'Turma 6A' })];
    render(<AulasCardsDesktop aulas={aulas} {...mockHandlers} />);

    const detailsButton = screen.getByRole('button', { name: /Visualizar detalhes da aula de Turma 6A/i });
    expect(detailsButton).toBeInTheDocument();
  });

  it('renders multiple cards in grid', () => {
    const aulas = [
      createMockAula({ id: '1', turma_nome: 'Turma 6A' }),
      createMockAula({ id: '2', turma_nome: 'Turma 7B' }),
      createMockAula({ id: '3', turma_nome: 'Turma 8C' }),
    ];
    render(<AulasCardsDesktop aulas={aulas} {...mockHandlers} />);

    expect(screen.getByText('Turma 6A')).toBeInTheDocument();
    expect(screen.getByText('Turma 7B')).toBeInTheDocument();
    expect(screen.getByText('Turma 8C')).toBeInTheDocument();
  });
});
