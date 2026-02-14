-- AlterTable
ALTER TABLE "usuario" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "usuario_deleted_at_idx" ON "usuario"("deleted_at");
