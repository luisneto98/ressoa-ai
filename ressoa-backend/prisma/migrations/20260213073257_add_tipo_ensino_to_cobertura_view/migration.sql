-- Story 10.8: Add tipo_ensino to cobertura_bimestral materialized view
-- Purpose: Enable filtering by tipo_ensino directly in the view without JOIN
-- Impact: Removes need to JOIN with Turma table in dashboard queries

-- Drop existing materialized view
DROP MATERIALIZED VIEW IF EXISTS cobertura_bimestral CASCADE;

-- Recreate with tipo_ensino and turma_serie columns
CREATE MATERIALIZED VIEW cobertura_bimestral AS
WITH habilidades_trabalhadas_agg AS (
  SELECT
    a.planejamento_id,
    COUNT(DISTINCT hab->>'codigo') as trabalhadas_count
  FROM analise a,
       LATERAL jsonb_array_elements(a.cobertura_json->'habilidades') AS hab
  WHERE a.status = 'APROVADO'
    AND hab->>'nivel_cobertura' IN ('COMPLETE', 'PARTIAL')
  GROUP BY a.planejamento_id
)
SELECT
  p.escola_id,
  p.id as planejamento_id,
  p.professor_id,
  p.turma_id,
  t.disciplina,
  p.bimestre,
  p.ano_letivo,
  t.tipo_ensino as turma_tipo_ensino,  -- NOVA COLUNA
  t.serie as turma_serie,                -- EXPLÍCITA (já existia)
  t.nome as turma_nome,
  u.nome as professor_nome,

  -- Habilidades planejadas (total)
  COUNT(DISTINCT ph.habilidade_id) as habilidades_planejadas,

  -- Habilidades trabalhadas (via CTE)
  COALESCE(ht.trabalhadas_count, 0) as habilidades_trabalhadas,

  -- Percentual de cobertura (trabalhadas / planejadas * 100)
  ROUND(
    COALESCE(
      (COALESCE(ht.trabalhadas_count, 0)::numeric / NULLIF(COUNT(DISTINCT ph.habilidade_id), 0)) * 100,
      0
    ),
    2
  ) as percentual_cobertura,

  -- Métricas adicionais
  COUNT(DISTINCT au.id) FILTER (WHERE au.status_processamento = 'APROVADA') as total_aulas_aprovadas,
  AVG(EXTRACT(EPOCH FROM (a.updated_at - a.created_at))) FILTER (WHERE a.status = 'APROVADO') as tempo_medio_revisao,

  -- Timestamp do último refresh (para tracking de atualização)
  NOW() as ultima_atualizacao

FROM planejamento p
INNER JOIN turma t ON p.turma_id = t.id
INNER JOIN usuario u ON p.professor_id = u.id
LEFT JOIN planejamento_habilidade ph ON ph.planejamento_id = p.id
LEFT JOIN aula au ON au.turma_id = p.turma_id
                    AND au.professor_id = p.professor_id
                    AND au.escola_id = p.escola_id
                    AND EXTRACT(QUARTER FROM au.data) = CEIL(p.bimestre / 2.0)
LEFT JOIN analise a ON a.aula_id = au.id
LEFT JOIN habilidades_trabalhadas_agg ht ON ht.planejamento_id = p.id

WHERE t.deleted_at IS NULL  -- NOVO: Exclude soft-deleted turmas

GROUP BY
  p.escola_id,
  p.id,
  p.professor_id,
  p.turma_id,
  t.disciplina,
  p.bimestre,
  p.ano_letivo,
  t.tipo_ensino,  -- NOVO
  t.serie,
  t.nome,
  u.nome,
  ht.trabalhadas_count;

-- Índice ÚNICO (REQUIRED para REFRESH CONCURRENTLY)
CREATE UNIQUE INDEX idx_cobertura_bimestral_pk ON cobertura_bimestral (planejamento_id);

-- Índices de performance para queries de dashboard
CREATE INDEX idx_cobertura_bimestral_escola ON cobertura_bimestral (escola_id, bimestre);
CREATE INDEX idx_cobertura_bimestral_escola_tipo ON cobertura_bimestral (escola_id, turma_tipo_ensino, bimestre);  -- NOVO: Query optimization
CREATE INDEX idx_cobertura_bimestral_turma ON cobertura_bimestral (turma_id, bimestre);
CREATE INDEX idx_cobertura_bimestral_professor ON cobertura_bimestral (professor_id, bimestre);
CREATE INDEX idx_cobertura_bimestral_cobertura ON cobertura_bimestral (percentual_cobertura);
