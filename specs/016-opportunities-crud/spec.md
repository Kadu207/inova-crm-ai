# Especifica\u00e7\u00e3o: Oportunidades create/edit fora do funil

**ID:** `016-opportunities-crud`  
**Status:** aprovado  
**Autor:** Inova CRM AI  
**Data:** 2026-07-21  
**Fase do roadmap:** p\u00f3s-7 (produto)

---

## Objetivo

Permitir listar, criar e editar oportunidades em `/oportunidades` (fora do kanban `/funil`), usando `GET/POST/PATCH /opportunities` e `GET /pipelines` j\u00e1 existentes.

### Fora de escopo

- Delete UI (Spec 017)
- Meta WABA
- Altera\u00e7\u00e3o do DnD do funil

## Crit\u00e9rios

- [ ] Lista Ember + modal create (t\u00edtulo, valor, pipeline/est\u00e1gio)
- [ ] Detalhe `/oportunidades/[id]` com edit (t\u00edtulo, valor, est\u00e1gio, status)
- [ ] Gate PASS; docs/baseline
