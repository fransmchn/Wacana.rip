import { seedData } from "@/lib/seedData";
import { createId } from "@/lib/utils";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { KATEGORI, type CreateMakamInput, type KomentarInput, type Kategori, type Komentar, type Makam, type Statistik } from "@/types/graveyard";

export interface BungaHariIni { sudahMenabur: boolean; serverNow: string; berlakuHingga?: string; }
export class BungaSudahDitaburError extends Error {
  constructor() {
    super("Kamu sudah menabur bunga di makam ini hari ini.");
    this.name = "BungaSudahDitaburError";
  }
}
export interface LilinSaya { ids: string[]; }

const STORAGE_KEY = "wacana-rip:v1";
type SupabaseClient = ReturnType<typeof createSupabaseBrowserClient>;
type MakamRow = Database["public"]["Tables"]["makam"]["Row"];
type KomentarRow = Database["public"]["Tables"]["komentar"]["Row"];

function supabase(): SupabaseClient {
  return createSupabaseBrowserClient();
}

function assertStorageMode(): void {
  if (!isSupabaseConfigured() && process.env.NODE_ENV === "production") {
    throw new Error("Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
}

function localFallback<T>(action: () => T): T {
  assertStorageMode();
  return action();
}

function localStorageAvailable(): boolean {
  return typeof window !== "undefined";
}

function cloneSeed(): Makam[] {
  return seedData.map((makam) => ({ ...makam, komentar: makam.komentar.map((komentar) => ({ ...komentar })) }));
}

function readLocal(): Makam[] {
  if (!localStorageAvailable()) return cloneSeed();
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const initial = cloneSeed();
      writeLocal(initial);
      return initial;
    }
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new Error("Storage data bukan array");
    return parsed as Makam[];
  } catch {
    const fallback = cloneSeed();
    try { writeLocal(fallback); } catch { /* localStorage unavailable; keep memory fallback. */ }
    return fallback;
  }
}

function writeLocal(makam: Makam[]): void {
  if (localStorageAvailable()) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(makam));
}

function updateLocal(id: string, update: (makam: Makam) => Makam): Makam {
  const makam = readLocal();
  const index = makam.findIndex((item) => item.id === id);
  if (index === -1) throw new Error("Makam tidak ditemukan.");
  makam[index] = update(makam[index]);
  writeLocal(makam);
  return makam[index];
}

function cleanText(value: string | undefined, maxLength: number, fallback = ""): string {
  return (value ?? fallback).trim().slice(0, maxLength);
}

function assertDate(value: string, label: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(new Date(`${value}T00:00:00`).getTime())) throw new Error(`${label} tidak valid.`);
}

function assertInput(input: CreateMakamInput): CreateMakamInput {
  const clean = {
    ...input,
    judul: cleanText(input.judul, 120),
    pembuat: cleanText(input.pembuat, 30, "Anonim") || "Anonim",
    tanggalMulai: cleanText(input.tanggalMulai, 10),
    tanggalMenyerah: cleanText(input.tanggalMenyerah, 10),
    penyebab: cleanText(input.penyebab, 160),
    epitaph: cleanText(input.epitaph, 140),
    kronologi: cleanText(input.kronologi, 1000),
    kerugianTeks: cleanText(input.kerugianTeks, 280),
  };
  if (!clean.judul) throw new Error("Nama wacana wajib diisi.");
  const categories = new Set<Kategori>([...KATEGORI]);
  if (!categories.has(clean.kategori)) throw new Error("Kategori tidak valid.");
  assertDate(clean.tanggalMulai, "Tanggal mulai");
  assertDate(clean.tanggalMenyerah, "Tanggal menyerah");
  if (clean.tanggalMenyerah < clean.tanggalMulai) throw new Error("Tanggal gugur tidak boleh sebelum tanggal lahir.");
  if (clean.tanggalMenyerah > new Date().toISOString().slice(0, 10)) throw new Error("Tanggal gugur belum terjadi.");
  if (!clean.penyebab) throw new Error("Penyebab kematian wajib diisi.");
  if (!clean.epitaph) throw new Error("Kata terakhir wajib diisi.");
  return clean;
}

function mapComment(row: KomentarRow): Komentar {
  return { id: row.id, nama: row.nama_tampil, isi: row.isi, createdAt: row.created_at };
}

function mapMakam(row: MakamRow, komentar: Komentar[] = []): Makam {
  return {
    id: row.id,
    judul: row.judul,
    kategori: row.kategori,
    pembuat: row.tampil_anonim ? "Anonim" : "Anonim",
    tanggalMulai: row.tanggal_mulai,
    tanggalMenyerah: row.tanggal_menyerah,
    penyebab: row.penyebab,
    epitaph: row.epitaph,
    kronologi: row.kronologi ?? "",
    kerugianTeks: row.kerugian_teks ?? "",
    ...(row.kerugian_rupiah === null ? {} : { kerugianRupiah: row.kerugian_rupiah }),
    ...(row.kerugian_jam === null ? {} : { kerugianJam: Number(row.kerugian_jam) }),
    bunga: row.bunga_count,
    lilin: row.lilin_count > 0,
    lilinCount: row.lilin_count,
    komentar,
    createdAt: row.created_at,
  };
}

function throwSupabase(error: { message: string } | null): void {
  if (error) throw new Error(`Supabase: ${error.message}`);
}

async function getRemoteComments(client: NonNullable<SupabaseClient>, makamId: string): Promise<Komentar[]> {
  const result = await client.from("komentar").select("*").eq("makam_id", makamId).order("created_at", { ascending: false });
  throwSupabase(result.error);
  return (result.data ?? []).map(mapComment);
}

async function requireUser(client: NonNullable<SupabaseClient>): Promise<string> {
  const { data, error } = await client.auth.getUser();
  throwSupabase(error);
  if (!data.user) throw new Error("Masuk dulu agar bisa melakukan ritual ini.");
  return data.user.id;
}

export async function listMakam(): Promise<Makam[]> {
  const client = supabase();
  if (!client) return localFallback(readLocal);
  const result = await client.from("makam").select("*").order("tanggal_menyerah", { ascending: false });
  throwSupabase(result.error);
  return Promise.all((result.data ?? []).map(async (row) => mapMakam(row, await getRemoteComments(client, row.id))));
}

export async function getMakam(id: string): Promise<Makam | null> {
  const client = supabase();
  if (!client) return localFallback(() => readLocal().find((makam) => makam.id === id) ?? null);
  const result = await client.from("makam").select("*").eq("id", id).maybeSingle();
  throwSupabase(result.error);
  return result.data ? mapMakam(result.data, await getRemoteComments(client, id)) : null;
}

export async function createMakam(rawInput: CreateMakamInput): Promise<Makam> {
  const input = assertInput(rawInput);
  const client = supabase();
  if (!client) return localFallback(() => {
    const makam: Makam = { id: createId(), judul: input.judul, kategori: input.kategori, pembuat: input.pembuat ?? "Anonim", tanggalMulai: input.tanggalMulai, tanggalMenyerah: input.tanggalMenyerah, penyebab: input.penyebab, epitaph: input.epitaph, kronologi: input.kronologi ?? "", kerugianTeks: input.kerugianTeks ?? "", ...(input.kerugianRupiah === undefined ? {} : { kerugianRupiah: input.kerugianRupiah }), ...(input.kerugianJam === undefined ? {} : { kerugianJam: input.kerugianJam }), bunga: 0, lilin: false, komentar: [], createdAt: new Date().toISOString() };
    const makamList = readLocal();
    makamList.unshift(makam);
    writeLocal(makamList);
    return makam;
  });
  const userId = await requireUser(client);
  const result = await client.from("makam").insert({
    user_id: userId,
    judul: input.judul,
    kategori: input.kategori,
    tanggal_mulai: input.tanggalMulai,
    tanggal_menyerah: input.tanggalMenyerah,
    penyebab: input.penyebab,
    epitaph: input.epitaph,
    kronologi: input.kronologi || null,
    kerugian_teks: input.kerugianTeks || null,
    kerugian_rupiah: input.kerugianRupiah ?? null,
    kerugian_jam: input.kerugianJam ?? null,
  }).select("*").single();
  throwSupabase(result.error);
  if (!result.data) throw new Error("Supabase tidak mengembalikan makam baru.");
  return mapMakam(result.data);
}

export async function taburBunga(id: string): Promise<Makam> {
  const client = supabase();
  if (!client) return localFallback(() => updateLocal(id, (makam) => ({ ...makam, bunga: makam.bunga + 1 })));
  const result = await client.rpc("tabur_bunga", { target_makam_id: id });
  throwSupabase(result.error);
  if (!result.data.ok && result.data.code === "ALREADY_TODAY") throw new BungaSudahDitaburError();
  if (!result.data.ok) throw new Error("Bunga belum bisa ditaburkan.");
  const makam = await getMakam(id);
  if (!makam) throw new Error("Makam tidak ditemukan.");
  return makam;
}

export async function toggleLilin(id: string): Promise<Makam> {
  const client = supabase();
  if (!client) return localFallback(() => updateLocal(id, (makam) => ({ ...makam, lilin: !makam.lilin })));
  const result = await client.rpc("toggle_lilin", { target_makam_id: id });
  throwSupabase(result.error);
  if (!result.data.ok) throw new Error("Lilin belum bisa dinyalakan.");
  const makam = await getMakam(id);
  if (!makam) throw new Error("Makam tidak ditemukan.");
  return makam;
}

export async function tambahKomentar(id: string, input: KomentarInput): Promise<Makam> {
  const isi = cleanText(input.isi, 280);
  const nama = cleanText(input.nama, 30, "Anonim") || "Anonim";
  if (!isi) throw new Error("Doa atau curhat belum ditulis.");
  const client = supabase();
  if (!client) return localFallback(() => updateLocal(id, (makam) => ({ ...makam, komentar: [{ id: createId(), nama, isi, createdAt: new Date().toISOString() }, ...makam.komentar] })));
  const userId = await requireUser(client);
  const result = await client.from("komentar").insert({ makam_id: id, user_id: userId, nama_tampil: nama, isi }).select("*").single();
  throwSupabase(result.error);
  const makam = await getMakam(id);
  if (!makam) throw new Error("Makam tidak ditemukan.");
  return makam;
}

export async function getStatistik(): Promise<Statistik> {
  const client = supabase();
  if (!client) return localFallback(() => {
    const makam = readLocal();
    return { totalMakam: makam.length, totalBunga: makam.reduce((total, item) => total + item.bunga, 0), totalRupiah: makam.reduce((total, item) => total + (item.kerugianRupiah ?? 0), 0), totalJam: makam.reduce((total, item) => total + (item.kerugianJam ?? 0), 0) };
  });
  const result = await client.from("statistik").select("*").single();
  throwSupabase(result.error);
  return { totalMakam: result.data?.total_makam ?? 0, totalBunga: Number(result.data?.total_bunga ?? 0), totalRupiah: Number(result.data?.total_rupiah ?? 0), totalJam: Number(result.data?.total_jam ?? 0) };
}

function getWibDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(date);
}

export function getNextWibMidnight(date: Date): Date {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" });
  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((result, part) => { result[part.type] = part.value; return result; }, {});
  const next = new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00+07:00`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

export async function getStatusBungaHariIni(ids: string[]): Promise<Record<string, BungaHariIni>> {
  const client = supabase();
  if (!client) return localFallback(() => { const serverNow = new Date().toISOString(); const berlakuHingga = getNextWibMidnight(new Date(serverNow)).toISOString(); return Object.fromEntries(ids.map((id) => [id, { sudahMenabur: false, serverNow, berlakuHingga }])); });
  if (!ids.length) return {};
  const userId = await requireUser(client);
  const serverNow = new Date().toISOString();
  const result = await client.from("bunga").select("makam_id, hari, created_at").eq("user_id", userId).in("makam_id", ids);
  throwSupabase(result.error);
  type BungaStatusRow = { makam_id: string; hari: string; created_at: string };
  const rows = (result.data ?? []) as BungaStatusRow[];
  const rowsByMakam = new Map(rows.filter((row) => getWibDate(new Date(row.created_at)) === row.hari).map((row) => [row.makam_id, row]));
  return Object.fromEntries(ids.map((id) => {
    const row = rowsByMakam.get(id);
    const statusServerNow = row?.created_at ?? serverNow;
    return [id, { sudahMenabur: Boolean(row), serverNow: statusServerNow, berlakuHingga: getNextWibMidnight(new Date(statusServerNow)).toISOString() }];
  }));
}

export async function getLilinSaya(ids: string[]): Promise<LilinSaya> {
  const client = supabase();
  if (!client) return localFallback(() => ({ ids: readLocal().filter((makam) => ids.includes(makam.id) && makam.lilin).map((makam) => makam.id) }));
  if (!ids.length) return { ids: [] };
  const userId = await requireUser(client);
  const result = await client.from("lilin").select("makam_id").eq("user_id", userId).in("makam_id", ids);
  throwSupabase(result.error);
  return { ids: (result.data ?? []).map((row) => row.makam_id) };
}

export async function hapusMakam(id: string): Promise<void> {
  const client = supabase();
  if (!client) { localFallback(() => writeLocal(readLocal().filter((makam) => makam.id !== id))); return; }
  const result = await client.from("makam").delete().eq("id", id);
  throwSupabase(result.error);
}

export async function hapusKomentar(id: string): Promise<void> {
  const client = supabase();
  if (!client) { localFallback(() => writeLocal(readLocal().map((makam) => ({ ...makam, komentar: makam.komentar.filter((komentar) => komentar.id !== id) })))); return; }
  const result = await client.from("komentar").delete().eq("id", id);
  throwSupabase(result.error);
}

export async function laporkan(targetType: "makam" | "komentar", targetId: string, alasan = ""): Promise<void> {
  const client = supabase();
  if (!client) throw new Error("Pelaporan tersedia setelah Supabase dikonfigurasi.");
  const userId = await requireUser(client);
  const result = await client.from("laporan").insert({ target_type: targetType, target_id: targetId, user_id: userId, alasan: cleanText(alasan, 200) || null });
  throwSupabase(result.error);
}
