#!/usr/bin/env bash
set -euo pipefail
cd /opt/inova-crm-ai/chatwoot
export AGENT_PASSWORD="$(cat /tmp/inova-agent-pass.txt)"
export AGENT_EMAIL=agent@demo.inovatitech.com.br
export AGENT_NAME='Agent Demo CRM'
export AGENT_ROLE=agent
docker compose -f docker-compose.yml -f docker-compose.vps.yml exec -T \
  -e AGENT_PASSWORD \
  -e AGENT_EMAIL \
  -e AGENT_NAME \
  -e AGENT_ROLE \
  rails bundle exec rails runner /tmp/create_agent.rb
