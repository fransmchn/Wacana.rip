/* eslint-disable @next/next/no-img-element */

interface AvatarProps { name?: string; src?: string | null; size?: "sm" | "md" | "lg"; }

export function Avatar({ name = "Anonim", src, size = "md" }: AvatarProps) {
  const initials = name.trim().slice(0, 2).toUpperCase() || "A";
  return <span className={`ui-avatar ui-avatar-${size}`} aria-label={`Avatar ${name}`}>{src ? <img src={src} alt="" /> : initials}</span>;
}
