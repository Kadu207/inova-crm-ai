# Smoke — Atendimento (WhatsApp → Chatwoot → CRM)

1. Enviar mensagem WhatsApp para o número pareado (Evolution).
2. Confirmar inbox **CRM WhatsApp Evolution** no Chatwoot.
3. Lead em `/leads` e conversa em `/atendimento` (contato + lead).
4. Agente responde no Chatwoot → mensagem chega no WhatsApp.
5. `POST /conversations/sync` (n8n) atualiza `lastMessageAt` / status.

Resposta humana **somente** via Chatwoot (constituição).
