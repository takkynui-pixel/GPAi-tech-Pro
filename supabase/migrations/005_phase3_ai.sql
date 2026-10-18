create extension if not exists vector with schema extensions;
create table ai_job_diagnostics(id uuid primary key default gen_random_uuid(), tenant_id uuid not null default public.current_tenant_id() references tenants on delete cascade,
  job_id uuid references jobs on delete set null, category text, symptom text, ai_result jsonb, created_at timestamptz default now());
create table shop_geo_embeddings(id uuid primary key default gen_random_uuid(), tenant_id uuid not null unique default public.current_tenant_id() references tenants on delete cascade,
  content text, embedding extensions.vector(768), updated_at timestamptz default now());
alter table ai_job_diagnostics enable row level security; alter table shop_geo_embeddings enable row level security;
create policy iso on ai_job_diagnostics for all using (tenant_id=public.current_tenant_id()) with check (tenant_id=public.current_tenant_id());
create policy iso on shop_geo_embeddings for all using (tenant_id=public.current_tenant_id()) with check (tenant_id=public.current_tenant_id());
-- ค้นหาร้านด้วยความหมาย (เปิดสาธารณะ ส่งกลับเฉพาะข้อมูลที่แสดงบนหน้าร้านอยู่แล้ว)
create function public.match_shops(q extensions.vector(768), n int default 5)
returns table(slug text, shop_name text, address text, phone text, similarity float) language sql security definer set search_path=public,extensions as $$
  select t.slug,t.shop_name,t.address,t.phone,1-(e.embedding <=> q) from shop_geo_embeddings e join tenants t on t.id=e.tenant_id
  where t.status='active' order by e.embedding <=> q limit least(n,10) $$;
grant execute on function public.match_shops(extensions.vector,int) to anon, authenticated;
