-- Phase 2: ปฏิทินงาน + เตือนอัตโนมัติ
create table job_schedules(id uuid primary key default gen_random_uuid(), tenant_id uuid not null default public.current_tenant_id() references tenants on delete cascade,
  job_id uuid not null references jobs on delete cascade, assigned_technician_id uuid references tenant_users, scheduled_start timestamptz not null, scheduled_end timestamptz not null,
  address text, google_maps_url text, created_at timestamptz default now());
create table automated_reminders(id uuid primary key default gen_random_uuid(), tenant_id uuid not null default public.current_tenant_id() references tenants on delete cascade,
  customer_id uuid not null references customers on delete cascade, job_id uuid references jobs on delete cascade,
  reminder_type text not null check (reminder_type in ('air_cleaning_6m','warranty_expiring','pickup_device')),
  scheduled_date date not null, status text default 'pending' check (status in ('pending','sent','failed','cancelled')), created_at timestamptz default now());
alter table job_schedules enable row level security; alter table automated_reminders enable row level security;
create policy iso on job_schedules for all using (tenant_id=public.current_tenant_id()) with check (tenant_id=public.current_tenant_id());
create policy iso on automated_reminders for all using (tenant_id=public.current_tenant_id()) with check (tenant_id=public.current_tenant_id());
create policy own_users_all on tenant_users for select using (tenant_id=public.current_tenant_id());

-- แทนที่ trigger ปิดงานจาก Phase 1: ตัดสต๊อก + ตั้งประกัน + สร้างรายการเตือนอัตโนมัติ
create or replace function public.on_job_complete() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status='completed' and not new.stock_deducted then
    update products_inventory p set stock_quantity=greatest(0,p.stock_quantity-ji.quantity)
      from job_items ji where ji.job_id=new.id and ji.product_id=p.id;
    new.stock_deducted:=true; new.warranty_expires_at:=now()+make_interval(days=>new.warranty_days);
    if new.customer_id is not null then
      if new.category='air' then
        insert into automated_reminders(tenant_id,customer_id,job_id,reminder_type,scheduled_date) values (new.tenant_id,new.customer_id,new.id,'air_cleaning_6m',current_date+interval '6 months'); end if;
      if new.category in ('mobile','computer') then
        insert into automated_reminders(tenant_id,customer_id,job_id,reminder_type,scheduled_date) values (new.tenant_id,new.customer_id,new.id,'pickup_device',current_date+3); end if;
      if new.warranty_days>7 then
        insert into automated_reminders(tenant_id,customer_id,job_id,reminder_type,scheduled_date) values (new.tenant_id,new.customer_id,new.id,'warranty_expiring',(now()+make_interval(days=>new.warranty_days-7))::date); end if;
    end if;
  end if; return new; end $$;
