import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET')
        return 'test-secret-at-least-32-characters-long';
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('validate', () => {
    it('should validate JWT payload and return user object', () => {
      const payload = {
        sub: 'user-id-123',
        email: 'user@escola.com',
        escolaId: 'escola-id-456',
        role: 'PROFESSOR',
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: 'user-id-123',
        email: 'user@escola.com',
        escolaId: 'escola-id-456',
        role: 'PROFESSOR',
      });
    });

    it('should extract userId from sub field', () => {
      const payload = {
        sub: 'test-user-id',
        email: 'test@escola.com',
        escolaId: 'test-escola-id',
        role: 'COORDENADOR',
      };

      const result = strategy.validate(payload);

      expect(result.userId).toBe('test-user-id');
    });
  });
});
