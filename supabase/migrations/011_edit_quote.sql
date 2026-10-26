-- แก้ไขใบเสนอราคาได้ถ้าลูกค้ายังไม่อนุมัติ (รันซ้ำได้)
alter table jobs add column if not exists revision int default 0;
create or replace function public.update_quote(p_job uuid, p_data jsonb, p_items jsonb) returns void language plpgsql security definer set search_path=public as $$
declare j jobs%rowtype; begin
  select * into j from jobs where id=p_job and tenant_id=public.current_tenant_id();
  if not found then raise exception 'ไม่พบใบงาน'; end if;
  if j.customer_approved_at is not null then raise exception 'ลูกค้าอนุมัติแล้ว แก้ไขใบเสนอราคาไม่ได้'; end if;
  if j.status in ('completed','cancelled') or j.payment_status='paid' then raise exception 'ใบงานนี้ปิดแล้ว แก้ไขไม่ได้'; end if;
  update jobs set device_or_site_info=p_data->'info', total_amount=(p_data->>'total')::numeric, total_cost=(p_data->>'cost')::numeric, extra_cost=(p_data->>'extra')::numeric,
    discount=(p_data->>'discount')::numeric, vat_amount=(p_data->>'vat')::numeric, warranty_days=(p_data->>'warranty')::int, revision=coalesce(revision,0)+1 where id=p_job;
  update customers set name=p_data->>'cust_name', phone=p_data->>'cust_phone', address=p_data->>'cust_address' where id=j.customer_id and tenant_id=j.tenant_id;
  delete from job_items where job_id=p_job;
  insert into job_items(tenant_id,job_id,product_id,item_name,quantity,unit_price,unit_cost)
    select j.tenant_id,p_job,nullif(x->>'product_id','')::uuid,x->>'item_name',(x->>'quantity')::int,(x->>'unit_price')::numeric,(x->>'unit_cost')::numeric from jsonb_array_elements(p_items) x;
end $$;
grant execute on function public.update_quote(uuid,jsonb,jsonb) to authenticated;
create or replace function public.get_public_job(p_token uuid) returns jsonb language sql security definer set search_path=public as $$
  select jsonb_build_object('status',j.status,'payment_status',j.payment_status,'approved',j.customer_approved_at is not null,'total_amount',j.total_amount,'revision',j.revision,
    'discount',j.discount,'vat_amount',j.vat_amount,'doc_seq',j.doc_seq,'created_at',j.created_at,'category',j.category,'info',j.device_or_site_info,'warranty_expires_at',j.warranty_expires_at,
    'customer',jsonb_build_object('name',c.name,'phone',c.phone,'address',c.address),
    'shop_name',t.shop_name,'logo_url',t.logo_url,'phone',t.phone,'address',t.address,'tax_id',t.tax_id,'promptpay_no',t.promptpay_no,
    'bank_name',t.bank_name,'bank_account_no',t.bank_account_no,'bank_account_name',t.bank_account_name,
    'items',coalesce((select jsonb_agg(jsonb_build_object('item_name',i.item_name,'quantity',i.quantity,'unit_price',i.unit_price)) from job_items i where i.job_id=j.id),'[]'))
  from jobs j join tenants t on t.id=j.tenant_id left join customers c on c.id=j.customer_id where j.public_share_token=p_token $$;
