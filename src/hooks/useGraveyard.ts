"use client";

import { useCallback, useEffect, useState } from "react";
import { createMakam, getStatistik, listMakam, taburBunga, tambahKomentar, toggleLilin } from "@/lib/graveyardService";
import type { CreateMakamInput, KomentarInput, Makam, Statistik } from "@/types/graveyard";

interface UseGraveyard {
  makam: Makam[]; statistik: Statistik; loading: boolean; error: string | null; refresh: () => Promise<void>;
  kuburkan: (input: CreateMakamInput) => Promise<Makam>; bunga: (id: string) => Promise<void>; lilin: (id: string) => Promise<void>; komentar: (id: string, input: KomentarInput) => Promise<void>;
}
const emptyStats: Statistik = { totalMakam: 0, totalBunga: 0, totalRupiah: 0, totalJam: 0 };

export function useGraveyard(): UseGraveyard {
  const [makam, setMakam] = useState<Makam[]>([]); const [statistik, setStatistik] = useState<Statistik>(emptyStats); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => { setLoading(true); try { const [nextMakam, nextStatistik] = await Promise.all([listMakam(), getStatistik()]); setMakam(nextMakam); setStatistik(nextStatistik); setError(null); } catch (reason) { setError(reason instanceof Error ? reason.message : "Pemakaman sedang berkabut."); } finally { setLoading(false); } }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const runAction = useCallback(async (action: () => Promise<Makam>) => { try { const updated = await action(); setMakam((current) => current.some((item) => item.id === updated.id) ? current.map((item) => item.id === updated.id ? updated : item) : [updated, ...current]); setStatistik(await getStatistik()); setError(null); } catch (reason) { setError(reason instanceof Error ? reason.message : "Ritual gagal dilakukan."); throw reason; } }, []);
  return { makam, statistik, loading, error, refresh, kuburkan: async (input) => { let result: Makam | undefined; await runAction(async () => { result = await createMakam(input); return result; }); if (!result) throw new Error("Makam gagal dibuat."); return result; }, bunga: async (id) => runAction(() => taburBunga(id)), lilin: async (id) => runAction(() => toggleLilin(id)), komentar: async (id, input) => runAction(() => tambahKomentar(id, input)) };
}
