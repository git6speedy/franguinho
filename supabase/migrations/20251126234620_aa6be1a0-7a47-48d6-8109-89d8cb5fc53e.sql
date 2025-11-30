-- Adicionar coluna card_machine_id na tabela orders
ALTER TABLE public.orders 
ADD COLUMN card_machine_id uuid REFERENCES public.card_machines(id);

-- Criar índice para melhor performance
CREATE INDEX idx_orders_card_machine_id ON public.orders(card_machine_id);