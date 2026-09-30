-- Spec 031: Full-text search (GIN) + outbox idempotency unique

-- Outbox: dedupe publish keys per tenant
CREATE UNIQUE INDEX IF NOT EXISTS "outbox_events_tenant_idempotency_key_key"
  ON "outbox_events" ("tenant_id", "idempotency_key");

-- Expression GIN indexes (portuguese) — list ?q= uses plainto_tsquery
CREATE INDEX IF NOT EXISTS "contacts_fts_idx" ON "contacts" USING GIN (
  to_tsvector(
    'portuguese',
    coalesce(name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(phone, '')
  )
);

CREATE INDEX IF NOT EXISTS "leads_fts_idx" ON "leads" USING GIN (
  to_tsvector(
    'portuguese',
    coalesce(title, '') || ' ' || coalesce(notes, '')
  )
);

CREATE INDEX IF NOT EXISTS "companies_fts_idx" ON "companies" USING GIN (
  to_tsvector(
    'portuguese',
    coalesce(name, '') || ' ' || coalesce(document, '')
  )
);

CREATE INDEX IF NOT EXISTS "products_fts_idx" ON "products" USING GIN (
  to_tsvector(
    'portuguese',
    coalesce(name, '') || ' ' || coalesce(sku, '') || ' ' || coalesce(description, '')
  )
);

CREATE INDEX IF NOT EXISTS "services_fts_idx" ON "services" USING GIN (
  to_tsvector(
    'portuguese',
    coalesce(name, '') || ' ' || coalesce(code, '') || ' ' || coalesce(description, '')
  )
);

CREATE INDEX IF NOT EXISTS "tasks_fts_idx" ON "tasks" USING GIN (
  to_tsvector(
    'portuguese',
    coalesce(title, '') || ' ' || coalesce(description, '')
  )
);

CREATE INDEX IF NOT EXISTS "opportunities_fts_idx" ON "opportunities" USING GIN (
  to_tsvector(
    'portuguese',
    coalesce(title, '')
  )
);
