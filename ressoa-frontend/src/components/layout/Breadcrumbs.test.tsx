import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Breadcrumbs } from './Breadcrumbs';

function renderBreadcrumbsAtPath(path: string) {
  window.history.pushState({}, '', path);

  return render(
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<Breadcrumbs />} />
      </Routes>
    </BrowserRouter>
  );
}

describe('Breadcrumbs', () => {
  it('should return null for root path', () => {
    const { container } = renderBreadcrumbsAtPath('/');

    expect(container.firstChild).toBeNull();
  });

  it('should generate breadcrumbs for single segment path', () => {
    renderBreadcrumbsAtPath('/minhas-aulas');

    expect(screen.getByText('Minhas Aulas')).toBeInTheDocument();
  });

  it('should generate breadcrumbs for multi-segment path', () => {
    renderBreadcrumbsAtPath('/aulas/upload');

    expect(screen.getByText('Aulas')).toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();
  });

  it('should skip UUID segments in path', () => {
    renderBreadcrumbsAtPath(
      '/aulas/a1b2c3d4-e5f6-7890-abcd-ef1234567890/analise'
    );

    expect(screen.getByText('Aulas')).toBeInTheDocument();
    expect(screen.getByText('Análise')).toBeInTheDocument();
    // UUID should not appear in breadcrumbs
    expect(
      screen.queryByText('a1b2c3d4-e5f6-7890-abcd-ef1234567890')
    ).not.toBeInTheDocument();
  });

  it('should generate correct breadcrumbs for dashboard paths', () => {
    renderBreadcrumbsAtPath('/dashboard/cobertura-pessoal');

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Minha Cobertura')).toBeInTheDocument();
  });

  it('should generate correct breadcrumbs for admin paths', () => {
    renderBreadcrumbsAtPath('/admin/monitoramento/stt');

    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Monitoramento')).toBeInTheDocument();
    expect(screen.getByText('STT')).toBeInTheDocument();
  });

  it('should generate correct breadcrumbs for coordenador paths', () => {
    renderBreadcrumbsAtPath('/dashboard/coordenador/professores');

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Coordenador')).toBeInTheDocument();
    expect(screen.getByText('Professores')).toBeInTheDocument();
  });

  it('should render last breadcrumb as non-clickable page', () => {
    renderBreadcrumbsAtPath('/planejamentos/novo');

    // First breadcrumb should be a link
    const planejamentosLink = screen.getByText('Planejamentos').closest('a');
    expect(planejamentosLink).toBeInTheDocument();
    expect(planejamentosLink).toHaveAttribute('href', '/planejamentos');

    // Last breadcrumb should be a span (non-clickable)
    const novoPage = screen.getByText('Novo');
    expect(novoPage.tagName).toBe('SPAN');
    expect(novoPage).toHaveAttribute('aria-current', 'page');
  });

  it('should use fallback label for unknown segments', () => {
    renderBreadcrumbsAtPath('/unknown-path/segment');

    expect(screen.getByText('unknown-path')).toBeInTheDocument();
    expect(screen.getByText('segment')).toBeInTheDocument();
  });

  it('should handle deeply nested paths', () => {
    renderBreadcrumbsAtPath('/dashboard/coordenador/turmas/detalhes');

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Coordenador')).toBeInTheDocument();
    expect(screen.getByText('Turmas')).toBeInTheDocument();
    expect(screen.getByText('Detalhes')).toBeInTheDocument();
  });
});
