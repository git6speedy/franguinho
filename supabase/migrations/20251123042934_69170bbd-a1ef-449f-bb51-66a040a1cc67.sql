-- Habilitar real-time para a tabela orders
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- Adicionar a tabela orders à publicação do real-time (se ainda não estiver)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;