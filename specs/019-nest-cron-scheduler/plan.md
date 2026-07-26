# Plan: 019-nest-cron-scheduler

1. Dependencia `@nestjs/schedule` + RedisModule leve (`tryAcquireLock`)
2. `PlatformJobsModule` / `PlatformJobsService` com `@Cron`
3. Env: `CRON_ENABLED`, `CRON_SLA_EXPR`, `CRON_LGPD_EXPR`
4. Testes unitarios mockando Opportunities/Lgpd/Redis
5. Docs: runbook + seguranca-lgpd — cron critico = Nest; n8n = backup
