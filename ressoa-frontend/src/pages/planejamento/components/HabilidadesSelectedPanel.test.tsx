import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HabilidadesSelectedPanel } from './HabilidadesSelectedPanel';
import type { Habilidade } from '../hooks/usePlanejamentoWizard';

describe('HabilidadesSelectedPanel - Story 10.5: EM Badge', () => {
  const mockOnRemove = vi.fn();

  const habilidadeEF: Habilidade = {
    id: 'hab-ef-1',
    codigo: 'EF06MA01',
    descricao: 'Comparar números naturais...',
    unidade_tematica: 'Números',
  };

  const habilidadeEM: Habilidade = {
    id: 'hab-em-1',
    codigo: 'EM13MAT101',
    descricao: 'Interpretar situações econômicas...',
    competencia_especifica: 'Competência Específica 1',
    metadata: {
      area_conhecimento: 'Matemática e suas Tecnologias',
    },
  };

  describe('AC7: Badge "EM" rendering', () => {
    it('should render badge "EM" when codigo starts with EM13', () => {
      // Act
      render(
        <HabilidadesSelectedPanel
          habilidades={[habilidadeEM]}
          onRemove={mockOnRemove}
        />
      );

      // Assert
      expect(screen.getByLabelText('Ensino Médio')).toBeInTheDocument();
      expect(screen.getByText('EM')).toBeInTheDocument();
    });

    it('should NOT render badge when codigo is EF* (Fundamental)', () => {
      // Act
      render(
        <HabilidadesSelectedPanel
          habilidades={[habilidadeEF]}
          onRemove={mockOnRemove}
        />
      );

      // Assert
      expect(screen.queryByLabelText('Ensino Médio')).not.toBeInTheDocument();
      expect(screen.queryByText(/^EM$/)).not.toBeInTheDocument();
    });

    it('should render multiple habilidades with correct badge states', () => {
      // Act
      render(
        <HabilidadesSelectedPanel
          habilidades={[habilidadeEF, habilidadeEM]}
          onRemove={mockOnRemove}
        />
      );

      // Assert
      // EF habilidade should NOT have badge
      const efItem = screen.getByText('EF06MA01').closest('li');
      expect(efItem).toBeInTheDocument();
      expect(efItem?.querySelector('[aria-label="Ensino Médio"]')).toBeNull();

      // EM habilidade should have badge
      const emItem = screen.getByText('EM13MAT101').closest('li');
      expect(emItem).toBeInTheDocument();
      expect(
        emItem?.querySelector('[aria-label="Ensino Médio"]')
      ).toBeInTheDocument();
    });
  });

  describe('Badge styling and accessibility', () => {
    it('should have purple styling for EM badge', () => {
      // Act
      render(
        <HabilidadesSelectedPanel
          habilidades={[habilidadeEM]}
          onRemove={mockOnRemove}
        />
      );

      // Assert
      const badge = screen.getByLabelText('Ensino Médio');
      expect(badge).toHaveClass('bg-purple-100', 'text-purple-700');
    });

    it('should have aria-label for screen readers', () => {
      // Act
      render(
        <HabilidadesSelectedPanel
          habilidades={[habilidadeEM]}
          onRemove={mockOnRemove}
        />
      );

      // Assert
      const badge = screen.getByLabelText('Ensino Médio');
      expect(badge).toHaveAccessibleName('Ensino Médio');
    });

    it('should have icon with aria-hidden', () => {
      // Act
      render(
        <HabilidadesSelectedPanel
          habilidades={[habilidadeEM]}
          onRemove={mockOnRemove}
        />
      );

      // Assert
      const badge = screen.getByLabelText('Ensino Médio');
      const icon = badge.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should call onRemove when remove button is clicked on EM habilidade', async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(
        <HabilidadesSelectedPanel
          habilidades={[habilidadeEM]}
          onRemove={mockOnRemove}
        />
      );

      const removeButton = screen.getByLabelText('Remover EM13MAT101');
      await user.click(removeButton);

      // Assert
      expect(mockOnRemove).toHaveBeenCalledWith('hab-em-1');
    });

    it('should display codigo and descricao for EM habilidade', () => {
      // Act
      render(
        <HabilidadesSelectedPanel
          habilidades={[habilidadeEM]}
          onRemove={mockOnRemove}
        />
      );

      // Assert
      expect(screen.getByText('EM13MAT101')).toBeInTheDocument();
      expect(
        screen.getByText(/Interpretar situações econômicas/)
      ).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should show empty message when no habilidades selected', () => {
      // Act
      render(
        <HabilidadesSelectedPanel habilidades={[]} onRemove={mockOnRemove} />
      );

      // Assert
      expect(
        screen.getByText(/Selecione habilidades na lista ao lado/)
      ).toBeInTheDocument();
    });
  });
});
