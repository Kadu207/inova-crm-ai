# CI images → VPS (sem OOM)

Procedimento **oficial** de deploy de API + Frontend: build no GitHub Actions, carga na VPS com `docker load` (sem `next build` / `npm install` na VPS).

**Fora deste fluxo de deploy:** implementação de produto (Spec 026 Zoho / Spec 027 Meta). Meta continua **BLOCKED** até WABA.

---

## Pré-requisitos (uma vez)

### Máquina Windows (seu PC)

- Repo: `c:\Projetos DEV\Inova CRM AI`
- GitHub CLI autenticado: `gh auth status`
- SSH key: `%USERPROFILE%\.ssh\id_ed25519_inova`
- Host VPS: `gestaoti@128.140.77.31`
- **Porta SSH: `65022`** (não 22) — ver [`vps-ssh.md`](./vps-ssh.md)
- Path remoto: `/opt/inova-crm-ai`

### VPS

- Swap ativo (`/swapfile-inova`). Conferir:

```bash
/usr/sbin/swapon --show
free -h
```

Se não houver swap:

```bash
sudo bash /opt/inova-crm-ai/infrastructure/scripts/create-swap-inova.sh
```

- Scripts presentes:

```bash
ls -l /opt/inova-crm-ai/infrastructure/scripts/load-ci-images-vps.sh
```

- Compose sempre com overlay VPS:

```text
-f infrastructure/docker-compose.yml
-f infrastructure/docker-compose.vps.yml
--profile apps
```

---

## Procedimento de deploy (toda alteração em API/FE)

### Passo 0 — Código no GitHub

No PC, com as mudanças prontas e Quality Gate OK:

```powershell
cd "c:\Projetos DEV\Inova CRM AI"
git status
git add <arquivos>
git commit -m "feat(...): descricao"
git push origin main
```

- Se o push tocar `backend/**` ou `frontend/**`, o workflow **Build images (CI)** dispara sozinho.
- Senão, dispare manualmente (Passo 1b).

---

### Passo 1 — Aguardar (ou disparar) o build no Actions

#### 1a — Acompanhar o run mais recente

```powershell
cd "c:\Projetos DEV\Inova CRM AI"

# NUNCA cole <RUN_ID> no PowerShell — o sinal < quebra o parser.
# Pegue o ID automaticamente do run mais recente:
$runId = gh run list --workflow=build-images.yml --limit 1 --json databaseId -q ".[0].databaseId"
Write-Host "RUN_ID=$runId"

gh run watch $runId
gh run view $runId --json status,conclusion,url,headSha
```

Saída esperada: `"conclusion": "success"`.

#### 1b — Disparo manual (se não rodou no push)

```powershell
gh workflow run "Build images (CI)" --ref main
Start-Sleep -Seconds 8
$runId = gh run list --workflow=build-images.yml --limit 1 --json databaseId -q ".[0].databaseId"
Write-Host "RUN_ID=$runId"
gh run watch $runId
```

#### 1c — Descobrir SHA do artifact

```powershell
$sha = (gh run view $runId --json headSha -q .headSha).Substring(0,12)
Write-Host "SHA=$sha"
Write-Host "Artifact esperado: inova-crm-images-$sha"
gh run view $runId --json artifacts --jq ".artifacts[].name"
```

---

### Passo 2 — Baixar o artifact no PC

```powershell
cd "c:\Projetos DEV\Inova CRM AI"

Remove-Item -Recurse -Force dist\images -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path dist\images | Out-Null

# Reutiliza $runId / $sha do passo 1, ou resolve de novo:
if (-not $runId) {
  $runId = gh run list --workflow=build-images.yml --limit 1 --json databaseId -q ".[0].databaseId"
}
if (-not $sha) {
  $sha = (gh run view $runId --json headSha -q .headSha).Substring(0,12)
}

gh run download $runId -n "inova-crm-images-$sha" -D dist\images

Get-ChildItem dist\images
Get-Content dist\images\images.env
Get-Content dist\images\SHA.txt
```

Arquivos esperados:

| Arquivo                              | Conteúdo                                   |
| ------------------------------------ | ------------------------------------------ |
| `inova-crm-api-ci-<SHA>.tar.gz`      | Imagem API                                 |
| `inova-crm-frontend-ci-<SHA>.tar.gz` | Imagem Frontend                            |
| `images.env`                         | `CRM_API_IMAGE=…` e `CRM_FRONTEND_IMAGE=…` |
| `SHA.txt`                            | SHA de 12 chars                            |

Exemplo de `images.env`:

```env
CRM_API_IMAGE=inova-crm-api:ci
CRM_FRONTEND_IMAGE=inova-crm-frontend:ci
```

---

### Passo 3 — Enviar tarballs para a VPS

```powershell
$key = "$env:USERPROFILE\.ssh\id_ed25519_inova"
$remote = "gestaoti@128.140.77.31"

ssh -p 65022 -o BatchMode=yes -i $key $remote "mkdir -p /opt/inova-crm-ai/dist/images"

scp -P 65022 -o BatchMode=yes -i $key `
  dist\images\*.tar.gz `
  dist\images\images.env `
  dist\images\SHA.txt `
  "${remote}:/opt/inova-crm-ai/dist/images/"
```

Confirme no SSH:

```bash
ls -lh /opt/inova-crm-ai/dist/images/
```

---

### Passo 4 — Load + recreate na VPS (sem build)

```bash
cd /opt/inova-crm-ai

# Opcional: pausar vizinhos barulhentos se a VPS estiver apertada
# bash infrastructure/scripts/vps-ram-guard.sh pause

bash infrastructure/scripts/load-ci-images-vps.sh dist/images
# Opcional: CRM_IMAGE_SHA=878a92fd5969 bash …  ou  --sha=878a92fd5969
# Carrega SOMENTE api+frontend do SHA em SHA.txt (não reprocessa tarballs antigos na pasta).

# Se pausou:
# bash infrastructure/scripts/vps-ram-guard.sh resume
```

O script faz:

1. Exige `infrastructure/.env` (senão aborta — evita API com secrets em branco)
2. `gzip -dc … | docker load` de cada `*.tar.gz`
3. Lê `images.env`
4. `docker compose --env-file infrastructure/.env … up -d --no-deps --no-build --force-recreate api frontend`
5. Aguarda health `api` + `fe` (até ~90s); falha com `LOAD_CI_IMAGES_FAIL` se unhealthy

Saída esperada:

```text
Loaded image: inova-crm-api:ci
Loaded image: inova-crm-frontend:ci
…
LOAD_CI_IMAGES_OK
api 200
fe 200
```

**Recuperação imediata** (API unhealthy após load sem `.env`):

```bash
cd /opt/inova-crm-ai
# Com script novo no disco:
bash infrastructure/scripts/restore-api-fe-env.sh

# Ou one-liner:
docker compose --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml \
  -f infrastructure/docker-compose.vps.yml \
  --profile apps \
  up -d --no-deps --no-build --force-recreate api frontend
docker logs inova-crm-api --tail 80
curl -sS -o /dev/null -w 'api %{http_code}\n' http://127.0.0.1:9401/health
```

---

### Passo 4b — Migrations (obrigatório se schema mudou)

Ex.: Spec **026** (`20260726160000_blueprint_transitions`).

```bash
cd /opt/inova-crm-ai
bash infrastructure/scripts/migrate-api-vps.sh
```

Equivalente manual:

```bash
docker compose --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml \
  -f infrastructure/docker-compose.vps.yml \
  --profile apps \
  exec -T api npx prisma migrate deploy
```

Confirme: `prisma migrate status` sem pending. Depois smoke (Passo 5).

---

### Passo 5 — Smoke checklist

Na VPS:

```bash
curl -sS -o /dev/null -w 'api %{http_code}\n' http://127.0.0.1:9401/health
curl -sS -o /dev/null -w 'fe %{http_code}\n' http://127.0.0.1:9400/login
curl -sS -o /dev/null -w 'bulk %{http_code}\n' http://127.0.0.1:9400/bulk
curl -sS -o /dev/null -w 'admin %{http_code}\n' http://127.0.0.1:9400/admin

docker ps --filter name=inova-crm-api --filter name=inova-crm-frontend \
  --format '{{.Names}} {{.Status}} {{.Image}}'
```

Esperado:

- Todos **200**
- Images: `inova-crm-api:ci` e `inova-crm-frontend:ci`
- Status: `healthy` / `Up`

No browser (opcional):

1. https://crm.inovatitech.com.br/login — tenant `inova`
2. `/leads`, `/bulk`, `/admin` (SUPER_ADMIN após re-login se necessário)

---

## Persistência das tags no `.env` da VPS (recomendado)

Para o próximo `compose up` não “esquecer” as imagens CI, no arquivo `/opt/inova-crm-ai/infrastructure/.env`:

```env
CRM_API_IMAGE=inova-crm-api:ci
CRM_FRONTEND_IMAGE=inova-crm-frontend:ci
NEXT_PUBLIC_API_URL=https://api-crm.inovatitech.com.br
```

(valores iguais ao `dist/images/images.env`)

---

## Fallback (só se CI falhar)

Compilar na VPS (usa RAM guard + swap):

```bash
cd /opt/inova-crm-ai
bash infrastructure/scripts/rebuild-api-vps.sh
bash infrastructure/scripts/rebuild-frontend-vps.sh
```

Evite `docker compose build --no-cache` sem o guard.

---

## Build local (PC com RAM sobrando)

```powershell
cd "c:\Projetos DEV\Inova CRM AI"
bash infrastructure/scripts/ci-build-images.sh
# ou no Git Bash / WSL
```

Gera `dist/images/*.tar.gz` — depois siga Passos 3–5.

---

## Troubleshooting

| Sintoma                                    | Ação                                                                                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Artifact 404 no `gh run download`          | `gh run view <ID> --json artifacts` e use o nome exato                                                                             |
| `Missing dist/images` na VPS               | Confirme `cd /opt/inova-crm-ai` e que o scp terminou                                                                               |
| Container sobe com imagem `:latest` antiga | Confira `CRM_*_IMAGE` no `images.env` / `.env`; rode de novo o load script                                                         |
| API unhealthy + WARN `POSTGRES_*` blank    | Load sem `--env-file` — `restore-api-fe-env.sh` ou recreate com `infrastructure/.env`                                              |
| `migrate-api-vps.sh: No such file`         | Pull/scp do script; migrate só após image que contém Spec 026                                                                      |
| 502 no Tunnel                              | Confirme binds: `docker compose …` **com** `docker-compose.vps.yml`; se preciso `bash infrastructure/scripts/restore-vps-ports.sh` |
| OOM no fallback                            | `vps-ram-guard.sh pause` + conferir swap                                                                                           |

---

## Fora de escopo deste procedimento

- Spec **026** Zoho (Blueprint / filtros avançados / COQL) — ver `specs/026-zoho-blueprint-coql/`
- Spec **027** Meta Cloud API — **BLOCKED** até WABA · `specs/027-meta-cloud-api-waba/`

---

## Última validação conhecida

| Campo     | Valor                                       |
| --------- | ------------------------------------------- |
| Run       | `30184019868`                               |
| SHA       | `cdd215ca2788`                              |
| Resultado | `LOAD_CI_IMAGES_OK` — api/fe/bulk/admin 200 |
