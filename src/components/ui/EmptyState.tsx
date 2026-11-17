import type { ReactNode } from "react";
import { Button } from "./Button";

interface EmptyStateProps { title: string; description?: string; actionLabel?: string; onAction?: () => void; icon?: ReactNode; }

export function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
  return <div className="ui-empty-state"><div className="ui-empty-icon">{icon ?? "✦"}</div><h2>{title}</h2>{description && <p>{description}</p>}{actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}</div>;
}
