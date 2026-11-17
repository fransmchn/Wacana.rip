import type { User } from "@supabase/supabase-js";

export interface ProfileDisplay { name: string; email: string; initials: string; avatarUrl: string | null; }

export function getProfileDisplay(user: User | null): ProfileDisplay {
  const email = user?.email ?? "";
  const name = user?.user_metadata.full_name?.trim() || email || "Anonim";
  return { name, email, initials: name.split(/\s+/).map((part: string) => part[0]).join("").slice(0, 2).toUpperCase(), avatarUrl: user?.user_metadata.avatar_url ?? null };
}
