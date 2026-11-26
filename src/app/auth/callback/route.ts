import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function resolveSafeNext(value: string | null): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value === "/profile" ? "/profile" : "/";
}

function resolveOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  if (forwardedHost && process.env.NODE_ENV === "production") {
    return `${forwardedProto}://${forwardedHost}`;
  }
  return new URL(request.url).origin;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = resolveOrigin(request);
  const nextPath = resolveSafeNext(requestUrl.searchParams.get("next"));
  const code = requestUrl.searchParams.get("code");
  const oauthError =
    requestUrl.searchParams.get("error_description") ||
    requestUrl.searchParams.get("error");

  if (oauthError) {
    const errorUrl = new URL(nextPath, origin);
    errorUrl.searchParams.set("auth_error", oauthError);
    return NextResponse.redirect(errorUrl);
  }

  if (!code) {
    const errorUrl = new URL(nextPath, origin);
    errorUrl.searchParams.set("auth_error", "Kode otentikasi tidak ditemukan. Silakan coba masuk kembali.");
    return NextResponse.redirect(errorUrl);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) {
    const errorUrl = new URL(nextPath, origin);
    errorUrl.searchParams.set("auth_error", "Konfigurasi Supabase belum lengkap pada server.");
    return NextResponse.redirect(errorUrl);
  }

  const successUrl = new URL(nextPath, origin);
  const response = NextResponse.redirect(successUrl);

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[graveyard-auth] callback exchange failed:", error.message);
      const errorUrl = new URL(nextPath, origin);
      errorUrl.searchParams.set("auth_error", error.message || "Gagal menyelesaikan login Google.");
      return NextResponse.redirect(errorUrl);
    }

    return response;
  } catch (error) {
    console.error("[graveyard-auth] callback unexpected error:", error);
    const errorUrl = new URL(nextPath, origin);
    errorUrl.searchParams.set("auth_error", "Terjadi kesalahan saat memverifikasi sesi login.");
    return NextResponse.redirect(errorUrl);
  }
}
