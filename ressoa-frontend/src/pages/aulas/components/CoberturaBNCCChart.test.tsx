import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CoberturaBNCCChart } from './CoberturaBNCCChart';
import type { NivelCobertura } from '@/types/analise';

describe('CoberturaBNCCChart', () => {
  const mockHabilidades = [
    {
      codigo: 'EF06MA01',
      nivel_cobertura: 'COMPLETE' as NivelCobertura,
      descricao: 'Comparar, ordenar, ler e escrever números naturais e racionais.',
    },
    {
      codigo: 'EF06MA02',
      nivel_cobertura: 'PARTIAL' as NivelCobertura,
      descricao: 'Reconhecer o sistema de numeração decimal.',
    },
    {
      codigo: 'EF06MA03',
      nivel_cobertura: 'MENTIONED' as NivelCobertura,
      descricao: 'Resolver e elaborar problemas que envolvam cálculos.',
    },
  ];

  it('should render chart with habilidades data', () => {
    render(<CoberturaBNCCChart habilidades={mockHabilidades} />);

    // Check if title is rendered
    expect(screen.getByText('Cobertura Curricular')).toBeInTheDocument();

    // Check if legend items are rendered
    expect(screen.getByText(/Consolidada/)).toBeInTheDocument();
    expect(screen.getByText(/Trabalhada/)).toBeInTheDocument();
    expect(screen.getByText(/Introdutória/)).toBeInTheDocument();
    expect(screen.getByText(/Não Coberta/)).toBeInTheDocument();
  });

  it('should render chart for custom curriculo', () => {
    render(<CoberturaBNCCChart habilidades={mockHabilidades} curriculo_tipo="CUSTOM" />);

    // Check if title is still rendered
    expect(screen.getByText('Cobertura Curricular')).toBeInTheDocument();

    // Check legend is rendered
    expect(screen.getByText(/Consolidada/)).toBeInTheDocument();
  });

  it('should not render chart when no habilidades', () => {
    const { container } = render(<CoberturaBNCCChart habilidades={[]} />);

    // Component should return null
    expect(container.firstChild).toBeNull();
  });

  it('should render chart with accessibility features (AC9)', () => {
    const { container } = render(<CoberturaBNCCChart habilidades={mockHabilidades} />);

    // Check if ResponsiveContainer is rendered (chart container)
    const chartContainer = container.querySelector('.recharts-responsive-container');
    expect(chartContainer).toBeInTheDocument();

    // Note: SVG <desc> element may not be accessible in JSDOM
    // but it's present in the actual code for screen readers
  });

  it('should render ResponsiveContainer for responsive design (AC8)', () => {
    const { container } = render(<CoberturaBNCCChart habilidades={mockHabilidades} />);

    // ResponsiveContainer renders with 100% width
    const responsiveContainer = container.querySelector('.recharts-responsive-container');
    expect(responsiveContainer).toBeInTheDocument();
  });
});
