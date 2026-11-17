-- Spec 033: persist Chatwoot messages with channel origin (WhatsApp / Telegram)

CREATE TABLE IF NOT EXISTS "conversation_messages" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "conversation_id" TEXT NOT NULL,
  "chatwoot_message_id" INTEGER,
  "direction" TEXT NOT NULL,
  "channel" TEXT,
  "body" TEXT,
  "content_type" TEXT,
  "attachments" JSONB,
  "sent_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "conversation_messages_tenant_id_chatwoot_message_id_key"
  ON "conversation_messages"("tenant_id", "chatwoot_message_id");

CREATE INDEX IF NOT EXISTS "conversation_messages_tenant_id_idx"
  ON "conversation_messages"("tenant_id");

CREATE INDEX IF NOT EXISTS "conversation_messages_tenant_id_conversation_id_sent_at_idx"
  ON "conversation_messages"("tenant_id", "conversation_id", "sent_at");

CREATE INDEX IF NOT EXISTS "conversations_tenant_id_channel_idx"
  ON "conversations"("tenant_id", "channel");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversation_messages_tenant_id_fkey'
  ) THEN
    ALTER TABLE "conversation_messages"
      ADD CONSTRAINT "conversation_messages_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversation_messages_conversation_id_fkey'
  ) THEN
    ALTER TABLE "conversation_messages"
      ADD CONSTRAINT "conversation_messages_conversation_id_fkey"
      FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "conversation_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "conversation_messages" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "conversation_messages";
CREATE POLICY tenant_isolation ON "conversation_messages"
  AS PERMISSIVE
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''));
