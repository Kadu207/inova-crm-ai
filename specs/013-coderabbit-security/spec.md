# Especificação: CodeRabbit + Security Hardening P0

**ID:** `013-coderabbit-security`  
**Status:** aprovado  
**Autor:** Inova CRM AI  
**Data:** 2026-07-20  
**Fase do roadmap:** pós-7 (segurança / DX)

---

## 1. Contexto e problema

PRs sem review AI padronizado; API sem Helmet/rate-limit; Swagger sempre exposto; frontend sem security headers; CI sem scan de secrets.

**Problema:** superfície de ataque e governança de review incompletas.  
**Impacto:** risco operacional e inconsistência com `docs/seguranca-lgpd.md`.

---

## 2. Objetivo

1. CodeRabbit via `.coderabbit.yaml` + path instructions (constituição).
2. Hardening P0 Nest + Next + gitleaks CI.

### Fora de escopo

- MFA, LGPD export/purge, Cloudflare WAF custom, Meta WABA

---

## 3. Critérios de aceite

- [ ] `.coderabbit.yaml` na raiz com path_instructions
- [ ] Helmet + Throttler + Swagger gate + error filter (sem stack em prod)
- [ ] Next security headers + CSP baseline
- [ ] Workflow gitleaks
- [ ] Docs + baseline; Gate PASS

---

## 4. Camadas

- [x] Frontend / Backend / CI / Docs
