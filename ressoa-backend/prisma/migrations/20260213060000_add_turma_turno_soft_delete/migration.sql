-- AlterTable: Add turno and soft delete to Turma
-- turno was added via db push in dev (missing migration)
-- deleted_at required by cobertura_bimestral view (20260213073257)

ALTER TABLE "turma" ADD COLUMN IF NOT EXISTS "turno" TEXT NOT NULL DEFAULT 'MATUTINO';
ALTER TABLE "turma" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "turma_deleted_at_idx" ON "turma"("deleted_at");
