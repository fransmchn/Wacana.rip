"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { IconButton } from "./IconButton";

type ToastTone = "success" | "danger" | "info";
interface ToastItem { id: number; message: string; tone: ToastTone; }
interface ToastContextValue { toast: (message: string, tone?: ToastTone) => void; }
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const toast = useCallback((message: string, tone: ToastTone = "info") => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 4000);
  }, []);
  const value = useMemo(() => ({ toast }), [toast]);
  return <ToastContext.Provider value={value}>{children}<div className="ui-toast-region" aria-live="polite">{items.map((item) => <ToastItemView key={item.id} item={item} onClose={() => setItems((current) => current.filter((toastItem) => toastItem.id !== item.id))} />)}</div></ToastContext.Provider>;
}

function ToastItemView({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const Icon = item.tone === "success" ? CheckCircle2 : item.tone === "danger" ? TriangleAlert : Info;
  return <div className={`ui-toast ui-toast-${item.tone}`} role="status"><Icon size={17} aria-hidden="true" /><span>{item.message}</span><IconButton label="Tutup notifikasi" size="sm" onClick={onClose}><X size={15} /></IconButton></div>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast harus dipakai di dalam ToastProvider.");
  return context;
}
