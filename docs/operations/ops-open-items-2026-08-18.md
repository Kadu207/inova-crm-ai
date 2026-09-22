# Ops abertos — Chatwoot PID + Swarm + webhook secrets

**Data:** 2026-09-22 (atualizado)  
**SSH:** `gestaoti@128.140.77.31` porta **`65025`** — [`vps-ssh.md`](./vps-ssh.md)

## Status

| Item                   | Status                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| Chatwoot CRM PID       | **OK** — recreate 2026-08-19 · ~2% · `AUDIT_CRM_CHATWOOT_OK`                                            |
| Webhook secrets tenant | **OK** — seed `inova`, `rls-test-a`, `rls-test-b`                                                       |
| Swarm Chatwoot legado  | **0/0** (pausado) — voltar a 1/1: [`swarm-vxlan-chatwoot-fix.md`](./swarm-vxlan-chatwoot-fix.md)        |
| Deploy CI images       | **OK** — SHA `42048a5842e9` loaded (brand 1.1.2 ⊃ audit F-01..F-10)                                     |
| Evolution WhatsApp     | **OK** — `crm-whatsapp` `state: open` (2026-09-22 reconnect)                                            |
| Audit F-06             | **Aberto** — rotação humana de senhas históricas ([`REMEDIATION.md`](../security-audit/REMEDIATION.md)) |

## Voltar Swarm a 1/1 (dono Inova-TI)

Resumo: scale 0 → listar `vx-*` DOWN → `sudo ip link delete vx-…` → scale 1 → smoke.  
Detalhe completo no runbook acima.

## Audit CRM (periódico)

```bash
bash /opt/inova-crm-ai/chatwoot/scripts/audit-crm-chatwoot.sh
```
