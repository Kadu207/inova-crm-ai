# RBAC na navegação (Spec 030)

Matriz UI alinhada aos `@Roles` da API (Spec 029). A UI **não** substitui a API — deep-links proibidos redirecionam para `/`.

## Papéis

| Rota / item       | SUPER_ADMIN | ADMIN | MANAGER | SALES | SUPPORT | VIEWER |
| ----------------- | ----------- | ----- | ------- | ----- | ------- | ------ |
| CRM core          | ✓           | ✓     | ✓       | ✓     | ✓       | ✓      |
| `/relatorios`     | ✓           | ✓     | ✓       | ✓     | —       | —      |
| `/financeiro`…    | ✓           | ✓     | ✓       | —     | —       | —      |
| Sistema (config…) | ✓           | ✓     | ✓       | —     | —       | —      |
| `/admin`          | ✓           | —     | —       | —     | —       | —      |

Implementação: `frontend/lib/navigation.ts` · filtro em `Sidebar` / `BottomNav` · guard em `AppShell`.
