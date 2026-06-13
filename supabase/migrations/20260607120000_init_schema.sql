-- Lumive AI — initial schema: profiles, projects, deliverables
-- RLS: each authenticated user sees only their own data; service_role bypasses RLS (admin).
-- Auth: a trigger creates a 'prospect' profile for every new auth user.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  company     text,
  role        text not null default 'prospect'
              check (role in ('prospect', 'client', 'admin')),
  created_at  timestamptz not null default now()
);

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references public.profiles(id) on delete cascade,
  title       text not null,
  status      text not null default 'discovery'
              check (status in ('discovery', 'build', 'launch', 'review', 'complete')),
  start_date  date,
  notes       text,
  created_at  timestamptz not null default now()
);

create table if not exists public.deliverables (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references public.projects(id) on delete cascade,
  name         text not null,
  file_url     text,
  uploaded_at  timestamptz not null default now()
);

create index if not exists projects_client_id_idx on public.projects (client_id);
create index if not exists deliverables_project_id_idx on public.deliverables (project_id);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- service_role connections (server admin) bypass RLS entirely, so no admin
-- policies are needed — they already read/write everything.
-- ─────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.deliverables enable row level security;

-- profiles: a user may read and update only their own row.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- allow a user to insert their own profile row (defensive; the trigger also creates it).
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- projects: a client may read only projects where they are the client.
drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own" on public.projects
  for select using (auth.uid() = client_id);

-- deliverables: a client may read only deliverables linked to their own projects.
drop policy if exists "deliverables_select_own" on public.deliverables;
create policy "deliverables_select_own" on public.deliverables
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = deliverables.project_id
        and p.client_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- Auth trigger: every new auth.users row gets a 'prospect' profile.
-- ─────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    'prospect'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
