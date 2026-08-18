#!/usr/bin/env bash
set -euo pipefail
cd /opt/inova-crm-ai
COMPOSE='docker compose -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml --profile apps'

$COMPOSE exec -T postgres psql -U inova -d crm <<'SQL'
DO $$
DECLARE
  tid text;
  pid text;
BEGIN
  SELECT id INTO tid FROM tenants WHERE slug = 'cliente-demo';
  IF tid IS NULL THEN
    RAISE EXCEPTION 'tenant cliente-demo missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pipelines WHERE tenant_id = tid AND is_default) THEN
    pid := 'c' || substr(md5(random()::text), 1, 24);
    INSERT INTO pipelines (id, tenant_id, name, is_default, created_at, updated_at)
    VALUES (pid, tid, 'Funil Comercial', true, NOW(), NOW());
    INSERT INTO pipeline_stages (id, tenant_id, pipeline_id, name, "order", probability, created_at, updated_at) VALUES
      ('c' || substr(md5(random()::text), 1, 24), tid, pid, 'Novo', 1, 10, NOW(), NOW()),
      ('c' || substr(md5(random()::text), 1, 24), tid, pid, 'Qualificado', 2, 30, NOW(), NOW()),
      ('c' || substr(md5(random()::text), 1, 24), tid, pid, 'Proposta', 3, 60, NOW(), NOW()),
      ('c' || substr(md5(random()::text), 1, 24), tid, pid, 'Negociacao', 4, 80, NOW(), NOW()),
      ('c' || substr(md5(random()::text), 1, 24), tid, pid, 'Ganho', 5, 100, NOW(), NOW());
  END IF;
END $$;

SELECT slug, name, status FROM tenants ORDER BY slug;

SELECT t.slug,
       (SELECT COUNT(*) FROM leads l WHERE l.tenant_id = t.id AND l.deleted_at IS NULL) AS leads,
       (SELECT COUNT(*) FROM companies c WHERE c.tenant_id = t.id AND c.deleted_at IS NULL) AS companies
FROM tenants t
WHERE t.slug IN ('inova', 'cliente-demo')
ORDER BY t.slug;
SQL

if [[ -f .credentials-operator.txt ]] && ! grep -q 'cliente_demo_tenant=' .credentials-operator.txt; then
  PASS_NOTE="${CLIENTE_DEMO_PASSWORD:-${SEED_ADMIN_PASSWORD:-}}"
  if [[ -z "$PASS_NOTE" ]]; then
    echo "WARN: set CLIENTE_DEMO_PASSWORD to record cliente-demo password in .credentials-operator.txt" >&2
  else
    {
      echo ''
      echo '# Tenant exemplo isolamento UI'
      echo 'cliente_demo_tenant=cliente-demo'
      echo 'cliente_demo_email=admin@cliente-demo.example'
      echo "cliente_demo_password=${PASS_NOTE}"
    } >> .credentials-operator.txt
  fi
fi

echo DONE
