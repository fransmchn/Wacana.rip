import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

type BrowserClient = SupabaseClient;
let browserClient: BrowserClient | null | undefined;

function getSupabaseConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  } catch {
    return null;
  }
  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

export function createSupabaseBrowserClient(): BrowserClient | null {
  const config = getSupabaseConfig();
  if (!config) return null;
  if (browserClient === undefined) {
    try {
      browserClient = createBrowserClient(config.url, config.key);
    } catch (error) {
      console.error("[wacana-supabase] browser client unavailable", error);
      browserClient = null;
    }
  }
  return browserClient;
}
