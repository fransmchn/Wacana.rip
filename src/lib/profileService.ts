import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProfileRecord } from "@/lib/profile";
import { normalizeUsername } from "@/lib/profileValidation";

export interface ProfilePatch { display_name?: string; username?: string | null; bio?: string | null; avatar_url?: string | null; }
export interface ProfileStats { wacanaDikubur: number; bungaDitabur: number; }
export type ProfileField = "display_name" | "username" | "bio";

export class ProfileServiceError extends Error {
  field?: ProfileField;
  constructor(message: string, field?: ProfileField) { super(message); this.name = "ProfileServiceError"; this.field = field; }
}

function client() {
  const value = createSupabaseBrowserClient();
  if (!value) throw new Error("Supabase belum dikonfigurasi.");
  return value;
}

function friendlyError(error: { code?: string; message?: string; details?: string | null } | null, fallback = "Profil gagal diperbarui."): ProfileServiceError {
  if (error?.code === "23505") return new ProfileServiceError("Username sudah dipakai", "username");
  const source = `${error?.message ?? ""} ${error?.details ?? ""}`;
  if (source.includes("profiles_username_format_check")) return new ProfileServiceError("Username harus 3–20 karakter: huruf kecil, angka, atau garis bawah.", "username");
  if (source.includes("profiles_bio_length_check")) return new ProfileServiceError("Epitaf pribadi maksimal 120 karakter.", "bio");
  if (source.includes("profiles_display_name_length_v2_check")) return new ProfileServiceError("Nama tampilan harus 2–32 karakter.", "display_name");
  return new ProfileServiceError(fallback);
}

export async function getProfile(uid: string): Promise<ProfileRecord | null> {
  const result = await client().from("profiles").select("*").eq("id", uid).maybeSingle();
  if (result.error) throw friendlyError(result.error, "Profil gagal dimuat.");
  return (result.data as ProfileRecord | null) ?? null;
}

export async function updateProfile(uid: string, patch: ProfilePatch): Promise<ProfileRecord> {
  const supabase = client();
  const nextPatch = { ...patch, ...(patch.username === undefined ? {} : { username: patch.username ? normalizeUsername(patch.username) : null }), ...(patch.bio === undefined ? {} : { bio: patch.bio?.trim() || null }) };
  const result = await supabase.from("profiles").update(nextPatch).eq("id", uid).select("*").single();
  if (result.error) throw friendlyError(result.error);
  if (!result.data) throw new ProfileServiceError("Profil gagal diperbarui.");
  if (patch.display_name !== undefined) {
    const authResult = await supabase.auth.updateUser({ data: { full_name: patch.display_name } });
    if (authResult.error) console.error("[wacana-profile] auth metadata sync failed", authResult.error);
  }
  return result.data as ProfileRecord;
}

export async function checkUsernameAvailable(username: string, currentUid?: string): Promise<boolean> {
  const value = normalizeUsername(username);
  if (!value) return true;
  let query = client().from("profiles").select("id").eq("username", value).limit(1);
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

export async function getMyStats(): Promise<ProfileStats> {
  const result = await client().rpc("my_profile_stats");
  if (result.error) throw friendlyError(result.error, "Statistik profil gagal dimuat.");
  const row = Array.isArray(result.data) ? result.data[0] : result.data;
  return { wacanaDikubur: Number(row?.wacana_dikubur ?? 0), bungaDitabur: Number(row?.bunga_ditabur ?? 0) };
}
