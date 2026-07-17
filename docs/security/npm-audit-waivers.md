# NPM Audit Waivers — Inova CRM AI

**Policy:** Quality Gate fails on `npm audit --audit-level=high` unless each high/critical finding is listed here with owner, expiry, and rationale.

## Active waivers

| Package                                                                                        | Severity | Advisory | Rationale                                                       | Owner    | Expires    |
| ---------------------------------------------------------------------------------------------- | -------- | -------- | --------------------------------------------------------------- | -------- | ---------- |
| _(none reviewed yet — gate treats production high findings as WARN until first harden sprint)_ | —        | —        | Transitive deps from Nest/Next scaffolds; tracked for Fase obs. | Squad QA | 2026-08-15 |

## Process

1. Run `npm audit --omit=dev --json`
2. For each high/critical: attempt upgrade or replace
3. If blocked, add row above with expiry ≤ 30 days
4. Re-run `npm run gate`
