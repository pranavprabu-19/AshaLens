-- Household vault fields and stored allergies. The demo still reads the browser store.
-- ABHA on patients is stored only. This migration does not check it with ABDM.

alter table public.patients
  add column if not exists blood_group text,
  add column if not exists household_id text;

create table if not exists public.allergies (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  allergen text not null,
  mapped_salts text[] not null default '{}',
  category text not null check (category in ('drug', 'food', 'environment')),
  severity text not null check (severity in ('high', 'moderate')),
  reaction_tamil text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists allergies_patient_idx on public.allergies (patient_id);

alter table public.allergies enable row level security;

drop policy if exists allergies_select on public.allergies;
create policy allergies_select on public.allergies
for select to authenticated
using (public.can_read_patient(patient_id));

drop policy if exists allergies_insert on public.allergies;
create policy allergies_insert on public.allergies
for insert to authenticated
with check (public.can_read_patient(patient_id));

drop policy if exists allergies_update on public.allergies;
create policy allergies_update on public.allergies
for update to authenticated
using (public.can_read_patient(patient_id))
with check (public.can_read_patient(patient_id));
