import type { User } from "@supabase/supabase-js";

export interface ProfileRecord {
  id: string;
  display_name?: string | null;
  username?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}

export interface ProfileDisplay { name: string; email: string; initials: string; avatarUrl: string | null; username: string | null; bio: string; updatedAt: string | null; avatarTone: "rose" | "gold" | "sage" | "slate"; }

function initialsFor(name: string): string {
  return name.split(/\s+/).map((part: string) => part[0]).join("").slice(0, 2).toUpperCase() || "A";
}

function avatarTone(id: string): ProfileDisplay["avatarTone"] {
  const tones: ProfileDisplay["avatarTone"][] = ["rose", "gold", "sage", "slate"];
  return tones[[...id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % tones.length];
}

export function getProfileDisplay(user: User | null, profile?: ProfileRecord | null): ProfileDisplay {
  const email = user?.email ?? "";
  const name = profile?.display_name?.trim() || user?.user_metadata.full_name?.trim() || email || "Anonim";
  const rawAvatar = profile?.avatar_url ?? user?.user_metadata.avatar_url ?? null;
  const avatar = resolveAvatar(rawAvatar, profile?.updated_at);
  return { name, email, initials: initialsFor(name), avatarUrl: avatar.type === "image" ? avatar.url ?? null : rawAvatar, username: profile?.username ?? null, bio: profile?.bio ?? "", updatedAt: profile?.updated_at ?? null, avatarTone: avatarTone(user?.id ?? email ?? name) };
}

export function resolveAvatar(avatarUrl: string | null | undefined, updatedAt?: string | null): { type: "image" | "preset" | "initials"; url?: string; key?: string } {
  if (!avatarUrl) return { type: "initials" };
  if (avatarUrl.startsWith("preset:")) return { type: "preset", key: avatarUrl.slice("preset:".length) };
  const separator = avatarUrl.includes("?") ? "&" : "?";
  return { type: "image", url: updatedAt ? `${avatarUrl}${separator}v=${encodeURIComponent(updatedAt)}` : avatarUrl };
}
