/* eslint-disable @next/next/no-img-element */

interface AvatarProps { name?: string; initials?: string; src?: string | null; size?: "sm" | "md" | "lg"; }

export function Avatar({ name = "Anonim", initials: providedInitials, src, size = "md" }: AvatarProps) {
  const initials = providedInitials || name.trim().slice(0, 2).toUpperCase() || "A";
  return <span className={`ui-avatar ui-avatar-${size}`} aria-label={`Avatar ${name}`}>{src ? <img src={src} alt="" /> : initials}</span>;
}
