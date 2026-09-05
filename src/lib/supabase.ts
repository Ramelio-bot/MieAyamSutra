import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn("⚠️ Warning: NEXT_PUBLIC_SUPABASE_URL is missing. App is running in Mock Mode and database features will fail.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
