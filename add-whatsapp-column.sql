-- =====================================================
-- ADD WHATSAPP NUMBER TO SITE SETTINGS
-- =====================================================
-- Execute este SQL no Supabase SQL Editor
-- Adiciona coluna whatsapp_number à tabela site_settings
-- =====================================================

-- Adicionar coluna whatsapp_number à tabela site_settings
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
-- Execute esta query para verificar se a coluna foi adicionada:

-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'site_settings'
-- AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- Esperado: whatsapp_number | text | YES
-- =====================================================
