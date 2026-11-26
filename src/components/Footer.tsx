"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  function handleBrandClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (pathname === "/") {
      event.preventDefault();
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    }
  }

  return (
    <footer className="site-footer">
      <div className="container-shell site-footer-inner">
        <div>
          <Link href="/" onClick={handleBrandClick} className="brand-mark cursor-pointer" aria-label="GRAVEYARD — kembali ke beranda">
            <span className="brand-symbol" aria-hidden="true">✦</span>
            <span>GRAVEYARD</span>
          </Link>
          <p className="site-footer-tagline">Monumen Digital bagi Mimpi, Skripsi, dan Rencana yang Gugur di Medan Juang.</p>
        </div>
        <div className="site-footer-meta">
          <p>© {new Date().getFullYear()} GRAVEYARD · graveyard.rip</p>
        </div>
      </div>
    </footer>
  );
}
