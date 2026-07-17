# Constituição — Inova CRM AI

Princípios inegociáveis do projeto. Todo spec, plano, implementação e deploy deve respeitar esta constituição.
Alinhada ao Plano Mestre v1.1 e ao pacote corporativo em `docs/`.

---

## 1. Construção incremental

- Cada fase entrega valor **sozinha**, com Definition of Done e **Quality Gate PASS**.
- Escopo 1C (Fases 0–7) é sequencial: **sem `GATE_PASS`, a fase seguinte não inicia**.
- Preferir entregas verificáveis a big-bang.

## 2. Tenant-first (desde o dia 1)

- Toda entidade de domínio carrega `tenantId` (ou equivalente) + índices.
- Isolamento de dados obrigatório; queries cross-tenant são **proibidas** fora do super-admin SaaS (Fase 7).
- “SaaS packing” (onboarding, billing de plano, quotas) é Fase 7 — o modelo de dados já é multi-tenant.

## 3. Agentes só pela API / toolbelt

- Agentes (humanos ou IA) agem exclusivamente pelas ferramentas expostas na API NestJS (e toolbelt `/v1/ai/*`).
- **Proibido:** acesso direto a Postgres, MinIO, RabbitMQ ou Redis fora dos bounded contexts autorizados.
- O monolito modular NestJS é o **toolbelt** que destrava automação e agentes.

## 4. n8n é só orquestrador

- n8n recebe webhooks, chama a API e notifica — **sem regras de negócio** em nós Function/IF complexos.
- Fonte de verdade: catálogo de eventos + APIs NestJS.
- Instância **dedicada** (`n8n-crm`) — não reutilizar stacks Inova-TI / Finance / Health.

## 5. Canais só via Chatwoot

- WhatsApp, Instagram, Facebook, email entram **somente** pelo Chatwoot dedicado (`chat-crm`).
- CRM não fala direto com Meta.
- Webhooks assinados (HMAC `X-Inova-Signature` / `WEBHOOK_SECRET`).

## 6. Mensageria — papéis claros

| Tecnologia         | Papel                                             |
| ------------------ | ------------------------------------------------- |
| **Redis**          | Cache, sessão, rate-limit, filas do n8n           |
| **RabbitMQ**       | Eventos de domínio CRM (`lead.*`, `invoice.*`, …) |
| **Workers NestJS** | Consomem RabbitMQ por domínio                     |

Não usar Redis Streams como barramento de domínio neste projeto.

## 7. Storage

- **MinIO dedicado** no VPS (dev/prod inicial); adapter S3 para R2 futuro (ADR-002).

## 8. Menor privilégio e humano no loop

- RBAC por papel (`SUPER_ADMIN`, `ADMIN`, `MANAGER`, `SALES`, `SUPPORT`, `VIEWER`).
- Aprovação humana obrigatória para ações irreversíveis (apagar dados, cobrança crítica, mensagens de alto risco).

## 9. Auditoria e LGPD

- Toda ação sensível registrada (quem / o quê / quando / tenant).
- Minimização de dados; soberania no VPS; backup Postgres + MinIO.

## 10. Quality Gate — hard-stop

**Regra inegociável:** nenhuma Spec Kit task, módulo ou fase avança com gate vermelho.

Pipeline (`npm run gate`):

1. Port audit (9400–9419)
2. Format / Lint / Typecheck
3. Prisma validate
4. Unit + integration (≥70% nos contextos tocados, evolução contínua)
5. Contract / E2E / smoke
6. Security audit (high/critical sem waiver = FAIL)
7. Docs sync + constituição

Falha → corrigir → **reexecutar o gate completo** → só então `READY` / `DONE`.
Proibido “deixar para depois”, `eslint-disable` sem ADR, ou pular testes.

## 11. TDD / EDD / SDD

1. **SDD (Spec Kit):** constitution → specify → plan → tasks → implement
2. **TDD:** vermelho → verde → refactor (backend/workers/AI)
3. **EDD:** contrato no catálogo → outbox publisher → worker consumer → n8n só no limiar externo

## 12. Stack e portas

- Frontend Next.js · Backend NestJS/Prisma · AI FastAPI · Workers · Chatwoot · n8n
- Bloco de portas host: **9400–9419** (`docs/ports.md`)
- Roteamento público: **Cloudflare Tunnel** (sem Caddy/nginx na 80 do host compartilhado)
- Deploy alvo: `/opt/inova-crm-ai` na VPS Hetzner

## 13. Squads

| Squad      | Papel                                            |
| ---------- | ------------------------------------------------ |
| 0 Spec     | Specs, ADRs, eventos, OpenAPI draft              |
| 1 Build    | Implementa **uma** task e para                   |
| 2 QA       | Dono do Quality Gate (`GATE_PASS` / `GATE_FAIL`) |
| 3 Delivery | Deploy só com `GATE_PASS` da fase                |

---

_Última revisão: 2026-07-15 — alinhada ao Plano Mestre Revisado (escopo 1C)._
