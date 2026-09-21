# Baseline — Inova CRM AI

**Última atualização:** 2026-09-21  
**Versão do sistema:** **1.1.2** — ver [`docs/historico-versoes.md`](../../docs/historico-versoes.md)  
**Plano Mestre:** 1.2  
**Quality Gate:** PASS — Spec 030 + brand assets (1.1.2)  
**Harness:** ativo — [`memory.md`](../../memory.md) · [`docs/agents.md`](../../docs/agents.md) · [`AGENTS.md`](../../AGENTS.md)

## Estado

| Item                               | Status                                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------------------- |
| Fases 0–7 + Delivery               | DONE                                                                                   |
| Produto 019–025 + Admin/Bulk/RAM   | DONE                                                                                   |
| Deploy API/FE via CI → docker load | DONE (security `3d2145ca7fc5`; FE brand = commit 1.1.2)                                |
| Swap `/swapfile-inova`             | DONE (4G ativo)                                                                        |
| **Harness Cursor**                 | **DONE** — agents/skills/rule + memory/agentes                                         |
| **026 Zoho Blueprint/COQL**        | **DONE** (v1.1.0)                                                                      |
| **028 Relatórios / funil**         | **DONE** (v1.1.1) — API + UI `/relatorios` em prod                                     |
| **029 Security hardening**         | **DONE** (P0+P1) — SHA `878a92fd5969` + remediação `3d2145c` loaded                    |
| **030 RBAC navegação**             | **DONE** — nav + deep-link por papel (`frontend/lib/navigation.ts`)                    |
| **Brand favicon/PWA**              | **DONE** (v1.1.2) — [`docs/design/brand-assets.md`](../../docs/design/brand-assets.md) |
| **027 Meta Cloud API**             | READY docs · **BLOCKED** até WABA                                                      |
| Evolution WhatsApp (QR)            | **open** `crm-whatsapp` · transitório até Spec 027                                     |
| n8n → API                          | `API_BASE_URL=http://api:3000` · token sync OK (2026-09-21)                            |
| Chatwoot CRM PID                   | healthy (audit periódico)                                                              |
| Swarm Inova-TI Chatwoot            | **scale 0 (0/0)** — pausado (vxlan); CRM `chat-crm` intacto                            |
| Webhook secrets tenant             | Seed OK — tenants `inova`, `rls-test-a`, `rls-test-b`                                  |

## Sequência oficial

1. **027 Meta:** checklist [`docs/operations/waba-credentials-checklist.md`](../../docs/operations/waba-credentials-checklist.md) → cutover (gatilho: “WABA pronto — executar Spec 027”)
2. **Ops:** Chatwoot audit periódico (recreate se PID ≥80%); Swarm legado **0/0** — recovery: [`docs/operations/swarm-vxlan-chatwoot-fix.md`](../../docs/operations/swarm-vxlan-chatwoot-fix.md); SSH **`:65025`**
3. **Deploy FE/API:** GitHub Actions `Build images (CI)` → `load-ci-images-vps.sh` (**só SHA em SHA.txt**)
4. **Migrate:** `migrate-api-vps.sh` / owner SQL quando schema mudar
5. **Webhook secrets tenant:** re-rodar se novos tenants ACTIVE
6. **F-06:** rotação humana de senhas históricas (checklist remediação)

Docs: `docs/harness.md`, `docs/operations/vps-ssh.md`, `docs/design/brand-assets.md`, `docs/chatwoot-whatsapp-setup.md`, `docs/integracao-n8n.md`, `docs/operations/ci-docker-images.md`, `docs/operations/waba-credentials-checklist.md`
