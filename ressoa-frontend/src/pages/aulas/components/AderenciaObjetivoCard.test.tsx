import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AderenciaObjetivoCard } from './AderenciaObjetivoCard';
import type { AderenciaObjetivoJson } from '@/lib/analise-adapter';

const mockAderenciaAlta: AderenciaObjetivoJson = {
  faixa_aderencia: 'ALTA',
  descricao_faixa: 'Entre 70% e 90% do objetivo declarado foi trabalhado',
  analise_qualitativa: 'O professor planejou trabalhar frações equivalentes com material concreto.',
  pontos_atingidos: ['Uso de exemplos visuais', 'Vocabulário técnico adequado'],
  pontos_nao_atingidos: ['Atividade em grupos não realizada'],
  recomendacao: 'Retomar a atividade em grupos na próxima aula.',
};

const mockDescricaoAula = 'Trabalhar frações equivalentes com material concreto';

describe('AderenciaObjetivoCard', () => {
  it('renderiza card com dados válidos', () => {
    render(<AderenciaObjetivoCard aderencia={mockAderenciaAlta} descricaoAula={mockDescricaoAula} />);

    expect(screen.getByText('Entre 70% e 90% do objetivo declarado foi trabalhado')).toBeInTheDocument();
    expect(screen.getByText('O professor planejou trabalhar frações equivalentes com material concreto.')).toBeInTheDocument();
    expect(screen.getByText('Retomar a atividade em grupos na próxima aula.')).toBeInTheDocument();
  });

  it('exibe badge de faixa BAIXA com cor vermelha', () => {
    const aderenciaBaixa: AderenciaObjetivoJson = { ...mockAderenciaAlta, faixa_aderencia: 'BAIXA' };
    render(<AderenciaObjetivoCard aderencia={aderenciaBaixa} descricaoAula={mockDescricaoAula} />);

    const badge = screen.getByText('Baixa');
    expect(badge.className).toContain('text-red-700');
  });

  it('exibe badge de faixa MEDIA com cor amber', () => {
    const aderenciaMedia: AderenciaObjetivoJson = { ...mockAderenciaAlta, faixa_aderencia: 'MEDIA' };
    render(<AderenciaObjetivoCard aderencia={aderenciaMedia} descricaoAula={mockDescricaoAula} />);

    const badge = screen.getByText('Média');
    expect(badge.className).toContain('text-amber-700');
  });

  it('exibe badge de faixa ALTA com cor azul', () => {
    render(<AderenciaObjetivoCard aderencia={mockAderenciaAlta} descricaoAula={mockDescricaoAula} />);

    const badge = screen.getByText('Alta');
    expect(badge.className).toContain('text-blue-700');
  });

  it('exibe badge de faixa TOTAL com cor verde', () => {
    const aderenciaTotal: AderenciaObjetivoJson = { ...mockAderenciaAlta, faixa_aderencia: 'TOTAL' };
    render(<AderenciaObjetivoCard aderencia={aderenciaTotal} descricaoAula={mockDescricaoAula} />);

    const badge = screen.getByText('Total');
    expect(badge.className).toContain('text-green-700');
  });

  it('exibe pontos_atingidos e pontos_nao_atingidos', () => {
    render(<AderenciaObjetivoCard aderencia={mockAderenciaAlta} descricaoAula={mockDescricaoAula} />);

    expect(screen.getByText('Uso de exemplos visuais')).toBeInTheDocument();
    expect(screen.getByText('Vocabulário técnico adequado')).toBeInTheDocument();
    expect(screen.getByText('Atividade em grupos não realizada')).toBeInTheDocument();
  });

  it('exibe descricaoAula como citação do professor', () => {
    render(<AderenciaObjetivoCard aderencia={mockAderenciaAlta} descricaoAula={mockDescricaoAula} />);

    const blockquote = screen.getByText(mockDescricaoAula);
    expect(blockquote.tagName).toBe('BLOCKQUOTE');
  });

  it('barra de progresso tem largura correta para faixa BAIXA', () => {
    const aderenciaBaixa: AderenciaObjetivoJson = { ...mockAderenciaAlta, faixa_aderencia: 'BAIXA' };
    const { container } = render(<AderenciaObjetivoCard aderencia={aderenciaBaixa} descricaoAula={mockDescricaoAula} />);

    const bar = container.querySelector('[style*="width: 25%"]');
    expect(bar).toBeInTheDocument();
  });

  it('barra de progresso tem largura correta para faixa MEDIA', () => {
    const aderenciaMedia: AderenciaObjetivoJson = { ...mockAderenciaAlta, faixa_aderencia: 'MEDIA' };
    const { container } = render(<AderenciaObjetivoCard aderencia={aderenciaMedia} descricaoAula={mockDescricaoAula} />);

    const bar = container.querySelector('[style*="width: 50%"]');
    expect(bar).toBeInTheDocument();
  });

  it('barra de progresso tem largura correta para faixa ALTA', () => {
    const { container } = render(<AderenciaObjetivoCard aderencia={mockAderenciaAlta} descricaoAula={mockDescricaoAula} />);

    const bar = container.querySelector('[style*="width: 75%"]');
    expect(bar).toBeInTheDocument();
  });

  it('barra de progresso tem largura correta para faixa TOTAL', () => {
    const aderenciaTotal: AderenciaObjetivoJson = { ...mockAderenciaAlta, faixa_aderencia: 'TOTAL' };
    const { container } = render(<AderenciaObjetivoCard aderencia={aderenciaTotal} descricaoAula={mockDescricaoAula} />);

    const bar = container.querySelector('[style*="width: 100%"]');
    expect(bar).toBeInTheDocument();
  });

  it('não renderiza nada quando aderencia é null', () => {
    const { container } = render(
      <AderenciaObjetivoCard aderencia={null as any} descricaoAula={mockDescricaoAula} />
    );
    expect(container.firstChild).toBeNull();
  });
});
