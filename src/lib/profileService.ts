import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProfileRecord } from "@/lib/profile";
import { normalizeUsername } from "@/lib/profileValidation";

export interface ProfilePatch { display_name?: string; username?: string | null; bio?: string | null; avatar_url?: string | null; }
export interface ProfilePreferences { user_id: string; anonymous_default: boolean; updated_at?: string | null; }
export interface ProfileStats { wacanaDikubur: number; bungaDitabur: number; lilinDinyalakan: number; }

function client() {
  const value = createSupabaseBrowserClient();
  if (!value) throw new Error("Supabase belum dikonfigurasi.");
  return value;
}

function friendlyError(error: { code?: string; message?: string } | null, fallback = "Profil gagal diperbarui."): Error {
  if (error?.code === "23505") return new Error("Username sudah dipakai");
  return new Error(fallback);
}

export async function getProfile(uid: string): Promise<ProfileRecord | null> {
  const result = await client().from("profiles").select("*").eq("id", uid).maybeSingle();
  if (result.error) throw friendlyError(result.error, "Profil gagal dimuat.");
  return (result.data as ProfileRecord | null) ?? null;
}

export async function updateProfile(uid: string, patch: ProfilePatch): Promise<ProfileRecord> {
  const supabase = client();
  const nextPatch = { ...patch, ...(patch.username === undefined ? {} : { username: patch.username ? normalizeUsername(patch.username) : null }) };
  if (patch.display_name !== undefined) {
    const authResult = await supabase.auth.updateUser({ data: { full_name: patch.display_name } });
    if (authResult.error) throw friendlyError(authResult.error);
  }
  const result = await supabase.from("profiles").update(nextPatch).eq("id", uid).select("*").single();
  if (result.error) throw friendlyError(result.error);
  if (!result.data) throw new Error("Profil gagal diperbarui.");
  return result.data as ProfileRecord;
}

export async function checkUsernameAvailable(username: string, currentUid?: string): Promise<boolean> {
  const value = normalizeUsername(username);
  if (!value) return true;
  let query = client().from("profiles").select("id").ilike("username", value).limit(1);
  if (currentUid) query = query.neq("id", currentUid);
  const result = await query;
  if (result.error) throw friendlyError(result.error, "Username belum bisa diperiksa.");
  return !result.data?.length;
}

export async function uploadAvatar(uid: string, blob: Blob): Promise<string> {
  const supabase = client();
  const path = `${uid}/avatar-${Date.now()}.webp`;
  const upload = await supabase.storage.from("avatars").upload(path, blob, { contentType: "image/webp", upsert: false });
  if (upload.error) throw friendlyError(upload.error, "Foto profil gagal diunggah.");
  const publicUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  return publicUrl;
}

export async function removeAvatar(uid: string, oldUrl: string | null | undefined): Promise<void> {
  if (!oldUrl || !oldUrl.includes("/avatars/")) return;
  const marker = "/avatars/";
  const path = decodeURIComponent(oldUrl.slice(oldUrl.indexOf(marker) + marker.length).split("?")[0]);
  if (!path.startsWith(`${uid}/`)) return;
  const result = await client().storage.from("avatars").remove([path]);
  if (result.error) throw friendlyError(result.error, "Foto profil lama gagal dihapus.");
}

export async function getPreferences(uid: string): Promise<ProfilePreferences | null> {
  const result = await client().from("profile_preferences").select("*").eq("user_id", uid).maybeSingle();
  if (result.error) throw friendlyError(result.error, "Preferensi profil gagal dimuat.");
  return result.data as ProfilePreferences | null;
}

export async function updatePreferences(uid: string, anonymousDefault: boolean): Promise<ProfilePreferences> {
  const result = await client().from("profile_preferences").upsert({ user_id: uid, anonymous_default: anonymousDefault }).select("*").single();
  if (result.error || !result.data) throw friendlyError(result.error, "Preferensi profil gagal disimpan.");
  return result.data as ProfilePreferences;
}

export async function getMyStats(): Promise<ProfileStats> {
  const result = await client().rpc("my_profile_stats");
  if (result.error) throw friendlyError(result.error, "Statistik profil gagal dimuat.");
  const row = Array.isArray(result.data) ? result.data[0] : result.data;
  return { wacanaDikubur: Number(row?.wacana_dikubur ?? 0), bungaDitabur: Number(row?.bunga_ditabur ?? 0), lilinDinyalakan: Number(row?.lilin_dinyalakan ?? 0) };
}
