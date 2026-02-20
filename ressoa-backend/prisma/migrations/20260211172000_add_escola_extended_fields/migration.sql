-- AlterTable: Add extended fields to Escola (missing from db push)
ALTER TABLE "escola"
  ADD COLUMN IF NOT EXISTS "tipo" TEXT,
  ADD COLUMN IF NOT EXISTS "endereco" JSONB,
  ADD COLUMN IF NOT EXISTS "contato_principal" TEXT,
  ADD COLUMN IF NOT EXISTS "plano" TEXT,
  ADD COLUMN IF NOT EXISTS "limite_horas_mes" INTEGER,
  ADD COLUMN IF NOT EXISTS "status" TEXT,
  ADD COLUMN IF NOT EXISTS "data_ativacao" TIMESTAMP(3);
