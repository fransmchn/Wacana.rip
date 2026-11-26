"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CheckoutModal, type CheckoutConfirmPayload } from "@/components/CheckoutModal";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { persistVipUpgrade } from "@/lib/graveyardService";
import {
  getVipIds,
  isVipMakam,
  recordPaidUpgrade,
  syncVipStatusLocally,
  VIP_PRICE,
  type CreateCheckoutParams,
  type VipUpgradeResult,
} from "@/lib/payment";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { resolveTheme } from "@/lib/themeService";
import { isNisanTema } from "@/lib/themes";
import type { Makam, NisanTema } from "@/types/graveyard";

interface UpgradeOptions {
  selectedTheme?: NisanTema;
  userId?: string;
  userEmail?: string;
  userName?: string;
  onPaid?: (result: VipUpgradeResult) => void | Promise<void>;
  onCancel?: () => void;
}

interface VipUpgradeContextValue {
  vipIds: string[];
  isVip: (makam: Makam) => boolean;
  requestUpgrade: (makam: Makam, options?: UpgradeOptions) => void;
}

interface CheckoutState {
  params: CreateCheckoutParams;
  onPaid?: UpgradeOptions["onPaid"];
  onCancel?: UpgradeOptions["onCancel"];
}

const VipUpgradeContext = createContext<VipUpgradeContextValue | null>(null);

export function VipUpgradeProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [vipIds, setVipIds] = useState<string[]>([]);
  const [checkout, setCheckout] = useState<CheckoutState | null>(null);
  // Deduplikasi agar toast & onPaid hanya jalan sekali jika onSuccess + webhook Realtime datang bersamaan.
  const finalizedRef = useRef<Set<string>>(new Set());

  useEffect(() => { setVipIds(getVipIds()); }, []);

  // Dengarkan event sinkronisasi global dari useGraveyard agar vipIds provider selalu mutakhir.
  useEffect(() => {
    const onVipSynced = (event: Event) => {
      const detail = (event as CustomEvent<{ graveId?: string; tema?: NisanTema }>).detail;
      if (!detail?.graveId) return;
      setVipIds(syncVipStatusLocally(detail.graveId, detail.tema));
    };
    window.addEventListener("graveyard:vip-synced", onVipSynced);
    return () => window.removeEventListener("graveyard:vip-synced", onVipSynced);
  }, []);

  // Supabase Realtime khusus untuk makam yang sedang di-checkout (QRIS dari HP terpisah -> tutup modal & toast otomatis).
  useEffect(() => {
    const activeCheckout = checkout;
    if (!activeCheckout) return;
    const graveId = activeCheckout.params.graveId;
    if (!graveId || graveId.startsWith("draft-")) return;

    const client = createSupabaseBrowserClient();
    if (!client) return;

    const channel = client
      .channel(`graveyard-checkout-${graveId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "makam", filter: `id=eq.${graveId}` },
        (payload) => {
          const nextRow = payload.new as { id?: string; is_vip?: boolean | null; tema?: string | null } | null;
          if (!nextRow?.is_vip) return;
          if (finalizedRef.current.has(graveId)) return;
          finalizedRef.current.add(graveId);

          const chosenTheme: NisanTema = isNisanTema(nextRow.tema)
            ? nextRow.tema
            : activeCheckout.params.selectedTheme;

          if (typeof window !== "undefined") {
            try { window.snap?.hide?.(); } catch { /* abaikan jika jendela sudah tertutup */ }
          }

          const finalParams: CreateCheckoutParams = {
            ...activeCheckout.params,
            selectedTheme: chosenTheme,
            method: "qris",
          };
          const result = recordPaidUpgrade(finalParams, `WEBHOOK-${Date.now()}`, "qris");
          setVipIds(getVipIds());
          setCheckout(null);
          void Promise.resolve(activeCheckout.onPaid?.(result)).catch(() => undefined);
          toast("Pembayaran berhasil! Monumenmu kini abadi di Bukit Kehormatan.", "success");
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [checkout, toast]);

  const isVip = useCallback((makam: Makam) => {
    const withTheme = { ...makam, tema: resolveTheme(makam) };
    return isVipMakam(withTheme, vipIds);
  }, [vipIds]);

  const requestUpgrade = useCallback((makam: Makam, options: UpgradeOptions = {}) => {
    finalizedRef.current.delete(makam.id);
    const meta = user?.user_metadata as Record<string, unknown> | undefined;
    const fallbackName =
      (typeof meta?.full_name === "string" ? meta.full_name.trim() : "") ||
      (typeof meta?.name === "string" ? meta.name.trim() : "") ||
      user?.email?.split("@")[0];
    setCheckout({
      params: {
        graveId: makam.id,
        graveTitle: makam.judul,
        selectedTheme: options.selectedTheme ?? resolveTheme(makam),
        amount: VIP_PRICE,
        userId: options.userId ?? user?.id,
        userEmail: options.userEmail ?? user?.email,
        userName: options.userName ?? fallbackName,
      },
      onPaid: options.onPaid,
      onCancel: options.onCancel,
    });
  }, [user]);

  const handleClose = useCallback(() => {
    const cancelCb = checkout?.onCancel;
    setCheckout(null);
    cancelCb?.();
  }, [checkout]);

  const confirm = useCallback(async ({ selectedTheme, orderId, method }: CheckoutConfirmPayload) => {
    if (!checkout) return;
    const graveId = checkout.params.graveId;
    if (finalizedRef.current.has(graveId)) {
      setCheckout(null);
      return;
    }
    try {
      finalizedRef.current.add(graveId);
      const finalParams: CreateCheckoutParams = {
        ...checkout.params,
        selectedTheme,
        method,
      };
      const result = recordPaidUpgrade(finalParams, orderId, method);
      await persistVipUpgrade(graveId, selectedTheme);
      setVipIds(getVipIds());
      await checkout.onPaid?.(result);
      setCheckout(null);
      toast("Pembayaran berhasil! Monumenmu kini abadi di Bukit Kehormatan.", "success");
    } catch (reason) {
      finalizedRef.current.delete(graveId);
      toast(reason instanceof Error ? reason.message : "Aktivasi Makam Abadi gagal.", "danger");
      throw reason;
    }
  }, [checkout, toast]);

  const value = useMemo(() => ({ vipIds, isVip, requestUpgrade }), [vipIds, isVip, requestUpgrade]);

  return (
    <VipUpgradeContext.Provider value={value}>
      {children}
      {checkout && <CheckoutModal params={checkout.params} onClose={handleClose} onConfirm={confirm} />}
    </VipUpgradeContext.Provider>
  );
}

export function useVipUpgrade(): VipUpgradeContextValue {
  const context = useContext(VipUpgradeContext);
  if (!context) throw new Error("useVipUpgrade harus dipakai di dalam VipUpgradeProvider.");
  return context;
}
