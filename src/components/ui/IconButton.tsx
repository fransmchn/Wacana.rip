import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import type { ButtonSize, ButtonVariant } from "./Button";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
}

export function IconButton({ label, size = "md", variant = "ghost", loading = false, disabled, className = "", children, ...props }: IconButtonProps) {
  return <button {...props} type={props.type ?? "button"} disabled={disabled || loading} aria-label={label} className={`ui-icon-button ui-button-${size} ui-button-${variant} ${className}`}>
    {loading ? <LoaderCircle className="ui-spinner" size={size === "lg" ? 18 : 16} aria-hidden="true" /> : children}
  </button>;
}
