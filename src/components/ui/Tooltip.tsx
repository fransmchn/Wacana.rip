import type { ReactNode } from "react";

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return <span className="ui-tooltip-wrap"><span className="ui-tooltip" role="tooltip">{label}</span>{children}</span>;
}
