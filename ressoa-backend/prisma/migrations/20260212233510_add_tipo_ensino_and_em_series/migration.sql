-- CreateEnum: TipoEnsino
CREATE TYPE "TipoEnsino" AS ENUM ('FUNDAMENTAL', 'MEDIO');

-- AlterEnum: Add Ensino Médio values to Serie
ALTER TYPE "Serie" ADD VALUE 'PRIMEIRO_ANO_EM';
ALTER TYPE "Serie" ADD VALUE 'SEGUNDO_ANO_EM';
ALTER TYPE "Serie" ADD VALUE 'TERCEIRO_ANO_EM';

-- AlterTable: Add tipo_ensino to Turma with default FUNDAMENTAL
ALTER TABLE "turma" ADD COLUMN "tipo_ensino" "TipoEnsino" NOT NULL DEFAULT 'FUNDAMENTAL';
