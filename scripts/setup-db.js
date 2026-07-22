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
}

runSetup().catch(console.error);
