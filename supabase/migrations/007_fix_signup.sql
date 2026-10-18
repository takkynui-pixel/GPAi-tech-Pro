-- แก้การสมัครร้าน: ตรวจว่ามีผู้ใช้จริง และไม่สร้างร้านซ้ำ
create or replace function public.create_shop(p_shop_name text, p_slug text) returns uuid language plpgsql security definer set search_path=public as $$
declare t uuid; begin
  if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid()) then raise exception 'กรุณาเข้าสู่ระบบใหม่แล้วลองอีกครั้ง'; end if;
  select tenant_id into t from tenant_users where user_id=auth.uid() limit 1;
  if t is not null then return t; end if;
  insert into tenants(shop_name,slug) values (p_shop_name,p_slug) returning id into t;
  insert into tenant_users(tenant_id,user_id,role,name) values (t,auth.uid(),'owner',p_shop_name);
  return t; end $$;

-- (ทางเลือก) ล้างร้านกำพร้าที่เกิดจากความพยายามสมัครที่ล้มเหลว: ตรวจดูก่อนด้วย select
-- select * from tenants where id not in (select tenant_id from tenant_users where user_id is not null);
-- delete from tenants where id not in (select tenant_id from tenant_users where user_id is not null);
