-- AshaLens clinic store. Synthetic and confirmed records only.
-- The FastAPI dial pad uses the service role and still returns confirmed rows only.
-- auth.uid() is the Supabase user id. Row-level security applies to the anon and authenticated roles.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.phcs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  district text not null,
  state text not null default 'Tamil Nadu',
  created_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('asha', 'doctor', 'admin')),
  phc_id uuid not null references public.phcs (id),
  full_name text not null,
  phone text,
  pin_hash text,
  created_at timestamptz not null default now()
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  phc_id uuid not null references public.phcs (id),
  asha_id uuid not null references public.users (id),
  name text not null,
  name_ta text,
  age integer not null check (age >= 0 and age < 130),
  sex text not null check (sex in ('F', 'M')),
  village text not null,
  phone text,
  pregnant boolean not null default false,
  gestational_week integer,
  preferred_lang text not null default 'ta' check (preferred_lang in ('ta', 'en')),
  short_code text not null unique,
  dialpad_pin_hash text not null,
  abha_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  doc_type text not null check (doc_type in ('prescription', 'lab_slip', 'mcp_card', 'other')),
  quality_score text,
  ocr_raw_text text,
  storage_path text,
  verified_by uuid references public.users (id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  document_id uuid references public.documents (id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.prescription_items (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescriptions (id) on delete cascade,
  generic_name text not null,
  brand_name text,
  dose text not null,
  frequency text not null,
  duration text,
  confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.vitals_and_mcp (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  visit_date date not null,
  visit_type text not null default 'general',
  bp_systolic integer,
  bp_diastolic integer,
  haemoglobin numeric,
  weight_kg numeric,
  danger_signs text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.safety_alerts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  alert_type text not null,
  severity text not null check (severity in ('high', 'medium', 'info')),
  message text not null,
  disclaimer text not null,
  acknowledged boolean not null default false,
  created_at timestamptz not null default now(),
  constraint safety_alerts_disclaimer_present check (length(trim(disclaimer)) > 0)
);

create table public.sync_queue (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  actor_id uuid not null references public.users (id),
  action text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  synced_at timestamptz
);

create table public.dialpad_access_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  menu_key text not null,
  lang text not null check (lang in ('ta', 'en')),
  source text not null check (source in ('ivr', 'pwa')),
  created_at timestamptz not null default now()
);

create index patients_asha_idx on public.patients (asha_id);
create index patients_phc_idx on public.patients (phc_id);
create index patients_phone_idx on public.patients (phone);
create index prescription_items_confirmed_idx on public.prescription_items (prescription_id, confirmed);
create index sync_queue_unsynced_idx on public.sync_queue (synced_at) where synced_at is null;
create index dialpad_logs_patient_idx on public.dialpad_access_logs (patient_id, created_at desc);

drop trigger if exists patients_updated_at on public.patients;
create trigger patients_updated_at
before update on public.patients
for each row execute procedure public.set_updated_at();

drop trigger if exists prescriptions_updated_at on public.prescriptions;
create trigger prescriptions_updated_at
before update on public.prescriptions
for each row execute procedure public.set_updated_at();

alter table public.phcs enable row level security;
alter table public.users enable row level security;
alter table public.patients enable row level security;
alter table public.documents enable row level security;
alter table public.prescriptions enable row level security;
alter table public.prescription_items enable row level security;
alter table public.vitals_and_mcp enable row level security;
alter table public.safety_alerts enable row level security;
alter table public.sync_queue enable row level security;
alter table public.dialpad_access_logs enable row level security;

create or replace function public.same_phc(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users me
    join public.users them on them.phc_id = me.phc_id
    where me.id = auth.uid()
      and them.id = target
  );
$$;

create or replace function public.can_read_patient(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.patients p
    join public.users me on me.id = auth.uid()
    where p.id = target
      and (
        (me.role = 'asha' and p.asha_id = me.id)
        or (me.role in ('doctor', 'admin') and p.phc_id = me.phc_id)
      )
  );
$$;

create policy phcs_select on public.phcs
for select to authenticated
using (
  exists (
    select 1 from public.users me
    where me.id = auth.uid() and me.phc_id = phcs.id
  )
);

create policy users_select on public.users
for select to authenticated
using (id = auth.uid() or public.same_phc(id));

create policy patients_select on public.patients
for select to authenticated
using (public.can_read_patient(id));

create policy patients_update on public.patients
for update to authenticated
using (public.can_read_patient(id))
with check (public.can_read_patient(id));

create policy documents_select on public.documents
for select to authenticated
using (public.can_read_patient(patient_id));

create policy documents_write on public.documents
for insert to authenticated
with check (public.can_read_patient(patient_id));

create policy prescriptions_select on public.prescriptions
for select to authenticated
using (public.can_read_patient(patient_id));

create policy prescriptions_write on public.prescriptions
for insert to authenticated
with check (public.can_read_patient(patient_id));

create policy prescription_items_select on public.prescription_items
for select to authenticated
using (
  exists (
    select 1 from public.prescriptions rx
    where rx.id = prescription_id
      and public.can_read_patient(rx.patient_id)
  )
);

create policy prescription_items_write on public.prescription_items
for insert to authenticated
with check (
  exists (
    select 1 from public.prescriptions rx
    where rx.id = prescription_id
      and public.can_read_patient(rx.patient_id)
  )
);

create policy vitals_select on public.vitals_and_mcp
for select to authenticated
using (public.can_read_patient(patient_id));

create policy vitals_write on public.vitals_and_mcp
for insert to authenticated
with check (public.can_read_patient(patient_id));

create policy alerts_select on public.safety_alerts
for select to authenticated
using (public.can_read_patient(patient_id));

create policy alerts_write on public.safety_alerts
for insert to authenticated
with check (public.can_read_patient(patient_id) and length(trim(disclaimer)) > 0);

create policy sync_queue_select on public.sync_queue
for select to authenticated
using (actor_id = auth.uid() or public.can_read_patient(patient_id));

create policy sync_queue_insert on public.sync_queue
for insert to authenticated
with check (actor_id = auth.uid() and public.can_read_patient(patient_id));

create policy dialpad_logs_select on public.dialpad_access_logs
for select to authenticated
using (public.can_read_patient(patient_id));

grant usage on schema public to authenticated, anon;
grant select on public.phcs, public.users to authenticated;
grant select, insert, update on public.patients, public.documents, public.prescriptions,
  public.prescription_items, public.vitals_and_mcp, public.safety_alerts, public.sync_queue,
  public.dialpad_access_logs to authenticated;

revoke select (pin_hash) on public.users from authenticated, anon;
revoke select (dialpad_pin_hash) on public.patients from authenticated, anon;
