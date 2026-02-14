import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProcessingStatus, STEPS } from './processing-status';

describe('ProcessingStatus', () => {
  it('renders all 4 steps', () => {
    render(<ProcessingStatus currentStep={1} />);
    expect(screen.getByText('Enviando...')).toBeInTheDocument();
    expect(screen.getByText('Transcrevendo...')).toBeInTheDocument();
    expect(screen.getByText('Analisando...')).toBeInTheDocument();
    expect(screen.getByText('Pronto!')).toBeInTheDocument();
  });

  it('highlights current step with cyan color', () => {
    render(<ProcessingStatus currentStep={2} />);
    const currentStepLabel = screen.getByText('Transcrevendo...');
    expect(currentStepLabel).toHaveClass('text-cyan-ai', 'font-semibold');
  });

  it('marks completed steps with tech blue color', () => {
    render(<ProcessingStatus currentStep={3} />);
    const completedStepLabel = screen.getByText('Enviando...');
    expect(completedStepLabel).toHaveClass('text-tech-blue');
  });

  it('marks pending steps with gray color', () => {
    render(<ProcessingStatus currentStep={2} />);
    const pendingStepLabel = screen.getByText('Pronto!');
    expect(pendingStepLabel).toHaveClass('text-gray-500');
  });

  it('has progressbar ARIA role', () => {
    render(<ProcessingStatus currentStep={2} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
  });

  it('has correct ARIA attributes for step 1', () => {
    render(<ProcessingStatus currentStep={1} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '1');
    expect(progressbar).toHaveAttribute('aria-valuemin', '1');
    expect(progressbar).toHaveAttribute('aria-valuemax', '4');
    expect(progressbar).toHaveAttribute('aria-label', 'Progresso de processamento: Enviando...');
  });

  it('has correct ARIA attributes for step 3', () => {
    render(<ProcessingStatus currentStep={3} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '3');
    expect(progressbar).toHaveAttribute('aria-label', 'Progresso de processamento: Analisando...');
  });

  it('applies pulse animation to current step icon', () => {
    const { container } = render(<ProcessingStatus currentStep={2} />);
    const icons = container.querySelectorAll('.animate-pulse-subtle');
    // Should have exactly 1 pulsing icon (current step)
    expect(icons.length).toBe(1);
  });

  it('applies custom className to root element', () => {
    const { container } = render(<ProcessingStatus currentStep={1} className="custom-class" />);
    const root = container.querySelector('.custom-class');
    expect(root).toBeInTheDocument();
  });

  it('renders icons for all steps', () => {
    const { container } = render(<ProcessingStatus currentStep={1} />);
    // Check for SVG icons (Tabler icons are SVGs)
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(4); // At least 4 icons
  });

  it('forwards additional HTML attributes', () => {
    render(<ProcessingStatus currentStep={1} data-testid="custom-status" />);
    expect(screen.getByTestId('custom-status')).toBeInTheDocument();
  });

  it('exports STEPS constant for external use', () => {
    expect(STEPS).toHaveLength(4);
    expect(STEPS[0].label).toBe('Enviando...');
    expect(STEPS[3].label).toBe('Pronto!');
  });

  describe('step progression', () => {
    it('step 1: only first step is current', () => {
      render(<ProcessingStatus currentStep={1} />);
      expect(screen.getByText('Enviando...')).toHaveClass('text-cyan-ai');
      expect(screen.getByText('Transcrevendo...')).toHaveClass('text-gray-500');
    });

    it('step 2: first complete, second current, rest pending', () => {
      render(<ProcessingStatus currentStep={2} />);
      expect(screen.getByText('Enviando...')).toHaveClass('text-tech-blue');
      expect(screen.getByText('Transcrevendo...')).toHaveClass('text-cyan-ai');
      expect(screen.getByText('Analisando...')).toHaveClass('text-gray-500');
    });

    it('step 4: all complete except last which is current', () => {
      render(<ProcessingStatus currentStep={4} />);
      expect(screen.getByText('Enviando...')).toHaveClass('text-tech-blue');
      expect(screen.getByText('Transcrevendo...')).toHaveClass('text-tech-blue');
      expect(screen.getByText('Analisando...')).toHaveClass('text-tech-blue');
      expect(screen.getByText('Pronto!')).toHaveClass('text-cyan-ai');
    });
  });
});
