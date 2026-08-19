# Ops abertos — Chatwoot PID + Swarm + webhook secrets

**Data:** 2026-08-19 (atualizado)  
**SSH:** `gestaoti@128.140.77.31` porta **`65022`** — [`vps-ssh.md`](./vps-ssh.md)

## Status

| Item                   | Status                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| Chatwoot CRM PID       | **OK** — recreate 2026-08-19 · ~2% · `AUDIT_CRM_CHATWOOT_OK`                                     |
| Webhook secrets tenant | **OK** — seed `inova`, `rls-test-a`, `rls-test-b`                                                |
| Swarm Chatwoot legado  | **0/0** (pausado) — voltar a 1/1: [`swarm-vxlan-chatwoot-fix.md`](./swarm-vxlan-chatwoot-fix.md) |

## Voltar Swarm a 1/1 (dono Inova-TI)

Resumo: scale 0 → listar `vx-*` DOWN → `sudo ip link delete vx-…` → scale 1 → smoke.  
Detalhe completo no runbook acima.

## Audit CRM (periódico)

```bash
bash /opt/inova-crm-ai/chatwoot/scripts/audit-crm-chatwoot.sh
```
