-- LINE แบบผสม + ทีมช่าง (แก้ชื่อ/ลบ) + ปิดช่องโหว่แก้แพ็กเกจเอง (รันซ้ำได้)
alter table tenants add column if not exists line_code text, add column if not exists line_connected boolean default false;
update tenants set line_code=substr(md5(random()::text||id::text),1,6) where line_code is null;
create unique index if not exists tenants_line_code_key on tenants(line_code);
alter table tenants alter column line_code set default substr(md5(random()::text||clock_timestamp()::text),1,6);
create table if not exists tenant_line_credentials(tenant_id uuid primary key references tenants on delete cascade, channel_secret_enc text not null, access_token_enc text not null, updated_at timestamptz default now());
alter table tenant_line_credentials enable row level security; -- ไม่มี policy: อ่าน/เขียนผ่าน service role บนเซิร์ฟเวอร์เท่านั้น
revoke all on tenant_line_credentials from anon, authenticated;
-- เจ้าของร้านห้ามแก้ plan/สถานะ/รหัส LINE เองผ่าน client (เฉพาะ super admin หรือ service role)
create or replace function public.guard_tenant_update() returns trigger language plpgsql security definer set search_path=public as $$
begin if auth.uid() is not null and not public.is_platform_admin() and (new.plan_type is distinct from old.plan_type or new.status is distinct from old.status
  or new.line_connected is distinct from old.line_connected or new.line_code is distinct from old.line_code) then raise exception 'ไม่มีสิทธิ์แก้ไขข้อมูลนี้'; end if; return new; end $$;
drop trigger if exists trg_guard_tenant on tenants; create trigger trg_guard_tenant before update on tenants for each row execute function public.guard_tenant_update();
create or replace function public.update_team_member(p_id uuid, p_name text, p_rate numeric) returns void language plpgsql security definer set search_path=public as $$
begin if not exists(select 1 from tenant_users where user_id=auth.uid() and role in ('owner','admin')) then raise exception 'เฉพาะเจ้าของร้านเท่านั้น'; end if;
  if coalesce(trim(p_name),'')='' then raise exception 'กรอกชื่อช่าง'; end if;
  update tenant_users set name=trim(p_name), commission_rate=least(100,greatest(0,coalesce(p_rate,0))) where id=p_id and tenant_id=public.current_tenant_id(); end $$;
create or replace function public.delete_team_member(p_id uuid) returns void language plpgsql security definer set search_path=public as $$
begin if not exists(select 1 from tenant_users where user_id=auth.uid() and role in ('owner','admin')) then raise exception 'เฉพาะเจ้าของร้านเท่านั้น'; end if;
  if exists(select 1 from tenant_users where id=p_id and role='owner') then raise exception 'ลบเจ้าของร้านไม่ได้'; end if;
  update jobs set assigned_technician_id=null where assigned_technician_id=p_id and tenant_id=public.current_tenant_id();
  update job_schedules set assigned_technician_id=null where assigned_technician_id=p_id and tenant_id=public.current_tenant_id();
  delete from tenant_users where id=p_id and tenant_id=public.current_tenant_id(); end $$;
grant execute on function public.update_team_member(uuid,text,numeric), public.delete_team_member(uuid) to authenticated;
