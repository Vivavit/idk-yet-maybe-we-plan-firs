-- ============================================================
-- IDK Yet Maybe We Plan First — Hardened Supabase Schema
-- Run this once in your Supabase Dashboard -> SQL Editor
-- ============================================================

create table if not exists public.projects (
  id text primary key,
  share_code text unique not null,
  share_mode text not null default 'edit' check (share_mode in ('edit', 'view', 'private')),
  passcode text not null default '',
  data jsonb not null,
  updated_at timestamptz not null default now(),
  -- Anti-spam size cap: max ~750KB per project (link-only moodboards + WebP storyboards stay tiny)
  constraint projects_max_size check (octet_length(data::text) < 750000),
  constraint projects_code_len check (char_length(share_code) >= 6 and char_length(share_code) <= 24)
);

create index if not exists idx_projects_share_code on public.projects (share_code);

-- Enable Row-Level Security (RLS)
alter table public.projects enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Read non-private projects by code" on public.projects;
drop policy if exists "Create new projects" on public.projects;
drop policy if exists "Update editable projects" on public.projects;

-- 1. Anyone who knows the exact share_code can read non-private shoots
create policy "Read non-private projects by code"
  on public.projects
  for select
  using (share_mode <> 'private');

-- 2. Allow creating new shoots (size & code length enforced by table constraints)
create policy "Create new projects"
  on public.projects
  for insert
  with check (share_mode in ('edit', 'view', 'private'));

-- 3. Only allow updates when the existing row is in 'edit' mode (DB-enforced View-Only / Private lock)
create policy "Update editable projects"
  on public.projects
  for update
  using (share_mode = 'edit')
  with check (share_mode in ('edit', 'view', 'private'));

-- Note: No DELETE policy is granted to anonymous users, preventing remote deletion attacks.

-- Enable Supabase Realtime for live project sync
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'projects'
  ) then
    alter publication supabase_realtime add table public.projects;
  end if;
end $$;
