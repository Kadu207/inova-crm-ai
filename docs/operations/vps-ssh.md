# Acesso SSH — VPS Inova CRM AI

| Item          | Valor                                 |
| ------------- | ------------------------------------- |
| Host          | `128.140.77.31`                       |
| User          | `gestaoti`                            |
| **Porta SSH** | **`65022`** (não é 22)                |
| Path CRM      | `/opt/inova-crm-ai`                   |
| Key (PC)      | `%USERPROFILE%\.ssh\id_ed25519_inova` |

## PuTTY

- Host Name: `128.140.77.31`
- Port: `65022`
- Connection type: SSH  
  Depois de logado, rode **só bash** (não cole blocos PowerShell — isso fecha/quebra a sessão).

## PowerShell (PC → VPS)

```powershell
$key = "$env:USERPROFILE\.ssh\id_ed25519_inova"
$remote = "gestaoti@128.140.77.31"
ssh -p 65022 -o BatchMode=yes -i $key $remote "hostname; date -u"
```

SCP:

```powershell
scp -P 65022 -o BatchMode=yes -i $key LOCAL_FILE "${remote}:/opt/inova-crm-ai/..."
```

## Bash já na VPS

Não use `ssh` de novo. `cd /opt/inova-crm-ai` e execute os scripts locais.
