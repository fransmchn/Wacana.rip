import type { ReactNode } from "react";

interface BadgeProps { tone?: "neutral" | "accent" | "gold" | "success" | "danger"; children: ReactNode; className?: string; }

export function Badge({ tone = "neutral", children, className = "" }: BadgeProps) {
  return <span className={`ui-badge ui-badge-${tone} ${className}`}>{children}</span>;
}
