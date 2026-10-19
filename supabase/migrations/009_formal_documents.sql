-- เอกสารทางการ: ข้อมูลร้าน/บัญชี/VAT/ส่วนลด/เลขที่เอกสารต่อร้าน (รันซ้ำได้)
alter table tenants add column if not exists tax_id text, add column if not exists bank_name text, add column if not exists bank_account_no text,
  add column if not exists bank_account_name text, add column if not exists vat_enabled boolean default false, add column if not exists doc_counter int default 0;
alter table jobs add column if not exists doc_seq int, add column if not exists discount numeric(10,2) default 0, add column if not exists vat_amount numeric(10,2) default 0;
with n as (select id, row_number() over (partition by tenant_id order by created_at) r from jobs where doc_seq is null) update jobs j set doc_seq=n.r from n where j.id=n.id;
update tenants t set doc_counter=coalesce((select max(doc_seq) from jobs where tenant_id=t.id),0);
create or replace function public.set_doc_seq() returns trigger language plpgsql security definer set search_path=public as $$
begin update tenants set doc_counter=doc_counter+1 where id=new.tenant_id returning doc_counter into new.doc_seq; return new; end $$;
drop trigger if exists trg_doc_seq on jobs;
create trigger trg_doc_seq before insert on jobs for each row execute function public.set_doc_seq();
create or replace function public.get_public_job(p_token uuid) returns jsonb language sql security definer set search_path=public as $$
  select jsonb_build_object('status',j.status,'payment_status',j.payment_status,'approved',j.customer_approved_at is not null,'total_amount',j.total_amount,
    'discount',j.discount,'vat_amount',j.vat_amount,'doc_seq',j.doc_seq,'created_at',j.created_at,'category',j.category,'info',j.device_or_site_info,'warranty_expires_at',j.warranty_expires_at,
    'customer',jsonb_build_object('name',c.name,'phone',c.phone,'address',c.address),
    'shop_name',t.shop_name,'logo_url',t.logo_url,'phone',t.phone,'address',t.address,'tax_id',t.tax_id,'promptpay_no',t.promptpay_no,
    'bank_name',t.bank_name,'bank_account_no',t.bank_account_no,'bank_account_name',t.bank_account_name,
    'items',coalesce((select jsonb_agg(jsonb_build_object('item_name',i.item_name,'quantity',i.quantity,'unit_price',i.unit_price)) from job_items i where i.job_id=j.id),'[]'))
  from jobs j join tenants t on t.id=j.tenant_id left join customers c on c.id=j.customer_id where j.public_share_token=p_token $$;
