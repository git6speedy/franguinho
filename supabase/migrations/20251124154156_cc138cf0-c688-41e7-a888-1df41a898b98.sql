-- Adicionar campos de configuração WhatsApp na tabela stores
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS whatsapp_n8n_endpoint TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_n8n_token TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT false;

-- Criar tabela de mensagens WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  client_number TEXT NOT NULL,
  client_name TEXT,
  sender TEXT NOT NULL CHECK (sender IN ('client', 'attendant')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  read BOOLEAN DEFAULT false
);

-- Criar tabela de atalhos de texto
CREATE TABLE IF NOT EXISTS whatsapp_shortcuts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  command TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'menu')),
  menu_items JSONB,
  show_buttons BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de carrinhos WhatsApp (persistir carrinho por conversa)
CREATE TABLE IF NOT EXISTS whatsapp_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  client_number TEXT NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, client_number)
);

-- Habilitar RLS
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_shortcuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_carts ENABLE ROW LEVEL SECURITY;

-- Policies para whatsapp_messages
CREATE POLICY "Users can view messages from their store"
  ON whatsapp_messages FOR SELECT
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert messages in their store"
  ON whatsapp_messages FOR INSERT
  WITH CHECK (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update messages in their store"
  ON whatsapp_messages FOR UPDATE
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

-- Policies para whatsapp_shortcuts
CREATE POLICY "Users can manage shortcuts in their store"
  ON whatsapp_shortcuts FOR ALL
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

-- Policies para whatsapp_carts
CREATE POLICY "Users can manage carts in their store"
  ON whatsapp_carts FOR ALL
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_store_client ON whatsapp_messages(store_id, client_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_shortcuts_store ON whatsapp_shortcuts(store_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_carts_store_client ON whatsapp_carts(store_id, client_number);

-- Trigger para updated_at
CREATE TRIGGER update_whatsapp_shortcuts_updated_at
  BEFORE UPDATE ON whatsapp_shortcuts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_carts_updated_at
  BEFORE UPDATE ON whatsapp_carts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Inserir atalhos padrão para lojas existentes (exemplo)
INSERT INTO whatsapp_shortcuts (store_id, command, message, type)
SELECT id, '/pix', 'Nossa chave PIX: [configurar chave PIX]', 'text'
FROM stores
WHERE NOT EXISTS (
  SELECT 1 FROM whatsapp_shortcuts 
  WHERE store_id = stores.id AND command = '/pix'
);

INSERT INTO whatsapp_shortcuts (store_id, command, message, type)
SELECT id, '/endereco', 'Nosso endereço: [configurar endereço]', 'text'
FROM stores
WHERE NOT EXISTS (
  SELECT 1 FROM whatsapp_shortcuts 
  WHERE store_id = stores.id AND command = '/endereco'
);

-- Habilitar realtime para mensagens
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_messages;