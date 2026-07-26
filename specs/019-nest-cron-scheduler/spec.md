# Especificacao: Nest ScheduleModule — cron nativo

**ID:** `019-nest-cron-scheduler`  
**Status:** aprovado  
**Autor:** Inova CRM AI  
**Data:** 2026-07-23  
**Fase do roadmap:** pos-7 (plataforma / resiliencia)

---

## Objetivo

O backend Nest passa a agendar e executar sozinho as tarefas de plataforma (SLA check-all e LGPD purge), sem depender do n8n como gatilho critico. Endpoints HTTP PlatformApi permanecem para smoke/backup.

### Fora de escopo

- Cadences / cron por tenant na UI
- Remover workflows n8n (ficam backup opcional)

## Criterios

- [ ] `@nestjs/schedule` + `ScheduleModule.forRoot()`
- [ ] Cron horario → `checkSlaAll()`
- [ ] Cron `0 3 * * *` → `purgeExpired()`
- [ ] `CRON_ENABLED` + exprs configuraveis; lock Redis anti double-run
- [ ] Testes unitarios; docs runbook/LGPD; Gate PASS
