"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckoutModal } from "@/components/CheckoutModal";
import { useToast } from "@/components/ui/Toast";
import { getVipIds, isVipMakam, upgradeToVip, type PaymentMethod } from "@/lib/vipService";
import type { Makam } from "@/types/graveyard";

interface VipUpgradeContextValue {
  vipIds: string[];
  isVip: (makam: Makam) => boolean;
  requestUpgrade: (makam: Makam) => void;
}

const VipUpgradeContext = createContext<VipUpgradeContextValue | null>(null);

export function VipUpgradeProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [vipIds, setVipIds] = useState<string[]>([]);
  const [checkout, setCheckout] = useState<Makam | null>(null);

  useEffect(() => { setVipIds(getVipIds()); }, []);

  const isVip = useCallback((makam: Makam) => isVipMakam(makam, vipIds), [vipIds]);
  const requestUpgrade = useCallback((makam: Makam) => setCheckout(makam), []);

  const confirm = useCallback(async (method: PaymentMethod) => {
    if (!checkout) return;
    try {
      const result = await upgradeToVip(checkout.id, method);
      setVipIds(result.ids);
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
      {checkout && <CheckoutModal grave={checkout} onClose={() => setCheckout(null)} onConfirm={confirm} />}
    </VipUpgradeContext.Provider>
  );
}

export function useVipUpgrade(): VipUpgradeContextValue {
  const context = useContext(VipUpgradeContext);
  if (!context) throw new Error("useVipUpgrade harus dipakai di dalam VipUpgradeProvider.");
  return context;
}
