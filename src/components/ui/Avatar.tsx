/* eslint-disable @next/next/no-img-element */

interface AvatarProps { name?: string; initials?: string; src?: string | null; size?: "sm" | "md" | "lg"; }

export function Avatar({ name = "Anonim", initials: providedInitials, src, size = "md" }: AvatarProps) {
  const initials = providedInitials || name.trim().slice(0, 2).toUpperCase() || "A";
  const preset = src?.startsWith("preset:") ? src.slice("preset:".length) : null;
  return <span className={`ui-avatar ui-avatar-${size}`} aria-label={`Avatar ${name}`}>{preset ? <PresetAvatar preset={preset} /> : src ? <img src={src} alt="" loading={size === "lg" ? "eager" : "lazy"} decoding="async" width={size === "lg" ? 80 : size === "md" ? 40 : 32} height={size === "lg" ? 80 : size === "md" ? 40 : 32} /> : initials}</span>;
}

function PresetAvatar({ preset }: { preset: string }) {
  const symbols: Record<string, string> = { hantu: "M50 18c-18 0-30 14-30 32v27l8-6 8 6 8-6 8 6 8-6 8 6V50c0-18-10-32-18-32Z", lilin: "M39 75h22V42H39Zm0-38h22l-6-9H45Z", bunga: "M50 78V51M50 55c-18 2-27-14-10-21 8-3 13 5 10 21Zm0 0c18 2 27-14 10-21-8-3-13 5-10 21Z", tengkorak: "M31 49c0-18 11-29 19-29s19 11 19 29c0 11-7 15-12 18v8H43v-8c-5-3-12-7-12-18Z", nisan: "M29 78V43c0-14 9-23 21-23s21 9 21 23v35Z", kelelawar: "M18 43l15 5 17-10 17 10 15-5-8 19-10-5-14 16-14-16-10 5Z" };
  return <svg viewBox="0 0 100 100" aria-hidden="true" className="ui-avatar-preset"><path d={symbols[preset] ?? symbols.hantu} /></svg>;
}
