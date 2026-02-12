import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { SidebarCTAItem } from './SidebarCTAItem';
import { Upload } from 'lucide-react';

describe('SidebarCTAItem', () => {
  const mockItem = {
    label: 'Nova Aula',
    path: '/aulas/upload',
    icon: Upload,
    isCTA: true,
  };

  describe('Renderização e Estilos CTA', () => {
    it('should render with CTA styles (orange background, white text, shadow)', () => {
      render(
        <BrowserRouter>
          <SidebarCTAItem item={mockItem} collapsed={false} />
        </BrowserRouter>
      );

      const link = screen.getByRole('link', { name: /nova aula/i });
      expect(link).toHaveClass('bg-focus-orange', 'text-white', 'shadow-lg');
    });

    it('should have shadow-focus-orange class for subtle glow effect', () => {
      render(
        <BrowserRouter>
          <SidebarCTAItem item={mockItem} collapsed={false} />
        </BrowserRouter>
      );

      const link = screen.getByRole('link', { name: /nova aula/i });
      expect(link.className).toContain('shadow-focus-orange/20');
    });

    it('should have hover classes for interaction feedback', () => {
      render(
        <BrowserRouter>
          <SidebarCTAItem item={mockItem} collapsed={false} />
        </BrowserRouter>
      );

      const link = screen.getByRole('link', { name: /nova aula/i });
      expect(link.className).toContain('hover:bg-focus-orange/90');
      expect(link.className).toContain('hover:shadow-xl');
    });
  });

  describe('Estado Colapsado', () => {
    it('should render only icon when collapsed', () => {
      render(
        <BrowserRouter>
          <SidebarCTAItem item={mockItem} collapsed={true} />
        </BrowserRouter>
      );

      // Texto não visível (colapsado)
      expect(screen.queryByText('Nova Aula')).not.toBeInTheDocument();

      // Ícone presente (via SVG inside link)
      const link = screen.getByRole('link');
      expect(link.querySelector('svg')).toBeInTheDocument();
    });

    it('should have aria-label when collapsed for accessibility', () => {
      render(
        <BrowserRouter>
          <SidebarCTAItem item={mockItem} collapsed={true} />
        </BrowserRouter>
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-label', 'Nova Aula');
    });

    it('should center content when collapsed', () => {
      render(
        <BrowserRouter>
          <SidebarCTAItem item={mockItem} collapsed={true} />
        </BrowserRouter>
      );

      const link = screen.getByRole('link');
      expect(link.className).toContain('justify-center');
    });
  });

  describe('Estado Expandido', () => {
    it('should render icon and text when expanded', () => {
      render(
        <BrowserRouter>
          <SidebarCTAItem item={mockItem} collapsed={false} />
        </BrowserRouter>
      );

      // Texto visível
      expect(screen.getByText('Nova Aula')).toBeInTheDocument();

      // Ícone presente
      const link = screen.getByRole('link', { name: /nova aula/i });
      expect(link.querySelector('svg')).toBeInTheDocument();
    });

    it('should NOT have aria-label when expanded (text is visible)', () => {
      render(
        <BrowserRouter>
          <SidebarCTAItem item={mockItem} collapsed={false} />
        </BrowserRouter>
      );

      const link = screen.getByRole('link', { name: /nova aula/i });
      expect(link).not.toHaveAttribute('aria-label');
    });
  });

  describe('Estado Ativo (Current Route)', () => {
    it('should apply active state when on current route', () => {
      render(
        <MemoryRouter initialEntries={['/aulas/upload']}>
          <SidebarCTAItem item={mockItem} collapsed={false} />
        </MemoryRouter>
      );

      const link = screen.getByRole('link', { name: /nova aula/i });
      expect(link).toHaveAttribute('aria-current', 'page');
      expect(link.className).toContain('bg-focus-orange/80'); // Dimmed background
    });

    it('should NOT have active state when on different route', () => {
      render(
        <MemoryRouter initialEntries={['/minhas-aulas']}>
          <SidebarCTAItem item={mockItem} collapsed={false} />
        </MemoryRouter>
      );

      const link = screen.getByRole('link', { name: /nova aula/i });
      expect(link).not.toHaveAttribute('aria-current', 'page');
      expect(link.className).not.toContain('bg-focus-orange/80');
    });
  });

  describe('Acessibilidade (WCAG AAA)', () => {
    it('should have minimum 44px height for touch targets', () => {
      render(
        <BrowserRouter>
          <SidebarCTAItem item={mockItem} collapsed={false} />
        </BrowserRouter>
      );

      const link = screen.getByRole('link', { name: /nova aula/i });
      expect(link).toHaveClass('min-h-[44px]');
    });

    it('should have focus-visible ring for keyboard navigation', () => {
      render(
        <BrowserRouter>
          <SidebarCTAItem item={mockItem} collapsed={false} />
        </BrowserRouter>
      );

      const link = screen.getByRole('link', { name: /nova aula/i });
      expect(link.className).toContain('focus-visible:ring-2');
      expect(link.className).toContain('focus-visible:ring-tech-blue');
    });

    it('should have aria-hidden on icon (decorative)', () => {
      render(
        <BrowserRouter>
          <SidebarCTAItem item={mockItem} collapsed={false} />
        </BrowserRouter>
      );

      const link = screen.getByRole('link', { name: /nova aula/i });
      const icon = link.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Navegação', () => {
    it('should navigate to correct path when clicked', () => {
      render(
        <BrowserRouter>
          <SidebarCTAItem item={mockItem} collapsed={false} />
        </BrowserRouter>
      );

      const link = screen.getByRole('link', { name: /nova aula/i });
      expect(link).toHaveAttribute('href', '/aulas/upload');
    });

    it('should call onNavigate callback when provided', async () => {
      const user = userEvent.setup();
      const onNavigate = vi.fn();

      render(
        <BrowserRouter>
          <SidebarCTAItem item={mockItem} collapsed={false} onNavigate={onNavigate} />
        </BrowserRouter>
      );

      const link = screen.getByRole('link', { name: /nova aula/i });
      await user.click(link);

      expect(onNavigate).toHaveBeenCalledTimes(1);
    });
  });
});
