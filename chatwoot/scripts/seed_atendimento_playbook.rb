# frozen_string_literal: true
# Seed playbook Inova TI — labels, team Atendimento, canned responses, greetings.
# Usage (VPS):
#   docker compose -f docker-compose.yml -f docker-compose.vps.yml exec -T rails \
#     bundle exec rails runner "$(cat scripts/seed_atendimento_playbook.rb)"
#
# Idempotent: find_or_create / update by unique keys. Account 1 only.

ACCOUNT_ID = Integer(ENV.fetch('ACCOUNT_ID', '1'))
account = Account.find(ACCOUNT_ID)

LABELS = [
  { title: 'comercial', description: 'Vendas / proposta', color: '#C45C26' },
  { title: 'suporte', description: 'Técnico / pós-venda', color: '#2F5D50' },
  { title: 'financeiro', description: 'Cobrança / NF', color: '#8B6914' },
  { title: 'humano', description: 'Cliente pediu atendente', color: '#1F4E79' },
  { title: 'resolvido', description: 'Encerrado sem venda', color: '#5C6B73' },
  { title: 'ganho', description: 'Negócio fechado', color: '#1B7F4E' },
  { title: 'perdido', description: 'Não avançou', color: '#8B3A3A' }
].freeze

MACROS = [
  {
    short_code: 'boasvindas',
    content: 'Olá! Aqui é o atendimento da Inova TI. Em que podemos ajudar hoje?'
  },
  {
    short_code: 'humano',
    content: 'Certo — vou encaminhar para um especialista da Inova TI. Em instantes alguém retoma por aqui.'
  },
  {
    short_code: 'coleta',
    content: "Para agilizar, pode me informar:\n1) Nome\n2) Empresa\n3) Telefone ou @Telegram\n4) O que você precisa"
  },
  {
    short_code: 'fechamento',
    content: 'Obrigado pelo contato com a Inova TI. Se precisar de algo mais, é só responder esta conversa.'
  }
].freeze

GREETING = <<~TEXT.strip
  Seja bem-vindo(a) à Inova TI!
  É um prazer receber você.

  Descreva sua necessidade em uma mensagem, ou digite /humano para falar com um atendente.
TEXT

puts "Seeding atendimento playbook for account=#{account.id} (#{account.name})"

LABELS.each do |attrs|
  label = Label.find_or_initialize_by(account_id: account.id, title: attrs[:title])
  label.description = attrs[:description]
  label.color = attrs[:color]
  label.show_on_sidebar = true
  label.save!
  puts "  label=#{label.title}"
end

team = Team.find_or_initialize_by(account_id: account.id, name: 'Atendimento')
team.description = 'Fila omnichannel WhatsApp + Telegram (Inova TI)'
team.allow_auto_assign = true
team.save!
puts "  team=#{team.name} id=#{team.id}"

AccountUser.where(account_id: account.id).find_each do |au|
  TeamMember.find_or_create_by!(team_id: team.id, user_id: au.user_id)
end
puts "  team_members=#{team.team_members.count}"

MACROS.each do |attrs|
  canned = CannedResponse.find_or_initialize_by(account_id: account.id, short_code: attrs[:short_code])
  canned.content = attrs[:content]
  canned.save!
  puts "  macro=/#{canned.short_code}"
end

Inbox.where(account_id: account.id, id: [2, 3]).find_each do |inbox|
  inbox.greeting_enabled = true
  inbox.greeting_message = GREETING
  inbox.save!
  puts "  greeting inbox=#{inbox.id} #{inbox.name}"
end

puts 'SEED_ATENDIMENTO_PLAYBOOK_OK'
