import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AuthService } from '../src/modules/auth/auth.service';
import { RedisService } from '../src/redis/redis.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import * as bcrypt from 'bcrypt';

describe('Auth Redis TTL Validation (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let redisService: RedisService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authService = app.get<AuthService>(AuthService);
    redisService = app.get<RedisService>(RedisService);
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.perfilUsuario.deleteMany();
    await prisma.usuario.deleteMany();
    await prisma.escola.deleteMany();

    // Clean up Redis test keys
    const keys = await redisService.keys('refresh_token:*');
    for (const key of keys) {
      await redisService.del(key);
    }
  });

  describe('Refresh Token TTL', () => {
    it('should store refresh token in Redis with correct 7-day TTL', async () => {
      // Create test user
      const escola = await prisma.escola.create({
        data: {
          nome: 'Escola TTL Test',
          cnpj: '33333333000133',
        },
      });

      const senha_hash = await bcrypt.hash('password123', 10);

      const usuario = await prisma.usuario.create({
        data: {
          nome: 'Professor TTL',
          email: 'ttl@test.com',
          senha_hash,
          escola_id: escola.id,
        },
      });

      const perfilUsuario = await prisma.perfilUsuario.create({
        data: {
          usuario_id: usuario.id,
          role: 'PROFESSOR',
        },
      });

      // Generate tokens
      const tokens = await authService.generateTokens({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        senha_hash: usuario.senha_hash,
        escola_id: usuario.escola_id,
        created_at: usuario.created_at,
        updated_at: usuario.updated_at,
        perfil_usuario: {
          id: perfilUsuario.id,
          usuario_id: perfilUsuario.usuario_id,
          role: perfilUsuario.role,
          created_at: perfilUsuario.created_at,
          updated_at: perfilUsuario.updated_at,
        },
      });

      // Find the refresh token key in Redis
      const keys = await redisService.keys(
        `refresh_token:${usuario.id}:${tokens.refreshToken}`,
      );

      expect(keys).toHaveLength(1);

      // Validate TTL is set correctly (7 days = 604800 seconds)
      const ttl = await redisService.ttl(keys[0]);

      // TTL should be very close to 604800 (within 5 seconds of generation)
      expect(ttl).toBeGreaterThan(604795); // 7 days - 5 seconds
      expect(ttl).toBeLessThanOrEqual(604800); // 7 days exactly
    });

    it('should expire refresh token after TTL', async () => {
      // Create test user
      const escola = await prisma.escola.create({
        data: {
          nome: 'Escola Expire Test',
          cnpj: '44444444000144',
        },
      });

      const senha_hash = await bcrypt.hash('password123', 10);

      const usuario = await prisma.usuario.create({
        data: {
          nome: 'Professor Expire',
          email: 'expire@test.com',
          senha_hash,
          escola_id: escola.id,
        },
      });

      const perfilUsuario = await prisma.perfilUsuario.create({
        data: {
          usuario_id: usuario.id,
          role: 'PROFESSOR',
        },
      });

      // Generate tokens
      const tokens = await authService.generateTokens({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        senha_hash: usuario.senha_hash,
        escola_id: usuario.escola_id,
        created_at: usuario.created_at,
        updated_at: usuario.updated_at,
        perfil_usuario: {
          id: perfilUsuario.id,
          usuario_id: perfilUsuario.usuario_id,
          role: perfilUsuario.role,
          created_at: perfilUsuario.created_at,
          updated_at: perfilUsuario.updated_at,
        },
      });

      // Manually set a very short TTL to test expiration (2 seconds)
      const keys = await redisService.keys(
        `refresh_token:${usuario.id}:${tokens.refreshToken}`,
      );
      await redisService.del(keys[0]);
      await redisService.setex(
        keys[0],
        2, // 2 seconds TTL
        JSON.stringify({
          userId: usuario.id,
          escolaId: usuario.escola_id,
          role: 'PROFESSOR',
        }),
      );

      // Token should exist immediately
      const validatedUser1 = await authService.validateRefreshToken(
        tokens.refreshToken,
      );
      expect(validatedUser1).not.toBeNull();
      expect(validatedUser1?.id).toBe(usuario.id);

      // Wait for expiration (2 seconds + buffer)
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // Token should be expired and validation should fail
      const validatedUser2 = await authService.validateRefreshToken(
        tokens.refreshToken,
      );
      expect(validatedUser2).toBeNull();
    });

    it('should allow multiple refresh tokens for same user', async () => {
      // Create test user
      const escola = await prisma.escola.create({
        data: {
          nome: 'Escola Multiple Tokens',
          cnpj: '55555555000155',
        },
      });

      const senha_hash = await bcrypt.hash('password123', 10);

      const usuario = await prisma.usuario.create({
        data: {
          nome: 'Professor Multiple',
          email: 'multiple@test.com',
          senha_hash,
          escola_id: escola.id,
        },
      });

      const perfilUsuario = await prisma.perfilUsuario.create({
        data: {
          usuario_id: usuario.id,
          role: 'PROFESSOR',
        },
      });

      const userWithPerfil = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        senha_hash: usuario.senha_hash,
        escola_id: usuario.escola_id,
        created_at: usuario.created_at,
        updated_at: usuario.updated_at,
        perfil_usuario: {
          id: perfilUsuario.id,
          usuario_id: perfilUsuario.usuario_id,
          role: perfilUsuario.role,
          created_at: perfilUsuario.created_at,
          updated_at: perfilUsuario.updated_at,
        },
      };

      // Generate first token (e.g., from web browser)
      const tokens1 = await authService.generateTokens(userWithPerfil);

      // Generate second token (e.g., from mobile device)
      const tokens2 = await authService.generateTokens(userWithPerfil);

      // Both tokens should be different
      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);

      // Both tokens should be valid
      const validated1 = await authService.validateRefreshToken(
        tokens1.refreshToken,
      );
      const validated2 = await authService.validateRefreshToken(
        tokens2.refreshToken,
      );

      expect(validated1).not.toBeNull();
      expect(validated2).not.toBeNull();
      expect(validated1?.id).toBe(usuario.id);
      expect(validated2?.id).toBe(usuario.id);

      // There should be 2 refresh tokens in Redis
      const keys = await redisService.keys(`refresh_token:${usuario.id}:*`);
      expect(keys).toHaveLength(2);
    });
  });
});
