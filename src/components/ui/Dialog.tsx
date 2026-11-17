"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "./IconButton";

interface DialogProps { open: boolean; title: string; onClose: () => void; children: ReactNode; className?: string; }

export function Dialog({ open, title, onClose, children, className = "" }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    const first = dialogRef.current?.querySelector<HTMLElement>("[data-autofocus], button, input, select, textarea, [tabindex=\"0\"]");
    first?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusables = [...dialogRef.current.querySelectorAll<HTMLElement>("button, input, select, textarea, [tabindex=\"0\"]")].filter((item) => !item.hasAttribute("disabled"));
      if (!focusables.length) return;
      const index = focusables.indexOf(document.activeElement as HTMLElement);
      const next = event.shiftKey ? (index <= 0 ? focusables.length - 1 : index - 1) : (index === focusables.length - 1 ? 0 : index + 1);
      event.preventDefault(); focusables[next].focus();
    };
    document.addEventListener("keydown", handler);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = previousOverflow; window.requestAnimationFrame(() => { if (previousFocus.current?.isConnected) previousFocus.current.focus(); else document.querySelector<HTMLElement>("[aria-label=\"Menu profil\"]")?.focus(); }); };
  }, [open, onClose]);
  if (!open) return null;
  return <div className="ui-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`ui-dialog ${className}`}><div className="ui-dialog-header"><h2 id={titleId}>{title}</h2><IconButton label="Tutup" onClick={onClose}><X size={18} /></IconButton></div>{children}</div></div>;
}
