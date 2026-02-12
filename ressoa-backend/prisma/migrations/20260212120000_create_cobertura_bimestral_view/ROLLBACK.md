# Rollback Instructions - Migration 20260212120000_create_cobertura_bimestral_view

**Story:** 7.1 - Materialized View de Cobertura Bimestral
**Created:** 2026-02-12
**Purpose:** Rollback materialized view and indexes if migration needs to be reverted

## When to Rollback

Use this rollback if:
- View schema needs changes (must drop and recreate)
- Performance issues detected (revert to real-time queries)
- Migration fails on production (emergency rollback)

## Rollback SQL

```sql
-- Execute these commands in order to rollback migration

-- Step 1: Drop performance indexes
DROP INDEX IF EXISTS idx_cobertura_bimestral_cobertura;
DROP INDEX IF EXISTS idx_cobertura_bimestral_professor;
DROP INDEX IF EXISTS idx_cobertura_bimestral_turma;
DROP INDEX IF EXISTS idx_cobertura_bimestral_escola;

-- Step 2: Drop UNIQUE index (required for CONCURRENTLY)
DROP INDEX IF EXISTS idx_cobertura_bimestral_pk;

-- Step 3: Drop materialized view
DROP MATERIALIZED VIEW IF EXISTS cobertura_bimestral;
```

## How to Execute Rollback

### Option 1: Manual SQL (Development)

```bash
# Connect to PostgreSQL
psql -U postgres -d ressoa_dev

# Run rollback SQL
\i prisma/migrations/20260212120000_create_cobertura_bimestral_view/ROLLBACK.md
```

### Option 2: Prisma Migrate Rollback (Production)

**WARNING:** Prisma Migrate does NOT support automatic rollback. You must:

1. Create new migration with rollback SQL:
```bash
npx prisma migrate dev --name rollback_cobertura_bimestral_view --create-only
```

2. Edit new migration file with rollback SQL above

3. Apply migration:
```bash
npx prisma migrate deploy
```

## Post-Rollback Steps

After rollback:

1. **Update Code:** Remove/disable code that queries materialized view
   - `src/cobertura/` module
   - `src/jobs/refresh-cobertura.processor.ts`
   - Admin endpoint: `POST /api/v1/admin/refresh-cobertura`

2. **Alternative Queries:** Implement real-time queries for dashboards (Stories 7.2-7.4)

3. **Monitoring:** Check application logs for errors after rollback

## Prevention

Before applying this migration in production:
- ✅ Test on staging environment with production-like data
- ✅ Verify query performance with `EXPLAIN ANALYZE`
- ✅ Confirm indexes are used (not sequential scans)
- ✅ Validate refresh duration (should be < 30s for 1000+ planejamentos)
- ✅ Test CONCURRENTLY refresh (queries should not block)

## Support

If rollback fails, contact:
- **Developer:** Check logs for specific error
- **DBA:** Review PostgreSQL system tables (`pg_matviews`, `pg_indexes`)
- **Sentry:** Check error tracking for related issues

---

**Last Updated:** 2026-02-12
**Reviewed By:** Code Review Agent (Story 7.1)
