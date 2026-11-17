import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: ReactNode;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip({ active = false, className = "", children, ...props }, ref) {
  return <button {...props} ref={ref} type={props.type ?? "button"} aria-pressed={active} className={`ui-chip ${active ? "ui-chip-active" : ""} ${className}`}>{children}</button>;
});
