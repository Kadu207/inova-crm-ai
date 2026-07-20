# Create/ensure human agent on Chatwoot account for CRM.
# ENV:
#   AGENT_EMAIL (default: agent@demo.inovatitech.com.br)
#   AGENT_NAME (default: Agent Demo CRM)
#   AGENT_PASSWORD (required unless agent exists)
#   ACCOUNT_ID (default: 1)
#   AGENT_ROLE: agent|administrator (default: agent)

email = ENV.fetch('AGENT_EMAIL', 'agent@demo.inovatitech.com.br')
name = ENV.fetch('AGENT_NAME', 'Agent Demo CRM')
account_id = Integer(ENV.fetch('ACCOUNT_ID', '1'))
role = ENV.fetch('AGENT_ROLE', 'agent')
password = ENV['AGENT_PASSWORD']

account = Account.find(account_id)
user = User.find_by(email: email)

if user.nil?
  raise 'AGENT_PASSWORD required to create new agent' if password.to_s.strip.empty?

  user = User.create!(
    name: name,
    email: email,
    password: password,
    password_confirmation: password,
    type: nil
  )
  user.confirm if user.respond_to?(:confirm)
  puts "USER_CREATED id=#{user.id} email=#{user.email}"
else
  puts "USER_EXISTS id=#{user.id} email=#{user.email}"
  if password.to_s.strip != ''
    user.password = password
    user.password_confirmation = password
    user.save!
    puts 'USER_PASSWORD_UPDATED'
  end
end

au = AccountUser.find_or_initialize_by(account: account, user: user)
au.role = role
au.save!
puts "ACCOUNT_USER role=#{au.role} account=#{account.id}"

# Ensure SuperAdmin CRM owner is also on the account
%w[admin@inovatitech.com.br inovatidev@gmail.com].each do |admin_email|
  admin = User.find_by(email: admin_email)
  next unless admin

  admin_au = AccountUser.find_or_initialize_by(account: account, user: admin)
  admin_au.role = :administrator
  admin_au.save!
  puts "ADMIN_LINKED email=#{admin_email}"
end

# Add agent to all inboxes
account.inboxes.find_each do |inbox|
  InboxMember.find_or_create_by!(inbox: inbox, user: user)
  puts "INBOX_MEMBER inbox=#{inbox.id} user=#{user.id}"
end

puts 'AGENT_SETUP_OK'
