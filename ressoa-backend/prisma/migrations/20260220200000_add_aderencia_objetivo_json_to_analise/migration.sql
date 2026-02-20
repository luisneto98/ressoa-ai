-- Migration: 20260220200000_add_aderencia_objetivo_json_to_analise
-- Story 16.4: Análise de Aderência ao Objetivo no Relatório

-- Adicionar coluna aderencia_objetivo_json (nullable JSON — zero impacto em dados existentes)
-- Só preenchida quando aula.descricao (descricao_aula) estava preenchida na análise
--
-- NOTA: Aplicada manualmente via `prisma db execute` + `prisma migrate resolve --applied`
-- devido a divergência do shadow DB (problema pré-existente). O IF NOT EXISTS garante idempotência
-- para execução manual. Em novo ambiente: executar este SQL diretamente ou via `prisma migrate deploy`.
ALTER TABLE "analise" ADD COLUMN IF NOT EXISTS "aderencia_objetivo_json" JSONB;
