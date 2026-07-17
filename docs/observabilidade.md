# Observabilidade — Inova CRM AI

**Volume:** 12  
**Versão:** 0.1 (Fase 0 — skeleton)  
**Status:** em construção

---

## Propósito

Logs estruturados, métricas, traces, alertas e dashboards para operação do stack CRM.

---

## Sumário

1. [Propósito](#propósito)
2. [Pilares](#pilares)
3. [Stack](#stack)
4. [Logs](#logs)
5. [Métricas](#métricas)
6. [Traces](#traces)
7. [Alertas](#alertas)
8. [Dashboards](#dashboards)
9. [Portas](#portas)

---

## Pilares

- **Logs** — JSON estruturado com `tenantId`, `correlationId`
- **Métricas** — RED/USE por serviço
- **Traces** — request cross-service (API → worker → AI)

## Stack

| Ferramenta | Função     | Porta host |
| ---------- | ---------- | ---------- |
| Grafana    | Dashboards | 9408       |
| Prometheus | Métricas   | 9409       |
| Loki       | Logs       | 9410       |
| Sentry     | Erros app  | SaaS       |

## Logs

- NestJS: Pino ou Winston JSON
- Correlação via header `X-Correlation-Id`
- Sem PII em logs de debug

## Métricas

- Latência API p50/p95/p99
- Fila RabbitMQ depth
- Taxa de falha workers
- Uptime Chatwoot/n8n

## Traces

OpenTelemetry — integrar na Fase 1+ conforme maturidade.

## Alertas

- API error rate > 1%
- RabbitMQ consumer lag
- Disco MinIO > 80%
- n8n workflow failure spike

## Dashboards

`ops-crm.inovatitech.com.br` — Grafana com painéis por serviço e tenant (agregado).

## Portas

Ver [ports.md](./ports.md) — 9408–9410 reservadas para observabilidade.
