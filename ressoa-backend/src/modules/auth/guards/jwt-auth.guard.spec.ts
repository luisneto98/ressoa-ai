import { JwtAuthGuard } from './jwt-auth.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  describe('@Public decorator behavior', () => {
    it('should bypass JWT validation if route is marked as public', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const context = createMockContext();
      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        'isPublic',
        expect.any(Array),
      );
    });

    it('should call super.canActivate() if route is not public', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      // Mock AuthGuard.canActivate to avoid Passport strategy execution
      const superCanActivateSpy = jest
        .spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockReturnValue(true as any);

      const context = createMockContext();
      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalled();
      expect(superCanActivateSpy).toHaveBeenCalledWith(context);

      superCanActivateSpy.mockRestore();
    });

    it('should call super.canActivate() if isPublic metadata is undefined', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const superCanActivateSpy = jest
        .spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockReturnValue(true as any);

      const context = createMockContext();
      guard.canActivate(context);

      expect(superCanActivateSpy).toHaveBeenCalledWith(context);

      superCanActivateSpy.mockRestore();
    });

    it('should check both handler and class level decorators', () => {
      const getAllAndOverrideSpy = jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(true);

      const context = createMockContext();
      guard.canActivate(context);

      expect(getAllAndOverrideSpy).toHaveBeenCalledWith('isPublic', [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });
});

/**
 * Helper to create mock ExecutionContext for testing
 */
function createMockContext(): ExecutionContext {
  const mockHandler = jest.fn();
  const mockClass = jest.fn();

  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {},
      }),
      getResponse: () => ({
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }),
      getNext: () => jest.fn(),
    }),
    getHandler: () => mockHandler,
    getClass: () => mockClass,
    getType: () => 'http',
    getArgs: () => [],
    getArgByIndex: () => ({}),
    switchToRpc: () => ({}),
    switchToWs: () => ({}),
  } as any;
}
