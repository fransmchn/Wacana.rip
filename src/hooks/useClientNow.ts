"use client";

import { useEffect, useState } from "react";

/** Null saat render server/first paint; dipakai agar perhitungan erosi tidak beda saat hydration. */
export function useClientNow(): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); }, []);
  return now;
}
