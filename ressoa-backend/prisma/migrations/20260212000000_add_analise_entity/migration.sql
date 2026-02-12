-- Drop constraint from aula table first (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'aula_transcricao_id_key'
  ) THEN
    ALTER TABLE "aula" DROP CONSTRAINT "aula_transcricao_id_key";
  END IF;
END $$;

-- DropIndex
DROP INDEX IF EXISTS "aula_transcricao_id_key";

-- DropIndex
DROP INDEX IF EXISTS "transcricao_escola_id_aula_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "transcricao_provider_idx";

-- AlterTable
ALTER TABLE "aula" DROP COLUMN IF EXISTS "analise_id";
ALTER TABLE "aula" DROP COLUMN IF EXISTS "transcricao_id";

-- AlterTable
ALTER TABLE "transcricao" DROP COLUMN IF EXISTS "escola_id";
ALTER TABLE "transcricao" ALTER COLUMN "aula_id" SET NOT NULL;
ALTER TABLE "transcricao" DROP COLUMN IF EXISTS "provider";
ALTER TABLE "transcricao" ADD COLUMN "provider" "ProviderSTT" NOT NULL DEFAULT 'WHISPER';
ALTER TABLE "transcricao" ALTER COLUMN "idioma" SET NOT NULL;
ALTER TABLE "transcricao" ALTER COLUMN "idioma" SET DEFAULT 'pt-BR';

-- CreateTable
CREATE TABLE IF NOT EXISTS "analise" (
    "id" TEXT NOT NULL,
    "aula_id" TEXT NOT NULL,
    "transcricao_id" TEXT NOT NULL,
    "planejamento_id" TEXT,
    "cobertura_json" JSONB NOT NULL,
    "analise_qualitativa_json" JSONB NOT NULL,
    "relatorio_texto" TEXT NOT NULL,
    "exercicios_json" JSONB NOT NULL,
    "alertas_json" JSONB NOT NULL,
    "prompt_versoes_json" JSONB NOT NULL,
    "custo_total_usd" DOUBLE PRECISION NOT NULL,
    "tempo_processamento_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "analise_aula_id_key" ON "analise"("aula_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "analise_aula_id_idx" ON "analise"("aula_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "transcricao_aula_id_key" ON "transcricao"("aula_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "transcricao_aula_id_idx" ON "transcricao"("aula_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "transcricao_provider_created_at_idx" ON "transcricao"("provider", "created_at");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transcricao_aula_id_fkey'
  ) THEN
    ALTER TABLE "transcricao" ADD CONSTRAINT "transcricao_aula_id_fkey" FOREIGN KEY ("aula_id") REFERENCES "aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'analise_aula_id_fkey'
  ) THEN
    ALTER TABLE "analise" ADD CONSTRAINT "analise_aula_id_fkey" FOREIGN KEY ("aula_id") REFERENCES "aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'analise_transcricao_id_fkey'
  ) THEN
    ALTER TABLE "analise" ADD CONSTRAINT "analise_transcricao_id_fkey" FOREIGN KEY ("transcricao_id") REFERENCES "transcricao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'analise_planejamento_id_fkey'
  ) THEN
    ALTER TABLE "analise" ADD CONSTRAINT "analise_planejamento_id_fkey" FOREIGN KEY ("planejamento_id") REFERENCES "planejamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
