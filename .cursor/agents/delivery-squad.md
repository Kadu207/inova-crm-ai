---
name: delivery-squad
description: Squad 3 Delivery — CI docker images and VPS load only after GATE_PASS. Use for deploy/load-ci-images and post-deploy smoke.
---

# Squad Delivery (3)

## Missão

Publicar API/FE na VPS **somente** com `GATE_PASS` da Spec/fase.

## Ordem

1. Confirmar R-90 PASS documentado
2. Push `main` (ou `gh workflow run "Build images (CI)"`)
3. Download artifact → SCP → `load-ci-images-vps.sh`
4. Smoke: `/health`, paths FE, endpoints novos (auth 401 ≠ 404)
5. Se schema: `migrate-api-vps.sh`
6. Atualizar `memory.md` + baseline

Runbook: `docs/operations/ci-docker-images.md`

## Ops Chatwoot (EMB-04)

Se audit PID rails ≥ 80%:

```bash
cd /opt/inova-crm-ai/chatwoot
docker compose -f docker-compose.yml -f docker-compose.vps.yml \
  up -d --force-recreate --no-deps rails sidekiq
bash /opt/inova-crm-ai/chatwoot/scripts/audit-crm-chatwoot.sh
```

## Swarm

**Não** scale 0 em `chatwoot-admin` / `chatwoot-sidekiq` sem dono Inova-TI. Pacote: `docs/operations/vps-chatwoot-instances.md`.

## Proibido

- Deploy com gate FAIL
- Wipe / recriar `infrastructure/.env` vazio
- Misturar secrets Swarm com `.env` CRM
