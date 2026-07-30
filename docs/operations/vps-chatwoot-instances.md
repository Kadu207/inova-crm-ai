# Instâncias Chatwoot na VPS — inventário e governança

**Objetivo:** uma instância Chatwoot **por produto**, com Postgres/Redis/domínio/bind próprios.  
**Proibido:** compartilhar Redis ou Postgres entre produtos.

Inventário vivo: `bash infrastructure/scripts/audit-chatwoot-instances.sh`

---

## Inventário canônico

| Projeto                    | Domínio                             | Bind host                    | Stack / path                     | Compose project / serviços                                                                       |
| -------------------------- | ----------------------------------- | ---------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Inova CRM AI**           | `chat-crm.inovatitech.com.br`       | `127.0.0.1:9403`             | `/opt/inova-crm-ai/chatwoot`     | `crm-chatwoot` → `crm_chatwoot_rails`, `crm_chatwoot_sidekiq`, `crm_cw_postgres`, `crm_cw_redis` |
| **Casa da Paz**            | `casadapaz-chat.inovatitech.com.br` | deve ser `127.0.0.1:<porta>` | `/home/gestaoti/casadapaz/infra` | compose `infra` → `infra-chatwoot-1`, `infra-chatwoot-sidekiq-1`                                 |
| **Swarm InovaTI** (legado) | `chat.inovatitech.com.br`           | rede Swarm + Tunnel          | Docker Swarm                     | `chatwoot-admin_chatwoot-admin`, `chatwoot-sidekiq_chatwoot-sidekiq`                             |

```mermaid
flowchart LR
  subgraph crm [Inova_CRM_AI]
    CrmUI["chat-crm:9403"]
    CrmPg["crm_cw_postgres"]
    CrmRedis["crm_cw_redis"]
    CrmUI --> CrmPg
    CrmUI --> CrmRedis
  end
  subgraph cdp [Casa_da_Paz]
    CdpUI["casadapaz-chat"]
    CdpNet["infra_rede_casadapaz"]
    CdpUI --> CdpNet
  end
  subgraph swarm [Swarm_InovaTI]
    SwarmUI["chat.inovatitech.com.br"]
    SwarmPg["swarm_postgres"]
    SwarmRedis["swarm_redis"]
    SwarmUI --> SwarmPg
    SwarmUI --> SwarmRedis
  end
```

---

## Convenção de naming

| Artefato         | Padrão                                   | Exemplo CRM                   |
| ---------------- | ---------------------------------------- | ----------------------------- |
| Compose project  | `{produto}-chatwoot`                     | `crm-chatwoot`                |
| Rails / Sidekiq  | `{produto}_chatwoot_rails\|sidekiq`      | `crm_chatwoot_rails`          |
| Postgres / Redis | `{produto}_cw_postgres\|redis`           | `crm_cw_postgres`             |
| Domínio          | `chat-{produto}.…` ou `{produto}-chat.…` | `chat-crm.inovatitech.com.br` |
| DB name          | `chatwoot_{produto}`                     | `chatwoot_crm`                |

Swarm `chat.inovatitech.com.br` permanece documentado como **legado** até o dono decidir rename/migração.

---

## Padrão de bind (obrigatório)

- UI Chatwoot no host: **sempre** `127.0.0.1:<porta>` + **Cloudflare Tunnel**.
- **Nunca** publicar `0.0.0.0:<porta>` para a UI.

### Desvio conhecido — Casa da Paz

Estado observado: `infra-chatwoot-1` em `0.0.0.0:3001`.

Runbook (operador, **fora** deste repo — path `casadapaz`):

1. No compose de messaging (`docker-compose.prod.messaging.yml` ou equivalente), alterar publish para `127.0.0.1:3001:3000`.
2. Confirmar que o Tunnel aponta `casadapaz-chat.inovatitech.com.br` → `http://127.0.0.1:3001`.
3. `docker compose … up -d --force-recreate chatwoot` (nome do serviço conforme o compose).
4. Reexecutar `bash /opt/inova-crm-ai/infrastructure/scripts/audit-chatwoot-instances.sh` e validar ausência de `0.0.0.0`.

---

## Isolamento CRM (este repo)

- Redes: `cw` (interna) + `inova-crm` (external, só API/workers CRM).
- Imagem pinada: `CHATWOOT_IMAGE` (default `chatwoot/chatwoot:v4.8.0`).
- Limites: `pids_limit: 512`, `mem_limit` 768M (rails) / 512M (sidekiq) — evita 500 por `can't fork`.
- Audit dedicado: `bash chatwoot/scripts/audit-crm-chatwoot.sh`
- Docs: [integracao-chatwoot.md](../integracao-chatwoot.md), [chatwoot/README.md](../../chatwoot/README.md)

---

## Checklist de ciclo de vida (não automático)

Antes de pausar ou remover uma instância, o **dono do produto** confirma:

| Instância                       | Manter ativo | Scale 0 / pause | Remover |
| ------------------------------- | ------------ | --------------- | ------- |
| CRM `chat-crm`                  | [ ]          | [ ]             | [ ]     |
| Casa da Paz `casadapaz-chat`    | [ ]          | [ ]             | [ ]     |
| Swarm `chat.inovatitech.com.br` | [ ]          | [ ]             | [ ]     |

### Comandos de referência (só após confirmação explícita)

```bash
# Swarm — scale 0 (NÃO executar sem dono Inova-TI)
# docker service scale chatwoot-admin_chatwoot-admin=0 chatwoot-sidekiq_chatwoot-sidekiq=0

# Casa da Paz — pause containers (path do compose casadapaz)
# cd /home/gestaoti/casadapaz/infra && docker compose -f docker-compose.prod.yml -f docker-compose.prod.messaging.yml stop chatwoot chatwoot-sidekiq

# CRM — recreate com limites (após sync do repo)
# cd /opt/inova-crm-ai/chatwoot
# docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d --force-recreate --no-deps rails sidekiq
```

---

## Segurança (Swarm)

O service Swarm já foi observado com secrets/placeholders fracos em variáveis de ambiente. **Remediação** (rotação `SECRET_KEY_BASE`, senhas Postgres/SMTP) é responsabilidade do dono da stack Swarm — não misturar com o `.env` do CRM.

---

## Relacionados

- [ports.md](../ports.md) — bloco `9400–9419` (CRM)
- [vps-ram-hardening.md](./vps-ram-hardening.md) — pause de sidekiq em rebuilds
- [webhook-signing.md](../webhook-signing.md) — HMAC CRM ↔ n8n
