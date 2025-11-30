-- Create upsell_rules table
CREATE TABLE public.upsell_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('always', 'cart_total')),
  min_cart_total NUMERIC,
  use_discount BOOLEAN NOT NULL DEFAULT false,
  discount_price NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.upsell_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view upsell rules from their store"
  ON public.upsell_rules FOR SELECT
  USING (store_id IN (SELECT store_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert upsell rules in their store"
  ON public.upsell_rules FOR INSERT
  WITH CHECK (store_id IN (SELECT store_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update upsell rules in their store"
  ON public.upsell_rules FOR UPDATE
  USING (store_id IN (SELECT store_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete upsell rules in their store"
  ON public.upsell_rules FOR DELETE
  USING (store_id IN (SELECT store_id FROM public.profiles WHERE id = auth.uid()));

-- Public can view active upsell rules
CREATE POLICY "Public can view active upsell rules"
  ON public.upsell_rules FOR SELECT
  USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_upsell_rules_updated_at
  BEFORE UPDATE ON public.upsell_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();