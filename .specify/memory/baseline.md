# Baseline — Inova CRM AI

**Última atualização:** 2026-11-18  
**Versão do sistema:** **1.1.5** — ver [`docs/historico-versoes.md`](../../docs/historico-versoes.md)  
**Plano Mestre:** 1.2  
**Quality Gate:** PASS — Spec 034 agent-assist completo (`2026-11-18T12-31-21-174Z`)  
**Harness:** ativo — [`memory.md`](../../memory.md) · [`docs/agents.md`](../../docs/agents.md) · [`AGENTS.md`](../../AGENTS.md)

## Estado

| Item                               | Status                                                                                                                                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fases 0–7 + Delivery               | DONE                                                                                                                                                                                                    |
| Produto 019–025 + Admin/Bulk/RAM   | DONE                                                                                                                                                                                                    |
| Deploy API/FE via CI → docker load | DONE em prod: **`8d5c61d4170c`** (CI run `44305899101`, 2026-11-18) · Spec 034 agent-assist                                                                                                             |
| Swap `/swapfile-inova`             | DONE (4G ativo)                                                                                                                                                                                         |
| **Harness Cursor**                 | **DONE** — agents/skills/rule + memory/agentes                                                                                                                                                          |
| **026 Zoho Blueprint/COQL**        | **DONE** (v1.1.0)                                                                                                                                                                                       |
| **028 Relatórios / funil**         | **DONE** (v1.1.1) — API + UI `/relatorios` em prod                                                                                                                                                      |
| **029 Security hardening**         | **DONE** (P0+P1) — SHA `878a92fd5969` + remediação `3d2145c` ⊂ prior prod                                                                                                                               |
| **030 RBAC navegação**             | **DONE** — nav + deep-link por papel (`frontend/lib/navigation.ts`)                                                                                                                                     |
| **Brand favicon/PWA**              | **DONE** (v1.1.2) — [`docs/design/brand-assets.md`](../../docs/design/brand-assets.md)                                                                                                                  |
| **031 FTS + idempotency + retry**  | **DONE** prod — load `0a5266634480` + migrate `20260930010000_fts_idempotency` OK                                                                                                                       |
| **032 Telegram via Chatwoot**      | **DONE** prod — inbox **CRM Telegram** id=3 · `@InovaCRMAtendimentoBot` · webhook OK · membros OK · 1º `/start` E2E pendente no fio CRM                                                                 |
| **033 Mensagens omnichannel**      | **DONE** prod — load `be886795d2e7` + migrate OK · n8n reimport · Chatwoot **v4.19.1** · remap `api`→`whatsapp` · guia [`omnichannel-atendimento.md`](../../docs/operations/omnichannel-atendimento.md) |
| **034 Agent-assist**               | **DONE** prod — load `8d5c61d4170c` + migrate `ai_suggestions` (SQL as `inova` + resolve) · AI/workers rebuilt · [`specs/034-omnichannel-agent-assist/`](../../specs/034-omnichannel-agent-assist/)     |
| **027 Meta Cloud API**             | READY docs · **BLOCKED** até WABA                                                                                                                                                                       |
| Evolution WhatsApp (QR)            | **open** `crm-whatsapp` (2026-11-18) · webhook inbox → `crm_evolution_api:8080` · transitório até Spec 027                                                                                              |
| n8n → API                          | `API_BASE_URL=http://api:3000` · token sync OK · lead-inbound + sync-conversation ativos                                                                                                                |
| Chatwoot CRM PID                   | healthy · audit OK 2026-11-18 (~13% PID)                                                                                                                                                                |
| Swarm Inova-TI Chatwoot            | **scale 0 (0/0)** — pausado (vxlan); CRM `chat-crm` intacto                                                                                                                                             |
| Webhook secrets tenant             | Seed OK — tenants `inova`, `rls-test-a`, `rls-test-b`                                                                                                                                                   |

## Sequência oficial

1. **027 Meta:** checklist [`docs/operations/waba-credentials-checklist.md`](../../docs/operations/waba-credentials-checklist.md) → cutover (gatilho: “WABA pronto — executar Spec 027”)
2. **Ops:** Chatwoot audit periódico (recreate se PID ≥80%); Swarm legado **0/0** — recovery: [`docs/operations/swarm-vxlan-chatwoot-fix.md`](../../docs/operations/swarm-vxlan-chatwoot-fix.md); SSH **`:65025`**
3. **Webhook secrets tenant:** re-rodar se novos tenants ACTIVE
4. **F-06:** rotação humana de senhas históricas (checklist remediação)
5. **Nota migrate:** tabelas CRM owned by `inova`; `crm_app` sem DDL — Spec 031/033/034 aplicaram SQL como superuser + `prisma migrate resolve --applied`

Docs: `docs/harness.md`, `docs/operations/vps-ssh.md`, `docs/architecture/spec-031-fts-idempotency-retry.md`, `docs/design/brand-assets.md`, `docs/chatwoot-whatsapp-setup.md`, `docs/chatwoot-telegram-setup.md`, `docs/integracao-n8n.md`, `docs/operations/ci-docker-images.md`, `docs/operations/waba-credentials-checklist.md`
