# Visão Geral da Plataforma — Inova CRM AI

**Volume:** 00  
**Versão:** 1.2  
**Status:** Fases 0–7 DONE · Pós-fase ativa (Spec 026 Zoho → 027 Meta)  
**Sistema:** v1.0.0 — [historico-versoes.md](./historico-versoes.md)

---

## Propósito

Documento âncora do pacote corporativo. Apresenta a visão executiva do CRM SaaS da Inova TI: omnichannel (Chatwoot), automação (n8n), event-driven (RabbitMQ), IA especializada e multi-tenant desde o dia 1.

---

## Sumário

1. [Propósito](#propósito)
2. [Objetivo de negócio](#objetivo-de-negócio)
3. [Escopo da plataforma](#escopo-da-plataforma)
4. [Stack resumida](#stack-resumida)
5. [Princípios arquiteturais](#princípios-arquiteturais)
6. [Domínios e hostnames](#domínios-e-hostnames)
7. [Roadmap](#roadmap)
8. [Documentação relacionada](#documentação-relacionada)

---

## Objetivo de negócio

Plataforma CRM integrada aos produtos Inova TI para gestão comercial, atendimento omnichannel e automação inteligente — multi-tenant, LGPD e Quality Gate hard-stop.

## Escopo da plataforma

- CRM Web completo (módulos comerciais + admin SaaS)
- Atendimento via Chatwoot dedicado
- Automação via n8n dedicado (orquestração only)
- IA para qualificação, RAG e agentes especializados
- Multi-tenant SaaS com LGPD
- Pós-fase: paridade Zoho seletiva (026) e WhatsApp Oficial Meta (027)

## Stack resumida

| Camada     | Tecnologia                                  |
| ---------- | ------------------------------------------- |
| Frontend   | Next.js, TypeScript, Tailwind, Ember Studio |
| Backend    | NestJS, Prisma, PostgreSQL + RLS            |
| IA         | FastAPI, OpenAI/OpenRouter, RAG             |
| Mensageria | RabbitMQ (eventos), Redis (cache/filas n8n) |
| Storage    | MinIO dedicado                              |
| Infra      | Docker, Cloudflare Tunnel, VPS Hetzner      |

## Princípios arquiteturais

- Tenant-first + RLS desde o dia 1
- Quality Gate hard-stop entre tasks
- n8n orquestrador — regras no backend
- Canais somente via Chatwoot
- TDD por bounded context

## Domínios e hostnames

| Serviço | URL                           |
| ------- | ----------------------------- |
| CRM     | `crm.inovatitech.com.br`      |
| API     | `api-crm.inovatitech.com.br`  |
| Chat    | `chat-crm.inovatitech.com.br` |
| n8n     | `n8n-crm.inovatitech.com.br`  |
| AI      | `ai-crm.inovatitech.com.br`   |
| Ops     | `ops-crm.inovatitech.com.br`  |

## Roadmap

Fases 0–7 **concluídas**. Fila pós-fase: [roadmap.md](./roadmap.md) · [Plano Mestre](../Plano_Mestre_Inova_CRM_AI.md) · [historico-versoes.md](./historico-versoes.md).

## Documentação relacionada

- [Arquitetura corporativa](./arquitetura-corporativa.md)
- [Constituição](../.specify/memory/constitution.md)
- [Mapa de portas](./ports.md)
- [Baseline](../.specify/memory/baseline.md)
