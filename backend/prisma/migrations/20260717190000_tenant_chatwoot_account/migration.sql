-- AlterTable
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "chatwoot_account_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_chatwoot_account_id_key" ON "tenants"("chatwoot_account_id");
