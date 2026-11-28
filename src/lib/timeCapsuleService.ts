import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatTanggal } from "@/lib/utils";
import type { Makam } from "@/types/graveyard";

export const CAPSULE_STORAGE_KEY = "graveyard_capsules_v1";

export interface TimeCapsule {
  message: string;
  unlockAt: string; // YYYY-MM-DD
  sealedAt?: string;
}

export interface CapsuleStatus {
  locked: boolean;
  daysLeft: number;
  unlockLabel: string;
}

type CapsuleMap = Record<string, TimeCapsule>;

function readCapsules(): CapsuleMap {
  if (typeof window === "undefined") return {};
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(CAPSULE_STORAGE_KEY) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as CapsuleMap;
  } catch {
    return {};
  }
}

function writeCapsules(map: CapsuleMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CAPSULE_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* Storage penuh atau diblokir. */
  }
}

export function getTimeCapsule(makam: Pick<Makam, "id" | "capsuleMessage" | "capsuleUnlockAt">): TimeCapsule | null {
  const local = readCapsules()[makam.id];
  if (local?.message && local?.unlockAt) return local;
  if (makam.capsuleMessage?.trim() && makam.capsuleUnlockAt?.trim()) {
    return { message: makam.capsuleMessage.trim(), unlockAt: makam.capsuleUnlockAt.trim() };
  }
  return null;
}

export function getCapsuleStatus(capsule: TimeCapsule, now: Date = new Date()): CapsuleStatus {
  const unlockDate = new Date(`${capsule.unlockAt}T00:00:00`);
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = unlockDate.getTime() - todayMidnight.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffMs / 86_400_000));
  return {
    locked: daysLeft > 0,
    daysLeft,
    unlockLabel: formatTanggal(capsule.unlockAt),
  };
}

export function addMonthsIso(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

/** Simpan Kapsul Waktu VIP ke localStorage dan sinkronkan ke Supabase secara graceful. */
export async function saveTimeCapsule(graveId: string, rawMessage: string, unlockAt: string): Promise<TimeCapsule> {
  const message = rawMessage.trim().slice(0, 500);
  if (!message) throw new Error("Tulis pesan kebangkitan terlebih dahulu.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(unlockAt)) throw new Error("Tanggal buka segel tidak valid.");

  const capsule: TimeCapsule = {
    message,
    unlockAt,
    sealedAt: new Date().toISOString(),
  };

  writeCapsules({ ...readCapsules(), [graveId]: capsule });

  const client = createSupabaseBrowserClient();
  if (client && !graveId.startsWith("seed-")) {
    try {
      const result = await client
        .from("makam")
        .update({ capsule_message: message, capsule_unlock_at: unlockAt })
        .eq("id", graveId);
      if (result.error) {
        const msg = result.error.message.toLowerCase();
        if (!msg.includes("column") && !msg.includes("schema cache")) {
          console.warn("[graveyard-capsule] Sinkronisasi Supabase dilewati:", result.error.message);
        }
      }
    } catch {
      /* Tetap aman memakai localStorage jika offline atau schema lama. */
    }
  }

  return capsule;
}
