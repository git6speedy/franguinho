-- Adicionar colunas para configurações avançadas de slides no monitor
ALTER TABLE stores ADD COLUMN IF NOT EXISTS monitor_slide_mode VARCHAR DEFAULT 'off' CHECK (monitor_slide_mode IN ('off', 'fullscreen', 'banner', 'both'));
ALTER TABLE stores ADD COLUMN IF NOT EXISTS monitor_slide_disappear_minutes INTEGER DEFAULT 5;

-- Adicionar coluna para tipo de banner (fullscreen ou banner lateral)
ALTER TABLE banners ADD COLUMN IF NOT EXISTS banner_type VARCHAR DEFAULT 'fullscreen' CHECK (banner_type IN ('fullscreen', 'banner'));

COMMENT ON COLUMN stores.monitor_slide_mode IS 'Modo de exibição de slides: off, fullscreen, banner ou both';
COMMENT ON COLUMN stores.monitor_slide_disappear_minutes IS 'Tempo em minutos para o slide desaparecer';
COMMENT ON COLUMN banners.banner_type IS 'Tipo do banner: fullscreen para slides em tela cheia ou banner para banner lateral';