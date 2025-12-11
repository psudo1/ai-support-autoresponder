import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (server-side only)
export const supabaseAdmin =
  process.env.SUPABASE_SERVICE_KEY
    ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY)
    : null;
