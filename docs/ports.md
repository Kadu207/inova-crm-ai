# Mapa de Portas — Inova CRM AI

**Bloco reservado:** `9400–9419`  
**Versão:** 1.0 (Fase 0)  
**Regra:** conflito neste bloco = Quality Gate FAIL

Antes de `docker compose up`, executar `infrastructure/scripts/check-ports.ps1` ou `check-ports.sh`.

Roteamento externo via **Cloudflare Tunnel** — sem bind público em 80/443/5432/6379/5672.

---

## Serviços publicados (Tunnel / SSH)

| Porta host | Serviço             | Hostname Cloudflare              | Porta container | Notas                 |
| ---------- | ------------------- | -------------------------------- | --------------- | --------------------- |
| **9400**   | Frontend Next.js    | `crm.inovatitech.com.br`         | 3000            | App principal         |
| **9401**   | API NestJS          | `api-crm.inovatitech.com.br`     | 3000            | REST + OpenAPI        |
| **9402**   | AI FastAPI          | `ai-crm.inovatitech.com.br`      | 8000            | RAG, agentes (Fase 6) |
| **9403**   | Chatwoot            | `chat-crm.inovatitech.com.br`    | 3000            | Canais omnichannel    |
| **9404**   | n8n                 | `n8n-crm.inovatitech.com.br`     | 5678            | Orquestração only     |
| **9405**   | MinIO API           | `s3-crm.inovatitech.com.br`      | 9000            | S3-compatible         |
| **9406**   | MinIO Console       | `storage-crm.inovatitech.com.br` | 9001            | Admin UI              |
| **9407**   | RabbitMQ Management | — (VPN/SSH)                      | 15672           | Não expor na internet |
| **9408**   | Grafana             | `ops-crm.inovatitech.com.br`     | 3000            | Observabilidade       |

## Observabilidade interna

| Porta host | Serviço    | Porta container | Notas             |
| ---------- | ---------- | --------------- | ----------------- |
| **9409**   | Prometheus | 9090            | Scrape interno    |
| **9410**   | Loki       | 3100            | Agregação de logs |

## Workers (health / debug)

| Porta host | Worker              | Notas                         |
| ---------- | ------------------- | ----------------------------- |
| **9411**   | worker-crm-leads    | `lead.*` consumer             |
| **9412**   | worker-crm-pipeline | `opportunity.*` consumer      |
| **9413**   | worker-crm-billing  | `invoice.*` consumer (Fase 5) |
| **9414**   | worker-crm-ai       | `ai.*` consumer (Fase 6)      |
| **9415**   | worker-crm-audit    | Outbox + auditoria async      |

## Reservado para expansão

| Porta host | Uso                           |
| ---------- | ----------------------------- |
| **9416**   | Reservado                     |
| **9417**   | Reservado                     |
| **9418**   | Reservado                     |
| **9419**   | Sentinel / check-ports anchor |

---

## Sem publish no host

| Serviço       | Porta container | Rede                    |
| ------------- | --------------- | ----------------------- |
| PostgreSQL    | 5432            | `inova-crm` Docker only |
| Redis         | 6379            | `inova-crm` Docker only |
| RabbitMQ AMQP | 5672            | `inova-crm` Docker only |

---

## Colisões a evitar (outros produtos Inova na mesma VPS)

| Produto       | Portas conhecidas |
| ------------- | ----------------- |
| Inova Finance | 5442, 5680, 3101  |
| Inova-TI      | 9300–9304         |

---

## Referências

- `.cursor/rules/ports.mdc`
- [devops.md](./devops.md)
- [manual-implantacao-producao.md](./manual-implantacao-producao.md)
