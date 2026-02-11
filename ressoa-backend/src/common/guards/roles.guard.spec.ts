import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RoleUsuario } from '@prisma/client';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  describe('No roles required', () => {
    it('should allow access if no roles required (undefined)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const context = createMockContext({ role: RoleUsuario.PROFESSOR });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access if roles array is empty', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

      const context = createMockContext({ role: RoleUsuario.PROFESSOR });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('Single role required', () => {
    it('should allow access if user has required role', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([RoleUsuario.PROFESSOR]);

      const context = createMockContext({ role: RoleUsuario.PROFESSOR });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access if user does not have required role', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([RoleUsuario.COORDENADOR]);

      const context = createMockContext({ role: RoleUsuario.PROFESSOR });
      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });
  });

  describe('Multiple roles required', () => {
    it('should allow access if user has one of multiple required roles (COORDENADOR)', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([RoleUsuario.COORDENADOR, RoleUsuario.DIRETOR]);

      const context = createMockContext({ role: RoleUsuario.COORDENADOR });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access if user has one of multiple required roles (DIRETOR)', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([RoleUsuario.COORDENADOR, RoleUsuario.DIRETOR]);

      const context = createMockContext({ role: RoleUsuario.DIRETOR });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access if user does not have any of required roles', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([RoleUsuario.COORDENADOR, RoleUsuario.DIRETOR]);

      const context = createMockContext({ role: RoleUsuario.PROFESSOR });
      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });
  });

  describe('Invalid user state', () => {
    it('should deny access if user is null', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([RoleUsuario.PROFESSOR]);

      const context = createMockContext(null);
      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should deny access if user is undefined', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([RoleUsuario.PROFESSOR]);

      const context = createMockContext(undefined);
      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should deny access if user.role is missing', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([RoleUsuario.PROFESSOR]);

      const context = createMockContext({ userId: '123' }); // no role
      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should deny access if user.role is null', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([RoleUsuario.PROFESSOR]);

      const context = createMockContext({ userId: '123', role: null });
      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });
  });
});

/**
 * Helper to create mock ExecutionContext for testing
 */
function createMockContext(user: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
}
