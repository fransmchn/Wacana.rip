"use client";

import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";

interface DropdownMenuProps { trigger: ReactNode; label?: string; children: ReactNode; align?: "start" | "end"; defaultOpen?: boolean; }
interface DropdownItemProps { children: ReactNode; icon?: ReactNode; danger?: boolean; onSelect?: () => void; disabled?: boolean; }
interface DropdownContextValue { close: () => void; }

const DropdownContext = createContext<DropdownContextValue | null>(null);

export function DropdownMenu({ trigger, label = "Menu", children, align = "end", defaultOpen = false }: DropdownMenuProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [placement, setPlacement] = useState<"down" | "up">("down");
  const [resolvedAlign, setResolvedAlign] = useState(align);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) close(); };
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close(); return; }
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      const items = getItems();
      if (!items.length) return;
      event.preventDefault();
      const index = items.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : event.key === "ArrowDown" ? (index + 1) % items.length : (index <= 0 ? items.length - 1 : index - 1);
      items[next].focus();
    };
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      const menuWidth = 240;
      setPlacement(window.innerHeight - rect.bottom < 280 && rect.top > 280 ? "up" : "down");
      setResolvedAlign(align === "start" && rect.left + menuWidth > window.innerWidth - 16 ? "end" : align === "end" && rect.right - menuWidth < 16 ? "start" : align);
    }
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", handleKeydown);
    getItems()[0]?.focus();
    return () => { document.removeEventListener("mousedown", closeOnOutside); document.removeEventListener("keydown", handleKeydown); };
  }, [align, open]);

  function getItems() { return [...(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]:not([disabled])") ?? [])]; }
  function close() { setOpen(false); window.requestAnimationFrame(() => triggerRef.current?.focus()); }
  function handleTriggerKeydown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    setOpen(true);
  }

  return <div ref={rootRef} className="ui-menu-root">
    <button ref={triggerRef} type="button" aria-haspopup="menu" aria-expanded={open} aria-controls={menuId} aria-label={label} onClick={() => open ? close() : setOpen(true)} onKeyDown={handleTriggerKeydown}>{trigger}</button>
    {open && <DropdownContext.Provider value={{ close }}><div ref={menuRef} id={menuId} role="menu" aria-label={label} className={`ui-menu ui-menu-${resolvedAlign} ui-menu-${placement}`}>{children}</div></DropdownContext.Provider>}
  </div>;
}

export function DropdownLabel({ children }: { children: ReactNode }) { return <div className="ui-menu-label">{children}</div>; }
export function DropdownSeparator() { return <div className="ui-menu-separator" role="separator" />; }
export function DropdownItem({ children, icon, danger = false, onSelect, disabled = false }: DropdownItemProps) {
  const context = useContext(DropdownContext);
  return <button type="button" role="menuitem" disabled={disabled} className={`ui-menu-item ${danger ? "ui-menu-item-danger" : ""}`} onClick={() => { onSelect?.(); context?.close(); }}>{icon && <span aria-hidden="true">{icon}</span>}<span>{children}</span></button>;
}
