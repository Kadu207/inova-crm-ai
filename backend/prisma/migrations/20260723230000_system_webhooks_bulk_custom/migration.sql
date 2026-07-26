-- Spec 020: system audit fields
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "updated_by_id" TEXT;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "updated_by_id" TEXT;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "custom_fields" JSONB;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "updated_by_id" TEXT;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "custom_fields" JSONB;
ALTER TABLE "opportunities" ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;
ALTER TABLE "opportunities" ADD COLUMN IF NOT EXISTS "updated_by_id" TEXT;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "updated_by_id" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "updated_by_id" TEXT;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "updated_by_id" TEXT;

-- Spec 022: outbound webhooks
CREATE TABLE IF NOT EXISTS "webhook_subscriptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "event_types" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "webhook_subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "webhook_subscriptions_tenant_id_idx" ON "webhook_subscriptions"("tenant_id");
CREATE INDEX IF NOT EXISTS "webhook_subscriptions_tenant_id_active_idx" ON "webhook_subscriptions"("tenant_id", "active");

-- Spec 024: bulk jobs
DO $$ BEGIN
  CREATE TYPE "BulkJobType" AS ENUM ('EXPORT', 'IMPORT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "BulkJobStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "bulk_jobs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "BulkJobType" NOT NULL,
    "module" TEXT NOT NULL,
    "status" "BulkJobStatus" NOT NULL DEFAULT 'PENDING',
    "file_key" TEXT,
    "error" TEXT,
    "row_count" INTEGER,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bulk_jobs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "bulk_jobs_tenant_id_idx" ON "bulk_jobs"("tenant_id");
CREATE INDEX IF NOT EXISTS "bulk_jobs_tenant_id_status_idx" ON "bulk_jobs"("tenant_id", "status");

-- Spec 025: custom field definitions
DO $$ BEGIN
  CREATE TYPE "CustomFieldModule" AS ENUM ('LEAD', 'CONTACT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "CustomFieldType" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN', 'DATE', 'PICKLIST');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "custom_field_definitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "module" "CustomFieldModule" NOT NULL,
    "api_name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "CustomFieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "custom_field_definitions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "custom_field_definitions_tenant_id_module_api_name_key"
  ON "custom_field_definitions"("tenant_id", "module", "api_name");
CREATE INDEX IF NOT EXISTS "custom_field_definitions_tenant_id_idx" ON "custom_field_definitions"("tenant_id");

-- FKs (idempotent-ish: ignore if exist)
DO $$ BEGIN
  ALTER TABLE "companies" ADD CONSTRAINT "companies_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "companies" ADD CONSTRAINT "companies_updated_by_id_fkey"
    FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "contacts" ADD CONSTRAINT "contacts_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "contacts" ADD CONSTRAINT "contacts_updated_by_id_fkey"
    FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "leads" ADD CONSTRAINT "leads_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "leads" ADD CONSTRAINT "leads_updated_by_id_fkey"
    FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_updated_by_id_fkey"
    FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tasks" ADD CONSTRAINT "tasks_updated_by_id_fkey"
    FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "products" ADD CONSTRAINT "products_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "products" ADD CONSTRAINT "products_updated_by_id_fkey"
    FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "services" ADD CONSTRAINT "services_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "services" ADD CONSTRAINT "services_updated_by_id_fkey"
    FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "webhook_subscriptions" ADD CONSTRAINT "webhook_subscriptions_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "bulk_jobs" ADD CONSTRAINT "bulk_jobs_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "bulk_jobs" ADD CONSTRAINT "bulk_jobs_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "custom_field_definitions" ADD CONSTRAINT "custom_field_definitions_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
