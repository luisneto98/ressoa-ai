import { describe, it, expect } from 'vitest';
import { getHomeRoute } from './routing';

describe('getHomeRoute', () => {
  it('should return correct home route for PROFESSOR', () => {
    expect(getHomeRoute('PROFESSOR')).toBe('/minhas-aulas');
  });

  it('should return correct home route for COORDENADOR', () => {
    expect(getHomeRoute('COORDENADOR')).toBe('/dashboard/coordenador/professores');
  });

  it('should return correct home route for DIRETOR', () => {
    expect(getHomeRoute('DIRETOR')).toBe('/dashboard/diretor');
  });

  it('should return correct home route for ADMIN', () => {
    expect(getHomeRoute('ADMIN')).toBe('/admin/monitoramento/stt');
  });

  it('should return fallback route for unknown role', () => {
    expect(getHomeRoute('UNKNOWN_ROLE')).toBe('/minhas-aulas');
  });

  it('should return fallback route for empty string', () => {
    expect(getHomeRoute('')).toBe('/minhas-aulas');
  });

  it('should return fallback route for undefined cast as string', () => {
    expect(getHomeRoute(undefined as unknown as string)).toBe('/minhas-aulas');
  });
});
