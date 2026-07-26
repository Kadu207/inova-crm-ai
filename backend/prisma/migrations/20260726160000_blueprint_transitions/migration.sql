-- Spec 026 — Blueprint light (stage transition graph)

CREATE TABLE "blueprint_transitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "pipeline_id" TEXT NOT NULL,
    "from_stage_id" TEXT NOT NULL,
    "to_stage_id" TEXT NOT NULL,
    "required_field_keys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blueprint_transitions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "blueprint_transitions_tenant_id_pipeline_id_from_stage_id_to_stage_id_key"
  ON "blueprint_transitions"("tenant_id", "pipeline_id", "from_stage_id", "to_stage_id");

CREATE INDEX "blueprint_transitions_tenant_id_idx" ON "blueprint_transitions"("tenant_id");
CREATE INDEX "blueprint_transitions_pipeline_id_idx" ON "blueprint_transitions"("pipeline_id");

ALTER TABLE "blueprint_transitions"
  ADD CONSTRAINT "blueprint_transitions_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "blueprint_transitions"
  ADD CONSTRAINT "blueprint_transitions_pipeline_id_fkey"
  FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "blueprint_transitions"
  ADD CONSTRAINT "blueprint_transitions_from_stage_id_fkey"
  FOREIGN KEY ("from_stage_id") REFERENCES "pipeline_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "blueprint_transitions"
  ADD CONSTRAINT "blueprint_transitions_to_stage_id_fkey"
  FOREIGN KEY ("to_stage_id") REFERENCES "pipeline_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "blueprint_transitions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "blueprint_transitions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "blueprint_transitions";
CREATE POLICY tenant_isolation ON "blueprint_transitions"
  AS PERMISSIVE
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''));
