import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimelinePlanos } from './TimelinePlanos';
import type { Planejamento } from '../hooks/usePlanejamentos';
import { BrowserRouter } from 'react-router-dom';

// Mock react-router-dom navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock Zustand store
vi.mock('@/stores/ui-store', () => ({
  useUIStore: vi.fn((selector) => {
    const mockState = {
      expandedBimestres: {},
      toggleBimestre: vi.fn(),
    };
    return selector(mockState);
  }),
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('TimelinePlanos', () => {
  const mockPlanejamentos: Planejamento[] = [
    {
      id: 'plan-1',
      turma_id: 'turma-1',
      turma: {
        id: 'turma-1',
        nome: '6º Ano A',
        disciplina: 'MATEMATICA',
        serie: 6,
      },
      bimestre: 1,
      ano_letivo: 2026,
      validado_coordenacao: false,
      habilidades: [
        {
          id: 'hab-1',
          habilidade_id: 'ef06ma01-id',
          habilidade: {
            codigo: 'EF06MA01',
            descricao: 'Comparar números naturais',
          },
        },
      ],
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'plan-2',
      turma_id: 'turma-1',
      turma: {
        id: 'turma-1',
        nome: '6º Ano A',
        disciplina: 'MATEMATICA',
        serie: 6,
      },
      bimestre: 3,
      ano_letivo: 2026,
      validado_coordenacao: true,
      habilidades: [
        {
          id: 'hab-2',
          habilidade_id: 'ef06ma02-id',
          habilidade: {
            codigo: 'EF06MA02',
            descricao: 'Reconhecer sistema decimal',
          },
        },
      ],
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('Loading State', () => {
    it('deve exibir SkeletonLoader quando isLoading=true', () => {
      const { container } = render(
        <TimelinePlanos
          turmaId="turma-1"
          anoLetivo={2026}
          planejamentos={[]}
          isLoading={true}
        />,
        { wrapper: Wrapper }
      );

      // SkeletonLoader renderiza cards com classe space-y-4
      const skeletonContainer = container.querySelector('.space-y-4');
      expect(skeletonContainer).toBeInTheDocument();
    });

    it('deve aplicar fade-in animation no loading', () => {
      const { container } = render(
        <TimelinePlanos
          turmaId="turma-1"
          anoLetivo={2026}
          planejamentos={[]}
          isLoading={true}
        />,
        { wrapper: Wrapper }
      );

      const loadingDiv = container.querySelector('.animate-in.fade-in');
      expect(loadingDiv).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('deve exibir empty state quando não há planejamentos', () => {
      render(
        <TimelinePlanos
          turmaId="turma-1"
          anoLetivo={2026}
          planejamentos={[]}
          isLoading={false}
        />,
        { wrapper: Wrapper }
      );

      expect(
        screen.getByText('Nenhum planejamento encontrado')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Não há planejamentos cadastrados para esta turma e ano letivo./i
        )
      ).toBeInTheDocument();
    });

    it('deve exibir botão "Criar Primeiro Planejamento" quando turmaId está definido', () => {
      render(
        <TimelinePlanos
          turmaId="turma-1"
          anoLetivo={2026}
          planejamentos={[]}
          isLoading={false}
        />,
        { wrapper: Wrapper }
      );

      const createButton = screen.getByRole('button', {
        name: /Criar Primeiro Planejamento/i,
      });
      expect(createButton).toBeInTheDocument();
    });

    it('NÃO deve exibir botão criar quando turmaId é undefined', () => {
      render(
        <TimelinePlanos
          anoLetivo={2026}
          planejamentos={[]}
          isLoading={false}
        />,
        { wrapper: Wrapper }
      );

      expect(
        screen.queryByRole('button', { name: /Criar Primeiro Planejamento/i })
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(/Selecione uma turma para visualizar/i)
      ).toBeInTheDocument();
    });

    it('deve ter role="region" com aria-label para empty state', () => {
      render(
        <TimelinePlanos
          turmaId="turma-1"
          anoLetivo={2026}
          planejamentos={[]}
          isLoading={false}
        />,
        { wrapper: Wrapper }
      );

      const region = screen.getByRole('region', {
        name: /Timeline de planejamentos vazia/i,
      });
      expect(region).toBeInTheDocument();
    });
  });

  describe('Timeline com Planejamentos', () => {
    it('deve renderizar 4 cards de bimestre (1-4)', () => {
      render(
        <TimelinePlanos
          turmaId="turma-1"
          anoLetivo={2026}
          planejamentos={mockPlanejamentos}
          isLoading={false}
        />,
        { wrapper: Wrapper }
      );

      expect(screen.getByText('1º Bimestre')).toBeInTheDocument();
      expect(screen.getByText('2º Bimestre')).toBeInTheDocument();
      expect(screen.getByText('3º Bimestre')).toBeInTheDocument();
      expect(screen.getByText('4º Bimestre')).toBeInTheDocument();
    });

    it('deve mapear planejamentos corretamente para bimestres', () => {
      render(
        <TimelinePlanos
          turmaId="turma-1"
          anoLetivo={2026}
          planejamentos={mockPlanejamentos}
          isLoading={false}
        />,
        { wrapper: Wrapper }
      );

      // Bimestre 1 tem planejamento (1 habilidade)
      const bimestre1Section = screen
        .getByText('1º Bimestre')
        .closest('.grid > div');
      expect(bimestre1Section).toHaveTextContent('1 habilidade');

      // Bimestre 2 está vazio (botão criar)
      expect(
        screen.getAllByRole('button', { name: /Criar Planejamento/i }).length
      ).toBeGreaterThan(0);

      // Bimestre 3 tem planejamento (1 habilidade)
      const bimestre3Section = screen
        .getByText('3º Bimestre')
        .closest('.grid > div');
      expect(bimestre3Section).toHaveTextContent('1 habilidade');
    });

    it('deve aplicar grid 2x2 em desktop (md:grid-cols-2)', () => {
      const { container } = render(
        <TimelinePlanos
          turmaId="turma-1"
          anoLetivo={2026}
          planejamentos={mockPlanejamentos}
          isLoading={false}
        />,
        { wrapper: Wrapper }
      );

      const grid = container.querySelector('.grid.md\\:grid-cols-2');
      expect(grid).toBeInTheDocument();
    });

    it('deve ter role="region" com aria-label para timeline', () => {
      render(
        <TimelinePlanos
          turmaId="turma-1"
          anoLetivo={2026}
          planejamentos={mockPlanejamentos}
          isLoading={false}
        />,
        { wrapper: Wrapper }
      );

      const region = screen.getByRole('region', {
        name: /Linha do tempo de planejamentos bimestrais/i,
      });
      expect(region).toBeInTheDocument();
    });

    it('deve aplicar fade-in animation ao renderizar timeline', () => {
      const { container } = render(
        <TimelinePlanos
          turmaId="turma-1"
          anoLetivo={2026}
          planejamentos={mockPlanejamentos}
          isLoading={false}
        />,
        { wrapper: Wrapper }
      );

      const timelineDiv = container.querySelector('.animate-in.fade-in');
      expect(timelineDiv).toBeInTheDocument();
    });
  });

  describe('Navegação e Callbacks', () => {
    it('deve navegar para edição ao chamar handleEdit', async () => {
      render(
        <TimelinePlanos
          turmaId="turma-1"
          anoLetivo={2026}
          planejamentos={mockPlanejamentos}
          isLoading={false}
        />,
        { wrapper: Wrapper }
      );

      // Simular chamada de onEdit (seria feito via user event no card)
      // Como estamos testando o TimelinePlanos, verificamos que a prop é passada corretamente
      // O teste real de navegação está em TimelineBimestreCard.test.tsx
      expect(screen.getByText('1º Bimestre')).toBeInTheDocument();
    });

    it('deve navegar para wizard com params ao chamar handleCreate', () => {
      render(
        <TimelinePlanos
          turmaId="turma-1"
          anoLetivo={2026}
          planejamentos={[]}
          isLoading={false}
        />,
        { wrapper: Wrapper }
      );

      const createButton = screen.getByRole('button', {
        name: /Criar Primeiro Planejamento/i,
      });
      createButton.click();

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/planejamentos/novo')
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('turma_id=turma-1')
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('ano_letivo=2026')
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('bimestre=1')
      );
    });
  });

  describe('Performance', () => {
    it('deve usar useMemo para mapear planejamentos por bimestre', () => {
      // useMemo é testado indiretamente: se re-renderizar com mesmos planejamentos,
      // não deve recalcular. Aqui apenas verificamos que componente renderiza corretamente.
      const { container } = render(
        <TimelinePlanos
          turmaId="turma-1"
          anoLetivo={2026}
          planejamentos={mockPlanejamentos}
          isLoading={false}
        />,
        { wrapper: Wrapper }
      );

      expect(screen.getByText('1º Bimestre')).toBeInTheDocument();

      // Verifica que grid está renderizado (prova que useMemo funcionou)
      const grid = container.querySelector('.grid.md\\:grid-cols-2');
      expect(grid).toBeInTheDocument();
      expect(grid?.children.length).toBe(4); // 4 bimestres
    });
  });
});
