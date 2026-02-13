/*
  Story: 11.2 - Backend Expandir Turma com Tipo de Currículo
  Migration: 20260213105622_add_curriculo_tipo_to_turma
  Purpose: Add support for custom curriculum turmas (non-BNCC)

  Changes:
  - Add enum CurriculoTipo (BNCC, CUSTOM)
  - Add curriculo_tipo column with DEFAULT 'BNCC' (backward compatible)
  - Add contexto_pedagogico JSONB column (nullable, required only for CUSTOM)

  Backward Compatibility: ✅
  - All existing turmas automatically receive curriculo_tipo = 'BNCC' via DEFAULT
  - contexto_pedagogico is NULL for existing turmas (safe for BNCC)
  - No breaking changes to existing queries/code

  Rollback Instructions:
  - To rollback: ALTER TABLE "turma" DROP COLUMN "curriculo_tipo", DROP COLUMN "contexto_pedagogico"; DROP TYPE "CurriculoTipo";
  - Note: Rollback will lose all custom turma data (contexto_pedagogico)
*/

-- CreateEnum: CurriculoTipo
CREATE TYPE "CurriculoTipo" AS ENUM ('BNCC', 'CUSTOM');

-- AlterTable: Add curriculo_tipo and contexto_pedagogico to Turma
ALTER TABLE "turma" ADD COLUMN "curriculo_tipo" "CurriculoTipo" NOT NULL DEFAULT 'BNCC',
ADD COLUMN "contexto_pedagogico" JSONB;

-- Backfill: All existing turmas receive curriculo_tipo = 'BNCC' automatically via DEFAULT
-- contexto_pedagogico remains NULL (safe default for BNCC turmas)
