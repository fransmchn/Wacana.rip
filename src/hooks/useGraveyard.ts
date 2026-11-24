"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BungaSudahDitaburError,
  createMakam,
  getStatistik,
  getStatusBungaHariIni,
  listMakam,
  taburBunga,
  tambahKomentar,
  type BungaHariIni,
} from "@/lib/graveyardService";
import type { CreateMakamInput, KomentarInput, Makam, Statistik } from "@/types/graveyard";

interface UseGraveyard {
  makam: Makam[];
  statistik: Statistik;
  loading: boolean;
  error: string | null;
  bungaStatus: Record<string, BungaHariIni>;
  refresh: () => Promise<void>;
  refreshPersonalStatus: (userId: string | undefined, ids: string[]) => Promise<void>;
  kuburkan: (input: CreateMakamInput) => Promise<Makam>;
  bunga: (id: string) => Promise<void>;
  komentar: (id: string, input: KomentarInput) => Promise<void>;
}

const emptyStats: Statistik = { totalMakam: 0, totalBunga: 0, totalRupiah: 0, totalJam: 0 };

export function useGraveyard(): UseGraveyard {
  const [makam, setMakam] = useState<Makam[]>([]);
  const [statistik, setStatistik] = useState<Statistik>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bungaStatus, setBungaStatus] = useState<Record<string, BungaHariIni>>({});

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
    if (!userId) { setBungaStatus({}); return; }
    try {
      setBungaStatus(await getStatusBungaHariIni(ids));
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
      const status = await getStatusBungaHariIni([id]);
      replaceMakam(updated);
      setBungaStatus((state) => ({ ...state, ...status }));
      await refreshStats();
      setError(null);
    } catch (reason) {
      if (reason instanceof BungaSudahDitaburError) {
        setBungaStatus((state) => ({ ...state, [id]: optimisticStatus }));
        replaceMakam(current);
        await refreshStats();
        return;
      }
      setBungaStatus((state) => previousStatus ? { ...state, [id]: previousStatus } : Object.fromEntries(Object.entries(state).filter(([key]) => key !== id)));
      replaceMakam(current);
      setError(reason instanceof Error ? reason.message : "Bunga gagal ditaburkan.");
    }
  }, [bungaStatus, makam, refreshStats, replaceMakam]);

  const runAction = useCallback(async (action: () => Promise<Makam>) => {
    try { const updated = await action(); replaceMakam(updated); await refreshStats(); setError(null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Ritual gagal dilakukan."); throw reason; }
  }, [refreshStats, replaceMakam]);

  return {
    makam, statistik, loading, error, bungaStatus, refresh, refreshPersonalStatus,
    kuburkan: async (input) => { let result: Makam | undefined; await runAction(async () => { result = await createMakam(input); return result; }); if (!result) throw new Error("Makam gagal dibuat."); return result; },
    bunga,
    komentar: async (id, input) => runAction(() => tambahKomentar(id, input)),
  };
}
