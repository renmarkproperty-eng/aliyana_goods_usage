
begin;
create table if not exists detail_pemakaian_menu (
  id                          bigint generated always as identity primary key,
  detail_pengambilan_barang_id bigint not null
                                references detail_pengambilan_barang (id)
                                on delete cascade,
  menu                        text not null,
  jumlah                      integer not null check (jumlah > 0),
  created_at                  timestamptz not null default now()
);

create index if not exists idx_detail_pemakaian_menu_detail
  on detail_pemakaian_menu (detail_pengambilan_barang_id);

insert into detail_pemakaian_menu (detail_pengambilan_barang_id, menu, jumlah)
select id, trim(menu), jumlah_terpakai
from detail_pengambilan_barang
where menu is not null
  and trim(menu) <> ''
  and jumlah_terpakai > 0;

alter table detail_pengambilan_barang
  drop column if exists menu;

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

commit;
