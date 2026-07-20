# Plan: 007-ops-hardening

## Fases

| Fase | Escopo                                         | Gate                |
| ---- | ---------------------------------------------- | ------------------- |
| A    | Spec + backup scripts + docs                   | scripts lint/review |
| B    | PlatformApi + checkSlaAll + n8n + tests        | unit PASS           |
| C    | Meta docs BLOCKED + baseline                   | docs sync           |
| D    | VPS backup/cron + API rebuild + `npm run gate` | GATE_PASS           |

## Ordem de implementação

1. Spec/plan/tasks
2. `backup.sh` + `restore-smoke.sh` + docs
3. PlatformApi guards + `checkSlaAll` + n8n
4. Meta BLOCKED + baseline
5. VPS: backup, smoke, cron, rebuild API
6. Gate + commit
