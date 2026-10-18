-- ทีมช่าง (ไม่ต้องล็อกอินก็ได้), ค่าคอม, ต้นทุนเพิ่ม, ผูก LINE ช่าง
alter table tenant_users alter column user_id drop not null;
alter table tenant_users add column if not exists commission_rate numeric(5,2) default 0;
alter table tenant_users add column if not exists link_code text default substr(md5(random()::text),1,6);
alter table jobs add column if not exists extra_cost numeric(10,2) default 0;
alter table jobs add column if not exists assigned_technician_id uuid references tenant_users;
create function public.is_owner() returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from tenant_users where user_id=auth.uid() and role='owner') $$;
create policy owner_insert on tenant_users for insert with check (tenant_id=public.current_tenant_id() and public.is_owner());
create policy owner_update on tenant_users for update using (tenant_id=public.current_tenant_id() and public.is_owner());
create policy owner_delete on tenant_users for delete using (tenant_id=public.current_tenant_id() and public.is_owner() and role<>'owner');
