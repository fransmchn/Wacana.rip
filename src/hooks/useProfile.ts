"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getProfile, updateProfile, type ProfilePatch } from "@/lib/profileService";
import { getProfileDisplay, type ProfileDisplay, type ProfileRecord } from "@/lib/profile";

const profileCache = new Map<string, ProfileRecord | null>();

export function useProfile(user: User | null) {
  const [profile, setProfile] = useState<ProfileRecord | null>(() => user ? profileCache.get(user.id) ?? null : null);
  const [loading, setLoading] = useState(Boolean(user && !profileCache.has(user.id)));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) { setProfile(null); setLoading(false); return; }
    const cached = profileCache.get(user.id);
    if (cached !== undefined) setProfile(cached);
    setLoading(cached === undefined);
    try {
      const next = await getProfile(user.id);
      profileCache.set(user.id, next);
      setProfile(next);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Profil gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const mutate = useCallback(async (patch: ProfilePatch) => {
    if (!user) throw new Error("Masuk dulu untuk mengubah profil.");
    const previous = profileCache.get(user.id) ?? profile;
    const optimistic = { ...(previous ?? { id: user.id }), ...patch } as ProfileRecord;
    profileCache.set(user.id, optimistic);
    setProfile(optimistic);
    try {
      const saved = await updateProfile(user.id, patch);
      profileCache.set(user.id, saved);
      setProfile(saved);
      setError(null);
      return saved;
    } catch (reason) {
      profileCache.set(user.id, previous ?? null);
      setProfile(previous ?? null);
      throw reason;
    }
  }, [profile, user]);

  const display = useMemo<ProfileDisplay>(() => getProfileDisplay(user, profile), [profile, user]);
  return { profile, display, loading, error, mutate, reload: load };
}
