import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

/** Public, browser-safe configuration only. Never embed a service-role key. */
const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const configuredKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

export const isSupabaseConfigured = Boolean(
  /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(configuredUrl) && configuredKey,
);

// A nonfunctional placeholder lets design preview compile without contacting a real backend.
// Private actions are disabled in App.tsx unless isSupabaseConfigured is true.
export const supabaseUrl = isSupabaseConfigured ? configuredUrl.replace(/\/$/, "") : "https://unconfigured.supabase.co";
export const publishableKey = isSupabaseConfigured ? configuredKey : "not-configured";

export const supabase = createClient<Database>(supabaseUrl, publishableKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
  },
  global: { headers: { "X-Client-Info": "wtp-founder-alpha-sprint1" } },
});
