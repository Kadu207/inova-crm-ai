-- Spec 029: RLS for Spec 022/024/025 domain tables that were created without policies.
-- Same pattern as blueprint_transitions / 20260720050000_tenant_rls.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'webhook_subscriptions',
    'bulk_jobs',
    'custom_field_definitions'
  ];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
         AS PERMISSIVE
         FOR ALL
         USING (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), ''''))
         WITH CHECK (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), ''''))',
      t
    );
  END LOOP;
END $$;
