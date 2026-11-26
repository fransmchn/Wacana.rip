create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default 'Anonim' check (char_length(display_name) between 1 and 30),
  created_at timestamptz not null default now()
);

create table if not exists public.makam (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null,
  judul text not null check (char_length(judul) between 1 and 120),
  kategori text not null check (kategori in ('skripsi','koding','desain','bisnis','resolusi','hubungan','pribadi','pekerjaan','keluarga','kesehatan','perjalanan','lainnya')),
  tampil_anonim boolean not null default false,
  tanggal_mulai date not null,
  tanggal_menyerah date not null check (tanggal_menyerah >= tanggal_mulai and tanggal_menyerah <= current_date),
  penyebab text not null check (char_length(penyebab) between 1 and 160),
  epitaph text not null check (char_length(epitaph) between 1 and 140),
  kronologi text check (char_length(kronologi) <= 1000),
  kerugian_teks text check (char_length(kerugian_teks) <= 280),
  kerugian_rupiah bigint check (kerugian_rupiah >= 0),
  kerugian_jam numeric check (kerugian_jam >= 0),
  bunga_count integer not null default 0 check (bunga_count >= 0),
  lilin_count integer not null default 0 check (lilin_count >= 0),
  tema text not null default 'batu-lapuk',
  is_vip boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.bunga (
  id uuid primary key default gen_random_uuid(),
  makam_id uuid not null references public.makam on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  hari date not null default ((now() at time zone 'Asia/Jakarta')::date),
  created_at timestamptz not null default now(),
  unique (makam_id, user_id, hari)
);

create table if not exists public.lilin (
  makam_id uuid not null references public.makam on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (makam_id, user_id)
);

create table if not exists public.komentar (
  id uuid primary key default gen_random_uuid(),
  makam_id uuid not null references public.makam on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  nama_tampil text not null check (char_length(nama_tampil) between 1 and 30),
  isi text not null check (char_length(isi) between 1 and 280),
  created_at timestamptz not null default now()
);

create table if not exists public.laporan (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('makam','komentar')),
  target_id uuid not null,
  user_id uuid not null references auth.users on delete cascade,
  alasan text check (char_length(alasan) <= 200),
  created_at timestamptz not null default now()
);

create or replace function public.tabur_bunga(target_makam_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare current_user_id uuid := auth.uid(); today_wib date := (now() at time zone 'Asia/Jakarta')::date; new_count integer;
begin
  if current_user_id is null then return jsonb_build_object('ok', false, 'code', 'LOGIN_REQUIRED'); end if;
  insert into public.bunga (makam_id, user_id, hari) values (target_makam_id, current_user_id, today_wib)
  on conflict (makam_id, user_id, hari) do nothing;
  if not found then return jsonb_build_object('ok', false, 'code', 'ALREADY_TODAY'); end if;
  update public.makam set bunga_count = bunga_count + 1 where id = target_makam_id returning bunga_count into new_count;
  return jsonb_build_object('ok', true, 'bunga_count', new_count);
end;
$$;

create or replace function public.toggle_lilin(target_makam_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare current_user_id uuid := auth.uid(); enabled boolean; new_count integer;
begin
  if current_user_id is null then return jsonb_build_object('ok', false, 'code', 'LOGIN_REQUIRED'); end if;
  delete from public.lilin where makam_id = target_makam_id and user_id = current_user_id returning true into enabled;
  if enabled is null then insert into public.lilin (makam_id, user_id) values (target_makam_id, current_user_id); enabled := true; else enabled := false; end if;
  select count(*)::integer into new_count from public.lilin where makam_id = target_makam_id;
  update public.makam set lilin_count = new_count where id = target_makam_id;
  return jsonb_build_object('ok', true, 'enabled', enabled, 'lilin_count', new_count);
end;
$$;

alter table public.makam drop constraint if exists makam_kategori_check;
alter table public.makam add constraint makam_kategori_check check (kategori in ('skripsi','koding','desain','bisnis','resolusi','hubungan','pribadi','pekerjaan','keluarga','kesehatan','perjalanan','lainnya'));

create or replace view public.statistik as
select count(*)::integer as total_makam, coalesce(sum(bunga_count), 0)::bigint as total_bunga, coalesce(sum(kerugian_rupiah), 0)::bigint as total_rupiah, coalesce(sum(kerugian_jam), 0)::numeric as total_jam from public.makam;

revoke all on function public.tabur_bunga(uuid) from public;
grant execute on function public.tabur_bunga(uuid) to authenticated;
revoke all on function public.toggle_lilin(uuid) from public;
grant execute on function public.toggle_lilin(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.makam enable row level security;
alter table public.bunga enable row level security;
alter table public.lilin enable row level security;
alter table public.komentar enable row level security;
alter table public.laporan enable row level security;

create policy "profiles public read" on public.profiles for select using (true);
create policy "profiles own update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "makam public read" on public.makam for select using (true);
create policy "makam own insert" on public.makam for insert with check (auth.uid() = user_id);
create policy "makam own update" on public.makam for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "makam own delete" on public.makam for delete using (auth.uid() = user_id);
create policy "bunga own read" on public.bunga for select using (auth.uid() = user_id);
create policy "lilin own read" on public.lilin for select using (auth.uid() = user_id);
create policy "komentar public read" on public.komentar for select using (true);
create policy "komentar own insert" on public.komentar for insert with check (auth.uid() = user_id);
create policy "komentar own delete" on public.komentar for delete using (auth.uid() = user_id);
create policy "laporan own insert" on public.laporan for insert with check (auth.uid() = user_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id, display_name) values (new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), 'Anonim')) on conflict (id) do nothing; return new; end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
