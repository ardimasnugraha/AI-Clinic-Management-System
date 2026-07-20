-- Migration: 20260717000000_init_schema.sql
-- Description: Inisialisasi skema awal sistem manajemen Klinik AI sesuai Blueprint

-- 1. AKTIFKAN EKSTENSI
create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists pg_trgm;

-- 2. TIPE ENUM UTAMA
create type clinic_status as enum ('active', 'inactive', 'suspended');

create type clinic_role as enum (
  'platform_admin',
  'clinic_owner',
  'clinic_admin',
  'doctor',
  'nurse',
  'pharmacist',
  'lab_staff',
  'cashier',
  'receptionist',
  'auditor',
  'patient'
);

create type membership_status as enum ('invited', 'active', 'inactive');
create type patient_status as enum ('active', 'inactive', 'suspended');
create type encounter_status as enum ('scheduled', 'checked_in', 'in_progress', 'awaiting_signoff', 'completed', 'cancelled');
create type note_status as enum ('draft', 'signed', 'addended');

-- 3. TABEL UTAMA

-- Tabel Klinik (Tenant)
create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  code citext unique not null,
  name text not null,
  legal_name text,
  status clinic_status not null default 'active',
  timezone text not null default 'Asia/Jakarta',
  default_currency char(3) not null default 'IDR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tabel Memberships (User-Clinic Mapping)
create table public.clinic_memberships (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid not null, -- Mereferensikan auth.users(id) Supabase
  role clinic_role not null,
  status membership_status not null default 'active',
  permissions jsonb not null default '{}',
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  unique (clinic_id, user_id, role)
);

-- Tabel Pasien
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  medical_record_number text not null,
  full_name text not null,
  date_of_birth date not null,
  sex_at_birth text not null,
  phone text,
  nik text,
  religion text,
  status patient_status not null default 'active',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, medical_record_number)
);

-- Tabel Appointments
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_name text not null,
  poli text not null,
  scheduled_time timestamptz not null,
  duration text not null,
  status text not null default 'Menunggu',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tabel Encounters
create table public.encounters (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  practitioner_id uuid,
  status encounter_status not null default 'scheduled',
  started_at timestamptz,
  ended_at timestamptz,
  chief_complaint text,
  signed_at timestamptz,
  signed_by uuid,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tabel Catatan SOAP (Clinical Notes)
create table public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  encounter_id uuid not null references public.encounters(id) on delete cascade,
  note_type text not null default 'SOAP',
  subjective text,
  objective text,
  assessment text,
  plan text,
  source text not null default 'human',
  ai_output_id uuid,
  status note_status not null default 'draft',
  author_id uuid,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tabel Audit Logs
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references public.clinics(id) on delete set null,
  actor_user_id uuid,
  actor_role text,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  patient_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- 4. PEMBUATAN INDEX
create index patients_trgm_idx on public.patients using gin (full_name gin_trgm_ops);
create index patients_clinic_dob_idx on public.patients (clinic_id, date_of_birth);
create index appointments_clinic_time_idx on public.appointments (clinic_id, scheduled_time);
create index encounters_patient_idx on public.encounters (clinic_id, patient_id);
create index clinical_notes_encounter_idx on public.clinical_notes (clinic_id, encounter_id);
create index audit_logs_clinic_time_idx on public.audit_logs (clinic_id, created_at desc);

-- 5. FUNCTION & TRIGGER UPDATE_AT
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_clinics_modtime before update on public.clinics for each row execute function update_updated_at_column();
create trigger update_patients_modtime before update on public.patients for each row execute function update_updated_at_column();
create trigger update_appointments_modtime before update on public.appointments for each row execute function update_updated_at_column();
create trigger update_encounters_modtime before update on public.encounters for each row execute function update_updated_at_column();
create trigger update_clinical_notes_modtime before update on public.clinical_notes for each row execute function update_updated_at_column();

-- 6. SECURITY & ROW LEVEL SECURITY (RLS)

-- Helper check role
create or replace function public.has_clinic_role(
  p_clinic_id uuid,
  p_roles public.clinic_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clinic_memberships m
    where m.clinic_id = p_clinic_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = any(p_roles)
      and (m.valid_until is null or m.valid_until > now())
  );
$$;

-- Aktifkan RLS
alter table public.clinics enable row level security;
alter table public.clinic_memberships enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.encounters enable row level security;
alter table public.clinical_notes enable row level security;
alter table public.audit_logs enable row level security;

-- Policies dasar untuk staff klinik (read/write jika berwenang)
create policy staff_select_clinics on public.clinics for select to authenticated
  using (exists (select 1 from public.clinic_memberships m where m.clinic_id = id and m.user_id = auth.uid() and m.status = 'active'));

create policy staff_select_patients on public.patients for select to authenticated
  using (public.has_clinic_role(clinic_id, array['clinic_owner', 'clinic_admin', 'doctor', 'nurse', 'pharmacist', 'lab_staff', 'cashier', 'receptionist', 'auditor']::public.clinic_role[]));

create policy staff_insert_patients on public.patients for insert to authenticated
  with check (public.has_clinic_role(clinic_id, array['clinic_owner', 'clinic_admin', 'receptionist', 'nurse']::public.clinic_role[]));

create policy staff_update_patients on public.patients for update to authenticated
  using (public.has_clinic_role(clinic_id, array['clinic_owner', 'clinic_admin', 'receptionist', 'nurse']::public.clinic_role[]))
  with check (public.has_clinic_role(clinic_id, array['clinic_owner', 'clinic_admin', 'receptionist', 'nurse']::public.clinic_role[]));

-- Policies dasar untuk appointments
create policy staff_all_appointments on public.appointments for all to authenticated
  using (public.has_clinic_role(clinic_id, array['clinic_owner', 'clinic_admin', 'doctor', 'nurse', 'receptionist']::public.clinic_role[]));

-- 7. SEED DATA / DATA SIMULASI UTAMA (Opsional untuk pengujian)
-- Kita buat satu klinik default jika Supabase kosong
insert into public.clinics (id, code, name, status)
values ('11111111-1111-1111-1111-111111111111', 'SEN-SMG', 'Klinik Sehat Sentosa - Cabang Semarang', 'active')
on conflict (id) do nothing;

-- Masukkan pasien mock awal
insert into public.patients (id, clinic_id, medical_record_number, full_name, date_of_birth, sex_at_birth, phone, nik, religion, status)
values 
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'RM0001236', 'Budi Santoso', '1985-02-15', 'Laki-laki', '0812-5566-7788', '3374121502850003', 'Islam', 'active'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'RM0001235', 'Siti Nurhaliza', '1998-03-17', 'Perempuan', '0812-1122-3344', '3374125703980002', 'Islam', 'active')
on conflict (id) do nothing;

-- Masukkan appointment mock awal
insert into public.appointments (id, clinic_id, patient_id, doctor_name, poli, scheduled_time, duration, status)
values
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'dr. Maya Lestari', 'Poli Umum', now() + interval '1 hour', '08:00 - 08:30', 'Menunggu'),
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'dr. Rudi Setiawan', 'Poli Anak', now() + interval '2 hours', '09:00 - 09:30', 'Menunggu')
on conflict (id) do nothing;
