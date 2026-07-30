# Chatwoot — Inova CRM AI

Instância **dedicada** ao CRM (`chat-crm.inovatitech.com.br`).  
Regra: **uma instância Chatwoot por projeto** — Postgres/Redis/domínio próprios; não reutiliza Casa da Paz, Swarm Inova-TI nem outros produtos.

Inventário VPS: [docs/operations/vps-chatwoot-instances.md](../docs/operations/vps-chatwoot-instances.md).

## Arquitetura

| Serviço  | Container                    | Rede              | Limites (VPS)          |
| -------- | ---------------------------- | ----------------- | ---------------------- |
| Rails UI | `crm_chatwoot_rails`         | `cw`, `inova-crm` | `pids_limit=512`, 768M |
| Sidekiq  | `crm_chatwoot_sidekiq`       | `cw`              | `pids_limit=512`, 512M |
| Postgres | `crm_cw_postgres` (pgvector) | `cw`              | —                      |
| Redis    | `crm_cw_redis`               | `cw`              | —                      |

Imagem pinada: `${CHATWOOT_IMAGE:-chatwoot/chatwoot:v4.8.0}` (ver `.env.example`).

A rede Docker `inova-crm` é criada pelo stack `infrastructure/` e anexada aqui como **external**, permitindo que API/workers alcancem o Chatwoot por hostname `crm_chatwoot_rails` (ou `rails` dentro do projeto `crm-chatwoot`).

## Audit / saúde

```bash
# Só CRM (PIDs, health, bind 9403, FRONTEND_URL)
bash scripts/audit-crm-chatwoot.sh

# Todas as instâncias na VPS (desvios de bind/naming)
bash ../infrastructure/scripts/audit-chatwoot-instances.sh
```

## Pré-requisitos

1. Stack base no ar:

```powershell
cd infrastructure
docker compose up -d
```

2. Copiar variáveis:

```powershell
cd ..\chatwoot
copy .env.example .env
# Editar SECRET_KEY_BASE, senhas e SMTP
```

Gerar `SECRET_KEY_BASE`:

```bash
openssl rand -hex 64
```

## Subir (desenvolvimento / VPS)

```powershell
# Dev (sem bind de porta no host — acesso via rede Docker)
docker compose -f docker-compose.yml up -d

# VPS (localhost:9403 para Cloudflare Tunnel)
docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d
```

## Primeira instalação (migrations + admin)

```powershell
docker compose exec rails bundle exec rails db:chatwoot_prepare

docker compose exec rails bundle exec rails runner "
  u = User.find_by(email: 'admin@inovatitech.com.br')
  unless u
    SuperAdmin.create!(
      email: 'admin@inovatitech.com.br',
      name: 'Inova Chatwoot Admin',
      password: 'CHANGE_ME_ON_FIRST_LOGIN',
      password_confirmation: 'CHANGE_ME_ON_FIRST_LOGIN'
    )
    puts 'Super admin criado'
  end
"
```

Ajuste e-mail/senha. Em produção, force troca de senha no primeiro login.

## Cloudflare Tunnel

| Hostname                      | Destino          |
| ----------------------------- | ---------------- |
| `chat-crm.inovatitech.com.br` | `127.0.0.1:9403` |

`FRONTEND_URL` em `.env` deve coincidir com o hostname público.

## WhatsApp dual-path

- **Meta Oficial (alvo):** `docs/chatwoot-whatsapp-setup.md` § A + `scripts/create_whatsapp_inbox.rb`
- **Evolution QR (transitório):** profile opcional — **não** sobe com o compose padrão

```powershell
copy evolution.env.example evolution.env
# editar EVOLUTION_API_KEY e CHATWOOT_TOKEN (aspas em CHATWOOT_INBOX_NAME)
docker compose -f docker-compose.yml -f docker-compose.vps.yml `
  -f docker-compose.evolution.yml --profile whatsapp-evolution `
  --env-file .env --env-file evolution.env up -d

# Linux/macOS/VPS
# ./scripts/setup-evolution-instance.sh
```

Porta Evolution: `127.0.0.1:9416` (ADR 005). Cutover Meta no mesmo doc § checklist.

## Webhooks → n8n

Configure no Chatwoot (Settings → Integrations → Webhooks):

- **URL:** `https://n8n-crm.inovatitech.com.br/webhook/lead-inbound` (ou path do workflow importado)
- **Eventos:** `message_created`, `conversation_status_changed`, `conversation_created`
- **Assinatura:** HMAC com `WEBHOOK_SECRET` — ver [docs/webhook-signing.md](../docs/webhook-signing.md)

Fluxo: `Canal → Chatwoot → webhook (HMAC) → n8n → API NestJS (Bearer API_TOKEN)`.

## Portas

| Ambiente | Host bind        | Container |
| -------- | ---------------- | --------- |
| VPS      | `127.0.0.1:9403` | `3000`    |
| Dev      | (rede Docker)    | `3000`    |

Mapa completo: [docs/ports.md](../docs/ports.md).

## Documentação

- [integracao-chatwoot.md](../docs/integracao-chatwoot.md)
- [webhook-signing.md](../docs/webhook-signing.md)
