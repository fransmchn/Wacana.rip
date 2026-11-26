"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckoutModal, type CheckoutConfirmPayload } from "@/components/CheckoutModal";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { persistVipUpgrade } from "@/lib/graveyardService";
import {
  getVipIds,
  isVipMakam,
  recordPaidUpgrade,
  VIP_PRICE,
  type CreateCheckoutParams,
  type VipUpgradeResult,
} from "@/lib/payment";
import { resolveTheme } from "@/lib/themeService";
import { getTemaNisan } from "@/lib/themes";
import type { Makam, NisanTema } from "@/types/graveyard";

interface UpgradeOptions {
  selectedTheme?: NisanTema;
  userId?: string;
  userEmail?: string;
  userName?: string;
  onPaid?: (result: VipUpgradeResult) => void | Promise<void>;
}

interface VipUpgradeContextValue {
  vipIds: string[];
  isVip: (makam: Makam) => boolean;
  requestUpgrade: (makam: Makam, options?: UpgradeOptions) => void;
}

interface CheckoutState { params: CreateCheckoutParams; onPaid?: UpgradeOptions["onPaid"]; }

const VipUpgradeContext = createContext<VipUpgradeContextValue | null>(null);

export function VipUpgradeProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [vipIds, setVipIds] = useState<string[]>([]);
  const [checkout, setCheckout] = useState<CheckoutState | null>(null);

  useEffect(() => { setVipIds(getVipIds()); }, []);

  const isVip = useCallback((makam: Makam) => {
    const withTheme = { ...makam, tema: resolveTheme(makam) };
    return isVipMakam(withTheme, vipIds);
  }, [vipIds]);

  const requestUpgrade = useCallback((makam: Makam, options: UpgradeOptions = {}) => {
    const fallbackName =
      typeof user?.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : user?.email?.split("@")[0];
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
    });
  }, [user]);

  const confirm = useCallback(async ({ selectedTheme, orderId, method, mode }: CheckoutConfirmPayload) => {
    if (!checkout) return;
    try {
      const finalParams: CreateCheckoutParams = {
        ...checkout.params,
        selectedTheme,
        method,
      };
      const result = recordPaidUpgrade(finalParams, orderId, method);
      await persistVipUpgrade(finalParams.graveId, selectedTheme);
      await checkout.onPaid?.(result);
      setVipIds(getVipIds());
      setCheckout(null);
      const label = getTemaNisan(selectedTheme).label;
      toast(
        mode === "demo"
          ? `Mode Demo aktif: ${label} terpasang & erosi dihentikan.`
          : `Pembayaran berhasil! Monumen ${label} kini abadi.`,
        "success",
      );
    } catch (reason) {
      toast(reason instanceof Error ? reason.message : "Aktivasi Makam Abadi gagal.", "danger");
      throw reason;
    }
  }, [checkout, toast]);

  const value = useMemo(() => ({ vipIds, isVip, requestUpgrade }), [vipIds, isVip, requestUpgrade]);

  return (
    <VipUpgradeContext.Provider value={value}>
      {children}
      {checkout && <CheckoutModal params={checkout.params} onClose={() => setCheckout(null)} onConfirm={confirm} />}
    </VipUpgradeContext.Provider>
  );
}

export function useVipUpgrade(): VipUpgradeContextValue {
  const context = useContext(VipUpgradeContext);
  if (!context) throw new Error("useVipUpgrade harus dipakai di dalam VipUpgradeProvider.");
  return context;
}
