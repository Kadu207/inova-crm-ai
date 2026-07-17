# ADR 003 — n8n como Orquestrador (Boundary)

**Status:** aceito  
**Data:** 2026-07-14  
**Decisores:** Inova TI / Squad Governança

---

## Contexto

n8n é poderoso para integrações visuais, mas workflows com lógica de negócio em Function/IF tornam-se difíceis de testar, versionar e auditar. A Inova-TI e o Plano Mestre CRM já estabelecem n8n como orquestrador.

## Decisão

n8n CRM (`n8n-crm.inovatitech.com.br`, porta `9404`) limita-se a:

1. Receber triggers (webhook, cron)
2. Validar assinaturas
3. Chamar API NestJS com `API_TOKEN`
4. Notificar ou aguardar aprovação humana

**Proibido:** regras CRM em nós Function, Code ou IF complexos; acesso direto a PostgreSQL, RabbitMQ ou MinIO.

Toda decisão de domínio implementada no backend NestJS ou workers, com TDD.

## Consequências

### Positivas

- Regras testáveis e versionadas em TypeScript
- Auditoria centralizada na API
- Workflows n8n simples e estáveis

### Negativas

- Mais endpoints na API para casos que pareceriam "rápidos" no n8n
- Disciplina extra na revisão de workflows

## Alternativas rejeitadas

| Alternativa                  | Motivo da rejeição                     |
| ---------------------------- | -------------------------------------- |
| Lógica pesada no n8n         | Sem TDD, difícil gate de qualidade     |
| Substituir n8n por só código | Perde agilidade em integrações visuais |
| n8n acessando DB             | Viola constitution e menor privilégio  |

## Referências

- [integracao-n8n.md](../integracao-n8n.md)
- `.cursor/rules/n8n-boundary.mdc`
