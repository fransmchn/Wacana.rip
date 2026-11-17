import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

export type ButtonSize = "sm" | "md" | "lg";
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ size = "md", variant = "primary", loading = false, disabled, className = "", children, ...props }, ref) {
  return <button {...props} ref={ref} disabled={disabled || loading} className={`ui-button ui-button-${size} ui-button-${variant} ${className}`}>
    {loading && <LoaderCircle className="ui-spinner" size={size === "lg" ? 18 : 16} aria-hidden="true" />}
    <span>{children}</span>
  </button>;
});
