-- Spec 034: persist agent-assist suggestions (tenant-first + RLS)

CREATE TABLE IF NOT EXISTS "ai_suggestions" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "conversation_id" TEXT,
  "kind" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_suggestions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_suggestions_tenant_id_idx"
  ON "ai_suggestions"("tenant_id");

CREATE INDEX IF NOT EXISTS "ai_suggestions_tenant_id_conversation_id_idx"
  ON "ai_suggestions"("tenant_id", "conversation_id");

CREATE INDEX IF NOT EXISTS "ai_suggestions_tenant_id_kind_created_at_idx"
  ON "ai_suggestions"("tenant_id", "kind", "created_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_suggestions_tenant_id_fkey'
  ) THEN
    ALTER TABLE "ai_suggestions"
      ADD CONSTRAINT "ai_suggestions_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_suggestions_conversation_id_fkey'
  ) THEN
    ALTER TABLE "ai_suggestions"
      ADD CONSTRAINT "ai_suggestions_conversation_id_fkey"
      FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "ai_suggestions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_suggestions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "ai_suggestions";
CREATE POLICY tenant_isolation ON "ai_suggestions"
  AS PERMISSIVE
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''));
