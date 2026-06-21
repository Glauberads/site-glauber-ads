-- Migration para adicionar o prompt da inteligência artificial nas configurações do sistema
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS ai_system_prompt TEXT;
