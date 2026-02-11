import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler, UnauthorizedException } from '@nestjs/common';
import { of, Observable } from 'rxjs';
import { TenantInterceptor } from './tenant.interceptor';
import { ContextService } from '../context/context.service';

describe('TenantInterceptor', () => {
  let interceptor: TenantInterceptor;
  let contextService: ContextService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantInterceptor, ContextService],
    }).compile();

    interceptor = module.get<TenantInterceptor>(TenantInterceptor);
    contextService = module.get<ContextService>(ContextService);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept()', () => {
    let executionContext: ExecutionContext;
    let callHandler: CallHandler;

    beforeEach(() => {
      executionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({}),
        }),
      } as any;

      callHandler = {
        handle: jest.fn().mockReturnValue(of('test-result')),
      } as any;
    });

    it('should allow public endpoints without user', async () => {
      // Arrange: No user in request (public endpoint)
      const request = {};
      (executionContext.switchToHttp as jest.Mock).mockReturnValue({
        getRequest: () => request,
      });

      // Act
      const result$ = interceptor.intercept(executionContext, callHandler);
      const result = await result$.toPromise();

      // Assert
      expect(result).toBe('test-result');
      expect(callHandler.handle).toHaveBeenCalled();
    });

    it('should inject escolaId from JWT payload into context', async () => {
      // Arrange: Authenticated request with escolaId
      const escolaId = 'escola-123';
      const request = {
        user: {
          userId: 'user-1',
          email: 'test@test.com',
          escolaId: escolaId,
          role: 'PROFESSOR',
        },
      };
      (executionContext.switchToHttp as jest.Mock).mockReturnValue({
        getRequest: () => request,
      });

      // Spy on contextService.run
      const runSpy = jest.spyOn(contextService, 'run');

      // Act
      const result$ = interceptor.intercept(executionContext, callHandler);
      await result$.toPromise();

      // Assert: contextService.run was called with escolaId
      expect(runSpy).toHaveBeenCalledWith(escolaId, expect.any(Function));
    });

    it('should make escolaId available inside handler via contextService', async () => {
      // Arrange: Authenticated request
      const escolaId = 'escola-456';
      const request = {
        user: {
          userId: 'user-2',
          escolaId: escolaId,
        },
      };
      (executionContext.switchToHttp as jest.Mock).mockReturnValue({
        getRequest: () => request,
      });

      let contextEscolaId: string | undefined;
      // Mock handler that retrieves escolaId from context
      callHandler.handle = jest.fn().mockImplementation(() => {
        contextEscolaId = contextService.getEscolaId();
        return of('result');
      });

      // Act
      const result$ = interceptor.intercept(executionContext, callHandler);
      await result$.toPromise();

      // Assert: escolaId is available in handler via context
      expect(contextEscolaId).toBe(escolaId);
    });

    it('should throw UnauthorizedException if escolaId missing from JWT', async () => {
      // Arrange: Authenticated but no escolaId (malformed JWT)
      const request = {
        user: {
          userId: 'user-3',
          email: 'test@test.com',
          // escolaId is MISSING
        },
      };
      (executionContext.switchToHttp as jest.Mock).mockReturnValue({
        getRequest: () => request,
      });

      // Act & Assert
      expect(() => {
        interceptor.intercept(executionContext, callHandler);
      }).toThrow(UnauthorizedException);

      expect(() => {
        interceptor.intercept(executionContext, callHandler);
      }).toThrow('Escola ID não encontrado no token JWT');
    });

    it('should propagate errors from handler', async () => {
      // Arrange: Handler throws error
      const escolaId = 'escola-error';
      const request = {
        user: {
          userId: 'user-4',
          escolaId: escolaId,
        },
      };
      (executionContext.switchToHttp as jest.Mock).mockReturnValue({
        getRequest: () => request,
      });

      const testError = new Error('Handler error');
      callHandler.handle = jest.fn().mockReturnValue(
        new Observable((subscriber) => {
          subscriber.error(testError);
        }),
      );

      // Act & Assert
      const result$ = interceptor.intercept(executionContext, callHandler);
      await expect(result$.toPromise()).rejects.toThrow('Handler error');
    });

    it('should handle multiple concurrent requests with different tenants', async () => {
      // Arrange: Two concurrent requests
      const escola1Id = 'escola-1';
      const escola2Id = 'escola-2';

      const request1 = { user: { userId: 'user-1', escolaId: escola1Id } };
      const request2 = { user: { userId: 'user-2', escolaId: escola2Id } };

      const context1 = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: () => request1,
        }),
      } as any;

      const context2 = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: () => request2,
        }),
      } as any;

      let escolaId1: string | undefined;
      let escolaId2: string | undefined;

      const handler1 = {
        handle: jest.fn().mockImplementation(() => {
          return new Observable((subscriber) => {
            setTimeout(() => {
              escolaId1 = contextService.getEscolaId();
              subscriber.next('result1');
              subscriber.complete();
            }, 10);
          });
        }),
      } as any;

      const handler2 = {
        handle: jest.fn().mockImplementation(() => {
          return new Observable((subscriber) => {
            setTimeout(() => {
              escolaId2 = contextService.getEscolaId();
              subscriber.next('result2');
              subscriber.complete();
            }, 10);
          });
        }),
      } as any;

      // Act: Execute both interceptors concurrently
      const [result1, result2] = await Promise.all([
        interceptor.intercept(context1, handler1).toPromise(),
        interceptor.intercept(context2, handler2).toPromise(),
      ]);

      // Assert: Each handler got correct escolaId
      expect(escolaId1).toBe(escola1Id);
      expect(escolaId2).toBe(escola2Id);
      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
    });
  });
});
