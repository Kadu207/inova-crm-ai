# Regras de Negócio do CRM — Inova CRM AI

**Volume:** 14  
**Versão:** 0.1 (Fase 0 — skeleton)  
**Status:** em construção

---

## Propósito

Catálogo de regras de negócio por módulo. **Toda regra vive no backend** — nunca no n8n.

---

## Sumário

1. [Propósito](#propósito)
2. [Módulos](#módulos)
3. [Leads](#leads)
4. [Funil e oportunidades](#funil-e-oportunidades)
5. [Atendimento](#atendimento)
6. [Financeiro](#financeiro)
7. [Permissões](#permissões)
8. [Auditoria](#auditoria)

---

## Módulos

1. Dashboard · 2. Empresas · 3. Contatos · 4. Leads · 5. Funil Kanban · 6. Oportunidades · 7. Agenda · 8. Tarefas · 9. Produtos · 10. Serviços · 11. Propostas · 12. Contratos · 13. Financeiro · 14. Cobrança · 15. Atendimento · 16. Relatórios · 17. Configurações · 18. Usuários · 19. Permissões · 20. Auditoria

## Leads

<!-- TODO Fase 4 -->

- RN-LEAD-01: Todo lead possui `tenantId` e origem rastreável
- RN-LEAD-02: Qualificação altera status via API (evento `lead.qualified`)
- RN-LEAD-03: Duplicata detectada por email/telefone no mesmo tenant

## Funil e oportunidades

- RN-OPP-01: Transição de estágio valida regras do pipeline do tenant
- RN-OPP-02: Oportunidade ganha/perdida emite `opportunity.won` / `opportunity.lost`
- RN-OPP-03: SLA calculado no backend, não no n8n

## Atendimento

- RN-CONV-01: Conversa vinculada a contato/lead do mesmo tenant
- RN-CONV-02: Sync unidirecional master Chatwoot para mensagens de canal

## Financeiro

- RN-INV-01: Emissão de fatura exige humano no loop
- RN-INV-02: Valores e impostos calculados no backend

## Permissões

Regras RBAC por papel — ver [seguranca-lgpd.md](./seguranca-lgpd.md).

## Auditoria

Toda mutação de domínio gera registro auditável + evento quando aplicável.
