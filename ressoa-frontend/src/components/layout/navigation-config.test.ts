import { describe, it, expect } from 'vitest';
import { getNavigationForRole } from './navigation-config';

describe('navigation-config', () => {
  it('should return navigation items for PROFESSOR role', () => {
    const navItems = getNavigationForRole('PROFESSOR');

    expect(navItems).toHaveLength(4);
    expect(navItems[0]).toMatchObject({
      label: 'Minhas Aulas',
      path: '/minhas-aulas',
    });
    expect(navItems[1]).toMatchObject({
      label: 'Nova Aula',
      path: '/aulas/upload',
      isCTA: true,
    });
    expect(navItems[2]).toMatchObject({
      label: 'Planejamentos',
      path: '/planejamentos',
    });
    expect(navItems[3]).toMatchObject({
      label: 'Minha Cobertura',
      path: '/dashboard/cobertura-pessoal',
    });
  });

  it('should return navigation items for COORDENADOR role', () => {
    const navItems = getNavigationForRole('COORDENADOR');

    expect(navItems).toHaveLength(4);
    expect(navItems[0]).toMatchObject({
      label: 'Professores',
      path: '/dashboard/coordenador/professores',
    });
    expect(navItems[1]).toMatchObject({
      label: 'Cadastro de Turmas',
      path: '/turmas',
    });
    expect(navItems[2]).toMatchObject({
      label: 'Dashboard Turmas',
      path: '/dashboard/coordenador/turmas',
    });
    expect(navItems[3]).toMatchObject({
      label: 'Planejamentos',
      path: '/planejamentos',
    });
  });

  it('should return navigation items for DIRETOR role', () => {
    const navItems = getNavigationForRole('DIRETOR');

    expect(navItems).toHaveLength(4);
    expect(navItems[0]).toMatchObject({
      label: 'Visão Geral',
      path: '/dashboard/diretor',
    });
    expect(navItems[1]).toMatchObject({
      label: 'Professores',
      path: '/dashboard/coordenador/professores',
    });
    expect(navItems[2]).toMatchObject({
      label: 'Cadastro de Turmas',
      path: '/turmas',
    });
    expect(navItems[3]).toMatchObject({
      label: 'Dashboard Turmas',
      path: '/dashboard/coordenador/turmas',
    });
  });

  it('should return navigation items for ADMIN role', () => {
    const navItems = getNavigationForRole('ADMIN');

    expect(navItems).toHaveLength(4);
    expect(navItems[0]).toMatchObject({
      label: 'Monitoramento STT',
      path: '/admin/monitoramento/stt',
    });
    expect(navItems[3]).toMatchObject({
      label: 'Qualidade Prompts',
      path: '/admin/prompts/qualidade',
    });
  });

  it('should return empty array for unknown role', () => {
    const navItems = getNavigationForRole('UNKNOWN_ROLE');

    expect(navItems).toEqual([]);
  });

  it('should return empty array for empty role', () => {
    const navItems = getNavigationForRole('');

    expect(navItems).toEqual([]);
  });

  // AC5: Path Validation Tests
  describe('Navigation Config - Path Validation (AC5)', () => {
    it('all navigation paths should exist as valid route patterns', () => {
      // This test validates that navigation paths follow valid route patterns
      // For full validation against App.tsx routes, run E2E tests
      const allNavPaths = [
        ...getNavigationForRole('PROFESSOR'),
        ...getNavigationForRole('COORDENADOR'),
        ...getNavigationForRole('DIRETOR'),
        ...getNavigationForRole('ADMIN'),
      ].map((item) => item.path);

      allNavPaths.forEach((path) => {
        // Path should start with /
        expect(path).toMatch(/^\//);
        // Path should not have trailing slash (except root)
        if (path !== '/') {
          expect(path).not.toMatch(/\/$/);
        }
        // Path should not have spaces
        expect(path).not.toMatch(/\s/);
      });
    });

    it('COORDENADOR should NOT have access to /aulas or /minhas-aulas', () => {
      const coordPaths = getNavigationForRole('COORDENADOR').map((item) => item.path);

      expect(coordPaths).not.toContain('/aulas');
      expect(coordPaths).not.toContain('/minhas-aulas');
      expect(coordPaths).not.toContain('/aulas/upload');
    });

    it('DIRETOR should NOT have access to /planejamentos', () => {
      const diretorPaths = getNavigationForRole('DIRETOR').map((item) => item.path);

      expect(diretorPaths).not.toContain('/planejamentos');
      expect(diretorPaths).not.toContain('/planejamentos/novo');
    });

    it('DIRETOR should NOT have access to /aulas', () => {
      const diretorPaths = getNavigationForRole('DIRETOR').map((item) => item.path);

      expect(diretorPaths).not.toContain('/aulas');
      expect(diretorPaths).not.toContain('/minhas-aulas');
      expect(diretorPaths).not.toContain('/aulas/upload');
    });

    it('each role has at least one menu item', () => {
      const roles = ['PROFESSOR', 'COORDENADOR', 'DIRETOR', 'ADMIN'];

      roles.forEach((role) => {
        const navItems = getNavigationForRole(role);
        expect(navItems.length).toBeGreaterThan(0);
      });
    });

    it('all PROFESSOR paths should be unique', () => {
      const professorPaths = getNavigationForRole('PROFESSOR').map((item) => item.path);
      const uniquePaths = new Set(professorPaths);

      expect(professorPaths.length).toBe(uniquePaths.size);
    });

    it('all navigation items should have required properties', () => {
      const roles = ['PROFESSOR', 'COORDENADOR', 'DIRETOR', 'ADMIN'];

      roles.forEach((role) => {
        const navItems = getNavigationForRole(role);

        navItems.forEach((item) => {
          expect(item).toHaveProperty('label');
          expect(item).toHaveProperty('path');
          expect(item).toHaveProperty('icon');
          expect(typeof item.label).toBe('string');
          expect(typeof item.path).toBe('string');
          expect(item.label.length).toBeGreaterThan(0);
          expect(item.path.length).toBeGreaterThan(0);
          expect(item.path).toMatch(/^\//); // Path should start with /
        });
      });
    });
  });
});
