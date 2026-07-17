# Quality Gate

Pipeline ordenado de verificações antes de merge ou deploy.

## Executar

```bash
# Instalar dependências
npm install

# Gate completo (phase-aware, padrão fase 1)
npm run gate

# Modo fundação — apenas checks de infra/docs (soft)
npm run gate:soft
# ou
node infrastructure/scripts/quality-gate.mjs --phase=0 --soft

# Fase explícita
node infrastructure/scripts/quality-gate.mjs --phase=1
```

## Etapas

1. **ports** — portas 9400–9419 livres (`npm run ports`)
2. **constitution** — `.specify/memory/constitution.md`
3. **env-example** — `.env.example` + `infrastructure/.env.example`
4. **docs-sync** — esqueleto em `docs/`
5. **compose-config** — `docker compose config`
6. **format** — Prettier
7. **lint** — ESLint (obrigatório a partir da fase 4)
8. **typecheck** — TypeScript workspaces
9. **prisma-validate** — quando `backend/prisma/schema.prisma` existir
10. **unit / contract / e2e** — quando scripts existirem (e2e avisa se sem Playwright)
11. **security-audit** — `npm audit`
12. Relatório em `reports/quality-gate/<timestamp>.md`

Saída final: `GATE_PASS` ou `GATE_FAIL` (exit 0/1).

## Scripts auxiliares

| Comando              | Descrição                            |
| -------------------- | ------------------------------------ |
| `npm run ports`      | Verifica portas locais               |
| `npm run smoke`      | Health checks HTTP (MinIO, RabbitMQ) |
| `npm run infra:up`   | Sobe stack dev                       |
| `npm run infra:down` | Para stack dev                       |

## Git hooks (Lefthook)

```bash
npx lefthook install
```

- **pre-commit:** format check, lint em arquivos staged, gate fase 1
- **pre-push:** gate fase 1 completo

Alternativa Husky: não configurada — preferimos Lefthook por performance e `lefthook.yml` versionado.

## CI

Workflow `.github/workflows/quality-gate.yml` roda em push/PR para `main`.

## Hadolint

Quando Dockerfiles de aplicação existirem:

```bash
hadolint -c infrastructure/.hadolint.yaml infrastructure/Dockerfile.*
```

Ver também `infrastructure/Dockerfile.hadolint.md`.
