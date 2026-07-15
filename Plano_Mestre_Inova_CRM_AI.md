# Plano Mestre -- Inova CRM AI

Versão: 1.0

## Objetivo

Construir uma plataforma CRM SaaS integrada ao Chatwoot e n8n, preparada
para evolução com IA, multi-tenant e integração aos produtos da Inova
TI.

## Objetivos técnicos

-   CRM Web completo
-   Atendimento omnichannel com Chatwoot
-   Automação com n8n
-   PostgreSQL
-   Redis
-   RabbitMQ (eventos internos)
-   Docker + Traefik
-   Cloudflare
-   API REST
-   IA especializada
-   Multi-tenant

## Arquitetura

Frontend: - Next.js - TypeScript - Tailwind - shadcn/ui

Backend: - NestJS - Prisma - PostgreSQL - Redis - RabbitMQ - Swagger

IA: - FastAPI - OpenAI/OpenRouter - RAG - Agentes especializados

Infraestrutura: - Debian 13 - Docker Compose - Traefik - Cloudflare -
Grafana - Prometheus - Loki - Sentry

## Módulos do CRM

1.  Dashboard
2.  Empresas
3.  Contatos
4.  Leads
5.  Funil Kanban
6.  Oportunidades
7.  Agenda
8.  Tarefas
9.  Produtos
10. Serviços
11. Propostas
12. Contratos
13. Financeiro
14. Cobrança
15. Atendimento
16. Relatórios
17. Configurações
18. Usuários
19. Permissões
20. Auditoria

## Integrações

-   Chatwoot
-   n8n
-   WhatsApp
-   Instagram
-   Facebook
-   Email
-   Cloudflare R2/MinIO
-   APIs REST
-   Webhooks

## Fluxos principais

1.  Novo lead → Chatwoot → n8n → CRM
2.  Qualificação automática por IA
3.  Criação de oportunidade
4.  Geração de proposta
5.  Follow-up automático
6.  Cobrança automatizada
7.  Pós-venda

## Estrutura de pastas

    inova-crm-ai/
      docs/
      frontend/
      backend/
      ai-services/
      workers/
      infrastructure/
      chatwoot/
      n8n/

## Roadmap

Fase 1 - Infraestrutura - Docker - Traefik - PostgreSQL - Redis

Fase 2 - Chatwoot

Fase 3 - n8n

Fase 4 - CRM MVP

Fase 5 - Financeiro - Cobrança

Fase 6 - IA

Fase 7 - SaaS Multi-tenant

## Regras de engenharia

-   Clean Architecture
-   DDD
-   SOLID
-   TDD
-   OpenAPI
-   Event Driven
-   CI/CD
-   Observabilidade
-   LGPD
-   Segurança por padrão

## Critérios de aceite

-   Cobertura de testes
-   APIs documentadas
-   Logs estruturados
-   Auditoria
-   Backups
-   Escalabilidade horizontal

## Prompt para Cursor/Claude Code

"Implemente este projeto seguindo rigorosamente esta documentação.
Utilize arquitetura limpa, DDD, SOLID, TDD, Event Driven, PostgreSQL,
Redis, RabbitMQ, Next.js, NestJS, FastAPI, Docker, Traefik e
Chatwoot+n8n. Nenhuma regra de negócio deve ficar dentro do n8n; ele
será apenas o orquestrador. Gere código modular, documentado, testável e
preparado para evolução SaaS multi-tenant."
