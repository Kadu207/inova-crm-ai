#!/usr/bin/env bash
set -euo pipefail
NEW_TOKEN="${1:-}"
if [ -z "$NEW_TOKEN" ]; then
  echo "Usage: $0 <new-cloudflared-token>"
  exit 1
fi
UNIT=/etc/systemd/system/cloudflared-inovatiprojects.service
sudo cp "$UNIT" "${UNIT}.bak.$(date +%Y%m%d%H%M%S)"
sudo tee "$UNIT" >/dev/null <<EOF
[Unit]
Description=cloudflared inovatiprojects
After=network-online.target
Wants=network-online.target

[Service]
TimeoutStartSec=15
Type=notify
ExecStart=/usr/bin/cloudflared --no-autoupdate tunnel run --token ${NEW_TOKEN}
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl restart cloudflared-inovatiprojects
sleep 3
sudo systemctl is-active cloudflared-inovatiprojects
curl -sf https://api-crm.inovatitech.com.br/health && echo
curl -sfI https://crm.inovatitech.com.br/login | head -5
echo TOKEN_ROTATED_OK