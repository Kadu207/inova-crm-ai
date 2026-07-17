# ADR 001 — Tenant-First desde o Dia 1

**Status:** aceito  
**Data:** 2026-07-14  
**Decisores:** Inova TI / Squad Governança

---

## Contexto

O Plano Mestre original listava multi-tenant na Fase 7. Projetos Inova (Finance, Health, TI) demonstraram que retrofit de tenant é caro e arriscado (vazamento de dados, migrations complexas).

## Decisão

Implementar **multi-tenant desde a primeira migration de domínio** (Fase 4 MVP):

- Coluna `tenant_id` em toda tabela de domínio
- RLS no PostgreSQL
- `tenantId` no JWT e em todo evento RabbitMQ
- Prefixo MinIO e chaves Redis por tenant
- Testes de isolamento obrigatórios por bounded context

## Consequências

### Positivas

- Isolamento garantido por design
- SaaS escalável sem refactor massivo
- Compliance LGPD facilitado

### Negativas

- Complexidade inicial maior em queries e testes
- RLS exige disciplina em migrations e raw SQL

## Alternativas rejeitadas

| Alternativa            | Motivo da rejeição                  |
| ---------------------- | ----------------------------------- |
| Multi-tenant na Fase 7 | Retrofit perigoso                   |
| Schema por tenant      | Custo operacional alto              |
| Discriminator sem RLS  | Risco de vazamento por bug de query |

## Referências

- [multi-tenant.md](../multi-tenant.md)
- `.cursor/rules/multi-tenant.mdc`
- `.specify/memory/constitution.md` §3
