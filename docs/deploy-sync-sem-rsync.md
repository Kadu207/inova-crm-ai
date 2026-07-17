# Sync PC → VPS sem rsync (PowerShell + scp/tar)

Use no **PowerShell do Windows**, no diretório do projeto.

Substitua a senha quando o SSH pedir. Para `sudo` na VPS, use sessão interativa (`ssh` sem comando longo) ou configure NOPASSWD — o erro `sudo: a terminal is required` é normal em `ssh user@host "sudo ..."`.

---

## A) Criar pasta (SSH interativo — 1 minuto)

```powershell
ssh gestaoti@128.140.77.31
```

Na VPS:

```bash
sudo mkdir -p /opt/inova-crm-ai
sudo chown gestaoti:gestaoti /opt/inova-crm-ai
exit
```

---

## B) Enviar código com tar + scp (sem rsync)

No PC (`C:\Projetos DEV\Inova CRM AI`):

```powershell
cd "C:\Projetos DEV\Inova CRM AI"

# Empacota (exclui lixo pesado)
tar -czf "$env:TEMP\inova-crm-ai.tgz" `
  --exclude=node_modules `
  --exclude=.next `
  --exclude=dist `
  --exclude=.git `
  --exclude=.env `
  --exclude=infrastructure/.env `
  --exclude=reports `
  --exclude=coverage `
  .

# Envia
scp "$env:TEMP\inova-crm-ai.tgz" gestaoti@128.140.77.31:/tmp/inova-crm-ai.tgz
```

Na VPS:

```powershell
ssh gestaoti@128.140.77.31
```

```bash
cd /opt/inova-crm-ai
tar -xzf /tmp/inova-crm-ai.tgz
rm /tmp/inova-crm-ai.tgz
ls -la
# deve aparecer: backend frontend infrastructure DEPLOY-HETZNER.md ...
```

---

## C) Bootstrap (agora sim)

Ainda na VPS:

```bash
cd /opt/inova-crm-ai
chmod +x infrastructure/scripts/*.sh
bash infrastructure/scripts/bootstrap-vps.sh
```

---

## Alternativa se `tar` no Windows falhar

```powershell
cd "C:\Projetos DEV\Inova CRM AI"
# Zip nativo
Compress-Archive -Path * -DestinationPath "$env:TEMP\inova-crm-ai.zip" -Force
# Se Compress-Archive incluir node_modules e ficar gigante, use o tar acima ou exclua pastas antes.
scp "$env:TEMP\inova-crm-ai.zip" gestaoti@128.140.77.31:/tmp/
```

Na VPS: `cd /opt/inova-crm-ai && unzip -o /tmp/inova-crm-ai.zip` (instale `unzip` se precisar: `sudo apt install -y unzip`).

---

Depois do bootstrap, cole o final do log aqui (smoke API/Frontend) para seguirmos o Tunnel.
