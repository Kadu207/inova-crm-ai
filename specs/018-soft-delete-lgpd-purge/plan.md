# Plan: 018-soft-delete-lgpd-purge

## Fases

1. Spec + schema migration `deleted_at`
2. Soft-delete em services + filtros find/count/dashboard
3. Modulo `lgpd` purge PlatformApi + testes
4. Docs/env; gate; deploy API + migrate
