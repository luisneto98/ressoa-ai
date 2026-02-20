-- CreateEnum: StatusAnalise
CREATE TYPE "StatusAnalise" AS ENUM ('AGUARDANDO_REVISAO', 'APROVADO', 'REJEITADO');

-- AlterTable: Add approval fields to Analise
ALTER TABLE "analise" ADD COLUMN "relatorio_editado" TEXT;
ALTER TABLE "analise" ADD COLUMN "exercicios_editado" JSONB;
ALTER TABLE "analise" ADD COLUMN "status" "StatusAnalise" NOT NULL DEFAULT 'AGUARDANDO_REVISAO';
ALTER TABLE "analise" ADD COLUMN "aprovado_em" TIMESTAMP(3);
ALTER TABLE "analise" ADD COLUMN "rejeitado_em" TIMESTAMP(3);
ALTER TABLE "analise" ADD COLUMN "motivo_rejeicao" TEXT;
ALTER TABLE "analise" ADD COLUMN "tempo_revisao" INTEGER;

-- CreateIndex
CREATE INDEX "analise_status_idx" ON "analise"("status");
