# Auditoria de Segurança — artefatos

**Remediação:** [`REMEDIATION.md`](./REMEDIATION.md) — F-01..F-10 **CODE** em prod (`42048a5842e9`); F-06 **OPS** (humano).  
**PDF:** [`relatorio-auditoria-seguranca.pdf`](./relatorio-auditoria-seguranca.pdf)

## Gerar / regenerar o PDF

```powershell
python -m venv docs/security-audit/.venv
.\docs\security-audit\.venv\Scripts\python.exe -m pip install -r docs/security-audit/requirements.txt
.\docs\security-audit\.venv\Scripts\python.exe docs/security-audit/generate_security_audit_pdf.py
```

Saída: `docs/security-audit/relatorio-auditoria-seguranca.pdf`

## Arquivos

| Arquivo                             | Uso                                              |
| ----------------------------------- | ------------------------------------------------ |
| `generate_security_audit_pdf.py`    | Gerador (ReportLab; gráficos nativos)            |
| `requirements.txt`                  | Dependências isoladas no venv                    |
| `relatorio-auditoria-seguranca.pdf` | Relatório entregável                             |
| `audit-summary.json`                | Metadados + verificação de páginas               |
| `_preview/`                         | Raster das páginas (gerado; pode ignorar no git) |

O diretório `.venv/` já está coberto pelo `.gitignore` raiz.
