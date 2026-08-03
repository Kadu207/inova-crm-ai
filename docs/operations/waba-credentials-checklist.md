# Checklist WABA — credenciais Meta (preenchível, sem secrets)

**Uso:** marcar progresso e anotar **apenas metadados** (IDs públicos, datas, quem fez).  
**Nunca** colar token (`WHATSAPP_API_KEY`), senhas ou dumps de Graph API neste arquivo / git / issues.

Quando as 4 variáveis estiverem OK no cofre VPS, diga no chat: **“WABA pronto — executar Spec 027”**.

Spec: [`specs/027-meta-cloud-api-waba/`](../../specs/027-meta-cloud-api-waba/) · Cutover: [`meta-waba-cutover.md`](./meta-waba-cutover.md)

---

## 0 — Responsáveis

| Campo                                  | Valor (preencher) |
| -------------------------------------- | ----------------- |
| Dono comercial (Business)              |                   |
| Dono técnico (Developer / System User) |                   |
| Data início                            |                   |
| Meta: teste primeiro? (S/N)            |                   |
| Meta: produção neste ciclo? (S/N)      |                   |

---

## 1 — Business Manager

| #   | Item                                                   | OK? | Notas (sem secrets)                          |
| --- | ------------------------------------------------------ | --- | -------------------------------------------- |
| 1.1 | Portfólio / Business Manager Inova criado ou escolhido | [ ] | Nome do Business: _______________            |
| 1.2 | Usuário admin do Business com acesso                   | [ ] | E-mail admin: _______________                |
| 1.3 | Verificação da empresa iniciada / concluída            | [ ] | Status: não iniciada / em análise / aprovada |
| 1.4 | Conta WhatsApp Business (WABA) visível no Business     | [ ] | Nome WABA: _______________                   |

---

## 2 — App Meta for Developers

| #   | Item                                                                      | OK? | Notas                                               |
| --- | ------------------------------------------------------------------------- | --- | --------------------------------------------------- |
| 2.1 | App criado em [developers.facebook.com](https://developers.facebook.com/) | [ ] | App name: _______________ · App ID: _______________ |
| 2.2 | App associado ao mesmo Business                                           | [ ] |                                                     |
| 2.3 | Produto **WhatsApp** adicionado ao app                                    | [ ] |                                                     |
| 2.4 | Modo do app (Dev / Live) anotado                                          | [ ] | Modo: _______________                               |

---

## 3 — Número e IDs (Cloud API)

### 3a — Número de teste (recomendado primeiro)

| #    | Item                                         | OK? | Valor / notas (sem token)                 |
| ---- | -------------------------------------------- | --- | ----------------------------------------- |
| 3a.1 | Número de teste ativo na API Setup           | [ ] | Display: _______________                  |
| 3a.2 | Destinatários allowlist (até ~5) cadastrados | [ ] | Qtde: ___                                 |
| 3a.3 | `WHATSAPP_PHONE_NUMBER` (E.164) no cofre     | [ ] | Prefixo país OK? [ ] · **não** colar aqui |
| 3a.4 | `WHATSAPP_PHONE_NUMBER_ID` no cofre          | [ ] | Últimos 4 dígitos do ID: ____ (opcional)  |
| 3a.5 | `WHATSAPP_BUSINESS_ACCOUNT_ID` no cofre      | [ ] | Últimos 4 dígitos: ____ (opcional)        |

### 3b — Número de produção (cutover real)

| #    | Item                                       | OK? | Notas                      |
| ---- | ------------------------------------------ | --- | -------------------------- |
| 3b.1 | Número de produção adicionado / verificado | [ ] | E.164 no cofre (não colar) |
| 3b.2 | Display name / perfil WhatsApp Business    | [ ] |                            |
| 3b.3 | Phone Number ID de **produção** no cofre   | [ ] | Distinto do teste? [ ]     |
| 3b.4 | WABA ID de produção no cofre               | [ ] |                            |

---

## 4 — Token permanente (`WHATSAPP_API_KEY`)

| #   | Item                                                | OK? | Notas                                                                              |
| --- | --------------------------------------------------- | --- | ---------------------------------------------------------------------------------- |
| 4.1 | System User criado no Business                      | [ ] | Nome do system user: _______________                                               |
| 4.2 | System User com acesso ao App + WABA                | [ ] |                                                                                    |
| 4.3 | Token gerado com permissões de mensagens WhatsApp   | [ ] | Escopos tipicamente: `whatsapp_business_messaging`, `whatsapp_business_management` |
| 4.4 | Token guardado **só** no cofre / VPS (não no git)   | [ ] | Onde: _______________                                                              |
| 4.5 | Smoke Graph API OK (`GET /{PHONE_NUMBER_ID}` → 200) | [ ] | Data do teste: _______________ · **não** anexar response com token                 |

---

## 5 — Tabela de desbloqueio Spec 027

Preencher só status. Valores reais ficam no cofre.

| Variável                       | No cofre? | Ambiente         | Quem validou | Data |
| ------------------------------ | --------- | ---------------- | ------------ | ---- |
| `WHATSAPP_PHONE_NUMBER`        | [ ]       | teste / produção |              |      |
| `WHATSAPP_PHONE_NUMBER_ID`     | [ ]       | teste / produção |              |      |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | [ ]       | teste / produção |              |      |
| `WHATSAPP_API_KEY`             | [ ]       | permanente       |              |      |

**Pronto para Spec 027?** [ ] Sim — todas as 4 no cofre e smoke Graph OK

---

## 6 — Antes do cutover (operacional)

| #   | Item                                                        | OK? |
| --- | ----------------------------------------------------------- | --- |
| 6.1 | Janela de cutover combinada com atendimento                 | [ ] |
| 6.2 | Evolution permanece até smoke Meta green                    | [ ] |
| 6.3 | Tunnel `chat-crm` saudável                                  | [ ] |
| 6.4 | Frase de gatilho enviada: “WABA pronto — executar Spec 027” | [ ] |

---

## Histórico

| Data       | Evento                                        |
| ---------- | --------------------------------------------- |
| 2026-08-02 | Checklist criado (pós-fase; Spec 027 BLOCKED) |
