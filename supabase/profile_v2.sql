-- CP4A profile v2. Additive only. Review and run manually.

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists username text,
  add column if not exists bio text,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username))
  where username is not null;

alter table public.profiles
  drop constraint if exists profiles_username_format_check;
alter table public.profiles
  add constraint profiles_username_format_check
  check (
    username is null
    or (
      username = lower(username)
      and username ~ '^[a-z0-9_]{3,20}$'
      and lower(username) not in ('admin', 'wacana', 'support', 'system', 'root', 'moderator', 'null', 'undefined')
    )
  );

alter table public.profiles
  drop constraint if exists profiles_bio_length_check;
alter table public.profiles
  add constraint profiles_bio_length_check
  check (bio is null or char_length(bio) <= 120);

-- NOT VALID preserves existing legacy rows while enforcing new inserts/updates.
-- schema.sql currently names this legacy rule inline; PostgreSQL stores it as profiles_display_name_check.
alter table public.profiles
  drop constraint if exists profiles_display_name_check;
alter table public.profiles
  drop constraint if exists profiles_display_name_length_v2_check;
alter table public.profiles
  add constraint profiles_display_name_length_v2_check
  check (char_length(display_name) between 2 and 32)
  not valid;

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_profiles_updated_at();

create or replace function public.protect_profile_identity()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.id := old.id;
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists profiles_protect_identity on public.profiles;
create trigger profiles_protect_identity
before update on public.profiles
for each row execute procedure public.protect_profile_identity();

-- makam.user_id, bunga.user_id, and lilin.user_id already exist in schema.sql.
create or replace function public.my_profile_stats()
returns table (
  wacana_dikubur bigint,
  bunga_ditabur bigint,
  lilin_dinyalakan bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    (select count(*) from public.makam where user_id = auth.uid()),
    (select count(*) from public.bunga where user_id = auth.uid()),
    (select count(*) from public.lilin where user_id = auth.uid());
$$;

revoke all on function public.my_profile_stats() from public;
grant execute on function public.my_profile_stats() to authenticated;
revoke execute on function public.my_profile_stats() from anon;

-- Hardening handle_new_user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_name text := left(btrim(coalesce(new.raw_user_meta_data->>'full_name', '')), 32);
begin
  if char_length(v_name) < 2 then v_name := 'Anonim'; end if;
  insert into public.profiles (id, display_name) values (new.id, v_name) on conflict (id) do nothing;
  return new;
end;
$$;

-- Storage bucket and policies. Existing avatars bucket is left untouched.
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'avatars') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']::text[]);
  end if;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars public read') then
    create policy "avatars public read" on storage.objects
      for select using (bucket_id = 'avatars');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars owner insert') then
    create policy "avatars owner insert" on storage.objects
      for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars owner update') then
    create policy "avatars owner update" on storage.objects
      for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
      with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars owner delete') then
    create policy "avatars owner delete" on storage.objects
      for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end;
$$;

-- No profile_preferences table: BuryModal has no anonymous option.

-- Rollback reference (manual only; inspect dependent data/policies first):
-- drop function if exists public.my_profile_stats();
-- drop trigger if exists profiles_protect_identity on public.profiles;
-- drop trigger if exists profiles_set_updated_at on public.profiles;
-- drop function if exists public.protect_profile_identity();
-- drop function if exists public.set_profiles_updated_at();
-- drop index if exists public.profiles_username_lower_unique;
-- alter table public.profiles drop constraint if exists profiles_username_format_check;
-- alter table public.profiles drop constraint if exists profiles_bio_length_check;
-- alter table public.profiles drop constraint if exists profiles_display_name_length_v2_check;
-- alter table public.profiles add constraint profiles_display_name_check check (char_length(display_name) between 1 and 30);
-- alter table public.profiles drop column if exists avatar_url;
-- alter table public.profiles drop column if exists username;
-- alter table public.profiles drop column if exists bio;
-- alter table public.profiles drop column if exists updated_at;
-- drop policy if exists "avatars public read" on storage.objects;
-- drop policy if exists "avatars owner insert" on storage.objects;
-- drop policy if exists "avatars owner update" on storage.objects;
-- drop policy if exists "avatars owner delete" on storage.objects;
-- delete from storage.buckets where id = 'avatars';
