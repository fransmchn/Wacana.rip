import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  showCounter?: boolean;
}

export function Textarea({ label, id, helperText, error, showCounter = false, maxLength, value, defaultValue, className = "", ...props }: TextareaProps) {
  const count = typeof value === "string" ? value.length : typeof defaultValue === "string" ? defaultValue.length : undefined;
  return <label className="ui-field">
    {label && <span className="ui-field-label"><span>{label}</span>{showCounter && maxLength && <span className="ui-counter">{count ?? 0}/{maxLength}</span>}</span>}
    <textarea {...props} id={id} maxLength={maxLength} value={value} defaultValue={defaultValue} aria-invalid={Boolean(error)} className={`ui-textarea ${className}`} />
    {(error || helperText) && <span className={`ui-field-help ${error ? "ui-field-error" : ""}`}>{error ?? helperText}</span>}
  </label>;
}
