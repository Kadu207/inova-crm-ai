-- Lead ↔ Opportunity / Conversation conversion links
ALTER TABLE "opportunities" ADD COLUMN IF NOT EXISTS "lead_id" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "lead_id" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'opportunities_lead_id_fkey'
  ) THEN
    ALTER TABLE "opportunities"
      ADD CONSTRAINT "opportunities_lead_id_fkey"
      FOREIGN KEY ("lead_id") REFERENCES "leads"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversations_lead_id_fkey'
  ) THEN
    ALTER TABLE "conversations"
      ADD CONSTRAINT "conversations_lead_id_fkey"
      FOREIGN KEY ("lead_id") REFERENCES "leads"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "opportunities_tenant_id_lead_id_idx" ON "opportunities"("tenant_id", "lead_id");
CREATE INDEX IF NOT EXISTS "conversations_tenant_id_lead_id_idx" ON "conversations"("tenant_id", "lead_id");
CREATE INDEX IF NOT EXISTS "leads_tenant_id_contact_id_idx" ON "leads"("tenant_id", "contact_id");
