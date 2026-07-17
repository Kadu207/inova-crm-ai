# Prompts Claude Design — Inova CRM AI

**Versão:** 1.0 (Fase 0)  
**Uso:** gerar mockups e implementações UI com identidade Inova TI

**Regra global para todos os prompts:**

> Design system Inova TI: fundo escuro (`#141416` void, `#1b1b1d` base), accent laranja flame (`#fb640a`), texto bone (`#f4f1ec`), fontes Sora (títulos) + IBM Plex Sans (corpo). **Proibido** estética purple/cream/violeta genérica de templates AI. Cards com border `#2f2f33`, radius 13–16px. CRM SaaS profissional B2B.

Tokens completos: [tokens.md](./tokens.md)

---

## 1. Autenticação (Login + MFA placeholder)

```
Crie tela de login para "Inova CRM AI" — SaaS B2B multi-tenant.
Layout: centralizado, card max-width 400px, fundo void #141416.
Wordmark: "Inova" bone + "CRM" flame bold + " AI" faint.
Campos: email, senha — input fundo void, border line, focus flame.
Botão primário flame, texto escuro #160b04, full width.
Link "Esqueci senha" smoke. Erro em bad #ff5a52.
Sem ilustrações stock; opcional gradiente sutil rust→void no canto.
Mobile-first. Português BR.
```

---

## 2. Dashboard executivo

```
Dashboard CRM Inova TI — visão do tenant.
Topbar sticky: logo, seletor de período, avatar usuário.
Grid KPIs 4 colunas: Leads novos, Oportunidades abertas, Valor pipeline, Conversas abertas.
KPI card: panel bg, label uppercase faint, valor grande Sora bone, destaque flame se métrica principal.
Abaixo: gráfico linha "Pipeline últimos 30 dias" + lista "Atividades recentes".
Sidebar opcional colapsável com ícones Lucide.
Dark theme Inova (void/base/panel/flame). Densidade informação alta, não minimalista vazio.
```

---

## 3. Lista de Leads

```
Página Leads — tabela + filtros.
Header: título "Leads", botão primário "+ Novo lead" flame.
Filtros: status, origem, responsável, período — chips smoke.
Tabela: colunas Nome, Empresa, Origem, Status (badge), Score, Responsável, Criado em.
Badge status: qualificado=ok, novo=warn, perdido=bad.
Busca global no topbar. Paginação discreta.
Empty state com CTA criar lead. Responsivo: tabela vira cards no mobile.
```

---

## 4. Funil Kanban (Oportunidades)

```
Funil Kanban vendas — Inova CRM AI.
Colunas horizontais scroll: Prospecção, Qualificação, Proposta, Negociação, Fechado.
Cada coluna: header com nome + contagem + valor total flame.
Cards oportunidade: empresa, valor R$, contato, dias no estágio, avatar responsável.
Drag-and-drop visual com borda flame no hover.
Botão "+ Oportunidade" no header. Filtro por vendedor.
Dark panel/void, sombra card suave. Sem cores pastel — só semânticas ok/warn/bad.
```

---

## 5. Detalhe do Lead

```
Página detalhe Lead — layout 2 colunas desktop.
Esquerda: dados lead (nome, email, tel, origem, score bar flame), timeline atividades.
Direita: ações rápidas (Qualificar, Criar oportunidade, Atribuir), notas, tags.
Seção "Conversas vinculadas" link Chatwoot.
Header com breadcrumb Leads > Nome. Botões ghost + primário.
Score visual: barra progresso flame sobre track line.
```

---

## 6. Contatos e Empresas

```
CRUD Contatos — lista + drawer detalhe.
Lista com avatar iniciais, nome, empresa, email, último contato.
Drawer lateral panel: editar inline, histórico oportunidades, conversas.
Aba Empresas: tabela CNPJ, segmento, contatos count, valor pipeline.
Busca e filtros consistentes com Leads.
```

---

## 7. Atendimento (inbox resumo)

```
Painel Atendimento — resumo conversas Chatwoot no CRM (não substitui Chatwoot).
Split view: lista conversas à esquerda, preview à direita.
Estados: aberto, pendente, resolvido — badges semânticas.
Indicador canal (WhatsApp, email) ícone monocromático bone.
Botão "Abrir no Chatwoot" externo. SLA timer warn se >24h.
```

---

## 8. Propostas e documentos

```
Módulo Propostas — lista com status rascunho/enviada/aceita/recusada.
Card proposta: cliente, valor, validade, PDF thumbnail MinIO.
Editor: wizard 3 passos — dados, itens tabela, revisão PDF preview.
Ações: enviar (HITL modal confirmação), duplicar, arquivar.
```

---

## 9. Configurações do tenant

```
Settings tenant — tabs: Geral, Usuários, Funil, Integrações, LGPD.
Geral: nome empresa, logo upload, fuso horário.
Funil: reorder estágios drag, cores apenas faint/smoke (não rainbow).
Integrações: cards Chatwoot + n8n status conectado/desconectado ok/bad.
LGPD: retenção dados, exportação titular — avisos warn.
```

---

## 10. Componentes globais

```
Design system components Inova CRM:
- Topbar, Sidebar, KPI card, Data table, Kanban card, Toast (void bg, border ok/bad), Modal, Empty state.
Storybook-style grid fundo base.
Todos seguem tokens.md — flame accent, dark surfaces, Sora/Plex.
Proibido: purple gradients, rounded-full pills estilo consumer, ilustrações 3D pastel.
```

---

## Referências

- [tokens.md](./tokens.md)
- [arquitetura-frontend.md](../arquitetura-frontend.md)
- Inova-TI painel (referência visual)
