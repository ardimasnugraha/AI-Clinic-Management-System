-- Migration: 20260724000003_pharmacy_medicines.sql
-- Description: Skema & Seed Obat Farmasi Terlengkap untuk Semua Poli Dokter (Umum, Gigi, Jantung, Kulit, Anak, Mata, Penyakit Dalam)

-- 1. TAMBAHKAN KOLOM CATEGORY JIKA BELUM ADA
alter table public.pharmacy_inventory 
add column if not exists category text default 'Poli Umum';

-- Index untuk kategori poli
create index if not exists pharmacy_inventory_category_idx on public.pharmacy_inventory(category);

-- 2. SEED DAFTAR OBAT UNTUK MASING-MASING DOKTER & POLI
insert into public.pharmacy_inventory (clinic_id, item_code, name, stock, min_stock, unit, price, color, category)
values
  -- Poli Umum (dr. Maya Lestari)
  ('11111111-1111-1111-1111-111111111111', 'MED-UMM-001', 'Paracetamol 500mg', 250, 50, 'tablet', 1500.00, '#0d9488', 'Poli Umum'),
  ('11111111-1111-1111-1111-111111111111', 'MED-UMM-002', 'Amoxicillin 500mg', 180, 40, 'kaplet', 2500.00, '#0d9488', 'Poli Umum'),
  ('11111111-1111-1111-1111-111111111111', 'MED-UMM-003', 'Ibuprofen 400mg', 150, 30, 'tablet', 2000.00, '#0d9488', 'Poli Umum'),
  ('11111111-1111-1111-1111-111111111111', 'MED-UMM-004', 'Cetirizine 10mg', 200, 30, 'tablet', 1800.00, '#0d9488', 'Poli Umum'),
  ('11111111-1111-1111-1111-111111111111', 'MED-UMM-005', 'Omeprazole 20mg', 120, 25, 'kapsul', 3500.00, '#0d9488', 'Poli Umum'),
  ('11111111-1111-1111-1111-111111111111', 'MED-UMM-006', 'Vitamin C 500mg', 300, 50, 'tablet', 1000.00, '#0d9488', 'Poli Umum'),

  -- Poli Gigi (drg. Sari Dewi)
  ('11111111-1111-1111-1111-111111111111', 'MED-GGI-001', 'Cataflam 50mg (Potassium Diclofenac)', 100, 20, 'tablet', 7500.00, '#8b5cf6', 'Poli Gigi'),
  ('11111111-1111-1111-1111-111111111111', 'MED-GGI-002', 'Asam Mafenamat 500mg', 160, 30, 'kaplet', 2000.00, '#8b5cf6', 'Poli Gigi'),
  ('11111111-1111-1111-1111-111111111111', 'MED-GGI-003', 'Ciprofloxacin 500mg', 90, 20, 'kaplet', 4000.00, '#8b5cf6', 'Poli Gigi'),
  ('11111111-1111-1111-1111-111111111111', 'MED-GGI-004', 'Minosep Antiseptic Mouthwash 150ml', 45, 10, 'botol', 35000.00, '#8b5cf6', 'Poli Gigi'),
  ('11111111-1111-1111-1111-111111111111', 'MED-GGI-005', 'Aloclair Plus Gel Sariawan 8ml', 30, 8, 'tube', 85000.00, '#8b5cf6', 'Poli Gigi'),
  ('11111111-1111-1111-1111-111111111111', 'MED-GGI-006', 'Clindamycin 300mg', 80, 15, 'kapsul', 5000.00, '#8b5cf6', 'Poli Gigi'),

  -- Poli Jantung (dr. Ahmad Rizki)
  ('11111111-1111-1111-1111-111111111111', 'MED-JTG-001', 'Amlodipine 10mg', 220, 40, 'tablet', 3000.00, '#f97316', 'Poli Jantung'),
  ('11111111-1111-1111-1111-111111111111', 'MED-JTG-002', 'Captopril 25mg', 150, 30, 'tablet', 1500.00, '#f97316', 'Poli Jantung'),
  ('11111111-1111-1111-1111-111111111111', 'MED-JTG-003', 'Bisoprolol 5mg', 130, 25, 'tablet', 4500.00, '#f97316', 'Poli Jantung'),
  ('11111111-1111-1111-1111-111111111111', 'MED-JTG-004', 'Simvastatin 20mg', 140, 30, 'tablet', 3000.00, '#f97316', 'Poli Jantung'),
  ('11111111-1111-1111-1111-111111111111', 'MED-JTG-005', 'Clopidogrel 75mg', 85, 20, 'tablet', 12000.00, '#f97316', 'Poli Jantung'),
  ('11111111-1111-1111-1111-111111111111', 'MED-JTG-006', 'ISDN (Isosorbide Dinitrate) 5mg', 95, 20, 'tablet', 2000.00, '#f97316', 'Poli Jantung'),

  -- Poli Kulit (dr. Laila Rahmawati)
  ('11111111-1111-1111-1111-111111111111', 'MED-KLT-001', 'Hydrocortisone Cream 1% (5g)', 60, 15, 'tube', 12000.00, '#ec4899', 'Poli Kulit'),
  ('11111111-1111-1111-1111-111111111111', 'MED-KLT-002', 'Ketoconazole 200mg', 110, 25, 'tablet', 3500.00, '#ec4899', 'Poli Kulit'),
  ('11111111-1111-1111-1111-111111111111', 'MED-KLT-003', 'Calamine Lotion 100ml', 40, 10, 'botol', 25000.00, '#ec4899', 'Poli Kulit'),
  ('11111111-1111-1111-1111-111111111111', 'MED-KLT-004', 'Salep 2-4 Anti Gatal & Jamur', 75, 20, 'pot', 8000.00, '#ec4899', 'Poli Kulit'),
  ('11111111-1111-1111-1111-111111111111', 'MED-KLT-005', 'Dexamethasone 0.5mg', 190, 40, 'tablet', 1200.00, '#ec4899', 'Poli Kulit'),
  ('11111111-1111-1111-1111-111111111111', 'MED-KLT-006', 'Desolex Cream (Desonide 10g)', 35, 10, 'tube', 45000.00, '#ec4899', 'Poli Kulit'),

  -- Poli Anak (dr. Rudi Setiawan)
  ('11111111-1111-1111-1111-111111111111', 'MED-ANK-001', 'Sanmol Sirup Anak 120mg/5ml (60ml)', 80, 20, 'botol', 18000.00, '#22c55e', 'Poli Anak'),
  ('11111111-1111-1111-1111-111111111111', 'MED-ANK-002', 'Tempra Drops Paracetamol Bayi (15ml)', 50, 12, 'botol', 48000.00, '#22c55e', 'Poli Anak'),
  ('11111111-1111-1111-1111-111111111111', 'MED-ANK-003', 'Zinc Sirup Diare 20mg/5ml (60ml)', 65, 15, 'botol', 22000.00, '#22c55e', 'Poli Anak'),
  ('11111111-1111-1111-1111-111111111111', 'MED-ANK-004', 'Oralit Garam Rehidrasi', 300, 50, 'sachet', 1500.00, '#22c55e', 'Poli Anak'),
  ('11111111-1111-1111-1111-111111111111', 'MED-ANK-005', 'Rhinos Neo Drops Flu Anak (10ml)', 40, 10, 'botol', 65000.00, '#22c55e', 'Poli Anak'),
  ('11111111-1111-1111-1111-111111111111', 'MED-ANK-006', 'Amoxsan Sirup Kering 125mg/5ml', 55, 15, 'botol', 32000.00, '#22c55e', 'Poli Anak'),

  -- Poli Mata (dr. Hendra Kusuma)
  ('11111111-1111-1111-1111-111111111111', 'MED-MTA-001', 'Cendo Xitrol Tetes Mata Steril (5ml)', 70, 15, 'botol', 38000.00, '#3b82f6', 'Poli Mata'),
  ('11111111-1111-1111-1111-111111111111', 'MED-MTA-002', 'Cendo Eyefresh / Insto Tetes Mata (15ml)', 90, 20, 'botol', 18000.00, '#3b82f6', 'Poli Mata'),
  ('11111111-1111-1111-1111-111111111111', 'MED-MTA-003', 'Cendo Tobroson Tetes Mata (5ml)', 45, 10, 'botol', 52000.00, '#3b82f6', 'Poli Mata'),
  ('11111111-1111-1111-1111-111111111111', 'MED-MTA-004', 'Cendo Lyteers Tetes Mata Kering (15ml)', 60, 15, 'botol', 32000.00, '#3b82f6', 'Poli Mata'),
  ('11111111-1111-1111-1111-111111111111', 'MED-MTA-005', 'Chloramphenicol Salep Mata Steril 3.5g', 50, 12, 'tube', 15000.00, '#3b82f6', 'Poli Mata'),
  ('11111111-1111-1111-1111-111111111111', 'MED-MTA-006', 'Cendo Statrol Tetes Mata Steril (5ml)', 40, 10, 'botol', 42000.00, '#3b82f6', 'Poli Mata'),

  -- Poli Penyakit Dalam (dr. Bagus W.)
  ('11111111-1111-1111-1111-111111111111', 'MED-PDL-001', 'Metformin 500mg', 240, 50, 'tablet', 1800.00, '#0284c7', 'Poli Penyakit Dalam'),
  ('11111111-1111-1111-1111-111111111111', 'MED-PDL-002', 'Glimepiride 2mg', 130, 30, 'tablet', 3200.00, '#0284c7', 'Poli Penyakit Dalam'),
  ('11111111-1111-1111-1111-111111111111', 'MED-PDL-003', 'Lansoprazole 30mg', 110, 25, 'kapsul', 4500.00, '#0284c7', 'Poli Penyakit Dalam'),
  ('11111111-1111-1111-1111-111111111111', 'MED-PDL-004', 'Sukralfat Sirup Maag 500mg/5ml (100ml)', 50, 15, 'botol', 38000.00, '#0284c7', 'Poli Penyakit Dalam'),
  ('11111111-1111-1111-1111-111111111111', 'MED-PDL-005', 'Allopurinol 100mg (Asam Urat)', 170, 35, 'tablet', 2000.00, '#0284c7', 'Poli Penyakit Dalam'),
  ('11111111-1111-1111-1111-111111111111', 'MED-PDL-006', 'Domperidone 10mg (Anti Mual)', 160, 30, 'tablet', 2200.00, '#0284c7', 'Poli Penyakit Dalam')
on conflict do nothing;
