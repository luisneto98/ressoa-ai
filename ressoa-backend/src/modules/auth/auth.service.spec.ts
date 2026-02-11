import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

describe('AuthService', () => {
  let service: AuthService;
  let redisService: RedisService;

  const mockPrismaService = {
    usuario: {
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    decode: jest.fn(),
  };

  const mockRedisService = {
    setex: jest.fn(),
    get: jest.fn(),
    keys: jest.fn(),
  };

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
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      const password = 'password123';
      const hash = await service.hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
      expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });

    it('should generate different hashes for same password', async () => {
      const password = 'password123';
      const hash1 = await service.hashPassword(password);
      const hash2 = await service.hashPassword(password);

      expect(hash1).not.toBe(hash2); // Salt randomness
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'password123';
      const hash = await service.hashPassword(password);
      const isValid = await service.comparePassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'password123';
      const hash = await service.hashPassword(password);
      const isValid = await service.comparePassword('wrongpassword', hash);

      expect(isValid).toBe(false);
    });
  });

  describe('generateTokens', () => {
    const mockUser = {
      id: 'user-id-123',
      nome: 'Test User',
      email: 'user@escola.com',
      senha_hash: 'hashed',
      escola_id: 'escola-id-456',
      created_at: new Date(),
      updated_at: new Date(),
      perfil_usuario: {
        id: 'perfil-id',
        usuario_id: 'user-id-123',
        role: 'PROFESSOR' as const,
        created_at: new Date(),
        updated_at: new Date(),
      },
    };

    it('should return access and refresh tokens', async () => {
      mockJwtService.sign.mockReturnValue('mock-access-token');

      const tokens = await service.generateTokens(mockUser);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens.accessToken).toBe('mock-access-token');
      expect(tokens.refreshToken).toBeTruthy();
    });

    it('should store refresh token in Redis with TTL', async () => {
      mockJwtService.sign.mockReturnValue('mock-access-token');

      await service.generateTokens(mockUser);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(redisService.setex).toHaveBeenCalledWith(
        expect.stringContaining('refresh_token:user-id-123:'),
        604800, // 7 days
        expect.any(String),
      );
    });

    it('should generate valid JWT payload', async () => {
      const mockPayload = {
        sub: 'user-id-123',
        email: 'user@escola.com',
        escolaId: 'escola-id-456',
        role: 'PROFESSOR',
      };

      const signFn = jest.fn((payload) => {
        expect(payload).toEqual(mockPayload);
        return 'mock-access-token';
      });
      mockJwtService.sign.mockImplementation(signFn);

      await service.generateTokens(mockUser);

      expect(mockJwtService.sign).toHaveBeenCalledWith(mockPayload);
    });

    it('should handle user without perfil_usuario (default to PROFESSOR)', async () => {
      const userWithoutPerfil = {
        ...mockUser,
        perfil_usuario: null,
      };

      const signFn = jest.fn((payload: { role: string }) => {
        expect(payload.role).toBe('PROFESSOR');
        return 'mock-access-token';
      });
      mockJwtService.sign.mockImplementation(signFn);

      await service.generateTokens(userWithoutPerfil);
    });
  });

  describe('validateRefreshToken', () => {
    it('should return user if token exists in Redis', async () => {
      const tokenId = 'token-id-123';
      const userId = 'user-id-123';
      const mockUser = {
        id: userId,
        nome: 'Test User',
        email: 'user@escola.com',
        senha_hash: 'hashed',
        escola_id: 'escola-id-456',
        created_at: new Date(),
        updated_at: new Date(),
        perfil_usuario: {
          id: 'perfil-id',
          usuario_id: userId,
          role: 'PROFESSOR' as const,
          created_at: new Date(),
          updated_at: new Date(),
        },
      };

      mockRedisService.keys.mockResolvedValue([
        `refresh_token:${userId}:${tokenId}`,
      ]);
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({
          userId,
          escolaId: 'escola-id-456',
          role: 'PROFESSOR',
        }),
      );
      mockPrismaService.usuario.findUnique.mockResolvedValue(mockUser);

      const user = await service.validateRefreshToken(tokenId);

      expect(user).toBeDefined();
      expect(user?.id).toBe(userId);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(redisService.keys).toHaveBeenCalledWith(
        `refresh_token:*:${tokenId}`,
      );
    });

    it('should return null if token not in Redis', async () => {
      mockRedisService.keys.mockResolvedValue([]);

      const user = await service.validateRefreshToken('invalid-token');

      expect(user).toBeNull();
    });

    it('should return null if token data is invalid', async () => {
      mockRedisService.keys.mockResolvedValue([
        'refresh_token:user-id:token-id',
      ]);
      mockRedisService.get.mockResolvedValue(null);

      const user = await service.validateRefreshToken('token-id');

      expect(user).toBeNull();
    });
  });
});
