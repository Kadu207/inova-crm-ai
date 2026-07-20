# Runbook SaaS — Inova CRM AI

**Volume:** Operações SaaS (Fase 7)  
**Versão:** 1.0  
**Audience:** SRE, DevOps, super-admin

---

## Visão geral

Este runbook cobre operação diária do CRM SaaS multi-tenant na VPS Hetzner com Cloudflare Tunnel.

| Componente    | Hostname                         | Porta host |
| ------------- | -------------------------------- | ---------- |
| Frontend      | `crm.inovatitech.com.br`         | 9400       |
| API           | `api-crm.inovatitech.com.br`     | 9401       |
| AI            | `ai-crm.inovatitech.com.br`      | 9402       |
| Chatwoot      | `chat-crm.inovatitech.com.br`    | 9403       |
| n8n           | `n8n-crm.inovatitech.com.br`     | 9404       |
| MinIO API     | `s3-crm.inovatitech.com.br`      | 9405       |
| MinIO Console | `storage-crm.inovatitech.com.br` | 9406       |
| Grafana       | `ops-crm.inovatitech.com.br`     | 9408       |

---

## Rotina diária

1. Verificar health endpoints (`/health` API, AI, workers)
2. Checar filas RabbitMQ (backlog > 1000 → escalar worker)
3. Revisar alertas Grafana (SLA, quota 80%, disco)
4. Confirmar backup noturno Postgres + MinIO (log em `/var/log/inova-crm-backup.log`)

### Smoke pós-deploy (checklist)

```bash
curl -sf https://api-crm.inovatitech.com.br/health
curl -sf https://crm.inovatitech.com.br/login | head
# Login demo → /leads, /atendimento, /funil
# WhatsApp inbound → lead + conversa (docs/e2e-atendimento-crm.md)
# Qualificar + Converter + mover estágio
```

### Backup

Script: `infrastructure/scripts/backup.sh` (container `inova-crm-postgres`, DB `crm` + MinIO se `mc` instalado).  
Default: `BACKUP_ROOT=/opt/inova-crm-ai/backups` (sem sudo na VPS).

```cron
0 3 * * * gestaoti BACKUP_ROOT=/opt/inova-crm-ai/backups /opt/inova-crm-ai/infrastructure/scripts/backup.sh >> /opt/inova-crm-ai/logs/backup.log 2>&1
```

Smoke não destrutivo: `bash infrastructure/scripts/restore-smoke.sh` (DB temp `crm_restore_smoke`).  
Drill trimestral de restore de produção — ver [manual-implantacao-producao.md](./manual-implantacao-producao.md).

### SLA funil

Cron n8n: workflow `opportunity-sla-check` → `POST /api/v1/opportunities/sla/check-all` (Bearer `API_TOKEN`, sem `x-tenant-id` — `@PlatformApi`).  
Varre tenants `ACTIVE` + `TRIAL`. Single-tenant: `POST .../sla/check` com `x-tenant-id`.  
Constante MVP: 24h sem mudança de estágio (`OPPORTUNITY_STAGE_SLA_HOURS`).

---

## Provisionar novo tenant

```bash
# Via API (super-admin token)
curl -X POST https://api-crm.inovatitech.com.br/v1/admin/tenants \
  -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"name":"Cliente X","plan":"trial","admin_email":"admin@cliente.com"}'
```

Checklist pós-provisionamento:

- [ ] Tenant `active` ou `trial` no admin `/admin`
- [ ] Chatwoot account vinculado
- [ ] Prefixo MinIO criado
- [ ] Login do admin inicial OK
- [ ] Quotas Redis inicializadas
- [ ] Evento `tenant.provisioned` publicado

---

## Suspender tenant (inadimplência / abuso)

1. `PATCH /v1/admin/tenants/{id}` → `status: suspended`
2. Revogar tokens JWT do tenant (Redis blacklist)
3. Desabilitar webhooks Chatwoot do account
4. Registrar em auditoria com motivo
5. Notificar cliente via workflow n8n (orquestração only)

Reativação: inverso + smoke login.

---

## Quota exceeded (429)

1. Identificar tenant em logs API (`tenantId`, endpoint)
2. Verificar contador Redis `crm:{tenantId}:quota:*`
3. Se legítimo: upgrade de plano ou reset manual auditado
4. Se abuso: suspender + alerta segurança

---

## Incidentes

### API indisponível

```bash
cd /opt/inova-crm-ai
docker compose -f infrastructure/docker-compose.yml \
  -f infrastructure/docker-compose.vps.yml logs -f api --tail=200
docker compose ... restart api
```

### AI service lento

- Checar `/health` em `127.0.0.1:9402`
- Escalar réplicas AI no compose override
- Verificar rate limit por tenant

### Postgres disco cheio

- `docker exec inova-crm-postgres psql -U $USER -d crm -c "SELECT pg_size_pretty(pg_database_size(current_database()));"`
- Executar `VACUUM` agendado
- Expandir volume ou purge de logs antigos (com ADR)

### Tunnel Cloudflare down

```bash
sudo systemctl status cloudflared
sudo journalctl -u cloudflared -n 100
sudo systemctl restart cloudflared
```

---

## Deploy de release

Ver [DEPLOY-HETZNER.md](../DEPLOY-HETZNER.md) e [manual-implantacao-producao.md](./manual-implantacao-producao.md).

Ordem:

1. `check-ports`
2. Backup pré-deploy
3. `docker compose up -d --build`
4. `prisma migrate deploy`
5. Smoke checklist
6. `npm run gate` (CI ou staging)

Rollback: tag anterior + migrate resolve se necessário.

---

## Backup e restore

Scripts: `infrastructure/scripts/backup.sh`

| Recurso       | Frequência       | Retenção   |
| ------------- | ---------------- | ---------- |
| PostgreSQL    | Diário 03:00 UTC | 30 dias    |
| MinIO         | Diário 04:00 UTC | 30 dias    |
| n8n workflows | Git (versionado) | indefinido |

Restore drill: trimestral em staging.

---

## Segurança

- Rotacionar `API_TOKEN` e `JWT_SECRET` trimestralmente
- RabbitMQ UI (9407) — VPN/SSH only
- Sem bind público 5432/6379/5672
- Super-admin actions sempre em `audit_logs`

---

## Contatos e escalação

| Severidade          | Ação                                     |
| ------------------- | ---------------------------------------- |
| P1 — CRM down       | Restart stack + Tunnel + notificar owner |
| P2 — Tenant isolado | Suspender se abuso; suporte ao cliente   |
| P3 — Quota/warning  | Monitorar; upgrade comercial             |

---

## Referências

- [multi-tenant.md](./multi-tenant.md)
- [ports.md](./ports.md)
- [DEPLOY-HETZNER.md](../DEPLOY-HETZNER.md)
