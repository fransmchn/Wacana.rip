"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { IconButton } from "./IconButton";

type ToastTone = "success" | "danger" | "info";
interface ToastItem { id: number; message: string; tone: ToastTone; }
interface ToastContextValue { toast: (message: string, tone?: ToastTone) => void; }
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, number>());
  const dismiss = useCallback((id: number) => { const timer = timers.current.get(id); if (timer) window.clearTimeout(timer); timers.current.delete(id); setItems((current) => current.filter((item) => item.id !== id)); }, []);
  const toast = useCallback((message: string, tone: ToastTone = "info") => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current, { id, message, tone }].slice(-3));
    timers.current.set(id, window.setTimeout(() => dismiss(id), tone === "danger" ? 6000 : 4000));
  }, [dismiss]);
  const value = useMemo(() => ({ toast }), [toast]);
  return <ToastContext.Provider value={value}><>{children}</><div className="ui-toast-region" aria-live="polite">{items.map((item) => <ToastItemView key={item.id} item={item} onClose={() => dismiss(item.id)} onPause={() => { const timer = timers.current.get(item.id); if (timer) window.clearTimeout(timer); }} onResume={() => { timers.current.set(item.id, window.setTimeout(() => dismiss(item.id), item.tone === "danger" ? 6000 : 4000)); }} />)}</div></ToastContext.Provider>;
}

function ToastItemView({ item, onClose, onPause, onResume }: { item: ToastItem; onClose: () => void; onPause: () => void; onResume: () => void }) {
  const Icon = item.tone === "success" ? CheckCircle2 : item.tone === "danger" ? TriangleAlert : Info;
  return <div className={`ui-toast ui-toast-${item.tone}`} role={item.tone === "danger" ? "alert" : "status"} onMouseEnter={onPause} onMouseLeave={onResume} onFocus={onPause} onBlur={onResume}><Icon size={17} aria-hidden="true" /><span>{item.message}</span><IconButton label="Tutup notifikasi" size="sm" onClick={onClose}><X size={15} /></IconButton></div>;
}

export function useToast() { const context = useContext(ToastContext); if (!context) throw new Error("useToast harus dipakai di dalam ToastProvider."); return context; }
