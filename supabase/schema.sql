create table master_departemen (
  id bigserial primary key,
  nama text not null unique check (btrim(nama) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table master_satuan (
  id bigserial primary key,
  nama text not null unique check (btrim(nama) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table users (
  id bigserial primary key,
  username text not null unique check (btrim(username) <> ''),
  password text not null check (btrim(password) <> ''),
  role text not null default 'pic' check (role in ('pic', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table users_detail (
  id bigserial primary key,
  user_id bigint not null unique references users(id) on delete cascade,
  nama text not null check (btrim(nama) <> ''),
  departemen_id bigint not null references master_departemen(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table pengambilan_barang (
  id bigserial primary key,
  tanggal date not null,
  user_id bigint not null references users(id),
  shift text not null check (btrim(shift) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table detail_pengambilan_barang (
  id bigserial primary key,
  pengambilan_barang_id bigint not null references pengambilan_barang(id) on delete cascade,

  nama_barang text not null check (btrim(nama_barang) <> ''),
  satuan_id bigint not null references master_satuan(id),

  jumlah_diambil numeric(12, 2) not null check (jumlah_diambil >= 0),
  digunakan_untuk text not null check (btrim(digunakan_untuk) <> ''),
  menu text not null check (btrim(menu) <> ''),

  jumlah_terpakai numeric(12, 2) not null check (jumlah_terpakai >= 0),
  sisa numeric(12, 2) generated always as (jumlah_diambil - jumlah_terpakai) stored,

  keterangan text not null check (btrim(keterangan) <> ''),
  created_at timestamptz not null default now()
);

insert into master_departemen (nama)
values ('admin')
on conflict (nama) do nothing;

insert into users (username, password, role)
values (
  'marcel',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'admin'
)
on conflict (username) do update
set
  password = excluded.password,
  role = excluded.role,
  updated_at = now();

insert into users_detail (user_id, nama, departemen_id)
select
  users.id,
  'marcel vorger',
  master_departemen.id
from users
join master_departemen on master_departemen.nama = 'admin'
where users.username = 'marcel'
on conflict (user_id) do update
set
  nama = excluded.nama,
  departemen_id = excluded.departemen_id,
  updated_at = now();
