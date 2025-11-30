-- Adicionar campo discount_amount na tabela orders
ALTER TABLE public.orders
ADD COLUMN discount_amount numeric DEFAULT 0;