import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client for client-side components (uses SSR cookie handling)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Admin client (server-side only)
export const supabaseAdmin =
  process.env.SUPABASE_SERVICE_KEY
    ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY)
    : null;
