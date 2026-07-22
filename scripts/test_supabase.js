const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function checkTables() {
  const tables = [
    "clinics", "clinic_memberships", "doctor_profiles", "patients",
    "appointments", "encounters", "clinical_notes", "audit_logs",
    "queues", "pharmacy_inventory", "pharmacy_orders", "lab_orders",
    "invoices", "clinic_documents"
  ];

  console.log("--- SUPABASE TABLES CHECK ---");
  for (const t of tables) {
    try {
      const { data, error, count } = await supabase.from(t).select("*", { count: "exact", head: false }).limit(5);
      if (error) {
        console.log(`❌ Table '${t}': Error -> ${error.message}`);
      } else {
        console.log(`✅ Table '${t}': ${count ?? data.length} rows`);
        if (data && data.length > 0) {
          console.log(`   Sample keys:`, Object.keys(data[0]));
        }
      }
    } catch (err) {
      console.log(`❌ Table '${t}': Exception -> ${err.message}`);
    }
  }
}

checkTables();
