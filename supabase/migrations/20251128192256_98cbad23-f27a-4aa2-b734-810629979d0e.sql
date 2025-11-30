-- Create coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('total', 'product', 'frete_gratis')),
  discount_type VARCHAR(10) CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC,
  applicable_products UUID[] DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(store_id, code)
);

-- Create coupon usage tracking table
CREATE TABLE public.coupon_uses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_phone TEXT,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  discount_applied NUMERIC NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_uses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coupons
CREATE POLICY "Users can view coupons from their store"
  ON public.coupons FOR SELECT
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert coupons in their store"
  ON public.coupons FOR INSERT
  WITH CHECK (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update coupons in their store"
  ON public.coupons FOR UPDATE
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete coupons in their store"
  ON public.coupons FOR DELETE
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for coupon_uses
CREATE POLICY "Users can view coupon uses from their store"
  ON public.coupon_uses FOR SELECT
  USING (coupon_id IN (SELECT id FROM coupons WHERE store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Users can insert coupon uses"
  ON public.coupon_uses FOR INSERT
  WITH CHECK (coupon_id IN (SELECT id FROM coupons WHERE store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid())));

-- Public policies for coupon validation (anonymous users can check coupons)
CREATE POLICY "Public can view active coupons"
  ON public.coupons FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can insert coupon uses"
  ON public.coupon_uses FOR INSERT
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_coupons_store_id ON public.coupons(store_id);
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupon_uses_coupon_id ON public.coupon_uses(coupon_id);
CREATE INDEX idx_coupon_uses_customer_phone ON public.coupon_uses(customer_phone);

-- Trigger for updated_at
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create campaign_customers table for tracking selected customers per campaign
CREATE TABLE public.campaign_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.whatsapp_campaigns(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  is_selected BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(campaign_id, customer_id)
);

-- Enable RLS
ALTER TABLE public.campaign_customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaign_customers
CREATE POLICY "Users can manage campaign customers from their store"
  ON public.campaign_customers FOR ALL
  USING (campaign_id IN (SELECT id FROM whatsapp_campaigns WHERE store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid())))
  WITH CHECK (campaign_id IN (SELECT id FROM whatsapp_campaigns WHERE store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid())));

CREATE INDEX idx_campaign_customers_campaign_id ON public.campaign_customers(campaign_id);