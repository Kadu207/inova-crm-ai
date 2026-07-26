# Arquitetura — Visão geral

## Componentes (produção)

| Serviço     | Stack            | Porta host  | Origem |
| ----------- | ---------------- | ----------- | ------ |
| Frontend    | Next.js          | 9400        | Fase 4 |
| API         | NestJS + Prisma  | 9401        | Fase 4 |
| AI          | FastAPI          | 9402        | Fase 6 |
| Chatwoot    | Ruby             | 9403        | Fase 2 |
| n8n         | Node             | 9404        | Fase 3 |
| MinIO       | S3 API / Console | 9405 / 9406 | Fase 1 |
| RabbitMQ UI | Management       | 9407        | Fase 1 |
| Grafana     | Observability    | 9408        | Fase 7 |
| PostgreSQL  | 16-alpine        | interno     | Fase 1 |

Fases 0–7 **DONE**. Próximas Specs: `026` Zoho · `027` Meta — ver [roadmap](../roadmap.md) e [histórico](../historico-versoes.md).

## Rede Docker

Todos os serviços de infraestrutura compartilham a rede `inova-crm`.

```bash
# Local (dev)
docker compose -f infrastructure/docker-compose.yml \
  -f infrastructure/docker-compose.dev.yml up -d

# VPS (fase 1 — rabbitmq + minio)
docker compose -f infrastructure/docker-compose.yml \
  -f infrastructure/docker-compose.vps.yml up -d
```

## Bancos PostgreSQL

Criados no init: `crm`, `chatwoot_crm`, `n8n_crm`.

## Constantes compartilhadas

Portas e eventos em `packages/shared/src/index.ts`.
