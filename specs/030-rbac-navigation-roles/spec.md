# Especificação: RBAC na navegação e páginas por papel

**ID:** `030-rbac-navigation-roles`  
**Status:** aprovado  
**Autor:** Squad Spec  
**Data:** 2026-08-18  
**Fase do roadmap:** pós-fase (produto contínuo) · Spec 027 Meta permanece BLOCKED

---

## 1. Contexto e problema

A API já aplica `@Roles` nas mutações (Spec 029). O frontend ainda mostra **toda** a navegação (Admin SaaS, Auditoria, Bulk, Config, Usuários) a qualquer sessão autenticada — só a página Admin filtra `SUPER_ADMIN` no client. VIEWER/SALES veem menus que a API rejeita (403), gerando UX confusa e superfície de erro.

**Problema:** navegação e páginas sensíveis não respeitam o papel do JWT no UI.

**Impacto se não resolver:** onboarding multi-user ruim, suporte sobrecarregado, percepção de “bug” em 403, risco de confiar só no esconder UI (já mitigado na API).

---

## 2. Objetivo

Filtrar **sidebar / bottom nav / deep-links** por `UserRole` alinhado aos guards da API, com redirect amigável quando a rota é proibida.

### Fora de escopo

- Meta / WABA (027)
- Trocar JWT em `localStorage` por httpOnly cookies (Spec futura)
- Redesign visual da navegação
- Novos papéis Prisma

---

## 3. Usuários e papéis

| Ator         | Papel         | Interesse                               |
| ------------ | ------------- | --------------------------------------- |
| Vendedor     | `SALES`       | CRM comercial; sem Admin/Auditoria/Bulk |
| Visualizador | `VIEWER`      | Leitura; menus de mutação admin ocultos |
| Admin tenant | `ADMIN`       | Config, usuários, bulk, auditoria       |
| Super admin  | `SUPER_ADMIN` | `/admin` SaaS                           |

**Tenant:** sessão já carrega `tenantId` + `role` — [multi-tenant](../../docs/multi-tenant.md).

---

## 4. Requisitos funcionais

### RF-01 — Matriz de navegação por papel

**Como** usuário autenticado, **quero** ver só itens de menu permitidos ao meu papel.

**Critérios de aceite:**

- [ ] `NAV_ITEMS` (ou helper) declara `roles?: UserRole[]` (omitido = todos autenticados)
- [ ] Sidebar e bottom nav filtram por `getSession()?.role`
- [ ] Itens Admin SaaS só `SUPER_ADMIN`; Auditoria/Bulk/Usuários/Config conforme matriz documentada no plan

### RF-02 — Guard de rota no AppShell / layout CRM

**Como** VIEWER, **quero** ser redirecionado se abrir URL direta de página admin.

**Critérios de aceite:**

- [ ] Deep-link `/admin`, `/auditoria`, `/bulk`, `/usuarios`, `/permissoes`, `/configuracoes` (lista no plan) → redirect `/` ou `/login` com mensagem se role insuficiente
- [ ] API continua sendo a fonte de verdade (403)

### RF-03 — Documentação

- [ ] Matriz papel × rotas em `docs/` ou plan.md
- [ ] memory.md aponta Spec 030

---

## 5. Requisitos não funcionais

| ID     | Categoria | Requisito                                  |
| ------ | --------- | ------------------------------------------ |
| RNF-01 | Segurança | UI não substitui `@Roles` da API           |
| RNF-02 | UX        | Sem flash de menu completo antes do filtro |
| RNF-03 | Gate      | `npm run gate` PASS antes de DONE          |

---

## 6. Integrações e camadas afetadas

- [x] **Frontend** (`frontend/lib/navigation.ts`, AppShell, Sidebar, BottomNav, layout)
- [ ] **Backend API** — sem mudança de contrato (já tem Roles)
- [ ] **AI / n8n / Chatwoot / Infra**

---

## 7. Guardrails

- [x] Quality Gate PASS antes de marcar implementado
- [ ] Sem novos eventos RabbitMQ

---

## 8. Dados e modelo

Nenhuma migration.

---

## 9. Cenários de teste

1. Session `SALES` → nav sem `/admin`, `/auditoria`
2. Session `VIEWER` → deep-link `/usuarios` redireciona
3. Session `SUPER_ADMIN` → `/admin` visível
4. Gate PASS

---

## 10. Dependências

| Dependência                      | Status |
| -------------------------------- | ------ |
| Spec 029 `@Roles`                | DONE   |
| `frontend/lib/auth` session.role | DONE   |

---

## 11. Referências

- Spec 029 · `frontend/lib/navigation.ts` · constituição (menor privilégio)

---

## Histórico

| Versão | Data       | Alteração     |
| ------ | ---------- | ------------- |
| 1.0    | 2026-08-18 | Spec aprovada |
