-- Migration: 20260220100000_add_descricao_rascunho_aula
-- Story 16.2: Aula como Rascunho com Descrição e Datas Futuras

-- Passo 1: Adicionar valor ao enum ANTES de CRIADA
-- IMPORTANTE: ALTER TYPE ADD VALUE não é transacional em PostgreSQL — usar IF NOT EXISTS para idempotência
ALTER TYPE "StatusProcessamento" ADD VALUE IF NOT EXISTS 'RASCUNHO' BEFORE 'CRIADA';

-- Passo 2: Adicionar coluna descricao (nullable — zero impacto em dados existentes)
ALTER TABLE "aula" ADD COLUMN IF NOT EXISTS "descricao" TEXT;

-- Passo 3: Tornar tipo_entrada nullable (suportar rascunhos sem tipo definido)
ALTER TABLE "aula" ALTER COLUMN "tipo_entrada" DROP NOT NULL;
