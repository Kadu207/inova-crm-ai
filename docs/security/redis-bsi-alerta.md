# Alerta BSI / Hetzner — Redis aberto (CERT-Bund)

**Data do scan:** 2026-07-14 12:03:22 UTC  
**IP afetado:** `128.140.77.31`  
**Versão detectada:** Redis `7.4.9`  
**ASN:** 24940 (Hetzner)

## O que significa

O CERT-Bund (BSI Alemanha) encontrou um Redis **acessível pela Internet** nesse IP. Em geral isso indica:

1. Porta `6379` (ou outra) publicada no firewall / `0.0.0.0`
2. Sem autenticação efetiva **ou** ainda assim alcançável de fora
3. Qualquer atacante na Internet pode ler/alterar/apagar dados em memória (sessões, filas, tokens, cache)

Hetzner deixa claro: **não é acusação de abuso** — é aviso de vulnerabilidade. Ainda assim trate como **incidente de exposição** até fechar.

Isto **não é o Inova CRM AI** (ainda não está na VPS). É quase certamente um Redis de outro stack no mesmo servidor (Inova-TI, Finance, Chatwoot antigo, n8n, etc.).

**Culpado confirmado na VPS:** `inova-platform-core-redis-1` com `0.0.0.0:6379->6379/tcp`.  
Checklist de fechamento: [redis-vps-checklist.md](./redis-vps-checklist.md).

## O que NÃO fazer

- Não responder a `reports@reports.cert-bund.de` (caixa morta)
- Não “abrir” Redis de novo “só para testar” na interface pública
- Não publicar `6379` no Cloudflare Tunnel nem em DNS

## Correção imediata (na VPS `128.140.77.31`)

SSH na VPS e execute:

```bash
# 1) Quem escuta 6379?
sudo ss -tlnp | grep 6379
sudo docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Image}}' | grep -i redis

# 2) Fechar no firewall AGORA (UFW exemplo)
sudo ufw deny 6379/tcp
sudo ufw reload
# ou iptables:
# sudo iptables -I INPUT -p tcp --dport 6379 -j DROP

# 3) Se for container com ports publicados em 0.0.0.0:6379
#    edite o compose e REMOVA a publicação de 6379 (só rede Docker interna)
#    depois:
# docker compose up -d --force-recreate <servico-redis>

# 4) Garantir senha forte
# redis-cli -a 'SENHA' CONFIG GET requirepass
# ou no compose: --requirepass ${REDIS_PASSWORD}

# 5) Confirmar de FORA (do seu PC) — deve FALHAR / timeout
# Test-NetConnection 128.140.77.31 -Port 6379
```

### Padrão seguro (Docker)

```yaml
redis:
  image: redis:7-alpine
  command:
    [
      'redis-server',
      '--requirepass',
      '${REDIS_PASSWORD}',
      '--appendonly',
      'yes',
      '--protected-mode',
      'yes',
    ]
  # SEM ports: — nunca publicar 6379 no host público
  networks: [interna]
```

Se precisar depurar no host: bind **só** `127.0.0.1:6379:6379`, nunca `0.0.0.0`.

### Após fechar

1. Rotacionar `REDIS_PASSWORD` e secrets de apps que usavam esse Redis
2. Revisar se houve escrita suspeita (chaves novas, `CONFIG GET dir`, cron malicioso — clássico de Redis aberto)
3. Anotar o timestamp do CERT-Bund; novos avisos só importam se o scan for **depois** da correção
4. Dúvidas: `certbund@bsi.bund.de` com o `[CB-Report#...]` no assunto

## Relação com Inova CRM AI

O compose do CRM **já não publica** Redis/Postgres no host (só rede `inova-crm`). No deploy VPS (`docker-compose.vps.yml`) publicamos apenas:

| Porta     | Serviço                                          |
| --------- | ------------------------------------------------ |
| 9400–9406 | frontend, api, ai, n8n, minio (bind `127.0.0.1`) |
| 9407      | RabbitMQ UI (`127.0.0.1`)                        |

Redis CRM fica **interno**. Mesmo assim, na VPS compartilhada, o Redis antigo aberto precisa ser fechado **antes** de subir mais stacks.

## Checklist pré-deploy CRM

- [ ] `ss -tlnp | grep 6379` sem listener em IP público
- [ ] UFW/Hetzner Cloud Firewall: 6379 bloqueado de fora
- [ ] Todos os Redis com `--requirepass`
- [ ] Nenhum Tunnel Cloudflare apontando para Redis
- [ ] Senhas rotacionadas após fechamento
