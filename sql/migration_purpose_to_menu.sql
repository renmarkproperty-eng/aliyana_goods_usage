
begin;

alter table detail_pemakaian_menu
  add column if not exists purpose_id bigint references master_purpose (id);

update detail_pemakaian_menu m
set purpose_id = d.purpose_id
from detail_pengambilan_barang d
where d.id = m.detail_pengambilan_barang_id
  and m.purpose_id is null;

alter table detail_pemakaian_menu
  alter column purpose_id set not null;

create index if not exists idx_detail_pemakaian_menu_purpose
  on detail_pemakaian_menu (purpose_id);

drop index if exists idx_detail_pengambilan_barang_purpose;
alter table detail_pengambilan_barang
  drop column if exists purpose_id;

commit;
