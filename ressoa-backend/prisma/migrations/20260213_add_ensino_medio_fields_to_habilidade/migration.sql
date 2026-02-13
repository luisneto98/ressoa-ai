-- AlterTable: Add tipo_ensino, competencia_especifica, and metadata to Habilidade
-- Story 10.3: Support for Ensino Médio habilidades

ALTER TABLE "habilidades"
ADD COLUMN "tipo_ensino" "TipoEnsino" NOT NULL DEFAULT 'FUNDAMENTAL',
ADD COLUMN "competencia_especifica" INTEGER,
ADD COLUMN "metadata" JSONB;

-- CreateIndex: Add index for tipo_ensino
CREATE INDEX "habilidades_tipo_ensino_idx" ON "habilidades"("tipo_ensino");
