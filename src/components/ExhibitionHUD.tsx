"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Pencil, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { DropdownItem, DropdownLabel, DropdownMenu, DropdownSeparator } from "@/components/ui/DropdownMenu";
import { formatCompactRupiah } from "@/lib/utils";
import type { ProfileDisplay } from "@/lib/profile";
import type { Statistik } from "@/types/graveyard";

interface ExhibitionHUDProps {
  statistik: Statistik;
  profile?: ProfileDisplay;
  profileMenuOpen?: boolean;
  onHome?: () => void;
  onBury: () => void;
  onLogin: () => void;
  onProfile?: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
}

/** Floating exhibition HUD: emblem, live pulse, profile, and the only primary action. */
export function ExhibitionHUD({ statistik, profile, profileMenuOpen = false, onHome, onBury, onLogin, onProfile, onEditProfile, onLogout }: ExhibitionHUDProps) {
  const pathname = usePathname();
  const pulse = `${statistik.totalMakam} Gugur · ${formatCompactRupiah(statistik.totalRupiah)} Kerugian · ${statistik.totalJam} Jam`;

  function handleBrandClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (pathname === "/") {
      event.preventDefault();
      onHome?.();
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    }
  }

  return (
    <header className="exhibition-hud">
      <div className="hud-frame container-shell">
        <div className="hud-identity">
          <Link href="/" onClick={handleBrandClick} className="hud-brand cursor-pointer" aria-label="GRAVEYARD — kembali ke beranda">
            <span className="hud-emblem" aria-hidden="true">✦</span>
            <span className="hud-brand-copy">
              <strong>GRAVEYARD</strong>
              <small>Monumen Digital bagi Mimpi, Skripsi, dan Rencana yang Gugur di Medan Juang</small>
            </span>
          </Link>
          <p className="hud-pulse" aria-label={pulse}>
            <span className="hud-pulse-dot" aria-hidden="true" />
            <span><b>{statistik.totalMakam}</b> Gugur</span>
            <i aria-hidden="true">•</i>
            <span><b>{formatCompactRupiah(statistik.totalRupiah)}</b> Kerugian</span>
            <i aria-hidden="true">•</i>
            <span><b>{statistik.totalJam}</b> Jam</span>
          </p>
        </div>

        <div className="hud-actions">
          {!profile && <Button variant="secondary" size="sm" onClick={onLogin}>Masuk</Button>}
          <Button className="hud-bury" size="sm" onClick={onBury} aria-label="+ Kuburkan Mimpi">
            <span className="hud-plus" aria-hidden="true">+</span>
            <span className="hud-bury-full">Kuburkan Mimpi</span>
            <span className="hud-bury-short">Kubur</span>
          </Button>
          {profile && (
            <DropdownMenu defaultOpen={profileMenuOpen} label="Menu profil" trigger={
              <span className="hud-profile-pill">
                <Avatar name={profile.name} initials={profile.initials} src={profile.avatarUrl} tone={profile.avatarTone} size="sm" />
                <span className="hud-profile-name">{profile.name}</span>
              </span>
            }>
              <DropdownLabel><span className="ui-profile-menu-head"><Avatar name={profile.name} initials={profile.initials} src={profile.avatarUrl} tone={profile.avatarTone} size="md" /><span><strong>{profile.name}</strong><small>{profile.email}</small></span></span></DropdownLabel>
              <DropdownSeparator />
              {onProfile && <DropdownItem icon={<UserRound size={16} />} onSelect={onProfile}>Profil & makam saya</DropdownItem>}
              <DropdownItem icon={<Pencil size={16} />} onSelect={onEditProfile}>Edit profil</DropdownItem>
              <DropdownItem icon={<LogOut size={16} />} danger onSelect={onLogout}>Keluar</DropdownItem>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
