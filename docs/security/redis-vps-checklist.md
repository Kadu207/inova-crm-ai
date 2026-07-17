# Checklist — Fechar Redis público na VPS (BSI / CERT-Bund)

**IP:** `128.140.77.31`  
**Culpado confirmado:** container `inova-platform-core-redis-1`  
**Evidência:** `0.0.0.0:6379->6379/tcp` (os outros Redis só têm `6379/tcp` interno)

UFW `deny 6379` já reduz o risco. Ainda é obrigatório **remover o publish** no compose, senão o Redis continua escutando e qualquer regra UFW revertida reabre o buraco.

---

## Comandos exatos (VPS `inovati-server`)

Compose real:

- Dir: `/home/gestaoti/inova-platform-core-v2/infra/docker`
- Files: `docker-compose.yml` + `docker-compose.prod-vps.yml`
- Causa: base publica `"${REDIS_PORT:-6379}:6379"` e o overlay `prod-vps` **não** removia essa porta (o `prod.yml` removeria, mas não está no `up`).

Cole **bloco a bloco** (não use `<working_dir>`):

```bash
cd /home/gestaoti/inova-platform-core-v2/infra/docker

# Backup
cp docker-compose.prod-vps.yml docker-compose.prod-vps.yml.bak-$(date +%Y%m%d)

# Inserir reset de ports do Redis no overlay (se ainda nao existir)
grep -q 'ports: !reset' docker-compose.prod-vps.yml || python3 - <<'PY'
from pathlib import Path
p = Path("docker-compose.prod-vps.yml")
text = p.read_text()
needle = "services:\n"
insert = """services:
  redis:
    # Remove publish herdado de docker-compose.yml (BSI/CERT-Bund)
    ports: !reset []

"""
if "redis:" in text and "!reset" in text:
    print("ja possui reset")
else:
    if not text.startswith("services:") and "services:\n" in text:
        text = text.replace(needle, insert, 1)
        p.write_text(text)
        print("ok: redis ports reset adicionado")
    else:
        raise SystemExit("edite manualmente: adicione sob services: o bloco redis ports !reset []")
PY

# Ver o trecho
grep -n -A3 -E '^services:|^  redis:|ports:' docker-compose.prod-vps.yml | head -40

# Recriar Redis com os MESMOS arquivos do inspect
sudo docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod-vps.yml \
  up -d --force-recreate redis

# Confirmar: nao deve listar 0.0.0.0:6379
sudo ss -tlnp | grep 6379 || echo "OK: 6379 fechado no host"
sudo docker ps --format 'table {{.Names}}\t{{.Ports}}' | grep -i redis
```

No **seu PC Windows** (não na VPS):

```powershell
Test-NetConnection 128.140.77.31 -Port 6379
# TcpTestSucceeded : False
```

### Se o `python3` falhar — edição manual (`nano`)

```bash
cd /home/gestaoti/inova-platform-core-v2/infra/docker
nano docker-compose.prod-vps.yml
```

Logo abaixo de `services:`, inclua:

```yaml
redis:
  ports: !reset []
```

Salve, depois rode o `docker compose ... up -d --force-recreate redis` acima.

---

## 1) Na VPS (SSH bash — não use Test-NetConnection)

```bash
# Confirmar culpado
sudo ss -tlnp | grep 6379
sudo docker ps --format 'table {{.Names}}\t{{.Ports}}' | grep -i redis

# Achar o compose do platform-core
sudo docker inspect inova-platform-core-redis-1 --format '{{index .Config.Labels "com.docker.compose.project.working_dir"}}'
sudo docker inspect inova-platform-core-redis-1 --format '{{index .Config.Labels "com.docker.compose.project.config_files"}}'
```

## 2) Editar o compose do `inova-platform-core`

No serviço `redis`, **apague** qualquer bloco:

```yaml
ports:
  - '6379:6379'
  # ou
  - '0.0.0.0:6379:6379'
```

Deixe Redis só na rede Docker interna (sem `ports`). Senha com `--requirepass`.

Se precisar depurar no host (raro):

```yaml
ports:
  - '127.0.0.1:6379:6379' # NUNCA 0.0.0.0
```

## 3) Recriar só o Redis do platform-core

```bash
cd /caminho/do/inova-platform-core   # o working_dir do inspect
sudo docker compose up -d --force-recreate redis
# ou nome do serviço no compose
```

## 4) Validar na VPS

```bash
# Não deve mais haver LISTEN em 0.0.0.0:6379
sudo ss -tlnp | grep 6379 || echo "OK: 6379 não escuta no host"

sudo docker ps --format 'table {{.Names}}\t{{.Ports}}' | grep -i redis
# Esperado: platform-core SEM 0.0.0.0:6379
```

## 5) Validar de FORA (no seu PC Windows)

```powershell
Test-NetConnection 128.140.77.31 -Port 6379
# TcpTestSucceeded : False  ← desejado
```

Na própria VPS (Linux):

```bash
# Isto testa loopback/local — NÃO prova exposição pública
nc -vz 127.0.0.1 6379 || true
# De outra máquina / do PC:
nc -vz 128.140.77.31 6379
# deve falhar / timeout
```

## 6) Rotacionar senha Redis do platform-core

Quem usava esse Redis (API, n8n, workers) precisa do novo `REDIS_PASSWORD` no `.env` e recreate dos consumidores.

## 7) Outros Redis (OK por enquanto)

| Container                     | Ports          | Ação               |
| ----------------------------- | -------------- | ------------------ |
| `inova-platform-core-redis-1` | `0.0.0.0:6379` | **Corrigir agora** |
| `inova-ti-redis-1`            | interno        | OK                 |
| `inova-gastro-360-redis-app`  | interno        | OK                 |
| `infra-redis-1`               | interno        | OK                 |

Manter `ufw deny 6379/tcp` como rede de segurança.

## 8) Só depois — local CRM + deploy

1. PC: Docker Desktop ligado → `npm run infra:up` → migrate → smoke
2. VPS: deploy CRM sem publicar Redis (`DEPLOY-HETZNER.md`)
