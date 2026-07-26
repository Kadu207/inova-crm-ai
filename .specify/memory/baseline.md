# Baseline — Inova CRM AI

**Última atualização:** 2026-07-26  
**Versão do sistema:** **1.1.0** — ver [`docs/historico-versoes.md`](../../docs/historico-versoes.md)  
**Plano Mestre:** 1.2  
**Quality Gate:** PASS — `reports/quality-gate/2026-07-26T19-49-07-164Z.md`

## Estado

| Item                               | Status                                           |
| ---------------------------------- | ------------------------------------------------ |
| Fases 0–7 + Delivery               | DONE                                             |
| Produto 019–025 + Admin/Bulk/RAM   | DONE                                             |
| Deploy API/FE via CI → docker load | DONE (validado: run `30184019868`, images `:ci`) |
| Swap `/swapfile-inova`             | DONE (4G ativo)                                  |
| **026 Zoho Blueprint/COQL**        | **DONE** (v1.1.0)                                |
| **027 Meta Cloud API**             | READY docs · **BLOCKED** até WABA                |

## Sequência oficial

1. **Deploy API/FE:** GitHub Actions `Build images (CI)` → download artifact → scp → `bash infrastructure/scripts/load-ci-images-vps.sh dist/images` (sem build na VPS)
2. **Migrate:** `bash infrastructure/scripts/migrate-api-vps.sh` (obrigatório após Spec 026 — `20260726160000_blueprint_transitions`)
3. **Swap:** `/swapfile-inova` ativo
4. **026 Zoho** — DONE
5. **027 Meta:** checklist [`docs/operations/meta-waba-cutover.md`](../../docs/operations/meta-waba-cutover.md) — aguardando credenciais

Docs: `docs/architecture/spec-026-query-blueprint.md`, `docs/operations/ci-docker-images.md`, `docs/operations/meta-waba-cutover.md`
