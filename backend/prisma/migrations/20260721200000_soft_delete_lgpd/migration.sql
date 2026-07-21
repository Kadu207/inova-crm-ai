-- Soft-delete support for CRM entities (Spec 018 LGPD)

ALTER TABLE "companies" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "contacts" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "leads" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "opportunities" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "tasks" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "products" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "services" ADD COLUMN "deleted_at" TIMESTAMP(3);

CREATE INDEX "companies_tenant_id_deleted_at_idx" ON "companies"("tenant_id", "deleted_at");
CREATE INDEX "contacts_tenant_id_deleted_at_idx" ON "contacts"("tenant_id", "deleted_at");
CREATE INDEX "leads_tenant_id_deleted_at_idx" ON "leads"("tenant_id", "deleted_at");
CREATE INDEX "opportunities_tenant_id_deleted_at_idx" ON "opportunities"("tenant_id", "deleted_at");
CREATE INDEX "tasks_tenant_id_deleted_at_idx" ON "tasks"("tenant_id", "deleted_at");
CREATE INDEX "products_tenant_id_deleted_at_idx" ON "products"("tenant_id", "deleted_at");
CREATE INDEX "services_tenant_id_deleted_at_idx" ON "services"("tenant_id", "deleted_at");
