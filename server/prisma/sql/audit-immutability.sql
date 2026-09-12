-- Audit immutability.
--
-- The brief requires audit logs to be immutable "through normal application
-- APIs". Application-level discipline is not enough: one buggy service method
-- or one compromised endpoint can rewrite history. So the guarantee is enforced
-- by the database itself.
--
-- Run this once, as a superuser, after `prisma migrate deploy`:
--   psql "$DATABASE_URL" -f prisma/sql/audit-immutability.sql
--
-- The API connects as `farmbridge_app`, which can append and read audit rows
-- but cannot alter or remove them. Migrations run as the owner, which can.

-- 1. A role for the application, distinct from the schema owner.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'farmbridge_app') THEN
    -- Password is set separately; this role is not used for migrations.
    CREATE ROLE farmbridge_app LOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO farmbridge_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO farmbridge_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO farmbridge_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO farmbridge_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO farmbridge_app;

-- 2. Take back everything but append and read on the audit table.
REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM farmbridge_app;
GRANT SELECT, INSERT ON public.audit_logs TO farmbridge_app;

-- 3. Belt and braces: a trigger that refuses mutation whoever attempts it.
--    Without this, anyone connecting as the owner could still rewrite history.
CREATE OR REPLACE FUNCTION public.audit_logs_reject_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only (attempted %)', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_logs_no_update ON public.audit_logs;
CREATE TRIGGER audit_logs_no_update
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.audit_logs_reject_mutation();

DROP TRIGGER IF EXISTS audit_logs_no_truncate ON public.audit_logs;
CREATE TRIGGER audit_logs_no_truncate
  BEFORE TRUNCATE ON public.audit_logs
  FOR STATEMENT EXECUTE FUNCTION public.audit_logs_reject_mutation();

-- Retention, when it is needed, is a deliberate operation: disable the trigger
-- as the owner, archive, delete, re-enable. That is a decision with a paper
-- trail, not something a request can do by accident.
