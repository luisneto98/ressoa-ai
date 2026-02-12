import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ForgotPasswordPage } from './ForgotPasswordPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ForgotPasswordPage', () => {
  it('should render placeholder message', () => {
    render(
      <BrowserRouter>
        <ForgotPasswordPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Esqueceu sua senha?')).toBeInTheDocument();
    expect(screen.getByText('Funcionalidade em desenvolvimento')).toBeInTheDocument();
    expect(screen.getByText(/A recuperação de senha estará disponível em breve/i)).toBeInTheDocument();
  });

  it('should navigate back to login when button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <ForgotPasswordPage />
      </BrowserRouter>
    );

    const backButton = screen.getByRole('button', { name: /voltar para login/i });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should have accessible alert icon with correct color', () => {
    const { container } = render(
      <BrowserRouter>
        <ForgotPasswordPage />
      </BrowserRouter>
    );

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
    // Verify icon is decorative (hidden from screen readers)
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    // Verify color is Focus Orange (#F97316) via inline style
    expect(icon).toHaveStyle({ color: 'rgb(249, 115, 22)' }); // #F97316 in RGB
  });

  it('should have proper ARIA labels', () => {
    render(
      <BrowserRouter>
        <ForgotPasswordPage />
      </BrowserRouter>
    );

    const region = screen.getByRole('region', { name: /recuperação de senha/i });
    expect(region).toBeInTheDocument();
  });
});
