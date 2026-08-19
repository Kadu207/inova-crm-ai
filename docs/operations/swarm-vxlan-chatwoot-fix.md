# Swarm overlay — corrigir vxlan e voltar Chatwoot Inova-TI a 1/1

**Dono:** Inova-TI (você).  
**Host:** `inovati-server` · SSH `gestaoti@128.140.77.31` porta **`65022`** — [`vps-ssh.md`](./vps-ssh.md)  
**Serviços:** `chatwoot-admin_chatwoot-admin`, `chatwoot-sidekiq_chatwoot-sidekiq`  
**Domínio legado:** `chat.inovatitech.com.br`  
**CRM:** **não** misturar com `chat-crm` / `crm_chatwoot_*` (compose separado).

---

## Sintoma

```text
network sandbox join failed: subnet sandbox join failed for "10.0.1.0/24":
error creating vxlan interface: file exists
```

Replicas ficam `0/1` ou tasks em **Rejected** em loop. Causa típica: interface **vxlan órfã** no host (estado `DOWN`) após crash/OOM/update do Docker — o Swarm tenta recriar e o kernel responde “file exists”.

Estado conhecido 2026-08-19: services em **scale 0 (0/0)** para parar o loop.

---

## Pré-checks (antes de mexer)

```bash
# Confirmar que CRM Chatwoot segue OK (não tocar)
bash /opt/inova-crm-ai/chatwoot/scripts/audit-crm-chatwoot.sh

# Estado Swarm
docker service ls | grep -i chatwoot
docker network ls | grep -i overlay
```

Confirme quem ainda usa `https://chat.inovatitech.com.br` (Tunnel/DNS). Após scale 0 o hostname pode dar **502** — esperado.

---

## Procedimento de correção (ordem fixa)

### Passo 1 — Garantir scale 0

```bash
docker service scale chatwoot-admin_chatwoot-admin=0 chatwoot-sidekiq_chatwoot-sidekiq=0
docker service ls | grep -i chatwoot
# esperado: 0/0
```

### Passo 2 — Listar interfaces vxlan órfãs

```bash
ip -d link show | grep -E 'vx-|vxlan' || true
ls -l /sys/class/net/ | grep vx || true
```

Procure linhas com `state DOWN` / `qdisc noop` (órfãs). Exemplo:

```text
vx-001002-xxxxxx: ... state DOWN ...
```

Os últimos caracteres do nome costumam bater com o ID curto da rede overlay (`docker network ls`).

### Passo 3 — Remover órfãs (uma a uma)

```bash
# Substitua pelo nome real listado no passo 2
sudo ip -d link show vx-XXXXXXXX-YYYYY
sudo ip link delete vx-XXXXXXXX-YYYYY
```

Repita para cada `vx-*` DOWN ligado ao overlay problemático (`10.0.1.0/24` / stack chatwoot).

**Não** delete interfaces `UP` de outras stacks em produção sem saber o que são.

### Passo 4 — Se ainda falhar: limpar netns Docker (cuidado)

Só se o passo 3 não bastar e **não** houver tarefas Swarm críticas naquele momento:

```bash
# Lista namespaces
sudo ls /var/run/docker/netns/ 2>/dev/null | head

# Último recurso (pode afetar containers do nó):
# sudo systemctl restart docker
```

`systemctl restart docker` derruba **todos** os containers do nó por alguns segundos (CRM compose incluso). Prefira horários de baixo uso; depois confira `audit-crm-chatwoot.sh` e `docker ps`.

### Passo 5 — Voltar a 1/1

```bash
docker service scale chatwoot-admin_chatwoot-admin=1 chatwoot-sidekiq_chatwoot-sidekiq=1
sleep 10
docker service ls | grep -i chatwoot
docker service ps chatwoot-admin_chatwoot-admin --no-trunc | head -5
docker service ps chatwoot-sidekiq_chatwoot-sidekiq --no-trunc | head -5
```

Esperado: **1/1** Running, sem `Rejected` / sem erro vxlan.

### Passo 6 — Smoke

```bash
# Se o Tunnel aponta para o serviço Swarm (verifique cloudflared / DNS)
curl -sS -o /dev/null -w 'chat_legado %{http_code}\n' https://chat.inovatitech.com.br/ || true

# CRM continua independente
curl -sS -o /dev/null -w 'chat_crm %{http_code}\n' http://127.0.0.1:9403/
bash /opt/inova-crm-ai/chatwoot/scripts/audit-crm-chatwoot.sh
```

### Passo 7 — Segurança (recomendado após estabilizar)

A stack Swarm já teve placeholders fracos em env. Com a UI de pé:

1. Rotacionar `SECRET_KEY_BASE`, senhas Postgres/SMTP do stack Swarm
2. Não copiar secrets do `/opt/inova-crm-ai/infrastructure/.env`
3. Confirmar bind/Tunnel só via Cloudflare (sem publish `0.0.0.0` desnecessário)

---

## Bloco único (copiar no Putty — bash)

```bash
set -euo pipefail

echo '=== CRM check (não alterar) ==='
bash /opt/inova-crm-ai/chatwoot/scripts/audit-crm-chatwoot.sh || true

echo '=== Scale 0 ==='
docker service scale chatwoot-admin_chatwoot-admin=0 chatwoot-sidekiq_chatwoot-sidekiq=0

echo '=== vxlan DOWN (revisar antes de delete) ==='
ip -d link show | grep -E 'vx-|vxlan' || true
ls -l /sys/class/net/ | grep vx || true

echo '>>> DELETE MANUAL: sudo ip link delete vx-.... (só DOWN órfãs)'
echo '>>> Depois rode: docker service scale chatwoot-admin_chatwoot-admin=1 chatwoot-sidekiq_chatwoot-sidekiq=1'
```

O delete das interfaces **não** vai automático no bloco — exige olhar o nome real e confirmar.

---

## Se preferir não recuperar o Swarm

Manter **0/0** e apontar clientes/Tunnel só para `chat-crm.inovatitech.com.br` (CRM) ou Casa da Paz. Remover stack completo exige backup do Postgres Swarm + `docker stack rm` / `docker service rm` — fora deste runbook até haver inventário de dados.

---

## Referências

- Inventário Chatwoot: [`vps-chatwoot-instances.md`](./vps-chatwoot-instances.md)
- SSH: [`vps-ssh.md`](./vps-ssh.md)
- Upstream: [moby/libnetwork#1765](https://github.com/moby/libnetwork/issues/1765) · padrão `ip link delete vx-*` DOWN
