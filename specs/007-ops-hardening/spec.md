# Especificação: Ops Hardening — Backup, SLA multi-tenant, Meta blocked

**ID:** `007-ops-hardening`  
**Status:** aprovado  
**Autor:** Inova CRM AI  
**Data:** 2026-07-20  
**Fase do roadmap:** pós-7 (ops contínuo)

---

## 1. Contexto e problema

Fases 0–7 e spec 006 estão DONE. Faltam hardening operacional do baseline: backup validado, SLA em todos os tenants, e status explícito do cutover Meta.

**Problema:** `backup.sh` com defaults de container/DB incorretos; cron SLA só no tenant demo; Meta sem WABA ainda.

**Impacto:** restore quebrado; tenants não-demo sem alerta de SLA; risco de tentar cutover sem credenciais.

---

## 2. Objetivo

1. Backup noturno Postgres correto + restore-smoke não destrutivo + cron na VPS.
2. `POST /opportunities/sla/check-all` (API_TOKEN platform) + n8n one-shot.
3. Documentar Meta Cloud API como **BLOCKED** até WABA.

### Fora de escopo

- Cutover Evolution → Meta
- Instalação obrigatória do `mc` MinIO nesta entrega
- Restore destrutivo no DB de produção

---

## 3. Usuários e papéis

| Ator    | Papel              | Interesse                   |
| ------- | ------------------ | --------------------------- |
| Ops     | admin VPS          | cron backup + smoke restore |
| n8n     | API_TOKEN platform | cron SLA all tenants        |
| Produto | —                  | Meta bloqueado até WABA     |

---

## 4. Requisitos funcionais

### RF-01 — Backup

- [ ] Defaults: `inova-crm-postgres`, DB `crm`
- [ ] `restore-smoke.sh` em DB temporário `crm_restore_smoke`
- [ ] Cron `0 3 * * *` na VPS

### RF-02 — SLA multi-tenant

- [ ] `@PlatformApi()` + check-all sem `x-tenant-id`
- [ ] Tenants `ACTIVE` + `TRIAL`
- [ ] Workflow n8n aponta para `/sla/check-all`

### RF-03 — Meta blocked

- [ ] Docs + baseline marcam BLOCKED aguardando WABA

---

## 5. Critérios de aceite

- Backup + restore-smoke PASS na VPS
- Gate PASS; API rebuild com check-all
- Meta sem cutover; Evolution permanece operacional
