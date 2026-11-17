"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface DropdownMenuProps { trigger: ReactNode; label?: string; children: ReactNode; align?: "start" | "end"; }
interface DropdownItemProps { children: ReactNode; icon?: ReactNode; danger?: boolean; onSelect?: () => void; disabled?: boolean; }

export function DropdownMenu({ trigger, label = "Menu", children, align = "end" }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"down" | "up">("down");
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) close(); };
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close(); return; }
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      const items = getItems();
      if (!items.length) return;
      event.preventDefault();
      const index = items.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : event.key === "ArrowDown" ? (index + 1) % items.length : (index <= 0 ? items.length - 1 : index - 1);
      items[next].focus();
    };
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", keydown);
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) setPlacement(window.innerHeight - rect.bottom < 280 && rect.top > 280 ? "up" : "down");
    getItems()[0]?.focus();
    return () => { document.removeEventListener("mousedown", outside); document.removeEventListener("keydown", keydown); };
  }, [open]);
  function getItems() { return [...(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]:not([disabled])") ?? [])]; }
  function close() { setOpen(false); window.requestAnimationFrame(() => triggerRef.current?.focus()); }
  return <div ref={rootRef} className="ui-menu-root">
    <button ref={triggerRef} type="button" aria-haspopup="menu" aria-expanded={open} aria-label={label} onClick={() => setOpen((value) => !value)}>{trigger}</button>
    {open && <div ref={menuRef} role="menu" aria-label={label} className={`ui-menu ui-menu-${align} ui-menu-${placement}`}>{children}</div>}
  </div>;
}

export function DropdownLabel({ children }: { children: ReactNode }) { return <div className="ui-menu-label">{children}</div>; }
export function DropdownSeparator() { return <div className="ui-menu-separator" role="separator" />; }
export function DropdownItem({ children, icon, danger = false, onSelect, disabled = false }: DropdownItemProps) { return <button type="button" role="menuitem" disabled={disabled} className={`ui-menu-item ${danger ? "ui-menu-item-danger" : ""}`} onClick={onSelect}>{icon && <span aria-hidden="true">{icon}</span>}<span>{children}</span></button>; }
