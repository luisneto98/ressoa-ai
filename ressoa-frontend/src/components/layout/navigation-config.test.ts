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
      label: 'Upload',
      path: '/aulas/upload',
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

    expect(navItems).toHaveLength(2);
    expect(navItems[0]).toMatchObject({
      label: 'Professores',
      path: '/dashboard/coordenador/professores',
    });
    expect(navItems[1]).toMatchObject({
      label: 'Turmas',
      path: '/dashboard/coordenador/turmas',
    });
  });

  it('should return navigation items for DIRETOR role', () => {
    const navItems = getNavigationForRole('DIRETOR');

    expect(navItems).toHaveLength(3);
    expect(navItems[0]).toMatchObject({
      label: 'Visão Geral',
      path: '/dashboard/diretor',
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
});
