import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UploadErrorCard } from './UploadErrorCard';

describe('UploadErrorCard', () => {
  it('should render file-corrupt error message', () => {
    render(<UploadErrorCard errorType="file-corrupt" />);

    expect(screen.getByText('Não conseguimos processar este áudio')).toBeInTheDocument();
    expect(screen.getByText(/arquivo pode estar corrompido/i)).toBeInTheDocument();
  });

  it('should render network-timeout error message', () => {
    render(<UploadErrorCard errorType="network-timeout" />);

    expect(screen.getByText('Upload interrompido')).toBeInTheDocument();
    expect(screen.getByText(/conexão pode estar instável/i)).toBeInTheDocument();
  });

  it('should render invalid-format error message', () => {
    render(<UploadErrorCard errorType="invalid-format" />);

    expect(screen.getByText('Formato de arquivo não suportado')).toBeInTheDocument();
    expect(screen.getByText(/MP3, WAV, M4A ou WEBM/i)).toBeInTheDocument();
  });

  it('should render generic error message', () => {
    render(<UploadErrorCard errorType="generic" />);

    expect(screen.getByText('Erro no upload')).toBeInTheDocument();
  });

  it('should use custom message when provided', () => {
    render(<UploadErrorCard errorType="generic" message="Custom error message" />);

    expect(screen.getByText(/Custom error message/)).toBeInTheDocument();
  });

  it('should render retry button for file-corrupt error', () => {
    const onRetry = vi.fn();
    render(<UploadErrorCard errorType="file-corrupt" onRetry={onRetry} />);

    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
  });

  it('should render choose another button for file-corrupt error', () => {
    const onChooseAnother = vi.fn();
    render(<UploadErrorCard errorType="file-corrupt" onChooseAnother={onChooseAnother} />);

    expect(screen.getByRole('button', { name: /escolher outro arquivo/i })).toBeInTheDocument();
  });

  it('should render manual entry button for file-corrupt error', () => {
    const onManualEntry = vi.fn();
    render(<UploadErrorCard errorType="file-corrupt" onManualEntry={onManualEntry} />);

    expect(screen.getByRole('button', { name: /digitar resumo manual/i })).toBeInTheDocument();
  });

  it('should call onRetry when retry button clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<UploadErrorCard errorType="network-timeout" onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: /tentar novamente/i });
    await user.click(retryButton);

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('should call onChooseAnother when choose another button clicked', async () => {
    const user = userEvent.setup();
    const onChooseAnother = vi.fn();
    render(<UploadErrorCard errorType="invalid-format" onChooseAnother={onChooseAnother} />);

    const chooseButton = screen.getByRole('button', { name: /escolher outro arquivo/i });
    await user.click(chooseButton);

    expect(onChooseAnother).toHaveBeenCalledOnce();
  });

  it('should call onManualEntry when manual entry button clicked', async () => {
    const user = userEvent.setup();
    const onManualEntry = vi.fn();
    render(<UploadErrorCard errorType="invalid-format" onManualEntry={onManualEntry} />);

    const manualButton = screen.getByRole('button', { name: /digitar resumo manual/i });
    await user.click(manualButton);

    expect(onManualEntry).toHaveBeenCalledOnce();
  });

  it('should have role="alert" for screen readers', () => {
    const { container } = render(<UploadErrorCard errorType="generic" />);

    const alertElement = container.querySelector('[role="alert"]');
    expect(alertElement).toBeInTheDocument();
  });

  it('should have aria-live="assertive" for urgent announcements', () => {
    const { container } = render(<UploadErrorCard errorType="generic" />);

    const liveElement = container.querySelector('[aria-live="assertive"]');
    expect(liveElement).toBeInTheDocument();
  });

  it('should use Focus Orange color (empathetic, not red)', () => {
    const { container } = render(<UploadErrorCard errorType="generic" />);

    // Card should have focus-orange border (not red)
    const card = container.querySelector('.border-focus-orange\\/50');
    expect(card).toBeInTheDocument();
  });

  it('should have min-height 44px buttons for touch accessibility', () => {
    const onRetry = vi.fn();
    render(<UploadErrorCard errorType="network-timeout" onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: /tentar novamente/i });
    expect(retryButton).toHaveClass('min-h-[44px]');
  });

  it('should NOT render retry button if callback not provided', () => {
    render(<UploadErrorCard errorType="network-timeout" />);

    expect(screen.queryByRole('button', { name: /tentar novamente/i })).not.toBeInTheDocument();
  });

  it('should render cancel button for network-timeout error', () => {
    const onDismiss = vi.fn();
    render(<UploadErrorCard errorType="network-timeout" onDismiss={onDismiss} />);

    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });
});
