# Plan: 011-dashboard-activity

## Fases

1. Service `getActivity(tenantId, limit)` — merge leads/opportunities/conversations/companies/contacts por `updatedAt`
2. Controller + testes
3. Timeline UI no `DashboardClient`
4. Docs/baseline

## Gate

`npm run gate` PASS
