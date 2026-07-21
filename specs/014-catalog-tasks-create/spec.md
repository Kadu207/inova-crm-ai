# Especificação: Create Produtos, Serviços e Tarefas

**ID:** `014-catalog-tasks-create`  
**Status:** aprovado  
**Autor:** Inova CRM AI  
**Data:** 2026-07-21  
**Fase do roadmap:** pós-7 (produto)

---

## 1. Contexto

Empresas/contatos/leads já têm create+detail (010/012). Produtos, serviços e tarefas ainda usam `CrmPage` com botão sem ação.

## 2. Objetivo

Modal create Ember + rota detalhe + lista com link, usando APIs Nest existentes (`POST/GET /products|services|tasks`).

### Fora de escopo

- Edit/patch UI (próxima etapa após validação desta)
- Meta WABA

## 3. Critérios de aceite

- [ ] Produtos: create (`name`, `sku`, `price`, `description`) + `/produtos/[id]`
- [ ] Serviços: create (`name`, `code`, `price`, `description`) + `/servicos/[id]`
- [ ] Tarefas: create (`title`, `description`, `priority`, `dueDate`) + `/tarefas/[id]`
- [ ] Gate PASS; docs/baseline atualizados
