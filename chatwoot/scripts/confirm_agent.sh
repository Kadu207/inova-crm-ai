#!/usr/bin/env bash
set -euo pipefail
cd /opt/inova-crm-ai/chatwoot
docker compose -f docker-compose.yml -f docker-compose.vps.yml exec -T rails bundle exec rails runner "
u = User.find_by!(email: 'agent@demo.inovatitech.com.br')
u.confirm if u.respond_to?(:confirm) && !u.confirmed?
u.update!(confirmed_at: Time.current) if u.respond_to?(:confirmed_at) && u.confirmed_at.nil?
puts \"CONFIRMED id=#{u.id} confirmed=#{u.respond_to?(:confirmed?) ? u.confirmed? : 'n/a'}\"
puts \"ACCOUNT_USERS=#{u.account_users.map { |au| \"#{au.account_id}:#{au.role}\" }.join(',')}\"
puts \"INBOXES=#{InboxMember.where(user_id: u.id).pluck(:inbox_id).join(',')}\"
"
# Persist operator credentials (mode 600)
PASS="$(cat /tmp/inova-agent-pass.txt)"
{
  echo "Chatwoot agent (account 1):"
  echo "  email: agent@demo.inovatitech.com.br"
  echo "  password: ${PASS}"
  echo "  role: agent"
  echo "  updated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
} | tee -a /opt/inova-crm-ai/.credentials-operator.txt >/dev/null
chmod 600 /opt/inova-crm-ai/.credentials-operator.txt
echo CREDENTIALS_APPENDED
