-- Migration: Enable Row-Level Security for Multi-Tenant Tables
-- Generated: 2026-02-11
-- Story: 1.3 - Multi-Tenancy Isolation (PostgreSQL RLS + Prisma Middleware)
--
-- CONTEXT:
-- This migration enables PostgreSQL Row-Level Security (RLS) as a defense-in-depth
-- security layer for multi-tenant data isolation. RLS policies work at the database
-- level, complementing application-level isolation via Prisma middleware.
--
-- SECURITY STRATEGY:
-- - Application Layer: Prisma middleware auto-injects escola_id (primary defense)
-- - Database Layer: RLS policies validate row access (backup defense)
--
-- IMPORTANT:
-- - RLS uses session variable 'app.current_tenant_id' set by application
-- - The 'true' parameter in current_setting() allows NULL when not set
-- - This enables seed scripts and migrations to work without tenant context

-- ============================================
-- Enable Row-Level Security on Usuario Table
-- ============================================

ALTER TABLE "usuario" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Create Tenant Isolation Policy for Usuario
-- ============================================
--
-- Policy Logic:
-- - Only rows where escola_id matches current_setting('app.current_tenant_id')
-- - If session variable is not set (NULL), no rows are visible via RLS
-- - Superuser and table owner bypass RLS (used for migrations/seeds)

CREATE POLICY tenant_isolation_policy ON "usuario"
  FOR ALL
  USING (escola_id = current_setting('app.current_tenant_id', true));

-- ============================================
-- Verify RLS is Enabled
-- ============================================
--
-- Run this query to confirm RLS is active:
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND tablename = 'usuario';
--
-- Expected Result:
-- tablename | rowsecurity
-- ----------+-------------
-- usuario   | t

-- ============================================
-- Future Tables (Stories 2.x, 3.x, 4.x)
-- ============================================
--
-- When Turma, Planejamento, Aula, etc. are created, enable RLS:
--
-- ALTER TABLE "turma" ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation_policy ON "turma"
--   FOR ALL
--   USING (escola_id = current_setting('app.current_tenant_id', true));
--
-- ALTER TABLE "planejamento" ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation_policy ON "planejamento"
--   FOR ALL
--   USING (escola_id = current_setting('app.current_tenant_id', true));
--
-- ALTER TABLE "aula" ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation_policy ON "aula"
--   FOR ALL
--   USING (escola_id = current_setting('app.current_tenant_id', true));

-- ============================================
-- Notes on RLS Behavior
-- ============================================
--
-- 1. RLS policies apply to normal users but NOT to:
--    - Superusers (postgres user)
--    - Table owners
--    - BYPASSRLS role attribute users
--
-- 2. This is INTENTIONAL for development:
--    - Allows migrations to run without tenant context
--    - Allows seed scripts to populate data
--    - Allows admin operations
--
-- 3. Application connection pool should use:
--    - Non-superuser role (e.g., 'ressoa_app')
--    - No BYPASSRLS attribute
--    - This ensures RLS policies are enforced
--
-- 4. Session variable lifecycle:
--    - SET LOCAL: Scoped to current transaction only (recommended)
--    - SET: Persists for entire session (risk of contamination)
--
-- 5. MVP Implementation Status:
--    - RLS policies are CONFIGURED but PASSIVE for MVP
--    - Session variable 'app.current_tenant_id' is NOT set by application
--    - Multi-tenancy enforced at APPLICATION layer (TenantInterceptor + manual escola_id injection)
--    - RLS serves as BACKUP defense layer (can be activated post-MVP if needed)
--    - This is acceptable defense-in-depth: Application + Database layers
