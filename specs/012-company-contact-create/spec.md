# Especificação: CRUD create Empresas e Contatos

**ID:** `012-company-contact-create`  
**Status:** aprovado  
**Autor:** Inova CRM AI  
**Data:** 2026-07-20  
**Fase do roadmap:** pós-7 (produto)

---

## 1. Contexto e problema

Leads já têm modal create + detalhe (010). Empresas e Contatos usam `CrmPage` com botão "Criar" sem ação.

**Problema:** impossível cadastrar empresas/contatos pela UI.  
**Impacto:** CRM incompleto para operação diária.

---

## 2. Objetivo

Replicar o padrão 010: modal create Ember + rota detalhe + lista com link, usando APIs Nest já existentes (`POST/GET /companies`, `/contacts`).

### Fora de escopo

- Edit/delete completo
- Create de produtos/serviços/propostas (próxima spec)
- Nova lógica de domínio no backend

---

## 3. Requisitos funcionais

### RF-01 — Empresas

- [ ] Modal create: `name` (obrigatório), `document`, `website`, `industry`
- [ ] `POST /companies`; refresh lista
- [ ] `/empresas/[id]` com `GET /companies/:id`

### RF-02 — Contatos

- [ ] Modal create: `name` (obrigatório), `email`, `phone`, `title`, `companyId` opcional
- [ ] `POST /contacts`; refresh lista
- [ ] `/contatos/[id]` com `GET /contacts/:id`

---

## 4. Camadas

- [x] Frontend
- [ ] Backend (já existe create/findOne)

---

## 5. Definition of Done

- [ ] Gate PASS
- [ ] Baseline aponta 012
