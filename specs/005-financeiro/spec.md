# Especificação: Financeiro — Phase 5

**ID:** `005-financeiro`  
**Status:** rascunho  
**Autor:** Inova CRM AI  
**Data:** 2026-07-14  
**Fase do roadmap:** 5

---

## 1. Contexto

Módulo financeiro do CRM: propostas comerciais, contratos, faturas e pagamentos, com fluxo HITL para aprovação de faturas e eventos `invoice.*` para workers e n8n (notificações).

---

## 2. Objetivo

Ciclo completo proposta → contrato → fatura → pagamento, tenant-isolado, com auditoria e integração billing worker.

### Fora de escopo

- Gateway de pagamento real (Stripe/PIX provider)
- NF-e / integração contábil

---

## 3. Requisitos funcionais (resumo)

| RF    | Descrição                                               | Status scaffold |
| ----- | ------------------------------------------------------- | --------------- |
| RF-01 | CRUD propostas com status DRAFT→SENT→ACCEPTED           | [x]             |
| RF-02 | Contratos vinculados a propostas                        | [x]             |
| RF-03 | Faturas com approve HITL (`POST /invoices/:id/approve`) | [x]             |
| RF-04 | Pagamentos vinculados a faturas                         | [x]             |
| RF-05 | Eventos invoice.* via outbox                            | [x]             |

---

## 4. Modelo

Ver `backend/prisma/schema.prisma`: Proposal, Contract, Invoice, Payment.

---

## 5. Testes

- FinanceService unit tests (approve, markPaid, create)
- Worker billing handler para `opportunity.won` → draft invoice (futuro)

---

## Histórico

| Versão | Data       | Alteração          |
| ------ | ---------- | ------------------ |
| 0.1    | 2026-07-14 | Spec breve Phase 5 |
