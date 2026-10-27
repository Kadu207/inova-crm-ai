# Create a Telegram bot inbox on the CRM Chatwoot account.
# The bot token stays in Chatwoot. Do not commit it.
#
# Required ENV:
#   TELEGRAM_BOT_TOKEN
# Optional:
#   TELEGRAM_INBOX_NAME (default: CRM Telegram)
#   ACCOUNT_ID (default: 1)
#
# Chatwoot calls getMe + setWebhook on create. FRONTEND_URL must be the public
# chat host (https://chat-crm.inovatitech.com.br) so Telegram can reach
# /webhooks/telegram/{bot_token}.

token = ENV.fetch('TELEGRAM_BOT_TOKEN')
inbox_name = ENV.fetch('TELEGRAM_INBOX_NAME', 'CRM Telegram')
account_id = Integer(ENV.fetch('ACCOUNT_ID', '1'))

account = Account.find(account_id)
existing = Inbox.joins(:channel).find_by(account_id: account.id, name: inbox_name)

if existing
  puts "INBOX_EXISTS id=#{existing.id} channel=#{existing.channel_type}"
  exit 0
end

channel = Channel::Telegram.create!(account: account, bot_token: token)
inbox = Inbox.create!(account: account, name: inbox_name, channel: channel)

puts "INBOX_CREATED id=#{inbox.id} channel_id=#{channel.id} bot=#{channel.bot_name}"
