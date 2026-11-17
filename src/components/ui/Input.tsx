import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function Input({ label, id, helperText, error, leading, trailing, className = "", ...props }: InputProps) {
  return <label className="ui-field">
    {label && <span className="ui-field-label">{label}</span>}
    <span className="ui-control-wrap">
      {leading && <span className="ui-control-leading" aria-hidden="true">{leading}</span>}
      <input {...props} id={id} aria-invalid={Boolean(error)} className={`ui-input ${leading ? "ui-input-leading" : ""} ${trailing ? "ui-input-trailing" : ""} ${className}`} />
      {trailing && <span className="ui-control-trailing">{trailing}</span>}
    </span>
    {(error || helperText) && <span className={`ui-field-help ${error ? "ui-field-error" : ""}`}>{error ?? helperText}</span>}
  </label>;
}
