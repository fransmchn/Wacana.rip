"use client";

import { Check, Crown, Lock } from "lucide-react";
import { FREE_TEMAS, VIP_TEMAS, getTemaNisan } from "@/lib/themes";
import type { NisanTema } from "@/types/graveyard";

interface ThemePickerProps {
  value: NisanTema;
  onChange: (tema: NisanTema) => void;
  vipUnlocked: boolean;
  previewTitle: string;
  onUpgrade: () => void;
}

export function ThemePicker({ value, onChange, vipUnlocked, previewTitle, onUpgrade }: ThemePickerProps) {
  const selected = getTemaNisan(value);
  const lockedPreview = selected.vip && !vipUnlocked;

  return (
    <section className="theme-picker" aria-labelledby="theme-picker-title">
      <div className="theme-picker-heading">
        <div><h3 id="theme-picker-title">Pilih batu nisan</h3><p>Tema gratis bertahan 7 hari. Tema VIP permanen dan lebih besar.</p></div>
        <span className="theme-picker-count">02 gratis · 04 VIP</span>
      </div>

      <div className="theme-groups">
        <ThemeGroup label="Batu biasa" hint="7 hari">
          {FREE_TEMAS.map((tema) => <ThemeOption key={tema.id} tema={tema} active={value === tema.id} locked={false} onSelect={onChange} />)}
        </ThemeGroup>
        <ThemeGroup label="Makam Abadi" hint="permanen">
          {VIP_TEMAS.map((tema) => <ThemeOption key={tema.id} tema={tema} active={value === tema.id} locked={!vipUnlocked} onSelect={onChange} />)}
        </ThemeGroup>
      </div>

      <div className={`theme-preview theme-preview-${value}`}>
        <div className="theme-preview-stone" aria-hidden="true"><span className="theme-preview-crown">{selected.vip ? <Crown size={14} /> : null}</span></div>
        <div className="theme-preview-copy">
          <span className="theme-preview-label">{lockedPreview ? "Pratinjau VIP" : selected.vip ? "Monumen Abadi" : "Nisan sementara"}</span>
          <strong>{previewTitle.trim() || "Judul wacana kamu"}</strong>
          <small>{selected.label} · {selected.vip ? "tidak tererosi" : "Terkubur dalam 7 hari"}</small>
        </div>
      </div>

      {lockedPreview && (
        <div className="theme-unlock-banner" role="status">
          <div><Lock size={15} aria-hidden="true" /><span><strong>{selected.label} terkunci.</strong> Lihat hasilnya di nisanmu, lalu abadikan dengan sekali bayar.</span></div>
          <button type="button" onClick={onUpgrade}>Buka Semua Tema &amp; Abadikan (VIP - Rp 15.000)</button>
        </div>
      )}
    </section>
  );
}

function ThemeGroup({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return <div className="theme-group"><p className="theme-group-label">{label} <span>· {hint}</span></p><div className="theme-swatches">{children}</div></div>;
}

function ThemeOption({ tema, active, locked, onSelect }: { tema: ReturnType<typeof getTemaNisan>; active: boolean; locked: boolean; onSelect: (id: NisanTema) => void }) {
  return (
    <button type="button" className={`theme-swatch theme-swatch-${tema.id} ${active ? "theme-swatch-active" : ""} ${locked ? "theme-swatch-locked" : ""}`} aria-pressed={active} aria-label={`${tema.label}${locked ? " (VIP terkunci)" : ""}`} onClick={() => onSelect(tema.id)}>
      <span className="theme-swatch-stone" aria-hidden="true">{tema.vip ? <Crown size={13} /> : null}</span>
      <span className="theme-swatch-name">{tema.label}</span>
      <span className="theme-swatch-tag">{locked ? <><Lock size={9} aria-hidden="true" /> VIP</> : active ? <><Check size={9} aria-hidden="true" /> Dipilih</> : tema.short}</span>
    </button>
  );
}
