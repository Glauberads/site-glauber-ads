-- =========================================
-- ENUM de papéis
-- =========================================
do $$ begin
  create type public.app_role as enum ('admin', 'moderator', 'user');
exception when duplicate_object then null; end $$;

-- =========================================
-- Função utilitária: updated_at
-- =========================================
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================
-- Tabela leads (cria se ainda não existir)
-- =========================================
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  whatsapp text not null,
  solucao_interesse text,
  descricao_necessidade text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

-- =========================================
-- profiles
-- =========================================
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at_column();

-- =========================================
-- user_roles
-- =========================================
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- has_role security definer (evita recursão em RLS)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- =========================================
-- settings (singleton)
-- =========================================
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  meta_pixel_id text,
  meta_pixel_script text,
  gtm_id text,
  global_site_tag text,
  custom_head_script text,
  custom_body_script text,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

insert into public.settings (id)
select gen_random_uuid()
where not exists (select 1 from public.settings);

drop trigger if exists update_settings_updated_at on public.settings;
create trigger update_settings_updated_at
before update on public.settings
for each row execute function public.update_updated_at_column();

-- =========================================
-- webhooks
-- =========================================
create table if not exists public.webhooks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  method text not null default 'POST',
  url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.webhooks enable row level security;

drop trigger if exists update_webhooks_updated_at on public.webhooks;
create trigger update_webhooks_updated_at
before update on public.webhooks
for each row execute function public.update_updated_at_column();

-- =========================================
-- webhook_logs
-- =========================================
create table if not exists public.webhook_logs (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid references public.webhooks(id) on delete cascade,
  method text,
  status_code int,
  response_size int,
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table public.webhook_logs enable row level security;

-- =========================================
-- RLS Policies
-- =========================================

-- leads
drop policy if exists "Public can insert leads" on public.leads;
create policy "Public can insert leads"
on public.leads for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins manage leads select" on public.leads;
create policy "Admins manage leads select"
on public.leads for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins manage leads update" on public.leads;
create policy "Admins manage leads update"
on public.leads for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins manage leads delete" on public.leads;
create policy "Admins manage leads delete"
on public.leads for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- profiles
drop policy if exists "Authenticated can view profiles" on public.profiles;
create policy "Authenticated can view profiles"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = user_id);

-- user_roles
drop policy if exists "Users see own roles" on public.user_roles;
create policy "Users see own roles"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins manage roles insert" on public.user_roles;
create policy "Admins manage roles insert"
on public.user_roles for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins manage roles update" on public.user_roles;
create policy "Admins manage roles update"
on public.user_roles for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins manage roles delete" on public.user_roles;
create policy "Admins manage roles delete"
on public.user_roles for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- settings (público lê para a landing page injetar scripts)
drop policy if exists "Public can read settings" on public.settings;
create policy "Public can read settings"
on public.settings for select
to anon, authenticated
using (true);

drop policy if exists "Admins update settings" on public.settings;
create policy "Admins update settings"
on public.settings for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins insert settings" on public.settings;
create policy "Admins insert settings"
on public.settings for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

-- webhooks
drop policy if exists "Admins select webhooks" on public.webhooks;
create policy "Admins select webhooks"
on public.webhooks for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins insert webhooks" on public.webhooks;
create policy "Admins insert webhooks"
on public.webhooks for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins update webhooks" on public.webhooks;
create policy "Admins update webhooks"
on public.webhooks for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins delete webhooks" on public.webhooks;
create policy "Admins delete webhooks"
on public.webhooks for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- webhook_logs
drop policy if exists "Admins read logs" on public.webhook_logs;
create policy "Admins read logs"
on public.webhook_logs for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins insert logs" on public.webhook_logs;
create policy "Admins insert logs"
on public.webhook_logs for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- Trigger handle_new_user: cria profile e promove primeiro user a admin
-- =========================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  total_users int;
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (user_id) do nothing;

  select count(*) into total_users from public.user_roles;
  if total_users = 0 then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'user')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();