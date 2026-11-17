import type { InputHTMLAttributes } from "react";

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
}

export function Switch({ label, description, className = "", ...props }: SwitchProps) {
  return <label className={`ui-switch ${className}`}>
    <input {...props} type="checkbox" className="ui-switch-input" />
    <span className="ui-switch-track" aria-hidden="true"><span className="ui-switch-thumb" /></span>
    <span><span className="ui-switch-label">{label}</span>{description && <span className="ui-switch-description">{description}</span>}</span>
  </label>;
}
