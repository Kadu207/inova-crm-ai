-- Convert demo tenant → official Inova TI
BEGIN;

UPDATE tenants
SET
  slug = 'inova',
  name = 'Inova TI',
  status = 'ACTIVE',
  plan = 'STARTER',
  updated_at = NOW()
WHERE slug = 'demo';

COMMIT;

SELECT id, slug, name, status FROM tenants;
