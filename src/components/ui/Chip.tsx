import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: ReactNode;
}

export function Chip({ active = false, className = "", children, ...props }: ChipProps) {
  return <button {...props} type={props.type ?? "button"} aria-pressed={active} className={`ui-chip ${active ? "ui-chip-active" : ""} ${className}`}>{children}</button>;
}
