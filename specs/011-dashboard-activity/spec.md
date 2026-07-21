# Especificação: Dashboard Activity Timeline

**ID:** `011-dashboard-activity`  
**Status:** aprovado  
**Autor:** Inova CRM AI  
**Data:** 2026-07-20  
**Fase do roadmap:** pós-7 (produto)

---

## 1. Contexto e problema

O Dashboard Ember exibe KPIs reais (`GET /dashboard/summary`) mas a seção "Atividade recente" ainda é placeholder.

**Problema:** gestor não vê o que aconteceu recentemente no tenant.  
**Impacto:** falta de contexto operacional no primeiro viewport do CRM.

---

## 2. Objetivo

Expor `GET /dashboard/activity` (tenant-scoped) e renderizar timeline Ember no Dashboard.

### Fora de escopo

- Feed em tempo real / WebSocket
- Consumo direto de RabbitMQ no frontend
- Meta WABA

---

## 3. Requisitos funcionais

### RF-01 — Activity API

**Como** usuário autenticado, **quero** listar atividades recentes do meu tenant, **para** ver leads/oportunidades/conversas/empresas/contatos criados ou atualizados.

**Critérios de aceite:**

- [ ] `GET /api/v1/dashboard/activity?limit=20` retorna itens `{ id, kind, label, href, occurredAt }`
- [ ] Filtrado por `tenantId`; limite default 20, max 50
- [ ] Teste unitário prova isolamento / ordenação

### RF-02 — UI Timeline

- [ ] `DashboardClient` substitui placeholder por lista Ember (empty state se vazio)
- [ ] Links navegam para rotas CRM existentes (`/leads/:id`, `/funil`, `/atendimento`, `/empresas/:id`, `/contatos/:id`)

---

## 4. Camadas

- [x] Frontend
- [x] Backend API
- [ ] n8n / workers / Chatwoot

---

## 5. Definition of Done

- [ ] Gate PASS
- [ ] Specs/tasks marcados
- [ ] Baseline atualizado
