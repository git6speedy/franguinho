-- Adicionar campo ifood_price na tabela products
ALTER TABLE products ADD COLUMN IF NOT EXISTS ifood_price NUMERIC DEFAULT NULL;

-- Comentário explicativo
COMMENT ON COLUMN products.ifood_price IS 'Preço diferenciado para pedidos do Ifood. Se NULL, usa o preço normal.';
