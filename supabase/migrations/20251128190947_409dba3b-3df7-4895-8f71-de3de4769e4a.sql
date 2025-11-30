-- Tabela de campanhas de WhatsApp
CREATE TABLE public.whatsapp_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  rule_type VARCHAR NOT NULL CHECK (rule_type IN ('inactivity_period', 'loyalty_reward', 'post_purchase_thankyou')),
  rule_params JSONB DEFAULT '{}',
  message TEXT NOT NULL,
  status VARCHAR DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'paused')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_run_at TIMESTAMP WITH TIME ZONE,
  total_sent INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0
);

-- Tabela de logs de envio
CREATE TABLE public.campaign_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.whatsapp_campaigns(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  customer_name VARCHAR,
  customer_phone VARCHAR NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies para whatsapp_campaigns
CREATE POLICY "Users can view campaigns from their store" 
ON public.whatsapp_campaigns FOR SELECT 
USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert campaigns in their store" 
ON public.whatsapp_campaigns FOR INSERT 
WITH CHECK (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update campaigns in their store" 
ON public.whatsapp_campaigns FOR UPDATE 
USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete campaigns in their store" 
ON public.whatsapp_campaigns FOR DELETE 
USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies para campaign_logs
CREATE POLICY "Users can view logs from their campaigns" 
ON public.campaign_logs FOR SELECT 
USING (campaign_id IN (
  SELECT id FROM whatsapp_campaigns 
  WHERE store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid())
));

CREATE POLICY "Users can insert logs for their campaigns" 
ON public.campaign_logs FOR INSERT 
WITH CHECK (campaign_id IN (
  SELECT id FROM whatsapp_campaigns 
  WHERE store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid())
));

CREATE POLICY "Users can update logs for their campaigns" 
ON public.campaign_logs FOR UPDATE 
USING (campaign_id IN (
  SELECT id FROM whatsapp_campaigns 
  WHERE store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid())
));

-- Indexes
CREATE INDEX idx_whatsapp_campaigns_store_id ON public.whatsapp_campaigns(store_id);
CREATE INDEX idx_campaign_logs_campaign_id ON public.campaign_logs(campaign_id);
CREATE INDEX idx_campaign_logs_customer_id ON public.campaign_logs(customer_id);
CREATE INDEX idx_campaign_logs_sent_at ON public.campaign_logs(sent_at);

-- Trigger para updated_at
CREATE TRIGGER update_whatsapp_campaigns_updated_at
BEFORE UPDATE ON public.whatsapp_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();