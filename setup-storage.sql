-- =====================================================
-- SUPABASE STORAGE SETUP - site-assets bucket
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Cole o conteúdo abaixo
-- =====================================================

-- 1. Criar o bucket 'site-assets' (execute uma vez)
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. POLÍTICAS DE RLS (Row Level Security)
-- =====================================================

-- ✅ POLÍTICA 1: Permitir SELECT (leitura) para qualquer pessoa
-- Isso permite que as imagens sejam carregadas publicamente no site
CREATE POLICY "Allow public read access to site-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');

-- ✅ POLÍTICA 2: Permitir INSERT (upload) apenas para usuários autenticados
-- Isso garante que apenas admin (usuários logados) possam fazer upload
CREATE POLICY "Allow authenticated users to upload to site-assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'site-assets');

-- ✅ POLÍTICA 3: Permitir UPDATE apenas para usuários autenticados
-- Permite que admins atualizem/ressubam arquivos
CREATE POLICY "Allow authenticated users to update site-assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'site-assets')
WITH CHECK (bucket_id = 'site-assets');

-- ✅ POLÍTICA 4: Permitir DELETE apenas para usuários autenticados
-- Permite que admins deletem arquivos (opcional, mas recomendado)
CREATE POLICY "Allow authenticated users to delete from site-assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'site-assets');

-- =====================================================
-- VERIFICAÇÃO (não altera nada)
-- =====================================================
-- Após executar as políticas acima, rode esto para verificar:

-- Ver buckets disponíveis:
SELECT id, name, public FROM storage.buckets WHERE id = 'site-assets';

-- Ver políticas do bucket:
SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- =====================================================
-- LIMPEZA (se precisar remover tudo para começar novamente)
-- =====================================================
-- ⚠️ Descomente abaixo APENAS se tiver certeza (apaga dados!)

-- DROP POLICY IF EXISTS "Allow public read access to site-assets" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow authenticated users to upload to site-assets" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow authenticated users to update site-assets" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow authenticated users to delete from site-assets" ON storage.objects;
-- DELETE FROM storage.buckets WHERE id = 'site-assets';

-- =====================================================
-- DATA: 22 de Abril de 2026
-- PROJETO: Glauber Ads - Site + Admin Dashboard
-- STATUS: ✅ Pronto para usar
-- =====================================================
