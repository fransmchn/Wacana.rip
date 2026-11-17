import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, id, helperText, error, leading, trailing, className = "", ...props }, ref) {
  const feedbackId = id ? `${id}-feedback` : undefined;
  const describedBy = props["aria-describedby"] ?? (feedbackId && (error || helperText) ? feedbackId : undefined);
  return <label className="ui-field">
    {label && <span className="ui-field-label">{label}</span>}
    <span className="ui-control-wrap">
      {leading && <span className="ui-control-leading" aria-hidden="true">{leading}</span>}
      <input {...props} ref={ref} id={id} aria-describedby={describedBy} aria-invalid={Boolean(error)} className={`ui-input ${leading ? "ui-input-leading" : ""} ${trailing ? "ui-input-trailing" : ""} ${className}`} />
      {trailing && <span className="ui-control-trailing">{trailing}</span>}
    </span>
    {(error || helperText) && <span id={feedbackId} className={`ui-field-help ${error ? "ui-field-error" : ""}`}>{error ?? helperText}</span>}
  </label>;
});
