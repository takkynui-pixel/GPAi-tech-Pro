-- ทำให้ทีมช่างใช้งานได้แม้ยังไม่ได้รัน 004 (รันซ้ำได้)
alter table tenant_users alter column user_id drop not null;
alter table tenant_users add column if not exists commission_rate numeric(5,2) default 0;
alter table tenant_users add column if not exists link_code text default substr(md5(random()::text),1,6);
update tenant_users set link_code=substr(md5(random()::text||id::text),1,6) where link_code is null;
create or replace function public.add_team_member(p_name text, p_rate numeric) returns uuid language plpgsql security definer set search_path=public as $$
declare t uuid; n uuid; begin
  if not exists(select 1 from tenant_users where user_id=auth.uid() and role in ('owner','admin')) then raise exception 'เฉพาะเจ้าของร้านเท่านั้น'; end if;
  t:=public.current_tenant_id();
  insert into tenant_users(tenant_id,role,name,commission_rate) values (t,'technician',p_name,least(100,greatest(0,coalesce(p_rate,0)))) returning id into n; return n; end $$;
create or replace function public.set_team_rate(p_id uuid, p_rate numeric) returns void language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from tenant_users where user_id=auth.uid() and role in ('owner','admin')) then raise exception 'เฉพาะเจ้าของร้านเท่านั้น'; end if;
  update tenant_users set commission_rate=least(100,greatest(0,coalesce(p_rate,0))) where id=p_id and tenant_id=public.current_tenant_id(); end $$;
grant execute on function public.add_team_member(text,numeric), public.set_team_rate(uuid,numeric) to authenticated;
