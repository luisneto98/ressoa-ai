import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UploadProgressBar } from './UploadProgressBar';

describe('UploadProgressBar', () => {
  it('should render progress bar with correct percentage', () => {
    render(<UploadProgressBar progress={45} />);

    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '45');
  });

  it('should display upload speed when provided', () => {
    const uploadSpeed = 5 * 1024 * 1024; // 5 MB/s
    render(<UploadProgressBar progress={50} uploadSpeed={uploadSpeed} />);

    expect(screen.getByText(/5\.0 MB\/s/)).toBeInTheDocument();
  });

  it('should display time remaining when >30s', () => {
    render(<UploadProgressBar progress={30} timeRemaining={120} />);

    // 120 seconds = 2 minutes
    expect(screen.getByText(/~2 minutos/)).toBeInTheDocument();
  });

  it('should NOT display time remaining when ≤30s', () => {
    render(<UploadProgressBar progress={90} timeRemaining={20} />);

    expect(screen.queryByText(/restantes/)).not.toBeInTheDocument();
  });

  it('should NOT display time remaining when null', () => {
    render(<UploadProgressBar progress={50} timeRemaining={null} />);

    expect(screen.queryByText(/restantes/)).not.toBeInTheDocument();
  });

  it('should render gradient bar with correct width', () => {
    const { container } = render(<UploadProgressBar progress={75} />);

    const gradientBar = container.querySelector('[role="progressbar"]') as HTMLElement;
    expect(gradientBar).toHaveStyle({ width: '75%' });
  });

  it('should clamp progress to 0-100 range', () => {
    const { rerender, container } = render(<UploadProgressBar progress={-10} />);

    let gradientBar = container.querySelector('[role="progressbar"]') as HTMLElement;
    expect(gradientBar).toHaveStyle({ width: '0%' });

    rerender(<UploadProgressBar progress={150} />);
    gradientBar = container.querySelector('[role="progressbar"]') as HTMLElement;
    expect(gradientBar).toHaveStyle({ width: '100%' });
  });

  it('should format time remaining in seconds when <60s', () => {
    render(<UploadProgressBar progress={85} timeRemaining={45} />);

    expect(screen.getByText(/~45s/)).toBeInTheDocument();
  });

  it('should format upload speed in KB/s when <1MB/s', () => {
    const uploadSpeed = 500 * 1024; // 500 KB/s
    render(<UploadProgressBar progress={20} uploadSpeed={uploadSpeed} />);

    expect(screen.getByText(/500\.0 KB\/s/)).toBeInTheDocument();
  });

  it('should have correct ARIA attributes', () => {
    render(<UploadProgressBar progress={60} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '60');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('should apply animate-gradient-x class', () => {
    const { container } = render(<UploadProgressBar progress={50} />);

    const gradientBar = container.querySelector('.animate-gradient-x');
    expect(gradientBar).toBeInTheDocument();
  });

  // Edge case tests
  it('should handle upload speed = 0 (network stalled)', () => {
    render(<UploadProgressBar progress={50} uploadSpeed={0} />);

    // Should NOT crash, but also should NOT display speed
    expect(screen.queryByText(/0\.0/)).not.toBeInTheDocument();
  });

  it('should handle very high progress values gracefully', () => {
    const { container } = render(<UploadProgressBar progress={999} />);

    const gradientBar = container.querySelector('[role="progressbar"]') as HTMLElement;
    // Should clamp to 100%
    expect(gradientBar).toHaveStyle({ width: '100%' });
    expect(screen.getByText('999%')).toBeInTheDocument(); // Display shows raw value
  });

  it('should handle negative time remaining', () => {
    render(<UploadProgressBar progress={95} timeRemaining={-10} />);

    // Should NOT display negative time
    expect(screen.queryByText(/restantes/)).not.toBeInTheDocument();
  });
});
