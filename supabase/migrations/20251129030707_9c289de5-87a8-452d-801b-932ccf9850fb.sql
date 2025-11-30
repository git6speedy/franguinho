-- Tabela para registrar sobras e faltas de perecíveis
CREATE TABLE public.perishable_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  cash_register_id UUID REFERENCES public.cash_register(id) ON DELETE SET NULL,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  context_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para itens de sobras
CREATE TABLE public.perishable_record_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  perishable_record_id UUID NOT NULL REFERENCES public.perishable_records(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_variation_id UUID REFERENCES public.product_variations(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('sobra', 'falta')),
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar coluna para habilitar controle de perecíveis na loja
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS perishable_control_enabled BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.perishable_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perishable_record_items ENABLE ROW LEVEL SECURITY;

-- RLS policies para perishable_records
CREATE POLICY "Users can view their store's perishable records" 
ON public.perishable_records 
FOR SELECT 
USING (store_id IN (SELECT profiles.store_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can insert their store's perishable records" 
ON public.perishable_records 
FOR INSERT 
WITH CHECK (store_id IN (SELECT profiles.store_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can update their store's perishable records" 
ON public.perishable_records 
FOR UPDATE 
USING (store_id IN (SELECT profiles.store_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can delete their store's perishable records" 
ON public.perishable_records 
FOR DELETE 
USING (store_id IN (SELECT profiles.store_id FROM profiles WHERE profiles.id = auth.uid()));

-- RLS policies para perishable_record_items
CREATE POLICY "Users can view their perishable record items" 
ON public.perishable_record_items 
FOR SELECT 
USING (perishable_record_id IN (SELECT id FROM public.perishable_records WHERE store_id IN (SELECT profiles.store_id FROM profiles WHERE profiles.id = auth.uid())));

CREATE POLICY "Users can insert their perishable record items" 
ON public.perishable_record_items 
FOR INSERT 
WITH CHECK (perishable_record_id IN (SELECT id FROM public.perishable_records WHERE store_id IN (SELECT profiles.store_id FROM profiles WHERE profiles.id = auth.uid())));

CREATE POLICY "Users can update their perishable record items" 
ON public.perishable_record_items 
FOR UPDATE 
USING (perishable_record_id IN (SELECT id FROM public.perishable_records WHERE store_id IN (SELECT profiles.store_id FROM profiles WHERE profiles.id = auth.uid())));

CREATE POLICY "Users can delete their perishable record items" 
ON public.perishable_record_items 
FOR DELETE 
USING (perishable_record_id IN (SELECT id FROM public.perishable_records WHERE store_id IN (SELECT profiles.store_id FROM profiles WHERE profiles.id = auth.uid())));