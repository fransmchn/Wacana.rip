"use client";

import { LogOut, Pencil, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { DropdownItem, DropdownLabel, DropdownMenu, DropdownSeparator } from "@/components/ui/DropdownMenu";
import { IconButton } from "@/components/ui/IconButton";
import type { ProfileDisplay } from "@/lib/profile";

interface HeaderProps {
  onBury: () => void;
  profile?: ProfileDisplay;
  onLogin: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
  ctaVisible?: boolean;
}

export function Header({ onBury, profile, onLogin, onEditProfile, onLogout, ctaVisible = false }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 8); window.addEventListener("scroll", onScroll, { passive: true }); onScroll(); return () => window.removeEventListener("scroll", onScroll); }, []);
  return <header className={`site-header ${scrolled ? "site-header-scrolled" : ""}`}><div className="container-shell site-header-inner">
    <a href="#main" className="brand-mark"><span className="brand-symbol" aria-hidden="true">✦</span><span>WACANA.RIP</span></a>
    <div className="site-header-actions">
      {!profile && <Button variant="secondary" size="md" onClick={onLogin}>Masuk</Button>}
      <Button className={`header-cta-desktop ${ctaVisible ? "header-cta-hidden" : ""}`} size="md" onClick={onBury}><Plus size={16} strokeWidth={2.5} aria-hidden="true" />Kuburkan Wacana</Button>
      <IconButton className="header-cta-mobile" variant="primary" size="md" label="Kuburkan wacana" onClick={onBury}><Plus size={18} strokeWidth={2.5} aria-hidden="true" /></IconButton>
      {profile && <DropdownMenu label="Menu profil" trigger={<Avatar name={profile.name} initials={profile.initials} src={profile.avatarUrl} size="md" />}>
        <DropdownLabel><span className="ui-profile-menu-head"><Avatar name={profile.name} initials={profile.initials} src={profile.avatarUrl} size="md" /><span><strong>{profile.name}</strong><small>{profile.email}</small></span></span></DropdownLabel>
        <DropdownSeparator /><DropdownItem icon={<Pencil size={16} />} onSelect={onEditProfile}>Edit profil</DropdownItem><DropdownItem icon={<LogOut size={16} />} danger onSelect={onLogout}>Keluar</DropdownItem>
      </DropdownMenu>}
    </div>
  </div></header>;
}
