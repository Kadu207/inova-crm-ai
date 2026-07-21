# Especificação: Ember Studio Rollout

**ID:** `008-ember-studio-rollout`  
**Status:** aprovado  
**Autor:** Inova CRM AI  
**Data:** 2026-07-20  
**Fase do roadmap:** pós-7 (UI)

---

## 1. Contexto e problema

Piloto Ember Studio cobre Dashboard (stubs), Leads e Funil. Atendimento ainda usa tokens legados; Contatos/Oportunidades usam lista simples; KPIs do Dashboard não vêm da API.

**Problema:** inconsistência visual e Dashboard sem dados reais.

**Impacto:** UX fragmentada; gestor sem visão operacional.

---

## 2. Objetivo

1. `GET /dashboard/summary` + Dashboard com KPIs reais.
2. Atendimento, Contatos e Oportunidades no padrão Ember.
3. Checklist visual 375/768/1280 documentado.

### Fora de escopo

- Meta WABA, MinIO backup, detalhe/create lead, drag-and-drop
- Rollout completo de todas as rotas CrmPage (009)

---

## 3. Critérios de aceite

- Summary tenant-scoped com testes
- UI dark Ember nas 3 superfícies + Dashboard vivo
- Gate PASS; checklist em `docs/design/system.md`
