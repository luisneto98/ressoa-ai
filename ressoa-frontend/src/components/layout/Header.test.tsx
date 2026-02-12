import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from './Header';
import { useUIStore } from '@/stores/ui.store';

// Mock UI store
vi.mock('@/stores/ui.store');

// Mock child components
vi.mock('./Breadcrumbs', () => ({
  Breadcrumbs: () => <div data-testid="breadcrumbs">Breadcrumbs</div>,
}));

vi.mock('./UserMenu', () => ({
  UserMenu: () => <div data-testid="user-menu">UserMenu</div>,
}));

describe('Header', () => {
  const mockSetMobileMenuOpen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useUIStore).mockImplementation((selector: any) => {
      const state = {
        setMobileMenuOpen: mockSetMobileMenuOpen,
        mobileMenuOpen: false,
      };
      return selector ? selector(state) : state;
    });
  });

  it('should render breadcrumbs', () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
  });

  it('should render user menu', () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
  });

  it('should NOT render menu button when showMenuButton is false', () => {
    render(
      <BrowserRouter>
        <Header showMenuButton={false} />
      </BrowserRouter>
    );

    const menuButton = screen.queryByLabelText('Abrir menu de navegação');
    expect(menuButton).not.toBeInTheDocument();
  });

  it('should NOT render menu button by default', () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    const menuButton = screen.queryByLabelText('Abrir menu de navegação');
    expect(menuButton).not.toBeInTheDocument();
  });

  it('should render menu button when showMenuButton is true', () => {
    render(
      <BrowserRouter>
        <Header showMenuButton={true} />
      </BrowserRouter>
    );

    const menuButton = screen.getByLabelText('Abrir menu de navegação');
    expect(menuButton).toBeInTheDocument();
  });

  it('should call setMobileMenuOpen(true) when menu button is clicked', () => {
    render(
      <BrowserRouter>
        <Header showMenuButton={true} />
      </BrowserRouter>
    );

    const menuButton = screen.getByLabelText('Abrir menu de navegação');
    fireEvent.click(menuButton);

    expect(mockSetMobileMenuOpen).toHaveBeenCalledWith(true);
  });

  it('should render menu button with correct accessibility attributes', () => {
    render(
      <BrowserRouter>
        <Header showMenuButton={true} />
      </BrowserRouter>
    );

    const menuButton = screen.getByLabelText('Abrir menu de navegação');
    expect(menuButton).toHaveAttribute('aria-label', 'Abrir menu de navegação');
  });

  it('should render menu button with correct touch target size', () => {
    render(
      <BrowserRouter>
        <Header showMenuButton={true} />
      </BrowserRouter>
    );

    const menuButton = screen.getByLabelText('Abrir menu de navegação');
    expect(menuButton).toHaveClass('min-h-[44px]', 'min-w-[44px]');
  });

  it('should have correct layout structure', () => {
    const { container } = render(
      <BrowserRouter>
        <Header showMenuButton={true} />
      </BrowserRouter>
    );

    const header = container.querySelector('header');
    expect(header).toHaveClass(
      'sticky',
      'top-0',
      'z-10',
      'flex',
      'h-16',
      'items-center',
      'justify-between'
    );
  });

  it('should restore focus to hamburger button when mobile menu closes (WCAG 2.4.3)', () => {
    let mobileMenuOpenState = true;

    vi.mocked(useUIStore).mockImplementation((selector: any) => {
      const state = {
        setMobileMenuOpen: mockSetMobileMenuOpen,
        mobileMenuOpen: mobileMenuOpenState,
      };
      return selector ? selector(state) : state;
    });

    const { rerender } = render(
      <BrowserRouter>
        <Header showMenuButton={true} />
      </BrowserRouter>
    );

    const menuButton = screen.getByRole('button', { name: /abrir menu/i });

    // Menu is open initially (mobileMenuOpen = true)
    expect(menuButton).toBeInTheDocument();

    // Simulate menu closing
    mobileMenuOpenState = false;
    vi.mocked(useUIStore).mockImplementation((selector: any) => {
      const state = {
        setMobileMenuOpen: mockSetMobileMenuOpen,
        mobileMenuOpen: mobileMenuOpenState,
      };
      return selector ? selector(state) : state;
    });

    rerender(
      <BrowserRouter>
        <Header showMenuButton={true} />
      </BrowserRouter>
    );

    // Focus should be restored to menu button (WCAG AAA compliance)
    expect(document.activeElement).toBe(menuButton);
  });
});
