-- ==============================================================================
-- 🚀 OMNIVENDAS / GLAUBER ADS - COMPLETE DATABASE MIGRATION SCRIPT
-- ==============================================================================
-- Este arquivo contém TODA a infraestrutura do banco de dados do projeto.
-- Pode ser rodado no SQL Editor de um novo projeto Supabase em caso de migração.
-- ==============================================================================

-- =========================================
-- 1. ENUMS E FUNÇÕES UTILITÁRIAS
-- =========================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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

-- =========================================
-- 2. TABELA DE PERMISSÕES (user_roles)
-- =========================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função blindada de segurança para as políticas RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role text)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = _role
  );
$$;

-- RLS para user_roles
DROP POLICY IF EXISTS "Users see own roles" ON public.user_roles;
CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage roles insert" ON public.user_roles;
CREATE POLICY "Admins manage roles insert" ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage roles update" ON public.user_roles;
CREATE POLICY "Admins manage roles update" ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage roles delete" ON public.user_roles;
CREATE POLICY "Admins manage roles delete" ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- 3. GESTÃO DE LEADS (leads)
-- =========================================
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  solucao_interesse TEXT,
  descricao_necessidade TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert leads" ON public.leads;
CREATE POLICY "Public can insert leads" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins manage leads select" ON public.leads;
CREATE POLICY "Admins manage leads select" ON public.leads FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage leads update" ON public.leads;
CREATE POLICY "Admins manage leads update" ON public.leads FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage leads delete" ON public.leads;
CREATE POLICY "Admins manage leads delete" ON public.leads FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- 4. PERFIS DE USUÁRIOS (profiles)
-- =========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;
CREATE POLICY "Authenticated can view profiles" ON public.profiles FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Autocriação de perfil no login
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
DECLARE total_users INT;
BEGIN
  INSERT INTO public.profiles (user_id, display_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))) ON CONFLICT DO NOTHING;
  SELECT COUNT(*) INTO total_users FROM public.user_roles;
  IF total_users = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- 5. CONFIGURAÇÕES VISUAIS (site_settings)
-- =========================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT,
  favicon_url TEXT,
  hero_bg_url TEXT,
  whatsapp_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_settings (id) SELECT gen_random_uuid() WHERE NOT EXISTS (SELECT 1 FROM public.site_settings) LIMIT 1;

DROP POLICY IF EXISTS "Public can read site_settings" ON public.site_settings;
CREATE POLICY "Public can read site_settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (TRUE);

DROP POLICY IF EXISTS "Admins update site_settings" ON public.site_settings;
CREATE POLICY "Admins update site_settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins insert site_settings" ON public.site_settings;
CREATE POLICY "Admins insert site_settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- 6. CONFIGURAÇÕES DE MARKETING (settings)
-- =========================================
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_pixel_id TEXT,
  meta_pixel_script TEXT,
  gtm_id TEXT,
  global_site_tag TEXT,
  custom_head_script TEXT,
  custom_body_script TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_settings_updated_at ON public.settings;
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.settings (id) SELECT gen_random_uuid() WHERE NOT EXISTS (SELECT 1 FROM public.settings) LIMIT 1;

DROP POLICY IF EXISTS "Public can read settings" ON public.settings;
CREATE POLICY "Public can read settings" ON public.settings FOR SELECT TO anon, authenticated USING (TRUE);

DROP POLICY IF EXISTS "Admins update settings" ON public.settings;
CREATE POLICY "Admins update settings" ON public.settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins insert settings" ON public.settings;
CREATE POLICY "Admins insert settings" ON public.settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- 7. STORAGE E ASSETS (site-assets)
-- =========================================
INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow public read site-assets" ON storage.objects;
CREATE POLICY "Allow public read site-assets" ON storage.objects FOR SELECT USING (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "Allow authenticated upload site-assets" ON storage.objects;
CREATE POLICY "Allow authenticated upload site-assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "Allow authenticated update site-assets" ON storage.objects;
CREATE POLICY "Allow authenticated update site-assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'site-assets') WITH CHECK (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "Allow authenticated delete site-assets" ON storage.objects;
CREATE POLICY "Allow authenticated delete site-assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'site-assets');

-- =========================================
-- FIM DO SCRIPT
-- =========================================
