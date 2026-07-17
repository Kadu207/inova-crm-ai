# ADR 004 — Redis vs RabbitMQ (Papéis Separados)

**Status:** aceito  
**Data:** 2026-07-14  
**Decisores:** Inova TI / Squad Governança

---

## Contexto

Redis e RabbitMQ aparecem no stack. Sem papéis claros, equipes usam Redis Streams como barramento de domínio — padrão que outros projetos Inova evitam para eventos críticos de negócio.

## Decisão

| Tecnologia   | Papel exclusivo                                                                   |
| ------------ | --------------------------------------------------------------------------------- |
| **Redis**    | Cache, sessão, rate-limit, locks distribuídos, **filas do n8n** (modo Bull/queue) |
| **RabbitMQ** | Eventos de domínio internos via outbox pattern                                    |

- API escreve outbox na mesma transação do domínio
- Worker publica no RabbitMQ
- Consumers em `workers/` por domínio
- n8n **não** consome filas RabbitMQ de domínio

## Consequências

### Positivas

- Semântica de mensageria adequada (ACK, DLQ, routing)
- Redis otimizado para latência baixa em cache/sessão
- Alinhamento com Inova Finance e Health

### Negativas

- Dois brokers para operar
- Curva de aprendizado RabbitMQ para a equipe

## Alternativas rejeitadas

| Alternativa           | Motivo da rejeição                         |
| --------------------- | ------------------------------------------ |
| Só Redis Streams      | Menos robusto para eventos de domínio      |
| Só RabbitMQ para tudo | Overhead para cache/sessão                 |
| Kafka                 | Complexidade excessiva para escopo inicial |

## Referências

- [arquitetura-event-driven.md](../arquitetura-event-driven.md)
- [events/catalog-v0.md](../events/catalog-v0.md)
- `.cursor/rules/events.mdc`
