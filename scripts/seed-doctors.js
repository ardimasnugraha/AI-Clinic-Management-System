/**
 * Seed Script: Buat Akun Dokter & Admin di Supabase Auth
 * 
 * Cara Penggunaan:
 * 1. Tambahkan SUPABASE_SERVICE_ROLE_KEY ke .env.local
 * 2. Jalankan: node scripts/seed-doctors.js
 * 
 * Service Role Key tersedia di:
 * Supabase Dashboard → Project Settings → API → service_role (secret)
 */

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ ERROR: Pastikan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY ada di .env.local");
  console.error("   Service Role Key tersedia di: Supabase Dashboard → Project Settings → API → service_role");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const CLINIC_ID = "11111111-1111-1111-1111-111111111111";
const DEFAULT_PASSWORD = "admindokter123";

const USERS_TO_CREATE = [
  // Admin Klinik
  {
    email: "admin@klinikai.co.id",
    password: DEFAULT_PASSWORD,
    user_metadata: {
      full_name: "Admin Klinik",
      role: "Admin Klinik",
      clinic_name: "Klinik Sehat Sentosa",
    },
    doctor_profile: null,
  },
  // 6 Dokter
  {
    email: "maya.lestari@klinikai.co.id",
    password: DEFAULT_PASSWORD,
    user_metadata: {
      full_name: "dr. Maya Lestari",
      role: "Dokter",
      clinic_name: "Klinik Sehat Sentosa",
    },
    doctor_profile: {
      doctor_id: "DOC001",
      full_name: "dr. Maya Lestari",
      poli: "Umum",
      sip: "SIP-2024-001",
      phone: "0812-1111-2222",
      color: "#0d9488",
      status: "Aktif",
    },
  },
  {
    email: "sari.dewi@klinikai.co.id",
    password: DEFAULT_PASSWORD,
    user_metadata: {
      full_name: "drg. Sari Dewi",
      role: "Dokter",
      clinic_name: "Klinik Sehat Sentosa",
    },
    doctor_profile: {
      doctor_id: "DOC002",
      full_name: "drg. Sari Dewi",
      poli: "Gigi",
      sip: "SIP-2024-002",
      phone: "0812-3333-4444",
      color: "#8b5cf6",
      status: "Aktif",
    },
  },
  {
    email: "ahmad.rizki@klinikai.co.id",
    password: DEFAULT_PASSWORD,
    user_metadata: {
      full_name: "dr. Ahmad Rizki",
      role: "Dokter",
      clinic_name: "Klinik Sehat Sentosa",
    },
    doctor_profile: {
      doctor_id: "DOC003",
      full_name: "dr. Ahmad Rizki",
      poli: "Jantung",
      sip: "SIP-2024-003",
      phone: "0812-5555-6666",
      color: "#f97316",
      status: "Aktif",
    },
  },
  {
    email: "laila.rahmawati@klinikai.co.id",
    password: DEFAULT_PASSWORD,
    user_metadata: {
      full_name: "dr. Laila Rahmawati",
      role: "Dokter",
      clinic_name: "Klinik Sehat Sentosa",
    },
    doctor_profile: {
      doctor_id: "DOC004",
      full_name: "dr. Laila Rahmawati",
      poli: "Kulit",
      sip: "SIP-2024-004",
      phone: "0812-7777-8888",
      color: "#ec4899",
      status: "Aktif",
    },
  },
  {
    email: "rudi.setiawan@klinikai.co.id",
    password: DEFAULT_PASSWORD,
    user_metadata: {
      full_name: "dr. Rudi Setiawan",
      role: "Dokter",
      clinic_name: "Klinik Sehat Sentosa",
    },
    doctor_profile: {
      doctor_id: "DOC005",
      full_name: "dr. Rudi Setiawan",
      poli: "Anak",
      sip: "SIP-2024-005",
      phone: "0812-9999-0000",
      color: "#22c55e",
      status: "Aktif",
    },
  },
  {
    email: "hendra.kusuma@klinikai.co.id",
    password: DEFAULT_PASSWORD,
    user_metadata: {
      full_name: "dr. Hendra Kusuma",
      role: "Dokter",
      clinic_name: "Klinik Sehat Sentosa",
    },
    doctor_profile: {
      doctor_id: "DOC006",
      full_name: "dr. Hendra Kusuma",
      poli: "Mata",
      sip: "SIP-2024-006",
      phone: "0811-2233-4455",
      color: "#3b82f6",
      status: "Aktif",
    },
  },
  {
    email: "bagus.wibowo@klinikai.co.id",
    password: DEFAULT_PASSWORD,
    user_metadata: {
      full_name: "dr. Bagus W.",
      role: "Dokter",
      clinic_name: "Klinik Sehat Sentosa",
    },
    doctor_profile: {
      doctor_id: "DOC007",
      full_name: "dr. Bagus W.",
      poli: "Poli Penyakit Dalam",
      sip: "SIP-2024-007",
      phone: "0811-3344-5566",
      color: "#0284c7",
      status: "Aktif",
    },
  },
];

async function seedUsers() {
  console.log("🚀 Memulai seed akun dokter & admin...\n");
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const u of USERS_TO_CREATE) {
    try {
      // Cek apakah user sudah ada
      const { data: existingList } = await supabaseAdmin.auth.admin.listUsers();
      const exists = existingList?.users?.find((x) => x.email === u.email);

      if (exists) {
        console.log(`⏭️  Skip (sudah ada): ${u.email}`);
        skipCount++;

        // Update doctor_profiles jika ada profil dokter
        if (u.doctor_profile) {
          await supabaseAdmin.from("doctor_profiles").upsert({
            user_id: exists.id,
            clinic_id: CLINIC_ID,
            ...u.doctor_profile,
          }, { onConflict: "user_id" });
        }
        continue;
      }

      // Buat user baru
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true, // Langsung terverifikasi, tanpa perlu klik email
        user_metadata: u.user_metadata,
      });

      if (createErr) {
        console.error(`❌ Gagal membuat: ${u.email} — ${createErr.message}`);
        errorCount++;
        continue;
      }

      console.log(`✅ Berhasil dibuat: ${u.email} (${u.user_metadata.full_name})`);
      successCount++;

      // Simpan clinic membership
      if (created?.user) {
        const roleMap = {
          "Admin Klinik": "clinic_admin",
          "Dokter": "doctor",
        };
        const dbRole = roleMap[u.user_metadata.role] || "doctor";

        await supabaseAdmin.from("clinic_memberships").upsert({
          clinic_id: CLINIC_ID,
          user_id: created.user.id,
          role: dbRole,
          status: "active",
        }, { onConflict: "clinic_id,user_id,role" });

        // Simpan profil dokter jika ada
        if (u.doctor_profile) {
          await supabaseAdmin.from("doctor_profiles").upsert({
            user_id: created.user.id,
            clinic_id: CLINIC_ID,
            ...u.doctor_profile,
          }, { onConflict: "user_id" });
        }
      }
    } catch (err) {
      console.error(`❌ Error pada ${u.email}:`, err.message);
      errorCount++;
    }
  }

  console.log(`
========================================
📊 HASIL SEED:
   ✅ Berhasil dibuat : ${successCount}
   ⏭️  Sudah ada (skip): ${skipCount}
   ❌ Gagal           : ${errorCount}
========================================

📋 DAFTAR AKUN YANG TERSEDIA:
`);

  USERS_TO_CREATE.forEach((u) => {
    console.log(`   📧 ${u.email.padEnd(38)} 🔑 ${DEFAULT_PASSWORD}`);
  });

  console.log(`
💡 CARA LOGIN:
   Buka http://localhost:3000/login
   Gunakan email & password di atas
`);
}

seedUsers().catch(console.error);
