# Plano de implementação: [TÍTULO DA FEATURE]

**Spec:** `[NNN-nome-curto]` → [link para spec.md](../specs/NNN-nome-curto/spec.md)  
**Status:** rascunho | em execução | concluído  
**Autor:** [nome]  
**Data:** [AAAA-MM-DD]

---

## 1. Resumo executivo

[2–4 frases: o que será construído, em qual ordem, e como validar.]

**Entrega mínima (MVP):**  
[O menor conjunto que prova valor, alinhado à construção incremental.]

---

## 2. Alinhamento com a constituição

| Princípio         | Como este plano respeita                                 |
| ----------------- | -------------------------------------------------------- |
| Incremental       | [entrega por fatias]                                     |
| API/toolbelt only | [sem acesso direto a DB/MinIO por agentes]               |
| Tenant-first      | [tenantId + RLS em todas as mudanças de schema]          |
| n8n orquestrador  | [webhooks → API, sem regra de negócio no n8n]            |
| TDD               | [testes por bounded context antes/durante implementação] |
| Quality Gate      | [gate PASS antes de marcar tasks DONE]                   |

---

## 3. Arquitetura da solução

```
[Diagrama ASCII: UI → API → PG / Redis / RabbitMQ / MinIO / Chatwoot / n8n]
```

### Componentes tocados

| Caminho           | Mudança prevista |
| ----------------- | ---------------- |
| `frontend/`       |                  |
| `backend/`        |                  |
| `workers/`        |                  |
| `ai-services/`    |                  |
| `n8n/`            |                  |
| `infrastructure/` |                  |
| `docs/`           |                  |

---

## 4. Fases de implementação

### Fase A — [Nome] (estimativa: [Xh/d])

**Objetivo:** [resultado verificável]

**Tarefas:**

1. [Tarefa concreta]
2. [Tarefa concreta]

**Critério de done:**

- [ ] Testes verdes no bounded context
- [ ] Quality Gate PASS (`npm run gate`)

### Fase B — [Nome]

[Repetir estrutura]

---

## 5. Decisões técnicas

| Decisão       | Opções consideradas   | Escolha         | Motivo  |
| ------------- | --------------------- | --------------- | ------- |
| [ex.: evento] | sync HTTP vs RabbitMQ | RabbitMQ outbox | ADR 004 |

---

## 6. Riscos e mitigações

| Risco                  | Probabilidade | Impacto | Mitigação                  |
| ---------------------- | ------------- | ------- | -------------------------- |
| Vazamento cross-tenant | baixa         | crítico | RLS + testes de isolamento |
|                        |               |         |                            |

---

## 7. Rollback

[Como reverter: migrations Prisma, feature flags, deploy anterior.]

---

## 8. Validação pós-implementação

Atualizar [baseline.md](../memory/baseline.md) **somente após Quality Gate PASS**:

- [ ] Build frontend OK (se aplicável)
- [ ] Build backend OK
- [ ] Testes unit/integration ≥ 70% no contexto tocado
- [ ] `npm run gate` PASS
- [ ] Eventos documentados no catálogo (se novos)
- [ ] Workflows n8n importáveis (se aplicável)

---

## 9. Próximos passos (fora deste plano)

- [Spec futura ou melhoria deferida]

---

## Histórico

| Versão | Data | Alteração     |
| ------ | ---- | ------------- |
| 0.1    |      | Plano inicial |
