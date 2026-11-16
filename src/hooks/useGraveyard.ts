"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BungaSudahDitaburError,
  createMakam,
  getLilinSaya,
  getStatistik,
  getStatusBungaHariIni,
  listMakam,
  taburBunga,
  tambahKomentar,
  toggleLilin,
  type BungaHariIni,
} from "@/lib/graveyardService";
import type { CreateMakamInput, KomentarInput, Makam, Statistik } from "@/types/graveyard";

interface UseGraveyard {
  makam: Makam[];
  statistik: Statistik;
  loading: boolean;
  error: string | null;
  bungaStatus: Record<string, BungaHariIni>;
  lilinSaya: Set<string>;
  refresh: () => Promise<void>;
  refreshPersonalStatus: (userId: string | undefined, ids: string[]) => Promise<void>;
  kuburkan: (input: CreateMakamInput) => Promise<Makam>;
  bunga: (id: string) => Promise<void>;
  lilin: (id: string) => Promise<void>;
  komentar: (id: string, input: KomentarInput) => Promise<void>;
}

const emptyStats: Statistik = { totalMakam: 0, totalBunga: 0, totalRupiah: 0, totalJam: 0 };

export function useGraveyard(): UseGraveyard {
  const [makam, setMakam] = useState<Makam[]>([]);
  const [statistik, setStatistik] = useState<Statistik>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bungaStatus, setBungaStatus] = useState<Record<string, BungaHariIni>>({});
  const [lilinSaya, setLilinSaya] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [nextMakam, nextStatistik] = await Promise.all([listMakam(), getStatistik()]);
      setMakam(nextMakam);
      setStatistik(nextStatistik);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Pemakaman sedang berkabut.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPersonalStatus = useCallback(async (userId: string | undefined, ids: string[]) => {
    if (!userId) {
      setBungaStatus({});
      setLilinSaya(new Set());
      return;
    }
    try {
      const [nextBunga, nextLilin] = await Promise.all([getStatusBungaHariIni(ids), getLilinSaya(ids)]);
      setBungaStatus(nextBunga);
      setLilinSaya(new Set(nextLilin.ids));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Status peziarah gagal dimuat.");
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const replaceMakam = useCallback((updated: Makam) => {
    setMakam((current) => current.some((item) => item.id === updated.id) ? current.map((item) => item.id === updated.id ? updated : item) : [updated, ...current]);
  }, []);

  const refreshStats = useCallback(async () => setStatistik(await getStatistik()), []);

  const bunga = useCallback(async (id: string) => {
    const current = makam.find((item) => item.id === id);
    const previousStatus = bungaStatus[id];
    if (!current || previousStatus?.sudahMenabur) return;
    const serverNow = new Date().toISOString();
    const optimisticStatus = { sudahMenabur: true, serverNow, berlakuHingga: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() };
    setBungaStatus((state) => ({ ...state, [id]: optimisticStatus }));
    setMakam((state) => state.map((item) => item.id === id ? { ...item, bunga: item.bunga + 1 } : item));
    try {
      const updated = await taburBunga(id);
      replaceMakam(updated);
      const confirmedStatus = await getStatusBungaHariIni([id]);
      setBungaStatus((state) => ({ ...state, ...confirmedStatus }));
      await refreshStats();
      setError(null);
    } catch (reason) {
      if (reason instanceof BungaSudahDitaburError) {
        setBungaStatus((state) => ({ ...state, [id]: { ...optimisticStatus, sudahMenabur: true } }));
        replaceMakam(current);
        await refreshStats();
        return;
      }
      setBungaStatus((state) => previousStatus ? { ...state, [id]: previousStatus } : Object.fromEntries(Object.entries(state).filter(([key]) => key !== id)));
      replaceMakam(current);
      setError(reason instanceof Error ? reason.message : "Bunga gagal ditaburkan.");
    }
  }, [bungaStatus, makam, refreshStats, replaceMakam]);

  const lilin = useCallback(async (id: string) => {
    const current = makam.find((item) => item.id === id);
    if (!current) return;
    const wasLit = lilinSaya.has(id);
    const nextLit = !wasLit;
    const previousCount = current.lilinCount ?? (current.lilin ? 1 : 0);
    setLilinSaya((state) => { const next = new Set(state); if (nextLit) next.add(id); else next.delete(id); return next; });
    setMakam((state) => state.map((item) => item.id === id ? { ...item, lilin: nextLit || previousCount - (wasLit ? 1 : 0) > 0, lilinCount: Math.max(0, previousCount + (nextLit ? 1 : -1)) } : item));
    try {
      const updated = await toggleLilin(id);
      replaceMakam(updated);
      setLilinSaya((state) => { const next = new Set(state); if (nextLit) next.add(id); else next.delete(id); return next; });
      await refreshStats();
      setError(null);
    } catch (reason) {
      setLilinSaya((state) => { const next = new Set(state); if (wasLit) next.add(id); else next.delete(id); return next; });
      replaceMakam(current);
      setError(reason instanceof Error ? reason.message : "Lilin gagal diubah.");
    }
  }, [lilinSaya, makam, refreshStats, replaceMakam]);

  const runAction = useCallback(async (action: () => Promise<Makam>) => {
    try { const updated = await action(); replaceMakam(updated); await refreshStats(); setError(null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Ritual gagal dilakukan."); throw reason; }
  }, [refreshStats, replaceMakam]);

  return {
    makam, statistik, loading, error, bungaStatus, lilinSaya, refresh, refreshPersonalStatus,
    kuburkan: async (input) => { let result: Makam | undefined; await runAction(async () => { result = await createMakam(input); return result; }); if (!result) throw new Error("Makam gagal dibuat."); return result; },
    bunga, lilin, komentar: async (id, input) => runAction(() => tambahKomentar(id, input)),
  };
}
