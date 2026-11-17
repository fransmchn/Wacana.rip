import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const supabase = await createSupabaseServerClient();

  try {
    if (supabase && code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) console.error("[wacana-auth] callback exchange failed", error.message);
    }
  } catch (error) {
    console.error("[wacana-auth] callback failed", error);
  }

  // Ignore arbitrary `next` URLs. OAuth callback always returns to this origin.
  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
