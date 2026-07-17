# Arquitetura — Visão geral

## Componentes (roadmap)

| Serviço     | Stack            | Porta host  | Fase |
| ----------- | ---------------- | ----------- | ---- |
| Frontend    | Next.js          | 9400        | 4    |
| API         | NestJS + Prisma  | 9401        | 4    |
| AI          | FastAPI          | 9402        | 6    |
| Chatwoot    | Ruby             | 9403        | 2    |
| n8n         | Node             | 9404        | 3    |
| MinIO       | S3 API / Console | 9405 / 9406 | 1    |
| RabbitMQ UI | Management       | 9407        | 1    |
| Grafana     | Observability    | 9408        | 7    |
| PostgreSQL  | 16-alpine        | 9410 (dev)  | 1    |

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
