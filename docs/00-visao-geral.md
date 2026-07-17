# Visão Geral da Plataforma — Inova CRM AI

**Volume:** 00  
**Versão:** 0.1 (Fase 0 — skeleton)  
**Status:** em construção

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
7. [Roadmap de fases](#roadmap-de-fases)
8. [Documentação relacionada](#documentação-relacionada)

---

## Objetivo de negócio

<!-- TODO Fase 1+: expandir com KPIs e personas -->

Plataforma CRM integrada aos produtos Inova TI para gestão comercial, atendimento omnichannel e automação inteligente.

## Escopo da plataforma

- CRM Web completo (20 módulos)
- Atendimento via Chatwoot dedicado
- Automação via n8n dedicado (orquestração only)
- IA para qualificação, RAG e agentes especializados
- Multi-tenant SaaS com LGPD

## Stack resumida

| Camada     | Tecnologia                                  |
| ---------- | ------------------------------------------- |
| Frontend   | Next.js, TypeScript, Tailwind, shadcn/ui    |
| Backend    | NestJS, Prisma, PostgreSQL                  |
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

## Roadmap de fases

Ver [roadmap.md](./roadmap.md) e [Plano Mestre](../Plano_Mestre_Inova_CRM_AI.md).

## Documentação relacionada

- [Arquitetura corporativa](./arquitetura-corporativa.md)
- [Constituição](../.specify/memory/constitution.md)
- [Mapa de portas](./ports.md)
