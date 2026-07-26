# CI images → VPS (sem OOM)

Build de `api` e `frontend` **fora** da VPS; na VPS só `docker load` + `compose up --no-build`.

## GitHub Actions

Workflow: `.github/workflows/build-images.yml`

- Trigger: `push` em `main` (paths backend/frontend) ou **Actions → Build images → Run workflow**
- Artifact: `inova-crm-images-<sha>` com `*.tar.gz` + `images.env`
- Best-effort push: `ghcr.io/<owner>/inova-crm-api:ci` e `…/inova-crm-frontend:ci`

### Baixar artifact e carregar na VPS

```powershell
# Local (exemplo com gh)
gh run download <run-id> -n inova-crm-images-<sha> -D dist/images
scp dist/images/*.tar.gz dist/images/images.env gestaoti@VPS:/opt/inova-crm-ai/dist/images/
```

```bash
# Na VPS
cd /opt/inova-crm-ai
bash infrastructure/scripts/load-ci-images-vps.sh dist/images
```

Compose usa:

```env
CRM_API_IMAGE=inova-crm-api:ci
CRM_FRONTEND_IMAGE=inova-crm-frontend:ci
```

(ou valores do `images.env` / GHCR)

## Build local (máquina com RAM)

```bash
bash infrastructure/scripts/ci-build-images.sh
# gera dist/images/*.tar.gz
```

## Fallback se CI ainda não rodou

```bash
bash infrastructure/scripts/rebuild-frontend-vps.sh   # usa vps-ram-guard
```
