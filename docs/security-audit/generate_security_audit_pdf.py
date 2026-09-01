#!/usr/bin/env python3
"""Gera o Relatório de Auditoria de Segurança (Inova CRM AI) em PDF.

Uso (venv local):
  docs/security-audit/.venv/Scripts/python docs/security-audit/generate_security_audit_pdf.py
"""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

from reportlab.graphics.charts.barcharts import HorizontalBarChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.shapes import Drawing, String
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Flowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parent
OUT_PDF = ROOT / "relatorio-auditoria-seguranca.pdf"
PROJECT = "Inova CRM AI"
AUDIT_DATE = "2026-09-01"

PALETTE = {
    "critica": "#B91C1C",
    "alta": "#EA580C",
    "media": "#D97706",
    "baixa": "#2563EB",
    "forte": "#059669",
    "info": "#64748B",
}

# Achados verificados no código (não especulativos)
FINDINGS = [
    {
        "id": "F-01",
        "cat": "Permissão no navegador",
        "sev": "critica",
        "file": "backend/src/webhook-subscriptions/webhook-subscriptions.controller.ts",
        "lines": "28-36",
        "title": "GET de webhook-subscriptions sem @Roles retorna secret em claro",
        "desc": (
            "findAll/findOne não têm @Roles; RolesGuard libera qualquer JWT autenticado. "
            "O service devolve o model completo incluindo o campo secret (HMAC)."
        ),
        "snippet": (
            "@Get()\n"
            "findAll(@TenantId() tenantId: string) {\n"
            "  return this.service.findAll(tenantId);\n"
            "}\n"
            "// service: findMany → WebhookSubscription[] com .secret"
        ),
        "why": (
            "VIEWER/SALES autenticados chamam GET /api/v1/webhook-subscriptions e obtêm "
            "segredos de assinatura outbound, podendo forjar entregas HMAC."
        ),
        "impact": "Vazamento de segredo de assinatura + possível abuso de webhooks do tenant.",
        "fix": (
            "Adicionar @Roles(ADMIN, MANAGER) nos GETs; nunca serializar secret em listagens "
            "(mascarar ou omitir); endpoint dedicado de rotação."
        ),
        "acceptance": [
            "GET /webhook-subscriptions com JWT VIEWER → 403",
            "Resposta de listagem não contém o secret em claro",
            "Teste e2e/unit cobrindo o 403",
        ],
    },
    {
        "id": "F-02",
        "cat": "Permissão no navegador",
        "sev": "alta",
        "file": "backend/src/finance/finance.controller.ts",
        "lines": "15-25",
        "title": "Listagem/leitura de invoices sem @Roles (UI /financeiro restrita)",
        "desc": (
            "Nav frontend limita /financeiro a ADMIN_MANAGER_ROLES, mas GET /invoices e "
            "GET /invoices/:id não declaram @Roles."
        ),
        "snippet": (
            "@Get()\n"
            "findAll(@TenantId() tenantId: string) {\n"
            "  return this.financeService.findAll(tenantId);\n"
            "}"
        ),
        "why": (
            "Qualquer papel autenticado (ex.: VIEWER) ignora o AppShell e consulta a API "
            "diretamente, lendo dados financeiros do tenant."
        ),
        "impact": "Quebra de RBAC financeiro; exposição de faturas.",
        "fix": "Alinhar @Roles(ADMIN, MANAGER) aos GETs como já feito em payments (billing).",
        "acceptance": [
            "GET /invoices com JWT VIEWER → 403",
            "GET /invoices com JWT ADMIN → 200",
            "Teste de contrato/RBAC",
        ],
    },
    {
        "id": "F-03",
        "cat": "Permissão no navegador",
        "sev": "alta",
        "file": "backend/src/bulk/bulk.controller.ts",
        "lines": "16-31",
        "title": "Jobs/download CSV bulk sem @Roles (UI /bulk restrita)",
        "desc": (
            "POST export/import exigem ADMIN/MANAGER, mas GET jobs, GET jobs/:id e "
            "download CSV não têm @Roles. Nav restringe /bulk a ADMIN_MANAGER."
        ),
        "snippet": (
            "@Get('jobs/:id/download')\n"
            "@Header('Content-Type', 'text/csv')\n"
            "async download(...) {\n"
            "  return this.bulkService.getExportCsv(tenantId, id);\n"
            "}"
        ),
        "why": (
            "Papel baixo lista jobs e baixa CSV de export se souber/enumerar o id "
            "(tenant-scoped, mas ainda privilegiado)."
        ),
        "impact": "Exfiltração de exportações CRM (leads/contatos/empresas).",
        "fix": "Aplicar @Roles(ADMIN, MANAGER) em todos os GETs de /bulk.",
        "acceptance": [
            "GET /bulk/jobs/:id/download com VIEWER → 403",
            "ADMIN/MANAGER → 200 quando job existir",
        ],
    },
    {
        "id": "F-04",
        "cat": "Permissão no navegador",
        "sev": "media",
        "file": "backend/src/identity/identity.controller.ts",
        "lines": "21-24",
        "title": "GET /users/:id sem @Roles (UI /usuarios restrita)",
        "desc": (
            "listagem exige ADMIN/MANAGER; findOne por id não. passwordHash é omitido no "
            "service, mas email/name/role vazam."
        ),
        "snippet": (
            "@Get(':id')\n"
            "findOne(@TenantId() tenantId: string, @Param('id') id: string) {\n"
            "  return this.identityService.findOne(tenantId, id);\n"
            "}"
        ),
        "why": "VIEWER obtém PII de qualquer usuário do tenant por ID.",
        "impact": "Enumeração de usuários e papéis dentro do tenant.",
        "fix": "@Roles(ADMIN, MANAGER) em findOne, ou restringir a self (sub === id).",
        "acceptance": [
            "GET /users/:otherId com VIEWER → 403",
            "ADMIN → 200",
        ],
    },
    {
        "id": "F-05",
        "cat": "Banco sem tranca",
        "sev": "media",
        "file": "backend/src/prisma/prisma.service.ts",
        "lines": "20-22",
        "title": "Extensão Prisma pula set_config quando ALS tenantId está ausente",
        "desc": (
            "Se getRequestTenantId() é undefined, a query vai ao baseClient sem "
            "set_config('app.tenant_id'). Defesa depende de FORCE RLS + filtro app."
        ),
        "snippet": (
            "if (!tenantId) {\n"
            "  return (baseClient as unknown as DelegateMap)[key][operation](args);\n"
            "}"
        ),
        "why": (
            "Com role DB BYPASSRLS/superuser, queries sem ALS não recebem RLS. "
            "Compose recomenda crm_app sem bypass — explorável se DATABASE_URL errado."
        ),
        "impact": "Perda da camada RLS em caminhos sem interceptor/ALS (misconfig).",
        "fix": (
            "Falhar fechado se tenant ausente em models de domínio; ou sempre set_config "
            "para valor sentinela que não casa com nenhum tenant_id."
        ),
        "acceptance": [
            "Operação de domínio sem ALS falha em teste",
            "Documentar proibição de superuser na API",
        ],
    },
    {
        "id": "F-06",
        "cat": "Chaves expostas",
        "sev": "alta",
        "file": "backend/prisma/seed.ts (histórico git d0fdaab)",
        "lines": "histórico",
        "title": "Senhas reais de ops/seed ainda no histórico git",
        "desc": (
            "Antes do scrub Spec 029 (878a92f), commits como cdd215c/e9f90a8/d0fdaab "
            "versionaram literais de senha (ex.: InovaDemo@2026 e outras usadas em scripts "
            "ops). Removidas do HEAD, mas recuperáveis via git log -S / clone completo."
        ),
        "snippet": (
            "# histórico (pré-878a92f)\n"
            "SEED_ADMIN_PASSWORD ?? 'InovaDemo@2026'\n"
            "# + literais em scripts de login/demo (scrubbed no HEAD)"
        ),
        "why": (
            "Quem tem o repositório recupera as literais e tenta em VPS/demo se não "
            "houve rotação após o scrub."
        ),
        "impact": "Compromisso de contas admin/demo se credenciais históricas ainda válidas.",
        "fix": (
            "Rotacionar todas as senhas/tokens que coincidam com o histórico; "
            "confirmar .credentials-operator.txt no .gitignore; rewrite só se política exigir."
        ),
        "acceptance": [
            "Credenciais históricas não autenticam em nenhum ambiente",
            ".credentials-operator.txt ignorado pelo git",
        ],
    },
    {
        "id": "F-07",
        "cat": "Chaves expostas",
        "sev": "media",
        "file": "backend/prisma/seed.ts",
        "lines": "10",
        "title": "Default local de senha admin ainda no seed atual",
        "desc": "Fallback ChangeMeLocalOnly@2026! se SEED_ADMIN_PASSWORD ausente.",
        "snippet": (
            "const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "
            "'ChangeMeLocalOnly@2026!';"
        ),
        "why": "Seed em ambiente sem env aplica senha previsível; seed ainda faz console.log da senha.",
        "impact": "Credencial previsível pós-seed.",
        "fix": "Exigir SEED_ADMIN_PASSWORD (throw se ausente) fora de NODE_ENV=test; não logar senha.",
        "acceptance": [
            "Seed sem env em production-like falha",
            "Logs não imprimem a senha",
        ],
    },
    {
        "id": "F-08",
        "cat": "Chaves expostas",
        "sev": "media",
        "file": "chatwoot/docker-compose.evolution.yml",
        "lines": "21,41,68,72",
        "title": "Defaults fracos ${VAR:-change_me_*} no profile Evolution",
        "desc": (
            "Postgres/Redis/API key Evolution usam placeholders se env não sobrescrever. "
            "Sem validação de startup que rejeite change_me_*."
        ),
        "snippet": (
            "POSTGRES_PASSWORD: ${EVOLUTION_POSTGRES_PASSWORD:-change_me_evolution_pg}\n"
            "AUTHENTICATION_API_KEY: ${EVOLUTION_API_KEY:-change_me_evolution_api_key}"
        ),
        "why": "Subir profile whatsapp-evolution sem .env deixa credenciais públicas conhecidas.",
        "impact": "Acesso ao stack Evolution (bind 127.0.0.1:9416 mitiga exposição remota).",
        "fix": "Remover defaults; fail se placeholder; checklist ops obrigatório.",
        "acceptance": [
            "Compose sem env falha health/auth",
            "Documentação exige openssl rand",
        ],
    },
    {
        "id": "F-09",
        "cat": "Permissão no navegador",
        "sev": "baixa",
        "file": "frontend/lib/navigation.ts vs backend/src/reports/reports.controller.ts",
        "lines": "17 / 16-17",
        "title": "Dessincronia RBAC relatórios (MANAGER na UI, não na API)",
        "desc": (
            "REPORTS_ROLES inclui MANAGER no frontend; API @Roles apenas ADMIN e SALES. "
            "Não é escalação (UI mostra, API 403), mas indica gate só no cliente como fonte "
            "de verdade incompleta."
        ),
        "snippet": (
            "REPORTS_ROLES = [..., 'MANAGER', 'SALES']\n"
            "@Roles(UserRole.ADMIN, UserRole.SALES)"
        ),
        "why": "Operadores MANAGER veem menu e falham na API; risco de 'corrigir' só o frontend.",
        "impact": "Confusão operacional; regressão futura se só a UI for alterada.",
        "fix": "Unificar papéis (incluir MANAGER na API ou remover da nav).",
        "acceptance": ["Nav e @Roles idênticos para /relatorios", "Teste navigation + API"],
    },
    {
        "id": "F-10",
        "cat": "Permissão no navegador",
        "sev": "critica",
        "file": "backend/src/lgpd/lgpd.controller.ts + opportunities.controller.ts + guards",
        "lines": "12-19 / 53-60 / tenant.guard:18-24 / roles.guard:24-26",
        "title": "@PlatformApi aceita qualquer JWT (não só API_TOKEN)",
        "desc": (
            "POST /lgpd/purge e POST /opportunities/sla/check-all usam @PlatformApi() sem @Roles. "
            "TenantGuard ignora platform routes; RolesGuard libera sem @Roles; JwtAuthGuard "
            "só especializa API_TOKEN — JWT humano cai no Passport e passa."
        ),
        "snippet": (
            "@Post('purge')\n"
            "@PlatformApi()\n"
            "purge() { return this.lgpdService.purgeExpired(); }\n"
            "// TenantGuard: if (isPlatformApi) return true;\n"
            "// RolesGuard: if (!requiredRoles) return true;"
        ),
        "why": (
            "Qualquer usuário autenticado (ex. VIEWER) pode disparar purge LGPD "
            "cross-tenant ou SLA check-all, sem API_TOKEN."
        ),
        "impact": "Destruição/alteração platform-wide; abuso de cron privilegiado.",
        "fix": (
            "JwtAuthGuard: em @PlatformApi exigir Bearer === API_TOKEN (rejeitar JWT humano); "
            "opcional @Roles(SUPER_ADMIN) como defesa extra."
        ),
        "acceptance": [
            "POST /lgpd/purge com JWT usuário → 401/403",
            "POST /lgpd/purge com Bearer API_TOKEN → 200",
            "Idem para /opportunities/sla/check-all",
        ],
    },
]

STRENGTHS = [
    (
        "Isolamento tenant (JWT + TenantGuard + RLS)",
        "TenantGuard exige tenant e rejeita mismatch JWT×header "
        "(backend/src/tenancy/tenant.guard.ts:37-43). Prisma set_config + migrations "
        "ENABLE/FORCE ROW LEVEL SECURITY em tabelas de domínio; testes em rls.spec.ts.",
    ),
    (
        "Lookups por ID com tenantId (anti-IDOR cross-tenant)",
        "Serviços de leads/contacts/opportunities/finance/billing/proposals/contracts/"
        "tasks/products/etc. usam findFirst({ where: { id, tenantId } }) — não findUnique só por id.",
    ),
    (
        "Mutações privilegiadas com @Roles",
        "Escritas em leads, opportunities, billing payments, config, saas, identity create/update, "
        "COQL (ADMIN), reports export, blueprint, etc. declaram @Roles. RolesGuard global no AuthModule.",
    ),
    (
        "SaaS / SUPER_ADMIN no servidor",
        "saas.controller.ts exige UserRole.SUPER_ADMIN em todos os handlers — UI AdminSaaSClient "
        "não é a única barreira.",
    ),
    (
        "JWT_SECRET fail-fast em produção",
        "resolveJwtSecret rejeita ausente/curto/placeholders conhecidos quando NODE_ENV=production "
        "(jwt-secret.ts + jwt-secret.spec.ts). Compose API força NODE_ENV=production.",
    ),
    (
        "Webhooks inbound com HMAC obrigatório",
        "verifyHmacSignature retorna false se signature ou secret vazios "
        "(common/utils.ts:17-18); Chatwoot/n8n webhooks @Public mas autenticam por HMAC.",
    ),
    (
        "AI FastAPI Bearer (Spec 029)",
        "ai-services/app/auth.py exige AI_API_TOKEN; em production sem token → 503 fail-closed.",
    ),
    (
        "XSS — sem sinks HTML perigosos",
        "Nenhum dangerouslySetInnerHTML/innerHTML/v-html/markdown raw no frontend/backend. "
        "React escapa texto; hrefs de atividade do dashboard são paths fixos gerados no server "
        "(dashboard.service.ts). Sem templates de e-mail HTML com input do usuário.",
    ),
    (
        "Register público desabilitado em produção",
        "auth.service.ts:22-24 exige ALLOW_PUBLIC_REGISTER=true para registrar em production.",
    ),
    (
        "Identity bloqueia promoção a SUPER_ADMIN",
        "assertAssignableRole + enum AssignableUserRole (identity.service.ts / user.dto.ts).",
    ),
]


def sev_count() -> Counter:
    return Counter(f["sev"] for f in FINDINGS)


def cat_count() -> Counter:
    return Counter(f["cat"] for f in FINDINGS)


class ChartFlowable(Flowable):
    def __init__(self, drawing: Drawing):
        super().__init__()
        self.drawing = drawing
        self.width = drawing.width
        self.height = drawing.height

    def draw(self):
        self.drawing.drawOn(self.canv, 0, 0)


def make_donut_drawing() -> Drawing:
    sc = sev_count()
    order = ["critica", "alta", "media", "baixa"]
    labels = [s.capitalize() for s in order if sc[s]]
    sizes = [sc[s] for s in order if sc[s]]
    colors_list = [colors.HexColor(PALETTE[s]) for s in order if sc[s]]
    d = Drawing(420, 260)
    d.add(String(210, 240, "Achados por severidade", textAnchor="middle", fontSize=12))
    pie = Pie()
    pie.x = 120
    pie.y = 40
    pie.width = 160
    pie.height = 160
    pie.data = sizes
    pie.labels = [f"{lab} ({n})" for lab, n in zip(labels, sizes)]
    pie.slices.strokeWidth = 1
    pie.slices.strokeColor = colors.white
    for i, c in enumerate(colors_list):
        pie.slices[i].fillColor = c
    # donut effect via inner white pie overlay approximation
    pie.innerRadiusFraction = 0.55
    d.add(pie)
    return d


def make_bars_drawing() -> Drawing:
    cc = cat_count()
    cats = list(cc.keys())
    vals = [cc[c] for c in cats]
    d = Drawing(460, 220)
    d.add(String(230, 200, "Achados por categoria", textAnchor="middle", fontSize=12))
    chart = HorizontalBarChart()
    chart.x = 140
    chart.y = 30
    chart.height = 150
    chart.width = 280
    chart.data = [vals]
    chart.categoryAxis.categoryNames = cats
    chart.bars[0].fillColor = colors.HexColor("#0F766E")
    chart.valueAxis.valueMin = 0
    chart.valueAxis.valueMax = max(vals) + 1
    chart.valueAxis.valueStep = 1
    d.add(chart)
    return d


def chip_color(sev: str) -> colors.Color:
    hex_ = PALETTE.get(sev, PALETTE["info"])
    return colors.HexColor(hex_)


def build_styles():
    ss = getSampleStyleSheet()
    styles = {
        "cover_title": ParagraphStyle(
            "cover_title",
            parent=ss["Title"],
            fontSize=22,
            leading=28,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#0F172A"),
            spaceAfter=12,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=ss["Heading1"],
            fontSize=16,
            textColor=colors.HexColor("#0F172A"),
            spaceBefore=10,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=ss["Heading2"],
            fontSize=13,
            textColor=colors.HexColor("#134E4A"),
            spaceBefore=8,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "body",
            parent=ss["BodyText"],
            fontSize=9.5,
            leading=13,
            alignment=TA_JUSTIFY,
            textColor=colors.HexColor("#1E293B"),
        ),
        "small": ParagraphStyle(
            "small",
            parent=ss["BodyText"],
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor("#334155"),
        ),
        "mono": ParagraphStyle(
            "mono",
            parent=ss["Code"],
            fontName="Courier",
            fontSize=7.5,
            leading=10,
            backColor=colors.HexColor("#F1F5F9"),
            borderPadding=4,
        ),
        "center": ParagraphStyle(
            "center", parent=ss["BodyText"], alignment=TA_CENTER, fontSize=10, leading=14
        ),
        "issue": ParagraphStyle(
            "issue",
            parent=ss["BodyText"],
            fontName="Courier",
            fontSize=7.2,
            leading=9.5,
            textColor=colors.HexColor("#0F172A"),
        ),
    }
    return styles


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#64748B"))
    canvas.drawString(2 * cm, A4[1] - 1.2 * cm, f"Relatório de Auditoria de Segurança — {PROJECT}")
    canvas.drawRightString(A4[0] - 2 * cm, A4[1] - 1.2 * cm, AUDIT_DATE)
    canvas.drawCentredString(A4[0] / 2, 1.2 * cm, f"Página {doc.page}")
    canvas.setStrokeColor(colors.HexColor("#CBD5E1"))
    canvas.line(2 * cm, A4[1] - 1.4 * cm, A4[0] - 2 * cm, A4[1] - 1.4 * cm)
    canvas.line(2 * cm, 1.5 * cm, A4[0] - 2 * cm, 1.5 * cm)
    canvas.restoreState()


def finding_table_rows(styles):
    header = [
        Paragraph("<b>Sev.</b>", styles["small"]),
        Paragraph("<b>Arquivo:linha</b>", styles["small"]),
        Paragraph("<b>Descrição</b>", styles["small"]),
    ]
    rows = [header]
    for f in FINDINGS:
        chip = Paragraph(
            f'<font color="white"><b>{f["sev"].upper()}</b></font>',
            ParagraphStyle("chip", fontSize=7, alignment=TA_CENTER, textColor=colors.white),
        )
        loc = Paragraph(f"{f['file']}:{f['lines']}", styles["small"])
        desc = Paragraph(f"<b>{f['id']}</b> — {f['title']}", styles["small"])
        rows.append([chip, loc, desc])
    return rows


def style_findings_table(table: Table, n_data: int):
    cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F766E")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    for i, f in enumerate(FINDINGS, start=1):
        cmds.append(("BACKGROUND", (0, i), (0, i), chip_color(f["sev"])))
        if i % 2 == 0:
            cmds.append(("BACKGROUND", (1, i), (-1, i), colors.HexColor("#F8FAFC")))
    table.setStyle(TableStyle(cmds))


def issue_block(f: dict) -> str:
    labels = f"security, severity:{f['sev']}"
    acc = "\n".join(f"- [ ] {a}" for a in f["acceptance"])
    return f"""--- ISSUE {f['id']} ---
# [Segurança] {f['title']}

**Labels sugeridas:** `{labels}`

## Problema
{f['desc']}

## Por que é explorável
{f['why']}

## Evidência
`{f['file']}:{f['lines']}`

```
{f['snippet']}
```

## Impacto
{f['impact']}

## Sugestão de correção
{f['fix']}

## Critérios de aceite
{acc}
--- FIM ISSUE {f['id']} ---
"""


def build_pdf() -> Path:
    styles = build_styles()
    doc = SimpleDocTemplate(
        str(OUT_PDF),
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title=f"Auditoria de Segurança — {PROJECT}",
        author="Cursor Security Audit",
    )
    story = []

    # Capa
    story.append(Spacer(1, 2.5 * cm))
    story.append(
        Paragraph(
            f"Relatório de Auditoria de Segurança — {PROJECT}",
            styles["cover_title"],
        )
    )
    story.append(Paragraph(f"Data: {AUDIT_DATE}", styles["center"]))
    story.append(Spacer(1, 0.6 * cm))
    story.append(
        Paragraph(
            "<b>Escopo:</b> backend NestJS/Prisma, frontend Next.js, ai-services FastAPI, "
            "workers, docker-compose/CI scripts, histórico git (segredos), busca XSS.",
            styles["body"],
        )
    )
    story.append(Spacer(1, 0.3 * cm))
    story.append(
        Paragraph(
            "<b>Metodologia / mapeamento à stack:</b><br/>"
            "1) <i>Banco sem tranca</i> → TenantGuard + filtro tenantId + RLS Postgres "
            "(não Supabase).<br/>"
            "2) <i>Permissão no navegador</i> → cruzar frontend/lib/navigation.ts e gates UI "
            "com @Roles nos controllers NestJS.<br/>"
            "3) <i>IDOR</i> → todos os *.controller.ts e services findFirst/update/delete por id.<br/>"
            "4) <i>Chaves expostas</i> → código, compose ${VAR:-default}, seed, git history, "
            "NEXT_PUBLIC_*.<br/>"
            "5) <i>XSS</i> → sinks React/HTML/e-mail; lib de sanitização se aplicável.",
            styles["body"],
        )
    )
    story.append(Spacer(1, 0.8 * cm))
    story.append(
        Paragraph(
            "Somente achados verificados no código. Ausência de sink XSS foi registrada "
            "como ponto forte, não como achado forçado.",
            styles["small"],
        )
    )

    story.append(PageBreak())

    # Resumo executivo
    story.append(Paragraph("1. Resumo executivo", styles["h1"]))
    sc = sev_count()
    total = sum(sc.values())
    story.append(
        Paragraph(
            f"Total de achados acionáveis: <b>{total}</b> — "
            f"crítica {sc['critica']}, alta {sc['alta']}, média {sc['media']}, "
            f"baixa {sc['baixa']}. Pontos fortes documentados: {len(STRENGTHS)}.",
            styles["body"],
        )
    )
    story.append(Spacer(1, 0.4 * cm))
    story.append(ChartFlowable(make_donut_drawing()))
    story.append(Spacer(1, 0.3 * cm))
    story.append(ChartFlowable(make_bars_drawing()))

    story.append(PageBreak())
    story.append(Paragraph("2. Pontos fortes e fracos", styles["h1"]))
    story.append(Paragraph("2.1 Pontos fortes (evidência)", styles["h2"]))
    for title, body in STRENGTHS:
        story.append(Paragraph(f"<b>{title}</b>", styles["body"]))
        story.append(Paragraph(body, styles["small"]))
        story.append(Spacer(1, 0.15 * cm))

    story.append(Paragraph("2.2 Pontos fracos (riscos centrais)", styles["h2"]))
    story.append(
        Paragraph(
            "O padrão dominante é <b>RBAC incompleto</b>: (1) @PlatformApi não restringe a "
            "API_TOKEN — JWT humano alcança purge LGPD / SLA check-all; (2) GETs sensíveis "
            "sem @Roles enquanto a Spec 030 só esconde a UI; (3) secrets de webhook em claro. "
            "Em paralelo, histórico git pré-029 e placeholders Evolution reforçam risco de "
            "credencial previsível se ops falhar.",
            styles["body"],
        )
    )

    story.append(PageBreak())
    story.append(Paragraph("3. Achados detalhados", styles["h1"]))
    t = Table(finding_table_rows(styles), colWidths=[2.2 * cm, 7.5 * cm, 7.3 * cm])
    style_findings_table(t, len(FINDINGS))
    story.append(t)
    story.append(Spacer(1, 0.5 * cm))

    for f in FINDINGS:
        block = [
            Paragraph(
                f"{f['id']} — [{f['sev'].upper()}] {f['title']}",
                styles["h2"],
            ),
            Paragraph(f"<b>Categoria:</b> {f['cat']}", styles["small"]),
            Paragraph(f"<b>Local:</b> {f['file']}:{f['lines']}", styles["small"]),
            Paragraph(f"<b>Descrição:</b> {f['desc']}", styles["body"]),
            Paragraph(f"<b>Explorabilidade:</b> {f['why']}", styles["body"]),
            Preformatted(f["snippet"], styles["mono"]),
            Paragraph(f"<b>Correção:</b> {f['fix']}", styles["small"]),
            Spacer(1, 0.25 * cm),
        ]
        story.append(KeepTogether(block))

    story.append(PageBreak())
    story.append(Paragraph("4. Recomendações priorizadas", styles["h1"]))
    recs = [
        (
            "P1",
            "Restringir @PlatformApi a Bearer API_TOKEN apenas (lgpd/purge + sla/check-all).",
        ),
        (
            "P1",
            "Bloquear GET webhook-subscriptions e deixar de retornar secret; rotacionar secrets existentes.",
        ),
        (
            "P1",
            "Aplicar @Roles alinhados à Spec 030 em GET /invoices*, GET /bulk/jobs* e download CSV.",
        ),
        (
            "P2",
            "Restringir GET /users/:id; unificar REPORTS_ROLES com @Roles da API.",
        ),
        (
            "P2",
            "Rotacionar senhas/tokens do histórico git pré-Spec 029; SEED_ADMIN_PASSWORD obrigatório.",
        ),
        (
            "P2",
            "Remover defaults change_me_* do compose Evolution ou fail-closed no boot.",
        ),
        (
            "P3",
            "Falhar fechado na extensão Prisma sem ALS tenant; auditoria periódica de handlers sem @Roles.",
        ),
    ]
    for pri, text in recs:
        story.append(Paragraph(f"<b>{pri}.</b> {text}", styles["body"]))

    story.append(PageBreak())
    story.append(Paragraph("5. ISSUES PARA O GITHUB", styles["h1"]))
    story.append(
        Paragraph(
            "Copie cada bloco delimitado para uma issue. Achados relacionados de RBAC GET "
            "permanecem separados por recurso (segredo vs financeiro vs bulk) para facilitar revisão.",
            styles["small"],
        )
    )
    story.append(Spacer(1, 0.3 * cm))
    for f in FINDINGS:
        story.append(Preformatted(issue_block(f), styles["issue"]))
        story.append(Spacer(1, 0.35 * cm))

    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    return OUT_PDF


def verify_pdf(path: Path) -> dict:
    import pypdfium2 as pdfium

    pdf = pdfium.PdfDocument(str(path))
    n = len(pdf)
    preview_dir = ROOT / "_preview"
    preview_dir.mkdir(exist_ok=True)
    pages = []
    for i in range(n):
        page = pdf[i]
        bitmap = page.render(scale=1.5)
        pil = bitmap.to_pil()
        out = preview_dir / f"page-{i + 1:02d}.png"
        pil.save(out)
        pages.append({"page": i + 1, "w": pil.width, "h": pil.height, "preview": str(out)})
    return {"pages": n, "previews": pages}


def main() -> None:
    pdf_path = build_pdf()
    meta = verify_pdf(pdf_path)
    summary = ROOT / "audit-summary.json"
    summary.write_text(
        json.dumps(
            {
                "pdf": str(pdf_path),
                "date": AUDIT_DATE,
                "findings": len(FINDINGS),
                "by_severity": dict(sev_count()),
                "by_category": dict(cat_count()),
                "verification": meta,
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"PDF: {pdf_path}")
    print(f"Pages: {meta['pages']}")
    print(f"Summary: {summary}")


if __name__ == "__main__":
    main()
