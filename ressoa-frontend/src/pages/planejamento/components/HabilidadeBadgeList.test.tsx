import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HabilidadeBadgeList } from './HabilidadeBadgeList';
import userEvent from '@testing-library/user-event';

describe('HabilidadeBadgeList', () => {
  const mockHabilidades = [
    {
      id: 'hab-1',
      habilidade_id: 'ef06ma01-id',
      habilidade: {
        codigo: 'EF06MA01',
        descricao:
          'Comparar, ordenar, ler e escrever números naturais e números racionais',
      },
      peso: 2,
      aulas_previstas: 3,
    },
    {
      id: 'hab-2',
      habilidade_id: 'ef06ma02-id',
      habilidade: {
        codigo: 'EF06MA02',
        descricao: 'Reconhecer o sistema de numeração decimal',
      },
      peso: 3,
      aulas_previstas: 2,
    },
  ];

  it('deve renderizar lista de habilidades com badges', () => {
    render(<HabilidadeBadgeList habilidades={mockHabilidades} />);

    // Verifica que ambos os badges são renderizados
    expect(screen.getByText('EF06MA01')).toBeInTheDocument();
    expect(screen.getByText('EF06MA02')).toBeInTheDocument();
  });

  it('deve renderizar role="list" e role="listitem" para acessibilidade', () => {
    const { container } = render(
      <HabilidadeBadgeList habilidades={mockHabilidades} />
    );

    const list = container.querySelector('[role="list"]');
    expect(list).toBeInTheDocument();

    const listItems = container.querySelectorAll('[role="listitem"]');
    expect(listItems).toHaveLength(2);
  });

  it('deve exibir mensagem quando não há habilidades', () => {
    render(<HabilidadeBadgeList habilidades={[]} />);

    expect(
      screen.getByText('Nenhuma habilidade planejada')
    ).toBeInTheDocument();
  });

  it('deve exibir tooltip com descrição completa ao hover', async () => {
    const user = userEvent.setup();
    render(<HabilidadeBadgeList habilidades={mockHabilidades} />);

    const badge = screen.getByText('EF06MA01');
    await user.hover(badge);

    // Tooltip deve aparecer com descrição (pode aparecer múltiplas vezes por duplicação do Radix)
    const tooltips = await screen.findAllByText(/Comparar, ordenar, ler e escrever/i);
    expect(tooltips.length).toBeGreaterThan(0);
  });

  it('deve exibir metadados de aulas_previstas e peso no tooltip', async () => {
    const user = userEvent.setup();
    render(<HabilidadeBadgeList habilidades={mockHabilidades} />);

    const badge = screen.getByText('EF06MA01');
    await user.hover(badge);

    // Tooltip deve mostrar aulas previstas e peso
    const aulasTexts = await screen.findAllByText(/3 aulas previstas/i);
    expect(aulasTexts.length).toBeGreaterThan(0);
    const pesoTexts = await screen.findAllByText(/Peso Médio/i);
    expect(pesoTexts.length).toBeGreaterThan(0);
  });

  it('deve exibir peso como "Alto" quando peso=3', async () => {
    const user = userEvent.setup();
    render(<HabilidadeBadgeList habilidades={mockHabilidades} />);

    const badge = screen.getByText('EF06MA02');
    await user.hover(badge);

    const altoTexts = await screen.findAllByText(/Peso Alto/i);
    expect(altoTexts.length).toBeGreaterThan(0);
  });

  it('deve aplicar transição hover:scale-105 em badges', () => {
    const { container } = render(
      <HabilidadeBadgeList habilidades={mockHabilidades} />
    );

    const badge = container.querySelector('.hover\\:scale-105');
    expect(badge).toBeInTheDocument();
  });

  it('deve usar AIBadge variant="skill" size="sm"', () => {
    const { container } = render(
      <HabilidadeBadgeList habilidades={mockHabilidades} />
    );

    // AIBadge com variant="skill" usa bg-cyan-ai
    const skillBadges = container.querySelectorAll('.bg-cyan-ai');
    expect(skillBadges.length).toBeGreaterThan(0);
  });

  it('não deve renderizar tooltip para habilidade sem aulas_previstas e peso', async () => {
    const habilidadeSemMetadados = [
      {
        id: 'hab-3',
        habilidade_id: 'ef06ma03-id',
        habilidade: {
          codigo: 'EF06MA03',
          descricao: 'Habilidade teste',
        },
        // Sem peso e aulas_previstas
      },
    ];

    const user = userEvent.setup();
    render(<HabilidadeBadgeList habilidades={habilidadeSemMetadados} />);

    const badge = screen.getByText('EF06MA03');
    await user.hover(badge);

    // Tooltip deve aparecer mas sem seção de metadados
    const habTexts = await screen.findAllByText('Habilidade teste');
    expect(habTexts.length).toBeGreaterThan(0);
    expect(screen.queryByText(/aulas previstas/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Peso/i)).not.toBeInTheDocument();
  });
});
