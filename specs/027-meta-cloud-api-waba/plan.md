# Plano: Meta Cloud API (WABA)

**Spec:** [`027-meta-cloud-api-waba`](./spec.md)  
**Status:** rascunho · **BLOCKED** até WABA  
**Data:** 2026-07-26

## Resumo

Após Spec 026 e com credenciais WABA: criar inbox Meta no Chatwoot, validar E2E CRM, cutover Evolution, atualizar ADR 005 + baseline 1.2.0.

## Ordem

1. Receber e validar env WABA (sem commitar secrets)
2. `create_whatsapp_inbox.rb` na VPS
3. Configurar webhook Meta
4. Smoke E2E (mensagem → lead CRM)
5. Desligar Evolution
6. Docs + Gate + baseline

## Fora

Qualquer regra de negócio no n8n; acesso Meta fora do Chatwoot.
