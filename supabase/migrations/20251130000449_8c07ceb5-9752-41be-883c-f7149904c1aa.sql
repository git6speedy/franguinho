-- Adicionar campo para endpoint de teste na tabela ai_settings
ALTER TABLE public.ai_settings 
ADD COLUMN IF NOT EXISTS webhook_endpoint_test text;

-- Recriar a política RLS para permitir que admins atualizem
DROP POLICY IF EXISTS "Admins can manage AI settings" ON public.ai_settings;

-- Política para SELECT
CREATE POLICY "Admins can view AI settings" 
ON public.ai_settings 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Política para INSERT
CREATE POLICY "Admins can insert AI settings" 
ON public.ai_settings 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Política para UPDATE
CREATE POLICY "Admins can update AI settings" 
ON public.ai_settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Política para DELETE
CREATE POLICY "Admins can delete AI settings" 
ON public.ai_settings 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Garantir que RLS está ativo
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;