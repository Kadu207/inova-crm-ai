# Plano de implementação: Mensagens omnichannel

**Spec:** [`033-omnichannel-messages`](./spec.md)  
**Status:** concluído  
**Autor:** Squad Build  
**Data:** 2026-11-17

---

## 1. Resumo executivo

Persistir cada mensagem Chatwoot no CRM, publicar `conversation.message.*`, filtrar e mostrar fio em `/atendimento`. n8n só encaminha campos novos. Sem segundo pipeline Meta.

**Entrega mínima (MVP):** inbound grava mensagem + UI mostra origem WhatsApp/Telegram.

---

## 2. Alinhamento com a constituição

| Princípio         | Como este plano respeita                    |
| ----------------- | ------------------------------------------- |
| Incremental       | Schema → inbound → n8n → UI → gate          |
| API/toolbelt only | Persistência só na Nest                     |
| Tenant-first      | `tenantId` + RLS + unique `(tenant, msgId)` |
| n8n orquestrador  | Set + HTTP; sem Function                    |
| TDD               | Specs de leads/conversations antes do DONE  |
| Quality Gate      | `npm run gate` PASS                         |

---

## 3. Arquitetura da solução

```
WA/TG → Chatwoot → n8n lead-inbound → POST /leads/inbound
  → Contact + Lead + Conversation + ConversationMessage
  → outbox conversation.message.received|sent
  → GET /conversations?channel= + GET /conversations/:id (messages)
  → AtendimentoClient (filtro + fio)
```

### Componentes tocados

| Caminho     | Mudança prevista                                     |
| ----------- | ---------------------------------------------------- |
| `backend/`  | Prisma model, inbound, list/detail messages, events  |
| `n8n/`      | Campos messageId/type/contentType/sentAt/attachments |
| `frontend/` | Filtro canal + thread                                |
| `docs/`     | Sync integracao-chatwoot + events note               |

---

## 4. Fases de implementação

### Fase A — Schema + inbound

1. Migration `conversation_messages` + RLS
2. DTO inbound + persistência + eventos
3. Testes isolamento / replay / canal

### Fase B — API listagem + n8n

1. `GET /conversations?channel=`
2. `GET /conversations/:id` inclui `messages`
3. Workflow `lead-inbound.json`

### Fase C — UI + gate

1. Atendimento filtro + fio
2. Docs + `npm run gate`

---

## 5. Decisões técnicas

| Decisão       | Escolha                    | Motivo                   |
| ------------- | -------------------------- | ------------------------ |
| Persistência  | No inbound (mesmo request) | Uma tratativa Meta-like  |
| Direção       | API traduz messageType     | n8n-boundary             |
| Anexos        | JSON metadado              | Sem MinIO nesta spec     |
| Notes do lead | Ponteiro curto             | Evita historico em notes |

---

## 6. Riscos e mitigações

| Risco                 | Mitigação                                          |
| --------------------- | -------------------------------------------------- |
| Duplicata webhook     | `@@unique([tenantId, chatwootMessageId])`          |
| Vazamento tenant      | RLS + teste isolamento                             |
| Payload sem messageId | Persiste sem unique key; updates notes só ponteiro |

---

## 7. Rollback

Migration down remove tabela; reverter workflow n8n; UI volta a lista simples.

---

## 8. Validação pós-implementação

- [ ] Gate PASS
- [ ] Smoke: mensagem WA/TG → linha em messages → UI
- [ ] baseline + memory após gate

---

## Histórico

| Versão | Data       | Alteração     |
| ------ | ---------- | ------------- |
| 0.1    | 2026-11-17 | Plano inicial |
