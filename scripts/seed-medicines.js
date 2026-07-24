/**
 * Seed Script: Populasikan Database Stok Obat Farmasi Supabase untuk Semua Dokter & Poli
 * 
 * Cara Penggunaan:
 * 1. Pastikan .env.local memiliki NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY
 * 2. Jalankan: node scripts/seed-medicines.js
 */

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ ERROR: Pastikan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY ada di .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const CLINIC_ID = "11111111-1111-1111-1111-111111111111";

const MEDICINES_SEED = [
  // 1. POLI UMUM (dr. Maya Lestari)
  { item_code: "MED-UMM-001", name: "Paracetamol 500mg", stock: 250, min_stock: 50, unit: "tablet", price: 1500, color: "#0d9488", category: "Poli Umum" },
  { item_code: "MED-UMM-002", name: "Amoxicillin 500mg", stock: 180, min_stock: 40, unit: "kaplet", price: 2500, color: "#0d9488", category: "Poli Umum" },
  { item_code: "MED-UMM-003", name: "Ibuprofen 400mg", stock: 150, min_stock: 30, unit: "tablet", price: 2000, color: "#0d9488", category: "Poli Umum" },
  { item_code: "MED-UMM-004", name: "Cetirizine 10mg", stock: 200, min_stock: 30, unit: "tablet", price: 1800, color: "#0d9488", category: "Poli Umum" },
  { item_code: "MED-UMM-005", name: "Omeprazole 20mg", stock: 120, min_stock: 25, unit: "kapsul", price: 3500, color: "#0d9488", category: "Poli Umum" },
  { item_code: "MED-UMM-006", name: "Vitamin C 500mg", stock: 300, min_stock: 50, unit: "tablet", price: 1000, color: "#0d9488", category: "Poli Umum" },

  // 2. POLI GIGI (drg. Sari Dewi)
  { item_code: "MED-GGI-001", name: "Cataflam 50mg (Potassium Diclofenac)", stock: 100, min_stock: 20, unit: "tablet", price: 7500, color: "#8b5cf6", category: "Poli Gigi" },
  { item_code: "MED-GGI-002", name: "Asam Mafenamat 500mg", stock: 160, min_stock: 30, unit: "kaplet", price: 2000, color: "#8b5cf6", category: "Poli Gigi" },
  { item_code: "MED-GGI-003", name: "Ciprofloxacin 500mg", stock: 90, min_stock: 20, unit: "kaplet", price: 4000, color: "#8b5cf6", category: "Poli Gigi" },
  { item_code: "MED-GGI-004", name: "Minosep Antiseptic Mouthwash 150ml", stock: 45, min_stock: 10, unit: "botol", price: 35000, color: "#8b5cf6", category: "Poli Gigi" },
  { item_code: "MED-GGI-005", name: "Aloclair Plus Gel Sariawan 8ml", stock: 30, min_stock: 8, unit: "tube", price: 85000, color: "#8b5cf6", category: "Poli Gigi" },
  { item_code: "MED-GGI-006", name: "Clindamycin 300mg", stock: 80, min_stock: 15, unit: "kapsul", price: 5000, color: "#8b5cf6", category: "Poli Gigi" },

  // 3. POLI JANTUNG (dr. Ahmad Rizki)
  { item_code: "MED-JTG-001", name: "Amlodipine 10mg", stock: 220, min_stock: 40, unit: "tablet", price: 3000, color: "#f97316", category: "Poli Jantung" },
  { item_code: "MED-JTG-002", name: "Captopril 25mg", stock: 150, min_stock: 30, unit: "tablet", price: 1500, color: "#f97316", category: "Poli Jantung" },
  { item_code: "MED-JTG-003", name: "Bisoprolol 5mg", stock: 130, min_stock: 25, unit: "tablet", price: 4500, color: "#f97316", category: "Poli Jantung" },
  { item_code: "MED-JTG-004", name: "Simvastatin 20mg", stock: 140, min_stock: 30, unit: "tablet", price: 3000, color: "#f97316", category: "Poli Jantung" },
  { item_code: "MED-JTG-005", name: "Clopidogrel 75mg", stock: 85, min_stock: 20, unit: "tablet", price: 12000, color: "#f97316", category: "Poli Jantung" },
  { item_code: "MED-JTG-006", name: "ISDN (Isosorbide Dinitrate) 5mg", stock: 95, min_stock: 20, unit: "tablet", price: 2000, color: "#f97316", category: "Poli Jantung" },

  // 4. POLI KULIT (dr. Laila Rahmawati)
  { item_code: "MED-KLT-001", name: "Hydrocortisone Cream 1% (5g)", stock: 60, min_stock: 15, unit: "tube", price: 12000, color: "#ec4899", category: "Poli Kulit" },
  { item_code: "MED-KLT-002", name: "Ketoconazole 200mg", stock: 110, min_stock: 25, unit: "tablet", price: 3500, color: "#ec4899", category: "Poli Kulit" },
  { item_code: "MED-KLT-003", name: "Calamine Lotion 100ml", stock: 40, min_stock: 10, unit: "botol", price: 25000, color: "#ec4899", category: "Poli Kulit" },
  { item_code: "MED-KLT-004", name: "Salep 2-4 Anti Gatal & Jamur", stock: 75, min_stock: 20, unit: "pot", price: 8000, color: "#ec4899", category: "Poli Kulit" },
  { item_code: "MED-KLT-005", name: "Dexamethasone 0.5mg", stock: 190, min_stock: 40, unit: "tablet", price: 1200, color: "#ec4899", category: "Poli Kulit" },
  { item_code: "MED-KLT-006", name: "Desolex Cream (Desonide 10g)", stock: 35, min_stock: 10, unit: "tube", price: 45000, color: "#ec4899", category: "Poli Kulit" },

  // 5. POLI ANAK (dr. Rudi Setiawan)
  { item_code: "MED-ANK-001", name: "Sanmol Sirup Anak 120mg/5ml (60ml)", stock: 80, min_stock: 20, unit: "botol", price: 18000, color: "#22c55e", category: "Poli Anak" },
  { item_code: "MED-ANK-002", name: "Tempra Drops Paracetamol Bayi (15ml)", stock: 50, min_stock: 12, unit: "botol", price: 48000, color: "#22c55e", category: "Poli Anak" },
  { item_code: "MED-ANK-003", name: "Zinc Sirup Diare 20mg/5ml (60ml)", stock: 65, min_stock: 15, unit: "botol", price: 22000, color: "#22c55e", category: "Poli Anak" },
  { item_code: "MED-ANK-004", name: "Oralit Garam Rehidrasi", stock: 300, min_stock: 50, unit: "sachet", price: 1500, color: "#22c55e", category: "Poli Anak" },
  { item_code: "MED-ANK-005", name: "Rhinos Neo Drops Flu Anak (10ml)", stock: 40, min_stock: 10, unit: "botol", price: 65000, color: "#22c55e", category: "Poli Anak" },
  { item_code: "MED-ANK-006", name: "Amoxsan Sirup Kering 125mg/5ml", stock: 55, min_stock: 15, unit: "botol", price: 32000, color: "#22c55e", category: "Poli Anak" },

  // 6. POLI MATA (dr. Hendra Kusuma)
  { item_code: "MED-MTA-001", name: "Cendo Xitrol Tetes Mata Steril (5ml)", stock: 70, min_stock: 15, unit: "botol", price: 38000, color: "#3b82f6", category: "Poli Mata" },
  { item_code: "MED-MTA-002", name: "Cendo Eyefresh / Insto Tetes Mata (15ml)", stock: 90, min_stock: 20, unit: "botol", price: 18000, color: "#3b82f6", category: "Poli Mata" },
  { item_code: "MED-MTA-003", name: "Cendo Tobroson Tetes Mata (5ml)", stock: 45, min_stock: 10, unit: "botol", price: 52000, color: "#3b82f6", category: "Poli Mata" },
  { item_code: "MED-MTA-004", name: "Cendo Lyteers Tetes Mata Kering (15ml)", stock: 60, min_stock: 15, unit: "botol", price: 32000, color: "#3b82f6", category: "Poli Mata" },
  { item_code: "MED-MTA-005", name: "Chloramphenicol Salep Mata Steril 3.5g", stock: 50, min_stock: 12, unit: "tube", price: 15000, color: "#3b82f6", category: "Poli Mata" },
  { item_code: "MED-MTA-006", name: "Cendo Statrol Tetes Mata Steril (5ml)", stock: 40, min_stock: 10, unit: "botol", price: 42000, color: "#3b82f6", category: "Poli Mata" },

  // 7. POLI PENYAKIT DALAM (dr. Bagus W.)
  { item_code: "MED-PDL-001", name: "Metformin 500mg", stock: 240, min_stock: 50, unit: "tablet", price: 1800, color: "#0284c7", category: "Poli Penyakit Dalam" },
  { item_code: "MED-PDL-002", name: "Glimepiride 2mg", stock: 130, min_stock: 30, unit: "tablet", price: 3200, color: "#0284c7", category: "Poli Penyakit Dalam" },
  { item_code: "MED-PDL-003", name: "Lansoprazole 30mg", stock: 110, min_stock: 25, unit: "kapsul", price: 4500, color: "#0284c7", category: "Poli Penyakit Dalam" },
  { item_code: "MED-PDL-004", name: "Sukralfat Sirup Maag 500mg/5ml (100ml)", stock: 50, min_stock: 15, unit: "botol", price: 38000, color: "#0284c7", category: "Poli Penyakit Dalam" },
  { item_code: "MED-PDL-005", name: "Allopurinol 100mg (Asam Urat)", stock: 170, min_stock: 35, unit: "tablet", price: 2000, color: "#0284c7", category: "Poli Penyakit Dalam" },
  { item_code: "MED-PDL-006", name: "Domperidone 10mg (Anti Mual)", stock: 160, min_stock: 30, unit: "tablet", price: 2200, color: "#0284c7", category: "Poli Penyakit Dalam" }
];

async function seedMedicines() {
  console.log("🚀 Memulai seed database obat farmasi untuk semua dokter & poli...\n");
  let successCount = 0;
  let errorCount = 0;

  for (const m of MEDICINES_SEED) {
    try {
      const payload = {
        clinic_id: CLINIC_ID,
        item_code: m.item_code,
        name: m.name,
        stock: m.stock,
        min_stock: m.min_stock,
        unit: m.unit,
        price: m.price,
        color: m.color,
        category: m.category
      };

      // Cek apakah item_code atau nama obat sudah ada di pharmacy_inventory
      const { data: existing } = await supabaseAdmin
        .from("pharmacy_inventory")
        .select("id")
        .eq("item_code", m.item_code)
        .maybeSingle();

      if (existing) {
        // Upsert/Update jika sudah ada
        const { error: updateErr } = await supabaseAdmin
          .from("pharmacy_inventory")
          .update(payload)
          .eq("id", existing.id);

        if (updateErr) {
          console.error(`❌ Gagal update obat: ${m.name} — ${updateErr.message}`);
          errorCount++;
        } else {
          console.log(`🔄 Updated: [${m.category}] ${m.name} (${m.item_code})`);
          successCount++;
        }
      } else {
        // Insert obat baru
        const { error: insertErr } = await supabaseAdmin
          .from("pharmacy_inventory")
          .insert([payload]);

        if (insertErr) {
          // Jika kolom category belum ada, coba insert tanpa kolom category
          const { error: retryErr } = await supabaseAdmin
            .from("pharmacy_inventory")
            .insert([{
              clinic_id: CLINIC_ID,
              item_code: m.item_code,
              name: m.name,
              stock: m.stock,
              min_stock: m.min_stock,
              unit: m.unit,
              price: m.price,
              color: m.color
            }]);

          if (retryErr) {
            console.error(`❌ Gagal insert obat: ${m.name} — ${retryErr.message}`);
            errorCount++;
          } else {
            console.log(`✅ Created: [${m.category}] ${m.name} (${m.item_code})`);
            successCount++;
          }
        } else {
          console.log(`✅ Created: [${m.category}] ${m.name} (${m.item_code})`);
          successCount++;
        }
      }
    } catch (err) {
      console.error(`❌ Error pada ${m.name}:`, err.message);
      errorCount++;
    }
  }

  console.log(`
========================================
📊 HASIL SEED DATABASE OBAT:
   ✅ Berhasil diproses : ${successCount} item
   ❌ Gagal             : ${errorCount} item
========================================
`);
}

seedMedicines().catch(console.error);
