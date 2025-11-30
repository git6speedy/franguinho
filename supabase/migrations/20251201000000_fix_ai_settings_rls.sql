-- Corrigir políticas RLS da tabela ai_settings
-- Problema: Apenas admins conseguem ler, mas todos os usuários precisam ver o limite diário

-- Remover políticas antigas restritivas
DROP POLICY IF EXISTS "Admins can view AI settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Admins can insert AI settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Admins can update AI settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Admins can delete AI settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Admins can manage AI settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Anyone can view AI settings" ON public.ai_settings;

-- Criar novas políticas:
-- 1. TODOS podem LER (para ver o limite diário)
CREATE POLICY "Anyone can view AI settings"
  ON public.ai_settings
  FOR SELECT
  USING (true);

-- 2. Apenas ADMINS podem INSERIR
CREATE POLICY "Admins can insert AI settings"
  ON public.ai_settings
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Apenas ADMINS podem ATUALIZAR
CREATE POLICY "Admins can update AI settings"
  ON public.ai_settings
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Apenas ADMINS podem DELETAR
CREATE POLICY "Admins can delete AI settings"
  ON public.ai_settings
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Comentário explicativo
COMMENT ON POLICY "Anyone can view AI settings" ON public.ai_settings IS 
'Permite que todos os usuários vejam as configurações de IA (especialmente o limite diário), mas apenas admins podem modificar';
