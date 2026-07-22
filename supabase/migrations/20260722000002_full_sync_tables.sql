-- Migration: 20260722000002_full_sync_tables.sql
-- Description: Skema lengkap untuk Antrean, Farmasi, Laboratorium, Billing, Dokumen, dan Profil Dokter

-- 1. TABEL PROFIL DOKTER
create table if not exists public.doctor_profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid unique,           -- Optional jika belum terikat auth user
  clinic_id   uuid not null default '11111111-1111-1111-1111-111111111111' references public.clinics(id) on delete cascade,
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

-- 2. TABEL ANTREAN (QUEUES)
create table if not exists public.queues (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null default '11111111-1111-1111-1111-111111111111' references public.clinics(id) on delete cascade,
  ticket_no    text not null,         -- e.g. A-001, B-002
  patient_id   uuid references public.patients(id) on delete set null,
  patient_name text not null,
  phone        text,
  insurance    text default 'Umum / Bayar Sendiri',
  poli         text not null,
  doctor_name  text,
  status       text not null default 'menunggu' check (status in ('menunggu', 'dipanggil', 'selesai', 'dibatalkan')),
  wait_time    text default '5-10 menit',
  color        text default '#0d9488',
  date         date not null default CURRENT_DATE,
  created_time text default to_char(now(), 'HH24:MI'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 3. TABEL STOK OBAT FARMASI (PHARMACY INVENTORY)
create table if not exists public.pharmacy_inventory (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null default '11111111-1111-1111-1111-111111111111' references public.clinics(id) on delete cascade,
  item_code   text,                  -- e.g. MED001
  name        text not null,
  stock       integer not null default 0,
  min_stock   integer not null default 10,
  unit        text not null default 'tablet',
  price       numeric(12,2) not null default 0,
  color       text default '#0d9488',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 4. TABEL RESEP OBAT FARMASI (PHARMACY ORDERS)
create table if not exists public.pharmacy_orders (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null default '11111111-1111-1111-1111-111111111111' references public.clinics(id) on delete cascade,
  order_no     text not null,        -- e.g. RX001
  patient_rm   text not null,
  patient_name text not null,
  doctor_name  text not null,
  date         date not null default CURRENT_DATE,
  medicines    jsonb not null default '[]'::jsonb,
  status       text not null default 'Menunggu Penyiapan' check (status in ('Menunggu Penyiapan', 'Racikan Berjalan', 'Siap Diambil', 'Diserahkan')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 5. TABEL PEMERIKSAAN LAB (LAB ORDERS)
create table if not exists public.lab_orders (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null default '11111111-1111-1111-1111-111111111111' references public.clinics(id) on delete cascade,
  lab_no       text not null,        -- e.g. LAB001
  patient_rm   text not null,
  patient_name text not null,
  doctor_name  text not null,
  test_name    text not null,
  date         date not null default CURRENT_DATE,
  status       text not null default 'menunggu' check (status in ('menunggu', 'proses', 'selesai', 'abnormal')),
  result_value text,
  normal_range text default 'Normal',
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 6. TABEL TAGIHAN & INVOICE (INVOICES / BILLING)
create table if not exists public.invoices (
  id             uuid primary key default gen_random_uuid(),
  clinic_id      uuid not null default '11111111-1111-1111-1111-111111111111' references public.clinics(id) on delete cascade,
  invoice_no     text not null,      -- e.g. INV001
  patient_rm     text not null,
  patient_name   text not null,
  doctor_name    text not null,
  insurance      text,
  date           date not null default CURRENT_DATE,
  items          jsonb not null default '[]'::jsonb,
  subtotal       numeric(12,2) not null default 0,
  tax            numeric(12,2) not null default 0,
  total          numeric(12,2) not null default 0,
  status         text not null default 'Belum Bayar' check (status in ('Lunas', 'Belum Bayar', 'Sebagian')),
  payment_method text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- 7. TABEL DOKUMEN KLINIK (CLINIC DOCUMENTS)
create table if not exists public.clinic_documents (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null default '11111111-1111-1111-1111-111111111111' references public.clinics(id) on delete cascade,
  doc_no       text not null,        -- e.g. DOC001
  nama         text not null,
  tipe         text not null default 'Surat Sakit',
  ukuran       text default '200 KB',
  tgl          date not null default CURRENT_DATE,
  pasien       text not null,
  dokter       text not null,
  detail_info  text,
  color        text default '#0d9488',
  ext          text default 'PDF',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 8. INDEXES UNTUK PERFORMA
create index if not exists queues_clinic_date_idx on public.queues(clinic_id, date);
create index if not exists pharmacy_inventory_clinic_idx on public.pharmacy_inventory(clinic_id);
create index if not exists pharmacy_orders_clinic_idx on public.pharmacy_orders(clinic_id);
create index if not exists lab_orders_clinic_idx on public.lab_orders(clinic_id);
create index if not exists invoices_clinic_idx on public.invoices(clinic_id);
create index if not exists clinic_documents_clinic_idx on public.clinic_documents(clinic_id);
