import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from './StatusBadge';

// Mock radix tooltip
vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('StatusBadge', () => {
  // ─────────────────────────────────────────────────────────────
  // Story 16.2: RASCUNHO state
  // ─────────────────────────────────────────────────────────────

  it('deve renderizar badge RASCUNHO corretamente', () => {
    render(<StatusBadge status="RASCUNHO" />);
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
  });

  it('deve incluir tooltip para RASCUNHO', () => {
    render(<StatusBadge status="RASCUNHO" />);
    expect(
      screen.getByText('Aula planejada, aguardando envio de áudio ou texto'),
    ).toBeInTheDocument();
  });

  it('não deve quebrar com status RASCUNHO — Record<StatusProcessamento,...> deve incluir o estado', () => {
    // This test verifies TypeScript won't fail at runtime
    expect(() => render(<StatusBadge status="RASCUNHO" />)).not.toThrow();
  });

  // ─────────────────────────────────────────────────────────────
  // Existing states still work
  // ─────────────────────────────────────────────────────────────

  it('deve renderizar badge CRIADA corretamente', () => {
    render(<StatusBadge status="CRIADA" />);
    expect(screen.getByText('Criada')).toBeInTheDocument();
  });

  it('deve renderizar badge APROVADA corretamente', () => {
    render(<StatusBadge status="APROVADA" />);
    expect(screen.getByText('Aprovada')).toBeInTheDocument();
  });

  it('deve renderizar badge ERRO corretamente', () => {
    render(<StatusBadge status="ERRO" />);
    expect(screen.getByText('Erro')).toBeInTheDocument();
  });
});
