# ADR 002 — MinIO Storage Dedicado

**Status:** aceito  
**Data:** 2026-07-14  
**Decisores:** Inova TI / Squad Governança

---

## Contexto

O CRM gera anexos (propostas PDF, contratos, exports LGPD, mídia de conversas referenciada). Outros produtos Inova usam MinIO com buckets separados. Compartilhar storage aumenta risco de cross-tenant e complica billing de storage.

## Decisão

Instância **MinIO dedicada** ao stack Inova CRM AI:

- Host API: `s3-crm.inovatitech.com.br` (porta host `9405`)
- Console: `storage-crm.inovatitech.com.br` (porta host `9406`)
- Bucket principal: `inova-crm` com prefixo `{tenantId}/`
- Credenciais separadas de Finance, Health e Inova-TI
- Backup independente na rotina de produção

## Consequências

### Positivas

- Isolamento de storage alinhado ao tenant-first
- Políticas de lifecycle por produto
- Facilita auditoria LGPD (export/delete por tenant)

### Negativas

- Mais um serviço no compose CRM
- Custo de disco adicional na VPS

## Alternativas rejeitadas

| Alternativa                           | Motivo da rejeição                  |
| ------------------------------------- | ----------------------------------- |
| Cloudflare R2 compartilhado           | Menos controle em VPS compartilhada |
| Bucket único Inova sem prefixo tenant | Risco cross-tenant                  |
| Filesystem local                      | Não escala horizontalmente          |

## Referências

- [ports.md](../ports.md)
- `.specify/memory/constitution.md` §7
