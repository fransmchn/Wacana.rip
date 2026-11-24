"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckoutModal } from "@/components/CheckoutModal";
import { useToast } from "@/components/ui/Toast";
import { getVipIds, isVipMakam, upgradeToVip, VIP_PRICE, type CreateCheckoutParams, type PaymentMethod, type VipUpgradeResult } from "@/lib/payment";
import { resolveTheme } from "@/lib/themeService";
import type { Makam, NisanTema } from "@/types/graveyard";

interface UpgradeOptions {
  selectedTheme?: NisanTema;
  userId?: string;
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
  const [vipIds, setVipIds] = useState<string[]>([]);
  const [checkout, setCheckout] = useState<CheckoutState | null>(null);

  useEffect(() => { setVipIds(getVipIds()); }, []);

  const isVip = useCallback((makam: Makam) => {
    const withTheme = { ...makam, tema: resolveTheme(makam) };
    return isVipMakam(withTheme, vipIds);
  }, [vipIds]);

  const requestUpgrade = useCallback((makam: Makam, options: UpgradeOptions = {}) => {
    setCheckout({
      params: {
        graveId: makam.id,
        graveTitle: makam.judul,
        selectedTheme: options.selectedTheme ?? resolveTheme(makam),
        amount: VIP_PRICE,
        userId: options.userId,
      },
      onPaid: options.onPaid,
    });
  }, []);

  const confirm = useCallback(async (method: PaymentMethod) => {
    if (!checkout) return;
    try {
      const result = await upgradeToVip({ ...checkout.params, method }, method);
      await checkout.onPaid?.(result);
      setVipIds(getVipIds());
      setCheckout(null);
      toast("Makam Abadi aktif. Erosi dihentikan.", "success");
    } catch (reason) {
      toast(reason instanceof Error ? reason.message : "Pembayaran simulasi gagal.", "danger");
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
