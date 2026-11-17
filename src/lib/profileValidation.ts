export const FORBIDDEN_USERNAMES = ["admin", "wacana", "support", "system", "root", "moderator", "null", "undefined"] as const;

export interface ProfileValidationInput {
  displayName: string;
  username?: string | null;
  bio?: string | null;
}

export interface ProfileValidationErrors {
  displayName?: string;
  username?: string;
  bio?: string;
}

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function validateProfile(input: ProfileValidationInput): ProfileValidationErrors {
  const errors: ProfileValidationErrors = {};
  const displayName = input.displayName.trim();
  const username = normalizeUsername(input.username ?? "");
  const bio = (input.bio ?? "").trim();

  if (displayName.length < 2 || displayName.length > 32) errors.displayName = "Nama tampilan harus 2–32 karakter.";
  if (username && (!/^[a-z0-9_]{3,20}$/.test(username) || FORBIDDEN_USERNAMES.includes(username as typeof FORBIDDEN_USERNAMES[number]))) errors.username = "Username harus 3–20 karakter: huruf kecil, angka, atau garis bawah.";
  if (bio.length > 120) errors.bio = "Epitaf pribadi maksimal 120 karakter.";
  return errors;
}

export function isProfileValid(input: ProfileValidationInput): boolean {
  return Object.keys(validateProfile(input)).length === 0;
}
