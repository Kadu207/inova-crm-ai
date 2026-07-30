# VPS RAM hardening — rebuilds sem OOM

**Problema:** a VPS Hetzner (~8 GiB) hospeda vários stacks. `next build` / `npm install` em Docker com `--no-cache` estoura RAM e o kernel mata o build.

## Preferido: CI → docker load

Ver [ci-docker-images.md](./ci-docker-images.md).

```bash
# Na VPS, apos copiar tarballs do artifact GitHub:
bash infrastructure/scripts/load-ci-images-vps.sh dist/images
```

## Ferramentas (fallback compile na VPS)

| Script                                           | Uso                                                                   |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| `infrastructure/scripts/vps-ram-guard.sh`        | `status` / `pause` / `resume` / `ensure-swap` / `with-build -- <cmd>` |
| `infrastructure/scripts/rebuild-frontend-vps.sh` | Rebuild FE com guard + compose VPS                                    |
| `infrastructure/scripts/rebuild-api-vps.sh`      | Rebuild API com guard + compose VPS                                   |
| `infrastructure/scripts/create-swap-inova.sh`    | Swap 4G `/swapfile-inova` (root)                                      |
| `infrastructure/scripts/load-ci-images-vps.sh`   | `docker load` + `up --no-build`                                       |

### Pause controlado

Por padrao pausa: `inova-crm-n8n`, `inova-crm-n8n-worker`, `inova-crm-workers`, `crm_chatwoot_sidekiq`.

Chatwoot é **por projeto** (CRM ≠ Casa da Paz ≠ Swarm). Ao pausar sidekiq de outros produtos, use nomes explícitos — ver [vps-chatwoot-instances.md](./vps-chatwoot-instances.md).

```bash
export VPS_RAM_PAUSE_EXTRA="infra-n8n-1 excellence-n8n infra-chatwoot-sidekiq-1"
bash infrastructure/scripts/vps-ram-guard.sh pause
```

Se `crm_chatwoot_rails` apresentar 500 / `can't fork`, auditar PIDs (`chatwoot/scripts/audit-crm-chatwoot.sh`) e recreate rails/sidekiq — o compose CRM limita `pids_limit=512`.

### Swap (uma vez, root)

`gestaoti` nao tem sudo sem senha. Rodar como root:

```bash
sudo bash /opt/inova-crm-ai/infrastructure/scripts/create-swap-inova.sh
```

### Rebuild seguro (se CI nao disponivel)

```bash
cd /opt/inova-crm-ai
bash infrastructure/scripts/rebuild-frontend-vps.sh
bash infrastructure/scripts/rebuild-api-vps.sh
```

Sempre: `-f docker-compose.yml -f docker-compose.vps.yml --profile apps`.

## Threshold

`VPS_RAM_MIN_AVAIL_MB` (default `1800`) — `status` / `with-build` avisam se disponivel < limiar.
