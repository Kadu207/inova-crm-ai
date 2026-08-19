# Baseline — Inova CRM AI

**Última atualização:** 2026-08-19  
**Versão do sistema:** **1.1.1** — ver [`docs/historico-versoes.md`](../../docs/historico-versoes.md)  
**Plano Mestre:** 1.2  
**Quality Gate:** PASS — `reports/quality-gate/2026-08-18T05-40-35-457Z.md` (Spec 030)  
**Harness:** ativo — [`memory.md`](../../memory.md) · [`docs/agents.md`](../../docs/agents.md) · [`AGENTS.md`](../../AGENTS.md)

## Estado

| Item                               | Status                                                                              |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| Fases 0–7 + Delivery               | DONE                                                                                |
| Produto 019–025 + Admin/Bulk/RAM   | DONE                                                                                |
| Deploy API/FE via CI → docker load | DONE (030: run `32104291388`, SHA `26cc829d0e05`)                                   |
| Swap `/swapfile-inova`             | DONE (4G ativo)                                                                     |
| **Harness Cursor**                 | **DONE** — agents/skills/rule + memory/agentes                                      |
| **026 Zoho Blueprint/COQL**        | **DONE** (v1.1.0)                                                                   |
| **028 Relatórios / funil**         | **DONE** (v1.1.1) — API + UI `/relatorios` em prod                                  |
| **029 Security hardening**         | **DONE** (P0+P1) — SHA `878a92fd5969`                                               |
| **030 RBAC navegação**             | **DONE** — nav + deep-link por papel (`frontend/lib/navigation.ts`)                 |
| **027 Meta Cloud API**             | READY docs · **BLOCKED** até WABA                                                   |
| Chatwoot CRM PID                   | Recreated 2026-08-19 — ~2% PID, healthy (`AUDIT_CRM_CHATWOOT_OK`)                   |
| Swarm Inova-TI Chatwoot            | **scale 0 (0/0)** desde 2026-08-19 — pausado (vxlan reject); CRM `chat-crm` intacto |
| Webhook secrets tenant             | Seed OK 2026-08-19 — tenants `inova`, `rls-test-a`, `rls-test-b`                    |

## Sequência oficial

1. **027 Meta:** checklist [`docs/operations/waba-credentials-checklist.md`](../../docs/operations/waba-credentials-checklist.md) → cutover (gatilho: “WABA pronto — executar Spec 027”)
2. **Ops:** Chatwoot audit periódico (recreate se PID ≥80%); Swarm legado **0/0** — recovery: [`docs/operations/swarm-vxlan-chatwoot-fix.md`](../../docs/operations/swarm-vxlan-chatwoot-fix.md); SSH **`:65022`**
3. **Deploy FE/API:** GitHub Actions `Build images (CI)` → `load-ci-images-vps.sh` (**só SHA em SHA.txt**)
4. **Migrate:** `migrate-api-vps.sh` / owner SQL quando schema mudar
5. **Webhook secrets tenant:** seed OK 2026-08-19 (`inova`, `rls-test-*`); re-rodar se novos tenants ACTIVE

Docs: `docs/harness.md`, `docs/operations/vps-ssh.md`, `docs/operations/swarm-vxlan-chatwoot-fix.md`, `docs/operations/vps-chatwoot-instances.md`, `docs/architecture/spec-028-commercial-reports.md`, `docs/architecture/spec-030-rbac-navigation.md`, `docs/architecture/spec-026-query-blueprint.md`, `docs/operations/ci-docker-images.md`, `docs/operations/waba-credentials-checklist.md`
