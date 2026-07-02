-- =====================================================================
-- Skema database: aliyana_goods_usage (Supabase / PostgreSQL)
-- Menyertakan tabel baru master_purpose dan penggantian kolom
-- digunakan_untuk -> purpose_id (relasi ke master_purpose) pada
-- tabel detail_pengambilan_barang.
-- =====================================================================

-- --- Enum role user -------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('pic', 'admin');
  end if;
end$$;

-- --- Master: Departemen ---------------------------------------------
create table if not exists master_departemen (
  id          bigint generated always as identity primary key,
  nama        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

-- --- Master: Satuan -------------------------------------------------
create table if not exists master_satuan (
  id          bigint generated always as identity primary key,
  nama        text not null unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

-- --- Master: Purpose (BARU) -----------------------------------------
create table if not exists master_purpose (
  id    bigint generated always as identity primary key,
  name  text not null unique
);

-- --- Users ----------------------------------------------------------
create table if not exists users (
  id          bigint generated always as identity primary key,
  username    text not null unique,
  password    text not null,
  role        user_role not null default 'pic',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

-- --- Users detail ---------------------------------------------------
create table if not exists users_detail (
  id             bigint generated always as identity primary key,
  user_id        bigint not null unique
                   references users (id) on delete cascade,
  nama           text not null,
  departemen_id  bigint not null
                   references master_departemen (id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz
);

-- --- Pengambilan barang (header) ------------------------------------
create table if not exists pengambilan_barang (
  id          bigint generated always as identity primary key,
  tanggal     date not null,
  user_id     bigint not null references users (id),
  shift       text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

-- --- Detail pengambilan barang --------------------------------------
-- Catatan: kolom digunakan_untuk DIHILANGKAN, diganti purpose_id
-- yang berelasi ke master_purpose.
-- Catatan: kolom "menu" DIHILANGKAN dari tabel ini. Rincian menu
-- dipindah ke tabel anak detail_pemakaian_menu (lihat di bawah).
-- jumlah_terpakai berfungsi sebagai threshold (batas maksimum) total
-- jumlah pada rincian menu.
create table if not exists detail_pengambilan_barang (
  id                     bigint generated always as identity primary key,
  pengambilan_barang_id  bigint not null
                           references pengambilan_barang (id) on delete cascade,
  nama_barang            text not null,
  satuan_id              bigint not null references master_satuan (id),
  jumlah_diambil         integer not null default 0,
  jumlah_terpakai        integer not null default 0,
  sisa                   integer generated always as
                           (jumlah_diambil - jumlah_terpakai) stored,
  keterangan             text not null,
  created_at             timestamptz not null default now()
);

-- --- Rincian pemakaian per menu (anak dari detail_pengambilan_barang) --
-- Contoh: jumlah_terpakai = 3 dipecah menjadi
--   Nasi Goreng = 1, Nasi Kuning = 2  (total 3, tepat di batas).
-- Total jumlah di sini TIDAK BOLEH melebihi jumlah_terpakai induknya.
-- purpose_id berada di level ini (per rincian menu), bukan di
-- detail_pengambilan_barang.
create table if not exists detail_pemakaian_menu (
  id                          bigint generated always as identity primary key,
  detail_pengambilan_barang_id bigint not null
                                references detail_pengambilan_barang (id)
                                on delete cascade,
  menu                        text not null,
  jumlah                      integer not null check (jumlah > 0),
  purpose_id                  bigint not null references master_purpose (id),
  created_at                  timestamptz not null default now()
);

-- --- Trigger: enforce threshold jumlah_terpakai --------------------
create or replace function check_pemakaian_menu_threshold()
returns trigger as $$
declare
  batas integer;
  total integer;
begin
  select jumlah_terpakai into batas
  from detail_pengambilan_barang
  where id = new.detail_pengambilan_barang_id;

  select coalesce(sum(jumlah), 0) into total
  from detail_pemakaian_menu
  where detail_pengambilan_barang_id = new.detail_pengambilan_barang_id;

  -- Saat UPDATE, baris lama masih terhitung -> kurangi dulu.
  if tg_op = 'UPDATE' then
    total := total - old.jumlah;
  end if;

  if total + new.jumlah > batas then
    raise exception
      'Total pemakaian menu (%) melebihi jumlah terpakai / threshold (%)',
      total + new.jumlah, batas
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_pemakaian_menu_threshold on detail_pemakaian_menu;
create trigger trg_pemakaian_menu_threshold
  before insert or update on detail_pemakaian_menu
  for each row execute function check_pemakaian_menu_threshold();

-- --- Index bantu untuk foreign key ----------------------------------
create index if not exists idx_users_detail_user_id
  on users_detail (user_id);
create index if not exists idx_users_detail_departemen_id
  on users_detail (departemen_id);
create index if not exists idx_pengambilan_barang_user_id
  on pengambilan_barang (user_id);
create index if not exists idx_pengambilan_barang_tanggal
  on pengambilan_barang (tanggal);
create index if not exists idx_detail_pengambilan_barang_header
  on detail_pengambilan_barang (pengambilan_barang_id);
create index if not exists idx_detail_pengambilan_barang_satuan
  on detail_pengambilan_barang (satuan_id);
create index if not exists idx_detail_pemakaian_menu_detail
  on detail_pemakaian_menu (detail_pengambilan_barang_id);
create index if not exists idx_detail_pemakaian_menu_purpose
  on detail_pemakaian_menu (purpose_id);
