# Baseline — Inova CRM AI

**Última atualização:** 2026-08-18  
**Versão do sistema:** **1.1.1** — ver [`docs/historico-versoes.md`](../../docs/historico-versoes.md)  
**Plano Mestre:** 1.2  
**Quality Gate:** PASS — `reports/quality-gate/2026-08-18T05-07-57-461Z.md` (Spec 029)  
**Harness:** ativo — [`memory.md`](../../memory.md) · [`docs/agents.md`](../../docs/agents.md) · [`AGENTS.md`](../../AGENTS.md)

## Estado

| Item                               | Status                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------ |
| Fases 0–7 + Delivery               | DONE                                                                                 |
| Produto 019–025 + Admin/Bulk/RAM   | DONE                                                                                 |
| Deploy API/FE via CI → docker load | DONE (028: run `30779411458`, SHA `fef2725e2a7b`)                                    |
| Swap `/swapfile-inova`             | DONE (4G ativo)                                                                      |
| **Harness Cursor**                 | **DONE** — agents/skills/rule + memory/agentes                                       |
| **026 Zoho Blueprint/COQL**        | **DONE** (v1.1.0)                                                                    |
| **028 Relatórios / funil**         | **DONE** (v1.1.1) — API + UI `/relatorios` em prod                                   |
| **029 Security hardening**         | **DONE** (P0+P1) — SHA `878a92fd5969`                                                |
| **030 RBAC navegação**             | **READY** — spec/plan/tasks                                                          |
| **027 Meta Cloud API**             | READY docs · **BLOCKED** até WABA                                                    |
| Chatwoot CRM PID                   | Recreated 2026-08-03 — ~3% PID, healthy (`AUDIT_CRM_CHATWOOT_OK`)                    |
| Swarm Inova-TI Chatwoot            | 1/1 ativo — **aguarda dono** (pacote em `docs/operations/vps-chatwoot-instances.md`) |

## Sequência oficial

1. **030 RBAC UI:** `specs/030-rbac-navigation-roles/` — filtrar nav/páginas por papel
2. **027 Meta:** checklist [`docs/operations/waba-credentials-checklist.md`](../../docs/operations/waba-credentials-checklist.md) → cutover (gatilho: “WABA pronto — executar Spec 027”)
3. **Ops:** Chatwoot audit periódico; Swarm só com autorização Inova-TI
4. **Deploy API/FE:** GitHub Actions `Build images (CI)` → `load-ci-images-vps.sh` (**só SHA em SHA.txt**)
5. **Migrate:** `migrate-api-vps.sh` / owner SQL quando schema mudar
6. **Webhook secrets tenant:** `seed-tenant-webhook-secrets.sh`

Docs: `docs/harness.md`, `docs/architecture/spec-028-commercial-reports.md`, `docs/architecture/spec-026-query-blueprint.md`, `docs/operations/ci-docker-images.md`, `docs/operations/vps-chatwoot-instances.md`, `docs/operations/waba-credentials-checklist.md`
