# Especificação: [TÍTULO DA FEATURE]

**ID:** `[NNN-nome-curto]`  
**Status:** rascunho | revisão | aprovado | implementado  
**Autor:** [nome]  
**Data:** [AAAA-MM-DD]  
**Fase do roadmap:** [0–7]

---

## 1. Contexto e problema

Descreva o cenário comercial ou operacional do CRM que motiva esta feature.
Referencie o [Plano Mestre](../../Plano_Mestre_Inova_CRM_AI.md) e a [Constituição](../memory/constitution.md) quando relevante.

**Problema:**  
[O que não funciona hoje ou o que falta?]

**Impacto se não resolver:**  
[Comercial, atendimento, financeiro, LGPD, etc.]

---

## 2. Objetivo

[Uma frase clara do resultado desejado — mensurável quando possível.]

### Fora de escopo

- [O que esta spec **não** cobre]
- [Deferências para specs futuras]

---

## 3. Usuários e papéis

| Ator                          | Papel               | Interesse                |
| ----------------------------- | ------------------- | ------------------------ |
| [ex.: vendedor]               | `sales`             | [o que precisa fazer]    |
| [ex.: agente n8n Atendimento] | serviço (API_TOKEN) | [endpoints usados]       |
| [ex.: tenant admin]           | `admin`             | [configuração do tenant] |

**Tenant:** toda operação deve incluir `tenantId` — ver [multi-tenant](../../docs/multi-tenant.md).

---

## 4. Requisitos funcionais

### RF-01 — [Nome curto]

**Como** [ator], **quero** [ação], **para** [benefício].

**Critérios de aceite:**

- [ ] [Comportamento verificável 1]
- [ ] [Comportamento verificável 2]

### RF-02 — [Nome curto]

[Repetir estrutura]

---

## 5. Requisitos não funcionais

| ID     | Categoria    | Requisito                                        |
| ------ | ------------ | ------------------------------------------------ |
| RNF-01 | Multi-tenant | `tenantId` em todas as entidades de domínio; RLS |
| RNF-02 | Segurança    | Menor privilégio, auditoria, LGPD                |
| RNF-03 | Performance  | [ex.: resposta API < 300ms p95]                  |
| RNF-04 | Eventos      | Publicar no catálogo RabbitMQ se alterar domínio |

---

## 6. Integrações e camadas afetadas

Marque as camadas:

- [ ] **Frontend** (`frontend/`)
- [ ] **Backend API** (`backend/`)
- [ ] **Workers** (`workers/`)
- [ ] **AI** (`ai-services/`)
- [ ] **n8n** (`n8n/`) — somente orquestração
- [ ] **Chatwoot** — webhooks/canais
- [ ] **Infra** (`infrastructure/`)

**Endpoints / eventos envolvidos:**

| Nome | Método / tipo | Descrição |
| ---- | ------------- | --------- |
|      |               |           |

---

## 7. Guardrails e aprovações

- [ ] Requer humano no loop? (fatura, delete, export PII, mensagem cliente)
- [ ] Novos eventos RabbitMQ? Registrar em `docs/events/catalog-v0.md`
- [ ] n8n apenas orquestra? (sem regra de negócio em Function/IF)
- [ ] Quality Gate PASS antes de marcar implementado?

---

## 8. Dados e modelo

[Alterações Prisma, migrações, índices — ou "nenhuma".]

```prisma
// Exemplo: sempre incluir tenantId em tabelas de domínio
// tenantId String @map("tenant_id")
// @@index([tenantId])
```

---

## 9. Cenários de teste (TDD)

1. [Caminho feliz principal — unit/integration]
2. [Caso de erro esperado]
3. [Caso de permissão negada / tenant isolado]
4. [Contrato de evento, se aplicável]

---

## 10. Dependências

| Dependência | Spec / componente | Status |
| ----------- | ----------------- | ------ |
|             |                   |        |

---

## 11. Referências

- [Plano Mestre](../../Plano_Mestre_Inova_CRM_AI.md)
- [Constituição](../memory/constitution.md)
- [Catálogo de eventos](../../docs/events/catalog-v0.md)
- [Mapa de portas](../../docs/ports.md)

---

## Histórico de revisões

| Versão | Data | Autor | Alteração        |
| ------ | ---- | ----- | ---------------- |
| 0.1    |      |       | Rascunho inicial |
