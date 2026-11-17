"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    const client = createSupabaseBrowserClient();
    if (!client) {
      setLoading(false);
      return;
    }

    let active = true;
    void client.auth.getUser().then(({ data, error }) => {
      if (error) console.error("[wacana-auth] user lookup failed", error.message);
      if (active) {
        setUser(data.user);
        setLoading(false);
      }
    }).catch((error: unknown) => {
      console.error("[wacana-auth] user lookup failed", error);
      if (active) {
        setUser(null);
        setLoading(false);
      }
    });
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (active) setUser(session?.user ?? null);
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
  }

  return { user, loading, configured, updateProfile, signOut };
}
