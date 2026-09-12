import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Read-only Supabase client for public documentation reads during SSR.
 * Uses the publishable key, so RLS applies as `anon`.
 */
export function publicDb(): SupabaseClient {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}
