# Chatwoot — Inova CRM AI

Instância **dedicada** ao CRM (`chat-crm.inovatitech.com.br`). Não reutiliza stacks Inova-TI ou outros produtos.

## Arquitetura

| Serviço  | Container                    | Rede              |
| -------- | ---------------------------- | ----------------- |
| Rails UI | `crm_chatwoot_rails`         | `cw`, `inova-crm` |
| Sidekiq  | `crm_chatwoot_sidekiq`       | `cw`              |
| Postgres | `crm_cw_postgres` (pgvector) | `cw`              |
| Redis    | `crm_cw_redis`               | `cw`              |

A rede Docker `inova-crm` é criada pelo stack `infrastructure/` e anexada aqui como **external**, permitindo que API/workers alcancem o Chatwoot por hostname `crm_chatwoot_rails` (ou `rails` dentro do projeto `crm-chatwoot`).

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
