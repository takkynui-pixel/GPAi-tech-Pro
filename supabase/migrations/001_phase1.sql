-- GPAi-tech Phase 1: multi-tenant + inventory + jobs (รันใน Supabase SQL Editor)
create table tenants(id uuid primary key default gen_random_uuid(), shop_name text not null, slug text unique not null, logo_url text, phone text, address text,
  promptpay_no text, categories_enabled text[] default array['electric','air','mobile','computer'], plan_type text default 'free', status text default 'active', created_at timestamptz default now());
create table tenant_users(id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants on delete cascade,
  user_id uuid not null references auth.users on delete cascade, role text not null check (role in ('owner','admin','technician')), name text, phone text, line_user_id text, unique(tenant_id,user_id));
create function public.current_tenant_id() returns uuid language sql stable security definer set search_path=public as
$$ select tenant_id from tenant_users where user_id=auth.uid() limit 1 $$;
create table customers(id uuid primary key default gen_random_uuid(), tenant_id uuid not null default public.current_tenant_id() references tenants on delete cascade,
  name text not null, phone text, line_id text, address text, created_at timestamptz default now());
create table products_inventory(id uuid primary key default gen_random_uuid(), tenant_id uuid not null default public.current_tenant_id() references tenants on delete cascade,
  category text not null check (category in ('electric','air','mobile','computer')), name text not null, sku text, cost_price numeric(10,2) default 0, selling_price numeric(10,2) default 0,
  stock_quantity int default 0, min_stock_alert int default 2, unit text default 'ชิ้น', created_at timestamptz default now());
create table jobs(id uuid primary key default gen_random_uuid(), tenant_id uuid not null default public.current_tenant_id() references tenants on delete cascade,
  created_by_user_id uuid default auth.uid(), customer_id uuid references customers, category text not null check (category in ('electric','air','mobile','computer')),
  device_or_site_info jsonb, total_amount numeric(10,2) default 0, total_cost numeric(10,2) default 0,
  status text default 'draft' check (status in ('draft','pending','in_progress','completed','cancelled')),
  payment_status text default 'unpaid' check (payment_status in ('unpaid','paid','refunded')), warranty_days int default 0, warranty_expires_at timestamptz,
  stock_deducted boolean default false, public_share_token uuid unique default gen_random_uuid(), created_at timestamptz default now());
create table job_items(id uuid primary key default gen_random_uuid(), tenant_id uuid not null default public.current_tenant_id() references tenants on delete cascade,
  job_id uuid not null references jobs on delete cascade, product_id uuid references products_inventory, item_name text not null, quantity int default 1, unit_price numeric(10,2) not null, unit_cost numeric(10,2) default 0);

-- RLS: แยกข้อมูลแต่ละร้านเด็ดขาด
alter table tenants enable row level security; alter table tenant_users enable row level security; alter table customers enable row level security;
alter table products_inventory enable row level security; alter table jobs enable row level security; alter table job_items enable row level security;
create policy own_tenant on tenants for all using (id=public.current_tenant_id()) with check (id=public.current_tenant_id());
create policy own_users on tenant_users for select using (tenant_id=public.current_tenant_id());
create policy iso on customers for all using (tenant_id=public.current_tenant_id()) with check (tenant_id=public.current_tenant_id());
create policy iso on products_inventory for all using (tenant_id=public.current_tenant_id()) with check (tenant_id=public.current_tenant_id());
create policy iso on jobs for all using (tenant_id=public.current_tenant_id()) with check (tenant_id=public.current_tenant_id());
create policy iso on job_items for all using (tenant_id=public.current_tenant_id()) with check (tenant_id=public.current_tenant_id());

-- สมัครร้านใหม่: สร้าง tenant + owner
create function public.create_shop(p_shop_name text, p_slug text) returns uuid language plpgsql security definer set search_path=public as $$
declare t uuid; begin
  insert into tenants(shop_name,slug) values (p_shop_name,p_slug) returning id into t;
  insert into tenant_users(tenant_id,user_id,role,name) values (t,auth.uid(),'owner',p_shop_name); return t; end $$;

-- ตัดสต๊อกเมื่อปิดงาน (completed) ครั้งเดียว + ตั้งวันหมดประกัน
create function public.on_job_complete() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status='completed' and not new.stock_deducted then
    update products_inventory p set stock_quantity=greatest(0,p.stock_quantity-ji.quantity)
      from job_items ji where ji.job_id=new.id and ji.product_id=p.id;
    new.stock_deducted:=true; new.warranty_expires_at:=now()+make_interval(days=>new.warranty_days);
  end if; return new; end $$;
create trigger trg_job_complete before update on jobs for each row execute function public.on_job_complete();

create view low_stock with (security_invoker=true) as select id,name,stock_quantity,unit from products_inventory where stock_quantity<=min_stock_alert;

-- หน้าลูกค้า (ไม่ต้อง login): เข้าถึงผ่าน token เท่านั้น
create function public.get_public_job(p_token uuid) returns jsonb language sql security definer set search_path=public as $$
  select jsonb_build_object('status',j.status,'total_amount',j.total_amount,'warranty_expires_at',j.warranty_expires_at,'shop_name',t.shop_name,'logo_url',t.logo_url,
    'items',coalesce((select jsonb_agg(jsonb_build_object('item_name',i.item_name,'quantity',i.quantity,'unit_price',i.unit_price)) from job_items i where i.job_id=j.id),'[]'))
  from jobs j join tenants t on t.id=j.tenant_id where j.public_share_token=p_token $$;
grant execute on function public.get_public_job(uuid) to anon, authenticated;
