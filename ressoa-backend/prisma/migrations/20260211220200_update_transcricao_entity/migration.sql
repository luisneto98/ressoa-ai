-- CreateEnum
CREATE TYPE "ProviderSTT" AS ENUM ('WHISPER', 'GOOGLE', 'AZURE', 'MANUAL');

-- AlterTable Transcricao - Drop old foreign key if exists
ALTER TABLE "transcricao" DROP CONSTRAINT IF EXISTS "transcricao_escola_id_fkey";
ALTER TABLE "transcricao" DROP CONSTRAINT IF EXISTS "transcricao_aula_id_fkey";

-- Drop old indexes
DROP INDEX IF EXISTS "transcricao_escola_id_aula_id_idx";
DROP INDEX IF EXISTS "transcricao_provider_idx";

-- AlterTable Transcricao - Drop escola_id column
ALTER TABLE "transcricao" DROP COLUMN IF EXISTS "escola_id";

-- AlterTable Transcricao - Make aula_id NOT NULL and UNIQUE
ALTER TABLE "transcricao" ALTER COLUMN "aula_id" SET NOT NULL;
ALTER TABLE "transcricao" ADD CONSTRAINT "transcricao_aula_id_key" UNIQUE ("aula_id");

-- AlterTable Transcricao - Change provider type to enum
ALTER TABLE "transcricao" ALTER COLUMN "provider" TYPE "ProviderSTT" USING provider::"ProviderSTT";

-- AlterTable Transcricao - Add new columns
ALTER TABLE "transcricao" ADD COLUMN IF NOT EXISTS "idioma" TEXT NOT NULL DEFAULT 'pt-BR';
ALTER TABLE "transcricao" ADD COLUMN IF NOT EXISTS "custo_usd" DOUBLE PRECISION;
ALTER TABLE "transcricao" ADD COLUMN IF NOT EXISTS "tempo_processamento_ms" INTEGER;
ALTER TABLE "transcricao" ADD COLUMN IF NOT EXISTS "metadata_json" JSONB;

-- Create new indexes
CREATE INDEX "transcricao_aula_id_idx" ON "transcricao"("aula_id");
CREATE INDEX "transcricao_provider_created_at_idx" ON "transcricao"("provider", "created_at");

-- AddForeignKey
ALTER TABLE "transcricao" ADD CONSTRAINT "transcricao_aula_id_fkey" FOREIGN KEY ("aula_id") REFERENCES "aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey on Aula.transcricao_id (if exists)
ALTER TABLE "aula" DROP CONSTRAINT IF EXISTS "aula_transcricao_id_fkey";

-- Drop transcricao_id from Aula
ALTER TABLE "aula" DROP COLUMN IF EXISTS "transcricao_id";
