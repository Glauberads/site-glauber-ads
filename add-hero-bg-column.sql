-- Este script deve ser executado no painel do Supabase, aba SQL Editor, para habilitar a personalização do Background da Hero.
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_bg_url TEXT;
