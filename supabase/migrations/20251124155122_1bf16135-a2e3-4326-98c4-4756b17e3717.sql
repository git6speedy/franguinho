-- Inserir conversas fake para visualização
-- Substitua 'YOUR_STORE_ID' pelo ID real da sua loja

-- Conversa 1: Cliente Maria (3 mensagens)
INSERT INTO whatsapp_messages (store_id, client_number, client_name, sender, message, read, created_at)
SELECT 
  id as store_id,
  '5511987654321' as client_number,
  'Maria Silva' as client_name,
  'client' as sender,
  'Olá! Vocês tem açaí disponível?' as message,
  true as read,
  NOW() - INTERVAL '2 hours' as created_at
FROM stores LIMIT 1;

INSERT INTO whatsapp_messages (store_id, client_number, client_name, sender, message, read, created_at)
SELECT 
  id as store_id,
  '5511987654321' as client_number,
  'Maria Silva' as client_name,
  'attendant' as sender,
  'Sim! Temos açaí 300ml, 500ml e 700ml. Qual você prefere?' as message,
  true as read,
  NOW() - INTERVAL '1 hour 50 minutes' as created_at
FROM stores LIMIT 1;

INSERT INTO whatsapp_messages (store_id, client_number, client_name, sender, message, read, created_at)
SELECT 
  id as store_id,
  '5511987654321' as client_number,
  'Maria Silva' as client_name,
  'client' as sender,
  'Quero o de 500ml com granola e leite em pó!' as message,
  true as read,
  NOW() - INTERVAL '1 hour 45 minutes' as created_at
FROM stores LIMIT 1;

-- Conversa 2: Cliente João (mensagem não lida)
INSERT INTO whatsapp_messages (store_id, client_number, client_name, sender, message, read, created_at)
SELECT 
  id as store_id,
  '5511976543210' as client_number,
  'João Santos' as client_name,
  'client' as sender,
  'Bom dia! Qual o horário de funcionamento?' as message,
  false as read,
  NOW() - INTERVAL '30 minutes' as created_at
FROM stores LIMIT 1;

-- Conversa 3: Cliente Ana (conversa mais antiga)
INSERT INTO whatsapp_messages (store_id, client_number, client_name, sender, message, read, created_at)
SELECT 
  id as store_id,
  '5511965432109' as client_number,
  'Ana Costa' as client_name,
  'client' as sender,
  'Vocês fazem entrega?' as message,
  true as read,
  NOW() - INTERVAL '5 hours' as created_at
FROM stores LIMIT 1;

INSERT INTO whatsapp_messages (store_id, client_number, client_name, sender, message, read, created_at)
SELECT 
  id as store_id,
  '5511965432109' as client_number,
  'Ana Costa' as client_name,
  'attendant' as sender,
  'Sim! Fazemos entrega em todo o bairro. Taxa de R$ 5,00' as message,
  true as read,
  NOW() - INTERVAL '4 hours 55 minutes' as created_at
FROM stores LIMIT 1;

INSERT INTO whatsapp_messages (store_id, client_number, client_name, sender, message, read, created_at)
SELECT 
  id as store_id,
  '5511965432109' as client_number,
  'Ana Costa' as client_name,
  'client' as sender,
  'Perfeito! Vou fazer o pedido' as message,
  true as read,
  NOW() - INTERVAL '4 hours 50 minutes' as created_at
FROM stores LIMIT 1;

-- Conversa 4: Cliente Pedro (nova mensagem não lida)
INSERT INTO whatsapp_messages (store_id, client_number, client_name, sender, message, read, created_at)
SELECT 
  id as store_id,
  '5511954321098' as client_number,
  null as client_name,
  'client' as sender,
  'Tem sorvete?' as message,
  false as read,
  NOW() - INTERVAL '5 minutes' as created_at
FROM stores LIMIT 1;