const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("❌ Missing Supabase URL or Service Role Key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function runSetup() {
  console.log("Checking Supabase connection & schema status...");
  const CLINIC_ID = "11111111-1111-1111-1111-111111111111";

  // Ensure default clinic exists
  const { error: clinicErr } = await supabase.from("clinics").upsert({
    id: CLINIC_ID,
    code: "SEN-SMG",
    name: "Klinik Sehat Sentosa",
    status: "active"
  }, { onConflict: "id" });

  if (clinicErr) {
    console.error("Clinic upsert status:", clinicErr.message);
  } else {
    console.log("✅ Default Clinic verified: Klinik Sehat Sentosa");
  }

  console.log("Provisioning Google Demo Accounts...");

  // 1. Buat Akun Demo dr. Maya Lestari
  const { data: user1, error: err1 } = await supabase.auth.admin.createUser({
    email: "dokter@sehatsentosa.com",
    password: "Password123!",
    email_confirm: true,
    user_metadata: {
      full_name: "dr. Maya Lestari",
      clinic_name: "Klinik Sehat Sentosa",
      role: "Dokter",
      poli: "Umum"
    }
  });
  if (err1) {
    console.log("Status Akun Demo 1:", err1.message);
  } else {
    console.log("✅ Akun Demo 1 Terbuat & Terkonfirmasi:", user1.user.email);
  }

  // 2. Buat Akun Demo drg. Sari Dewi
  const { data: user2, error: err2 } = await supabase.auth.admin.createUser({
    email: "sari.dewi@sehatsentosa.com",
    password: "Password123!",
    email_confirm: true,
    user_metadata: {
      full_name: "drg. Sari Dewi",
      clinic_name: "Klinik Sehat Sentosa",
      role: "Dokter",
      poli: "Gigi"
    }
  });
  if (err2) {
    console.log("Status Akun Demo 2:", err2.message);
  } else {
    console.log("✅ Akun Demo 2 Terbuat & Terkonfirmasi:", user2.user.email);
  }
}

runSetup().catch(console.error);
