-- Habilita a personalização do Rodapé e Redes Sociais
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS footer_brand_name TEXT,
ADD COLUMN IF NOT EXISTS footer_institutional_text TEXT,
ADD COLUMN IF NOT EXISTS social_instagram TEXT,
ADD COLUMN IF NOT EXISTS social_facebook TEXT,
ADD COLUMN IF NOT EXISTS social_linkedin TEXT,
ADD COLUMN IF NOT EXISTS social_youtube TEXT,
ADD COLUMN IF NOT EXISTS social_tiktok TEXT,
ADD COLUMN IF NOT EXISTS social_website TEXT,
ADD COLUMN IF NOT EXISTS footer_copyright TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.site_settings.footer_brand_name IS 'Nome da marca exibido no rodapé';
COMMENT ON COLUMN public.site_settings.footer_institutional_text IS 'Frase institucional exibida no rodapé';
COMMENT ON COLUMN public.site_settings.social_instagram IS 'Link para o perfil do Instagram';
COMMENT ON COLUMN public.site_settings.social_facebook IS 'Link para o perfil do Facebook';
COMMENT ON COLUMN public.site_settings.social_linkedin IS 'Link para o perfil do LinkedIn';
COMMENT ON COLUMN public.site_settings.social_youtube IS 'Link para o canal do YouTube';
COMMENT ON COLUMN public.site_settings.social_tiktok IS 'Link para o perfil do TikTok';
COMMENT ON COLUMN public.site_settings.social_website IS 'Link para site adicional ou opcional';
COMMENT ON COLUMN public.site_settings.footer_copyright IS 'Texto de copyright (ex: © 2026 Glauber Ads)';
