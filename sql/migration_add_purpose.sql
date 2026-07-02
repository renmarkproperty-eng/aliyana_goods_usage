-- =====================================================================
-- Migration untuk database yang SUDAH ADA (ada data).
-- Menambah master_purpose, memindahkan nilai digunakan_untuk ke sana,
-- lalu mengganti kolom digunakan_untuk -> purpose_id.
-- Jalankan di Supabase SQL Editor. Aman dijalankan sekali.
-- =====================================================================

begin;


create table if not exists master_purpose (
  id    bigint generated always as identity primary key,
  name  text not null unique
);

insert into master_purpose (name)
select distinct trim(digunakan_untuk)
from detail_pengambilan_barang
where digunakan_untuk is not null
  and trim(digunakan_untuk) <> ''
on conflict (name) do nothing;

alter table detail_pengambilan_barang
  add column if not exists purpose_id bigint references master_purpose (id);

update detail_pengambilan_barang d
set purpose_id = p.id
from master_purpose p
where p.name = trim(d.digunakan_untuk)
  and d.purpose_id is null;

alter table detail_pengambilan_barang
  alter column purpose_id set not null;

create index if not exists idx_detail_pengambilan_barang_purpose
  on detail_pengambilan_barang (purpose_id);

alter table detail_pengambilan_barang
  drop column digunakan_untuk;

commit;
