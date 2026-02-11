import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import * as bcrypt from 'bcrypt';

describe('Auth Multi-Tenancy Constraints (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

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
  });

  describe('Email Uniqueness Per School (Multi-Tenancy)', () => {
    it('should allow same email in different schools', async () => {
      // Create two schools
      const escola1 = await prisma.escola.create({
        data: {
          nome: 'Escola A',
          cnpj: '12345678000101',
        },
      });

      const escola2 = await prisma.escola.create({
        data: {
          nome: 'Escola B',
          cnpj: '98765432000102',
        },
      });

      const senha_hash = await bcrypt.hash('password123', 10);
      const email = 'professor@test.com';

      // Create user with same email in escola1
      const user1 = await prisma.usuario.create({
        data: {
          nome: 'Professor A',
          email,
          senha_hash,
          escola_id: escola1.id,
        },
      });

      // Create user with same email in escola2 - SHOULD SUCCEED
      const user2 = await prisma.usuario.create({
        data: {
          nome: 'Professor B',
          email,
          senha_hash,
          escola_id: escola2.id,
        },
      });

      expect(user1.id).toBeDefined();
      expect(user2.id).toBeDefined();
      expect(user1.id).not.toBe(user2.id);
      expect(user1.email).toBe(user2.email);
      expect(user1.escola_id).not.toBe(user2.escola_id);
    });

    it('should reject duplicate email in same school', async () => {
      const escola = await prisma.escola.create({
        data: {
          nome: 'Escola Test',
          cnpj: '11111111000111',
        },
      });

      const senha_hash = await bcrypt.hash('password123', 10);
      const email = 'duplicate@test.com';

      // Create first user
      await prisma.usuario.create({
        data: {
          nome: 'Professor 1',
          email,
          senha_hash,
          escola_id: escola.id,
        },
      });

      // Try to create second user with same email in same school - SHOULD FAIL
      await expect(
        prisma.usuario.create({
          data: {
            nome: 'Professor 2',
            email,
            senha_hash,
            escola_id: escola.id,
          },
        }),
      ).rejects.toThrow();
    });

    it('should enforce cascade delete when escola is deleted', async () => {
      const escola = await prisma.escola.create({
        data: {
          nome: 'Escola Delete Test',
          cnpj: '22222222000122',
        },
      });

      const senha_hash = await bcrypt.hash('password123', 10);

      const usuario = await prisma.usuario.create({
        data: {
          nome: 'Professor Cascade',
          email: 'cascade@test.com',
          senha_hash,
          escola_id: escola.id,
        },
      });

      await prisma.perfilUsuario.create({
        data: {
          usuario_id: usuario.id,
          role: 'PROFESSOR',
        },
      });

      // Delete escola - should cascade to usuario and perfil_usuario
      await prisma.escola.delete({
        where: { id: escola.id },
      });

      // Verify usuario was deleted
      const deletedUsuario = await prisma.usuario.findUnique({
        where: { id: usuario.id },
      });
      expect(deletedUsuario).toBeNull();

      // Verify perfil_usuario was also deleted
      const deletedPerfil = await prisma.perfilUsuario.findUnique({
        where: { usuario_id: usuario.id },
      });
      expect(deletedPerfil).toBeNull();
    });
  });
});
