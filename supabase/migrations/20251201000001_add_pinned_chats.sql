-- Adicionar campo para armazenar conversas fixadas por loja
-- Cada loja pode ter até 3 conversas fixadas
-- O array armazena os números de telefone na ordem (último fixado = primeiro no array)

ALTER TABLE stores
ADD COLUMN IF NOT EXISTS pinned_chats TEXT[] DEFAULT '{}';

-- Comentário explicativo
COMMENT ON COLUMN stores.pinned_chats IS 
'Array de números de telefone das conversas fixadas. Máximo 3. Último fixado aparece primeiro no array.';
