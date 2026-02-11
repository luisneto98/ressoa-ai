-- ============================================
-- BNCC Seed Validation Queries
-- ============================================
-- Data: 2026-02-10
-- Projeto: Ressoa AI (Professor Analytics)
-- Database: ressoa_dev

-- 1. Total habilidades
SELECT COUNT(*) as total_habilidades
FROM habilidades
WHERE ativa = true;
-- Expected: 369 (Current: 276 - missing EF69LP and EF89LP blocks)

-- 2. Habilidades por disciplina
SELECT disciplina, COUNT(*) as count
FROM habilidades
WHERE ativa = true
GROUP BY disciplina
ORDER BY disciplina;
-- Expected:
-- CIENCIAS: 63
-- LINGUA_PORTUGUESA: ~185 (Current: 92 - missing 93 habilidades)
-- MATEMATICA: 121

-- 3. Distribuição Matemática por ano
SELECT h.ano_inicio, COUNT(*) as count
FROM habilidades h
WHERE h.disciplina = 'MATEMATICA' AND h.ativa = true
GROUP BY h.ano_inicio
ORDER BY h.ano_inicio;
-- Expected:
-- 6: 34
-- 7: 37
-- 8: 27
-- 9: 23

-- 4. Distribuição Ciências por ano
SELECT h.ano_inicio, COUNT(*) as count
FROM habilidades h
WHERE h.disciplina = 'CIENCIAS' AND h.ativa = true
GROUP BY h.ano_inicio
ORDER BY h.ano_inicio;
-- Expected:
-- 6: 14
-- 7: 16
-- 8: 16
-- 9: 17

-- 5. Distribuição Língua Portuguesa por bloco
SELECT
  SUBSTRING(h.codigo FROM 1 FOR 6) as bloco,
  COUNT(*) as habilidades
FROM habilidades h
WHERE h.disciplina = 'LINGUA_PORTUGUESA' AND h.ativa = true
GROUP BY bloco
ORDER BY bloco;
-- Expected:
-- EF06LP: 12
-- EF07LP: 14
-- EF08LP: 16
-- EF09LP: 12
-- EF67LP: 38
-- EF69LP: 56 (Current: 0 - MISSING)
-- EF89LP: 37 (Current: 0 - MISSING)

-- 6. Blocos compartilhados LP - EF67LP (anos 6-7)
SELECT
  SUBSTRING(h.codigo FROM 1 FOR 6) as bloco,
  COUNT(DISTINCT h.id) as habilidades,
  COUNT(ha.id) as relacionamentos
FROM habilidades h
LEFT JOIN habilidades_anos ha ON h.id = ha.habilidade_id
WHERE h.disciplina = 'LINGUA_PORTUGUESA'
  AND h.codigo LIKE 'EF67%'
  AND h.ativa = true
GROUP BY bloco;
-- Expected: EF67LP: 38 habilidades, 76 relacionamentos (38 × 2 anos)

-- 7. Blocos compartilhados LP - EF69LP (anos 6-9)
SELECT
  SUBSTRING(h.codigo FROM 1 FOR 6) as bloco,
  COUNT(DISTINCT h.id) as habilidades,
  COUNT(ha.id) as relacionamentos
FROM habilidades h
LEFT JOIN habilidades_anos ha ON h.id = ha.habilidade_id
WHERE h.disciplina = 'LINGUA_PORTUGUESA'
  AND h.codigo LIKE 'EF69%'
  AND h.ativa = true
GROUP BY bloco;
-- Expected: EF69LP: 56 habilidades, 224 relacionamentos (56 × 4 anos)
-- Current: 0 habilidades, 0 relacionamentos (MISSING)

-- 8. Blocos compartilhados LP - EF89LP (anos 8-9)
SELECT
  SUBSTRING(h.codigo FROM 1 FOR 6) as bloco,
  COUNT(DISTINCT h.id) as habilidades,
  COUNT(ha.id) as relacionamentos
FROM habilidades h
LEFT JOIN habilidades_anos ha ON h.id = ha.habilidade_id
WHERE h.disciplina = 'LINGUA_PORTUGUESA'
  AND h.codigo LIKE 'EF89%'
  AND h.ativa = true
GROUP BY bloco;
-- Expected: EF89LP: 37 habilidades, 74 relacionamentos (37 × 2 anos)
-- Current: 0 habilidades, 0 relacionamentos (MISSING)

-- 9. Validar habilidade específica com blocos compartilhados (exemplo EF67LP01)
SELECT h.codigo, h.ano_inicio, h.ano_fim, a.nome as ano, a.ordem
FROM habilidades h
JOIN habilidades_anos ha ON h.id = ha.habilidade_id
JOIN anos a ON ha.ano_id = a.id
WHERE h.codigo = 'EF67LP01'
ORDER BY a.ordem;
-- Expected: 2 rows (6º Ano, 7º Ano)

-- 10. Total relacionamentos HabilidadeAno
SELECT COUNT(*) as total_relacionamentos FROM habilidades_anos;
-- Expected: ~600 (não 369, devido a blocos compartilhados LP)
-- Current: 314 (missing EF69LP and EF89LP relationships)

-- 11. Validar disciplinas
SELECT * FROM disciplinas ORDER BY ordem;
-- Expected: 3 rows (MATEMATICA, LINGUA_PORTUGUESA, CIENCIAS)

-- 12. Validar anos
SELECT * FROM anos ORDER BY ordem;
-- Expected: 4 rows (6º, 7º, 8º, 9º)

-- 13. Contagem de anos
SELECT COUNT(*) as total_anos FROM anos;
-- Expected: 4

-- 14. Contagem de disciplinas
SELECT COUNT(*) as total_disciplinas FROM disciplinas;
-- Expected: 3

-- 15. Verificar integridade referencial (habilidades sem relacionamentos)
SELECT h.codigo, h.disciplina
FROM habilidades h
LEFT JOIN habilidades_anos ha ON h.id = ha.habilidade_id
WHERE ha.id IS NULL AND h.ativa = true;
-- Expected: 0 rows (todas habilidades devem ter pelo menos 1 relacionamento)

-- ============================================
-- KNOWN ISSUES / TODO
-- ============================================
--
-- [ ] MISSING DATA: Blocos compartilhados de Língua Portuguesa
--     - EF69LP (56 habilidades, 6º-9º ano): 0/56 ❌
--     - EF89LP (37 habilidades, 8º-9º ano): 0/37 ❌
--     - Total faltando: 93 habilidades
--     - Impacto: LP tem apenas 92/185 habilidades (49.7%)
--
-- [ ] ACTION REQUIRED: Completar arquivo lingua-portuguesa-6-9ano.json
--     - Adicionar as 56 habilidades EF69LP (ano_inicio=6, ano_fim=9)
--     - Adicionar as 37 habilidades EF89LP (ano_inicio=8, ano_fim=9)
--     - Fonte: BNCC oficial ou documento bncc-mapeamento-curricular-2026-02-06.md
--     - Após completar, executar: npx ts-node prisma/seed.ts
--
