# Especificacao: Soft-delete + purge LGPD

**ID:** `018-soft-delete-lgpd-purge`  
**Status:** aprovado  
**Autor:** Inova CRM AI  
**Data:** 2026-07-21  
**Fase do roadmap:** pos-7 (produto / LGPD)

---

## Objetivo

Substituir hard delete (Spec 017) por soft-delete (`deletedAt`) nas entidades CRM com DELETE na UI, e expor purge agendado (API_TOKEN) que remove definitivamente registros apos periodo de retencao.

### Entidades

leads, companies, contacts, products, services, tasks, opportunities

### Fora de escopo

- Restore UI
- Export titular / portabilidade completa
- Meta WABA

## Criterios

- [ ] Coluna `deleted_at` + listagens/detalhe ignoram soft-deleted
- [ ] `DELETE` marca `deletedAt` (evento `*.deleted` mantido)
- [ ] `POST /lgpd/purge` (PlatformApi) hard-delete apos `LGPD_PURGE_RETENTION_DAYS`
- [ ] Gate PASS; docs LGPD/eventos/baseline; migrate VPS
