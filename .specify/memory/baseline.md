# Baseline — Inova CRM AI

**Última atualização:** 2026-07-26  
**Quality Gate:** PASS — `reports/quality-gate/2026-07-26T02-01-09-701Z-ci-images-swap.md`

## Estado

| Item                                                           | Status                                |
| -------------------------------------------------------------- | ------------------------------------- |
| Fases 0–7 + Delivery                                           | DONE                                  |
| 013–025 + Admin/Bulk UI + RAM guard                            | DONE                                  |
| CI build images (`build-images.yml`) + `load-ci-images-vps.sh` | DONE                                  |
| Swap `/swapfile-inova`                                         | PENDING root (`create-swap-inova.sh`) |

## Ops

- Preferir: CI artifact → `load-ci-images-vps.sh` (sem compile na VPS)
- Docs: `docs/operations/ci-docker-images.md`, `docs/operations/vps-ram-hardening.md`
- Compose images: `CRM_API_IMAGE` / `CRM_FRONTEND_IMAGE`

## Proximo (pos-fase)

1. Rodar workflow **Build images** no GitHub e validar `load-ci-images-vps.sh` na VPS
2. Criar swap como root: `sudo bash …/create-swap-inova.sh`
3. Zoho / Meta — so sob demanda (Meta BLOCKED ate WABA)
