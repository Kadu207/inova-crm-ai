# Create WhatsApp Cloud API inbox for Inova CRM Chatwoot.
# Required ENV:
#   WHATSAPP_PHONE_NUMBER (+E.164)
#   WHATSAPP_PHONE_NUMBER_ID
#   WHATSAPP_BUSINESS_ACCOUNT_ID
#   WHATSAPP_API_KEY
# Optional:
#   WHATSAPP_INBOX_NAME (default: CRM WhatsApp)
#   ACCOUNT_ID (default: 1)

phone = ENV.fetch('WHATSAPP_PHONE_NUMBER')
phone_number_id = ENV.fetch('WHATSAPP_PHONE_NUMBER_ID')
business_account_id = ENV.fetch('WHATSAPP_BUSINESS_ACCOUNT_ID')
api_key = ENV.fetch('WHATSAPP_API_KEY')
inbox_name = ENV.fetch('WHATSAPP_INBOX_NAME', 'CRM WhatsApp')
account_id = Integer(ENV.fetch('ACCOUNT_ID', '1'))

account = Account.find(account_id)
existing = Inbox.joins(:channel).find_by(account_id: account.id, name: inbox_name)

if existing
  puts "INBOX_EXISTS id=#{existing.id} channel=#{existing.channel_type}"
  exit 0
end

channel = Channel::Whatsapp.create!(
  account: account,
  phone_number: phone,
  provider: 'whatsapp_cloud',
  provider_config: {
    'api_key' => api_key,
    'phone_number_id' => phone_number_id,
    'business_account_id' => business_account_id
  }
)

inbox = Inbox.create!(
  account: account,
  name: inbox_name,
  channel: channel
)

# Assign all account admins/agents to the inbox
account.account_users.includes(:user).find_each do |au|
  InboxMember.find_or_create_by!(inbox: inbox, user: au.user)
end

puts "INBOX_CREATED id=#{inbox.id} channel_id=#{channel.id}"
puts "WEBHOOK_HINT https://chat-crm.inovatitech.com.br/webhooks/whatsapp/#{channel.phone_number}"
