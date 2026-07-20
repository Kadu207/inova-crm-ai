-- RLS tenant isolation (T-11)
-- Policies use app.tenant_id via set_config(..., is_local := true) inside request transactions.
-- FORCE applies RLS even to table owners (API DB role).

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'users',
    'tenant_configs',
    'companies',
    'contacts',
    'leads',
    'pipelines',
    'pipeline_stages',
    'opportunities',
    'tasks',
    'products',
    'services',
    'conversations',
    'audit_logs',
    'proposals',
    'contracts',
    'invoices',
    'payments',
    'outbox_events'
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
