-- Migration: Add full-text search support for Habilidade
-- AC: Full-Text Search Optimization

-- Add tsvector column with Portuguese stemming
-- Weight 'A' for codigo (higher priority), 'B' for descricao (lower priority)
ALTER TABLE "habilidades" ADD COLUMN searchable tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', coalesce(codigo, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(descricao, '')), 'B')
  ) STORED;

-- Create GIN (Generalized Inverted Index) for fast full-text search
CREATE INDEX idx_habilidade_searchable ON "habilidades" USING GIN (searchable);
