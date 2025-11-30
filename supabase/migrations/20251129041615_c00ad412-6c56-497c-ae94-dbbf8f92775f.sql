-- Adicionar campo description à tabela stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS description TEXT;

-- Criar tabela de configurações de IA (apenas para admin)
CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_endpoint TEXT NOT NULL,
  daily_limit_per_store INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de insights gerados
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  request_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  comparison_date DATE NOT NULL,
  comparison_period TEXT NOT NULL, -- 'day', 'week', 'month'
  request_payload JSONB NOT NULL,
  response_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Políticas para ai_settings (apenas admin)
CREATE POLICY "Admins can manage AI settings"
  ON ai_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas para ai_insights (store managers)
CREATE POLICY "Users can view their store's insights"
  ON ai_insights
  FOR SELECT
  USING (store_id IN (
    SELECT store_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert insights for their store"
  ON ai_insights
  FOR INSERT
  WITH CHECK (store_id IN (
    SELECT store_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete their store's insights"
  ON ai_insights
  FOR DELETE
  USING (store_id IN (
    SELECT store_id FROM profiles WHERE id = auth.uid()
  ));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_ai_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_insights_updated_at
BEFORE UPDATE ON ai_insights
FOR EACH ROW
EXECUTE FUNCTION update_ai_insights_updated_at();

-- Inserir configuração padrão de IA
INSERT INTO ai_settings (webhook_endpoint, daily_limit_per_store)
VALUES ('https://seu-webhook-n8n.com/webhook/insights', 10)
ON CONFLICT DO NOTHING;