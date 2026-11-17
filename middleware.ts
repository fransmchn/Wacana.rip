import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_ASSET = /^\/(?:_next\/static|_next\/image|favicon\.ico|.*\.(?:css|js|mjs|map|svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf))$/i;

function validConfig(): { url: string; key: string } | null {
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

export async function middleware(request: NextRequest) {
  // Defense in depth: assets must never enter auth/session middleware.
  if (PUBLIC_ASSET.test(request.nextUrl.pathname)) return NextResponse.next();

  const config = validConfig();
  if (!config) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  try {
    const supabase = createServerClient(config.url, config.key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    await supabase.auth.getUser();
  } catch (error) {
    // Auth refresh must not turn page or asset requests into blank documents.
    console.error("[wacana-auth] session refresh failed", error);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:css|js|mjs|map|svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)$).*)",
  ],
};
