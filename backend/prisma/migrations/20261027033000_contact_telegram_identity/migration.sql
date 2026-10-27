-- Telegram identity from Chatwoot Channel::Telegram (numeric user id + display username)
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "telegram_external_id" TEXT;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "telegram_username" TEXT;

CREATE INDEX IF NOT EXISTS "contacts_tenant_id_telegram_external_id_idx"
  ON "contacts"("tenant_id", "telegram_external_id");
