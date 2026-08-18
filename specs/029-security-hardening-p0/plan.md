# Plano de implementação: Security hardening P0

**Spec:** [`029-security-hardening-p0`](./spec.md)  
**Status:** em execução  
**Autor:** Squad Build  
**Data:** 2026-08-18

---

## 1. Resumo executivo

Entregar P0 em uma fatia: (A) scrub de secrets nos scripts, (B) migration RLS + teste SQL, (C) `resolveJwtSecret` fail-fast, (D) middleware Bearer no FastAPI + testes. Validar com testes do bounded context e `npm run gate`.

**Entrega mínima (MVP):** RF-01…RF-04 verdes; P1 documentado em `tasks.md` sem implementação nesta fatia.

---

## 2. Alinhamento com a constituição

| Princípio         | Como este plano respeita                     |
| ----------------- | -------------------------------------------- |
| Incremental       | Só P0; P1 em tasks futuras                   |
| API/toolbelt only | AI autenticado; sem acesso DB direto         |
| Tenant-first      | RLS nas 3 tabelas faltantes                  |
| n8n orquestrador  | N/A                                          |
| TDD               | Testes JWT + RLS SQL + pytest AI antes/junto |
| Quality Gate      | Gate PASS antes de DONE                      |

---

## 3. Arquitetura da solução

```
Scripts ops ──env──► SEED_ADMIN_PASSWORD (não git)
NestJS ──resolveJwtSecret──► JWT (fail se prod fraco)
Postgres ◄── RLS policy ── webhook_subscriptions / bulk_jobs / custom_field_definitions
AI FastAPI ◄── Bearer AI_API_TOKEN ── callers (API/n8n/rede Docker)
```

### Componentes tocados

| Caminho           | Mudança prevista                                        |
| ----------------- | ------------------------------------------------------- |
| `backend/`        | migration RLS, `resolveJwtSecret`, auth module/strategy |
| `ai-services/`    | auth dependency + testes + README                       |
| `infrastructure/` | scripts sem literais de senha                           |
| `docs/`           | nota curta se portas/API auth AI mudarem                |
| `specs/029-…`     | spec / plan / tasks                                     |

---

## 4. Fases de implementação

### Fase A — Spec Kit artifacts (0.5h)

**Objetivo:** spec + plan + tasks versionados.

**Critério de done:** arquivos em `specs/029-security-hardening-p0/`.

### Fase B — Secrets scrub (P0)

**Objetivo:** scripts leem env; zero literais.

**Critério de done:** grep limpo; scripts documentados.

### Fase C — RLS migration (P0)

**Objetivo:** SQL + teste em `rls.spec.ts`.

**Critério de done:** migration presente; unit SQL verde.

### Fase D — JWT + AI auth (P0)

**Objetivo:** fail-fast JWT; Bearer AI.

**Critério de done:** unit Nest + pytest verdes.

### Fase E — Gate

**Objetivo:** `npm run gate` PASS.

---

## 5. Decisões técnicas

| Decisão      | Opções                  | Escolha                                         | Motivo               |
| ------------ | ----------------------- | ----------------------------------------------- | -------------------- |
| JWT fail     | sempre vs só production | só production + rejeitar weak                   | DX local sem quebrar |
| AI sem token | open vs 503             | 503 em production; 401 se token setado e errado | fail-closed          |
| Testes AI    | conftest token fixo     | `AI_API_TOKEN=test-ai-token`                    | determinístico       |

---

## 6. Riscos e mitigações

| Risco                       | Prob. | Impacto | Mitigação                                   |
| --------------------------- | ----- | ------- | ------------------------------------------- |
| Migration RLS em prod       | média | alto    | SQL idempotente ENABLE/FORCE/DROP+CREATE    |
| Scripts ops quebram sem env | alta  | médio   | Mensagem clara `:?` / usage                 |
| Callers AI sem header       | média | médio   | Documentar; rede Docker; compose já tem var |
| Senha antiga ainda válida   | alta  | crítico | Checklist humano: rotacionar na VPS         |

---

## 7. Rollback

- Migration RLS: `DROP POLICY` + `DISABLE ROW LEVEL SECURITY` (só se emergência; não recomendado)
- JWT/AI: revert código; compose env permanece
- Scripts: revert arquivos

---

## 8. Validação pós-implementação

- [ ] Testes unit RLS SQL / JWT / pytest AI
- [ ] `npm run gate` PASS
- [ ] Docs AI README atualizado
- [ ] baseline só após gate (se fechar Spec)

---

## 9. Próximos passos (fora deste plano)

- P1: register lock, SUPER_ADMIN DTO, `@Roles` mutações, webhook secret/tenant, LGPD per-tenant, `where: { id, tenantId }`

---

## Histórico

| Versão | Data       | Alteração     |
| ------ | ---------- | ------------- |
| 0.1    | 2026-08-18 | Plano inicial |
