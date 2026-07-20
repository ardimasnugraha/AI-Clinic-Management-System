import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Cek apakah env var sudah diatur secara riil (bukan template default)
const isConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== "https://your-project-ref.supabase.co" && 
  !supabaseAnonKey.startsWith("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");

let supabase: SupabaseClient | null = null;

if (isConfigured) {
  try {
    supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    console.log("Supabase Client initialized successfully. Connecting to live database.");
  } catch (error) {
    console.error("Failed to initialize Supabase Client:", error);
  }
} else {
  console.warn(
    "Supabase credentials not configured or using placeholders. " +
    "Aplikasi berjalan dalam Mode Simulasi Lokal (Graceful Fallback)."
  );
}

export { supabase, isConfigured };
export default supabase;
