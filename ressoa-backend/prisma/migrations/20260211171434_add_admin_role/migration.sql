-- AlterEnum
ALTER TYPE "RoleUsuario" ADD VALUE 'ADMIN';

-- AlterTable
ALTER TABLE "usuario" ALTER COLUMN "escola_id" DROP NOT NULL;
