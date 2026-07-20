-- Opportunity stage SLA tracking (RN-OPP-03)
ALTER TABLE "opportunities" ADD COLUMN IF NOT EXISTS "stage_entered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "opportunities" ADD COLUMN IF NOT EXISTS "sla_breached_at" TIMESTAMP(3);

UPDATE "opportunities" SET "stage_entered_at" = "created_at" WHERE "stage_entered_at" IS NULL;
