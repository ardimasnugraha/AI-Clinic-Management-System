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

  await provisionDemoUser("dokter@sehatsentosa.com", "admindokter123", "dr. Maya Lestari", "Dokter", "Umum");
  await provisionDemoUser("sari.dewi@sehatsentosa.com", "admindokter123", "drg. Sari Dewi", "Dokter", "Gigi");
}

async function provisionDemoUser(email, password, fullName, role, poli) {
  const { data, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) {
    console.error("Gagal mengambil daftar user:", listErr.message);
    return;
  }
  
  const users = data?.users || [];
  const existing = users.find(u => u.email === email);
  if (existing) {
    console.log(`Akun ${email} sudah ada. Melakukan pembaruan & konfirmasi email...`);
    const { error: updErr } = await supabase.auth.admin.updateUserById(
      existing.id,
      { 
        email_confirm: true, 
        password: password,
        user_metadata: {
          full_name: fullName,
          clinic_name: "Klinik Sehat Sentosa",
          role: role,
          poli: poli
        }
      }
    );
    if (updErr) {
      console.error(`❌ Gagal memperbarui ${email}:`, updErr.message);
    } else {
      console.log(`✅ Akun ${email} berhasil diperbarui & terkonfirmasi.`);
    }
  } else {
    console.log(`Akun ${email} belum ada. Membuat baru...`);
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        clinic_name: "Klinik Sehat Sentosa",
        role: role,
        poli: poli
      }
    });
    if (createErr) {
      console.error(`❌ Gagal membuat ${email}:`, createErr.message);
    } else {
      console.log(`✅ Akun ${email} berhasil dibuat & terkonfirmasi.`);
    }
  }
}

runSetup().catch(console.error);
