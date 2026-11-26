"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Pencil, Plus, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { DropdownItem, DropdownLabel, DropdownMenu, DropdownSeparator } from "@/components/ui/DropdownMenu";
import { IconButton } from "@/components/ui/IconButton";
import type { ProfileDisplay } from "@/lib/profile";

interface HeaderProps {
  onBury: () => void;
  profile?: ProfileDisplay;
  onHome?: () => void;
  onLogin: () => void;
  onProfile?: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
  ctaVisible?: boolean;
  profileMenuOpen?: boolean;
}

export function Header({ onBury, profile, onHome, onLogin, onProfile, onEditProfile, onLogout, ctaVisible = false, profileMenuOpen = false }: HeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleBrandClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (pathname === "/") {
      event.preventDefault();
      onHome?.();
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    }
  }

  return (
    <header className={`site-header ${scrolled ? "site-header-scrolled" : ""}`}>
      <div className="container-shell site-header-inner">
        <Link href="/" onClick={handleBrandClick} className="brand-mark cursor-pointer" aria-label="GRAVEYARD — kembali ke beranda">
          <span className="brand-symbol" aria-hidden="true">✦</span>
          <span>GRAVEYARD</span>
        </Link>
        <div className="site-header-actions">
          {!profile && <Button variant="secondary" size="md" onClick={onLogin}>Masuk</Button>}
          <Button className={`header-cta-desktop ${ctaVisible ? "header-cta-hidden" : ""}`} size="md" onClick={onBury}>
            <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
            Kuburkan Mimpi
          </Button>
          <IconButton className="header-cta-mobile" variant="primary" size="md" label="Kuburkan wacana" onClick={onBury}>
            <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
          </IconButton>
          {profile && (
            <DropdownMenu defaultOpen={profileMenuOpen} label="Menu profil" trigger={<Avatar name={profile.name} initials={profile.initials} src={profile.avatarUrl} tone={profile.avatarTone} size="md" />}>
              <DropdownLabel>
                <span className="ui-profile-menu-head">
                  <Avatar name={profile.name} initials={profile.initials} src={profile.avatarUrl} tone={profile.avatarTone} size="md" />
                  <span><strong>{profile.name}</strong><small>{profile.email}</small></span>
                </span>
              </DropdownLabel>
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
