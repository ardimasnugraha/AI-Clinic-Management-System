-- Migration: 20260722000001_doctors_profiles.sql
-- Description: Tabel profil dokter & membership klinik yang terhubung ke auth.users Supabase

-- ============================================================
-- TABEL PROFIL DOKTER
-- ============================================================
create table if not exists public.doctor_profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid unique not null,  -- Referensi ke auth.users(id)
  clinic_id   uuid not null references public.clinics(id) on delete cascade,
  doctor_id   text,                  -- e.g. DOC001
  full_name   text not null,
  poli        text not null default 'Umum',
  sip         text,                  -- Nomor SIP dokter
  phone       text,
  color       text default '#0d9488',
  status      text not null default 'Aktif' check (status in ('Aktif', 'Cuti', 'Nonaktif')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Trigger update timestamp
create trigger update_doctor_profiles_modtime
  before update on public.doctor_profiles
  for each row execute function update_updated_at_column();

-- Index
create index if not exists doctor_profiles_clinic_idx on public.doctor_profiles (clinic_id);
create index if not exists doctor_profiles_user_idx   on public.doctor_profiles (user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.doctor_profiles enable row level security;

-- Staff klinik bisa lihat semua profil dokter di kliniknya
create policy "staff_select_doctor_profiles"
  on public.doctor_profiles for select
  to authenticated
  using (
    public.has_clinic_role(
      clinic_id,
      array['platform_admin','clinic_owner','clinic_admin','doctor','nurse',
            'pharmacist','lab_staff','cashier','receptionist','auditor']::public.clinic_role[]
    )
  );

-- Dokter hanya bisa update profil miliknya sendiri
create policy "doctor_update_own_profile"
  on public.doctor_profiles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Admin klinik bisa insert/delete
create policy "admin_manage_doctor_profiles"
  on public.doctor_profiles for all
  to authenticated
  using (
    public.has_clinic_role(
      clinic_id,
      array['platform_admin','clinic_owner','clinic_admin']::public.clinic_role[]
    )
  );

-- ============================================================
-- SEED DATA DOKTER DEFAULT (untuk pengujian)
-- Data akun auth dibuat via scripts/seed-doctors.js
-- ============================================================
-- Catatan: INSERT ke doctor_profiles memerlukan user_id yang valid dari auth.users.
-- Gunakan scripts/seed-doctors.js untuk membuat auth users terlebih dahulu,
-- kemudian script tersebut juga otomatis insert ke doctor_profiles.

-- ============================================================
-- VIEW HELPER: Dokter + Info Klinik (untuk query mudah)
-- ============================================================
create or replace view public.v_doctors_with_clinic as
  select
    dp.id,
    dp.user_id,
    dp.clinic_id,
    dp.doctor_id,
    dp.full_name,
    dp.poli,
    dp.sip,
    dp.phone,
    dp.color,
    dp.status,
    c.name as clinic_name,
    c.code as clinic_code
  from public.doctor_profiles dp
  join public.clinics c on c.id = dp.clinic_id;
