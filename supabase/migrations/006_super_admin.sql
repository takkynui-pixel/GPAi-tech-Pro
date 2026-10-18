-- Super Admin ของแพลตฟอร์ม GPAi-tech (คนละบทบาทกับ owner ของแต่ละร้าน)
create table platform_admins(user_id uuid primary key references auth.users on delete cascade, created_at timestamptz default now());
alter table platform_admins enable row level security; -- ไม่มี policy = เข้าถึงผ่านฟังก์ชันด้านล่างเท่านั้น
create function public.is_platform_admin() returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from platform_admins where user_id=auth.uid()) $$;
create function public.admin_list_tenants() returns table(id uuid, shop_name text, slug text, plan_type text, status text, created_at timestamptz, jobs_count bigint, users_count bigint)
language plpgsql security definer set search_path=public as $$
begin if not public.is_platform_admin() then raise exception 'not allowed'; end if;
  return query select t.id,t.shop_name,t.slug,t.plan_type,t.status,t.created_at,
    (select count(*) from jobs j where j.tenant_id=t.id),(select count(*) from tenant_users u where u.tenant_id=t.id) from tenants t order by t.created_at desc; end $$;
create function public.admin_update_tenant(p_id uuid, p_status text, p_plan text) returns void language plpgsql security definer set search_path=public as $$
begin if not public.is_platform_admin() then raise exception 'not allowed'; end if;
  update tenants set status=p_status, plan_type=p_plan where id=p_id; end $$;
revoke all on function public.admin_list_tenants(), public.admin_update_tenant(uuid,text,text) from public, anon;
grant execute on function public.is_platform_admin(), public.admin_list_tenants(), public.admin_update_tenant(uuid,text,text) to authenticated;

-- ตั้ง Super Admin คนแรก: สมัครสมาชิกที่หน้า /login ก่อน แล้วแก้อีเมลด้านล่างก่อนรัน
insert into platform_admins(user_id) select id from auth.users where email='แก้เป็นอีเมลของคุณ@example.com' on conflict do nothing;
