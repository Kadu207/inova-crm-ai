# Plano: RBAC na navegação e páginas por papel

**Spec:** [`030-rbac-navigation-roles`](./spec.md)  
**Status:** rascunho  
**Data:** 2026-08-18

---

## 1. Resumo

Estender `NavItem` com `roles`, filtrar Sidebar/BottomNav, adicionar guard no layout CRM. Matriz alinhada aos `@Roles` do backend (Spec 029).

**MVP:** filtro de nav + redirect em rotas sensíveis + testes unitários do helper.

---

## 2. Matriz (MVP)

| Rota / item       | SUPER_ADMIN | ADMIN | MANAGER | SALES | SUPPORT | VIEWER |
| ----------------- | ----------- | ----- | ------- | ----- | ------- | ------ |
| CRM core (leads…) | ✓           | ✓     | ✓       | ✓     | ✓       | ✓      |
| `/relatorios`     | ✓           | ✓     | ✓       | ✓     | —       | —      |
| `/configuracoes`  | ✓           | ✓     | ✓\*     | —     | —       | —      |
| `/usuarios`       | ✓           | ✓     | ✓\*     | —     | —       | —      |
| `/permissoes`     | ✓           | ✓     | ✓       | —     | —       | —      |
| `/auditoria`      | ✓           | ✓     | ✓       | —     | —       | —      |
| `/bulk`           | ✓           | ✓     | ✓       | —     | —       | —      |
| `/admin`          | ✓           | —     | —       | —     | —       | —      |
| `/financeiro`…    | ✓           | ✓     | ✓       | —     | —       | —      |

\*MANAGER: leitura config / list users conforme API atual (ajustar se API for mais restrita).

---

## 3. Fases

### A — Helper + nav filter

### B — Route guard layout

### C — Testes + gate

---

## 4. Rollback

Reverter commits frontend; API inalterada.
