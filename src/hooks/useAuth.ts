"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const callbackError = params.get("auth_error");
      if (callbackError) {
        setAuthError(callbackError);
        params.delete("auth_error");
        const nextQuery = params.toString();
        const cleanUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`;
        window.history.replaceState({}, "", cleanUrl);
      }
    }

    const client = createSupabaseBrowserClient();
    if (!client) {
      setLoading(false);
      return;
    }

    let active = true;
    const reportError = (error: unknown) => {
      const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
      if (message && !/auth session missing/i.test(message)) {
        console.error("[graveyard-auth] user lookup failed:", message || error);
      }
    };

    // Hydrate from cookie/storage session immediately, then verify with getUser()
    void client.auth.getSession().then(({ data }) => {
      if (active && data.session?.user) {
        setUser(data.session.user);
        setLoading(false);
      }
    }).catch(() => undefined);

    void client.auth.getUser().then(({ data, error }) => {
      if (error) reportError(error);
      if (active) {
        setUser(data.user ?? null);
        setLoading(false);
      }
    }).catch((error: unknown) => {
      reportError(error);
      if (active) {
        setUser(null);
        setLoading(false);
      }
    });

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function updateProfile(displayName: string): Promise<void> {
    const name = displayName.trim().slice(0, 30);
    if (!name) throw new Error("Nama profil wajib diisi.");
    const client = createSupabaseBrowserClient();
    if (!client || !user) throw new Error("Masuk dulu untuk mengubah profil.");
    const authResult = await client.auth.updateUser({ data: { full_name: name } });
    if (authResult.error) throw new Error(`Profil gagal diperbarui: ${authResult.error.message}`);
    const profileResult = await client.from("profiles").update({ display_name: name }).eq("id", user.id);
    if (profileResult.error) throw new Error(`Profil gagal diperbarui: ${profileResult.error.message}`);
    setUser(authResult.data.user ?? user);
  }

  async function signOut(): Promise<void> {
    const client = createSupabaseBrowserClient();
    if (!client) return;
    await client.auth.signOut();
    setUser(null);
  }

  const clearAuthError = () => setAuthError(null);

  return { user, loading, configured, authError, clearAuthError, updateProfile, signOut };
}
