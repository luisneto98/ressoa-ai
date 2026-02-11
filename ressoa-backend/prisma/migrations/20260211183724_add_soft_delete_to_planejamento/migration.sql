-- AlterTable
ALTER TABLE "planejamento" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "planejamento_deleted_at_idx" ON "planejamento"("deleted_at");
