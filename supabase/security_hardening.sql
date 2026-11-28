-- ============================================================================
-- GRAVEYARD — Production Security Hardening & VIP Feature Migration
-- Run this script in Supabase SQL Editor (idempotent & safe to re-run).
-- ============================================================================

-- 1. Ensure VIP & Time Capsule columns exist on public.makam
alter table public.makam
  add column if not exists tema text not null default 'batu-lapuk',
  add column if not exists is_vip boolean not null default false,
  add column if not exists capsule_message text,
  add column if not exists capsule_unlock_at date;

-- Enforce allowed theme values and Time Capsule length constraints
alter table public.makam drop constraint if exists makam_tema_check;
alter table public.makam add constraint makam_tema_check
  check (tema in ('batu-lapuk', 'beton-retak', 'obsidian-emas', 'marmer-lumut', 'y2k-chrome', 'crimson-velvet'));

alter table public.makam drop constraint if exists makam_capsule_message_check;
alter table public.makam add constraint makam_capsule_message_check
  check (capsule_message is null or char_length(capsule_message) <= 500);

-- 2. Enable Row Level Security across all public tables
alter table public.profiles enable row level security;
alter table public.makam enable row level security;
alter table public.bunga enable row level security;
alter table public.lilin enable row level security;
alter table public.komentar enable row level security;
alter table public.laporan enable row level security;

-- 3. Strict, Idempotent RLS Policies
drop policy if exists "profiles public read" on public.profiles;
drop policy if exists "profiles own update" on public.profiles;
create policy "profiles public read" on public.profiles
  for select using (true);
create policy "profiles own update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "makam public read" on public.makam;
drop policy if exists "makam own insert" on public.makam;
drop policy if exists "makam own update" on public.makam;
drop policy if exists "makam own delete" on public.makam;

-- Anyone can read public graves
create policy "makam public read" on public.makam
  for select using (true);

-- Authenticated users can insert their own graves, strictly non-VIP from client
create policy "makam own insert" on public.makam
  for insert
  with check (
    auth.uid() = user_id
    and coalesce(is_vip, false) = false
    and tema in ('batu-lapuk', 'beton-retak')
  );

-- Owners can update only their own graves (VIP elevation additionally blocked by trigger below)
create policy "makam own update" on public.makam
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Owners can delete only their own graves
create policy "makam own delete" on public.makam
  for delete using (auth.uid() = user_id);

drop policy if exists "bunga own read" on public.bunga;
create policy "bunga own read" on public.bunga
  for select using (auth.uid() = user_id);

drop policy if exists "lilin own read" on public.lilin;
create policy "lilin own read" on public.lilin
  for select using (auth.uid() = user_id);

drop policy if exists "komentar public read" on public.komentar;
drop policy if exists "komentar own insert" on public.komentar;
drop policy if exists "komentar own delete" on public.komentar;
create policy "komentar public read" on public.komentar
  for select using (true);
create policy "komentar own insert" on public.komentar
  for insert with check (auth.uid() = user_id);
create policy "komentar own delete" on public.komentar
  for delete using (auth.uid() = user_id);

drop policy if exists "laporan own insert" on public.laporan;
create policy "laporan own insert" on public.laporan
  for insert with check (auth.uid() = user_id);

-- 4. Server-Enforced Anti-VIP-Bypass Trigger
-- MUST be SECURITY INVOKER so `current_user` reflects the actual caller role:
--   - Direct client calls run as `authenticated` / `anon` (strictly restricted)
--   - Payment webhook runs as `service_role` (allowed)
--   - SECURITY DEFINER RPCs (`tabur_bunga`, `toggle_lilin`) run as `postgres` (allowed)
create or replace function public.guard_makam_vip_privilege()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  is_privileged boolean := current_user in ('postgres', 'supabase_admin', 'service_role');
  is_vip_theme boolean := NEW.tema in ('obsidian-emas', 'marmer-lumut', 'y2k-chrome', 'crimson-velvet');
begin
  if is_privileged then
    return NEW;
  end if;

  if TG_OP = 'INSERT' then
    if coalesce(NEW.is_vip, false) = true then
      raise exception 'Forbidden: is_vip cannot be set directly by client.' using errcode = '42501';
    end if;
    if is_vip_theme then
      raise exception 'Forbidden: VIP themes require verified payment.' using errcode = '42501';
    end if;
    NEW.is_vip := false;
    NEW.bunga_count := 0;
    NEW.lilin_count := 0;
    NEW.capsule_message := null;
    NEW.capsule_unlock_at := null;
    return NEW;
  end if;

  if TG_OP = 'UPDATE' then
    -- Block tampering with ownership or engagement counters directly
    NEW.user_id := OLD.user_id;
    NEW.bunga_count := OLD.bunga_count;
    NEW.lilin_count := OLD.lilin_count;

    -- Block client-side VIP elevation
    if coalesce(NEW.is_vip, false) = true and coalesce(OLD.is_vip, false) = false then
      raise exception 'Forbidden: VIP status can only be activated via verified payment webhook.' using errcode = '42501';
    end if;

    -- Block applying VIP theme or Time Capsule on non-VIP grave
    if coalesce(OLD.is_vip, false) = false and coalesce(OLD.bunga_count, 0) < 20 then
      if is_vip_theme then
        raise exception 'Forbidden: VIP themes require active VIP status.' using errcode = '42501';
      end if;
      if NEW.capsule_message is distinct from OLD.capsule_message or NEW.capsule_unlock_at is distinct from OLD.capsule_unlock_at then
        raise exception 'Forbidden: Time Capsule is exclusive to VIP monuments.' using errcode = '42501';
      end if;
    end if;

    return NEW;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_guard_makam_vip_privilege on public.makam;
create trigger trg_guard_makam_vip_privilege
  before insert or update on public.makam
  for each row
  execute function public.guard_makam_vip_privilege();

-- 5. Enable Supabase Realtime on public.makam for instant post-payment UI sync
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'makam'
  ) then
    alter publication supabase_realtime add table public.makam;
  end if;
end $$;
