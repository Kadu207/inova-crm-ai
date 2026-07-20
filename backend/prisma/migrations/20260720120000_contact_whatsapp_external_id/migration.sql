-- Contact WhatsApp external id (Evolution jid / Meta BSUID)
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "whatsapp_external_id" TEXT;

CREATE INDEX IF NOT EXISTS "contacts_tenant_id_whatsapp_external_id_idx"
  ON "contacts"("tenant_id", "whatsapp_external_id");
