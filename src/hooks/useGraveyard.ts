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
import { syncVipStatusLocally } from "@/lib/payment";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isNisanTema } from "@/lib/themes";
import type { CreateMakamInput, KomentarInput, Makam, NisanTema, Statistik } from "@/types/graveyard";

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

interface RealtimeMakamPayload {
  id?: string;
  is_vip?: boolean | null;
  tema?: string | null;
  bunga_count?: number | null;
  judul?: string | null;
  penyebab?: string | null;
  epitaph?: string | null;
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
    if (!userId || !ids.length) { setBungaStatus({}); return; }
    try {
      setBungaStatus(await getStatusBungaHariIni(ids));
    } catch {
      // Status personal (tamu/sesi kedaluwarsa) tidak boleh mengganggu daftar makam publik.
      setBungaStatus({});
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  // Supabase Realtime: sinkronkan upgrade VIP dari webhook (misal QRIS via HP lain) tanpa refresh halaman.
  useEffect(() => {
    const client = createSupabaseBrowserClient();
    if (!client) return;

    const channel = client
      .channel("graveyard-makam-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "makam" },
        (payload) => {
          const nextRow = payload.new as RealtimeMakamPayload | null;
          const id = nextRow?.id;
          if (!id) return;

          const promotedVip = Boolean(nextRow.is_vip);
          const nextTema: NisanTema | undefined = isNisanTema(nextRow.tema) ? nextRow.tema : undefined;

          if (promotedVip) {
            syncVipStatusLocally(id, nextTema ?? "obsidian-emas");
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("graveyard:vip-synced", {
                  detail: { graveId: id, tema: nextTema ?? "obsidian-emas" },
                }),
              );
            }
          }

          setMakam((current) =>
            current.map((item) => {
              if (item.id !== id) return item;
              return {
                ...item,
                ...(promotedVip ? { vip: true } : {}),
                ...(nextTema ? { tema: nextTema } : {}),
                ...(typeof nextRow.bunga_count === "number" ? { bunga: nextRow.bunga_count } : {}),
                ...(typeof nextRow.judul === "string" && nextRow.judul.trim() ? { judul: nextRow.judul } : {}),
                ...(typeof nextRow.penyebab === "string" && nextRow.penyebab.trim() ? { penyebab: nextRow.penyebab } : {}),
                ...(typeof nextRow.epitaph === "string" && nextRow.epitaph.trim() ? { epitaph: nextRow.epitaph } : {}),
              };
            }),
          );
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, []);

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
