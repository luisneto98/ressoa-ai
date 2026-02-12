import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { apiClient } from '@/api/axios';

// Mock dependencies
vi.mock('@/api/axios');
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage - Role-based Redirects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const fillAndSubmitForm = async (user: ReturnType<typeof userEvent.setup>) => {
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });

    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
  };

  it('should redirect PROFESSOR to /minhas-aulas after login', async () => {
    const user = userEvent.setup();

    // Mock API response
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        accessToken: 'token-professor',
        refreshToken: 'refresh-professor',
        user: {
          id: '1',
          email: 'professor@escola.com',
          nome: 'Professor Test',
          role: 'PROFESSOR',
          escola: { id: 'escola-1', nome: 'Escola Test' },
        },
      },
    });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    await fillAndSubmitForm(user);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/minhas-aulas');
    });
  });

  it('should redirect COORDENADOR to /dashboard/coordenador/professores after login', async () => {
    const user = userEvent.setup();

    // Mock API response
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        accessToken: 'token-coord',
        refreshToken: 'refresh-coord',
        user: {
          id: '2',
          email: 'coord@escola.com',
          nome: 'Coordenador Test',
          role: 'COORDENADOR',
          escola: { id: 'escola-1', nome: 'Escola Test' },
        },
      },
    });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    await fillAndSubmitForm(user);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/coordenador/professores');
    });
  });

  it('should redirect DIRETOR to /dashboard/diretor after login', async () => {
    const user = userEvent.setup();

    // Mock API response
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        accessToken: 'token-diretor',
        refreshToken: 'refresh-diretor',
        user: {
          id: '3',
          email: 'diretor@escola.com',
          nome: 'Diretor Test',
          role: 'DIRETOR',
          escola: { id: 'escola-1', nome: 'Escola Test' },
        },
      },
    });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    await fillAndSubmitForm(user);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/diretor');
    });
  });

  it('should redirect ADMIN to /admin/monitoramento/stt after login', async () => {
    const user = userEvent.setup();

    // Mock API response
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        accessToken: 'token-admin',
        refreshToken: 'refresh-admin',
        user: {
          id: '4',
          email: 'admin@ressoa.ai',
          nome: 'Admin Test',
          role: 'ADMIN',
          escola: { id: 'escola-1', nome: 'Escola Test' },
        },
      },
    });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    await fillAndSubmitForm(user);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/monitoramento/stt');
    });
  });

  it('should redirect unknown role to fallback /minhas-aulas', async () => {
    const user = userEvent.setup();

    // Mock API response with unknown role
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        accessToken: 'token-unknown',
        refreshToken: 'refresh-unknown',
        user: {
          id: '5',
          email: 'unknown@escola.com',
          nome: 'Unknown Test',
          role: 'UNKNOWN_ROLE',
          escola: { id: 'escola-1', nome: 'Escola Test' },
        },
      },
    });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    await fillAndSubmitForm(user);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/minhas-aulas');
    });
  });
});
