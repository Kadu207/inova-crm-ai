# Especificacao: Delete com confirmacao

**ID:** `017-entity-delete-confirm`  
**Status:** aprovado  
**Autor:** Inova CRM AI  
**Data:** 2026-07-21  
**Fase do roadmap:** pos-7 (produto)

---

## Objetivo

Permitir excluir entidades CRM (leads, empresas, contatos, produtos, servicos, tarefas, oportunidades) a partir do detalhe, com modal de confirmacao humana (constituicao §8), via `DELETE` Nest.

### Fora de escopo

- Soft-delete + purge LGPD agendado (follow-up)
- Delete em massa / lista
- Meta WABA

## Criterios

- [ ] `DELETE /:id` tenant-scoped nas entidades listadas (leads ja existe)
- [ ] Modal confirmacao antes do DELETE; redirect para lista apos sucesso
- [ ] Gate PASS; catalogo eventos + docs/baseline
