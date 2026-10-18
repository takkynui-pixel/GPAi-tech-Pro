alter table jobs add column if not exists customer_approved_at timestamptz;
create or replace function public.get_public_job(p_token uuid) returns jsonb language sql security definer set search_path=public as $$
  select jsonb_build_object('status',j.status,'payment_status',j.payment_status,'approved',j.customer_approved_at is not null,'total_amount',j.total_amount,
    'warranty_expires_at',j.warranty_expires_at,'shop_name',t.shop_name,'logo_url',t.logo_url,'phone',t.phone,'promptpay_no',t.promptpay_no,
    'items',coalesce((select jsonb_agg(jsonb_build_object('item_name',i.item_name,'quantity',i.quantity,'unit_price',i.unit_price)) from job_items i where i.job_id=j.id),'[]'))
  from jobs j join tenants t on t.id=j.tenant_id where j.public_share_token=p_token $$;
create function public.approve_job(p_token uuid) returns void language sql security definer set search_path=public as $$
  update jobs set customer_approved_at=now() where public_share_token=p_token and customer_approved_at is null $$;
grant execute on function public.approve_job(uuid) to anon, authenticated;
create function public.get_public_shop(p_slug text) returns jsonb language sql security definer set search_path=public as $$
  select jsonb_build_object('shop_name',shop_name,'logo_url',logo_url,'phone',phone,'address',address,'categories',categories_enabled,
    'jobs_done',(select count(*) from jobs where tenant_id=t.id and status='completed'))
  from tenants t where slug=p_slug and status='active' $$;
grant execute on function public.get_public_shop(text) to anon, authenticated;
