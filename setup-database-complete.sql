-- =====================================================
-- SUPABASE DATABASE + STORAGE COMPLETE SETUP
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- Funcionalidades:
--   1. Cria tabela site_settings (logo_url, favicon_url)
--   2. Garante tabela user_roles (com policies RLS)
--   3. Cria bucket site-assets no Storage
--   4. Configura todas as políticas de segurança
-- =====================================================

-- =====================================================
-- 1. ENUM de roles (admin, moderator, user)
-- =====================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 2. Função helper para updated_at (trigger)
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =====================================================
-- 3. Tabela user_roles (gerenciamento de permissões)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função helper: has_role (verifica se usuário tem role)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Políticas RLS para user_roles
DROP POLICY IF EXISTS "Users see own roles" ON public.user_roles;
CREATE POLICY "Users see own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage roles insert" ON public.user_roles;
CREATE POLICY "Admins manage roles insert"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage roles update" ON public.user_roles;
CREATE POLICY "Admins manage roles update"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage roles delete" ON public.user_roles;
CREATE POLICY "Admins manage roles delete"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- 4. Tabela site_settings (configurações dinâmicas)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT,
  favicon_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Políticas RLS para site_settings
DROP POLICY IF EXISTS "Public can read site_settings" ON public.site_settings;
CREATE POLICY "Public can read site_settings"
ON public.site_settings FOR SELECT
TO anon, authenticated
USING (TRUE);

DROP POLICY IF EXISTS "Admins update site_settings" ON public.site_settings;
CREATE POLICY "Admins update site_settings"
ON public.site_settings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins insert site_settings" ON public.site_settings;
CREATE POLICY "Admins insert site_settings"
ON public.site_settings FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Inicializar site_settings com row padrão (se vazio)
INSERT INTO public.site_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings)
LIMIT 1;

-- =====================================================
-- 5. STORAGE: Bucket site-assets
-- =====================================================
-- Criar bucket (inserir na tabela de buckets do Storage)
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para site-assets
-- ✅ POLICY 1: Permitir leitura pública (SELECT)
DROP POLICY IF EXISTS "Allow public read site-assets" ON storage.objects;
CREATE POLICY "Allow public read site-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');

-- ✅ POLICY 2: Permitir upload apenas para autenticado (INSERT)
DROP POLICY IF EXISTS "Allow authenticated upload site-assets" ON storage.objects;
CREATE POLICY "Allow authenticated upload site-assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'site-assets');

-- ✅ POLICY 3: Permitir update para autenticado (UPDATE)
DROP POLICY IF EXISTS "Allow authenticated update site-assets" ON storage.objects;
CREATE POLICY "Allow authenticated update site-assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'site-assets')
WITH CHECK (bucket_id = 'site-assets');

-- ✅ POLICY 4: Permitir delete para autenticado (DELETE)
DROP POLICY IF EXISTS "Allow authenticated delete site-assets" ON storage.objects;
CREATE POLICY "Allow authenticated delete site-assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'site-assets');

-- =====================================================
-- 6. VERIFICAÇÃO E ÍNDICES
-- =====================================================

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Verificar se tudo foi criado
SELECT 
  'user_roles' as table_name,
  COUNT(*) as total_rows
FROM public.user_roles
UNION ALL
SELECT 
  'site_settings' as table_name,
  COUNT(*) as total_rows
FROM public.site_settings
UNION ALL
SELECT 
  'storage.buckets' as table_name,
  COUNT(*) as total_rows
FROM storage.buckets
WHERE id = 'site-assets';

-- =====================================================
-- ✅ SETUP COMPLETO
-- =====================================================
-- Após executar:
--   1. Tabela user_roles está criada com RLS
--   2. Tabela site_settings está criada com RLS
--   3. Bucket site-assets está criado e público
--   4. Todas as políticas estão configuradas
--   5. Índices estão criados para performance
-- 
-- Próximo passo: Testar upload na aba Admin → Personalização
-- =====================================================
