# DevOps — Inova CRM AI

**Volume:** 11  
**Versão:** 0.1 (Fase 0 — skeleton)  
**Status:** em construção

---

## Propósito

Pipeline CI/CD, Docker Compose, Cloudflare Tunnel, ambientes e scripts operacionais.

---

## Sumário

1. [Propósito](#propósito)
2. [Ambientes](#ambientes)
3. [Docker Compose](#docker-compose)
4. [Cloudflare Tunnel](#cloudflare-tunnel)
5. [CI/CD](#cicd)
6. [Scripts operacionais](#scripts-operacionais)
7. [Quality Gate no CI](#quality-gate-no-ci)
8. [Deploy path VPS](#deploy-path-vps)

---

## Ambientes

| Ambiente   | Uso                             |
| ---------- | ------------------------------- |
| local      | Dev com portas 9400+            |
| staging    | Validação pré-prod (opcional)   |
| production | VPS Hetzner `/opt/inova-crm-ai` |

## Docker Compose

```
infrastructure/
  docker-compose.yml
  docker-compose.prod.yml
  docker-compose.override.yml
```

Rede Docker: `inova-crm`. Sem publish de 80/5432/6379 no host.

## Cloudflare Tunnel

Roteamento `*-crm.inovatitech.com.br` → `127.0.0.1:940x`. Sem Caddy/nginx na 80 do host.

## CI/CD

- GitLab CI ou GitHub Actions
- Job `quality-gate` obrigatório antes de merge
- Deploy manual ou automatizado pós-gate (Squad 3)

## Scripts operacionais

| Script                 | Função                    |
| ---------------------- | ------------------------- |
| `check-ports.ps1/.sh`  | Valida bloco 9400–9419    |
| `quality-gate.ps1/.sh` | Pipeline completo do gate |

## Quality Gate no CI

Merge bloqueado sem badge verde. Ver `.cursor/rules/quality-gate.mdc`.

## Deploy path VPS

Alvo: `/opt/inova-crm-ai` — espelhar padrão Inova-TI com hostnames `-crm`.
