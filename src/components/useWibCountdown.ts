"use client";

import { useEffect, useState } from "react";

function formatCountdown(target: string | undefined, now: number): string | undefined {
  if (!target) return undefined;
  const remaining = Math.max(0, new Date(target).getTime() - now);
  const totalSeconds = Math.floor(remaining / 1000);
  if (totalSeconds === 0) return "sebentar lagi";
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function useWibCountdown(targets: string[]): Record<string, string | undefined> {
  const [now, setNow] = useState(() => Date.now());
  const targetKey = targets.join("|");
  useEffect(() => {
    if (!targetKey) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [targetKey]);
  return Object.fromEntries(targets.map((target) => [target, formatCountdown(target, now)]));
}
