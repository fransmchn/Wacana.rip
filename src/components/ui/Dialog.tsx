"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "./IconButton";

interface DialogProps { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; className?: string; }

/**
 * Dialog stack: hanya dialog paling atas yang merespons Escape/backdrop, dan
 * body scroll baru dikembalikan setelah dialog terakhir ditutup.
 */
const dialogStack: string[] = [];
let savedOverflow = "";
let savedPadding = "";

function pushDialog(id: string): number {
  if (!dialogStack.includes(id)) dialogStack.push(id);
  if (dialogStack.length === 1 && typeof document !== "undefined") {
    savedOverflow = document.body.style.overflow;
    savedPadding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
  }
  return dialogStack.length;
}

function popDialog(id: string): number {
  const index = dialogStack.indexOf(id);
  if (index !== -1) dialogStack.splice(index, 1);
  if (dialogStack.length === 0 && typeof document !== "undefined") {
    document.body.style.overflow = savedOverflow;
    document.body.style.paddingRight = savedPadding;
  }
  return dialogStack.length;
}

function isTopDialog(id: string): boolean {
  return dialogStack[dialogStack.length - 1] === id;
}

export function Dialog({ open, title, onClose, children, footer, className = "" }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();
  const [bodyState, setBodyState] = useState("");
  const [depth, setDepth] = useState(1);

  useEffect(() => {
    const body = dialogRef.current?.querySelector<HTMLElement>(".ui-dialog-body");
    if (!open || !body) return;
    const updateBodyState = () => {
      const scrollable = body.scrollHeight > body.clientHeight + 1;
      const scrolled = body.scrollTop > 1;
      const atBottom = body.scrollTop + body.clientHeight >= body.scrollHeight - 1;
      setBodyState(`${scrollable ? "is-scrollable" : ""} ${scrolled ? "is-scrolled" : ""} ${atBottom ? "is-at-bottom" : ""}`);
    };
    updateBodyState();
    body.addEventListener("scroll", updateBodyState, { passive: true });
    window.addEventListener("resize", updateBodyState);
    return () => { body.removeEventListener("scroll", updateBodyState); window.removeEventListener("resize", updateBodyState); };
  }, [open, children]);

  useEffect(() => {
    if (!open) return;
    const id = `${titleId}-dialog`;
    previousFocus.current = document.activeElement as HTMLElement | null;
    setDepth(pushDialog(id));
    const first = dialogRef.current?.querySelector<HTMLElement>("[data-autofocus], button, input, select, textarea, [tabindex=\"0\"]");
    window.requestAnimationFrame(() => first?.focus());
    const handler = (event: KeyboardEvent) => {
      if (!isTopDialog(id)) return;
      if (event.key === "Escape") { event.preventDefault(); onCloseRef.current(); return; }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusables = [...dialogRef.current.querySelectorAll<HTMLElement>("button, input, select, textarea, [tabindex=\"0\"]")].filter((item) => !item.hasAttribute("disabled"));
      if (!focusables.length) return;
      const index = focusables.indexOf(document.activeElement as HTMLElement);
      const next = event.shiftKey ? (index <= 0 ? focusables.length - 1 : index - 1) : (index === focusables.length - 1 ? 0 : index + 1);
      event.preventDefault(); focusables[next].focus();
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      const remaining = popDialog(id);
      if (remaining === 0) {
        window.requestAnimationFrame(() => {
          if (previousFocus.current?.isConnected) previousFocus.current.focus();
          else document.querySelector<HTMLElement>("[aria-label=\"Menu profil\"]")?.focus();
        });
      }
    };
  }, [open, titleId]);

  if (!open) return null;
  return (
    <div
      className="ui-dialog-backdrop"
      style={{ zIndex: 50 + depth * 10 }}
      onMouseDown={(event) => { if (event.target === event.currentTarget && isTopDialog(`${titleId}-dialog`)) onCloseRef.current(); }}
    >
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`ui-dialog ${className}`}>
        <div className="ui-dialog-header"><h2 id={titleId}>{title}</h2><IconButton label="Tutup" onClick={onClose}><X size={18} /></IconButton></div>
        <div className={`ui-dialog-body ${bodyState}`}>{children}</div>
        {footer && <div className="ui-dialog-footer">{footer}</div>}
      </div>
    </div>
  );
}
