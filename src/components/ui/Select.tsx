import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  children: React.ReactNode;
}

export function Select({ label, id, helperText, error, className = "", children, ...props }: SelectProps) {
  return <label className="ui-field">
    {label && <span className="ui-field-label">{label}</span>}
    <select {...props} id={id} aria-invalid={Boolean(error)} className={`ui-select ${className}`}>{children}</select>
    {(error || helperText) && <span className={`ui-field-help ${error ? "ui-field-error" : ""}`}>{error ?? helperText}</span>}
  </label>;
}
